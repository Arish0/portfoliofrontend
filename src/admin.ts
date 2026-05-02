import './styles.css';
import './admin.css';
import { io, type Socket } from 'socket.io-client';

// Admin Panel Types
interface SliderItem {
  id: string;
  type: 'image' | 'video';
  title: string;
  subtitle: string;
  src: string;
  caption: string;
  _isNew?: boolean;
  _inputs?: {
    title: HTMLInputElement;
    subtitle: HTMLInputElement;
    src: HTMLInputElement;
    caption: HTMLTextAreaElement;
    type: HTMLSelectElement;
  };
}

interface Skill {
  name: string;
  level: number;
  icon: string;
  description: string;
  _inputs?: {
    name: HTMLInputElement;
    icon: HTMLInputElement;
    level: HTMLInputElement;
    description: HTMLTextAreaElement;
  };
}

interface ToolCategory {
  category: string;
  tags: string[];
  _inputs?: {
    category: HTMLInputElement;
    tags: HTMLTextAreaElement;
  };
}

interface Experience {
  year: string;
  company: string;
  role: string;
  location: string;
  description: string;
  _inputs?: {
    year: HTMLInputElement;
    company: HTMLInputElement;
    role: HTMLInputElement;
    location: HTMLInputElement;
    description: HTMLTextAreaElement;
  };
}

interface Contact {
  email: string;
  linkedin: string;
  github: string;
}

interface Activity {
  date: string;
  activity: string;
}

interface Visitor {
  _id?: string;
  viewedAt: string;
  firstViewedAt?: string;
  lastViewedAt?: string;
  ipAddress: string;
  browser: string;
  device: string;
  browserAccount: string;
  visitCount?: number;
}

interface PortfolioData {
  hero: {
    title: string;
    role: string;
    company: string;
    tagline: string;
    summary: string;
  };
  sliderItems: SliderItem[];
  skills: Skill[];
  toolCategories: ToolCategory[];
  experience: Experience[];
  contact: Contact;
  recentActivity: Activity[];
}

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/$/, '');
const SOCKET_URL = (import.meta.env.VITE_SOCKET_URL || BACKEND_URL).replace(/\/$/, '');
const ADMIN_AUTH_TOKEN_KEY = 'portfolio_admin_auth_token';
const ADMIN_CSRF_TOKEN_KEY = 'portfolio_admin_csrf_token';

function apiUrl(path: string): string {
  return `${BACKEND_URL}${path}`;
}

function stripEditorState<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripEditorState(item)) as T;
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => key !== '_inputs' && key !== '_isNew')
        .map(([key, item]) => [key, stripEditorState(item)])
    ) as T;
  }
  return value;
}

// DOM Elements
const loginCard = document.getElementById('loginCard') as HTMLDivElement;
const adminControls = document.getElementById('adminControls') as HTMLDivElement;
const loginBtn = document.getElementById('loginBtn') as HTMLButtonElement;
const logoutBtn = document.getElementById('logoutBtn') as HTMLButtonElement;
const saveBtn = document.getElementById('saveBtn') as HTMLButtonElement;
const loginError = document.getElementById('loginError') as HTMLDivElement;
const adminUsername = document.getElementById('adminUsername') as HTMLInputElement;
const adminPassword = document.getElementById('adminPassword') as HTMLInputElement;
const heroTitle = document.getElementById('heroTitle') as HTMLInputElement;
const heroRole = document.getElementById('heroRole') as HTMLInputElement;
const heroCompany = document.getElementById('heroCompany') as HTMLInputElement;
const heroTagline = document.getElementById('heroTagline') as HTMLInputElement;
const heroSummary = document.getElementById('heroSummary') as HTMLTextAreaElement;
const sliderList = document.getElementById('sliderList') as HTMLDivElement;
const addSliderItem = document.getElementById('addSliderItem') as HTMLButtonElement;
const skillsList = document.getElementById('skillsList') as HTMLDivElement;
const addSkill = document.getElementById('addSkill') as HTMLButtonElement;
const toolList = document.getElementById('toolList') as HTMLDivElement;
const addToolCategory = document.getElementById('addToolCategory') as HTMLButtonElement;
const experienceList = document.getElementById('experienceList') as HTMLDivElement;
const addExperience = document.getElementById('addExperience') as HTMLButtonElement;
const contactEmailInput = document.getElementById('contactEmailInput') as HTMLInputElement;
const contactLinkedinInput = document.getElementById('contactLinkedinInput') as HTMLInputElement;
const contactGithubInput = document.getElementById('contactGithubInput') as HTMLInputElement;
const activityDate = document.getElementById('activityDate') as HTMLInputElement;
const activityText = document.getElementById('activityText') as HTMLTextAreaElement;
const addActivityBtn = document.getElementById('addActivityBtn') as HTMLButtonElement;
const activityFeed = document.getElementById('activityFeed') as HTMLDivElement;
const visitorFeed = document.getElementById('visitorFeed') as HTMLDivElement;
const refreshVisitorsBtn = document.getElementById('refreshVisitorsBtn') as HTMLButtonElement;
const adminMenuLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>('.admin-menu-link'));

