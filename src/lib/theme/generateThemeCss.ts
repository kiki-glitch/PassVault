import type { Theme } from "@/types/theme";

export function generateThemeCss(theme: Theme): string {
  const { colors } = theme;

  return `
:root {
  --vault-bg: ${colors.lightBackground};
  --vault-card: ${colors.lightCard};
  --vault-pink: ${colors.pink};
  --vault-blue: ${colors.blue};
}
.dark {
  --vault-bg: ${colors.darkBackground};
  --vault-card: ${colors.darkCard};
}`.trim();
}
