import { useEffect } from 'react';

export const useRevealOnScroll = (dependency: unknown): void => {
  useEffect((): (() => void) => {
    const observer = new IntersectionObserver(
      (entries: IntersectionObserverEntry[]): void => {
        entries.forEach((entry: IntersectionObserverEntry): void => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    document.querySelectorAll('.reveal').forEach((element: Element): void => observer.observe(element));
    return () => observer.disconnect();
  }, [dependency]);
};