let portfolioData: PortfolioData | null = null;
let csrfToken = localStorage.getItem(ADMIN_CSRF_TOKEN_KEY) || sessionStorage.getItem(ADMIN_CSRF_TOKEN_KEY) || '';
let adminAuthToken = localStorage.getItem(ADMIN_AUTH_TOKEN_KEY) || sessionStorage.getItem(ADMIN_AUTH_TOKEN_KEY) || '';
let visitorSocketStarted = false;
let visitorSocket: Socket | null = null;
let visitorFallbackRefresh: number | null = null;

function showElement(element: HTMLElement): void {
  element.classList.remove('hidden', 'lazy-hidden');
}

function hideElement(element: HTMLElement): void {
  element.classList.add('hidden');
}

// Error handling
function showError(message: string): void {
  loginError.textContent = message;
  showElement(loginError);
}

function hideError(): void {
  hideElement(loginError);
}

function secureFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  if (csrfToken) {
    headers.set('X-CSRF-Token', csrfToken);
  }
  if (adminAuthToken) {
    headers.set('Authorization', `Bearer ${adminAuthToken}`);
  }
  const request = typeof input === 'string' && input.startsWith('/') ? apiUrl(input) : input;
  return fetch(request, { ...init, headers, cache: 'no-store', credentials: 'include' });
}

function storeAdminTokens(payload: { csrfToken?: string; authToken?: string }): void {
  csrfToken = payload.csrfToken || csrfToken;
  adminAuthToken = payload.authToken || adminAuthToken;
  if (csrfToken) {
    localStorage.setItem(ADMIN_CSRF_TOKEN_KEY, csrfToken);
    sessionStorage.setItem(ADMIN_CSRF_TOKEN_KEY, csrfToken);
  }
  if (adminAuthToken) {
    localStorage.setItem(ADMIN_AUTH_TOKEN_KEY, adminAuthToken);
    sessionStorage.setItem(ADMIN_AUTH_TOKEN_KEY, adminAuthToken);
  }
}

function clearAdminTokens(): void {
  csrfToken = '';
  adminAuthToken = '';
  localStorage.removeItem(ADMIN_CSRF_TOKEN_KEY);
  localStorage.removeItem(ADMIN_AUTH_TOKEN_KEY);
  sessionStorage.removeItem(ADMIN_CSRF_TOKEN_KEY);
  sessionStorage.removeItem(ADMIN_AUTH_TOKEN_KEY);
}

async function responseError(response: Response, fallback: string): Promise<Error> {
  try {
    const payload = await response.json() as { message?: string; reason?: string };
    return new Error(payload.message || payload.reason || fallback);
  } catch {
    return new Error(fallback);
  }
}

type ModalVariant = 'info' | 'success' | 'danger';

type AdminModalOptions = {
  title: string;
  message: string;
  variant?: ModalVariant;
  confirmText?: string;
  cancelText?: string;
};

type LoadingModal = {
  close: () => void;
  setSuccess: (title: string, message: string) => void;
  setError: (title: string, message: string) => void;
};

function createModalShell(variant: ModalVariant = 'info'): HTMLDivElement {
  const overlay = document.createElement('div');
  overlay.className = `admin-modal-overlay admin-modal-${variant}`;
  overlay.innerHTML = `
    <div class="admin-modal" role="dialog" aria-modal="true">
      <div class="admin-modal-glow"></div>
      <div class="admin-modal-header">
        <div class="admin-modal-mark"><span></span></div>
        <div>
          <h3 class="admin-modal-title"></h3>
          <p class="admin-modal-message"></p>
        </div>
      </div>
      <div class="admin-modal-loader hidden">
        <div class="tube-loader"><span></span><span></span><span></span></div>
        <p class="admin-modal-loading-text"></p>
      </div>
      <div class="admin-modal-actions"></div>
    </div>
  `;
  document.body.appendChild(overlay);
  return overlay;
}

function removeModal(overlay: HTMLDivElement): void {
  overlay.classList.add('admin-modal-leaving');
  window.setTimeout(() => overlay.remove(), 180);
}

function showNotice(options: AdminModalOptions): Promise<void> {
  return new Promise((resolve) => {
    const overlay = createModalShell(options.variant);
    overlay.querySelector<HTMLHeadingElement>('.admin-modal-title')!.textContent = options.title;
    overlay.querySelector<HTMLParagraphElement>('.admin-modal-message')!.textContent = options.message;
    overlay.querySelector<HTMLDivElement>('.admin-modal-actions')!.innerHTML = `
      <button class="admin-modal-btn admin-modal-primary">${options.confirmText || 'OK'}</button>
    `;
    overlay.querySelector<HTMLButtonElement>('.admin-modal-primary')!.addEventListener('click', () => {
      removeModal(overlay);
      resolve();
    });
  });
}

