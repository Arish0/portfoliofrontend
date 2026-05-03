import { useEffect } from 'react';

export const useExternalOverlayCleanup = (): void => {
  useEffect((): (() => void) => {
    const isAcrobatWidget = (element: Element): boolean => {
      if (!(element instanceof HTMLElement)) return false;
      const signature = [
        element.id,
        element.className,
        element.getAttribute('aria-label'),
        element.getAttribute('title'),
        element.getAttribute('src'),
        element.getAttribute('href')
      ]
        .join(' ')
        .toLowerCase();
      if (signature.includes('adobe') || signature.includes('acrobat')) return true;
      if (!signature.includes('pdf')) return false;
      const style = window.getComputedStyle(element);
      return style.position === 'fixed' || style.position === 'sticky';
    };

    const isExternalBodyOverlay = (element: Element): boolean => {
      if (!(element instanceof HTMLElement)) return false;
      if (element.id === 'root') return false;
      if (element.closest('#root')) return false;
      if (['SCRIPT', 'STYLE', 'LINK'].includes(element.tagName)) return false;
      if (element.tagName === 'VITE-ERROR-OVERLAY') return false;
      return element.parentElement === document.body;
    };

    const removeAcrobatWidgets = (): void => {
      Array.from(document.body.children).forEach((element) => {
        if (isExternalBodyOverlay(element)) element.remove();
      });
      document.querySelectorAll('iframe, button, a, div, aside').forEach((element) => {
        if (isAcrobatWidget(element) || isExternalBodyOverlay(element)) element.remove();
      });
    };

    removeAcrobatWidgets();
    const observer = new MutationObserver(removeAcrobatWidgets);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);
};
