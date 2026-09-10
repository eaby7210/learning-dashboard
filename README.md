# Learning Roadmap Dashboard

Gamified view of a personal learning roadmap tracked in a separate (private, local)
`Projects/` vault: XP/levels, Minecraft-style advancements (Task/Goal/Challenge tiers,
one per syllabus phase), a streak tracker, and a live Mermaid map of the roadmap's
cross-subject jump graph. Static site, no backend, installable as a PWA.

Data (`progress.json`) is a one-way derivation from that vault's `SESSION-LOG.md` and
each subject's `DEVLOG.md` — nothing here is hand-edited.

## Refreshing the data

From the `Projects/` vault root:

```
python3 scripts/gamify.py --out /path/to/learning-dashboard/progress.json
```

Review the diff, then commit and push:

```
git add progress.json
git commit -m "Refresh progress data"
git push
```

## Pages

- `index.html` — XP, level, streak, per-subject phase overview
- `map.html` — Mermaid graph of the roadmap's phase/jump structure
- `advancements.html` — the Minecraft-style advancement tree, tabbed per subject
- `timeline.html` — chronological feed of phase syncs, jumps, and DEVLOG entries
