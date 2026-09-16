import { useState } from "react";
import { Box, Button, Flex, Text } from "theme-ui";
import { useTranslation } from "react-i18next";
import { useNotifications } from "../providers/NotificationProvider";

export function NotificationBell() {
  const { notifications, markAsRead, removeNotification } = useNotifications();

  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);

  const isRTL = i18n.dir() === "rtl";
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <Box
      sx={{
        position: "relative",
        direction: isRTL ? "rtl" : "ltr",
      }}
    >
      <Button
        variant="secondary"
        onClick={() => setOpen((v) => !v)}
        sx={{
          position: "relative",
          p: 2,
          borderRadius: "50%",
          fontSize: 3,
        }}
      >
        🔔
        {unread > 0 && (
          <Box
            sx={{
              position: "absolute",
              top: -4,
              [isRTL ? "left" : "right"]: -4,

              bg: "red",
              color: "white",
              borderRadius: "999px",

              minWidth: 20,
              height: 20,
              px: 1,

              display: "flex",
              alignItems: "center",
              justifyContent: "center",

              fontSize: 0,
              fontWeight: "bold",
            }}
          >
            {unread}
          </Box>
        )}
      </Button>

      {open && (
        <Box
          sx={{
            position: "absolute",

            top: "110%",

            // Important for RTL
            [isRTL ? "left" : "right"]: 0,

            width: 360,
            maxWidth: "calc(100vw - 24px)",

            maxHeight: 450,
            overflowY: "auto",

            bg: "background",

            border: "1px solid",
            borderColor: "border",

            borderRadius: 12,

            boxShadow: "0 10px 30px rgba(0,0,0,.18)",

            zIndex: 9999,

            direction: isRTL ? "rtl" : "ltr",
          }}
        >
          <Flex
            sx={{
              p: 3,
              alignItems: "center",
              justifyContent: "space-between",

              borderBottom: "1px solid",
              borderColor: "border",
            }}
          >
            <Text
              sx={{
                fontWeight: "bold",
                fontSize: 2,
              }}
            >
              Notifications
            </Text>

            <Text sx={{ color: "primary" }}>{unread} unread</Text>
          </Flex>

          {notifications.length === 0 ? (
            <Box sx={{ p: 4, textAlign: "center" }}>
              <Text color="textMuted">No notifications</Text>
            </Box>
          ) : (
            notifications.map((n) => (
              <Flex
                key={n.id}
                onClick={() => markAsRead(n.id)}
                sx={{
                  p: 3,
                  gap: 2,
                  alignItems: "flex-start",

                  cursor: "pointer",

                  bg: n.read ? "background" : "rgba(59,130,246,.08)",

                  borderBottom: "1px solid",
                  borderColor: "border",

                  transition: ".2s",

                  "&:hover": {
                    bg: "muted",
                  },
                }}
              >
                {!n.read && (
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      minWidth: 8,
                      borderRadius: "50%",
                      bg: "primary",
                      mt: 2,
                    }}
                  />
                )}

                <Box
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    textAlign: isRTL ? "right" : "left",
                  }}
                >
                  <Text
                    sx={{
                      fontWeight: "bold",
                      overflowWrap: "anywhere",
                      wordBreak: "break-word",
                    }}
                  >
                    {n.title}
                  </Text>

                  <Text
                    sx={{
                      color: "text",
                      mt: 1,
                      overflowWrap: "anywhere",
                      wordBreak: "break-word",
                    }}
                  >
                    {n.message}
                  </Text>

                  <Text
                    sx={{
                      fontSize: 0,
                      color: "gray",
                      mt: 2,
                    }}
                  >
                    {new Date(n.createdAt).toLocaleString(i18n.language)}
                  </Text>
                </Box>

                <Button
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeNotification(n.id);
                  }}
                  sx={{
                    p: 1,
                    minWidth: "auto",
                    color: "red",
                    fontSize: 2,
                    flexShrink: 0,
                  }}
                >
                  ✕
                </Button>
              </Flex>
            ))
          )}
        </Box>
      )}
    </Box>
  );
}
