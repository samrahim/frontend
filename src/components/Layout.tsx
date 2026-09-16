/** @jsxImportSource theme-ui */
import { Box, Flex } from "theme-ui";
import { AppSidebar } from "./Sidebar";
import { Header } from "./Header";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <Flex sx={{ minHeight: "100vh", bg: "background" }}>
      <AppSidebar />

      <Box
        sx={{
          flex: 1,

          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
        }}
      >
        <Header />

        <Box
          sx={{
            flex: 1,
            overflow: "auto",
          }}
        >
          {children}
        </Box>
      </Box>
    </Flex>
  );
}
