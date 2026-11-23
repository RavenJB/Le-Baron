import './styles.css';
import fr from '../data/translations/fr.json';
import en from '../data/translations/en.json';

const BASE = import.meta.env.BASE_URL;
const LOCALES = { fr, en };
const root = document.querySelector('#app');
const safeRead = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
};
const safeWrite = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage is optional */ } };
const state = {
  lang: (() => { try { return localStorage.getItem('le-baron-language') || ''; } catch { return ''; } })(),
  theme: (() => { try { return localStorage.getItem('le-baron-theme') || 'light'; } catch { return 'light'; } })(),
  tab: ['swipe', 'categories', 'matches', 'profile'].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'swipe',
  projects: [], filter: '', history: safeRead('le-baron-history', []), matches: safeRead('le-baron-matches', []),
  focusId: '', chatId: '', intro: false, transitioning: '', arrival: '', freshMatchId: '',
};
state.intro = !state.lang;

const t = (key) => key.split('.').reduce((value, part) => value?.[part], LOCALES[state.lang || 'fr']) ?? key;
const escapeHTML = (value = '') => String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const localize = (value) => typeof value === 'string' ? value : value?.[state.lang] || value?.en || value?.fr || '';
const wasSeen = (id) => state.history.some((item) => String(item.id) === String(id));
const currentProject = () => {
  const candidates = state.projects.filter((project) => !state.filter || project.category === state.filter);
  return candidates.find((project) => String(project.id) === String(state.focusId)) || candidates.find((project) => !wasSeen(project.id)) || null;
};
const selectedProject = () => state.projects.find((project) => String(project.id) === String(state.focusId)) || currentProject();
const categories = () => [...new Set(state.projects.map((project) => project.category || 'Autre'))].sort((a, b) => categoryName(a).localeCompare(categoryName(b), state.lang));
const categoryName = (category = '') => {
  const map = { fr: { Études: 'Études', Other: 'Autre', Autre: 'Autre', Autres: 'Autre', HTML: 'Web', CSS: 'Web' }, en: { Études: 'Coursework', Autre: 'Other', Autres: 'Other' } };
  return map[state.lang]?.[category] || category || t('categoryFallback');
};
const titleFor = (project) => localize(project?.description) || t('projectFallback');
const routePalette = ['route-cobalt', 'route-coral', 'route-sky', 'route-lime', 'route-violet', 'route-amber'];
const routeIndex = (value = '') => [...String(value)].reduce((total, character) => total + character.charCodeAt(0), 0) % routePalette.length;
const positions = [
  [12, 22], [37, 13], [61, 20], [85, 29], [74, 54], [48, 47], [20, 61], [36, 83], [67, 81], [90, 73],
];

const icons = {
  map: '<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z"/><path d="M9 3v15m6-12v15"/>',
  categories: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  matches: '<path d="M20.5 8.7c0 4.1-8.5 10-8.5 10s-8.5-5.9-8.5-10A4.5 4.5 0 0 1 12 6.2a4.5 4.5 0 0 1 8.5 2.5Z"/>',
  profile: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>', close: '<path d="m6 6 12 12M18 6 6 18"/>',
  back: '<path d="M19 12H5m7 7-7-7 7-7"/>', star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z"/>',
  github: '<path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.9a3.4 3.4 0 0 0-1-2.6c3.3-.4 6.8-1.6 6.8-7.3a5.7 5.7 0 0 0-1.5-3.9 5.3 5.3 0 0 0-.1-3.9S18.9 0 15 2a13.5 13.5 0 0 0-7 0C4.1 0 2.8 1.4 2.8 1.4a5.3 5.3 0 0 0-.1 3.9A5.7 5.7 0 0 0 1.2 9.2c0 5.7 3.5 6.9 6.8 7.3a3.4 3.4 0 0 0-1 2.6V22"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/>',
  moon: '<path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z"/>',
  pulse: '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
};
const icon = (name, cls = '') => `<svg class="icon ${cls}" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${icons[name] || icons.map}</svg>`;

