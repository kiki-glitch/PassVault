export type ThemeColors = {
  pink: string;
  blue: string;
  darkBackground: string;
  darkCard: string;
  lightBackground: string;
  lightCard: string;
};

export type ThemeCopy = {
  landingTitle: string;
  landingSubtitle: string;
  unlockTitle: string;
  unlockSubtitle: string;
  unlockButton: string;
  dashboardGreeting: string;
};

export type ThemeLabels = {
  passwords: string;
  notes: string;
  generator: string;
  security: string;
};

export type Theme = {
  id: string;
  appName: string;
  ownerInitial: string;
  copy: ThemeCopy;
  labels: ThemeLabels;
  colors: ThemeColors;
};
