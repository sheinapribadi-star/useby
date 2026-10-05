const KEY = 'useby.fridge.v1';

export function loadFridge() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveFridge(items) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}
