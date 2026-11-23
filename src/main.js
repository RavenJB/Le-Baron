import './styles.css';
import fr from '../data/translations/fr.json';
import en from '../data/translations/en.json';

const BASE = import.meta.env.BASE_URL;
const LOCALES = { fr, en };
const root = document.querySelector('#app');
const safeRead = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const state = {
  lang: localStorage.getItem('le-baron-language') || '',
  theme: localStorage.getItem('le-baron-theme') || 'light',
  tab: location.hash.slice(1) || 'swipe',
  projects: [],
  filter: '',
  history: safeRead('le-baron-history', []),
  matches: safeRead('le-baron-matches', []),
  chatId: '',
  typing: false,
  intro: !localStorage.getItem('le-baron-language'),
  dragX: 0,
  animating: false,
};

const t = (key) => key.split('.').reduce((value, part) => value?.[part], LOCALES[state.lang || 'fr']) ?? key;
const escapeHTML = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const currentProject = () => {
  const seen = new Set(state.history.map((item) => item.id));
  return state.projects.find((project) => !seen.has(project.id) && (!state.filter || project.category === state.filter));
};
const localize = (value) => typeof value === 'string' ? value : value?.[state.lang] || value?.en || value?.fr || '';
const icons = {
  swipe: '<rect x="4" y="7" width="16" height="13" rx="3"/><path d="m4 10 8 5 8-5M8 4l4-2 4 2"/>',
  categories: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  matches: '<path d="M20.5 8.7c0 4.1-8.5 10-8.5 10s-8.5-5.9-8.5-10A4.5 4.5 0 0 1 12 6.2a4.5 4.5 0 0 1 8.5 2.5Z"/>',
  profile: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z"/>',
  web: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/>',
  code: '<path d="m8 8-4 4 4 4m8-8 4 4-4 4m-3-11-2 14"/>',
  data: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v7c0 1.7 3.6 3 8 3s8-1.3 8-3V5m-16 7v7c0 1.7 3.6 3 8 3s8-1.3 8-3v-7"/>',
  sparkle: '<path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Zm7 12 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z"/>',
};
const icon = (name, cls = '') => `<svg class="icon ${cls}" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${icons[name] || icons.categories}</svg>`;
const categoryIcon = (category) => {
  const name = /web|javascript|typescript|html|css/i.test(category) ? 'web' : /python|php|java|c\+\+|code/i.test(category) ? 'code' : /data|sql/i.test(category) ? 'data' : /ia|ai|design|jeu|game/i.test(category) ? 'sparkle' : 'categories';
  return icon(name);
};
const categoryName = (category = '') => {
  const map = { fr: { 'JavaScript': 'JavaScript', 'TypeScript': 'TypeScript', 'Python': 'Python', 'PHP': 'PHP', 'HTML': 'Web', 'CSS': 'Web', 'Web': 'Web', 'Études': 'Études', 'Other': 'Autre', 'Autre': 'Autre', 'Java': 'Java', 'C++': 'C++' }, en: { 'Études': 'Coursework', 'Autre': 'Other', 'Autres': 'Other' } };
  return map[state.lang]?.[category] || category || t('categoryFallback');
};
const titleFor = (project) => localize(project?.description) || t('projectFallback');
const visual = (project) => project?.image
  ? `<img class="project-image" src="${escapeHTML(project.image)}" alt="${escapeHTML(project.name)}" />`
  : `<div class="cover-art" aria-hidden="true"><span class="cover-stamp">JB</span><span class="cover-orbit"></span><span class="cover-grid"></span><span class="cover-word">${escapeHTML(project?.language || categoryName(project?.category))}</span></div>`;

async function loadProjects() {
  try {
    const response = await fetch(`${BASE}data/projects.json`);
    if (!response.ok) throw new Error('Project data unavailable');
    state.projects = await response.json();
  } catch {
    state.projects = [];
  }
  render();
}

