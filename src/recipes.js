/** Curated student-friendly recipes. Ingredients use loose name matching. */
export const RECIPES = [
  {
    id: 'spinach-eggs',
    title: 'Garlicky spinach eggs',
    time: 12,
    level: 'beginner',
    emoji: '🍳',
    why: 'Fast protein + greens before spinach wilts.',
    ingredients: ['spinach', 'eggs', 'garlic', 'butter'],
    steps: [
      'Melt a knob of butter in a pan on medium.',
      'Add minced garlic for 30 seconds — don’t let it brown.',
      'Wilt a big handful of spinach with a pinch of salt.',
      'Crack in eggs, cover 2–3 min until whites set.',
      'Finish with pepper (chili flakes if you like heat).',
    ],
    tip: 'Crowding spinach is fine — it shrinks a lot.',
  },
  {
    id: 'yogurt-bowl',
    title: 'Lemon yogurt breakfast bowl',
    time: 5,
    level: 'beginner',
    emoji: '🥣',
    why: 'Zero-cook way to use yogurt and soft fruit.',
    ingredients: ['yogurt', 'lemon', 'strawberry', 'honey'],
    steps: [
      'Spoon yogurt into a bowl.',
      'Zest and squeeze a little lemon over it.',
      'Top with sliced strawberries (or any fruit on hand).',
      'Drizzle honey if you have it.',
    ],
    tip: 'Thick Greek yogurt holds toppings better.',
  },
  {
    id: 'pepper-stirfry',
    title: 'Pepper & chicken stir-fry',
    time: 25,
    level: 'beginner',
    emoji: '🫑',
    why: 'Uses open chicken packs before they turn.',
    ingredients: ['chicken', 'bell pepper', 'onion', 'garlic', 'soy'],
    steps: [
      'Slice chicken into thin strips; salt lightly.',
      'Sear in a hot oiled pan until mostly cooked; set aside.',
      'Stir-fry sliced pepper and onion 4–5 min.',
      'Add garlic, return chicken, splash soy sauce.',
      'Cook until glossy and chicken is done through.',
    ],
    tip: 'High heat + don’t overcrowd = browning, not steaming.',
  },
  {
    id: 'tomato-eggs',
    title: 'Tomato egg scramble',
    time: 15,
    level: 'beginner',
    emoji: '🍅',
    why: 'Classic soft scramble that rescues soft tomatoes.',
    ingredients: ['tomato', 'eggs', 'green onion', 'oil'],
    steps: [
      'Beat eggs with a pinch of salt.',
      'Sauté chopped tomatoes in oil until jammy.',
      'Pour in eggs; gently fold until just set.',
      'Top with sliced green onion if you have it.',
    ],
    tip: 'Pull eggs early — they keep cooking off-heat.',
  },
  {
    id: 'herb-salmon',
    title: 'Cilantro-lime salmon',
    time: 20,
    level: 'intermediate',
    emoji: '🐟',
    why: 'Fish waits for no one — cook it tonight.',
    ingredients: ['salmon', 'lime', 'cilantro', 'garlic', 'oil'],
    steps: [
      'Pat salmon dry; salt and pepper.',
      'Sear skin-side down in oil 4 min; flip 2–3 min.',
      'Mix chopped cilantro, lime juice, minced garlic, oil.',
      'Spoon herb sauce over the hot fish.',
    ],
    tip: 'Dry surface = crisp skin.',
  },
  {
    id: 'carrot-soup',
    title: 'Cozy carrot ginger soup',
    time: 35,
    level: 'beginner',
    emoji: '🥕',
    why: 'Carrots last, but soup makes a week of lunches.',
    ingredients: ['carrot', 'onion', 'garlic', 'ginger', 'broth'],
    steps: [
      'Sauté chopped onion in oil until soft.',
      'Add sliced carrots, garlic, grated ginger.',
      'Cover with broth; simmer 20 min until tender.',
      'Blend until smooth; salt to taste.',
    ],
    tip: 'A spoon of yogurt on top is excellent.',
  },
  {
    id: 'tofu-bowl',
    title: 'Crispy tofu rice bowl',
    time: 30,
    level: 'beginner',
    emoji: '🍚',
    why: 'Uses tofu + whatever veg is fading.',
    ingredients: ['tofu', 'soy', 'broccoli', 'rice', 'garlic'],
    steps: [
      'Press tofu 10 min; cube and pan-fry until golden.',
      'Steam or sauté broccoli.',
      'Toss tofu with soy + minced garlic.',
      'Serve over rice with the veg.',
    ],
    tip: 'Cornstarch dusting makes tofu extra crisp.',
  },
  {
    id: 'avocado-toast',
    title: 'Lemon avocado toast',
    time: 8,
    level: 'beginner',
    emoji: '🥑',
    why: 'Avocados tip from perfect to brown fast.',
    ingredients: ['avocado', 'lemon', 'bread', 'egg'],
    steps: [
      'Toast bread.',
      'Mash avocado with lemon, salt, pepper.',
      'Spread thick; top with a fried or soft-boiled egg if you want.',
    ],
    tip: 'Lemon slows browning on leftovers.',
  },
  {
    id: 'cheesy-quesadilla',
    title: 'Pepper cheddar quesadilla',
    time: 15,
    level: 'beginner',
    emoji: '🧀',
    why: 'Cheese + soft peppers = weeknight win.',
    ingredients: ['cheese', 'cheddar', 'bell pepper', 'tortilla', 'onion'],
    steps: [
      'Sauté thin pepper (and onion) strips until soft.',
      'Scatter cheese on a tortilla; add veg; fold.',
      'Toast both sides in a dry pan until melty.',
      'Slice and dunk in yogurt or salsa.',
    ],
    tip: 'Medium heat melts cheese before the tortilla burns.',
  },
  {
    id: 'herb-yogurt-chicken',
    title: 'Herby yogurt chicken',
    time: 35,
    level: 'intermediate',
    emoji: '🌿',
    why: 'Yogurt tenderizes; herbs use up the bunch.',
    ingredients: ['chicken', 'yogurt', 'cilantro', 'lemon', 'garlic'],
    steps: [
      'Mix yogurt, lemon, garlic, chopped cilantro, salt.',
      'Coat chicken; rest 10+ min (or overnight).',
      'Bake 400°F / 205°C for ~25 min until done.',
      'Rest 5 min; spoon pan juices over.',
    ],
    tip: 'Thermometer to 165°F / 74°C removes the guesswork.',
  },
  {
    id: 'cilantro-eggs',
    title: 'Herby scrambled eggs',
    time: 10,
    level: 'beginner',
    emoji: '🌿',
    why: 'A bunch of cilantro disappears happily into eggs.',
    ingredients: ['eggs', 'cilantro', 'butter', 'cheese'],
    steps: [
      'Beat eggs with salt.',
      'Melt butter on low-medium; pour eggs.',
      'Fold slowly; add chopped cilantro and cheese near the end.',
      'Stop while still glossy.',
    ],
    tip: 'Low heat = custardy eggs, not rubber.',
  },
];

