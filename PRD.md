# UseBy — Product Requirements (MVP)

## One-liner
Snap your fridge → estimated use-bys → cook the things that expire first, while learning basics.

## Primary user
College / early-career cook (Sheina-shaped): busy, hates wasting food, wants to get better at cooking without a 40-step chef app.

## Success for this demo
A stranger can, in <90 seconds: load a sample fridge → see urgency → open a ranked recipe → understand *why* it’s recommended → start cooking steps.

## Scope (MVP)
### Must
- First-run onboarding (3 beats) + skip
- Scan fridge photo OR sample fridge (mock vision)
- Inventory cards sorted by days-left; urgency chips; edit/remove/add
- Recipe list ranked by expiration urgency + coverage; “Why this now” copy
- Recipe detail: ingredients from fridge vs need, timed steps, tip, mark cooked (removes/consumes urgent items optionally)
- Learn tab: contextual tips
- Persist in localStorage
- Clear VisionProvider seam for real vision later
- GitHub Pages deploy

### Nice (ship if time)
- Waste-saved streak counter
- Filter by time / beginner-only
- Cook mode (large step cards)

### Out
- Accounts, shopping list sync, real CV API keys, nutrition DB

## Key flows
1. **Onboard → Sample scan → Fridge → Cook**
2. **Photo upload → Detect → Edit dates → Cook**
3. **Manual add item → See it rise in urgency → Recipe uses it**

## Voice
Warm, direct, never naggy. “Use tonight” not “WARNING EXPIRING.” Celebrate cooking, not shame waste.
