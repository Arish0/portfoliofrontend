import type React from 'react';
import type { PortfolioData } from '../../types/portfolio';

type ContentSectionsProps = {
  data: PortfolioData;
};

export function AboutSection({ data }: ContentSectionsProps): JSX.Element {
  return (
    <section id="about" className="reveal max-w-5xl mx-auto px-8 py-12 cyber-panel rounded-4xl mb-8">
      <div className="flex items-center gap-4 mb-6">
        <span className="text-cyber-accent tracking-widest uppercase text-sm">01</span>
        <h2 className="m-0 font-syne text-4xl">About</h2>
      </div>
      <p className="text-cyber-muted leading-relaxed">{data.about}</p>
    </section>
  );
}

export function SkillsSection({ data }: ContentSectionsProps): JSX.Element {
  return (
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
  );
}

export function ToolsSection({ data }: ContentSectionsProps): JSX.Element {
  return (
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
                <span key={tag} className="inline-flex px-4 py-2 rounded-full bg-cyber-accent/12 text-blue-100 text-sm">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ExperienceSection({ data }: ContentSectionsProps): JSX.Element {
  return (
    <section id="experience" className="reveal max-w-5xl mx-auto px-8 py-12 cyber-panel rounded-4xl mb-8">
      <div className="flex items-center gap-4 mb-6">
        <span className="text-cyber-accent tracking-widest uppercase text-sm">04</span>
        <h2 className="m-0 font-syne text-4xl">Experience</h2>
      </div>
      <div className="milestone-timeline">
        {data.experience.map((item, index) => (
          <article
            key={`${item.company}-${item.year}-${index}`}
            className="milestone-item grid grid-cols-[120px_1fr] gap-4 p-6 rounded-2xl bg-white/3 border border-white/8"
            style={{ '--milestone-index': index } as React.CSSProperties}
          >
            <div className="milestone-year text-cyber-accent text-sm font-bold uppercase tracking-wider">{item.year}</div>
            <div className="milestone-content">
              <h3 className="m-0 mb-2">{item.role}</h3>
              <p className="text-cyber-muted text-sm mb-2">{item.company} / {item.location}</p>
              <p className="text-cyber-muted text-sm leading-relaxed m-0">{item.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function ContactSection({ data }: ContentSectionsProps): JSX.Element {
  return (
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
        <div className="p-6 rounded-2xl bg-gradient-to-b from-cyber-accent/8 to-cyan-900/50 border border-white/8">
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
  );
}