function projectArt(project, index = 0, size = 'large') {
  const language = project?.language || categoryName(project?.category) || t('categoryFallback');
  const route = routePalette[routeIndex(project?.category || language)];
  const serial = String(index + 1).padStart(2, '0');
  const artLabel = size === 'small' ? language : project?.name;
  const topics = (project?.topics || []).slice(0, 2).map((topic) => `<span>${escapeHTML(topic)}</span>`).join('');
  return `<div class="project-art ${size === 'small' ? 'project-art-small' : ''} ${route}" aria-label="${escapeHTML(`${project?.name || ''} — ${language}`)}" role="img">
    <div class="art-coordinate"><span>${escapeHTML(categoryName(project?.category))}</span><span>${serial} / ${String(state.projects.length).padStart(2, '0')}</span></div>
    <div class="art-orbit art-orbit-one" aria-hidden="true"></div><div class="art-orbit art-orbit-two" aria-hidden="true"></div>
    <div class="art-core"><span class="art-language">${escapeHTML(language)}</span><strong>${escapeHTML(artLabel || '')}</strong></div>
    <div class="art-footer"><span>${topics || escapeHTML(t('projectVisual'))}</span><span>${icon('arrow')}</span></div>
  </div>`;
}

function renderIntro() {
  return `<main class="intro-screen">
    <header class="intro-top"><a class="brand-mark" href="#" aria-label="Le Baron — accueil"><span>JB</span><i></i></a><span class="intro-edition">PORTFOLIO · 2026</span></header>
    <div class="intro-content"><p class="intro-overline">LE BARON — JULES</p><h1>${t('introTitle')}</h1><p class="intro-copy">${t('introText')}</p>
      <div class="intro-language" role="group" aria-label="${t('selectLanguage')}">
        <button class="language-choice ${state.lang === 'fr' || !state.lang ? 'selected' : ''}" data-language="fr"><span>FR</span> Français</button>
        <button class="language-choice ${state.lang === 'en' ? 'selected' : ''}" data-language="en"><span>EN</span> English</button>
      </div><button class="button button-primary intro-continue" data-action="enter">${t('enter')} ${icon('arrow')}</button>
    </div>
    <div class="intro-mapline" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div>
    <footer class="intro-bottom"><span>JULES · LE BARON</span><span>${icon('pulse')} ${t('publicProjects')}</span></footer>
  </main>`;
}