function renderIntro() {
  return `<main class="intro-screen"><div class="intro-top"><a class="brand-mark" href="#" aria-label="Le Baron, accueil"><span>JB</span></a><span class="edition">${t('introKicker')}</span></div><div class="intro-content"><p class="eyebrow">${t('selectLanguage')}</p><h1>${t('introTitle')}<span class="period">.</span></h1><p class="intro-copy">${t('introText')}</p><div class="intro-language" role="group" aria-label="${t('selectLanguage')}"><button class="language-choice ${state.lang === 'fr' || !state.lang ? 'selected' : ''}" data-language="fr"><span>FR</span> Français</button><button class="language-choice ${state.lang === 'en' ? 'selected' : ''}" data-language="en"><span>EN</span> English</button></div><button class="button button-primary intro-continue" data-action="enter">${t('enter')} ${icon('arrow')}</button></div><div class="intro-bottom"><span>JULES · LE BARON</span><span>48°51′N 2°21′E</span></div><div class="intro-scribble" aria-hidden="true">à swiper<br/>sans modération</div></main>`;
}

function renderNav() {
  const items = ['swipe', 'categories', 'matches', 'profile'];
  return `<nav class="bottom-nav" aria-label="${state.lang === 'fr' ? 'Navigation principale' : 'Main navigation'}">${items.map((item) => `<a href="#${item}" data-tab="${item}" class="nav-item ${state.tab === item ? 'active' : ''}" aria-current="${state.tab === item ? 'page' : 'false'}">${icon(item)}<span>${t(`nav.${item}`)}</span></a>`).join('')}</nav>`;
}

function renderHeader() {
  return `<header class="mobile-header"><a class="wordmark" href="#swipe"><span class="brand-mark small"><span>JB</span></span><span>Le Baron<span class="wordmark-dot">.</span></span></a><button class="theme-button" data-action="theme" aria-label="${t('themeToggle')}">${state.theme === 'light' ? '☼' : '◐'}</button></header>`;
}

function projectCard(project, index = 0, compact = false) {
  const desc = titleFor(project);
  return `<article class="project-card ${compact ? 'compact-card' : ''}" data-project-id="${escapeHTML(project.id)}" style="--card-index:${index};--drag-x:${state.dragX}px;--drag-rot:${state.dragX * 0.045}deg"><div class="card-media">${visual(project)}${project.featured ? `<span class="featured-badge">${t('featured')}</span>` : ''}<span class="swipe-stamp like-stamp">LIKE</span><span class="swipe-stamp nope-stamp">NOPE</span></div><div class="card-content"><div class="card-overline"><span>${escapeHTML(categoryName(project.category))}</span><span class="card-index">${String(index + 1).padStart(2, '0')} <i>/</i> ${String(state.projects.length).padStart(2, '0')}</span></div><h2>${escapeHTML(project.name)}</h2><p class="card-description">${escapeHTML(desc)}</p><div class="tag-row">${(project.topics?.length ? project.topics.slice(0, 3) : [project.language || categoryName(project.category)]).map((tag) => `<span class="tag">${escapeHTML(tag)}</span>`).join('')}</div><div class="card-footer"><span class="repo-stats">${project.stars != null ? `${icon('star')} ${project.stars}` : ''}</span><a href="${escapeHTML(project.htmlUrl)}" target="_blank" rel="noreferrer" class="text-link">GitHub ${icon('arrow')}</a></div></div></article>`;
}

function renderChat(project, modal = false) {
  if (!project) return '';
  const message = localize(project.message) || `[DEMO] ${state.lang === 'fr' ? `Je te raconterai bientôt l’histoire de ${project.name}.` : `I’ll share the story behind ${project.name} soon.`}`;
  return `<section class="chat-panel ${modal ? 'chat-modal' : ''}" aria-label="${t('conversation')}"><div class="chat-head"><span class="chat-avatar">JB</span><div><p class="chat-title">${t('conversation')}</p><span class="chat-presence">${state.typing ? t('writing') : 'Jules · Le Baron'}</span></div><button class="icon-button chat-close" data-action="close-chat" aria-label="${state.lang === 'fr' ? 'Fermer la conversation' : 'Close conversation'}">${icon('close')}</button></div><div class="chat-body"><div class="chat-project-chip">${visual(project)}<span>${escapeHTML(project.name)}</span></div>${state.typing ? `<div class="typing-bubble"><i></i><i></i><i></i></div>` : `<p class="chat-message">${escapeHTML(message)}</p><a class="button button-primary repo-button" href="${escapeHTML(project.htmlUrl)}" target="_blank" rel="noreferrer">${t('repoLink')} ${icon('arrow')}</a>`}</div></section>`;
}

