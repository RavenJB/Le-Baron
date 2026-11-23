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
  tab: ['swipe', 'categories', 'matches', 'profile'].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'swipe',
  projects: [],
  filter: '',
  search: '',
  sort: 'recent',
  discovery: false,
  focusProjectId: location.hash.startsWith('#project=') ? decodeURIComponent(location.hash.slice(9)) : '',
  detailProjectId: '',
  installPrompt: null,
  history: safeRead('le-baron-history', []),
  matches: safeRead('le-baron-matches', []),
  chatMessages: safeRead('le-baron-chat-messages', {}),
  botTypingIds: new Set(),
  chatId: '',
  typing: false,
  intro: !localStorage.getItem('le-baron-language'),
  dragX: 0,
  animating: false,
};

const t = (key) => key.split('.').reduce((value, part) => value?.[part], LOCALES[state.lang || 'fr']) ?? key;
const escapeHTML = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const visibleProjects = () => {
  const query = state.search.trim().toLocaleLowerCase(state.lang);
  const results = state.projects.filter((project) => {
    if (state.filter && project.category !== state.filter) return false;
    if (!query) return true;
    return [project.name, project.language, project.category, project.description, ...(project.topics || [])].some((value) => localize(value).toLocaleLowerCase(state.lang).includes(query));
  });
  return results.sort((a, b) => state.sort === 'stars'
    ? (b.stars || 0) - (a.stars || 0) || a.name.localeCompare(b.name)
    : state.sort === 'name'
      ? a.name.localeCompare(b.name)
      : String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')) || a.name.localeCompare(b.name));
};
const currentProject = () => {
  if (state.focusProjectId) {
    const focused = state.projects.find((project) => String(project.id) === String(state.focusProjectId));
    if (focused) return focused;
  }
  const seen = new Set(state.history.map((item) => item.id));
  const pool = state.discovery
    ? [...state.projects].sort((a, b) => Number(b.featured) - Number(a.featured) || (b.stars || 0) - (a.stars || 0) || String(b.updatedAt || '').localeCompare(String(a.updatedAt || ''))).slice(0, 3)
    : state.projects;
  return pool.find((project) => !seen.has(project.id) && (!state.filter || project.category === state.filter));
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
  send: '<path d="M21 3 10 14M21 3l-7 18-4-7-7-4 18-7Z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/>',
  moon: '<path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z"/>',
  pin: '<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.7 6.8-4.4m-6.8 7 6.8 4.4"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8h.01"/>',
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
const hashValue = (value = '') => [...String(value)].reduce((hash, char) => ((hash * 31) + char.charCodeAt(0)) >>> 0, 7);
const visual = (project) => {
  if (project?.image) return `<img class="project-image" src="${escapeHTML(project.image)}" alt="${escapeHTML(project.name)}" />`;
  const seed = hashValue(project?.id || project?.name);
  const palettes = [
    { paper: '#f6f1e7', ink: '#111111', blue: '#2f3cff', red: '#ff4b33' },
    { paper: '#2f3cff', ink: '#111111', blue: '#ff4b33', red: '#f6f1e7' },
    { paper: '#ff4b33', ink: '#111111', blue: '#2f3cff', red: '#f6f1e7' },
    { paper: '#e8e3d8', ink: '#111111', blue: '#2f3cff', red: '#ff4b33' },
  ];
  const palette = palettes[seed % palettes.length];
  const motif = seed % 3;
  const geometry = motif === 0
    ? `<rect x="436" y="-40" width="190" height="500" rx="94" fill="${palette.red}" transform="rotate(29 436 -40)"/><path d="M0 340 600 75M0 430 600 165M40 0l360 480M140 0l360 480" stroke="${palette.ink}" stroke-opacity=".22" stroke-width="2"/>`
    : motif === 1
      ? `<circle cx="500" cy="166" r="146" fill="${palette.red}" stroke="${palette.ink}" stroke-width="5"/><circle cx="500" cy="166" r="92" fill="none" stroke="${palette.ink}" stroke-width="3"/><path d="M355 166h290M500 21v290" stroke="${palette.ink}" stroke-width="2"/>`
      : `<path d="M370 0h230v480H370z" fill="${palette.red}" stroke="${palette.ink}" stroke-width="5"/><path d="M400 75h170m-170 55h130m-130 55h155m-155 55h105" stroke="${palette.ink}" stroke-width="5" stroke-linecap="square"/><circle cx="490" cy="347" r="57" fill="${palette.blue}" stroke="${palette.ink}" stroke-width="5"/>`;
  const symbol = /python|php|code|node|javascript/i.test(`${project?.language} ${project?.category}`) ? '&lt;/&gt;' : /data|sql|database/i.test(`${project?.language} ${project?.category}`) ? 'DB' : 'JB';
  const label = escapeHTML(project?.language || categoryName(project?.category) || 'PROJECT');
  const name = escapeHTML(project?.name || 'Le Baron');
  return `<svg class="project-illustration" aria-hidden="true" viewBox="0 0 600 480" preserveAspectRatio="xMidYMid slice"><rect width="600" height="480" fill="${palette.paper}"/>${geometry}<path d="M25 26h550v428H25z" fill="none" stroke="${palette.ink}" stroke-width="3"/><rect x="42" y="43" width="90" height="42" fill="${palette.blue}" stroke="${palette.ink}" stroke-width="3"/><text x="87" y="72" text-anchor="middle" fill="${palette.paper}" font-family="DM Mono,monospace" font-size="19" font-weight="700">${symbol}</text><text x="43" y="383" fill="${palette.ink}" font-family="DM Mono,monospace" font-size="14" letter-spacing="2">${label.toUpperCase()}</text><text x="41" y="426" fill="${palette.ink}" font-family="Bricolage Grotesque,system-ui,sans-serif" font-size="27" font-weight="800">${name.length > 25 ? `${name.slice(0, 22)}…` : name}</text><path d="M518 410h36m-18-18v36" stroke="${palette.red}" stroke-width="8"/></svg>`;
};

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
  return `<header class="mobile-header"><a class="wordmark" href="#swipe"><span class="brand-mark small"><span>JB</span></span><span>Le Baron<span class="wordmark-dot">.</span></span></a><button class="theme-button" data-action="theme" aria-label="${t('themeToggle')}">${icon(state.theme === 'light' ? 'sun' : 'moon')}</button></header>`;
}

function projectCard(project, index = 0, compact = false) {
  const desc = titleFor(project);
  return `<article class="project-card ${compact ? 'compact-card' : ''}" data-project-id="${escapeHTML(project.id)}" style="--card-index:${index};--drag-x:${state.dragX}px;--drag-rot:${state.dragX * 0.045}deg"><div class="card-media">${visual(project)}${project.featured ? `<span class="featured-badge">${t('featured')}</span>` : ''}<button type="button" class="share-project" data-share-project="${escapeHTML(project.id)}" aria-label="${t('shareProject')}">${icon('share')}</button><span class="swipe-stamp like-stamp">LIKE</span><span class="swipe-stamp nope-stamp">NOPE</span></div><div class="card-content"><div class="card-overline"><span>${escapeHTML(categoryName(project.category))}</span><span class="card-index">${String(index + 1).padStart(2, '0')} <i>/</i> ${String(state.projects.length).padStart(2, '0')}</span></div><h2>${escapeHTML(project.name)}</h2><p class="card-description">${escapeHTML(desc)}</p><div class="tag-row">${(project.topics?.length ? project.topics.slice(0, 3) : [project.language || categoryName(project.category)]).map((tag) => `<span class="tag">${escapeHTML(tag)}</span>`).join('')}</div><div class="card-footer"><span class="repo-stats">${project.stars != null ? `${icon('star')} ${project.stars}` : ''}</span><button type="button" class="text-link detail-link" data-detail-project="${escapeHTML(project.id)}">${t('projectDetails')} ${icon('arrow')}</button><a href="${escapeHTML(project.htmlUrl)}" target="_blank" rel="noreferrer" class="text-link">GitHub ${icon('arrow')}</a></div></div></article>`;
}

function renderChat(project, modal = false) {
  if (!project) return '';
  const message = localize(project.message) || `[DEMO] ${state.lang === 'fr' ? `Je te raconterai bientôt l’histoire de ${project.name}.` : `I’ll share the story behind ${project.name} soon.`}`;
  const chatKey = String(project.id);
  const messages = Array.isArray(state.chatMessages[chatKey]) ? state.chatMessages[chatKey] : [];
  const authorMessage = state.typing && String(state.chatId) === chatKey
    ? `<div class="typing-row"><span>${t('writing')}</span><div class="typing-bubble"><i></i><i></i><i></i></div></div>`
    : `<p class="chat-message chat-message-jules">${escapeHTML(message)}</p>`;
  const conversation = messages.map((item) => `<p class="chat-message ${item.role === 'user' ? 'chat-message-user' : 'chat-message-bot'}"><span>${item.role === 'user' ? (state.lang === 'fr' ? 'Toi' : 'You') : t('chatAssistantLabel')}</span>${escapeHTML(item.text)}</p>`).join('');
  const botTyping = state.botTypingIds.has(chatKey)
    ? `<div class="typing-row bot-typing" aria-live="polite"><span>${t('chatBotTyping')}</span><div class="typing-bubble"><i></i><i></i><i></i></div></div>`
    : '';
  return `<section class="chat-panel ${modal ? 'chat-modal' : ''}" aria-label="${t('conversation')}"><div class="chat-head"><span class="chat-avatar">JB</span><div><p class="chat-title">${t('conversation')}</p><span class="chat-presence">Jules · Le Baron</span></div><button class="icon-button chat-close" data-action="close-chat" aria-label="${state.lang === 'fr' ? 'Fermer la conversation' : 'Close conversation'}">${icon('close')}</button></div><div class="chat-body"><div class="chat-project-chip">${visual(project)}<span>${escapeHTML(project.name)}</span><button type="button" class="chat-detail-button" data-detail-project="${escapeHTML(chatKey)}">${t('projectDetails')}</button><a class="repo-open" href="${escapeHTML(project.htmlUrl)}" target="_blank" rel="noreferrer" aria-label="${t('repoLink')}">↗</a></div><div class="chat-assistant-label"><span class="online-dot"></span>${t('chatAssistantLabel')}</div><div class="chat-stream" role="log" aria-live="polite">${authorMessage}${conversation}${botTyping}</div><a class="button button-primary repo-button" href="${escapeHTML(project.htmlUrl)}" target="_blank" rel="noreferrer">${t('repoLink')} ${icon('arrow')}</a><p class="chat-quick-label">${t('chatQuickPromptLabel')}</p><div class="chat-quick-prompts"><button type="button" data-chat-prompt="tech" data-project-id="${escapeHTML(chatKey)}">${t('chatPromptTech')}</button><button type="button" data-chat-prompt="repo" data-project-id="${escapeHTML(chatKey)}">${t('chatPromptRepo')}</button><button type="button" data-chat-prompt="about" data-project-id="${escapeHTML(chatKey)}">${t('chatPromptAbout')}</button></div><form class="chat-composer" data-chat-form data-project-id="${escapeHTML(chatKey)}"><label class="sr-only" for="chat-input-${escapeHTML(chatKey)}">${t('chatInputLabel')}</label><input id="chat-input-${escapeHTML(chatKey)}" name="message" type="text" maxlength="500" autocomplete="off" placeholder="${t('chatPlaceholder')}" ${state.botTypingIds.has(chatKey) || (state.typing && String(state.chatId) === chatKey) ? 'disabled' : ''} /><button class="chat-send" type="submit" aria-label="${t('chatSend')}" ${state.botTypingIds.has(chatKey) || (state.typing && String(state.chatId) === chatKey) ? 'disabled' : ''}>${icon('send')}</button></form></div></section>`;
}

function getBotReply(project, text) {
  const question = String(text).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (/\b(bonjour|salut|hello|hi|hey)\b/.test(question)) return t('chatHello');
  if (/(techn|stack|langage|language|framework|outil|techno)/.test(question)) {
    const items = [...new Set([project.language, ...(project.topics || [])].filter(Boolean))];
    return items.length ? t('chatTechKnown').replace('{items}', items.join(', ')) : t('chatTechUnknown');
  }
  if (/(description|de quoi|projet|project|idee|idée)/.test(question)) {
    const description = titleFor(project);
    return description.includes('[DEMO]') ? t('chatDescriptionDemo') : description;
  }
  if (/(github|repo|code|source|lien|link)/.test(question)) return t('chatRepoAnswer');
  if (/(jules|contact|email|linkedin|experience|expérience|formation|profil|about)/.test(question)) return t('chatContactAnswer');
  return t('chatFallback');
}

function sendChat(projectId, text) {
  const content = String(text || '').trim().slice(0, 500);
  if (!content || state.botTypingIds.has(String(projectId))) return;
  const project = state.projects.find((item) => String(item.id) === String(projectId)) || state.matches.find((item) => String(item.id) === String(projectId));
  if (!project) return;
  const key = String(project.id);
  state.chatMessages[key] ??= [];
  state.chatMessages[key].push({ role: 'user', text: content });
  state.botTypingIds.add(key);
  persist();
  render();
  window.setTimeout(() => {
    state.chatMessages[key].push({ role: 'assistant', text: getBotReply(project, content) });
    state.botTypingIds.delete(key);
    persist();
    render();
  }, 650);
}

function renderSwipe() {
  const project = currentProject();
  const activeMatch = state.chatId && state.matches.find((match) => String(match.id) === String(state.chatId));
  const tools = `<div class="discovery-tools"><button class="button ${state.discovery ? 'button-primary' : 'button-secondary'}" data-action="discovery">${state.discovery ? t('discoveryStop') : t('discoveryStart')}</button><button class="text-link" data-action="surprise">${t('surpriseMe')} ${icon('sparkle')}</button></div>`;
  return `<section class="view swipe-view"><div class="view-heading"><div><p class="eyebrow">${state.filter ? escapeHTML(categoryName(state.filter)) : t('allProjects')}</p><h1>${t('swipeTitle')}<span class="period">.</span></h1><p class="view-subtitle">${state.discovery ? t('discoveryHint') : t('swipeHint')}</p></div><div class="swipe-heading-actions">${tools}${state.filter ? `<button class="text-link" data-action="clear-filter">${t('allCategories')}</button>` : ''}</div></div><div class="swipe-layout"><div class="swipe-stage">${project ? `<div class="card-stack">${state.projects.filter((candidate) => candidate.id !== project.id && (!state.filter || candidate.category === state.filter)).slice(-1).map((item) => `<div class="card-back">${visual(item)}</div>`).join('')}${projectCard(project)}</div><div class="swipe-actions"><button class="action-button action-pass" data-action="pass" aria-label="${t('nope')}">${icon('close')}<span>${t('nope')}</span></button><button class="action-button action-undo" data-action="undo" aria-label="${t('undo')}" ${state.history.length ? '' : 'disabled'}>${icon('arrow')}<span>${t('undo')}</span></button><button class="action-button action-like" data-action="like" aria-label="${t('like')}">${icon('matches')}<span>${t('like')}</span></button></div>` : `<div class="empty-state"><span class="empty-star">✳</span><h2>${t('emptyTitle')}</h2><p>${t('emptyText')}</p><button class="button button-primary" data-action="restart">${t('restart')} ${icon('arrow')}</button></div>`}</div><aside class="swipe-side">${activeMatch ? renderChat(activeMatch) : `<div class="side-note"><span class="side-note-mark">JB</span><p>${t('conversation')}</p><span>${t('matchesEmpty')}</span></div>`}</aside></div></section>${state.chatId && activeMatch ? `<div class="mobile-chat-overlay">${renderChat(activeMatch, true)}</div>` : ''}`;
}

function renderCategories() {
  const filtered = visibleProjects();
  const categories = [...new Set(state.projects.map((project) => project.category || 'Autre'))].sort((a, b) => categoryName(a).localeCompare(categoryName(b)));
  const counts = new Map(categories.map((category) => [category, filtered.filter((project) => project.category === category).length]));
  return `<section class="view categories-view"><div class="view-heading"><div><p class="eyebrow">${t('allProjects')}</p><h1>${t('categoriesTitle')}<span class="period">.</span></h1></div><span class="project-count">${filtered.length} ${t(filtered.length === 1 ? 'repoCountSingular' : 'reposCount')}</span></div><div class="project-controls"><label class="project-search"><span class="sr-only">${t('searchProjects')}</span>${icon('categories')}<input type="search" data-project-search value="${escapeHTML(state.search)}" placeholder="${t('searchProjects')}" /></label><label class="sort-control"><span>${t('sortBy')}</span><select data-project-sort><option value="recent" ${state.sort === 'recent' ? 'selected' : ''}>${t('sortRecent')}</option><option value="stars" ${state.sort === 'stars' ? 'selected' : ''}>${t('sortStars')}</option><option value="name" ${state.sort === 'name' ? 'selected' : ''}>${t('sortName')}</option></select></label></div><div class="category-chips"><button class="category-filter ${!state.filter ? 'selected' : ''}" data-category="">${t('allCategories')}</button>${categories.map((category) => `<button class="category-filter ${state.filter === category ? 'selected' : ''}" data-category="${escapeHTML(category)}">${escapeHTML(categoryName(category))}<span>${counts.get(category)}</span></button>`).join('')}</div><div class="category-grid">${categories.filter((category) => (!state.filter || state.filter === category) && filtered.some((project) => project.category === category)).map((category) => `<section class="category-section"><div class="category-heading"><div class="category-icon">${categoryIcon(category)}</div><div><h2>${escapeHTML(categoryName(category))}</h2><span>${counts.get(category)} ${state.lang === 'fr' ? 'projet(s)' : 'project(s)'}</span></div><button class="text-link" data-launch-category="${escapeHTML(category)}">${t('launchSwipe')} ${icon('arrow')}</button></div><div class="project-grid">${filtered.filter((project) => project.category === category).map((project) => `<article class="mini-project"><div class="mini-cover">${visual(project)}<a class="mini-arrow" href="${escapeHTML(project.htmlUrl)}" target="_blank" rel="noreferrer" aria-label="${t('repoLink')}">↗</a><button class="mini-share" type="button" data-share-project="${escapeHTML(project.id)}" aria-label="${t('shareProject')}">${icon('share')}</button></div><div class="mini-content"><div class="mini-topline"><span>${escapeHTML(project.language || categoryName(category))}</span>${project.stars != null ? `<span>${icon('star')} ${project.stars}</span>` : ''}</div><h3>${escapeHTML(project.name)}</h3><p>${escapeHTML(titleFor(project))}</p><div class="tag-row">${(project.topics || []).slice(0, 3).map((topic) => `<span class="tag">${escapeHTML(topic)}</span>`).join('')}</div><button type="button" class="text-link mini-detail-link" data-detail-project="${escapeHTML(project.id)}">${t('projectDetails')} ${icon('arrow')}</button></div></article>`).join('')}</div></section>`).join('') || `<div class="empty-state search-empty"><span class="empty-star">✳</span><h2>${t('noSearchResults')}</h2></div>`}</div></section>`;
}

function safeExternalUrl(value) {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch {
    return '';
  }
}

function renderProjectDetails(project) {
  if (!project) return '';
  const rawDescription = titleFor(project).trim();
  const isDemo = rawDescription.startsWith('[DEMO]');
  const description = rawDescription.replace(/^\[DEMO\]\s*/i, '') || t('projectDescriptionMissing');
  const updatedAt = project.updatedAt && !Number.isNaN(new Date(project.updatedAt).valueOf())
    ? new Intl.DateTimeFormat(state.lang === 'fr' ? 'fr-FR' : 'en-US', { dateStyle: 'long' }).format(new Date(project.updatedAt))
    : t('projectDetailUnknown');
  const repoUrl = safeExternalUrl(project.htmlUrl);
  const homepageUrl = safeExternalUrl(project.homepage);
  const topics = Array.isArray(project.topics) ? project.topics.filter(Boolean) : [];
  return `<dialog class="project-detail-dialog" aria-labelledby="project-detail-title"><article class="project-detail-sheet"><header class="project-detail-header"><span class="project-detail-category">${escapeHTML(categoryName(project.category))}</span><button type="button" class="icon-button" data-close-detail aria-label="${t('closeProjectDetails')}" autofocus>${icon('close')}</button></header><div class="project-detail-art">${visual(project)}</div><div class="project-detail-content"><p class="eyebrow">${t('projectDetailsKicker')}</p><h2 id="project-detail-title">${escapeHTML(project.name)}</h2>${isDemo ? `<span class="project-demo-badge">${t('projectDemoBadge')}</span>` : ''}<p class="project-detail-description">${escapeHTML(description)}</p><dl class="project-detail-facts"><div><dt>${t('projectLanguage')}</dt><dd>${escapeHTML(project.language || t('projectDetailUnknown'))}</dd></div><div><dt>${t('projectUpdated')}</dt><dd>${escapeHTML(updatedAt)}</dd></div><div><dt>${t('projectStars')}</dt><dd>${Number(project.stars) || 0}</dd></div><div><dt>${t('projectForks')}</dt><dd>${Number(project.forks) || 0}</dd></div></dl><section class="project-detail-topics"><h3>${t('projectTopics')}</h3>${topics.length ? `<div class="tag-row">${topics.map((topic) => `<span class="tag">${escapeHTML(topic)}</span>`).join('')}</div>` : `<p>${t('projectTopicsMissing')}</p>`}</section><div class="project-detail-links">${repoUrl ? `<a class="button button-primary" href="${escapeHTML(repoUrl)}" target="_blank" rel="noreferrer">${t('repoLink')} ${icon('arrow')}</a>` : ''}${homepageUrl ? `<a class="button button-secondary" href="${escapeHTML(homepageUrl)}" target="_blank" rel="noreferrer">${t('projectLiveSite')} ${icon('arrow')}</a>` : ''}</div></div></article></dialog>`;
}

function renderMatches() {
  return `<section class="view matches-view"><div class="view-heading"><div><p class="eyebrow">${t('nav.matches')}</p><h1>${t('matchesTitle')}<span class="period">.</span></h1></div><span class="project-count">${state.matches.length} ${state.lang === 'fr' ? 'match(s)' : 'match(es)'}</span></div>${state.matches.length ? `<div class="matches-layout"><div class="matches-list">${state.matches.map((project) => `<button class="match-card ${String(project.id) === String(state.chatId) ? 'selected' : ''}" data-match="${escapeHTML(project.id)}"><span class="match-cover">${visual(project)}</span><span class="match-info"><strong>${escapeHTML(project.name)}</strong><small>${escapeHTML(categoryName(project.category))}</small></span>${icon('arrow')}</button>`).join('')}</div><div class="matches-chat">${renderChat(state.matches.find((project) => String(project.id) === String(state.chatId)) || state.matches[0])}</div></div>` : `<div class="empty-state matches-empty"><span class="empty-star">✳</span><h2>${t('matchesEmpty')}</h2><a href="#swipe" class="button button-secondary">${t('nav.swipe')} ${icon('arrow')}</a></div>`}</section>`;
}

function renderProfile() {
  const profile = t('profileData');
  return `<section class="view profile-view"><div class="view-heading"><div><p class="eyebrow">${t('nav.profile')}</p><h1>${t('profileTitle')}<span class="period">.</span></h1></div><button class="language-toggle" data-action="language" aria-label="${t('selectLanguage')}">${state.lang.toUpperCase()}</button></div><div class="profile-layout"><div class="profile-main"><section class="profile-hero"><div class="portrait-placeholder" aria-label="${state.lang === 'fr' ? 'Emplacement photo à personnaliser' : 'Photo placeholder to customize'}"><span>J</span><i>PHOTO<br/>À AJOUTER</i></div><div class="profile-intro"><p class="eyebrow">${t('profileSubtitle')}</p><h2>Jules<span class="period">.</span></h2><p>${t('bio')}</p><span class="location-pin">${icon('pin')} ${t('location')}</span><span class="demo-chip">${t('demoLabel')}</span></div></section><section class="profile-section"><div class="section-title"><h2>${t('experience')}</h2><span>01</span></div><div class="timeline">${profile.experience.map((item) => `<article class="timeline-item"><span class="timeline-dot"></span><div class="timeline-top"><h3>${escapeHTML(item.role)}</h3><span>${escapeHTML(item.date)}</span></div><p class="timeline-meta">${escapeHTML(item.company)} · ${escapeHTML(item.place)}</p><p>${escapeHTML(item.description)}</p><div class="tag-row">${item.tools.map((tool) => `<span class="tag">${escapeHTML(tool)}</span>`).join('')}</div></article>`).join('')}</div></section><section class="profile-section"><div class="section-title"><h2>${t('education')}</h2><span>02</span></div>${profile.education.map((item) => `<article class="education-item"><span class="education-icon">${icon('sparkle')}</span><div><div class="timeline-top"><h3>${escapeHTML(item.program)}</h3><span>${escapeHTML(item.date)}</span></div><p class="timeline-meta">${escapeHTML(item.school)}</p><p>${escapeHTML(item.details)}</p></div></article>`).join('')}</section></div><aside class="profile-aside"><section class="contact-card"><span class="aside-mark">JB</span><h2>${t('contact')}</h2><p>${t('contactHint')}</p><div class="contact-links"><a href="https://github.com/RavenJB" target="_blank" rel="noreferrer">${icon('categories')} GitHub <span>↗</span></a><span class="contact-placeholder">LinkedIn <small>à ajouter</small></span><span class="contact-placeholder">Email <small>à ajouter</small></span></div><a class="button button-primary cv-button" href="#" aria-disabled="true" data-action="cv">${t('cvMissing')}</a></section><section class="profile-section local-settings"><h2>${t('localDataTitle')}</h2><p>${t('localDataText')}</p><button class="button button-secondary" data-action="clear-local">${t('clearLocalData')}</button><button class="button button-secondary install-button" data-action="install-app">${t('pwaInstall')}</button></section><section class="profile-section skills-section"><div class="section-title"><h2>${t('skills')}</h2><span>03</span></div>${profile.skills.map((group) => `<div class="skill-group"><h3>${escapeHTML(group.name)}</h3><div class="tag-row">${group.items.map((skill) => `<span class="tag">${escapeHTML(skill)}</span>`).join('')}</div></div>`).join('')}<div class="skill-group"><h3>${t('languages')}</h3><div class="language-list">${profile.languages.map((language) => `<p>${escapeHTML(language)}</p>`).join('')}</div></div><p class="demo-note">${t('demoLabel')}</p></section></aside></div><footer class="site-footer"><span>LE BARON · JULES</span><span>Fait avec un peu de culot <i>✳</i></span><a href="https://github.com/RavenJB/Le-Baron" target="_blank" rel="noreferrer">GitHub ${icon('arrow')}</a></footer></section>`;
}

function render() {
  document.documentElement.lang = state.lang || 'fr';
  document.documentElement.dataset.theme = state.theme;
  root.innerHTML = `${state.intro ? renderIntro() : `${renderHeader()}<div class="app-shell"><aside class="desktop-rail"><a class="brand-mark" href="#swipe" aria-label="Le Baron"><span>JB</span></a><div class="rail-label">LE BARON<br/>PORTFOLIO</div><nav>${['swipe', 'categories', 'matches', 'profile'].map((item) => `<a href="#${item}" data-tab="${item}" class="rail-link ${state.tab === item ? 'active' : ''}" aria-label="${t(`nav.${item}`)}">${icon(item)}<span>${t(`nav.${item}`)}</span></a>`).join('')}</nav><div class="rail-bottom"><button class="language-toggle" data-action="language">${state.lang.toUpperCase()}</button><button class="theme-button" data-action="theme" aria-label="${t('themeToggle')}">${icon(state.theme === 'light' ? 'sun' : 'moon')}</button><span>JULES © 2026</span></div></aside><main class="main-content">${state.tab === 'swipe' ? renderSwipe() : state.tab === 'categories' ? renderCategories() : state.tab === 'matches' ? renderMatches() : renderProfile()}</main></div>${renderNav()}`}${state.detailProjectId ? renderProjectDetails(state.projects.find((project) => String(project.id) === String(state.detailProjectId))) : ''}`;
  if (state.installPrompt) root.querySelector('.install-button')?.classList.add('install-ready');
  bindEvents();
  const detailDialog = root.querySelector('.project-detail-dialog');
  if (detailDialog && !detailDialog.open) detailDialog.showModal();
}

let toastTimer;
function toast(message) {
  let node = document.querySelector('.app-toast');
  if (!node) { node = document.createElement('div'); node.className = 'app-toast'; node.setAttribute('role', 'status'); document.body.append(node); }
  node.textContent = message;
  node.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => node.classList.remove('visible'), 2400);
}