function showConfirm(options: AdminModalOptions): Promise<boolean> {
  return new Promise((resolve) => {
    const overlay = createModalShell(options.variant);
    overlay.querySelector<HTMLHeadingElement>('.admin-modal-title')!.textContent = options.title;
    overlay.querySelector<HTMLParagraphElement>('.admin-modal-message')!.textContent = options.message;
    overlay.querySelector<HTMLDivElement>('.admin-modal-actions')!.innerHTML = `
      <button class="admin-modal-btn admin-modal-secondary">${options.cancelText || 'Cancel'}</button>
      <button class="admin-modal-btn admin-modal-primary">${options.confirmText || 'Confirm'}</button>
    `;
    overlay.querySelector<HTMLButtonElement>('.admin-modal-secondary')!.addEventListener('click', () => {
      removeModal(overlay);
      resolve(false);
    });
    overlay.querySelector<HTMLButtonElement>('.admin-modal-primary')!.addEventListener('click', () => {
      removeModal(overlay);
      resolve(true);
    });
  });
}

function showLoading(title: string, message: string): LoadingModal {
  const overlay = createModalShell('info');
  overlay.querySelector<HTMLHeadingElement>('.admin-modal-title')!.textContent = title;
  overlay.querySelector<HTMLParagraphElement>('.admin-modal-message')!.textContent = message;
  overlay.querySelector<HTMLDivElement>('.admin-modal-loader')!.classList.remove('hidden');
  overlay.querySelector<HTMLParagraphElement>('.admin-modal-loading-text')!.textContent = 'Waiting for server response...';
  overlay.querySelector<HTMLDivElement>('.admin-modal-actions')!.innerHTML = '';

  const setResult = (variant: ModalVariant, resultTitle: string, resultMessage: string): void => {
    overlay.className = `admin-modal-overlay admin-modal-${variant}`;
    overlay.querySelector<HTMLHeadingElement>('.admin-modal-title')!.textContent = resultTitle;
    overlay.querySelector<HTMLParagraphElement>('.admin-modal-message')!.textContent = resultMessage;
    overlay.querySelector<HTMLDivElement>('.admin-modal-loader')!.classList.add('hidden');
    overlay.querySelector<HTMLDivElement>('.admin-modal-actions')!.innerHTML = `
      <button class="admin-modal-btn admin-modal-primary">Done</button>
    `;
    overlay.querySelector<HTMLButtonElement>('.admin-modal-primary')!.addEventListener('click', () => removeModal(overlay));
  };

  return {
    close: () => removeModal(overlay),
    setSuccess: (resultTitle, resultMessage) => setResult('success', resultTitle, resultMessage),
    setError: (resultTitle, resultMessage) => setResult('danger', resultTitle, resultMessage)
  };
}

// Utility functions
function renderArray<T>(
  list: T[],
  container: HTMLDivElement,
  renderer: (item: T, index: number) => HTMLElement
): void {
  container.innerHTML = '';
  list.forEach((item, index) => {
    container.appendChild(renderer(item, index));
  });
}

function buildField(labelText: string, element: HTMLElement): HTMLDivElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'space-y-2';
  const label = document.createElement('label');
  label.textContent = labelText;
  label.className = 'block text-cyber-muted text-sm';
  wrapper.appendChild(label);
  wrapper.appendChild(element);
  return wrapper;
}

function buildHelpText(text: string): HTMLParagraphElement {
  const help = document.createElement('p');
  help.className = 'text-xs text-cyber-muted';
  help.textContent = text;
  return help;
}

function detectSliderMediaType(url: string): 'image' | 'video' {
  const cleanUrl = url.split('?')[0].toLowerCase();
  if (/\.(mp4|webm|ogg|ogv|mov|m4v)$/i.test(cleanUrl)) {
    return 'video';
  }
  return 'image';
}

function removeItem<T>(list: T[], index: number): void {
  syncFormValues();
  list.splice(index, 1);
  refreshAllFields();
}

// Form creation functions
function createHeroForm(): void {
  if (!portfolioData) return;
  heroTitle.value = portfolioData.hero.title;
  heroRole.value = portfolioData.hero.role;
  heroCompany.value = portfolioData.hero.company;
  heroTagline.value = portfolioData.hero.tagline;
  heroSummary.value = portfolioData.hero.summary;
}

