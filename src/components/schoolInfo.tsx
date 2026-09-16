import { useState } from "react";
import { useSchoolQuery, useUpdateinfoMutation } from "../graphql";
import {
  Box,
  Card,
  Flex,
  Heading,
  Spinner,
  Text,
  Image,
  Label,
  Input,
  Button,
} from "theme-ui";
import { t } from "i18next";

export function SchoolInfosComponent() {
  const [infoId, setInfoId] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  const { data, loading, error } = useSchoolQuery({
    onCompleted: (res) => {
      const node = res?.infos?.edges?.[0]?.node;

      if (node) {
        setInfoId(node?.id || "");
        setName(node.name || "");
        setAddress(node.address || "");
        setPreviewUrl(
          node.logo ? `http://62.171.141.151:8081/${node.logo}` : ""
        );
      }
    },
  });

  const [updateInfo, { loading: updating }] = useUpdateinfoMutation();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!infoId) return;

    try {
      await updateInfo({
        variables: {
          id: infoId,
          input: { name, address },
          file: file,
        },
      });
      alert(t("common.success"));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading)
    return (
      <Flex sx={{ justifyContent: "center", p: 4 }}>
        <Spinner />
      </Flex>
    );

  if (error)
    return (
      <Text sx={{ color: "red" }}>
        {t("common.error")} {error.message}
      </Text>
    );

  return (
    <Box sx={{ maxWidth: 600, mx: "auto", p: 4 }}>
      <Card
        sx={{
          p: 4,
          borderRadius: 8,
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          bg: "background",
        }}
      >
        <Heading as="h2" sx={{ mb: 4, textAlign: "center", color: "primary" }}>
          {t("common.title")}
        </Heading>

        <Box as="form" onSubmit={handleSubmit}>
          {/* 🖼️ logo upload */}
          <Flex sx={{ flexDirection: "column", alignItems: "center", mb: 4 }}>
            {previewUrl ? (
              <Image
                src={previewUrl}
                sx={{
                  width: 120,
                  height: 120,
                  borderRadius: "50%",
                  objectFit: "cover",
                  mb: 2,
                  border: "2px solid #eee",
                }}
              />
            ) : (
              <Box
                sx={{
                  width: 120,
                  height: 120,
                  borderRadius: "50%",
                  bg: "muted",
                  mb: 2,
                }}
              />
            )}

            <Label
              htmlFor="logo-upload"
              sx={{
                cursor: "pointer",
                color: "primary",
                fontWeight: "bold",
                textAlign: "center",
              }}
            >
              {t("common.changeLogo")}
            </Label>
            <Input
              id="logo-upload"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              sx={{ display: "none" }}
            />
          </Flex>

          {/* 🏫 School Name */}
          <Box sx={{ mb: 3 }}>
            <Label htmlFor="school-name" sx={{ mb: 1, fontWeight: "bold" }}>
              {t("common.schoolName")}
            </Label>
            <Input
              id="school-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("common.schoolNamePlaceholder")}
              required
            />
          </Box>

          {/* 📍 Address */}
          <Box sx={{ mb: 4 }}>
            <Label htmlFor="school-address" sx={{ mb: 1, fontWeight: "bold" }}>
              {t("common.address")}
            </Label>
            <Input
              id="school-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={t("common.addressPlaceholder")}
              required
            />
          </Box>

          {/* 💾 Save Button */}
          <Button
            type="submit"
            disabled={updating}
            sx={{ width: "100%", py: 2, fontSize: 2, cursor: "pointer" }}
          >
            {updating ? t("common.saving") : t("common.save")}
          </Button>
        </Box>
      </Card>
    </Box>
  );
}
