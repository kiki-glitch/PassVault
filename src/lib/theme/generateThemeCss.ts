import type { Theme } from "@/types/theme";

export function generateThemeCss(theme: Theme): string {
  const { colors, fonts, radius } = theme;

  return `
:root {
  --vault-bg: ${colors.lightBackground};
  --vault-card: ${colors.lightCard};
  --vault-pink: ${colors.pink};
  --vault-blue: ${colors.blue};
  --vault-accent: ${colors.accent};
  --vault-support: ${colors.support};
  --vault-text: ${colors.foreground};
  --vault-text-muted: ${colors.foregroundMuted};
  --vault-text-faint: ${colors.foregroundFaint};
  --vault-inset: ${colors.insetSurface};
  --vault-border: ${colors.borderColor};
  --vault-overlay: ${colors.overlayColor};
  --vault-radius-panel: ${radius.panel};
  --vault-radius-card: ${radius.card};
  --vault-radius-input: ${radius.input};
  --vault-radius-chip: ${radius.chip};
  --vault-font-display: ${fonts.display};
  --vault-font-body: ${fonts.body};
}
.dark {
  --vault-bg: ${colors.darkBackground};
  --vault-card: ${colors.darkCard};
  --vault-text: ${colors.darkForeground};
  --vault-text-muted: ${colors.darkForegroundMuted};
  --vault-text-faint: ${colors.darkForegroundFaint};
  --vault-inset: ${colors.darkInsetSurface};
  --vault-border: ${colors.darkBorderColor};
  --vault-overlay: ${colors.darkOverlayColor};
}`.trim();
}