function createSliderCard(item: SliderItem, index: number): HTMLDivElement {
  const card = document.createElement('div');
  card.className = 'bg-cyber-panel border border-white/8 rounded-3xl p-6 space-y-4';
  card.innerHTML = `
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-syne font-bold">Slider item ${index + 1}</h3>
      <button class="remove-item px-4 py-1.5 rounded-full border border-red-500/30 bg-red-500/10 text-red-400 text-sm hover:border-red-500/50 transition">Remove</button>
    </div>
  `;

  const title = document.createElement('input');
  title.className = 'w-full px-4 py-2 rounded-2xl bg-white/4 border border-white/8 text-cyber-text focus:outline-none focus:border-cyber-accent';
  title.placeholder = 'Example: Automation Flow';
  title.value = item._isNew ? '' : item.title;

  const subtitle = document.createElement('input');
  subtitle.className = 'w-full px-4 py-2 rounded-2xl bg-white/4 border border-white/8 text-cyber-text focus:outline-none focus:border-cyber-accent';
  subtitle.placeholder = 'Example: Playwright in Action';
  subtitle.value = item._isNew ? '' : item.subtitle;

  const src = document.createElement('input');
  src.className = 'w-full px-4 py-2 rounded-2xl bg-white/4 border border-white/8 text-cyber-text focus:outline-none focus:border-cyber-accent';
  src.placeholder = 'Example: https://example.com/slider-video.mp4';
  src.value = item._isNew ? '' : item.src;

  const caption = document.createElement('textarea');
  caption.className = 'w-full px-4 py-2 rounded-2xl bg-white/4 border border-white/8 text-cyber-text focus:outline-none focus:border-cyber-accent min-h-24';
  caption.placeholder = 'Example: Short description for this slide.';
  caption.value = item._isNew ? '' : item.caption;

  const type = document.createElement('select');
  type.className = 'w-full px-4 py-2 rounded-2xl bg-white/4 border border-white/8 text-cyber-text focus:outline-none focus:border-cyber-accent';
  type.innerHTML = '<option value="image">Image</option><option value="video">Video</option>';
  type.value = item.type;

  const linkActions = document.createElement('div');
  linkActions.className = 'flex flex-wrap items-center gap-3';

  const applyLink = document.createElement('button');
  applyLink.type = 'button';
  applyLink.className = 'px-4 py-1.5 rounded-full border border-cyber-accent/30 bg-cyber-accent/10 text-cyber-accent text-sm hover:border-cyber-accent transition';
  applyLink.textContent = 'Apply link';

  const linkStatus = document.createElement('p');
  linkStatus.className = 'text-xs text-cyber-muted';
  linkStatus.textContent = 'Paste a direct image, GIF, or video URL.';

  applyLink.addEventListener('click', () => {
    const url = src.value.trim();
    if (!url) {
      linkStatus.textContent = 'Paste a media URL first.';
      linkStatus.className = 'text-xs text-red-300';
      return;
    }
    item.src = url;
    item.type = detectSliderMediaType(url);
    type.value = item.type;
    linkStatus.textContent = `${item.type === 'video' ? 'Video' : 'Image/GIF'} link applied. Save changes to keep it.`;
    linkStatus.className = 'text-xs text-cyber-accent';
  });

  src.addEventListener('blur', () => {
    const url = src.value.trim();
    if (!url) return;
    item.type = detectSliderMediaType(url);
    type.value = item.type;
  });

  linkActions.appendChild(applyLink);
  linkActions.appendChild(linkStatus);

  const upload = document.createElement('input');
  upload.className = 'w-full px-4 py-2 rounded-2xl bg-white/4 border border-white/8 text-cyber-text focus:outline-none focus:border-cyber-accent';
  upload.type = 'file';
  upload.accept = 'image/*,video/mp4,video/webm,video/ogg,video/quicktime,video/*';

  const uploadStatus = document.createElement('p');
  uploadStatus.className = 'text-xs text-cyber-muted';
  uploadStatus.textContent = 'Upload image/GIF/video files up to 10MB. The Source URL fills automatically.';

  upload.addEventListener('change', () => {
    const file = upload.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      upload.value = '';
      uploadStatus.textContent = 'File is too large. Maximum size is 10MB.';
      uploadStatus.className = 'text-xs text-red-300';
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    upload.disabled = true;
    uploadStatus.textContent = 'Uploading...';
    uploadStatus.className = 'text-xs text-cyber-muted';

    secureFetch('/api/upload/slider', {
      method: 'POST',
      body: formData
    })
      .then((res) => {
        if (!res.ok) throw new Error('Upload failed. Please use an image, GIF, or video under 10MB.');
        return res.json();
      })
      .then((payload: { url: string; type: 'image' | 'video' }) => {
        src.value = payload.url;
        type.value = payload.type;
        item.src = payload.url;
        item.type = payload.type;
        uploadStatus.textContent = 'Upload complete. Save changes to keep it.';
        uploadStatus.className = 'text-xs text-cyber-accent';
      })
      .catch((err: Error) => {
        uploadStatus.textContent = err.message;
        uploadStatus.className = 'text-xs text-red-300';
      })
      .finally(() => {
        upload.disabled = false;
        upload.value = '';
      });
  });

  card.appendChild(buildField('Title', title));
  card.appendChild(buildField('Subtitle', subtitle));
  const sourceField = buildField('Source URL', src);
  sourceField.appendChild(buildHelpText('Use a direct image/GIF/video URL. YouTube page links will not play as slider media.'));
  sourceField.appendChild(linkActions);
  card.appendChild(sourceField);
  const uploadField = buildField('Upload media', upload);
  uploadField.appendChild(uploadStatus);
  card.appendChild(uploadField);
  card.appendChild(buildField('Caption', caption));
  card.appendChild(buildField('Type', type));

  (card.querySelector('.remove-item') as HTMLButtonElement).addEventListener('click', () => {
    if (portfolioData) removeItem(portfolioData.sliderItems, index);
  });

  item._inputs = { title, subtitle, src, caption, type };
  return card;
}

