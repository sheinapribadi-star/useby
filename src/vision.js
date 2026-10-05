/**
 * VisionProvider interface
 * -------------------------
 * detectFromImage(file | null) -> Promise<DetectedItem[]>
 *
 * DetectedItem: { name, category?, confidence, note? }
 *
 * Swap MockVisionProvider for a real one (Claude Vision, GPT-4o, custom CV)
 * without touching the rest of the app.
 */

import { guessCategory } from './shelfLife.js';

const SAMPLE_FRIDGE = [
  { name: 'Baby spinach', confidence: 0.94, note: '1 bag' },
  { name: 'Eggs', confidence: 0.97, note: '6 left' },
  { name: 'Greek yogurt', confidence: 0.91, note: 'plain' },
  { name: 'Cherry tomatoes', confidence: 0.88, note: 'pint' },
  { name: 'Bell pepper', confidence: 0.9, note: 'red' },
  { name: 'Chicken thighs', confidence: 0.86, note: 'pack opened' },
  { name: 'Cheddar', confidence: 0.89, note: 'block' },
  { name: 'Lemon', confidence: 0.95, note: '2' },
  { name: 'Cilantro', confidence: 0.84, note: 'bunch' },
  { name: 'Carrots', confidence: 0.92, note: 'half bag' },
];

/** Alternate detections so a real photo upload still feels different. */
const PHOTO_VARIANTS = [
  [
    { name: 'Milk', confidence: 0.93, note: 'half gallon' },
    { name: 'Strawberries', confidence: 0.9, note: 'clamshell' },
    { name: 'Broccoli', confidence: 0.87, note: '1 crown' },
    { name: 'Tofu', confidence: 0.88, note: 'firm' },
    { name: 'Basil', confidence: 0.82, note: 'fresh' },
    { name: 'Eggs', confidence: 0.96, note: 'carton' },
    { name: 'Avocado', confidence: 0.85, note: '2' },
    { name: 'Onion', confidence: 0.91, note: 'yellow' },
  ],
  [
    { name: 'Arugula', confidence: 0.89, note: 'clamshell' },
    { name: 'Salmon', confidence: 0.9, note: 'fillet' },
    { name: 'Cucumber', confidence: 0.92, note: '1' },
    { name: 'Butter', confidence: 0.94, note: 'stick' },
    { name: 'Lime', confidence: 0.91, note: '3' },
    { name: 'Garlic', confidence: 0.88, note: 'head' },
    { name: 'Yogurt', confidence: 0.9, note: 'vanilla' },
    { name: 'Bell pepper', confidence: 0.87, note: 'green' },
  ],
];

function normalize(items) {
  return items.map((it) => ({
    name: it.name,
    category: it.category || guessCategory(it.name),
    confidence: it.confidence ?? 0.8,
    note: it.note || '',
  }));
}

export class MockVisionProvider {
  constructor() {
    this.mode = 'mock';
  }

  async detectFromImage(file) {
    // Simulate latency of a real vision call
    await new Promise((r) => setTimeout(r, 700 + Math.random() * 500));
    if (!file) return normalize(SAMPLE_FRIDGE);
    const idx = (file.size + (file.name?.length || 0)) % PHOTO_VARIANTS.length;
    return normalize(PHOTO_VARIANTS[idx]);
  }

  async detectSample() {
    return this.detectFromImage(null);
  }
}

/**
 * Example skeleton for a real provider — not wired up.
 *
 * export class OpenAIVisionProvider {
 *   constructor(apiKey) { this.apiKey = apiKey; this.mode = 'openai'; }
 *   async detectFromImage(file) {
 *     const b64 = await fileToBase64(file);
 *     // POST to vision endpoint, parse JSON list of foods…
 *     return normalize(parsed);
 *   }
 * }
 */

export function createVisionProvider() {
  return new MockVisionProvider();
}
