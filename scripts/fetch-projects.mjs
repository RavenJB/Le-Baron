import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const login = process.env.GITHUB_OWNER || 'RavenJB';
const target = resolve(root, 'public/data/projects.json');
const overrides = JSON.parse(await readFile(resolve(root, 'data/projects-overrides.json'), 'utf8'));

function repoRecord(repo) {
  const custom = overrides[repo.name] ?? {};
  const genericDescription = {
    fr: `[DEMO] Description à personnaliser pour ${repo.name}.`,
    en: `[DEMO] Add a description for ${repo.name}.`,
  };
  return {
    id: repo.id,
    name: repo.name,
    description: custom.description ?? (repo.description
      ? { fr: repo.description, en: repo.description }
      : genericDescription),
    htmlUrl: repo.html_url,
    homepage: repo.homepage || '',
    language: repo.language || '',
    topics: repo.topics || [],
    stars: repo.stargazers_count ?? 0,
    forks: repo.forks_count ?? 0,
    updatedAt: repo.updated_at,
    category: custom.category || inferCategory(repo),
    featured: Boolean(custom.featured),
    image: custom.image || '',
    message: custom.message ?? {
      fr: `[DEMO] Je te présenterai bientôt les coulisses de ${repo.name} !`,
      en: `[DEMO] I’ll share the story behind ${repo.name} soon!`,
    },
  };
}

function inferCategory(repo) {
  const labels = (repo.topics || []).map((topic) => topic.toLowerCase());
  if (labels.some((topic) => /(^|[- ])(ai|ml|machine-learning|artificial-intelligence)([- ]|$)/.test(topic))) return 'IA';
  if (labels.some((topic) => /game|gaming|unity|unreal/.test(topic))) return 'Jeux';
  if (labels.some((topic) => /design|figma|ui|ux/.test(topic))) return 'Design';
  if (labels.some((topic) => /data|database|sql|analytics/.test(topic))) return 'Data';
  if (labels.some((topic) => /web|frontend|backend|website/.test(topic))) return 'Web';
  if (['JavaScript', 'TypeScript', 'HTML', 'CSS'].includes(repo.language)) return 'Web';
  return repo.language || 'Autre';
}

async function fetchAll() {
  const headers = { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const records = [];
  for (let page = 1; page <= 10; page += 1) {
    const response = await fetch(`https://api.github.com/users/${login}/repos?type=owner&sort=updated&per_page=100&page=${page}`, { headers });
    if (!response.ok) throw new Error(`GitHub API: ${response.status} ${response.statusText}`);
    const repos = await response.json();
    records.push(...repos.filter((repo) => !repo.private).map(repoRecord));
    if (repos.length < 100) break;
  }
  return records;
}

try {
  const projects = await fetchAll();
  await writeFile(target, `${JSON.stringify(projects, null, 2)}\n`, 'utf8');
  console.log(`Generated ${projects.length} public projects for ${login}.`);
} catch (error) {
  // Local previews still build offline from the checked-in snapshot.
  try {
    await readFile(target, 'utf8');
    console.warn(`GitHub sync skipped (${error.message}); using the checked-in snapshot.`);
  } catch {
    throw error;
  }
}
