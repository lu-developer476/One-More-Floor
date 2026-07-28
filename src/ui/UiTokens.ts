export const UI_TOKENS = {
  colors: {
    background: '#071018', elevated: '#0b1924', panel: '#102431', selected: '#17394a',
    border: '#526c7e', focus: '#5ef1ff', text: '#f4fbff', secondary: '#b5c9d4',
    disabled: '#71838d', primary: '#5ef1ff', warning: '#f5c84c', danger: '#ff7185',
    success: '#73e6a1', deltaPositive: '#73e6a1', deltaNegative: '#ff8b98',
  },
  typography: { hero: 42, screenTitle: 32, section: 20, body: 16, metadata: 14, prompt: 15 },
  spacing: { xxs: 4, xs: 8, sm: 12, md: 16, lg: 24, xl: 32, xxl: 48 },
  layout: { width: 960, height: 540, safe: 24, headerHeight: 82, footerHeight: 58, hitHeight: 44 },
} as const;

export const hexToNumber = (value: string): number => Number.parseInt(value.slice(1), 16);

const channel = (value: number): number => {
  const normalized = value / 255;
  return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
};
export const contrastRatio = (foreground: string, background: string): number => {
  const luminance = (hex: string) => {
    const raw = Number.parseInt(hex.slice(1), 16);
    return 0.2126 * channel((raw >> 16) & 255) + 0.7152 * channel((raw >> 8) & 255) + 0.0722 * channel(raw & 255);
  };
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (lighter! + 0.05) / (darker! + 0.05);
};
