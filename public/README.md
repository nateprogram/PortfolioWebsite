# /public: media drop zone

Drop files at the paths below and the site picks them up automatically.
If a file is missing, the UI falls back to a gradient placeholder, so
the site never shows a broken image icon.

## Hero / site

| File                    | Size                  | Shows up at              |
| ----------------------- | --------------------- | ------------------------ |
| `/avatar.png` or `.jpg` | square, ≥ 400 × 400   | hero avatar (top of home) |
| `/og-image.png`         | 1200 × 630            | social share preview      |
| `/favicon.ico`          | 32 × 32 / 64 × 64     | browser tab               |

## Education

| File                               | Size           | Shows up at              |
| ---------------------------------- | -------------- | ------------------------ |
| `/education/digipen.png` or `.svg` | square, ~ 128+ | Education section logo   |

## Projects (home page, 3 tentpoles)

Each project folder takes one hero plus an optional autoplay video. The
card prefers video over phone shots over image over a generated cover.
Mobile apps (SquadPact, Adaptive Strength) use `shots` in projects-list.tsx:
three 1080 × 2125 phone captures, fanned out on the card.

```
/projects/squadpact/{home,team,chat}.jpg   phone shots (720px wide is plenty)
/projects/squadpact/demo.mp4           optional, muted autoplay loop
/projects/stockai/hero.png
/projects/stockai/demo.mp4
/projects/zeppelin-rush/hero.png
/projects/zeppelin-rush/demo.mp4
```

Videos: ≤ 10 MB, 15 to 30 second loop, no audio needed (they play muted).

## Games (/games page, 2 entries)

```
/games/treasure-party/hero.png
/games/treasure-party/demo.mp4         (gameplay clip)
/games/isshin/hero.png
/games/isshin/demo.mp4
```

## Screenshots for later case-study pages

When a per-project case study gets written, additional shots go under
`/projects/<slug>/screenshots/*.png`. This is not wired up yet; it is
just where they will live.
