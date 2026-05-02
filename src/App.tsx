import { useEffect, useRef, useState } from 'react';

type Hero = {
  title: string;
  role: string;
  company: string;
  tagline: string;
  profileImage: string;
  stats: { label: string; value: string }[];
  summary: string;
};

type SliderItem = {
  id: string;
  type: 'image' | 'video';
  title: string;
  subtitle: string;
  src: string;
  caption: string;
};

type Skill = {
  name: string;
  level: number;
  icon: string;
  description: string;
};

type ToolCategory = {
  category: string;
  tags: string[];
};

type Experience = {
  year: string;
  company: string;
  role: string;
  location: string;
  description: string;
};

type Contact = {
  email: string;
  linkedin: string;
  github: string;
};

type PortfolioData = {
  hero: Hero;
  sliderItems: SliderItem[];
  about: string;
  skills: Skill[];
  toolCategories: ToolCategory[];
  experience: Experience[];
  contact: Contact;
  recentActivity: { date: string; activity: string }[];
};

type PortfolioTheme = 'light' | 'mint' | 'dark';

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/$/, '');
const THEME_STORAGE_KEY = 'portfolio_theme';
const themeLabels: Record<PortfolioTheme, string> = {
  light: 'Light',
  mint: 'Fresh',
  dark: 'Dark'
};

const readStoredTheme = (): PortfolioTheme => {
  try {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    return storedTheme === 'mint' || storedTheme === 'dark' ? storedTheme : 'light';
  } catch {
    return 'light';
  }
};

const apiUrl = (path: string): string => `${BACKEND_URL}${path}`;

const mediaUrl = (src: string): string => {
  if (src.startsWith('/uploads/')) return apiUrl(src);
  return src;
};

const mediaFallbackUrl = (src: string): string => {
  const url = mediaUrl(src);
  return `${url}${url.includes('?') ? '&' : '?'}v=${Date.now()}`;
};

const detectSliderMediaType = (slide: SliderItem): 'image' | 'video' => {
  if (slide.type === 'video') return 'video';
  const cleanUrl = slide.src.split('?')[0].toLowerCase();
  return /\.(mp4|webm|ogg|ogv|mov|m4v)$/i.test(cleanUrl) ? 'video' : 'image';
};

let portfolioLoadPromise: Promise<PortfolioData> | null = null;

const fetchPortfolio = async (): Promise<PortfolioData> => {
  const response = await fetch(apiUrl('/api/data?visit=1'), { cache: 'no-store' });
  if (!response.ok) {
    throw new Error('Unable to load portfolio content');
  }
  return response.json();
};

const loadPortfolioOnce = (): Promise<PortfolioData> => {
  if (!portfolioLoadPromise) {
    portfolioLoadPromise = fetchPortfolio();
  }
  return portfolioLoadPromise;
};

const getInitials = (value: string): string => {
  const initials = value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
  return initials || 'PF';
};

