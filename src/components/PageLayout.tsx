import { Box, Flex, Text } from "theme-ui";

interface PageLayoutProps {
  title?: string;
  description?: string;
  icon?: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
}

export function PageLayout({
  title,
  description,
  icon,
  children,
  actions,
}: PageLayoutProps) {
  return (
    <Flex
      sx={{
        flexDirection: "column",
        height: "100%",
        bg: "background",
      }}
    >
      <Box
        sx={{
          px: 4,
          py: 4,
          borderBottom: "1px solid",
          borderColor: "border",
          bg: "background",
        }}
      >
        <Flex
          sx={{
            maxWidth: "1200px",
            mx: "auto",
            width: "100%",
            alignItems: "flex-start",
            justifyContent: "space-between",

            gap: 3,
          }}
        >
          {/* Title */}
          <Box>
            <Flex
              sx={{
                alignItems: "center",
                gap: 2,
              }}
            >
              {icon && <Text sx={{ fontSize: 5 }}>{icon}</Text>}

              <Text
                as="h1"
                sx={{
                  m: 0,
                  fontSize: [3, 4, 5],
                  fontWeight: "bold",
                  color: "text",
                }}
              >
                {title}
              </Text>
            </Flex>

            {description && (
              <Text
                sx={{
                  mt: 1,
                  fontSize: 1,
                }}
              >
                {description}
              </Text>
            )}
          </Box>

          {/* Actions (buttons, filters, etc.) */}
          {actions && <Box>{actions}</Box>}
        </Flex>
      </Box>

      {/* CONTENT */}
      <Box
        sx={{
          flex: 1,
          p: 4,
          overflowY: "auto",
        }}
      >
        {children || (
          <Text
            sx={{
              textAlign: "center",
              color: "muted",
              py: 5,
            }}
          >
            Content coming soon...
          </Text>
        )}
      </Box>
    </Flex>
  );
}