function navLink(item) {
  return `<a href="#${item}" data-tab="${item}" class="nav-link ${state.tab === item ? 'active' : ''}" ${state.tab === item ? 'aria-current="page"' : ''}>${icon(item)}<span>${t(`nav.${item}`)}</span>${item === 'matches' && state.matches.length ? `<b>${state.matches.length}</b>` : ''}</a>`;
}
function renderHeader() {
  return `<header class="site-header">
    <a class="wordmark" href="#swipe" aria-label="Le Baron, ${t('nav.swipe')}"><span class="brand-mark small"><span>JB</span><i></i></span><span>LE BARON<span class="wordmark-dot">/</span><small>PORTFOLIO DE JULES</small></span></a>
    <nav class="desktop-nav" aria-label="${state.lang === 'fr' ? 'Navigation principale' : 'Main navigation'}">${['swipe', 'categories', 'matches', 'profile'].map(navLink).join('')}</nav>
    <div class="header-tools"><button class="tool-button language-toggle" data-action="language" aria-label="${t('selectLanguage')}">${state.lang.toUpperCase()}</button><button class="tool-button theme-button" data-action="theme" aria-label="${t('themeToggle')}">${icon(state.theme === 'light' ? 'moon' : 'sun')}</button></div>
  </header>`;
}
function renderMobileNav() {
  return `<nav class="mobile-nav" aria-label="${state.lang === 'fr' ? 'Navigation principale' : 'Main navigation'}">${['swipe', 'categories', 'matches', 'profile'].map((item) => `<a href="#${item}" data-tab="${item}" class="mobile-nav-link ${state.tab === item ? 'active' : ''}" ${state.tab === item ? 'aria-current="page"' : ''}>${icon(item)}<span>${t(`nav.${item}`)}</span>${item === 'matches' && state.matches.length ? `<i>${state.matches.length}</i>` : ''}</a>`).join('')}</nav>`;
}
function viewHeading(title, subtitle = '', aside = '') {
  return `<header class="view-heading"><div><h1>${title}</h1>${subtitle ? `<p>${subtitle}</p>` : ''}</div>${aside}</header>`;
}
function categoryFilters() {
  return `<div class="category-filters" role="group" aria-label="${t('filterProjects')}"><button class="filter-button ${!state.filter ? 'selected' : ''}" data-category="">${t('allCategories')}<span>${state.projects.length}</span></button>${categories().map((category) => `<button class="filter-button ${state.filter === category ? 'selected' : ''}" data-category="${escapeHTML(category)}">${escapeHTML(categoryName(category))}<span>${state.projects.filter((project) => project.category === category).length}</span></button>`).join('')}</div>`;
}
function graphEdges(projects) {
  const activeId = selectedProject()?.id;
  const edges = new Map();
  const groups = new Map();
  for (const project of projects) {
    if (project.category) {
      const key = `category:${project.category}`;
      groups.set(key, [...(groups.get(key) || []), project]);
    }
    if (project.language) {
      const key = `language:${project.language}`;
      groups.set(key, [...(groups.get(key) || []), project]);
    }
  }
  for (const [key, members] of groups) {
    for (let index = 1; index < members.length; index += 1) {
      const a = members[0]; const b = members[index];
      const pair = [String(a.id), String(b.id)].sort().join(':');
      if (edges.has(pair)) continue;
      const [x1, y1] = positions[state.projects.indexOf(a) % positions.length];
      const [x2, y2] = positions[state.projects.indexOf(b) % positions.length];
      const bend = (x1 + x2) / 2 + ((index + state.projects.indexOf(a)) % 2 ? 3 : -3);
      const sharedBy = key.startsWith('category:') ? 'category' : 'language';
      const focused = String(activeId) === String(a.id) || String(activeId) === String(b.id);
      edges.set(pair, `<path class="map-route ${routePalette[routeIndex(key.slice(key.indexOf(':') + 1))]} ${focused ? 'route-focused' : ''}" d="M ${x1} ${y1} C ${bend} ${y1}, ${bend} ${y2}, ${x2} ${y2}" data-link="${sharedBy}"/>`);
    }
  }
  return [...edges.values()].join('');
}
function renderProjectNode(project, index) {
  const [x, y] = positions[index % positions.length];
  const active = String(project.id) === String(selectedProject()?.id);
  const status = state.matches.some((item) => String(item.id) === String(project.id)) ? t('savedStatus') : wasSeen(project.id) ? t('seenStatus') : '';
  const languageDetail = project.language && project.language !== categoryName(project.category) ? project.language : '';
  return `<button class="map-node ${routePalette[routeIndex(project.category || project.language)]} ${active ? 'active' : ''} ${wasSeen(project.id) ? 'seen' : ''} ${status === t('savedStatus') ? 'saved' : ''}" style="--node-x:${x}%;--node-y:${y}%" data-project="${escapeHTML(project.id)}" ${active ? 'aria-current="true"' : ''} aria-label="${escapeHTML(`${project.name}, ${categoryName(project.category)}${languageDetail ? `, ${languageDetail}` : ''}${status ? `, ${status}` : ''}`)}">
    <span class="node-point"><i></i></span><span class="node-label"><strong>${escapeHTML(project.name)}</strong><small>${escapeHTML(categoryName(project.category))}</small></span>
  </button>`;
}
function renderInspector(project) {
  if (!project) {
    return `<aside class="project-inspector empty-inspector"><div class="empty-map-mark">${icon('map')}</div><h2>${state.projects.length ? t('allSeenTitle') : t('emptyTitle')}</h2><p>${state.projects.length ? t('allSeenText') : t('emptyText')}</p>${state.history.length ? `<button class="button button-secondary" data-action="restart">${t('restart')} ${icon('back')}</button>` : ''}</aside>`;
  }
  const index = state.projects.findIndex((item) => String(item.id) === String(project.id));
  const visited = wasSeen(project.id);
  const favorite = state.matches.some((item) => String(item.id) === String(project.id));
  const title = titleFor(project);
  const transition = state.transitioning ? `leaving ${state.transitioning}` : state.arrival ? `arriving ${state.arrival}` : '';
  return `<aside class="project-inspector">
    ${state.filter ? `<div class="inspector-filter">${escapeHTML(categoryName(state.filter))}<button class="plain-button" data-action="clear-filter">${t('allCategories')}</button></div>` : ''}
    <div class="inspector-card ${transition}" data-project-card="${escapeHTML(project.id)}" style="--art-route-color:var(--${routePalette[routeIndex(project.category || project.language)].replace('route-', 'route-')})">
      <div class="project-art-wrap">${projectArt(project, index)}<span class="art-index">${String(index + 1).padStart(2, '0')}<i> / ${String(state.projects.length).padStart(2, '0')}</i></span></div>
      <div class="inspector-content"><div class="project-facts"><span>${escapeHTML(categoryName(project.category))}</span>${project.language && project.language !== categoryName(project.category) ? `<span>${escapeHTML(project.language)}</span>` : !project.language ? `<span>${t('languageUnknown')}</span>` : ''}${favorite ? `<span class="saved-label">${icon('matches')} ${t('savedStatus')}</span>` : ''}</div>
        <h2>${escapeHTML(project.name)}</h2><p class="project-description">${escapeHTML(title)}</p>
        ${project.topics?.length ? `<div class="repo-topics">${project.topics.slice(0, 4).map((topic) => `<span>${escapeHTML(topic)}</span>`).join('')}</div>` : ''}
        <a class="repo-link" href="${escapeHTML(project.htmlUrl)}" target="_blank" rel="noreferrer">${icon('github')}<span>${t('repoLink')}</span>${icon('arrow', 'repo-arrow')}</a>
      </div>
    </div>
    <div class="swipe-controls" aria-label="${t('projectActions')}">
      <button class="swipe-control pass-control" data-action="pass" aria-label="${t('nope')}" ${visited || state.transitioning ? 'disabled' : ''}>${icon('close')}<span>${t('nope')}</span><kbd>←</kbd></button>
      <button class="swipe-control undo-control" data-action="undo" aria-label="${t('undo')}" ${state.history.length && !state.transitioning ? '' : 'disabled'}>${icon('back')}<span>${t('undo')}</span><kbd>⌘ Z</kbd></button>
      <button class="swipe-control like-control ${favorite ? 'is-favorite' : ''}" data-action="like" aria-label="${favorite ? t('savedStatus') : t('like')}" ${visited || state.transitioning ? 'disabled' : ''}>${icon('matches')}<span>${t('like')}</span><kbd>→</kbd></button>
    </div>
    ${visited ? `<p class="visited-note">${favorite ? t('savedStatus') : t('seenStatus')} · ${t('visitedHint')}</p>` : `<p class="gesture-hint">${t('desktopHint')}</p>`}
  </aside>`;
}
function renderSwipe() {
  const visible = state.projects.filter((project) => !state.filter || project.category === state.filter);
  const project = currentProject();
  return `<section class="view swipe-view">
    ${viewHeading(t('swipeTitle'), t('swipeHint'), `<span class="view-count">${visible.length}<i> ${t('reposCount')}</i></span>`)}
    <div class="swipe-toolbar">${categoryFilters()}</div>
    <div class="discovery-layout">
      <section class="map-panel" aria-label="${t('projectMap')}">
        <div class="map-panel-head"><span>${t('projectMap')}</span><span class="map-coordinate">${icon('pulse')} ${t('mapLegend')}</span></div>
        <div class="project-map ${state.transitioning ? 'map-busy' : ''}"><svg class="map-routes" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${graphEdges(visible)}</svg>${visible.map((item) => renderProjectNode(item, state.projects.indexOf(item))).join('')}</div>
        <div class="map-footer"><span><i class="legend-dot legend-active"></i>${t('selectedLegend')}</span><span><i class="legend-dot legend-saved"></i>${t('savedLegend')}</span><span>${visible.length} ${t('reposCount')}</span></div>
      </section>
      ${renderInspector(project)}
    </div>
  </section>`;
}
function renderCategoryProject(project, index) {
  const liked = state.matches.some((item) => String(item.id) === String(project.id));
  return `<article class="project-row ${liked ? 'is-favorite' : ''}"><button class="row-select" data-project="${escapeHTML(project.id)}" aria-label="${t('selectProject')} ${escapeHTML(project.name)}"><span class="row-visual">${projectArt(project, index, 'small')}</span><span class="row-copy"><strong>${escapeHTML(project.name)}</strong><small>${escapeHTML(project.language || categoryName(project.category))}</small><span>${escapeHTML(titleFor(project))}</span></span><span class="row-tags">${(project.topics || []).slice(0, 2).map((topic) => `<i>${escapeHTML(topic)}</i>`).join('')}</span>${liked ? `<span class="row-favorite">${icon('matches')}</span>` : ''}${icon('arrow', 'row-arrow')}</button></article>`;
}
function renderCategories() {
  const all = categories();
  const count = state.projects.length;
  const groups = all.filter((category) => !state.filter || category === state.filter);
  return `<section class="view categories-view">${viewHeading(t('categoriesTitle'), t('categoriesHint'), `<span class="view-count">${count}<i> ${t('reposCount')}</i></span>`)}
    <div class="category-index">${categoryFilters()}</div>
    <div class="category-groups">${groups.length ? groups.map((category) => {
      const items = state.projects.filter((project) => project.category === category);
      const palette = routePalette[routeIndex(category)];
      return `<section class="category-group ${palette}"><header class="category-group-head"><h2>${escapeHTML(categoryName(category))}</h2><small>${items.length} ${t('projectCountLabel')}</small><button class="plain-button" data-launch-category="${escapeHTML(category)}">${t('launchSwipe')} ${icon('arrow')}</button></header><div class="category-projects">${items.map((project) => renderCategoryProject(project, state.projects.indexOf(project))).join('')}</div></section>`;
    }).join('') : `<div class="empty-state"><h2>${t('emptyTitle')}</h2><p>${t('emptyText')}</p></div>`}</div>
  </section>`;
}
function renderChat(project, modal = false) {
  if (!project) return `<section class="conversation-empty"><h2>${t('matchesEmpty')}</h2></section>`;
  const message = localize(project.message) || `[DEMO] ${state.lang === 'fr' ? `Je te raconterai bientôt l’histoire de ${project.name}.` : `I’ll share the story behind ${project.name} soon.`}`;
  const index = state.projects.findIndex((item) => String(item.id) === String(project.id));
  const projectMeta = `${categoryName(project.category)}${project.language && project.language !== categoryName(project.category) ? ` · ${project.language}` : ''}`;
  return `<section class="chat-panel ${modal ? 'chat-modal' : ''}" aria-label="${t('conversation')}"><header class="chat-head"><span class="chat-route-mark">${icon('matches')}</span><div><h2>${t('conversation')}</h2><span>${t('savedStatus')}</span></div><button class="icon-button chat-close" data-action="close-chat" aria-label="${state.lang === 'fr' ? 'Fermer la conversation' : 'Close conversation'}">${icon('close')}</button></header>
    <div class="chat-body"><div class="chat-project">${projectArt(project, index, 'small')}<div><strong>${escapeHTML(project.name)}</strong><span>${escapeHTML(projectMeta)}</span></div></div><p class="chat-message">${escapeHTML(message)}</p><a class="repo-link" href="${escapeHTML(project.htmlUrl)}" target="_blank" rel="noreferrer">${icon('github')}<span>${t('repoLink')}</span>${icon('arrow', 'repo-arrow')}</a></div>
  </section>`;
}
function renderMatches() {
  const active = state.matches.find((match) => String(match.id) === String(state.chatId)) || state.matches[0];
  return `<section class="view matches-view">${viewHeading(t('matchesTitle'), t('matchesIntro'), `<span class="view-count">${state.matches.length}<i> ${t('matchesCount')}</i></span>`)}
    ${state.matches.length ? `<div class="matches-layout"><div class="matches-list" aria-label="${t('matchesTitle')}">${state.matches.map((project, index) => `<button class="match-card ${String(active?.id) === String(project.id) ? 'selected' : ''} ${String(project.id) === String(state.freshMatchId) ? 'match-enter' : ''}" data-match="${escapeHTML(project.id)}"><span class="match-rail ${routePalette[routeIndex(project.category || project.language)]}"></span><span class="match-thumb">${projectArt(project, state.projects.indexOf(project), 'small')}</span><span class="match-info"><strong>${escapeHTML(project.name)}</strong><small>${escapeHTML(categoryName(project.category))}${project.language && project.language !== categoryName(project.category) ? ` · ${escapeHTML(project.language)}` : ''}</small></span><span class="match-index">${String(index + 1).padStart(2, '0')}</span>${icon('arrow', 'match-arrow')}</button>`).join('')}</div><div class="matches-detail">${renderChat(active)}</div></div>` : `<div class="empty-state matches-empty"><span class="empty-mark">${icon('matches')}</span><h2>${t('matchesEmpty')}</h2><p>${t('matchesEmptyHint')}</p><a href="#swipe" class="button button-secondary" data-tab="swipe">${t('nav.swipe')} ${icon('arrow')}</a></div>`}
  </section>`;
}
function renderProfile() {
  const profile = t('profileData');
  return `<section class="view profile-view">${viewHeading(t('profileTitle'), t('profileSubtitle'), `<button class="tool-button language-toggle profile-language" data-action="language" aria-label="${t('selectLanguage')}">${state.lang.toUpperCase()}</button>`)}
    <div class="profile-layout"><div class="profile-main"><section class="profile-hero"><div class="portrait-placeholder" aria-label="${state.lang === 'fr' ? 'Emplacement photo à personnaliser' : 'Photo placeholder to customize'}"><span>J</span><i>${state.lang === 'fr' ? 'PHOTO À AJOUTER' : 'PHOTO TO ADD'}</i><b></b></div><div class="profile-intro"><h2>Jules<span>.</span></h2><p>${t('bio')}</p><span class="profile-status">${t('profileSubtitle')}</span><span class="demo-chip">${t('demoLabel')}</span></div></section>
      <section class="profile-section"><header class="section-title"><h2>${t('experience')}</h2></header><div class="timeline">${profile.experience.map((item) => `<article class="timeline-item"><span class="timeline-dot"></span><div class="timeline-top"><h3>${escapeHTML(item.role)}</h3><span>${escapeHTML(item.date)}</span></div><p class="timeline-meta">${escapeHTML(item.company)} · ${escapeHTML(item.place)}</p><p>${escapeHTML(item.description)}</p><div class="tag-row">${item.tools.map((tool) => `<span class="tag">${escapeHTML(tool)}</span>`).join('')}</div></article>`).join('')}</div></section>
      <section class="profile-section"><header class="section-title"><h2>${t('education')}</h2></header>${profile.education.map((item) => `<article class="education-item"><span class="education-route"></span><div><div class="timeline-top"><h3>${escapeHTML(item.program)}</h3><span>${escapeHTML(item.date)}</span></div><p class="timeline-meta">${escapeHTML(item.school)}</p><p>${escapeHTML(item.details)}</p></div></article>`).join('')}</section></div>
      <aside class="profile-aside"><section class="contact-card"><span class="aside-mark">JB</span><h2>${t('contact')}</h2><p>${t('contactHint')}</p><div class="contact-links"><a href="https://github.com/RavenJB" target="_blank" rel="noreferrer">${icon('github')} GitHub <span>↗</span></a><span class="contact-placeholder">LinkedIn <small>${state.lang === 'fr' ? 'à ajouter' : 'to add'}</small></span><span class="contact-placeholder">Email <small>${state.lang === 'fr' ? 'à ajouter' : 'to add'}</small></span></div><a class="button button-primary cv-button" href="#" aria-disabled="true" data-action="cv">${t('cvMissing')}</a></section>
        <section class="profile-section skills-section"><header class="section-title"><h2>${t('skills')}</h2></header>${profile.skills.map((group) => `<div class="skill-group"><h3>${escapeHTML(group.name)}</h3><div class="tag-row">${group.items.map((skill) => `<span class="tag">${escapeHTML(skill)}</span>`).join('')}</div></div>`).join('')}<div class="skill-group"><h3>${t('languages')}</h3><div class="language-list">${profile.languages.map((language) => `<p>${escapeHTML(language)}</p>`).join('')}</div></div><p class="demo-note">${t('demoLabel')}</p></section></aside>
    </div><footer class="site-footer"><span>LE BARON · JULES</span><span>${t('footerNote')}</span><a href="https://github.com/RavenJB/Le-Baron" target="_blank" rel="noreferrer">${icon('github')} ${t('portfolioRepository')}</a></footer>
  </section>`;
}
function renderToast() {
  return state.freshMatchId ? `<div class="match-toast" role="status" aria-live="polite">${icon('matches')}<span>${t('matchAdded')}</span></div>` : '';
}
function render() {
  document.documentElement.lang = state.lang || 'fr';
  document.documentElement.dataset.theme = state.theme;
  const body = state.intro ? renderIntro() : `${renderHeader()}<main class="main-content">${state.tab === 'swipe' ? renderSwipe() : state.tab === 'categories' ? renderCategories() : state.tab === 'matches' ? renderMatches() : renderProfile()}</main>${renderMobileNav()}${renderToast()}`;
  root.innerHTML = body;
  bindEvents();
}
function persist() {
  safeWrite('le-baron-history', state.history);
  safeWrite('le-baron-matches', state.matches);
}
function setLanguage(lang) {
  state.lang = lang;
  try { localStorage.setItem('le-baron-language', lang); } catch { /* storage is optional */ }
  render();
}
function decide(direction) {
  if (state.transitioning || !['like', 'pass'].includes(direction)) return;
  const project = currentProject();
  if (!project || wasSeen(project.id)) return;
  state.transitioning = direction;
  state.arrival = '';
  render();
  window.setTimeout(() => {
    state.history.push({ id: project.id, direction });
    if (direction === 'like') {
      state.matches = [project, ...state.matches.filter((match) => String(match.id) !== String(project.id))];
      state.chatId = project.id;
      state.freshMatchId = String(project.id);
    } else if (String(state.chatId) === String(project.id)) state.chatId = '';
    state.focusId = '';
    state.transitioning = '';
    state.arrival = direction === 'like' ? 'next' : 'next';
    persist(); render();
    window.setTimeout(() => { state.arrival = ''; render(); }, 580);
    if (direction === 'like') window.setTimeout(() => { state.freshMatchId = ''; render(); }, 1500);
  }, 420);
}
function undo() {
  if (state.transitioning) return;
  const last = state.history.pop();
  if (!last) return;
  if (last.direction === 'like') state.matches = state.matches.filter((project) => String(project.id) !== String(last.id));
  state.chatId = '';
  state.focusId = last.id;
  state.arrival = 'undo';
  state.freshMatchId = '';
  persist(); render();
  window.setTimeout(() => { state.arrival = ''; render(); }, 580);
}
function bindEvents() {
  root.querySelectorAll('[data-language]').forEach((button) => button.addEventListener('click', () => setLanguage(button.dataset.language)));
  root.querySelectorAll('[data-tab]').forEach((link) => link.addEventListener('click', () => {
    state.tab = link.dataset.tab;
    state.filter = '';
    if (state.tab === 'swipe') { state.focusId = ''; state.chatId = ''; }
    if (location.hash !== `#${state.tab}`) location.hash = state.tab;
  }));
  root.querySelectorAll('[data-action]').forEach((button) => button.addEventListener('click', (event) => {
    const action = button.dataset.action;
    if (action === 'enter') { state.intro = false; state.tab = 'swipe'; state.focusId = ''; location.hash = 'swipe'; render(); }
    if (action === 'pass') decide('pass');
    if (action === 'like') decide('like');
    if (action === 'undo') undo();
    if (action === 'restart') { state.history = []; state.focusId = ''; state.filter = ''; persist(); render(); }
    if (action === 'clear-filter') { state.filter = ''; state.focusId = ''; render(); }
    if (action === 'close-chat') { state.chatId = ''; render(); }
    if (action === 'theme') { state.theme = state.theme === 'light' ? 'dark' : 'light'; try { localStorage.setItem('le-baron-theme', state.theme); } catch { /* storage is optional */ } render(); }
    if (action === 'language') setLanguage(state.lang === 'fr' ? 'en' : 'fr');
    if (action === 'cv') event.preventDefault();
  }));
  root.querySelectorAll('[data-category]').forEach((button) => button.addEventListener('click', () => { state.filter = button.dataset.category; state.focusId = ''; render(); }));
  root.querySelectorAll('[data-launch-category]').forEach((button) => button.addEventListener('click', () => { state.filter = button.dataset.launchCategory; state.tab = 'swipe'; state.focusId = ''; state.chatId = ''; location.hash = 'swipe'; render(); }));
  root.querySelectorAll('[data-project]').forEach((button) => button.addEventListener('click', () => {
    state.focusId = button.dataset.project;
    state.arrival = 'select';
    if (state.tab !== 'swipe') { state.tab = 'swipe'; state.filter = ''; state.chatId = ''; location.hash = 'swipe'; }
    const projectId = button.dataset.project;
    render();
    root.querySelector(`[data-project="${CSS.escape(projectId)}"]`)?.focus({ preventScroll: true });
    window.setTimeout(() => { state.arrival = ''; render(); }, 420);
  }));
  root.querySelectorAll('[data-match]').forEach((button) => button.addEventListener('click', () => { state.chatId = button.dataset.match; render(); }));
  const card = root.querySelector('[data-project-card]');
  if (card) {
    card.addEventListener('pointerdown', (event) => { if (event.target.closest('a,button')) return; card.setPointerCapture(event.pointerId); card.dataset.startX = String(event.clientX); });
    card.addEventListener('pointerup', (event) => {
      if (!card.hasPointerCapture(event.pointerId)) return;
      const delta = event.clientX - Number(card.dataset.startX || event.clientX);
      card.releasePointerCapture(event.pointerId);
      if (Math.abs(delta) > 90) decide(delta > 0 ? 'like' : 'pass');
    });
  }
}

window.addEventListener('hashchange', () => {
  const tab = location.hash.slice(1);
  if (['swipe', 'categories', 'matches', 'profile'].includes(tab)) { state.tab = tab; state.intro = false; render(); }
});
window.addEventListener('keydown', (event) => {
  if (state.intro || state.tab !== 'swipe' || /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName)) return;
  if (event.key === 'ArrowLeft') { event.preventDefault(); decide('pass'); }
  if (event.key === 'ArrowRight') { event.preventDefault(); decide('like'); }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); undo(); }
});

function loadProjects() {
  fetch(`${BASE}data/projects.json`).then((response) => {
    if (!response.ok) throw new Error('Project data unavailable');
    return response.json();
  }).then((projects) => { state.projects = projects; render(); }).catch(() => { state.projects = []; render(); });
}

render();
loadProjects();