function createSkillCard(item: Skill, index: number): HTMLDivElement {
  const card = document.createElement('div');
  card.className = 'bg-cyber-panel border border-white/8 rounded-3xl p-6 space-y-4';
  card.innerHTML = `
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-syne font-bold">Skill ${index + 1}</h3>
      <button class="remove-item px-4 py-1.5 rounded-full border border-red-500/30 bg-red-500/10 text-red-400 text-sm hover:border-red-500/50 transition">Remove</button>
    </div>
  `;

  const name = document.createElement('input');
  name.className = 'w-full px-4 py-2 rounded-2xl bg-white/4 border border-white/8 text-cyber-text focus:outline-none focus:border-cyber-accent';
  name.value = item.name;

  const icon = document.createElement('input');
  icon.className = 'w-full px-4 py-2 rounded-2xl bg-white/4 border border-white/8 text-cyber-text focus:outline-none focus:border-cyber-accent';
  icon.value = item.icon;

  const level = document.createElement('input');
  level.className = 'w-full px-4 py-2 rounded-2xl bg-white/4 border border-white/8 text-cyber-text focus:outline-none focus:border-cyber-accent';
  level.type = 'number';
  level.min = '0';
  level.max = '100';
  level.value = item.level.toString();

  const description = document.createElement('textarea');
  description.className = 'w-full px-4 py-2 rounded-2xl bg-white/4 border border-white/8 text-cyber-text focus:outline-none focus:border-cyber-accent min-h-24';
  description.value = item.description;

  card.appendChild(buildField('Name', name));
  card.appendChild(buildField('Icon', icon));
  card.appendChild(buildField('Level (0-100)', level));
  card.appendChild(buildField('Description', description));

  (card.querySelector('.remove-item') as HTMLButtonElement).addEventListener('click', () => {
    if (portfolioData) removeItem(portfolioData.skills, index);
  });

  item._inputs = { name, icon, level, description };
  return card;
}

function createToolCategoryCard(item: ToolCategory, index: number): HTMLDivElement {
  const card = document.createElement('div');
  card.className = 'bg-cyber-panel border border-white/8 rounded-3xl p-6 space-y-4';
  card.innerHTML = `
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-syne font-bold">Category ${index + 1}</h3>
      <button class="remove-item px-4 py-1.5 rounded-full border border-red-500/30 bg-red-500/10 text-red-400 text-sm hover:border-red-500/50 transition">Remove</button>
    </div>
  `;

  const category = document.createElement('input');
  category.className = 'w-full px-4 py-2 rounded-2xl bg-white/4 border border-white/8 text-cyber-text focus:outline-none focus:border-cyber-accent';
  category.value = item.category;

  const tags = document.createElement('textarea');
  tags.className = 'w-full px-4 py-2 rounded-2xl bg-white/4 border border-white/8 text-cyber-text focus:outline-none focus:border-cyber-accent min-h-24';
  tags.value = item.tags.join(', ');

  card.appendChild(buildField('Category name', category));
  card.appendChild(buildField('Tags (comma-separated)', tags));

  (card.querySelector('.remove-item') as HTMLButtonElement).addEventListener('click', () => {
    if (portfolioData) removeItem(portfolioData.toolCategories, index);
  });

  item._inputs = { category, tags };
  return card;
}