function renderSwipe() {
  const project = currentProject();
  const activeMatch = state.chatId && state.matches.find((match) => String(match.id) === String(state.chatId));
  return `<section class="view swipe-view"><div class="view-heading"><div><p class="eyebrow">${state.filter ? escapeHTML(categoryName(state.filter)) : t('allProjects')}</p><h1>${t('swipeTitle')}<span class="period">.</span></h1><p class="view-subtitle">${t('swipeHint')}</p></div>${state.filter ? `<button class="text-link" data-action="clear-filter">${t('allCategories')}</button>` : ''}</div><div class="swipe-layout"><div class="swipe-stage">${project ? `<div class="card-stack">${state.projects.filter((candidate) => candidate.id !== project.id && (!state.filter || candidate.category === state.filter)).slice(-1).map((item) => `<div class="card-back">${visual(item)}</div>`).join('')}${projectCard(project)}</div><div class="swipe-actions"><button class="action-button action-pass" data-action="pass" aria-label="${t('nope')}">${icon('close')}<span>${t('nope')}</span></button><button class="action-button action-undo" data-action="undo" aria-label="${t('undo')}" ${state.history.length ? '' : 'disabled'}>${icon('arrow')}<span>${t('undo')}</span></button><button class="action-button action-like" data-action="like" aria-label="${t('like')}">${icon('matches')}<span>${t('like')}</span></button></div>` : `<div class="empty-state"><span class="empty-star">✳</span><h2>${t('emptyTitle')}</h2><p>${t('emptyText')}</p><button class="button button-primary" data-action="restart">${t('restart')} ${icon('arrow')}</button></div>`}</div><aside class="swipe-side">${activeMatch ? renderChat(activeMatch) : `<div class="side-note"><span class="side-note-mark">JB</span><p>${t('conversation')}</p><span>${t('matchesEmpty')}</span></div>`}</aside></div></section>${state.chatId && activeMatch ? `<div class="mobile-chat-overlay">${renderChat(activeMatch, true)}</div>` : ''}`;
}

function renderCategories() {
  const categories = [...new Set(state.projects.map((project) => project.category || 'Autre'))].sort((a, b) => categoryName(a).localeCompare(categoryName(b)));
  const counts = new Map(categories.map((category) => [category, state.projects.filter((project) => project.category === category).length]));
  return `<section class="view categories-view"><div class="view-heading"><div><p class="eyebrow">${t('allProjects')}</p><h1>${t('categoriesTitle')}<span class="period">.</span></h1></div><span class="project-count">${state.projects.length} ${t('reposCount')}</span></div><div class="category-chips"><button class="category-filter ${!state.filter ? 'selected' : ''}" data-category="">${t('allCategories')}</button>${categories.map((category) => `<button class="category-filter ${state.filter === category ? 'selected' : ''}" data-category="${escapeHTML(category)}">${escapeHTML(categoryName(category))}<span>${counts.get(category)}</span></button>`).join('')}</div><div class="category-grid">${categories.filter((category) => !state.filter || state.filter === category).map((category) => `<section class="category-section"><div class="category-heading"><div class="category-icon">${categoryIcon(category)}</div><div><h2>${escapeHTML(categoryName(category))}</h2><span>${counts.get(category)} ${state.lang === 'fr' ? 'projet(s)' : 'project(s)'}</span></div><button class="text-link" data-launch-category="${escapeHTML(category)}">${t('launchSwipe')} ${icon('arrow')}</button></div><div class="project-grid">${state.projects.filter((project) => project.category === category).map((project) => `<article class="mini-project"><a class="mini-cover" href="${escapeHTML(project.htmlUrl)}" target="_blank" rel="noreferrer">${visual(project)}<span class="mini-arrow">↗</span></a><div class="mini-content"><div class="mini-topline"><span>${escapeHTML(project.language || categoryName(category))}</span>${project.stars != null ? `<span>${icon('star')} ${project.stars}</span>` : ''}</div><h3>${escapeHTML(project.name)}</h3><p>${escapeHTML(titleFor(project))}</p><div class="tag-row">${(project.topics || []).slice(0, 3).map((topic) => `<span class="tag">${escapeHTML(topic)}</span>`).join('')}</div></div></article>`).join('')}</div></section>`).join('')}</div></section>`;
}

