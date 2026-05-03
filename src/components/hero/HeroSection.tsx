import type React from 'react';
import type { PortfolioData, PortfolioTheme } from '../../types/portfolio';
import { detectSliderMediaType, getInitials, mediaFallbackUrl, mediaUrl, themeLabels } from '../../utils/portfolio';

type HeroSectionProps = {
  data: PortfolioData;
  theme: PortfolioTheme;
  activeSlide: number;
  isHeroFlipped: boolean;
  profileImageSrc: string;
  profileImageFailed: boolean;
  onHeroFlip: React.Dispatch<React.SetStateAction<boolean>>;
  onHeroCardKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  onOpenProfileModal: (event: React.SyntheticEvent) => void;
  onProfilePhotoTouchEnd: (event: React.TouchEvent<HTMLDivElement>) => void;
  onProfileImageFailed: () => void;
  onSliderTouchStart: (event: React.TouchEvent<HTMLDivElement>) => void;
  onSliderTouchEnd: (event: React.TouchEvent<HTMLDivElement>) => void;
  onGoToSlide: (index: number) => void;
};

export function HeroSection({
  data,
  theme,
  activeSlide,
  isHeroFlipped,
  profileImageSrc,
  profileImageFailed,
  onHeroFlip,
  onHeroCardKeyDown,
  onOpenProfileModal,
  onProfilePhotoTouchEnd,
  onProfileImageFailed,
  onSliderTouchStart,
  onSliderTouchEnd,
  onGoToSlide
}: HeroSectionProps): JSX.Element {
  return (
    <section className="reveal hero-stage max-w-6xl mx-auto px-8 py-12 mb-8 grid grid-cols-1 lg:grid-cols-[0.88fr_1.12fr] gap-10 items-stretch">
      <div className="tech-backdrop" aria-hidden="true">
        <span className="side-gear"></span>
      </div>
      <div className="flex flex-col gap-6">
        <div
          className={`hero-flip-card ${isHeroFlipped ? 'hero-flip-card-active' : ''}`}
          role="button"
          tabIndex={0}
          onClick={() => onHeroFlip((prev) => !prev)}
          onKeyDown={onHeroCardKeyDown}
          aria-label="Flip profile card"
        >
          <div className="hero-flip-inner">
            <div className="hero-book-panel hero-flip-face hero-flip-front">
              <div className="uppercase text-cyber-accent tracking-widest text-sm">{data.hero.tagline}</div>
              <div className="flex items-end gap-1 font-syne text-5xl leading-tight hero-title">
                <span>{data.hero.title}</span>
                <span className="text-cyber-accent">.</span>
              </div>
              <p className="max-w-2xl text-cyber-muted leading-relaxed">{data.hero.summary}</p>
              <div className="flex items-center gap-3 text-cyber-accent/60 uppercase tracking-wider text-sm">
                <span>{data.hero.role}</span>
                <span className="text-white/35">/</span>
                <span>{data.hero.company}</span>
              </div>
            </div>

            <div className="profile-card-back hero-flip-face hero-flip-back" aria-hidden={!isHeroFlipped}>
              <div
                className="profile-photo-stage"
                onClick={(event) => event.stopPropagation()}
                onDoubleClick={onOpenProfileModal}
                onTouchEnd={onProfilePhotoTouchEnd}
              >
                {profileImageSrc && !profileImageFailed ? (
                  <img
                    src={profileImageSrc}
                    alt={data.hero.title}
                    className="profile-photo-tilted"
                    onError={onProfileImageFailed}
                  />
                ) : (
                  <div className="profile-photo-fallback">{getInitials(data.hero.title)}</div>
                )}
              </div>
              <div className="profile-back-copy">
                <span className="profile-back-kicker">Double click photo</span>
                <h3>{data.hero.title}</h3>
                <p>{data.hero.role} at {data.hero.company}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="clock-console">
          <div className="clock-tube" aria-hidden="true">
            <span>{new Date().getHours().toString().padStart(2, '0')}</span>
            <span>{new Date().getMinutes().toString().padStart(2, '0')}</span>
            <span>{new Date().getDate().toString().padStart(2, '0')}</span>
          </div>
          <div>
            <strong className="text-cyber-accent">{data.hero.infoStripTitle || 'Animated profile'}</strong>
            <p className="text-sm text-cyber-muted">
              {data.hero.infoStripDescription || 'A calm, light portfolio surface with motion that stays out of the way.'}
            </p>
          </div>
          <span className="theme-chip">{themeLabels[theme]} theme</span>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {data.hero.stats.map((stat) => (
            <div key={stat.label} className="metric-tile">
              <span className="block text-cyber-muted text-xs uppercase tracking-widest">{stat.label}</span>
              <strong className="block mt-2 text-2xl">{stat.value}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center">
        <div className="hero-shell w-full relative">
          <div className="bug-scan-perch" aria-hidden="true">
            <div className="magnifier">
              <div className="magnifier-lens">
                <span className="bug bug-main"><i></i></span>
              </div>
              <div className="magnifier-handle"></div>
            </div>
          </div>
          <div className="slider-perspective" onTouchStart={onSliderTouchStart} onTouchEnd={onSliderTouchEnd}>
            {data.sliderItems.map((slide, index) => {
              const offset = index - activeSlide;
              const total = data.sliderItems.length;
              const wrappedOffset =
                Math.abs(offset) > total / 2 ? offset - Math.sign(offset) * total : offset;
              return (
                <article
                  key={slide.id}
                  className={`slide-card ${wrappedOffset === 0 ? 'slide-card-active' : 'slide-card-behind'}`}
                  style={{
                    transform: `translateX(${wrappedOffset * 42}%) translateY(${Math.abs(wrappedOffset) * 16}px) translateZ(${wrappedOffset === 0 ? 130 : -60}px) rotateY(${wrappedOffset * -22}deg) scale(${wrappedOffset === 0 ? 1 : 0.86})`,
                    opacity: Math.abs(wrappedOffset) > 1 ? 0 : wrappedOffset === 0 ? 1 : 0.72,
                    zIndex: 10 - Math.abs(wrappedOffset)
                  }}
                >
                  <div className="slide-media">
                    {slide.src && detectSliderMediaType(slide) === 'video' ? (
                      <video src={mediaUrl(slide.src)} className="w-full h-96 object-cover" muted loop playsInline autoPlay />
                    ) : slide.src ? (
                      <img
                        src={mediaUrl(slide.src)}
                        alt={slide.title}
                        className="w-full h-96 object-cover"
                        onError={(event) => {
                          const image = event.currentTarget;
                          if (image.dataset.retried === 'true') return;
                          image.dataset.retried = 'true';
                          image.src = mediaFallbackUrl(slide.src);
                        }}
                      />
                    ) : (
                      <div className="w-full h-96 grid place-items-center bg-white/4 text-cyber-muted text-sm">
                        Media URL pending
                      </div>
                    )}
                  </div>
                  <div className="slide-copy">
                    <span className="inline-flex uppercase text-cyber-accent text-sm font-bold tracking-wider">{slide.subtitle}</span>
                    <h3 className="text-3xl font-bold m-0">{slide.title}</h3>
                    <p className="text-cyber-muted leading-relaxed">{slide.caption}</p>
                  </div>
                </article>
              );
            })}
            <button className="slider-arrow slider-arrow-prev" type="button" onClick={() => onGoToSlide(activeSlide - 1)} aria-label="Previous slide">
              &lsaquo;
            </button>
            <button className="slider-arrow slider-arrow-next" type="button" onClick={() => onGoToSlide(activeSlide + 1)} aria-label="Next slide">
              &rsaquo;
            </button>
          </div>
          <div className="code-window mt-8">
            <div className="code-dots"><span></span><span></span><span></span></div>
            <p className="code-label">{data.hero.showcaseLabel || 'QA Showcase'}</p>
            <div className="showcase-copy">
              <strong>{data.hero.title}</strong>
              <p>{data.hero.summary}</p>
            </div>
          </div>
          <div className="flex justify-between items-center mt-6">
            <span className="slide-counter text-cyber-muted text-sm">{activeSlide + 1} / {data.sliderItems.length}</span>
            <div className="slider-dots flex gap-2">
              {data.sliderItems.map((item, index) => (
                <button
                  key={item.id}
                  className={`slider-dot ${index === activeSlide ? 'slider-dot-active' : ''}`}
                  onClick={() => onGoToSlide(index)}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