function App(): JSX.Element {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [activeSlide, setActiveSlide] = useState<number>(0);
  const [theme, setTheme] = useState<PortfolioTheme>(readStoredTheme);
  const [error, setError] = useState<string>('');
  const [isThemePulling, setIsThemePulling] = useState<boolean>(false);
  const [headerSuccess, setHeaderSuccess] = useState<string>('');
  const [isHeroFlipped, setIsHeroFlipped] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [profileImageFailed, setProfileImageFailed] = useState<boolean>(false);
  const slideTimer = useRef<number>();
  const touchStartX = useRef<number | null>(null);
  const headerSuccessTimer = useRef<number>();

  useEffect((): void => {
    document.documentElement.dataset.portfolioTheme = theme;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Theme persistence is a convenience; the UI still works without storage.
    }
  }, [theme]);

  useEffect((): void => {
    loadPortfolioOnce()
      .then(setData)
      .catch((err: Error) => setError(err.message));
  }, []);

  useEffect((): void => {
    setProfileImageFailed(false);
  }, [data?.hero.profileImage]);

  useEffect((): (() => void) | undefined => {
    if (!data) return;
    window.clearInterval(slideTimer.current);
    slideTimer.current = window.setInterval((): void => {
      setActiveSlide((prev: number) => (data.sliderItems.length ? (prev + 1) % data.sliderItems.length : 0));
    }, 6500);
    return () => window.clearInterval(slideTimer.current);
  }, [data]);

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

  const handleThemeChange = (nextTheme: PortfolioTheme): void => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch {
      // Ignore storage failures and still apply the theme for this page load.
    }
    setTheme(nextTheme);
  };

  const handleThemePull = (): void => {
    const themeOptions = Object.keys(themeLabels) as PortfolioTheme[];
    const nextTheme = themeOptions[(themeOptions.indexOf(theme) + 1) % themeOptions.length];
    setIsThemePulling(true);
    triggerHeaderSuccess('theme');
    handleThemeChange(nextTheme);
    window.setTimeout(() => setIsThemePulling(false), 720);
  };

  const triggerHeaderSuccess = (key: string): void => {
    window.clearTimeout(headerSuccessTimer.current);
    setHeaderSuccess(key);
    headerSuccessTimer.current = window.setTimeout(() => setHeaderSuccess(''), 920);
  };

  const handleHeaderNavigation = (item: string, event: React.MouseEvent<HTMLAnchorElement>): void => {
    event.preventDefault();
    const targetId = item.toLowerCase();
    triggerHeaderSuccess(targetId);
    window.setTimeout(() => {
      document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.history.replaceState(null, '', `#${targetId}`);
    }, 420);
  };

  const handleBrandClick = (): void => {
    triggerHeaderSuccess('brand');
    window.setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      window.history.replaceState(null, '', window.location.pathname);
    }, 420);
  };

  const handleHeroCardKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setIsHeroFlipped((prev) => !prev);
    }
  };

  const openProfileModal = (event: React.MouseEvent): void => {
    event.preventDefault();
    event.stopPropagation();
    setIsProfileModalOpen(true);
  };

  const profileImageSrc = data?.hero.profileImage ? mediaUrl(data.hero.profileImage) : '';

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
        <h1 className="text-4xl font-syne font-bold mb-4 text-cyber-accent">Portfolio load failed</h1>
        <p className="text-cyber-muted">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
        <div className="spinner mb-6"></div>
        <p className="text-cyber-muted">Loading portfolio ...</p>
      </div>
    );
  }

  return (
    <div className={`portfolio-app min-h-screen theme-${theme}`}>
      <div className="ambient-ribbon" aria-hidden="true"></div>
      {/* Navigation */}
      <nav className="portfolio-nav fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-5 px-6 md:px-8 bg-black/55 border-b border-white/8 backdrop-blur-3xl">
        <button
          className={`portfolio-brand header-action flex items-center gap-4 min-w-0 ${headerSuccess === 'brand' ? 'header-action-success' : ''}`}
          type="button"
          onClick={handleBrandClick}
          aria-label="Go to top"
        >
          <div className="brand-tube">{getInitials(data.hero.title)}</div>
          <div className="min-w-0">
            <p className="m-0 font-syne text-lg tracking-widest uppercase truncate">{data.hero.title}</p>
            <p className="m-0 text-cyber-muted text-xs">{data.hero.role}</p>
          </div>
          <span className="header-success-mark" aria-hidden="true"></span>
        </button>
        <div className="portfolio-nav-actions flex items-center gap-5 flex-wrap">
          <div className="portfolio-links hidden md:flex gap-6 flex-wrap">
            {['About', 'Skills', 'Tools', 'Experience', 'Contact'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className={`header-action text-cyber-muted hover:text-cyber-accent transition-colors ${headerSuccess === item.toLowerCase() ? 'header-action-success' : ''}`}
                onClick={(event) => handleHeaderNavigation(item, event)}
              >
                {item}
                <span className="header-success-mark" aria-hidden="true"></span>
              </a>
            ))}
          </div>
          <div
            className={`theme-pull-switch header-action ${isThemePulling ? 'theme-pull-active' : ''} ${headerSuccess === 'theme' ? 'header-action-success' : ''}`}
            onClick={handleThemePull}
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

      <main className="pt-28">
        {/* Hero Section */}
        <section className="reveal hero-stage max-w-6xl mx-auto px-8 py-12 mb-8 grid grid-cols-1 lg:grid-cols-[0.88fr_1.12fr] gap-10 items-stretch">
          <div className="tech-backdrop" aria-hidden="true">
            <span className="side-gear"></span>
          </div>
          <div className="flex flex-col gap-6">
            <div
              className={`hero-flip-card ${isHeroFlipped ? 'hero-flip-card-active' : ''}`}
              role="button"
              tabIndex={0}
              onClick={() => setIsHeroFlipped((prev) => !prev)}
              onKeyDown={handleHeroCardKeyDown}
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

                <div className="hero-book-panel hero-flip-face hero-flip-back" aria-hidden={!isHeroFlipped}>
                  <div
                    className="profile-photo-stage"
                    onClick={(event) => event.stopPropagation()}
                    onDoubleClick={openProfileModal}
                  >
                    {profileImageSrc && !profileImageFailed ? (
                      <img
                        src={profileImageSrc}
                        alt={data.hero.title}
                        className="profile-photo-tilted"
                        onError={() => setProfileImageFailed(true)}
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
                <strong className="text-cyber-accent">Animated profile</strong>
                <p className="text-sm text-cyber-muted">A calm, light portfolio surface with motion that stays out of the way.</p>
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
              <div
                className="slider-perspective"
                onTouchStart={handleSliderTouchStart}
                onTouchEnd={handleSliderTouchEnd}
              >
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
                <button
                  className="slider-arrow slider-arrow-prev"
                  type="button"
                  onClick={() => goToSlide(activeSlide - 1)}
                  aria-label="Previous slide"
                >
                  &lsaquo;
                </button>
                <button
                  className="slider-arrow slider-arrow-next"
                  type="button"
                  onClick={() => goToSlide(activeSlide + 1)}
                  aria-label="Next slide"
                >
                  &rsaquo;
                </button>
              </div>
              <div className="code-window mt-8">
                <div className="code-dots"><span></span><span></span><span></span></div>
                <p className="code-label">QA Showcase</p>
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
                      onClick={() => goToSlide(index)}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="reveal max-w-5xl mx-auto px-8 py-12 cyber-panel rounded-4xl mb-8">
          <div className="flex items-center gap-4 mb-6">
            <span className="text-cyber-accent tracking-widest uppercase text-sm">01</span>
            <h2 className="m-0 font-syne text-4xl">About</h2>
          </div>
          <p className="text-cyber-muted leading-relaxed">{data.about}</p>
        </section>

        {/* Skills Section */}
        <section id="skills" className="reveal max-w-5xl mx-auto px-8 py-12 cyber-panel rounded-4xl mb-8">
          <div className="flex items-center gap-4 mb-6">
            <span className="text-cyber-accent tracking-widest uppercase text-sm">02</span>
            <h2 className="m-0 font-syne text-4xl">Skills</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.skills.map((skill) => (
              <div key={skill.name} className="p-6 rounded-2xl bg-white/3 border border-white/8">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">{skill.icon}</span>
                  <h3 className="m-0">{skill.name}</h3>
                </div>
                <div className="h-3 rounded-full bg-white/8 overflow-hidden mb-3">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyber-accent/95 to-cyber-accent/40 transition-all duration-[1400ms]"
                    style={{ width: `${skill.level}%` }}
                  />
                </div>
                <p className="text-cyber-muted text-sm leading-relaxed m-0">{skill.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Tools Section */}
        <section id="tools" className="reveal max-w-5xl mx-auto px-8 py-12 cyber-panel rounded-4xl mb-8">
          <div className="flex items-center gap-4 mb-6">
            <span className="text-cyber-accent tracking-widest uppercase text-sm">03</span>
            <h2 className="m-0 font-syne text-4xl">Tools</h2>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {data.toolCategories.map((group) => (
              <div key={group.category} className="p-6 rounded-2xl bg-white/3 border border-white/8">
                <h3 className="m-0 mb-4">{group.category}</h3>
                <div className="flex flex-wrap gap-2">
                  {group.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex px-4 py-2 rounded-full bg-cyber-accent/12 text-blue-100 text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Experience Section */}
        <section id="experience" className="reveal max-w-5xl mx-auto px-8 py-12 cyber-panel rounded-4xl mb-8">
          <div className="flex items-center gap-4 mb-6">
            <span className="text-cyber-accent tracking-widest uppercase text-sm">04</span>
            <h2 className="m-0 font-syne text-4xl">Experience</h2>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {data.experience.map((item) => (
              <div key={item.company} className="grid grid-cols-[120px_1fr] gap-4 p-6 rounded-2xl bg-white/3 border border-white/8">
                <div className="text-cyber-accent text-sm font-bold uppercase tracking-wider">{item.year}</div>
                <div>
                  <h3 className="m-0 mb-2">{item.role}</h3>
                  <p className="text-cyber-muted text-sm mb-2">{item.company} / {item.location}</p>
                  <p className="text-cyber-muted text-sm leading-relaxed m-0">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="reveal max-w-5xl mx-auto px-8 py-12 cyber-panel rounded-4xl mb-8">
          <div className="flex items-center gap-4 mb-6">
            <span className="text-cyber-accent tracking-widest uppercase text-sm">05</span>
            <h2 className="m-0 font-syne text-4xl">Contact</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white/3 border border-white/8 lg:col-span-2">
              <h3 className="m-0 mb-4">Contact</h3>
              <div className="space-y-2">
                <a href={`mailto:${data.contact.email}`} className="flex gap-2 text-cyber-text hover:text-cyber-accent transition">
                  <strong>Email:</strong> {data.contact.email}
                </a>
                <a
                  href={`https://${data.contact.linkedin}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex gap-2 text-cyber-text hover:text-cyber-accent transition"
                >
                  <strong>LinkedIn:</strong> {data.contact.linkedin}
                </a>
                <a
                  href={`https://${data.contact.github}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex gap-2 text-cyber-text hover:text-cyber-accent transition"
                >
                  <strong>GitHub:</strong> {data.contact.github}
                </a>
              </div>
            </div>
            <div
              className="p-6 rounded-2xl bg-gradient-to-b from-cyber-accent/8 to-cyan-900/50 border border-white/8"
            >
              <h3 className="m-0 mb-3">{data.hero.tagline}</h3>
              <p className="text-cyber-muted text-sm leading-relaxed mb-4">{data.hero.summary}</p>
              <div className="flex flex-wrap gap-2">
                {data.skills.slice(0, 4).map((skill) => (
                  <span key={skill.name} className="inline-flex px-3 py-1 rounded-full bg-cyber-accent/12 text-blue-100 text-xs">
                    {skill.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="text-center py-8 px-4 text-cyber-muted">
        Full stack portfolio built with React, TypeScript, Node, and Express.
      </footer>

      {isProfileModalOpen && (
        <div className="profile-modal" role="dialog" aria-modal="true" aria-labelledby="profile-modal-title" onClick={() => setIsProfileModalOpen(false)}>
          <div className="profile-modal-panel" onClick={(event) => event.stopPropagation()}>
            <button className="profile-modal-close" type="button" onClick={() => setIsProfileModalOpen(false)} aria-label="Close profile details">
              ×
            </button>
            <div className="profile-modal-media">
              {profileImageSrc && !profileImageFailed ? (
                <img src={profileImageSrc} alt={data.hero.title} onError={() => setProfileImageFailed(true)} />
              ) : (
                <div className="profile-modal-fallback">{getInitials(data.hero.title)}</div>
              )}
            </div>
            <div className="profile-modal-content">
              <span className="profile-modal-kicker">{data.hero.tagline}</span>
              <h2 id="profile-modal-title">{data.hero.title}</h2>
              <p>{data.hero.summary}</p>
              <div className="profile-modal-details">
                <span>{data.hero.role}</span>
                <span>{data.hero.company}</span>
                <span>{data.contact.email}</span>
              </div>
              <div className="profile-modal-stats">
                {data.hero.stats.map((stat) => (
                  <div key={stat.label}>
                    <strong>{stat.value}</strong>
                    <span>{stat.label}</span>
                  </div>
                ))}
              </div>
              <div className="profile-modal-skills">
                {data.skills.map((skill) => (
                  <article key={skill.name}>
                    <div>
                      <span>{skill.icon}</span>
                      <strong>{skill.name}</strong>
                    </div>
                    <p>{skill.description}</p>
                    <i style={{ width: `${skill.level}%` }}></i>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
