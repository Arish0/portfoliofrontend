import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import type { PortfolioData } from '../../../types/portfolio';

export const useSliderControls = (data: PortfolioData | null): {
  activeSlide: number;
  goToSlide: (index: number) => void;
  handleSliderTouchStart: (event: React.TouchEvent<HTMLDivElement>) => void;
  handleSliderTouchEnd: (event: React.TouchEvent<HTMLDivElement>) => void;
} => {
  const [activeSlide, setActiveSlide] = useState<number>(0);
  const slideTimer = useRef<number>();
  const touchStartX = useRef<number | null>(null);

  const goToSlide = (index: number): void => {
    if (!data?.sliderItems.length) return;
    setActiveSlide((index + data.sliderItems.length) % data.sliderItems.length);
  };

  const handleSliderTouchStart = (event: React.TouchEvent<HTMLDivElement>): void => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const handleSliderTouchEnd = (event: React.TouchEvent<HTMLDivElement>): void => {
    if (touchStartX.current === null || !data?.sliderItems.length) return;
    const touchEndX = event.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = touchEndX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 36) return;
    goToSlide(activeSlide + (delta < 0 ? 1 : -1));
  };

  useEffect((): (() => void) | undefined => {
    if (!data) return;
    window.clearInterval(slideTimer.current);
    slideTimer.current = window.setInterval((): void => {
      setActiveSlide((prev: number) => (data.sliderItems.length ? (prev + 1) % data.sliderItems.length : 0));
    }, 6500);
    return () => window.clearInterval(slideTimer.current);
  }, [data]);

  useEffect((): (() => void) => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (!data?.sliderItems.length) return;
      if (event.key === 'ArrowRight') {
        setActiveSlide((prev) => (prev + 1) % data.sliderItems.length);
      }
      if (event.key === 'ArrowLeft') {
        setActiveSlide((prev) => (prev - 1 + data.sliderItems.length) % data.sliderItems.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [data]);

  return { activeSlide, goToSlide, handleSliderTouchStart, handleSliderTouchEnd };
};