async function shareProject(projectId) {
  const project = state.projects.find((item) => String(item.id) === String(projectId));
  if (!project) return;
  const url = new URL(BASE, location.origin);
  url.hash = `project=${encodeURIComponent(project.id)}`;
  try {
    if (navigator.share) await navigator.share({ title: `${project.name} · Le Baron`, text: titleFor(project), url: url.href });
    else { await navigator.clipboard.writeText(url.href); toast(t('shareCopied')); }
  } catch (error) {
    if (error?.name !== 'AbortError') toast(t('shareFailed'));
  }
}

function persist() {
  localStorage.setItem('le-baron-history', JSON.stringify(state.history));
  localStorage.setItem('le-baron-matches', JSON.stringify(state.matches));
  localStorage.setItem('le-baron-chat-messages', JSON.stringify(state.chatMessages));
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
  state.focusProjectId = '';
  if (location.hash.startsWith('#project=')) history.replaceState(null, '', `${location.pathname}${location.search}#swipe`);
  state.animating = true;
  const exitingCard = root.querySelector('.swipe-stage .project-card:not(.compact-card)');
  if (direction === 'like' && exitingCard) {
    const burst = document.createElement('div');
    burst.className = 'like-burst';
    burst.setAttribute('aria-hidden', 'true');
    burst.innerHTML = '<i class="burst-cross burst-cross-one"></i><i class="burst-cross burst-cross-two"></i><i class="burst-dot burst-dot-one"></i><i class="burst-dot burst-dot-two"></i><svg class="burst-heart" viewBox="0 0 48 48" fill="none"><path d="M24 41S5 29 5 16.5C5 5 20 2 24 14 28 2 43 5 43 16.5 43 29 24 41 24 41Z" fill="#ff4b33" stroke="#111" stroke-width="2.5" stroke-linejoin="round"/></svg>';
    exitingCard.querySelector('.card-media')?.append(burst);
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) window.navigator.vibrate?.(14);
  }
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
  }, direction === 'like' ? 380 : 220);
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
    if (action === 'enter') { state.intro = false; state.tab = 'swipe'; location.hash = state.focusProjectId ? `project=${encodeURIComponent(state.focusProjectId)}` : 'swipe'; render(); }
    if (action === 'pass') decide('pass');
    if (action === 'like') decide('like');
    if (action === 'undo') undo();
    if (action === 'restart') { state.history = []; state.filter = ''; state.discovery = false; state.focusProjectId = ''; persist(); render(); }
    if (action === 'discovery') { state.discovery = !state.discovery; state.focusProjectId = ''; if (state.discovery) { const featured = state.projects.slice().sort((a, b) => Number(b.featured) - Number(a.featured) || (b.stars || 0) - (a.stars || 0)).slice(0, 3); state.history = state.history.filter((item) => !featured.some((project) => String(project.id) === String(item.id))); } render(); }
    if (action === 'surprise') { const pool = [...state.projects].sort((a, b) => Number(b.featured) - Number(a.featured) || (b.stars || 0) - (a.stars || 0)).slice(0, Math.min(3, state.projects.length)); const pick = pool[Math.floor(Math.random() * pool.length)]; if (pick) { state.focusProjectId = String(pick.id); state.discovery = true; state.tab = 'swipe'; history.replaceState(null, '', `${location.pathname}${location.search}#project=${encodeURIComponent(pick.id)}`); render(); } }
    if (action === 'clear-local' && window.confirm(t('clearLocalConfirm'))) { state.history = []; state.matches = []; state.chatMessages = {}; state.chatId = ''; state.typing = false; state.botTypingIds.clear(); for (const key of ['le-baron-history', 'le-baron-matches', 'le-baron-chat-messages']) localStorage.removeItem(key); render(); toast(t('localDataCleared')); }
    if (action === 'install-app') { if (state.installPrompt) { state.installPrompt.prompt(); state.installPrompt = null; render(); } else toast(t('installHint')); }
    if (action === 'clear-filter') { state.filter = ''; render(); }
    if (action === 'close-chat') { state.chatId = ''; state.typing = false; render(); }
    if (action === 'theme') { state.theme = state.theme === 'light' ? 'dark' : 'light'; localStorage.setItem('le-baron-theme', state.theme); render(); }
    if (action === 'language') { state.lang = state.lang === 'fr' ? 'en' : 'fr'; localStorage.setItem('le-baron-language', state.lang); render(); }
    if (action === 'cv') { event.preventDefault(); }
  }));
  root.querySelectorAll('[data-category]').forEach((button) => button.addEventListener('click', () => { state.filter = button.dataset.category; render(); }));
  root.querySelectorAll('[data-launch-category]').forEach((button) => button.addEventListener('click', () => { state.filter = button.dataset.launchCategory; state.tab = 'swipe'; location.hash = 'swipe'; render(); }));
  root.querySelectorAll('[data-match]').forEach((button) => button.addEventListener('click', () => { state.chatId = button.dataset.match; state.typing = false; render(); }));
  root.querySelectorAll('[data-share-project]').forEach((button) => button.addEventListener('click', (event) => { event.preventDefault(); event.stopPropagation(); shareProject(button.dataset.shareProject); }));
  root.querySelectorAll('[data-detail-project]').forEach((button) => button.addEventListener('click', (event) => { event.preventDefault(); event.stopPropagation(); state.detailProjectId = button.dataset.detailProject; render(); }));
  const detailDialog = root.querySelector('.project-detail-dialog');
  detailDialog?.addEventListener('close', () => { state.detailProjectId = ''; });
  detailDialog?.addEventListener('click', (event) => { if (event.target === detailDialog) detailDialog.close(); });
  root.querySelector('[data-close-detail]')?.addEventListener('click', () => detailDialog?.close());
  const search = root.querySelector('[data-project-search]');
  search?.addEventListener('input', () => { const cursor = search.selectionStart; state.search = search.value; render(); const next = root.querySelector('[data-project-search]'); next?.focus(); next?.setSelectionRange(cursor, cursor); });
  root.querySelector('[data-project-sort]')?.addEventListener('change', (event) => { state.sort = event.target.value; render(); });
  root.querySelectorAll('[data-chat-form]').forEach((form) => form.addEventListener('submit', (event) => {
    event.preventDefault();
    const input = form.querySelector('input[name="message"]');
    sendChat(form.dataset.projectId, input?.value);
  }));
  root.querySelectorAll('[data-chat-prompt]').forEach((button) => button.addEventListener('click', () => {
    const questions = {
      tech: state.lang === 'fr' ? 'Quelles technologies utilise ce projet ?' : 'Which technologies does this project use?',
      repo: state.lang === 'fr' ? 'Où puis-je voir le code source ?' : 'Where can I see the source code?',
      about: state.lang === 'fr' ? 'Qui est Jules ?' : 'Who is Jules?',
    };
    sendChat(button.dataset.projectId, questions[button.dataset.chatPrompt]);
  }));
  const card = root.querySelector('.swipe-stage .project-card:not(.compact-card)');
  if (card) {
    card.addEventListener('pointerdown', (event) => { if (event.target.closest('a,button')) return; card.setPointerCapture(event.pointerId); card.dataset.startX = String(event.clientX); });
    card.addEventListener('pointermove', (event) => { if (card.hasPointerCapture(event.pointerId)) { state.dragX = event.clientX - Number(card.dataset.startX); card.style.setProperty('--drag-x', `${state.dragX}px`); card.style.setProperty('--drag-rot', `${state.dragX * 0.045}deg`); card.classList.toggle('drag-like', state.dragX > 45); card.classList.toggle('drag-pass', state.dragX < -45); } });
    card.addEventListener('pointerup', (event) => { if (!card.hasPointerCapture(event.pointerId)) return; card.releasePointerCapture(event.pointerId); if (Math.abs(state.dragX) > 90) decide(state.dragX > 0 ? 'like' : 'pass'); else { state.dragX = 0; card.style.setProperty('--drag-x', '0px'); card.style.setProperty('--drag-rot', '0deg'); card.classList.remove('drag-like', 'drag-pass'); } });
    card.addEventListener('pointercancel', () => { state.dragX = 0; render(); });
  }
  root.querySelectorAll('.chat-stream').forEach((stream) => { stream.scrollTop = stream.scrollHeight; });
}

window.addEventListener('hashchange', () => {
  const route = location.hash.slice(1);
  if (route.startsWith('project=')) {
    state.focusProjectId = decodeURIComponent(route.slice(8)); state.tab = 'swipe'; state.chatId = ''; state.intro = false; render();
  } else if (['swipe', 'categories', 'matches', 'profile'].includes(route)) {
    state.focusProjectId = ''; state.tab = route; state.chatId = ''; state.intro = false; render();
  }
});
window.addEventListener('beforeinstallprompt', (event) => { event.preventDefault(); state.installPrompt = event; render(); });
window.addEventListener('keydown', (event) => {
  if (state.intro || state.tab !== 'swipe' || root.querySelector('.project-detail-dialog[open]') || /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName)) return;
  if (event.key === 'ArrowLeft') decide('pass');
  if (event.key === 'ArrowRight') decide('like');
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); undo(); }
});

render();
loadProjects();
if ('serviceWorker' in navigator && import.meta.env.PROD) navigator.serviceWorker.register(`${BASE}sw.js`, { scope: BASE }).catch(() => {});