function createExperienceCard(item: Experience, index: number): HTMLDivElement {
  const card = document.createElement('div');
  card.className = 'bg-cyber-panel border border-white/8 rounded-3xl p-6 space-y-4';
  card.innerHTML = `
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-syne font-bold">Experience ${index + 1}</h3>
      <button class="remove-item px-4 py-1.5 rounded-full border border-red-500/30 bg-red-500/10 text-red-400 text-sm hover:border-red-500/50 transition">Remove</button>
    </div>
  `;

  const year = document.createElement('input');
  year.className = 'w-full px-4 py-2 rounded-2xl bg-white/4 border border-white/8 text-cyber-text focus:outline-none focus:border-cyber-accent';
  year.value = item.year;

  const company = document.createElement('input');
  company.className = 'w-full px-4 py-2 rounded-2xl bg-white/4 border border-white/8 text-cyber-text focus:outline-none focus:border-cyber-accent';
  company.value = item.company;

  const role = document.createElement('input');
  role.className = 'w-full px-4 py-2 rounded-2xl bg-white/4 border border-white/8 text-cyber-text focus:outline-none focus:border-cyber-accent';
  role.value = item.role;

  const location = document.createElement('input');
  location.className = 'w-full px-4 py-2 rounded-2xl bg-white/4 border border-white/8 text-cyber-text focus:outline-none focus:border-cyber-accent';
  location.value = item.location;

  const description = document.createElement('textarea');
  description.className = 'w-full px-4 py-2 rounded-2xl bg-white/4 border border-white/8 text-cyber-text focus:outline-none focus:border-cyber-accent min-h-24';
  description.value = item.description;

  card.appendChild(buildField('Year / Duration', year));
  card.appendChild(buildField('Company', company));
  card.appendChild(buildField('Role', role));
  card.appendChild(buildField('Location', location));
  card.appendChild(buildField('Description', description));

  (card.querySelector('.remove-item') as HTMLButtonElement).addEventListener('click', () => {
    if (portfolioData) removeItem(portfolioData.experience, index);
  });

  item._inputs = { year, company, role, location, description };
  return card;
}

// Refresh and render functions
function refreshAllFields(): void {
  if (!portfolioData) return;
  createHeroForm();
  renderArray(portfolioData.sliderItems, sliderList, createSliderCard);
  renderArray(portfolioData.skills, skillsList, createSkillCard);
  renderArray(portfolioData.toolCategories, toolList, createToolCategoryCard);
  renderArray(portfolioData.experience, experienceList, createExperienceCard);
  contactEmailInput.value = portfolioData.contact.email;
  contactLinkedinInput.value = portfolioData.contact.linkedin;
  contactGithubInput.value = portfolioData.contact.github;
  renderActivityFeed();
}

function renderActivityFeed(): void {
  if (!portfolioData) return;
  activityFeed.innerHTML = portfolioData.recentActivity
    .map(
      (item) => `
      <div class="bg-white/3 border border-white/8 rounded-2xl p-4 border-l-2 border-l-cyber-accent">
        <p class="font-syne font-bold text-cyber-accent">${item.date}</p>
        <p class="text-cyber-text mt-2">${item.activity}</p>
      </div>
    `
    )
    .join('');
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char] || char));
}

