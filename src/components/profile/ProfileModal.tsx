import type { PortfolioData } from '../../types/portfolio';
import { getInitials } from '../../utils/portfolio';

type ProfileModalProps = {
  data: PortfolioData;
  profileImageSrc: string;
  profileImageFailed: boolean;
  onClose: () => void;
  onProfileImageFailed: () => void;
};

export function ProfileModal({
  data,
  profileImageSrc,
  profileImageFailed,
  onClose,
  onProfileImageFailed
}: ProfileModalProps): JSX.Element {
  return (
    <div className="profile-modal" role="dialog" aria-modal="true" aria-labelledby="profile-modal-title" onClick={onClose}>
      <div className="profile-modal-panel" onClick={(event) => event.stopPropagation()}>
        <button className="profile-modal-close" type="button" onClick={onClose} aria-label="Close profile details">
          ×
        </button>
        <div className="profile-modal-media">
          {profileImageSrc && !profileImageFailed ? (
            <img src={profileImageSrc} alt={data.hero.title} onError={onProfileImageFailed} />
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
  );
}