function renderMatches() {
  return `<section class="view matches-view"><div class="view-heading"><div><p class="eyebrow">${t('nav.matches')}</p><h1>${t('matchesTitle')}<span class="period">.</span></h1></div><span class="project-count">${state.matches.length} ${state.lang === 'fr' ? 'match(s)' : 'match(es)'}</span></div>${state.matches.length ? `<div class="matches-layout"><div class="matches-list">${state.matches.map((project) => `<button class="match-card ${String(project.id) === String(state.chatId) ? 'selected' : ''}" data-match="${escapeHTML(project.id)}"><span class="match-cover">${visual(project)}</span><span class="match-info"><strong>${escapeHTML(project.name)}</strong><small>${escapeHTML(categoryName(project.category))}</small></span>${icon('arrow')}</button>`).join('')}</div><div class="matches-chat">${renderChat(state.matches.find((project) => String(project.id) === String(state.chatId)) || state.matches[0])}</div></div>` : `<div class="empty-state matches-empty"><span class="empty-star">✳</span><h2>${t('matchesEmpty')}</h2><a href="#swipe" class="button button-secondary">${t('nav.swipe')} ${icon('arrow')}</a></div>`}</section>`;
}

function renderProfile() {
  const profile = t('profileData');
  return `<section class="view profile-view"><div class="view-heading"><div><p class="eyebrow">${t('nav.profile')}</p><h1>${t('profileTitle')}<span class="period">.</span></h1></div><button class="language-toggle" data-action="language" aria-label="${t('selectLanguage')}">${state.lang.toUpperCase()}</button></div><div class="profile-layout"><div class="profile-main"><section class="profile-hero"><div class="portrait-placeholder" aria-label="${state.lang === 'fr' ? 'Emplacement photo à personnaliser' : 'Photo placeholder to customize'}"><span>J</span><i>PHOTO<br/>À AJOUTER</i></div><div class="profile-intro"><p class="eyebrow">${t('profileSubtitle')}</p><h2>Jules<span class="period">.</span></h2><p>${t('bio')}</p><span class="location-pin">⌖ ${t('location')}</span><span class="demo-chip">${t('demoLabel')}</span></div></section><section class="profile-section"><div class="section-title"><h2>${t('experience')}</h2><span>01</span></div><div class="timeline">${profile.experience.map((item) => `<article class="timeline-item"><span class="timeline-dot"></span><div class="timeline-top"><h3>${escapeHTML(item.role)}</h3><span>${escapeHTML(item.date)}</span></div><p class="timeline-meta">${escapeHTML(item.company)} · ${escapeHTML(item.place)}</p><p>${escapeHTML(item.description)}</p><div class="tag-row">${item.tools.map((tool) => `<span class="tag">${escapeHTML(tool)}</span>`).join('')}</div></article>`).join('')}</div></section><section class="profile-section"><div class="section-title"><h2>${t('education')}</h2><span>02</span></div>${profile.education.map((item) => `<article class="education-item"><span class="education-icon">✳</span><div><div class="timeline-top"><h3>${escapeHTML(item.program)}</h3><span>${escapeHTML(item.date)}</span></div><p class="timeline-meta">${escapeHTML(item.school)}</p><p>${escapeHTML(item.details)}</p></div></article>`).join('')}</section></div><aside class="profile-aside"><section class="contact-card"><span class="aside-mark">JB</span><h2>${t('contact')}</h2><p>${t('contactHint')}</p><div class="contact-links"><a href="https://github.com/RavenJB" target="_blank" rel="noreferrer">${icon('categories')} GitHub <span>↗</span></a><span class="contact-placeholder">LinkedIn <small>à ajouter</small></span><span class="contact-placeholder">Email <small>à ajouter</small></span></div><a class="button button-primary cv-button" href="#" aria-disabled="true" data-action="cv">${t('cvMissing')}</a></section><section class="profile-section skills-section"><div class="section-title"><h2>${t('skills')}</h2><span>03</span></div>${profile.skills.map((group) => `<div class="skill-group"><h3>${escapeHTML(group.name)}</h3><div class="tag-row">${group.items.map((skill) => `<span class="tag">${escapeHTML(skill)}</span>`).join('')}</div></div>`).join('')}<div class="skill-group"><h3>${t('languages')}</h3><div class="language-list">${profile.languages.map((language) => `<p>${escapeHTML(language)}</p>`).join('')}</div></div><p class="demo-note">${t('demoLabel')}</p></section></aside></div><footer class="site-footer"><span>LE BARON · JULES</span><span>Fait avec un peu de culot <i>✳</i></span><a href="https://github.com/RavenJB/Le-Baron" target="_blank" rel="noreferrer">GitHub ${icon('arrow')}</a></footer></section>`;
}

