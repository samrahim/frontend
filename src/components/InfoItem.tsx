import { Box, Flex, Text } from "theme-ui";

type InfoItemProps = {
  icon: React.ReactNode;
  title: string;
  value: React.ReactNode;
};

export function InfoItem({ icon, title, value }: InfoItemProps) {
  return (
    <Flex
      sx={{
        minWidth: 180,
        gap: 2,
        alignItems: "flex-start",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 2,
          bg: "muted",
          borderRadius: "md",
          color: "primary",
        }}
      >
        {icon}
      </Box>

      <Box>
        <Text
          sx={{
            color: "gray",
            fontSize: 1,
          }}
        >
          {title}
        </Text>

        <Text
          sx={{
            mt: 1,
            fontWeight: "bold",
            fontSize: 2,
          }}
        >
          {` ${value}`}
        </Text>
      </Box>
    </Flex>
  );
}
