import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext";
import { Box, Flex, Button, Text, Input, Label, Select } from "theme-ui";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { auth } from "../firebase";

export function LoginPage() {
  const { t } = useTranslation();
  const [isRegistering, setIsRegistering] = useState(false);

  // Auth fields
  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("12345678");

  // Extra setup fields for POST /setup
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("admin");
  const [address, setAddress] = useState("");

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { login, signup, setUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (isRegistering) {
        const token = await signup(email, password);

        const formData = new FormData();
        formData.append("firstName", firstName);
        formData.append("lastName", lastName);
        formData.append("email", email);
        formData.append("phone", phone);
        formData.append("address", address);
        formData.append("role", role);

        const response = await fetch("http://localhost:8081/setup", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          const resData = await response.json();
          throw new Error(
            resData.message || resData.error || t("auth.setupError")
          );
        }

        // إجبار Firebase على جلب Token جديد بعد تحديث الـ Claims في POST /setup
        if (auth.currentUser) {
          const refreshedToken = await auth.currentUser.getIdToken(true);
          localStorage.setItem("authToken", refreshedToken);
        }

        // جلب الـ Profile لتحديث AuthContext قبل التوجيه
        const idToken = localStorage.getItem("authToken");
        const profileResponse = await fetch("http://localhost:8081/profile", {
          headers: { Authorization: "Bearer " + idToken },
        });
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          setUser(profileData);
        }

        navigate("/home");
      } else {
        await login(email, password);
        navigate("/home");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.loginError"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Flex
      sx={{
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        p: 3,
        position: "relative",
      }}
    >
      <Box sx={{ position: "absolute", top: 5, right: 5 }}>
        <LanguageSwitcher />
      </Box>

      <Box
        sx={{
          bg: "background",
          borderRadius: "lg",
          boxShadow: "lg",
          p: 5,
          width: "100%",
          maxWidth: "420px",
          color: "text",
        }}
      >
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Text
            as="h1"
            sx={{
              m: 0,
              mb: 2,
              fontSize: 5,
              color: "primary",
              fontWeight: "heading",
            }}
          >
            {t("common.appName")}
          </Text>
          <Text sx={{ m: 0, color: "muted", fontSize: 0 }}>
            {isRegistering
              ? t("auth.signUp", "Create Account")
              : t("auth.signIn")}
          </Text>
        </Box>

        <Box
          as="form"
          onSubmit={handleSubmit}
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 3,
          }}
        >
          {isRegistering && (
            <>
              <Flex sx={{ gap: 2 }}>
                <Box
                  sx={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                  }}
                >
                  <Label
                    htmlFor="firstName"
                    sx={{ fontWeight: 600, fontSize: 0 }}
                  >
                    {t("auth.firstName", "First Name")}
                  </Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </Box>

                <Box
                  sx={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                  }}
                >
                  <Label
                    htmlFor="lastName"
                    sx={{ fontWeight: 600, fontSize: 0 }}
                  >
                    {t("auth.lastName", "Last Name")}
                  </Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </Box>
              </Flex>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Label htmlFor="phone" sx={{ fontWeight: 600, fontSize: 0 }}>
                  {t("auth.phone", "Phone Number")}
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </Box>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Label htmlFor="address" sx={{ fontWeight: 600, fontSize: 0 }}>
                  {t("auth.address", "Address")}
                </Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </Box>
            </>
          )}

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Label htmlFor="email" sx={{ fontWeight: 600, fontSize: 0 }}>
              {t("auth.email")}
            </Label>
            <Input
              id="email"
              type="email"
              placeholder={t("auth.enterEmail")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Label htmlFor="password" sx={{ fontWeight: 600, fontSize: 0 }}>
              {t("auth.password")}
            </Label>
            <Input
              id="password"
              type="password"
              placeholder={t("auth.enterPassword")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Box>

          {error && (
            <Box
              sx={{
                bg: "dangerLight",
                color: "dangerDark",
                p: 2,
                borderRadius: "md",
                fontSize: 0,
                borderLeft: "4px solid",
                borderColor: "danger",
              }}
            >
              {error}
            </Box>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            sx={{
              p: 2,
              color: "white",
              borderRadius: "md",
              fontSize: 2,
              fontWeight: "heading",
              cursor: "pointer",
            }}
          >
            {isLoading
              ? t("auth.processing", "Processing...")
              : isRegistering
              ? t("auth.createAccount", "Create Account")
              : t("auth.loginButton")}
          </Button>
        </Box>

        <Box
          sx={{
            textAlign: "center",
            mt: 3,
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <Text
            onClick={() => {
              setError("");
              setIsRegistering(!isRegistering);
            }}
            sx={{
              color: "primary",
              cursor: "pointer",
              fontSize: 0,
              fontWeight: 600,
              "&:hover": { textDecoration: "underline" },
            }}
          >
            {isRegistering
              ? t("auth.alreadyHaveAccount", "Already have an account? Sign In")
              : t("auth.dontHaveAccount", "Don't have an account? Create one")}
          </Text>

          {!isRegistering && (
            <Label
              as="a"
              sx={{
                color: "subtle",
                textDecoration: "none",
                fontSize: 0,
                cursor: "pointer",
                "&:hover": { color: "primary" },
              }}
            >
              {t("auth.forgotPassword")}
            </Label>
          )}
        </Box>
      </Box>
    </Flex>
  );
}