function render() {
  document.documentElement.lang = state.lang || 'fr';
  document.documentElement.dataset.theme = state.theme;
  root.innerHTML = state.intro ? renderIntro() : `${renderHeader()}<div class="app-shell"><aside class="desktop-rail"><a class="brand-mark" href="#swipe" aria-label="Le Baron"><span>JB</span></a><div class="rail-label">LE BARON<br/>PORTFOLIO</div><nav>${['swipe', 'categories', 'matches', 'profile'].map((item) => `<a href="#${item}" data-tab="${item}" class="rail-link ${state.tab === item ? 'active' : ''}" aria-label="${t(`nav.${item}`)}">${icon(item)}<span>${t(`nav.${item}`)}</span></a>`).join('')}</nav><div class="rail-bottom"><button class="language-toggle" data-action="language">${state.lang.toUpperCase()}</button><button class="theme-button" data-action="theme" aria-label="${t('themeToggle')}">${state.theme === 'light' ? '☼' : '◐'}</button><span>JULES © 2026</span></div></aside><main class="main-content">${state.tab === 'swipe' ? renderSwipe() : state.tab === 'categories' ? renderCategories() : state.tab === 'matches' ? renderMatches() : renderProfile()}</main></div>${renderNav()}`;
  bindEvents();
}

function persist() {
  localStorage.setItem('le-baron-history', JSON.stringify(state.history));
  localStorage.setItem('le-baron-matches', JSON.stringify(state.matches));
}

function chooseLanguage(lang) {
  state.lang = lang;
  localStorage.setItem('le-baron-language', lang);
  render();
}

function decide(direction) {
  if (state.animating) return;
  const project = currentProject();
  if (!project) return;
  state.animating = true;
  const exitingCard = root.querySelector('.swipe-stage .project-card:not(.compact-card)');
  exitingCard?.classList.add(direction === 'like' ? 'depart-right' : 'depart-left');
  state.history.push({ id: project.id, direction });
  state.dragX = 0;
  if (direction === 'like') {
    state.matches = [project, ...state.matches.filter((match) => String(match.id) !== String(project.id))];
    state.chatId = project.id;
    state.typing = true;
  } else {
    state.chatId = '';
  }
  persist();
  window.setTimeout(() => {
    state.animating = false;
    render();
    if (direction === 'like') window.setTimeout(() => {
      if (String(state.chatId) !== String(project.id)) return;
      state.typing = false;
      render();
    }, 800);
  }, 220);
}

