import { useEffect, useState, useRef, useMemo } from "react";
import {
  Box,
  Card,
  Flex,
  Text,
  Button,
  Label,
  Select,
  Textarea,
  Input,
} from "theme-ui";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  LuBookOpen,
  LuMic,
  LuCircleStop,
  LuRefreshCw,
  LuCheck,
  LuX,
} from "react-icons/lu";
import { keyframes } from "@emotion/react";
import { surahs } from "../utils/surah";
import { UPLOAD_URL } from "../lib/apolloClient";
import { Layout } from "../components/Layout";
import {
  HifdhsDocument,
  HifdhType,
  useHifdhsQuery,
  useUpdatehifdhMutation,
} from "../graphql";
// Import your actual Update Recitation Mutation and Document here:

interface HifdhForm {
  studentID: string;
  studentfirstName: string;
  studentlastName: string;
  teacherID: string;
  teacherfirstName: string;
  teacherlastName: string;
  surah: string;
  fromAyah: string;
  toAyah: string;
  surahId: number;
  evaluation: string;
  notes: string;
  type: HifdhType;
  audio: string;
}

export function EditHifdhPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language.startsWith("ar");

  const EVALUATION_OPTIONS = [
    { value: "excellent", label: "recitation.evaluation.excellent", stars: 3 },
    { value: "very_good", label: "recitation.evaluation.veryGood", stars: 2 },
    { value: "good", label: "recitation.evaluation.good", stars: 1 },
    {
      value: "acceptable",
      label: "recitation.evaluation.acceptable",
      stars: 0,
    },
    { value: "weak", label: "recitation.evaluation.weak", stars: 0 },
  ];

  const [submitMessage, setSubmitMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Form State
  const [formData, setFormData] = useState<HifdhForm>({
    studentID: "",
    studentfirstName: "",
    studentlastName: "",
    teacherID: "",
    teacherfirstName: "",
    teacherlastName: "",
    surah: "",
    fromAyah: "",
    toAyah: "",
    surahId: 0,
    evaluation: "",
    notes: "",
    type: HifdhType.Repeating,
    audio: "",
  });

  // Recording State variables
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [recordedURL, setRecordedURL] = useState("");
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const mediaStream = useRef<MediaStream | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  // Query to fetch existing Recitation
  const {
    data: recitationDetails,
    loading,
    error,
  } = useHifdhsQuery({
    variables: { where: { id: id } },
    skip: !id,
  });

  // Update Mutation using UpdateRecitationInput scheme
  const [updateHifdh] = useUpdatehifdhMutation({
    refetchQueries: [
      {
        query: HifdhsDocument,
        variables: { first: 10, after: null, where: undefined },
      },
    ],
  });

  const hifdh = recitationDetails?.hifdhs?.edges?.[0]?.node;

  // Track initial server values to dynamically evaluate if changes exist
  const initialValues = useMemo(() => {
    if (!hifdh) return null;

    const foundSurah = surahs.find((s) => s.name_ar === hifdh.surah);

    return {
      studentID: hifdh.student?.id || "",
      studentfirstName: hifdh.student?.firstName || "",
      studentlastName: hifdh.student?.lastName || "",
      teacherID: hifdh.teacher?.id || "",
      teacherfirstName: hifdh.teacher?.firstName || "",
      teacherlastName: hifdh.teacher?.lastName || "",
      surahId: foundSurah ? foundSurah.number : 0,
      surah: hifdh.surah || "",
      fromAyah: hifdh.fromAyah != null ? String(hifdh.fromAyah) : "",
      toAyah: hifdh.toAyah != null ? String(hifdh.toAyah) : "",
      evaluation: hifdh.evaluation?.toString() || "",
      notes: hifdh.note || "",
      type: hifdh.type || "NEW_RECITATION",
      audio: hifdh.audio || "",
    };
  }, [hifdh]);

  // Sync initial server values into component state
  useEffect(() => {
    if (initialValues) {
      setFormData((prev) => ({
        ...prev,
        ...initialValues,
      }));
      if (initialValues.audio) {
        setRecordedURL(`${UPLOAD_URL}${initialValues.audio}`);
      }
    }
  }, [initialValues]);

  // Detect whether changes have occurred
  const hasChanges = useMemo(() => {
    if (!initialValues) return false;

    // Changes occurred if a fresh blob is recorded, or text parameters differ
    const hasNewAudio = recordedBlob !== null;

    return (
      formData.surahId !== initialValues.surahId ||
      formData.fromAyah !== initialValues.fromAyah ||
      formData.toAyah !== initialValues.toAyah ||
      formData.evaluation !== initialValues.evaluation ||
      formData.notes !== initialValues.notes ||
      hasNewAudio
    );
  }, [formData, initialValues, recordedBlob]);

  // Discard local changes back to DB baseline
  const handleDiscard = () => {
    if (initialValues) {
      setFormData((prev) => ({
        ...prev,
        ...initialValues,
      }));
      setRecordedBlob(null);
      setRecordedURL(
        initialValues.audio ? `${UPLOAD_URL}${initialValues.audio}` : ""
      );
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isUpdating || !id) return;

    setSubmitMessage(null);

    if (!formData.surah) {
      setSubmitMessage({ type: "error", text: t("recitation.surahRequired") });
      return;
    }
    if (!formData.fromAyah || !formData.toAyah) {
      setSubmitMessage({ type: "error", text: t("recitation.ayahRequired") });
      return;
    }

    setIsUpdating(true);

    const audioFile = recordedBlob
      ? new File([recordedBlob], `recitation-update-${Date.now()}.webm`, {
          type: recordedBlob.type,
        })
      : undefined;

    try {
      await updateHifdh({
        variables: {
          id: id,
          file: audioFile,
          input: {
            surah: formData.surah,
            fromAyah: parseInt(formData.fromAyah),
            toAyah: parseInt(formData.toAyah),
            evaluation: formData.evaluation || undefined,
            note: formData.notes || undefined,
            type: formData.type,
          },
        },
      });

      setSubmitMessage({
        type: "success",
        text: t("recitation.submitSuccess"),
      });

      setRecordedBlob(null);
      navigate(-1);
    } catch (err) {
      console.error("Error updating recitation:", err);
      setSubmitMessage({ type: "error", text: t("recitation.submitError") });
    } finally {
      setIsUpdating(false);
    }
  };

  // Recorder controllers
  const startRecording = async () => {
    setRecordedBlob(null);
    setRecordedURL("");
    setSeconds(0);
    setIsRecording(true);

    try {
      chunks.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStream.current = stream;
      mediaRecorder.current = new MediaRecorder(stream);

      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.current.push(e.data);
      };

      timerRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);

      mediaRecorder.current.onstop = () => {
        if (timerRef.current) clearInterval(timerRef.current);

        const blob = new Blob(chunks.current, {
          type: mediaRecorder.current?.mimeType || "audio/webm",
        });
        setRecordedBlob(blob);

        const url = URL.createObjectURL(blob);
        setRecordedURL(url);
        chunks.current = [];
      };

      mediaRecorder.current.start();
    } catch (err) {
      console.error("Error starting media stream:", err);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    setIsRecording(false);

    mediaRecorder.current?.stop();

    mediaStream.current?.getTracks().forEach((track) => track.stop());
  };

  const formatTimer = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(seconds).padStart(2, "0")}`;
  };

  const toArabicNumber = (num: any): string => {
    const arabicDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
    return String(num).replace(/[0-9]/g, (w) => arabicDigits[+w]);
  };

  const selectedSurahConfig = surahs.find((s) => s.number === formData.surahId);
  const totalAyahs = selectedSurahConfig?.totalCount ?? 0;
  const ayahOptions = Array.from({ length: totalAyahs }, (_, i) => i + 1);

  const bounceWaveform = keyframes`
    0% { transform: scaleY(0.2); }
    100% { transform: scaleY(1.2); }
  `;

  if (loading)
    return (
      <Layout>
        <Box sx={{ p: 4, textAlign: "center" }}>Loading...</Box>
      </Layout>
    );
  if (error)
    return (
      <Layout>
        <Box sx={{ p: 4, color: "red" }}>
          Error loading Memorization details
        </Box>
      </Layout>
    );

  return (
    <Layout>
      <Box sx={{ maxWidth: "1000px", mx: "auto", p: 3, pb: 6 }}>
        {submitMessage && (
          <Box
            sx={{
              p: 3,
              mb: 3,
              borderRadius: "md",
              bg:
                submitMessage.type === "success"
                  ? "rgba(16, 185, 129, 0.1)"
                  : "rgba(239, 68, 68, 0.1)",
              color: submitMessage.type === "success" ? "#10B981" : "#EF4444",
              border: "1px solid",
              borderColor:
                submitMessage.type === "success" ? "#10B981" : "#EF4444",
            }}
          >
            {submitMessage.text}
          </Box>
        )}
        <Flex sx={{ alignItems: "center", gap: 3, mb: 4 }}>
          <Button
            onClick={() => navigate(-1)}
            sx={{ bg: "muted", color: "text" }}
          >
            {t("common.back")}
          </Button>

          <Text as="h1" sx={{ fontSize: 5, fontWeight: "bold" }}>
            {t("hifdh.edit")}
          </Text>
        </Flex>
        {/* 1. Surah & Ayah Scope Selection Card */}
        <Card
          sx={{
            borderRadius: "xl",
            border: "1px solid",
            borderColor: "muted",
            p: [3, 4],
            mb: 4,
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.03)",
          }}
        >
          <Flex sx={{ flexDirection: ["column", "row"], gap: 3, mb: 3 }}>
            {/* Student Field */}
            <Box sx={{ flex: 1 }}>
              <Label
                htmlFor="student"
                sx={{ display: "block", mb: 2, fontWeight: "bold" }}
              >
                {t("recitation.student")}
              </Label>
              <Input
                id="student"
                readOnly
                value={`${formData.studentfirstName} ${
                  formData.studentlastName || ""
                }`}
                sx={{
                  width: "100%",
                  p: 2,
                  borderRadius: "base",
                  border: "1px solid",
                  bg: "offset",
                }}
              />
            </Box>

            {/* Teacher Field */}
            <Box sx={{ flex: 1 }}>
              <Label
                htmlFor="teacher"
                sx={{ display: "block", mb: 2, fontWeight: "bold" }}
              >
                {t("recitation.teacher")}
              </Label>
              <Input
                id="teacher"
                readOnly
                value={`${formData.teacherfirstName} ${
                  formData.teacherlastName || ""
                }`}
                sx={{
                  width: "100%",
                  p: 2,
                  borderRadius: "base",
                  border: "1px solid",
                  bg: "offset",
                }}
              />
            </Box>
          </Flex>

          <Flex sx={{ gap: 3, mb: 4, alignItems: "center" }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                p: 2,
                bg: "rgba(99, 102, 241, 0.1)",
                borderRadius: "md",
                color: "primary",
              }}
            >
              <LuBookOpen size={24} />
            </Box>
            <Box>
              <Text as="h2" sx={{ fontSize: [2, 3], fontWeight: "bold" }}>
                {t("recitation.surah&Ayahs")}
              </Text>
              <Text sx={{ fontSize: 0, mt: 1, color: "gray" }}>
                {t("hifdh.definetheHifdhscope")}
              </Text>
            </Box>
          </Flex>

          <Flex sx={{ flexDirection: "column", gap: 3 }}>
            <Box sx={{ flex: 1 }}>
              <Label
                htmlFor="surah"
                sx={{ display: "block", mb: 2, fontWeight: "bold" }}
              >
                {t("recitation.surah")}
              </Label>
              <Select
                id="surah"
                value={formData.surahId}
                sx={{ width: "100%", borderRadius: "base" }}
                onChange={(e) => {
                  const surahId = Number(e.target.value);
                  const selectedSurah = surahs.find(
                    (s) => s.number === surahId
                  );
                  setFormData((prev) => ({
                    ...prev,
                    surahId,
                    surah: selectedSurah?.name_ar ?? "",
                    fromAyah: "",
                    toAyah: "",
                  }));
                }}
              >
                <option value="0">{t("common.selectOption")}</option>
                {surahs.map((surah) => (
                  <option key={surah.number} value={surah.number}>
                    {surah.number}. {surah.name_ar} - {surah.name}
                  </option>
                ))}
              </Select>
            </Box>

            {formData.surahId !== 0 && (
              <Flex sx={{ gap: 3, flexDirection: ["column", "row"] }}>
                <Box sx={{ flex: 1 }}>
                  <Label
                    htmlFor="fromAyah"
                    sx={{ display: "block", mb: 2, fontWeight: "bold" }}
                  >
                    {t("recitation.fromAyah")}
                  </Label>
                  <Select
                    id="fromAyah"
                    name="fromAyah"
                    value={formData.fromAyah}
                    onChange={handleInputChange}
                    sx={{
                      width: "100%",
                      borderRadius: "base",
                      p: 2,
                      border: "1px solid",
                    }}
                  >
                    <option value="">{t("common.selectOption")}</option>
                    {ayahOptions.map((num) => (
                      <option key={num} value={num}>
                        {isArabic ? toArabicNumber(num) : num}
                      </option>
                    ))}
                  </Select>
                </Box>

                <Box sx={{ flex: 1 }}>
                  <Label
                    htmlFor="toAyah"
                    sx={{ display: "block", mb: 2, fontWeight: "bold" }}
                  >
                    {t("recitation.toAyah")}
                  </Label>
                  <Select
                    id="toAyah"
                    name="toAyah"
                    value={formData.toAyah}
                    onChange={handleInputChange}
                    sx={{
                      width: "100%",
                      borderRadius: "base",
                      p: 2,
                      border: "1px solid",
                    }}
                  >
                    <option value="">{t("common.selectOption")}</option>
                    {ayahOptions.map((num) => (
                      <option key={num} value={num}>
                        {isArabic ? toArabicNumber(num) : num}
                      </option>
                    ))}
                  </Select>
                </Box>
              </Flex>
            )}
          </Flex>
        </Card>

        {/* 2. Recording & Evaluation Card */}
        <Card
          sx={{
            borderRadius: "xl",
            border: "1px solid",
            borderColor: "muted",
            p: [3, 4],
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.03)",
          }}
        >
          <Flex
            sx={{
              gap: 4,
              flexDirection: ["column", "column", "row"],
              alignItems: "stretch",
            }}
          >
            {/* Left Panel: Audio Control */}
            <Box
              sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}
            >
              <Text
                sx={{
                  fontSize: 0,
                  fontWeight: "bold",
                  textTransform: "uppercase",
                }}
              >
                {t("recitation.audioRecording")}
              </Text>

              <Box
                sx={{
                  flex: 1,
                  minHeight: "200px",
                  border: "1px solid",
                  borderColor: isRecording ? "#EF4444" : "muted",
                  bg: isRecording
                    ? "rgba(239, 68, 68, 0.02)"
                    : "rgba(248, 250, 252, 0.5)",
                  borderRadius: "lg",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  p: 4,
                }}
              >
                <Flex
                  sx={{
                    gap: "3px",
                    alignItems: "center",
                    mb: 3,
                    height: "24px",
                  }}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(
                    (_, i) => (
                      <Box
                        key={i}
                        sx={{
                          width: "3px",
                          height: "100%",
                          bg: isRecording ? "#EF4444" : "#10B981",
                          borderRadius: "full",
                          animation: isRecording
                            ? `${bounceWaveform} 0.6s ease-in-out infinite alternate`
                            : "none",
                          animationDelay: `${i * 0.05}s`,
                          transform: !isRecording
                            ? `scaleY(${
                                0.2 + Math.abs(Math.sin(i * 0.6)) * 0.5
                              })`
                            : undefined,
                        }}
                      />
                    )
                  )}
                </Flex>

                <Text
                  sx={{
                    fontSize: 5,
                    fontWeight: "bold",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {formatTimer(seconds)}
                </Text>

                <Text sx={{ color: "muted", fontSize: 1, mt: 1 }}>
                  {isRecording
                    ? "Recording..."
                    : recordedBlob
                    ? "New recording made"
                    : "Showing loaded recording"}
                </Text>
              </Box>

              <Flex sx={{ gap: 2 }}>
                {isRecording ? (
                  <Button
                    onClick={stopRecording}
                    type="button"
                    sx={{
                      flex: 1,
                      bg: "#EF4444",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 2,
                      borderRadius: "md",
                      py: 2,
                    }}
                  >
                    <LuCircleStop size={18} /> Stop
                  </Button>
                ) : (
                  <Button
                    onClick={startRecording}
                    type="button"
                    sx={{
                      flex: 1,
                      bg: "primary",
                      color: "white",
                      py: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 2,
                      borderRadius: "md",
                      cursor: "pointer",
                    }}
                  >
                    <LuMic size={18} />{" "}
                    {recordedURL ? "Record New" : "Start Recording"}
                  </Button>
                )}
              </Flex>

              {recordedURL && (
                <Box sx={{ mt: 1 }}>
                  <audio
                    controls
                    src={recordedURL}
                    style={{ width: "100%", borderRadius: "8px" }}
                  />
                </Box>
              )}
            </Box>

            {/* Right Panel: Evaluation & Notes */}
            <Box
              sx={{
                flex: 1.2,
                display: "flex",
                flexDirection: "column",
                gap: 3,
              }}
            >
              <Text
                sx={{
                  fontSize: 0,
                  fontWeight: "bold",
                  textTransform: "uppercase",
                }}
              >
                {t("hifdh.evaluation")}
              </Text>

              <Box>
                <Label
                  sx={{
                    display: "block",
                    mb: 2,
                    fontWeight: "bold",
                    fontSize: 1,
                  }}
                >
                  Grade
                </Label>
                <Flex sx={{ flexDirection: "column", gap: 2 }}>
                  {EVALUATION_OPTIONS.map((option) => {
                    const isSelected = formData.evaluation === option.value;
                    return (
                      <Box
                        key={option.value}
                        onClick={() =>
                          handleInputChange({
                            target: { name: "evaluation", value: option.value },
                          } as any)
                        }
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          p: 3,
                          borderRadius: "lg",
                          border: "1px solid",
                          borderColor: isSelected ? "#10B981" : "muted",
                          bg: isSelected ? "rgba(16, 185, 129, 0.08)" : "muted",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}
                      >
                        <Flex sx={{ alignItems: "center", gap: 3 }}>
                          {isSelected ? (
                            <LuCheck size={18} color="#10B981" />
                          ) : (
                            <Box
                              sx={{
                                width: "18px",
                                height: "18px",
                                borderRadius: "50%",
                                border: "1.5px solid",
                                borderColor: "#94A3B8",
                              }}
                            />
                          )}
                          <Text>{t(option.label)}</Text>
                        </Flex>
                      </Box>
                    );
                  })}
                </Flex>
              </Box>

              <Box sx={{ mt: 1 }}>
                <Label
                  htmlFor="notes"
                  sx={{
                    display: "block",
                    mb: 2,
                    fontWeight: "bold",
                    fontSize: 1,
                  }}
                >
                  {t("hifdh.teacherNotes")}
                </Label>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="e.g. Tajweed errors, needs revision..."
                  value={formData.notes}
                  onChange={handleInputChange}
                  sx={{
                    width: "100%",
                    p: 3,
                    borderRadius: "lg",
                    border: "1px solid",
                    borderColor: "muted",
                    minHeight: "80px",
                  }}
                />
              </Box>
            </Box>
          </Flex>
        </Card>

        {/* Sticky Action Bar */}
        {hasChanges && (
          <Box
            sx={{
              position: "fixed",
              bottom: 3,
              left: "50%",
              transform: "translateX(-50%)",
              width: "calc(100% - 32px)",
              maxWidth: "600px",
              bg: "background",
              border: "1px solid",
              borderColor: "muted",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
              borderRadius: "xl",
              p: 3,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              zIndex: 100,
            }}
          >
            <Text sx={{ fontSize: 1, fontWeight: "medium" }}>
              You have unsaved changes
            </Text>
            <Flex sx={{ gap: 2 }}>
              <Button
                type="button"
                onClick={handleDiscard}
                sx={{
                  bg: "transparent",
                  color: "text",
                  border: "1px solid",
                  borderColor: "muted",
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  px: 3,
                  py: 2,
                  borderRadius: "md",
                  cursor: "pointer",
                }}
              >
                <LuX size={16} /> Discard
              </Button>
              <Button
                type="submit"
                onClick={() => handleSubmit()}
                disabled={isUpdating}
                sx={{
                  bg: "primary",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  px: 4,
                  py: 2,
                  borderRadius: "md",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                <LuCheck size={16} />{" "}
                {isUpdating ? "Saving..." : "Save Changes"}
              </Button>
            </Flex>
          </Box>
        )}
      </Box>
    </Layout>
  );
}
