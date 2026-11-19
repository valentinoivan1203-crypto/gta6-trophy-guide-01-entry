# Leonida Trophy Guide

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/valentinoivan1203-crypto/gta6-trophy-guide-01-entry/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/valentinoivan1203-crypto/gta6-trophy-guide-01-entry/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

The best offline guide and tracker for the 55 PlayStation 5 trophies of Grand Theft Auto VI: every trophy with its official name, description and grade, a guide in our own words that cites its sources, a six-stage roadmap to the Platinum, and a checklist saved in your browser with export and import, filters by kind, and a spoiler setting that hides story trophies until they are earned. It runs offline in a desktop browser from its own static files — the app fetches nothing.

## Run it

```sh
python3 -m http.server 8080 --directory app
# then open http://localhost:8080
```

Or serve `app/` with any static file server and open `index.html`.

## What it holds

- `app/data/trophies.json` — all 55 official trophies (1 platinum, 2 gold, 6 silver, 46 bronze) with their official name, description and grade, plus a guide in our own words and the sources each guide cites (PowerPyx, GTABase, FullSweep, PSNProfiles/Exophase).
- `app/data/roadmap.json` — six stages to the Platinum, built from the official descriptions: story first (and the one possibly missable trophy, Positive Mental Attitude), side strands, activities, robberies, collectibles, then the 100% cleanup.
- `app/app.js` — the tracker: checklist saved in localStorage, export/import as a file, filters by kind and grade, search, hide-earned, and a spoiler toggle.
- `screenshots/` — the guide running in a browser: the tracker with progress, the roadmap, and a cited guide.

## Sources

The official trophy names, descriptions and grades are as listed by Exophase and PSNProfiles. The guides draw on PowerPyx's GTA 6 trophy guide and 100% completion checklist, GTABase's trophy list and FullSweep's trophy list, and cite them beside each trophy — never copying their text.

---

<sub>Entered on [make.fun](https://make.fun/?ref=dehpqxrn&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
