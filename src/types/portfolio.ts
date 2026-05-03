export type Hero = {
  title: string;
  role: string;
  company: string;
  tagline: string;
  profileImage: string;
  stats: { label: string; value: string }[];
  summary: string;
};

export type SliderItem = {
  id: string;
  type: 'image' | 'video';
  title: string;
  subtitle: string;
  src: string;
  caption: string;
};

export type Skill = {
  name: string;
  level: number;
  icon: string;
  description: string;
};

export type ToolCategory = {
  category: string;
  tags: string[];
};

export type Experience = {
  year: string;
  company: string;
  role: string;
  location: string;
  description: string;
};

export type Contact = {
  email: string;
  linkedin: string;
  github: string;
};

export type PortfolioData = {
  hero: Hero;
  sliderItems: SliderItem[];
  about: string;
  skills: Skill[];
  toolCategories: ToolCategory[];
  experience: Experience[];
  contact: Contact;
  recentActivity: { date: string; activity: string }[];
};

export type PortfolioTheme = 'light' | 'mint' | 'dark';
