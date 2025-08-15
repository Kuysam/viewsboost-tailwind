export type PersistProject = { name: string; pages: any[]; updatedAt: number };
const KEY_PREFIX = "vb:e2";
const K_INDEX = `${KEY_PREFIX}:index`;
const K_LAST = `${KEY_PREFIX}:last`;
const K_AUTO  = `${KEY_PREFIX}:auto`;

export function listProjects(): string[] {
  try { return JSON.parse(localStorage.getItem(K_INDEX) || "[]"); } catch { return []; }
}
function saveIndex(names: string[]) {
  localStorage.setItem(K_INDEX, JSON.stringify(Array.from(new Set(names))));
}
export function saveProject(name: string, pages: any[]) {
  const names = listProjects();
  if (!names.includes(name)) names.push(name);
  saveIndex(names);
  const payload: PersistProject = { name, pages, updatedAt: Date.now() };
  localStorage.setItem(`${KEY_PREFIX}:project:${name}`, JSON.stringify(payload));
  localStorage.setItem(K_LAST, name);
}
export function loadProject(name: string): any[] | null {
  try {
    const raw = localStorage.getItem(`${KEY_PREFIX}:project:${name}`);
    if (!raw) return null;
    const obj = JSON.parse(raw) as PersistProject;
    return Array.isArray(obj.pages) ? obj.pages : null;
  } catch { return null; }
}
export function lastProjectName(): string | null {
  return localStorage.getItem(K_LAST);
}
export function saveAuto(pages: any[]) {
  localStorage.setItem(K_AUTO, JSON.stringify(pages));
}
export function loadAuto(): any[] | null {
  try { return JSON.parse(localStorage.getItem(K_AUTO) || "null"); } catch { return null; }
}
