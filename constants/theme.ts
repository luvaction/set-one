import { Platform } from "react-native";

const tintColorDark = "#00FF88";
const primaryLight = "#10B981"; // emerald green for light mode
export const Colors = {
  light: {
    text: "#11181C",
    textSecondary: "#687076",
    background: "#FFFFFF",
    surface: "#F5F5F5",
    card: "#FFFFFF",
    tint: primaryLight,
    icon: "#687076",
    tabIconDefault: "#687076",
    tabIconSelected: primaryLight,
    primary: primaryLight,
    border: "#E0E0E0",
  },
  dark: {
    // Set1 앱 다크모드 컬러
    text: "#FFFFFF",
    textSecondary: "#A0A0A0",
    background: "#0A0A0A",
    surface: "#1A1A1A",
    card: "#252525",
    tint: tintColorDark,
    icon: "#9BA1A6",
    tabIconDefault: "#666666",
    tabIconSelected: tintColorDark,
    primary: "#00FF88",
    border: "#333333",
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