function tokens(s) {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
}

export function ingredientMatches(recipeIng, fridgeName) {
  const a = tokens(recipeIng).join(' ');
  const b = tokens(fridgeName).join(' ');
  return a.includes(b) || b.includes(a) || tokens(recipeIng).some((t) => t.length > 3 && b.includes(t));
}

export function scoreRecipe(recipe, fridge) {
  let urgencyPoints = 0;
  let matched = 0;
  const used = [];
  const missing = [];

  for (const ing of recipe.ingredients) {
    const hit = fridge.find((item) => ingredientMatches(ing, item.name));
    if (hit) {
      matched += 1;
      used.push(hit);
      const d = hit.daysLeft;
      if (d < 0) urgencyPoints += 12;
      else if (d <= 1) urgencyPoints += 10;
      else if (d <= 3) urgencyPoints += 7;
      else if (d <= 5) urgencyPoints += 4;
      else urgencyPoints += 1;
    } else if (!/oil|salt|pepper|soy|honey|broth|rice|bread|tortilla|ginger/.test(ing)) {
      missing.push(ing);
    }
  }

  const coverage = matched / recipe.ingredients.length;
  const score = urgencyPoints * 10 + coverage * 20 - missing.length * 3;
  return { score, matched, used, missing, coverage };
}

/** Human “why this now” line from the most urgent matched item. */
export function whyThisNow(used) {
  if (!used.length) return 'Uses what you already have.';
  const sorted = [...used].sort((a, b) => a.daysLeft - b.daysLeft);
  const top = sorted[0];
  const name = top.name;
  if (top.daysLeft < 0) return `Rescues your ${name} — past its estimate, cook today.`;
  if (top.daysLeft === 0) return `Cook tonight — ${name} is on its last day.`;
  if (top.daysLeft === 1) return `Priority: ${name} has about 1 day left.`;
  if (top.daysLeft <= 3) return `Good now — burns down ${name} before day ${top.daysLeft}.`;
  if (sorted.length > 1) return `Uses ${sorted.length} fridge items, led by ${name}.`;
  return `Nice match for your ${name}.`;
}

export function rankRecipes(fridge, { maxTime = 999, beginnerOnly = false } = {}) {
  return RECIPES
    .filter((r) => r.time <= maxTime)
    .filter((r) => !beginnerOnly || r.level === 'beginner')
    .map((r) => {
      const scored = scoreRecipe(r, fridge);
      return { recipe: r, ...scored, whyNow: whyThisNow(scored.used) };
    })
    .filter((x) => x.matched > 0)
    .sort((a, b) => b.score - a.score);
}
