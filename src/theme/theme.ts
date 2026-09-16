import type { Theme } from "theme-ui";

// Centralized Design System Theme
// Based on System-UI Theme Specification and Theme-UI Color Modes
// See: https://theme-ui.com/color-modes

// Light mode color palette
const lightColors = {
  // Brand (Shifted from Teal to Bright Islamic Green)
  primary: "#12B76A", // Bright, vibrant Islamic Green
  secondary: "#B58900", // Islamic Gold

  success: "#10B981", // Light Emerald Success
  danger: "#C62828",
  warning: "#E6A700",
  info: "#1976D2",

  text: "#1F2937",
  background: "#F8F7F2",
  muted: "#EFEBDD",
  border: "#D8D1BE",
  subtle: "#C8C1AE",

  primaryLight: "#E6F9F1", // Very soft, light green background accent
  primaryDark: "#0B7A46", // Deep Islamic Green

  secondaryLight: "#F6E7B2",
  secondaryDark: "#8C6A00",

  tableBackground: "#FFFFFF",
  tableHeaderBackground: "#12B76A", // Updated header table bg
  tableHeaderText: "#000000",
  tableBorder: "#E5E7EB",
  tableRowHover: "#F0FAF5", // Adjusted hover to match light green
  tableRowStripe: "#FAFAF8",
  tableText: "#374151",

  // Linear gradients updated with the new vibrant green
  headerGradientStart: "#12B76A",
  headerGradientEnd: "#0D8A4F",

  sidebarGradientStart: "#0D8A4F", // Darker Islamic Green for contrast
  sidebarGradientEnd: "#12B76A", // Merges into bright Islamic Green
};

// Dark mode color overrides
const darkColors = {
  text: "#F3F4F6",

  background: "#0A1F16", // Deep forest green-black background

  muted: "#112F22", // Muted green-black

  border: "#1E4D38",

  subtle: "#337A5C",

  primary: "#34D399", // Glowing light Islamic green for dark mode

  secondary: "#D9B24C",

  success: "#10B981",

  danger: "#EF5350",

  warning: "#F4B942",

  info: "#64B5F6",

  tableBackground: "#112F22",

  tableHeaderBackground: "#0D8A4F",

  tableHeaderText: "#FFFFFF",

  tableBorder: "#1E4D38",

  tableRowHover: "#163E2D",

  tableRowStripe: "#123425",

  tableText: "#E5E7EB",

  headerGradientStart: "#0A1F16",

  headerGradientEnd: "#0D8A4F",

  sidebarGradientStart: "#0A1F16",

  sidebarGradientEnd: "#0D8A4F",
};

const typography = {
  fonts: {
    body: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    heading:
      'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: '"SF Mono", "Monaco", "Inconsolata", "Fira Code", monospace',
  },
  fontSizes: [12, 14, 16, 18, 20, 24, 28, 32, 36, 40],
  fontWeights: {
    body: 400,
    heading: 600,
    bold: 700,
  },
  lineHeights: {
    body: 1.5,
    heading: 1.25,
    tight: 1.1,
  },
  letterSpacings: {
    normal: "0.5px",
    wide: "1px",
  },
};

const space = [0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64, 72, 80];

const sizes = {
  maxWidth: "1200px",
  containerSmall: "600px",
  containerMedium: "800px",
  containerLarge: "1200px",
};

const radii = {
  none: 0,
  sm: 4,
  base: 6,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

const transitions = {
  default: "all 0.2s ease",
  fast: "all 0.15s ease",
  slow: "all 0.3s ease",
};

const shadows = {
  none: "none",
  sm: "0 2px 4px rgba(0, 0, 0, 0.1)",
  base: "0 2px 4px rgba(0, 0, 0, 0.1), 0 10px 20px rgba(0, 0, 0, 0.15)",
  md: "0 4px 6px rgba(0, 0, 0, 0.1), 0 10px 20px rgba(0, 0, 0, 0.15)",
  lg: "0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)",
};

const zIndices = {
  hide: -1,
  base: 0,
  dropdown: 100,
  sticky: 500,
  modal: 1000,
  tooltip: 1100,
};

// Button Variants
const buttonVariants = {
  primary: {
    bg: "primary",
    color: "white",
    border: "none",
    cursor: "pointer",
    fontSize: 1,
    fontWeight: "heading",
    padding: "10px 16px",
    borderRadius: "base",
    transition: "default",
    "&:hover": {
      boxShadow: "0 6px 14px rgba(18, 183, 106, 0.25)", // Highlight shadow using new light green
      transform: "translateY(-1px)",
    },
    "&:active": {
      transform: "translateY(0)",
    },
    "&:disabled": {
      opacity: 0.5,
      cursor: "not-allowed",
    },
  },
  success: {
    bg: "success",
    color: "white",
    border: "none",
    cursor: "pointer",
    fontSize: 1,
    fontWeight: "heading",
    padding: "8px 16px",
    borderRadius: "base",
    transition: "default",
    "&:hover": {
      boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)",
      transform: "translateY(-1px)",
    },
    "&:active": {
      transform: "translateY(0)",
    },
  },
  danger: {
    bg: "danger",
    color: "white",
    border: "none",
    cursor: "pointer",
    fontSize: 1,
    fontWeight: "heading",
    padding: "6px 12px",
    borderRadius: "sm",
    transition: "default",
    "&:hover": {
      boxShadow: "0 2px 6px rgba(239, 68, 68, 0.3)",
      transform: "translateY(-1px)",
    },
    "&:disabled": {
      opacity: 0.5,
      cursor: "not-allowed",
    },
  },
  secondary: {
    bg: "muted",
    color: "text",
    border: "none",
    cursor: "pointer",
    fontSize: 1,
    fontWeight: "heading",
    padding: "10px 16px",
    borderRadius: "base",
    transition: "default",
    "&:hover": {
      opacity: 0.8,
      transform: "translateY(-1px)",
    },
    "&:disabled": {
      opacity: 0.5,
      cursor: "not-allowed",
    },
  },
};

