import type { PortfolioData } from '../../../types/portfolio';

export const DEFAULT_BACKEND_URL = 'https://portfoliobackend-qfgh.onrender.com';
export const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || DEFAULT_BACKEND_URL).replace(/\/$/, '');

export const apiUrl = (path: string): string => `${BACKEND_URL}${path}`;

export const fetchPortfolio = async (): Promise<PortfolioData> => {
  const response = await fetch(apiUrl('/api/data?visit=1'), { cache: 'no-store' });
  if (!response.ok) {
    throw new Error('Unable to load portfolio content');
  }
  return response.json();
};
