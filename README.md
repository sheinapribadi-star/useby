# UseBy

**Snap your fridge. Cook what expires first. Learn as you go.**

UseBy is a small web app that helps you waste less food and get more comfortable in the kitchen. Upload a fridge photo (or try the sample), get estimated use-by dates from typical shelf life, then see recipes ranked so the soonest-to-spoil ingredients get used first.

**Live demo:** https://sheinapribadi-star.github.io/useby/

## Features

- 📷 Fridge photo scan (mock vision today — real vision plug-in ready)
- ⏱ Use-by estimates from food category / known-item shelf life (editable)
- 🍲 Recipe ranking by expiration urgency
- 📚 Bite-size cooking tips for beginners
- 💾 Persists in your browser (`localStorage`)

## Architecture

```
VisionProvider  →  ShelfLife estimates  →  RecipeEngine scoring  →  UI
     ↑ mock                                        ↑
  swap for Claude Vision / GPT-4o / custom CV
```

- `src/vision.js` — `MockVisionProvider` + interface notes for a real provider
- `src/shelfLife.js` — category/item day heuristics, urgency labels
- `src/recipes.js` — curated recipes + urgency-aware scoring
- `src/storage.js` — local persistence
- `src/main.js` — UI

No backend and no API keys required for the MVP.

## Develop

```bash
npm install
npm run dev
npm run build   # output in dist/ (GitHub Pages)
```

## Author

Sheina Pribadi · UC Berkeley

## License

MIT
