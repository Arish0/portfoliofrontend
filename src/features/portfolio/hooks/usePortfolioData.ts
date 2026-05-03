import { useEffect, useState } from 'react';
import type { PortfolioData } from '../../../types/portfolio';
import { fetchPortfolio } from '../services/portfolioApi';

let portfolioLoadPromise: Promise<PortfolioData> | null = null;

const loadPortfolioOnce = (): Promise<PortfolioData> => {
  if (!portfolioLoadPromise) {
    portfolioLoadPromise = fetchPortfolio();
  }
  return portfolioLoadPromise;
};

export const usePortfolioData = (): {
  data: PortfolioData | null;
  error: string;
} => {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [error, setError] = useState<string>('');

  useEffect((): void => {
    loadPortfolioOnce()
      .then(setData)
      .catch((err: Error) => setError(err.message));
  }, []);

  return { data, error };
};
