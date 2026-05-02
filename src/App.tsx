import { useEffect, useRef, useState } from 'react';

type Hero = {
  title: string;
  role: string;
  company: string;
  tagline: string;
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
  const slideTimer = useRef<number>();

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
      <nav className="portfolio-nav fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 bg-black/55 border-b border-white/8 backdrop-blur-3xl">
        <div className="flex items-center gap-4">
          <div className="brand-tube">{getInitials(data.hero.title)}</div>
          <div>
            <p className="m-0 font-syne text-lg tracking-widest uppercase">{data.hero.title}</p>
            <p className="m-0 text-cyber-muted text-xs">{data.hero.role}</p>
          </div>
        </div>
        <div className="flex items-center gap-5 flex-wrap">
          <div className="hidden md:flex gap-6 flex-wrap">
            {['About', 'Skills', 'Tools', 'Experience', 'Contact'].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-cyber-muted hover:text-cyber-accent transition-colors">
                {item}
              </a>
            ))}
          </div>
          <label className="theme-picker">
            <span>Theme</span>
            <select value={theme} onChange={(event) => setTheme(event.target.value as PortfolioTheme)}>
              {(Object.keys(themeLabels) as PortfolioTheme[]).map((themeOption) => (
                <option key={themeOption} value={themeOption}>
                  {themeLabels[themeOption]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </nav>

      <main className="pt-28">
        {/* Hero Section */}
        <section className="reveal hero-stage max-w-6xl mx-auto px-8 py-12 mb-8 grid grid-cols-1 lg:grid-cols-[0.88fr_1.12fr] gap-10 items-stretch">
          <div className="flex flex-col gap-6">
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
              <div className="slider-perspective">
                {data.sliderItems.map((slide, index) => {
                  const offset = index - activeSlide;
                  const total = data.sliderItems.length;
                  const wrappedOffset =
                    Math.abs(offset) > total / 2 ? offset - Math.sign(offset) * total : offset;
                  return (
                    <article
                      key={slide.id}
                      className="slide-card"
                      style={{
                        transform: `translateX(${wrappedOffset * 34}%) translateZ(${wrappedOffset === 0 ? 90 : -90}px) rotateY(${wrappedOffset * -42}deg) scale(${wrappedOffset === 0 ? 1 : 0.78})`,
                        opacity: Math.abs(wrappedOffset) > 1 ? 0 : wrappedOffset === 0 ? 1 : 0.5,
                        zIndex: 10 - Math.abs(wrappedOffset)
                      }}
                    >
                      <div className="slide-media">
                        {slide.src && detectSliderMediaType(slide) === 'video' ? (
                          <video src={mediaUrl(slide.src)} className="w-full h-96 object-cover" muted loop playsInline autoPlay />
                        ) : slide.src ? (
                          <img src={mediaUrl(slide.src)} alt={slide.title} className="w-full h-96 object-cover" />
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
                <span className="text-cyber-muted text-sm">{activeSlide + 1} / {data.sliderItems.length}</span>
                <div className="flex gap-2">
                  {data.sliderItems.map((item, index) => (
                    <button
                      key={item.id}
                      className={`w-3 h-3 rounded-full transition-all ${
                        index === activeSlide
                          ? 'bg-cyber-accent scale-125 shadow-[0_0_18px_rgba(255,157,46,0.65)]'
                          : 'bg-white/10 border border-white/18'
                      }`}
                      onClick={() => setActiveSlide(index)}
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
    </div>
  );
}

export default App;