function renderVisitors(visitors: Visitor[]): void {
  if (!visitors.length) {
    visitorFeed.innerHTML = '<p class="text-cyber-muted text-sm">No portfolio views recorded yet.</p>';
    return;
  }

  visitorFeed.innerHTML = visitors
    .map((visitor) => `
      <div class="bg-white/3 border border-white/8 rounded-2xl p-4">
        <div class="flex flex-wrap justify-between gap-3">
          <p class="font-syne font-bold text-cyber-accent">${escapeHtml(new Date(visitor.lastViewedAt || visitor.viewedAt).toLocaleString())}</p>
          <div class="flex items-center gap-3">
            <p class="text-cyber-muted text-sm"><span class="text-cyber-text">IP:</span> ${escapeHtml(visitor.ipAddress || 'Unknown')}</p>
            ${visitor._id ? `<button class="delete-visitor px-3 py-1 rounded-full border border-red-500/30 bg-red-500/10 text-red-300 text-xs hover:border-red-400 transition" data-visitor-id="${escapeHtml(visitor._id)}">Delete</button>` : ''}
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3 text-sm">
          <p><span class="text-cyber-muted">Browser:</span> ${escapeHtml(visitor.browser)}</p>
          <p><span class="text-cyber-muted">Device:</span> ${escapeHtml(visitor.device)}</p>
          <p><span class="text-cyber-muted">Visits:</span> ${visitor.visitCount || 1}</p>
          <p><span class="text-cyber-muted">Account:</span> ${escapeHtml(visitor.browserAccount || 'Unavailable')}</p>
        </div>
      </div>
    `)
    .join('');

  visitorFeed.querySelectorAll<HTMLButtonElement>('.delete-visitor').forEach((button) => {
    button.addEventListener('click', async () => {
      const visitorId = button.dataset.visitorId;
      if (!visitorId) return;
      const confirmed = await showConfirm({
        title: 'Delete recent view?',
        message: 'This visitor record will be permanently removed from the admin history.',
        variant: 'danger',
        confirmText: 'Delete record',
        cancelText: 'Keep record'
      });
      if (!confirmed) return;

      const modal = showLoading('Deleting visitor record', 'Removing the selected portfolio view from storage.');
      try {
        const res = await secureFetch(`/api/visitors/${encodeURIComponent(visitorId)}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Unable to delete visitor');
        const payload = await res.json() as { visitors: Visitor[] };
        renderVisitors(payload.visitors || []);
        modal.setSuccess('Record deleted', 'The recent view was permanently removed.');
      } catch (err) {
        modal.setError('Delete failed', err instanceof Error ? err.message : 'Unable to delete visitor');
      }
    });
  });
}

function setActiveMenu(sectionId: string): void {
  adminMenuLinks.forEach((link) => {
    const isActive = link.dataset.section === sectionId;
    link.classList.toggle('text-cyber-accent', isActive);
    link.classList.toggle('bg-cyber-accent/10', isActive);
    link.classList.toggle('border', isActive);
    link.classList.toggle('border-cyber-accent/20', isActive);
  });
}

function initializeAdminMenu(): void {
  const sections = Array.from(document.querySelectorAll<HTMLElement>('.admin-section'));
  if (!sections.length) return;
  setActiveMenu(sections[0].id);

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible?.target.id) {
        setActiveMenu(visible.target.id);
      }
    },
    { threshold: [0.25, 0.5, 0.75], rootMargin: '-15% 0px -60% 0px' }
  );

  sections.forEach((section) => observer.observe(section));
  adminMenuLinks.forEach((link) => {
    link.addEventListener('click', () => {
      if (link.dataset.section) setActiveMenu(link.dataset.section);
    });
  });
}

// Form sync function
function syncFormValues(): void {
  if (!portfolioData) return;

  portfolioData.hero.title = heroTitle.value;
  portfolioData.hero.role = heroRole.value;
  portfolioData.hero.company = heroCompany.value;
  portfolioData.hero.tagline = heroTagline.value;
  portfolioData.hero.summary = heroSummary.value;

  portfolioData.sliderItems.forEach((item) => {
    if (item._inputs) {
      item.title = item._inputs.title.value;
      item.subtitle = item._inputs.subtitle.value;
      item.src = item._inputs.src.value;
      item.caption = item._inputs.caption.value;
      item.type = (item._inputs.type.value as 'image' | 'video');
    }
  });

  portfolioData.skills.forEach((item) => {
    if (item._inputs) {
      item.name = item._inputs.name.value;
      item.icon = item._inputs.icon.value;
      item.level = Number(item._inputs.level.value);
      item.description = item._inputs.description.value;
    }
  });

  portfolioData.toolCategories.forEach((item) => {
    if (item._inputs) {
      item.category = item._inputs.category.value;
      item.tags = item._inputs.tags.value
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);
    }
  });

  portfolioData.experience.forEach((item) => {
    if (item._inputs) {
      item.year = item._inputs.year.value;
      item.company = item._inputs.company.value;
      item.role = item._inputs.role.value;
      item.location = item._inputs.location.value;
      item.description = item._inputs.description.value;
    }
  });

  portfolioData.contact.email = contactEmailInput.value;
  portfolioData.contact.linkedin = contactLinkedinInput.value;
  portfolioData.contact.github = contactGithubInput.value;
}

// Data loading functions
function loadAdminState(): void {
  secureFetch('/api/auth')
    .then((res) => res.json())
    .then((auth: { authenticated?: boolean; csrfToken?: string; authToken?: string }) => {
      storeAdminTokens(auth);
      if (auth.authenticated) {
        hideElement(loginCard);
        showElement(adminControls);
        loadPortfolioData();
        loadVisitors();
        startVisitorSocket();
      } else {
        clearAdminTokens();
        stopVisitorSocket();
        showElement(loginCard);
        hideElement(adminControls);
      }
    })
    .catch(() => {
      stopVisitorSocket();
      clearAdminTokens();
      showElement(loginCard);
      hideElement(adminControls);
      showError('Unable to reach the backend. Check the Render backend URL and try again.');
    });
}

function loadPortfolioData(): void {
  fetch(apiUrl('/api/data'), { cache: 'no-store', credentials: 'include' })
    .then((res) => res.json())
    .then((data: PortfolioData) => {
      portfolioData = data;
      refreshAllFields();
    })
    .catch(() => {
      showError('Unable to load portfolio data from the backend.');
    });
}

function loadVisitors(): void {
  secureFetch('/api/visitors')
    .then((res) => {
      if (!res.ok) throw new Error('Unable to load visitors');
      return res.json();
    })
    .then((payload: { visitors: Visitor[] }) => renderVisitors(payload.visitors || []))
    .catch(() => renderVisitors([]));
}

function stopVisitorSocket(): void {
  visitorSocket?.disconnect();
  visitorSocket = null;
  visitorSocketStarted = false;
  if (visitorFallbackRefresh) {
    window.clearInterval(visitorFallbackRefresh);
    visitorFallbackRefresh = null;
  }
}

function startVisitorFallbackRefresh(): void {
  if (visitorFallbackRefresh) return;
  visitorFallbackRefresh = window.setInterval(() => {
    if (csrfToken && !loginCard.classList.contains('hidden')) return;
    if (csrfToken) loadVisitors();
  }, 3000);
}

function startVisitorSocket(): void {
  if (visitorSocketStarted) return;
  visitorSocketStarted = true;
  const socket = io(SOCKET_URL, {
    autoConnect: true,
    path: '/socket.io',
    withCredentials: true,
    transports: ['polling', 'websocket'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 500,
    timeout: 5000
  });
  visitorSocket = socket;
  startVisitorFallbackRefresh();

  const watchVisitors = () => {
    socket.emit('admin:watch-visitors');
  };

  socket.on('connect', () => {
    watchVisitors();
    loadVisitors();
  });
  socket.io.on('reconnect', () => {
    watchVisitors();
    loadVisitors();
  });
  socket.on('portfolio:visitors', (visitors: Visitor[]) => {
    renderVisitors(visitors || []);
  });
  socket.on('connect_error', () => {
    loadVisitors();
  });
  socket.on('disconnect', () => {
    startVisitorFallbackRefresh();
  });
  watchVisitors();
}

// Event listeners
loginBtn.addEventListener('click', () => {
  hideError();
  fetch(apiUrl('/api/login'), {
    method: 'POST',
    cache: 'no-store',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: adminUsername.value.trim(),
      password: adminPassword.value
    })
  })
    .then((res) => {
      if (!res.ok) throw new Error('Invalid credentials');
      return res.json();
    })
    .then((payload: { csrfToken?: string; authToken?: string }) => {
      storeAdminTokens(payload);
      hideElement(loginCard);
      showElement(adminControls);
      loadPortfolioData();
      loadVisitors();
      startVisitorSocket();
    })
    .catch((err: Error) => showError(err.message));
});

logoutBtn.addEventListener('click', () => {
  secureFetch('/api/logout', { method: 'POST' }).then(() => {
    clearAdminTokens();
    stopVisitorSocket();
    showElement(loginCard);
    hideElement(adminControls);
  });
});

saveBtn.addEventListener('click', async () => {
  syncFormValues();
  const confirmed = await showConfirm({
    title: 'Save portfolio changes?',
    message: 'Your latest admin edits will be written to the portfolio storage.',
    variant: 'info',
    confirmText: 'Save changes',
    cancelText: 'Review again'
  });
  if (!confirmed) return;

  const modal = showLoading('Saving portfolio', 'Updating your portfolio sections and refreshing admin data.');
  try {
    const res = await secureFetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stripEditorState(portfolioData))
    });
    if (!res.ok) throw await responseError(res, 'Save failed');
    await res.json();
    loadPortfolioData();
    modal.setSuccess('Portfolio saved', 'Your changes were saved successfully.');
  } catch (err) {
    modal.setError('Save failed', err instanceof Error ? err.message : 'Unable to save changes');
  }
});

addSliderItem.addEventListener('click', () => {
  if (portfolioData) {
    syncFormValues();
    portfolioData.sliderItems.push({
      id: `item-${Date.now()}`,
      type: 'image',
      title: '',
      subtitle: '',
      src: '',
      caption: '',
      _isNew: true
    });
    refreshAllFields();
  }
});

addSkill.addEventListener('click', () => {
  if (portfolioData) {
    syncFormValues();
    portfolioData.skills.push({
      name: 'New skill',
      level: 60,
      icon: 'QA',
      description: 'Describe the skill.'
    });
    refreshAllFields();
  }
});

addToolCategory.addEventListener('click', () => {
  if (portfolioData) {
    syncFormValues();
    portfolioData.toolCategories.push({
      category: 'New category',
      tags: ['Tag 1', 'Tag 2']
    });
    refreshAllFields();
  }
});

addExperience.addEventListener('click', () => {
  if (portfolioData) {
    syncFormValues();
    portfolioData.experience.push({
      year: '2026',
      company: 'New company',
      role: 'New role',
      location: 'Location',
      description: 'Details about the experience.'
    });
    refreshAllFields();
  }
});

addActivityBtn.addEventListener('click', async () => {
  if (!activityDate.value || !activityText.value.trim()) {
    await showNotice({
      title: 'Missing activity details',
      message: 'Enter both date and activity text to add a new activity.',
      variant: 'danger'
    });
    return;
  }

  const confirmed = await showConfirm({
    title: 'Add recent activity?',
    message: 'This activity will appear in the admin content and portfolio data.',
    variant: 'info',
    confirmText: 'Add activity',
    cancelText: 'Cancel'
  });
  if (!confirmed) return;

  const modal = showLoading('Adding activity', 'Saving the new recent activity entry.');
  try {
    const res = await secureFetch('/api/activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: activityDate.value,
        activity: activityText.value.trim()
      })
    });
    if (!res.ok) throw new Error('Activity save failed');
    const payload = await res.json() as { data: Activity[] };
    if (portfolioData) {
      portfolioData.recentActivity = payload.data;
      renderActivityFeed();
      activityDate.value = '';
      activityText.value = '';
    }
    modal.setSuccess('Activity added', 'The recent activity entry was saved.');
  } catch (err) {
    modal.setError('Activity save failed', err instanceof Error ? err.message : 'Unable to add activity');
  }
});

refreshVisitorsBtn.addEventListener('click', loadVisitors);

// Initialize admin state on page load
initializeAdminMenu();
loadAdminState();
