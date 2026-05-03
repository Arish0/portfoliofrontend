import type { PortfolioTheme, SliderItem } from '../types/portfolio';
import { apiUrl, BACKEND_URL, DEFAULT_BACKEND_URL, fetchPortfolio } from '../features/portfolio/services/portfolioApi';

export { apiUrl, BACKEND_URL, DEFAULT_BACKEND_URL, fetchPortfolio };
export const THEME_STORAGE_KEY = 'portfolio_theme';

export const themeLabels: Record<PortfolioTheme, string> = {
  light: 'Light',
  mint: 'Fresh',
  dark: 'Dark'
};

export const stlcPhases = [
  'Contract Signing',
  'Requirement Analysis',
  'Test Planning',
  'Test Development',
  'Test Execution',
  'Defect Reporting',
  'Retest Defects',
  'Product Delivery'
];

export const stlcPhaseColors = [
  ['#2563eb', '#22d3ee'],
  ['#84cc16', '#22c55e'],
  ['#f97316', '#facc15'],
  ['#14b8a6', '#2dd4bf'],
  ['#0ea5e9', '#60a5fa'],
  ['#7c3aed', '#a78bfa'],
  ['#d97706', '#f59e0b'],
  ['#059669', '#34d399']
];

export const readStoredTheme = (): PortfolioTheme => {
  try {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    return storedTheme === 'mint' || storedTheme === 'dark' ? storedTheme : 'light';
  } catch {
    return 'light';
  }
};

export const mediaUrl = (src: string): string => {
  if (src.startsWith('/uploads/')) return apiUrl(src);
  return src;
};

export const mediaFallbackUrl = (src: string): string => {
  const url = mediaUrl(src);
  return `${url}${url.includes('?') ? '&' : '?'}v=${Date.now()}`;
};

export const detectSliderMediaType = (slide: SliderItem): 'image' | 'video' => {
  if (slide.type === 'video') return 'video';
  const cleanUrl = slide.src.split('?')[0].toLowerCase();
  return /\.(mp4|webm|ogg|ogv|mov|m4v)$/i.test(cleanUrl) ? 'video' : 'image';
};

export const getInitials = (value: string): string => {
  const initials = value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
  return initials || 'PF';
};
