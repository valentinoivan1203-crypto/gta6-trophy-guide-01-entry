# gta6-trophy-guide-01-entry

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/valentinoivan1203-crypto/gta6-trophy-guide-01-entry/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/valentinoivan1203-crypto/gta6-trophy-guide-01-entry/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

Leonida Trophy Guide — an offline, open-source guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI. Every trophy carries its official name, description and grade, a guide written in our own words that cites its sources, and a place in a six-stage roadmap to the platinum. The tracker saves progress in the browser, exports and imports it as a file, filters by kind and grade, searches by text, hides earned trophies, and has a spoiler setting that keeps story trophies hidden until they are earned. A separate 100% completion checklist covers every robbery, collectible and activity the in-game checklist asks for, with the exact counts. The game released on 19 November 2026; the list below was checked against the finished game, and the one possibly missable trophy is flagged in the app and in the guide.

## Run it

```sh
python3 -m http.server 8080 --directory app
```

Then open http://localhost:8080 in desktop Chrome. The guide is plain static files under `app/` — no build step, no network requests, and it works with the network off.

## What's inside

- `app/index.html` — the single page: tracker, roadmap, 100% checklist and missables views.
- `app/style.css` — the whole look: a light paper theme with a teal accent, no outside fonts or images.
- `app/app.js` — the tracker: loads the data, renders the checklist, filters, search, sorting, spoiler mode, saved progress in `localStorage`, export and import, per-stage progress and the 100% checklist.
- `app/data/trophies.json` — all 55 trophies: official name, description, grade, hidden flag, kind, missable flag, difficulty, time estimate, story chapter, roadmap stage, count target, a step-by-step guide in our own words, and the sources each guide draws on.
- `app/data/roadmap.json` — the six-stage roadmap to the platinum and the 100% completion checklist with its required counts.
- `main.ts` — the entry program: copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the kit's `buildDossier`.
- `vendor/makefun-frontend.ts` — the kit's dossier library, unchanged.
- `screenshots/` — four renders of the running guide: the tracker, the roadmap, a cited trophy guide, and the filters with spoilers on.

## Sources

The official trophy names, descriptions and grades come from the PlayStation list as published on Exophase and PSNProfiles, which agree on every entry. The methods, counts, roadmap timings and the missable warning come from the guides below; each trophy's guide in `app/data/trophies.json` names the sources it draws on, and none of their text is copied.

- Exophase, official trophy list — https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/
- PSNProfiles, trophy counts — https://psnprofiles.com/trophies/43531-grand-theft-auto-vi
- PowerPyx, GTA 6 Trophy Guide & Roadmap — https://www.powerpyx.com/gta-6-grand-theft-auto-vI-trophy-guide-roadmap/
- KeenGamer, GTA 6 Trophy Guide & Platinum Roadmap — https://www.keengamer.com/articles/guides/gta-6-trophy-guide-platinum-roadmap-all-55-trophies/
- Vice City Hustle, GTA 6 Trophy List: All 55 Trophies — https://www.vicecityhustle.com/guides/gta-6-trophy-list-all-55-trophies
- GTABase, GTA 6 Trophy Guide & Achievements List — https://www.gtabase.com/articles/gta-6/gta-6-achievements-trophies-list-ps5-xbox-series
- GTA Snaps, GTA 6 Trophy Guide and Roadmap — https://gtasnaps.com/gta-6-trophy-guide-and-roadmap/
- Sixshore, GTA 6 Trophy and Achievement List — https://sixshore.com/gta-6/guides/trophies-and-achievements/
- TrueAchievements, Grand Theft Auto VI Achievements — https://www.trueachievements.com/game/Grand-Theft-Auto-VI/achievements

---

<sub>Entered on [make.fun](https://make.fun/?ref=dehpqxrn&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