// Table Variants
const tableVariants = {
  default: {
    width: "stretch",
    tableLayout: "auto" as const,
    borderCollapse: "collapse" as const,
    bg: "tableBackground",
    color: "tableText",
    fontSize: 1,
  },
  striped: {
    width: "stretch",
    tableLayout: "auto" as const,
    borderCollapse: "collapse" as const,
    bg: "tableBackground",
    color: "tableText",
    fontSize: 1,
    "tbody tr:nth-of-type(odd)": {
      bg: "tableRowStripe",
    },
  },
  bordered: {
    width: "stretch",
    tableLayout: "auto" as const,
    borderCollapse: "collapse" as const,
    bg: "tableBackground",
    color: "tableText",
    fontSize: 1,
    border: "1px solid",
    borderColor: "tableBorder",
  },
};

// Table Header Styles
const tableHeaderStyles = {
  bg: "tableHeaderBackground",
  color: "tableHeaderText",
  fontWeight: "heading",
  fontSize: 0,
  p: 3,
  borderBottom: "2px solid",
  borderColor: "tableBorder",
  textAlign: "left" as const,
};

// Table Cell Styles
const tableCellStyles = {
  p: 3,
  borderBottom: "1px solid",
  borderColor: "tableBorder",
};

// Table Row Hover Styles
const tableRowHoverStyles = {
  bg: "tableRowHover",
  transition: "background-color 0.2s ease",
};

// Table Row Styles
const tableRowStyles = {
  transition: "background-color 0.2s ease",
  mb: 2,
  "&:hover": tableRowHoverStyles,
};

// Single Theme Object with Color Modes
// Following theme-ui official pattern: https://theme-ui.com/color-modes
export const theme: Theme = {
  config: {
    useColorSchemeMediaQuery: true,
    useLocalStorage: true,
    useCustomProperties: true,
  },

  ...typography,
  space,
  sizes,
  radii,
  transitions,
  shadows,
  zIndices,

  colors: {
    ...lightColors,
    modes: {
      dark: {
        ...darkColors,
      },
    },
  },

  buttons: buttonVariants,

  // Badge Variants
  badges: {
    default: {
      bg: "primary",
      color: "white",
      px: 2,
      py: 1,
      borderRadius: "sm",
      fontSize: 0,
      fontWeight: "heading",
    },
    success: {
      bg: "success",
      color: "white",
      px: 2,
      py: 1,
      borderRadius: "sm",
      fontSize: 0,
      fontWeight: "heading",
    },
    danger: {
      bg: "danger",
      color: "white",
      px: 2,
      py: 1,
      borderRadius: "sm",
      fontSize: 0,
      fontWeight: "heading",
    },
    info: {
      bg: "info",
      color: "white",
      px: 2,
      py: 1,
      borderRadius: "sm",
      fontSize: 0,
      fontWeight: "heading",
    },
    warning: {
      bg: "warning",
      color: "white",
      px: 2,
      py: 1,
      borderRadius: "sm",
      fontSize: 0,
      fontWeight: "heading",
    },
  },

  // Table-related styles
  styles: {
    table: tableVariants.default,
    th: tableHeaderStyles,
    td: tableCellStyles,
    tr: tableRowStyles,
  },

  // Layout Variants
  layout: {
    root: {
      display: "flex",
      height: "100vh",
      bg: "background",
    },
    wrapper: {
      display: "flex",
      flexDirection: "column",
      flex: 1,
      marginLeft: "250px",
      overflow: "hidden",
    },
    header: {
      width: "100%",
      display: "flex",
      alignItems: "center",
      py: 3,
      boxShadow: "md",
    },
    main: {
      flex: 1,
      overflowY: "auto",
      bg: "background",
      width: "100%",
    },
  },
};

export default theme;
