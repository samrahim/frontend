import {
  Box,
  Label,
  Textarea,
  Text,
  Input,
  Flex,
  Select,
  Button,
  Card,
} from "theme-ui";
import { SelectStudentInput } from "./StudentComponents/SelectStudentInput";
import { useMemo, useState } from "react";
import { useCreateHifdhMutation, useGetTeachersQuery } from "../graphql";
import { surahs } from "../utils/surah";

import { PageLayout } from "./PageLayout";
import { Layout } from "./Layout";
import { useNavigate } from "react-router-dom";

import React from "react";
import { useTranslation } from "react-i18next";
import { LuBookOpen, LuCheck, LuRefreshCw, LuUser } from "react-icons/lu";
import { useVerseRange } from "../Hooks/useVerseRange";
import { QuranViewer } from "./QuranViewr";
import { AudioRecorder } from "./AudioRecorder";
import { TeacherSelectInput } from "./TeacherComponents/SelectTeacherInput";

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
export function CreateHifdhPage() {
  const [submitMessage, setSubmitMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [teacherSearch, setTeacherSearch] = useState("");
  const [showTeacherDropdown, setShowTeacherDropdown] = useState(false);

  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);

  const [createHifdh] = useCreateHifdhMutation({});
  const [formData, setFormData] = useState({
    studentID: "",
    teacherName: "",
    teacherID: "",
    surah: "",
    fromAyah: "",
    toAyah: "",

    evaluation: "",
    surahId: 0,
    notes: "",
  });

  const { t, i18n } = useTranslation();
  const isArabic = i18n.language.startsWith("ar");
  const navigate = useNavigate();

  // Find the currently selected Surah configuration to retrieve totalCount
  const selectedSurahConfig = surahs.find((s) => s.number === formData.surahId);
  const totalAyahs = selectedSurahConfig?.totalCount ?? 0;

  // Generate an array [1, 2, 3, ..., totalAyahs]
  const ayahOptions = useMemo(
    () => Array.from({ length: totalAyahs }, (_, i) => i + 1),
    [totalAyahs]
  );
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreating) {
      return;
    }

    setSubmitMessage(null);

    // Validation
    if (!formData.studentID) {
      setSubmitMessage({
        type: "error",
        text: t("recitation.studentRequired"),
      });
      return;
    }
    if (!formData.surah) {
      setSubmitMessage({ type: "error", text: t("recitation.surahRequired") });
      return;
    }

    if (!formData.fromAyah) {
      setSubmitMessage({
        type: "error",
        text: t("recitation.fromAyahRequired"),
      });
      return;
    }
    if (!formData.toAyah) {
      setSubmitMessage({ type: "error", text: t("recitation.toAyahRequired") });
      return;
    }
    if (!formData.teacherID) {
      setSubmitMessage({
        type: "error",
        text: t("recitation.teacherRequired"),
      });
      return;
    }
    setIsCreating(true);
    const audioFile =
      recordedBlob &&
      new File([recordedBlob], `recitation-${Date.now()}.webm`, {
        type: recordedBlob.type,
      });

    try {
      const response = await createHifdh({
        variables: {
          file: audioFile,
          input: {
            surah: formData.surah,
            fromAyah: parseInt(formData.fromAyah),
            toAyah: parseInt(formData.toAyah),
            evaluation: formData.evaluation || undefined,
            note: formData.notes || undefined,
            studentID: formData.studentID,
            teacherID: formData.teacherID,
          },
        },
      });
      console.log(response);
      setSubmitMessage({
        type: "success",
        text: t("recitation.submitSuccess"),
      });

      // Reset form

      setFormData({
        studentID: "",
        teacherName: "",
        teacherID: "",
        surah: "",
        fromAyah: "",
        toAyah: "",
        surahId: 0,
        evaluation: "",
        notes: "",
      });
      setRecordedBlob(null);

      navigate(-1);
    } catch (error) {
      console.error("Error creating memorization:", error);
      setSubmitMessage({ type: "error", text: t("recitation.submitError") });
    } finally {
      setIsCreating(false);
    }
  };

  const handleStudentChange = (studentID: string | string[]) => {
    setFormData((prev) => ({
      ...prev,
      studentID: Array.isArray(studentID) ? studentID[0] : studentID,
    }));
  };
  const { data: teachersData } = useGetTeachersQuery();

  const teachers = useMemo(
    () =>
      teachersData?.teachers?.edges?.map((edge) => ({
        id: edge?.node?.id ?? "",
        name: `${edge?.node?.firstName ?? ""} ${edge?.node?.lastName ?? ""}`,
      })) ?? [],
    [teachersData]
  );

  const filteredTeachers = useMemo(
    () =>
      teachers.filter((teacher) =>
        teacher.name.toLowerCase().includes(teacherSearch.toLowerCase())
      ),
    [teachers, teacherSearch]
  );
  const handleTeacherSearch = (value: string) => {
    setTeacherSearch(value);
    setShowTeacherDropdown(true);
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const isValidRange =
    formData.surahId > 0 &&
    Number(formData.fromAyah) > 0 &&
    Number(formData.toAyah) >= Number(formData.fromAyah);
  // Pass surahNum directly if valid, otherwise fallback to 0
  const {
    data: quranVerses,
    loading: quranLoading,
    error: quranError,
  } = useVerseRange(
    isValidRange ? formData.surahId : 0,
    isValidRange ? formData.fromAyah : "",
    isValidRange ? formData.toAyah : ""
  );
  console.log("quranVerses", quranVerses);
  // useEffect(() => {
  //   if (!formData.surahId || !formData.fromAyah || !formData.toAyah) {
  //     useVerseRange();
  //     return;
  //   }

  //   fetchVerses();
  // }, [formData.surahId, formData.fromAyah, formData.toAyah]);
  const handleSelectTeacher = (teacher: { id: string; name: string }) => {
    setFormData((prev) => ({
      ...prev,
      teacherName: teacher.name,
      teacherID: teacher.id,
    }));
    setTeacherSearch(teacher.name);
    setShowTeacherDropdown(false);
  };

  const showQuran =
    formData.surah &&
    formData.fromAyah &&
    formData.toAyah &&
    (quranVerses?.verses?.length ?? 0) > 0;
  const toArabicNumber = (num: number) =>
    num.toString().replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);

  return (
    <Layout>
      <PageLayout
        title={t("hifdh.title")}
        description={t("hifdh.createDescription")}
        icon="🎙️"
      >
        <Box
          sx={{
            p: [2, 3], // Less padding on mobile screens
          }}
        >
          <Flex sx={{ alignItems: "center", gap: 3, mb: 4 }}>
            <Button
              onClick={() => navigate(-1)}
              sx={{ bg: "muted", color: "text" }}
            >
              {t("common.back")}
            </Button>

            <Text as="h1" sx={{ fontSize: [4, 5], fontWeight: "bold" }}>
              {t("hifdh.registerNew")}
            </Text>
          </Flex>

          <Flex sx={{ flexDirection: "column" }}>
            {/* Primary Grid: Form on Left, Quran on Right */}
            <Flex
              sx={{
                gap: 4,
                flexDirection: ["column", "column", "row"], // Stacks on mobile/tablet, side-by-side on desktop
                alignItems: "stretch",
              }}
            >
              <Box
                sx={{
                  flex: 1,
                  maxWidth: ["100%", "100%", "450px"], // Full-width on smaller displays, bounded on desktop
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {submitMessage && (
                  <Box
                    sx={{
                      mb: 3,
                      p: 3,
                      borderRadius: "md",
                      bg:
                        submitMessage.type === "success"
                          ? "rgba(16, 185, 129, 0.1)"
                          : "rgba(239, 68, 68, 0.1)",
                      border: "1px solid",
                      borderColor:
                        submitMessage.type === "success" ? "success" : "danger",
                      color:
                        submitMessage.type === "success" ? "success" : "danger",
                    }}
                  >
                    {submitMessage.text}
                  </Box>
                )}

                <Box
                  sx={{
                    flex: 1,
                    minWidth: ["100%", "300px"],
                  }}
                >
                  <Box as="form" onSubmit={handleSubmit}>
                    <Card
                      sx={{
                        borderRadius: "xl",
                        border: "1px solid",
                        borderColor: "muted",
                        p: [3, 4], // Adaptive padding
                        mb: 3,
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.03)",
                      }}
                    >
                      <Flex sx={{ gap: 1, mb: 3, flexDirection: "column" }}>
                        <Flex sx={{ alignItems: "center", gap: 3, mb: 4 }}>
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
                            <LuUser size={24} />
                          </Box>
                          <Box>
                            <Text
                              as="h2"
                              sx={{
                                fontSize: [2, 3],
                                fontWeight: "bold",
                              }}
                            >
                              {t("recitation.sessionInfo")}
                            </Text>
                            <Text sx={{ fontSize: 0, mt: 1 }}>
                              {t("recitation.whoisrecitingtoday")}
                            </Text>
                          </Box>
                        </Flex>

                        <Box sx={{ flex: 1 }}>
                          <SelectStudentInput
                            onChange={handleStudentChange}
                            label={t("recitation.student")}
                            placeholder={t("common.searchPlaceholder")}
                          />
                        </Box>

                        <Box sx={{ flex: 1, position: "relative" }}>
                          <Box sx={{ flex: 1, position: "relative" }}>
                            <TeacherSelectInput
                              teachers={teachers}
                              selectedTeacherId={formData.teacherID}
                              onSelectTeacher={(teacher) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  teacherID: teacher?.id ?? "",
                                }))
                              }
                            />
                          </Box>
                        </Box>
                      </Flex>
                    </Card>

                    <Card
                      sx={{
                        borderRadius: "xl",
                        border: "1px solid",
                        borderColor: "muted",
                        p: [3, 4],
                        mb: 3,
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.03)",
                      }}
                    >
                      <Flex sx={{ gap: 3, mb: 3, flexDirection: "column" }}>
                        <Flex sx={{ alignItems: "center", gap: 3, mb: 4 }}>
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
                            <Text
                              as="h2"
                              sx={{
                                fontSize: [2, 3],
                                fontWeight: "bold",
                              }}
                            >
                              {t("recitation.surah&Ayahs")}
                            </Text>
                            <Text sx={{ fontSize: 0, mt: 1 }}>
                              {t("recitation.definetherecitationscope")}
                            </Text>
                          </Box>
                        </Flex>

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
                            <option value="">{t("common.selectOption")}</option>

                            {surahs.map((surah) => (
                              <option key={surah.number} value={surah.number}>
                                {surah.number}. {surah.name_ar} - {surah.name}
                              </option>
                            ))}
                          </Select>
                        </Box>
                      </Flex>

                      {formData.surahId != 0 ? (
                        <Flex
                          sx={{
                            gap: 3,
                            mb: 3,
                            flexDirection: ["column", "row"],
                          }}
                        >
                          <Box sx={{ flex: 1 }}>
                            <Label
                              htmlFor="fromAyah"
                              sx={{
                                display: "block",
                                mb: 2,
                                fontWeight: "bold",
                              }}
                            >
                              {t("recitation.fromAyah")}
                            </Label>
                            <Select
                              id="fromAyah"
                              name="fromAyah"
                              value={formData.fromAyah}
                              onChange={handleInputChange}
                              disabled={!formData.surahId}
                              sx={{
                                width: "100%",
                                p: 2,
                                borderRadius: "base",
                                border: "1px solid",
                                "&:focus": {
                                  outline: "none",
                                  borderColor: "primary",
                                  boxShadow:
                                    "0 0 0 3px rgba(0, 120, 212, 0.25)",
                                },
                              }}
                            >
                              <option value="">
                                {formData.surahId
                                  ? t("common.selectOption")
                                  : "Select a Surah first"}
                              </option>
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
                              sx={{
                                display: "block",
                                mb: 2,
                                fontWeight: "bold",
                              }}
                            >
                              {t("recitation.toAyah")}
                            </Label>
                            <Select
                              id="toAyah"
                              name="toAyah"
                              value={formData.toAyah}
                              onChange={handleInputChange}
                              disabled={!formData.surahId}
                              sx={{
                                width: "100%",
                                p: 2,
                                borderRadius: "base",
                                border: "1px solid",
                                "&:focus": {
                                  outline: "none",
                                  borderColor: "primary",
                                  boxShadow:
                                    "0 0 0 3px rgba(0, 120, 212, 0.25)",
                                },
                              }}
                            >
                              <option value="">
                                {formData.surahId
                                  ? t("common.selectOption")
                                  : "Select a Surah first"}
                              </option>
                              {ayahOptions.map((num) => (
                                <option key={num} value={num}>
                                  {isArabic ? toArabicNumber(num) : num}
                                </option>
                              ))}
                            </Select>
                          </Box>
                        </Flex>
                      ) : null}

                      {formData.fromAyah != "" && formData.toAyah != "" ? (
                        <Box>
                          <Flex>
                            <Text>
                              {formData.surah} . {t("hifdh.fromAyah")}{" "}
                              {formData.fromAyah} {t("hifdh.toAyah")}{" "}
                              {formData.toAyah}
                            </Text>
                          </Flex>
                        </Box>
                      ) : null}
                    </Card>
                  </Box>
                </Box>
              </Box>

              {/* Quran View Container - Dynamically Resizes Based on Breakpoints */}
              <Box
                sx={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  border: "1px solid",
                  borderColor: "border",
                  borderRadius: "16px",
                  p: [3, 4],
                  bg: "background",
                  height: ["auto", "auto", "70vh"],
                  minHeight: ["250px", "350px", "auto"],
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.03)",
                  alignSelf: "stretch",
                }}
              >
                <Box
                  sx={{
                    overflowY: "auto",
                    height: "100%",
                    maxHeight: "100%",
                  }}
                >
                  {showQuran ? (
                    <QuranViewer
                      verses={quranVerses?.verses ?? []}
                      isArabic={isArabic}
                    />
                  ) : (
                    <Flex
                      sx={{
                        height: "100%",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "muted",
                        fontSize: 2,
                        py: 4,
                      }}
                    >
                      {t("recitation.selectScopeToView")}
                    </Flex>
                  )}
                </Box>
              </Box>
            </Flex>

            {/* Bottom Form Control: Recording and Evaluation */}
            <Card
              sx={{
                borderRadius: "xl",
                border: "1px solid",
                borderColor: "muted",
                p: [3, 4],
                mt: 4,
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.03)",
              }}
            >
              {/* Header Section */}
              <Flex sx={{ alignItems: "center", gap: 3, mb: 4 }}>
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
                  <Text
                    as="h2"
                    sx={{
                      fontSize: [2, 3],
                      fontWeight: "bold",
                    }}
                  >
                    {t("recitation.recording&Evaluation")}
                  </Text>
                  <Text sx={{ fontSize: 0, mt: 1 }}>
                    {t(
                      "recitation.recordthestudent'srecitationthenassessandaddnotes"
                    )}
                  </Text>
                </Box>
              </Flex>

              {/* Responsive Layout Grid for bottom panel */}
              <Flex
                sx={{
                  gap: 4,
                  flexDirection: ["column", "column", "row"],
                  alignItems: "stretch",
                }}
              >
                {/* Left: Audio Recording Control Box */}
                <AudioRecorder
                  onRecordingComplete={(blob) => {
                    setRecordedBlob(blob);
                  }}
                />

                {/* Right: Evaluation & Notes Box */}
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
                      letterSpacing: "wider",
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
                        color: "text",
                      }}
                    >
                      Grade
                    </Label>

                    {/* Custom Grade Radio Buttons */}
                    <Flex sx={{ flexDirection: "column", gap: 2 }}>
                      {EVALUATION_OPTIONS.map((option) => {
                        const isSelected = formData.evaluation === option.value;
                        return (
                          <Box
                            key={option.value}
                            onClick={() =>
                              handleInputChange({
                                target: {
                                  name: "evaluation",
                                  value: option.value,
                                },
                              } as any)
                            }
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              p: 3,
                              borderRadius: "lg",
                              border: "1px solid",
                              borderColor: isSelected ? "#10B981" : "#E2E8F0",
                              bg: isSelected
                                ? "rgba(16, 185, 129, 0.08)"
                                : "muted",
                              cursor: "pointer",
                              transition: "all 0.2s ease-in-out",
                              "&:hover": {
                                borderColor: isSelected ? "#10B981" : "#CBD5E1",
                                bg: isSelected
                                  ? "rgba(16, 185, 129, 0.12)"
                                  : "rgba(248, 250, 252, 0.8)",
                              },
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
                            <Text>
                              {option.value === "excellent" && "ممتاز"}
                              {option.value === "very_good" && "جيد جداً"}
                              {option.value === "good" && "جيد"}
                              {option.value === "acceptable" && "مقبول"}
                              {option.value === "weak" && "ضعيف"}
                            </Text>
                          </Box>
                        );
                      })}
                    </Flex>
                  </Box>

                  {/* Teacher Notes Textarea */}
                  <Box sx={{ mt: 1 }}>
                    <Label
                      htmlFor="notes"
                      sx={{
                        display: "block",
                        mb: 2,
                        fontWeight: "bold",
                        fontSize: 1,
                        color: "text",
                      }}
                    >
                      Teacher Notes{" "}
                      <span style={{ fontWeight: "normal", color: "#94A3B8" }}>
                        (optional)
                      </span>
                    </Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      placeholder="e.g. Makhraj of ض needs improvement, tajweed rules applied well..."
                      value={formData.notes}
                      onChange={handleInputChange}
                      sx={{
                        width: "100%",
                        p: 3,
                        borderRadius: "lg",
                        border: "1px solid",
                        borderColor: "#E2E8F0",
                        minHeight: "80px",
                        fontSize: 1,
                        fontFamily: "body",
                        "&:focus": {
                          outline: "none",
                          borderColor: "primary",
                          boxShadow: "0 0 0 3px rgba(99, 102, 241, 0.15)",
                        },
                      }}
                    />
                  </Box>
                </Box>
              </Flex>

              {/* Submit Button block */}
              <Flex
                sx={{
                  justifyContent: "flex-start",
                  alignItems: "center",
                  mt: 4,
                  pt: 3,
                  borderTop: "1px solid",
                  borderColor: "#E2E8F0",
                }}
              >
                <Button
                  disabled={isCreating}
                  sx={{
                    bg: "primary",
                    color: "white",
                    fontSize: 1,
                    fontWeight: "bold",
                    py: 2,
                    px: 4,
                    borderRadius: "lg",
                    cursor: "pointer",
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    transition: "all 0.3s ease",
                    "&:hover": {
                      opacity: 0.9,
                      transform: "translateY(-1px)",
                      boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
                    },
                  }}
                  onClick={handleSubmit}
                >
                  {isCreating ? (
                    <>
                      <LuRefreshCw className="spin-animation" size={18} />{" "}
                      Saving...
                    </>
                  ) : (
                    <>
                      <LuCheck size={18} /> {t("hifdh.save")}
                    </>
                  )}
                </Button>
              </Flex>
            </Card>
          </Flex>
        </Box>
      </PageLayout>
    </Layout>
  );
}
