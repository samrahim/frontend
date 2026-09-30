import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Box, Text, Flex, Image, useThemeUI } from "theme-ui";
import { useColorMode } from "../contexts/ThemeContext";
import { FiSun, FiMoon, FiLogOut } from "react-icons/fi";
import { CgProfile } from "react-icons/cg";
import i18n from "../i18n/i18n";
import { NotificationBell } from "./NotificationComponent";
import { useTranslation } from "react-i18next";
import { useSchoolQuery } from "../graphql";

export function Header() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { isDark, toggleColorMode } = useColorMode();
  const themeUI = useThemeUI();
  const theme = themeUI.theme;
  const isRTL = i18n.dir() === "rtl";
  const { t } = useTranslation();

  const gradientBg = `linear-gradient(135deg, ${theme?.colors?.headerGradientStart} 0%, ${theme?.colors?.headerGradientEnd} 100%)`;

  const { data } = useSchoolQuery();
  // Safe extraction for logo URL with fallbacke
  const schoolLogo = data?.infos?.edges?.[0]?.node?.logo;

  const logoUrl = schoolLogo
    ? `http://62.171.141.151:8088${schoolLogo}`
    : "/uploads/logo.png";
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <Box
      as="header"
      sx={{
        py: 3,
        boxShadow: "md",
        background: gradientBg,
        variant: "layout.header",
      }}
    >
      <Flex
        sx={{
          maxWidth: "1200px",
          mx: "auto",
          px: 4,
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
          direction: isRTL ? "rtl" : "ltr",
        }}
      >
        {/* Brand Container (Logo + School Name) */}
        <Flex sx={{ alignItems: "center", gap: 3 }}>
          {schoolLogo && (
            <Image
              src={logoUrl}
              alt="School Logo"
              sx={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                objectFit: "cover",
                border: "2px solid rgba(255, 255, 255, 0.8)",
                bg: "white",
              }}
            />
          )}
          <Text
            as="h1"
            sx={{
              m: 0,
              fontSize: [4, 5, 5],
              fontWeight: "heading",
              color: "white",
            }}
          >
            {t("common.schoolName")}
          </Text>
        </Flex>

        {/* Right Side Actions */}
        <Flex sx={{ alignItems: "center", gap: 4 }}>
          {/* <NotificationBell /> */}

          <Box
            onClick={toggleColorMode}
            sx={{
              cursor: "pointer",
              transition: "all 0.3s",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              "&:hover": {
                transform: "scale(1.15)",
              },
            }}
            title={isDark ? "Light mode" : "Dark mode"}
          >
            {isDark ? <FiSun size={24} /> : <FiMoon size={24} />}
          </Box>

          <Box
            onClick={() => navigate("/profile")}
            sx={{
              cursor: "pointer",
              transition: "all 0.3s",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              "&:hover": {
                transform: "scale(1.15)",
              },
            }}
            title="Profile"
          >
            <CgProfile size={24} />
          </Box>

          <Box
            onClick={handleLogout}
            sx={{
              cursor: "pointer",
              transition: "all 0.3s",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              "&:hover": {
                transform: "scale(1.15)",
              },
            }}
            title="Logout"
          >
            <FiLogOut size={24} />
          </Box>
        </Flex>
      </Flex>
    </Box>
  );
}
