/** Typical fridge shelf-life (days) by category / known item. */
export const CATEGORY_DAYS = {
  leafy: 5,
  veg: 8,
  fruit: 6,
  dairy: 10,
  protein: 3,
  herb: 6,
  other: 7,
};

export const ITEM_DAYS = {
  spinach: 4,
  'baby spinach': 4,
  lettuce: 5,
  kale: 6,
  arugula: 3,
  milk: 7,
  yogurt: 12,
  cheese: 14,
  eggs: 21,
  butter: 30,
  chicken: 2,
  'ground beef': 2,
  tofu: 5,
  salmon: 2,
  carrot: 14,
  carrots: 14,
  broccoli: 6,
  pepper: 8,
  'bell pepper': 8,
  tomato: 5,
  tomatoes: 5,
  cucumber: 7,
  onion: 21,
  garlic: 30,
  lemon: 14,
  lime: 14,
  strawberry: 3,
  strawberries: 3,
  blueberry: 5,
  banana: 4,
  apple: 18,
  avocado: 3,
  cilantro: 5,
  basil: 4,
  parsley: 6,
  rice: 90,
  pasta: 90,
  bread: 5,
};

export const EMOJI = {
  leafy: '🥬', veg: '🥕', fruit: '🍓', dairy: '🥛', protein: '🥚', herb: '🌿', other: '🫙',
};

export function guessCategory(name) {
  const n = name.toLowerCase();
  if (/spin|lettuce|kale|arugula|chard|greens/.test(n)) return 'leafy';
  if (/milk|yogurt|cheese|butter|cream/.test(n)) return 'dairy';
  if (/chicken|beef|tofu|salmon|egg|pork|fish|turkey/.test(n)) return 'protein';
  if (/cilantro|basil|parsley|mint|dill|thyme/.test(n)) return 'herb';
  if (/berry|apple|banana|lemon|lime|orange|mango|avocado|grape/.test(n)) return 'fruit';
  if (/carrot|broccoli|pepper|tomato|cucumber|onion|garlic|potato|zucchini/.test(n)) return 'veg';
  return 'other';
}

export function estimateDays(name, category) {
  const key = name.toLowerCase().trim();
  if (ITEM_DAYS[key] != null) return ITEM_DAYS[key];
  for (const [k, v] of Object.entries(ITEM_DAYS)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  return CATEGORY_DAYS[category] ?? 7;
}

export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function daysLeft(expiresISO) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(expiresISO + 'T00:00:00');
  return Math.round((exp - today) / 86400000);
}

export function urgency(days) {
  if (days <= 2) return 'urgent';
  if (days <= 5) return 'soon';
  return 'ok';
}

export function labelFor(days) {
  if (days < 0) return `expired ${Math.abs(days)}d ago`;
  if (days === 0) return 'use today';
  if (days === 1) return '1 day left';
  return `${days} days left`;
}
