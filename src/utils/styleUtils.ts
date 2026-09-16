// Styling utilities for consistent use of theme colors and spacing

import { lightTheme, darkTheme } from "../theme/theme";

type Theme = typeof lightTheme;

/**
 * Get color from theme by path (e.g., 'colors.primary', 'colors.gray.300')
 */
export const getColor = (theme: Theme, path: string): string => {
  return (
    path.split(".").reduce((obj, key) => obj?.[key], theme as any) || "#000000"
  );
};

/**
 * Create a CSS class string with theme-aware styles
 */
export const createStyleObject = (styles: Record<string, string | number>) => {
  return Object.entries(styles)
    .map(([key, value]) => `${key}: ${value}`)
    .join("; ");
};

/**
 * Utility to generate button styles inline (for when CSS modules aren't available)
 */
export const getButtonStyles = (
  variant: "primary" | "success" | "danger" | "secondary" = "primary",
) => {
  const variantStyles = lightTheme.buttons[variant];
  return variantStyles as any;
};

/**
 * Responsive breakpoints helper
 */
export const breakpoints = {
  mobile: "640px",
  tablet: "768px",
  desktop: "1024px",
  wide: "1280px",
};

/**
 * Media query helpers
 */
export const media = {
  mobile: `@media (max-width: ${breakpoints.mobile})`,
  tablet: `@media (max-width: ${breakpoints.tablet})`,
  desktop: `@media (min-width: ${breakpoints.desktop})`,
  wide: `@media (min-width: ${breakpoints.wide})`,
};

/**
 * Spacing scale helper
 */
export const spacingMap = [
  0, // 0
  4, // 1
  8, // 2
  12, // 3
  16, // 4
  20, // 5
  24, // 6
  32, // 7
  40, // 8
  48, // 9
  56, // 10
  64, // 11
  72, // 12
  80, // 13
] as const;

export const getSpacing = (index: number): number =>
  spacingMap[index] || spacingMap[spacingMap.length - 1];

/**
 * Color utilities for building color-based styles
 */
export const colorUtils = {
  success: "#10b981",
  danger: "#ef4444",
  primary: "#3b82f6",
  info: "#9c27b0",
  warning: "#f59e0b",

  text: "#111827",
  textLight: "#f3f4f6",
  background: "#ffffff",
  backgroundDark: "#111827",
  border: "#e5e7eb",
};

/**
 * Combine styles with proper spacing (gap) for layout
 */
export const flexLayout = (
  gap: number = 16,
  direction: "row" | "column" = "row",
) => ({
  display: "flex",
  flexDirection: direction,
  gap: `${gap}px`,
});

/**
 * Grid layout helper
 */
export const gridLayout = (minWidth: number = 300) => ({
  display: "grid",
  gridTemplateColumns: `repeat(auto-fit, minmax(${minWidth}px, 1fr))`,
  gap: "16px",
});