function undo() {
  const last = state.history.pop();
  if (!last) return;
  if (last.direction === 'like') state.matches = state.matches.filter((project) => String(project.id) !== String(last.id));
  state.chatId = '';
  state.typing = false;
  state.dragX = 0;
  persist();
  render();
}

function bindEvents() {
  root.querySelectorAll('[data-language]').forEach((button) => button.addEventListener('click', () => chooseLanguage(button.dataset.language)));
  root.querySelectorAll('[data-tab]').forEach((link) => link.addEventListener('click', () => { state.tab = link.dataset.tab; state.filter = ''; state.chatId = ''; }));
  root.querySelectorAll('[data-action]').forEach((button) => button.addEventListener('click', (event) => {
    const action = button.dataset.action;
    if (action === 'enter') { state.intro = false; state.tab = 'swipe'; location.hash = 'swipe'; render(); }
    if (action === 'pass') decide('pass');
    if (action === 'like') decide('like');
    if (action === 'undo') undo();
    if (action === 'restart') { state.history = []; state.filter = ''; persist(); render(); }
    if (action === 'clear-filter') { state.filter = ''; render(); }
    if (action === 'close-chat') { state.chatId = ''; state.typing = false; render(); }
    if (action === 'theme') { state.theme = state.theme === 'light' ? 'dark' : 'light'; localStorage.setItem('le-baron-theme', state.theme); render(); }
    if (action === 'language') { state.lang = state.lang === 'fr' ? 'en' : 'fr'; localStorage.setItem('le-baron-language', state.lang); render(); }
    if (action === 'cv') { event.preventDefault(); }
  }));
  root.querySelectorAll('[data-category]').forEach((button) => button.addEventListener('click', () => { state.filter = button.dataset.category; render(); }));
  root.querySelectorAll('[data-launch-category]').forEach((button) => button.addEventListener('click', () => { state.filter = button.dataset.launchCategory; state.tab = 'swipe'; location.hash = 'swipe'; render(); }));
  root.querySelectorAll('[data-match]').forEach((button) => button.addEventListener('click', () => { state.chatId = button.dataset.match; state.typing = false; render(); }));
  const card = root.querySelector('.swipe-stage .project-card:not(.compact-card)');
  if (card) {
    card.addEventListener('pointerdown', (event) => { if (event.target.closest('a,button')) return; card.setPointerCapture(event.pointerId); card.dataset.startX = String(event.clientX); });
    card.addEventListener('pointermove', (event) => { if (card.hasPointerCapture(event.pointerId)) { state.dragX = event.clientX - Number(card.dataset.startX); card.style.setProperty('--drag-x', `${state.dragX}px`); card.style.setProperty('--drag-rot', `${state.dragX * 0.045}deg`); card.classList.toggle('drag-like', state.dragX > 45); card.classList.toggle('drag-pass', state.dragX < -45); } });
    card.addEventListener('pointerup', (event) => { if (!card.hasPointerCapture(event.pointerId)) return; card.releasePointerCapture(event.pointerId); if (Math.abs(state.dragX) > 90) decide(state.dragX > 0 ? 'like' : 'pass'); else { state.dragX = 0; card.style.setProperty('--drag-x', '0px'); card.style.setProperty('--drag-rot', '0deg'); card.classList.remove('drag-like', 'drag-pass'); } });
    card.addEventListener('pointercancel', () => { state.dragX = 0; render(); });
  }
}

window.addEventListener('hashchange', () => {
  if (location.hash.slice(1) && ['swipe', 'categories', 'matches', 'profile'].includes(location.hash.slice(1))) {
    state.tab = location.hash.slice(1); state.chatId = ''; state.intro = false; render();
  }
});
window.addEventListener('keydown', (event) => {
  if (state.intro || state.tab !== 'swipe' || /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName)) return;
  if (event.key === 'ArrowLeft') decide('pass');
  if (event.key === 'ArrowRight') decide('like');
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); undo(); }
});

render();
loadProjects();
