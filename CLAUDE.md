# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A React single-page application for browsing a political commentator bias database ("Independent Voices"). Users can search, filter by political alignment, and view detailed profiles of commentators positioned on a left-right political spectrum. All data is static JSON — there is no backend or database.

## Commands

```bash
npm run dev        # Start Vite dev server (http://localhost:5173)
npm run build      # Production build to dist/
npm run lint       # ESLint (flat config, v9)
npm run preview    # Preview production build locally
```

No test framework is installed.

## Architecture

**Stack:** React 19 + Vite 7 + Tailwind CSS 4 (ES Modules, JSX only — no TypeScript)

**Data flow:** `App.jsx` fetches `/public/data.json` on mount and holds all state (commentators, search query, filter, selected item, dark mode). Filtering uses `useMemo` and is entirely client-side. No routing — single page with a modal for detail views.

**Component tree:**
```
App.jsx (state: data, search, filter, selected, darkMode)
├── BiasSpectrum      — interactive gradient bar with positioned dots per commentator
├── SearchBar         — text input driving search state
├── FilterTabs        — buttons for all/left/center/right filtering
├── CommentatorCard[] — grid of cards, click opens modal
└── CommentatorModal  — full detail overlay (ESC to close)
```

**Score system:** `ScoreBadge.jsx` exports utility functions (`parseScore`, `getScorePosition`, `getScoreColor`, `getLeanLabel`) used across components. Scores are strings like `"35D"` (35 points Democratic lean), `"45R"` (Republican lean), or `"0"` (center). The `D/R/C` suffix maps to political lean; the number maps to intensity (0 = center, 40+ = far).

**Headshot resolution:** `Headshot.jsx` derives an image slug from the commentator name (kebab-case) and loads from `/public/headshots/`. Falls back to colored initials circle if the image is missing.

**Dark mode:** Detects system preference on load, toggleable via header button. Uses Tailwind `dark:` variant with `.dark` class on `<html>`.

## Data Format

`/public/data.json` — array of commentator records:
```json
{
  "id": 1,
  "name": "Name",
  "score": "35D",
  "strongestBeliefs": "...",
  "commonThemes": "...",
  "audienceProfile": "...",
  "xFollowers": 500000,
  "youtubeSubscribers": 1200000,
  "substackSubscribers": null
}
```

Source data lives in `IndependentVoicesData.xlsx` (root). The `xlsx` dependency exists for potential import processing.
