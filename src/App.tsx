import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { ErrorScreen, LoaderScreen } from './components/feedback';
import { HeroSection } from './components/hero';
import { Navigation } from './components/navigation';
import { ProfileModal } from './components/profile';
import { AboutSection, ContactSection, ExperienceSection, SkillsSection, ToolsSection } from './components/sections';
import { useExternalOverlayCleanup } from './features/portfolio/hooks/useExternalOverlayCleanup';
import { usePortfolioData } from './features/portfolio/hooks/usePortfolioData';
import { usePortfolioTheme } from './features/portfolio/hooks/usePortfolioTheme';
import { useRevealOnScroll } from './features/portfolio/hooks/useRevealOnScroll';
import { useSliderControls } from './features/portfolio/hooks/useSliderControls';
import type { PortfolioTheme } from './types/portfolio';
import { smoothScrollTo } from './utils/smoothScroll';
import { mediaUrl, themeLabels } from './utils/portfolio';

function App(): JSX.Element {
  const { data, error } = usePortfolioData();
  const { theme, setTheme } = usePortfolioTheme();
  const { activeSlide, goToSlide, handleSliderTouchStart, handleSliderTouchEnd } = useSliderControls(data);
  const [isThemePulling, setIsThemePulling] = useState<boolean>(false);
  const [headerSuccess, setHeaderSuccess] = useState<string>('');
  const [isHeroFlipped, setIsHeroFlipped] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isStlcShowcaseOpen, setIsStlcShowcaseOpen] = useState<boolean>(false);
  const [profileImageFailed, setProfileImageFailed] = useState<boolean>(false);
  const lastProfilePhotoTap = useRef<number>(0);
  const headerSuccessTimer = useRef<number>();
  const stlcShowcaseTimer = useRef<number>();

  useExternalOverlayCleanup();
  useRevealOnScroll(data);

  useEffect((): (() => void) => {
    return () => window.clearTimeout(stlcShowcaseTimer.current);
  }, []);

  useEffect((): void => {
    setProfileImageFailed(false);
  }, [data?.hero.profileImage]);

  useEffect((): (() => void) => {
    const handleModalKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setIsProfileModalOpen(false);
      }
    };

    if (isProfileModalOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleModalKeyDown);
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleModalKeyDown);
    };
  }, [isProfileModalOpen]);

  const triggerHeaderSuccess = (key: string): void => {
    window.clearTimeout(headerSuccessTimer.current);
    setHeaderSuccess(key);
    headerSuccessTimer.current = window.setTimeout(() => setHeaderSuccess(''), 920);
  };

  const handleThemePull = (): void => {
    const themeOptions = Object.keys(themeLabels) as PortfolioTheme[];
    const nextTheme = themeOptions[(themeOptions.indexOf(theme) + 1) % themeOptions.length];
    setIsThemePulling(true);
    triggerHeaderSuccess('theme');
    setTheme(nextTheme);
    window.setTimeout(() => setIsThemePulling(false), 720);
  };

  const handleHeaderNavigation = (item: string, event: React.MouseEvent<HTMLAnchorElement>): void => {
    event.preventDefault();
    const targetId = item.toLowerCase();
    triggerHeaderSuccess(targetId);
    window.setTimeout(() => {
      const target = document.getElementById(targetId);
      if (target) {
        const navHeight = document.querySelector<HTMLElement>('.portfolio-nav')?.offsetHeight ?? 0;
        const top = target.getBoundingClientRect().top + window.scrollY - navHeight - 16;
        smoothScrollTo(top);
      }
      window.history.replaceState(null, '', `#${targetId}`);
    }, 420);
  };

  const handleBrandClick = (): void => {
    triggerHeaderSuccess('brand');
    window.setTimeout(() => {
      smoothScrollTo(0);
      window.history.replaceState(null, '', window.location.pathname);
    }, 420);
  };

  const handleBrandSymbolClick = (event: React.MouseEvent<HTMLDivElement>): void => {
    event.preventDefault();
    event.stopPropagation();
    window.clearTimeout(stlcShowcaseTimer.current);
    triggerHeaderSuccess('stlc');
    setIsStlcShowcaseOpen(true);
    stlcShowcaseTimer.current = window.setTimeout(() => {
      setIsStlcShowcaseOpen(false);
    }, 5000);
  };

  const handleHeroCardKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setIsHeroFlipped((prev) => !prev);
    }
  };

  const openProfileModal = (event: React.SyntheticEvent): void => {
    event.preventDefault();
    event.stopPropagation();
    setIsProfileModalOpen(true);
  };

  const handleProfilePhotoTouchEnd = (event: React.TouchEvent<HTMLDivElement>): void => {
    event.preventDefault();
    event.stopPropagation();
    const now = window.Date.now();
    if (now - lastProfilePhotoTap.current < 420) {
      lastProfilePhotoTap.current = 0;
      setIsProfileModalOpen(true);
      return;
    }
    lastProfilePhotoTap.current = now;
  };

  const profileImageSrc = data?.hero.profileImage ? mediaUrl(data.hero.profileImage) : '';

  if (error) {
    return <ErrorScreen message={error} />;
  }

  if (!data) {
    return <LoaderScreen />;
  }

  return (
    <div className={`portfolio-app min-h-screen theme-${theme}`}>
      <div className="ambient-ribbon" aria-hidden="true"></div>
      <Navigation
        data={data}
        theme={theme}
        isThemePulling={isThemePulling}
        headerSuccess={headerSuccess}
        isStlcShowcaseOpen={isStlcShowcaseOpen}
        onBrandClick={handleBrandClick}
        onBrandSymbolClick={handleBrandSymbolClick}
        onHeaderNavigation={handleHeaderNavigation}
        onThemePull={handleThemePull}
      />

      <main className="pt-28">
        <HeroSection
          data={data}
          theme={theme}
          activeSlide={activeSlide}
          isHeroFlipped={isHeroFlipped}
          profileImageSrc={profileImageSrc}
          profileImageFailed={profileImageFailed}
          onHeroFlip={setIsHeroFlipped}
          onHeroCardKeyDown={handleHeroCardKeyDown}
          onOpenProfileModal={openProfileModal}
          onProfilePhotoTouchEnd={handleProfilePhotoTouchEnd}
          onProfileImageFailed={() => setProfileImageFailed(true)}
          onSliderTouchStart={handleSliderTouchStart}
          onSliderTouchEnd={handleSliderTouchEnd}
          onGoToSlide={goToSlide}
        />
        <AboutSection data={data} />
        <SkillsSection data={data} />
        <ToolsSection data={data} />
        <ExperienceSection data={data} />
        <ContactSection data={data} />
      </main>

      {isProfileModalOpen && (
        <ProfileModal
          data={data}
          profileImageSrc={profileImageSrc}
          profileImageFailed={profileImageFailed}
          onClose={() => setIsProfileModalOpen(false)}
          onProfileImageFailed={() => setProfileImageFailed(true)}
        />
      )}
    </div>
  );
}

export default App;
