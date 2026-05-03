type SmoothScrollOptions = {
  duration?: number;
};

let activeFrame = 0;

const easeInOutCubic = (progress: number): number =>
  progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;

export const cancelSmoothScroll = (): void => {
  if (!activeFrame) return;
  window.cancelAnimationFrame(activeFrame);
  activeFrame = 0;
};

export const smoothScrollTo = (top: number, { duration = 900 }: SmoothScrollOptions = {}): void => {
  cancelSmoothScroll();

  const target = Math.max(0, top);
  const start = window.scrollY;
  const distance = target - start;

  if (Math.abs(distance) < 1) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.scrollTo({ top: target, left: 0 });
    return;
  }

  const startTime = window.performance.now();

  const step = (currentTime: number): void => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    window.scrollTo({ top: start + distance * easeInOutCubic(progress), left: 0 });

    if (progress < 1) {
      activeFrame = window.requestAnimationFrame(step);
      return;
    }

    activeFrame = 0;
  };

  activeFrame = window.requestAnimationFrame(step);
};
