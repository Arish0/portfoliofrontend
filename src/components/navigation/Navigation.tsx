import type React from 'react';
import type { PortfolioData, PortfolioTheme } from '../../types/portfolio';
import { getInitials, stlcPhaseColors, stlcPhases, themeLabels } from '../../utils/portfolio';

type NavigationProps = {
  data: PortfolioData;
  theme: PortfolioTheme;
  isThemePulling: boolean;
  headerSuccess: string;
  isStlcShowcaseOpen: boolean;
  onBrandClick: () => void;
  onBrandSymbolClick: (event: React.MouseEvent<HTMLDivElement>) => void;
  onHeaderNavigation: (item: string, event: React.MouseEvent<HTMLAnchorElement>) => void;
  onThemePull: () => void;
};

export function Navigation({
  data,
  theme,
  isThemePulling,
  headerSuccess,
  isStlcShowcaseOpen,
  onBrandClick,
  onBrandSymbolClick,
  onHeaderNavigation,
  onThemePull
}: NavigationProps): JSX.Element {
  return (
    <nav className={`portfolio-nav fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-5 px-6 md:px-8 bg-black/55 border-b border-white/8 backdrop-blur-3xl ${isStlcShowcaseOpen ? 'stlc-mode-active' : ''}`}>
      <button
        className={`portfolio-brand header-action flex items-center gap-4 min-w-0 ${headerSuccess === 'brand' ? 'header-action-success' : ''}`}
        type="button"
        onClick={onBrandClick}
        aria-label="Go to top"
      >
        <div className="brand-tube" onClick={onBrandSymbolClick} title="Show STLC phases">{getInitials(data.hero.title)}</div>
        <div className="min-w-0">
          <p className="m-0 font-syne text-lg tracking-widest uppercase truncate">{data.hero.title}</p>
          <p className="m-0 text-cyber-muted text-xs">{data.hero.role}</p>
        </div>
        <span className="header-success-mark" aria-hidden="true"></span>
      </button>
      {isStlcShowcaseOpen && (
        <div className="stlc-header-flow" aria-live="polite">
          {stlcPhases.map((phase, index) => (
            <span
              key={phase}
              className="stlc-phase"
              style={{
                '--phase-index': index,
                '--phase-color': stlcPhaseColors[index][0],
                '--phase-color-2': stlcPhaseColors[index][1]
              } as React.CSSProperties}
            >
              <i>{String(index + 1).padStart(2, '0')}</i>
              <b>{phase}</b>
            </span>
          ))}
        </div>
      )}
      <div className="portfolio-nav-actions flex items-center gap-5 flex-wrap">
        <div className="portfolio-links hidden md:flex gap-6 flex-wrap">
          {['About', 'Skills', 'Tools', 'Experience', 'Contact'].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className={`header-action text-cyber-muted hover:text-cyber-accent transition-colors ${headerSuccess === item.toLowerCase() ? 'header-action-success' : ''}`}
              onClick={(event) => onHeaderNavigation(item, event)}
            >
              {item}
              <span className="header-success-mark" aria-hidden="true"></span>
            </a>
          ))}
        </div>
        <div
          className={`theme-pull-switch header-action ${isThemePulling ? 'theme-pull-active' : ''} ${headerSuccess === 'theme' ? 'header-action-success' : ''}`}
          onClick={onThemePull}
        >
          <button
            className="theme-bulb-button"
            type="button"
            aria-label={`Switch theme. Current theme is ${themeLabels[theme]}`}
          >
            <svg className="theme-bulb" viewBox="0 0 96 156" aria-hidden="true">
              <defs>
                <radialGradient id="themeBulbGlass" cx="36%" cy="28%" r="76%">
                  <stop offset="0%" stopColor="#fff8d8" />
                  <stop offset="42%" stopColor="#ffc766" />
                  <stop offset="78%" stopColor="#f97316" />
                  <stop offset="100%" stopColor="#7c2d12" />
                </radialGradient>
                <linearGradient id="themeBulbSocket" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#2b2722" />
                  <stop offset="100%" stopColor="#050505" />
                </linearGradient>
              </defs>
              <path className="theme-bulb-rope-core" d="M48 1 C48 18 48 35 48 52" />
              <path className="theme-bulb-rope-loop" d="M48 9 C33 20 30 40 39 55 C43 62 53 62 57 55 C66 40 63 20 48 9 Z" />
              <path className="theme-bulb-rope-wrap" d="M36 55 C43 49 53 49 60 55 M35 63 C43 56 53 56 61 63 M36 71 C43 65 53 65 60 71" />
              <rect className="theme-bulb-cap" x="34" y="73" width="28" height="18" rx="5" />
              <path className="theme-bulb-glass" d="M19 115 C19 98 31 88 48 88 C65 88 77 98 77 115 C77 137 64 151 48 151 C32 151 19 137 19 115 Z" />
              <path className="theme-bulb-smile" d="M36 124 C40 119 43 119 47 125 C51 119 55 119 60 124" />
              <path className="theme-bulb-shine" d="M36 101 C39 95 43 93 48 93" />
            </svg>
          </button>
          <span className="theme-pull-label">
            <span>Theme</span>
            <strong>{themeLabels[theme]}</strong>
          </span>
          <span className="header-success-mark" aria-hidden="true"></span>
        </div>
      </div>
    </nav>
  );
}
