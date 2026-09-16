import { useNavigate, useParams } from "react-router-dom";
import { useRecitationsQuery } from "../graphql";
import { Box, Flex, Input, Text, Textarea, Label, Button } from "theme-ui";
import { Layout } from "../components/Layout";
import AudioPlayer from "react-h5-audio-player";
import "react-h5-audio-player/lib/styles.css";
import { t } from "i18next";
import { UPLOAD_URL } from "../lib/apolloClient";

export function RecitationDetails() {
  const { id } = useParams<{ id: string }>();
  const {
    data: recitaionDetails,
    loading,
    error,
  } = useRecitationsQuery({
    variables: {
      where: {
        id: id,
      },
    },
  });
  const navigate = useNavigate();

  const recitation = recitaionDetails?.recitations?.edges?.[0]?.node;

  if (loading)
    return (
      <Layout>
        <Box p={4}>{t("common.loading") || "Loading..."}</Box>
      </Layout>
    );
  if (error)
    return (
      <Layout>
        <Box p={4} color="error">
          {error.message}
        </Box>
      </Layout>
    );
  if (!recitation)
    return (
      <Layout>
        <Box p={4}>{t("common.noResults")}</Box>
      </Layout>
    );

  return (
    <Layout>
      <Box sx={{ maxWidth: "800px", mx: "auto", p: 3 }}>
        <Flex sx={{ alignItems: "center", gap: 3, mb: 4 }}>
          <Button
            onClick={() => navigate("/recitation")}
            sx={{ bg: "muted", color: "text" }}
          >
            {t("common.back")}
          </Button>

          <Text as="h1" sx={{ fontSize: 5, fontWeight: "bold" }}>
            {t("recitation.details")}
          </Text>
        </Flex>

        <Box
          sx={{
            flex: 1,
            minWidth: "300px",
            p: 4,
            borderRadius: "md",
            border: "1px solid",
            borderColor: "muted",
          }}
        >
          <Box>
            {/* Responsive Student & Teacher Row */}
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
                  value={
                    recitation.student
                      ? `${recitation.student.firstName} ${
                          recitation.student.lastName || ""
                        }`
                      : ""
                  }
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
                  value={
                    recitation.teacher
                      ? `${recitation.teacher.firstName} ${
                          recitation.teacher.lastName || ""
                        }`
                      : ""
                  }
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

            {/* Responsive Surah, From Ayah & To Ayah Row */}
            <Flex sx={{ flexDirection: ["column", "row"], gap: 3, mb: 3 }}>
              {/* Surah */}
              <Box sx={{ flex: 2 }}>
                {" "}
                {/* Given slightly larger flex weight for longer Surah names */}
                <Label
                  htmlFor="surah"
                  sx={{ display: "block", mb: 2, fontWeight: "bold" }}
                >
                  {t("recitation.surah")}
                </Label>
                <Input
                  id="surah"
                  readOnly
                  value={recitation.surah || ""}
                  sx={{
                    width: "100%",
                    p: 2,
                    borderRadius: "base",
                    border: "1px solid",
                    bg: "offset",
                  }}
                />
              </Box>

              {/* From Ayah */}
              <Box sx={{ flex: 1 }}>
                <Label
                  htmlFor="fromAyah"
                  sx={{ display: "block", mb: 2, fontWeight: "bold" }}
                >
                  {t("recitation.fromAyah")}
                </Label>
                <Input
                  id="fromAyah"
                  readOnly
                  value={recitation.fromAyah || ""}
                  sx={{
                    width: "100%",
                    p: 2,
                    borderRadius: "base",
                    border: "1px solid",
                    bg: "offset",
                  }}
                />
              </Box>

              {/* To Ayah */}
              <Box sx={{ flex: 1 }}>
                <Label
                  htmlFor="toAyah"
                  sx={{ display: "block", mb: 2, fontWeight: "bold" }}
                >
                  {t("recitation.toAyah")}
                </Label>
                <Input
                  id="toAyah"
                  readOnly
                  value={recitation.toAyah || ""}
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

            {/* Audio Player (Separate line) */}
            {recitation.audio != null && recitation.audio !== "" && (
              <Box sx={{ mb: 3 }}>
                <AudioPlayer
                  style={{
                    background: "red",
                  }}
                  autoPlay
                  src={`${UPLOAD_URL}${recitation.audio}`}
                  onPlay={(e) =>
                    console.log(`${UPLOAD_URL}+${recitation.audio}`)
                  }
                />
              </Box>
            )}

            {/* Evaluation Field */}
            <Box sx={{ mb: 3 }}>
              <Label
                htmlFor="evaluation"
                sx={{ display: "block", mb: 2, fontWeight: "bold" }}
              >
                {t("recitation.evaluation")}
              </Label>
              <Input
                id="evaluation"
                readOnly
                value={
                  recitation.evaluation
                    ? t(`evaluation.${recitation.evaluation}`)
                    : ""
                }
                sx={{
                  width: "100%",
                  p: 2,
                  borderRadius: "base",
                  border: "1px solid",
                  bg: "offset",
                }}
              />
            </Box>

            {/* Notes Field */}
            <Box sx={{ mb: 3 }}>
              <Label
                htmlFor="notes"
                sx={{ display: "block", mb: 2, fontWeight: "bold" }}
              >
                {t("recitation.notes")}
              </Label>
              <Textarea
                id="notes"
                readOnly
                value={recitation.note || ""}
                sx={{
                  width: "100%",
                  p: 2,
                  borderRadius: "base",
                  border: "1px solid",
                  minHeight: "100px",
                  bg: "offset",
                  resize: "none",
                }}
              />
            </Box>
          </Box>
        </Box>
      </Box>
    </Layout>
  );
}
