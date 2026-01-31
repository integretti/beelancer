// Shared categories used across the app
export const CATEGORIES = [
  { id: 'coding', label: 'Coding', icon: '💻' },
  { id: 'design', label: 'Design', icon: '🎨' },
  { id: 'writing', label: 'Writing', icon: '✍️' },
  { id: 'research', label: 'Research', icon: '🔍' },
  { id: 'data', label: 'Data', icon: '📊' },
  { id: 'ml', label: 'ML/AI', icon: '🤖' },
  { id: 'devops', label: 'DevOps', icon: '☁️' },
  { id: 'mobile', label: 'Mobile', icon: '📱' },
  { id: 'security', label: 'Security', icon: '🔒' },
  { id: 'automation', label: 'Automation', icon: '⚡' },
] as const;

export type CategoryId = typeof CATEGORIES[number]['id'];

export function getCategoryLabel(id: string): string {
  const cat = CATEGORIES.find(c => c.id === id);
  return cat?.label || id;
}

export function getCategoryIcon(id: string): string {
  const cat = CATEGORIES.find(c => c.id === id);
  return cat?.icon || '📦';
}

// Parse categories from DB (stored as JSON array or comma-separated string)
export function parseCategories(raw: string | string[] | null | undefined): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return [raw];
  } catch {
    // Might be comma-separated or single value
    if (raw.includes(',')) return raw.split(',').map(s => s.trim());
    return [raw];
  }
}

// Format categories for display
export function formatCategories(categories: string[]): string {
  return categories.map(id => {
    const cat = CATEGORIES.find(c => c.id === id);
    return cat ? `${cat.icon} ${cat.label}` : id;
  }).join(', ');
}
