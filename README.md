# 🏮 Lantern Noodle Night

[![make.fun](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/c/best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/rren7975-cell/best-cooking-game-20261125/rank.svg)](https://make.fun/c/best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/rren7975-cell/best-cooking-game-20261125/reward.svg)](https://make.fun/c/best-cooking-game-20261125-0137)

A night-market noodle stall game, built for the [make.fun best cooking game bounty](https://make.fun/c/best-cooking-game-20261125-0137). One cook, one stall, a whole hungry street: take tickets off the order board, boil noodles, chop greens, grill chicken, plate each dish to order, and serve it before the customer's patience runs out.

## How to play

Serve `node serve.ts` and open http://localhost:8080, or open `game/index.html` from any static server. Desktop browser, keyboard + mouse, no network needed.

- **Move** — WASD / arrow keys, or click anywhere to walk there
- **Use a counter** — E or Space, or click a counter to walk up and use it
- **P pause · M mute**

## The stall

Five dishes share one set of ingredients, so every ticket is a route through the kitchen:

| Dish | Needs | Price |
| --- | --- | --- |
| Plain Noodle Soup | cooked noodles | $6 |
| Egg Noodle | cooked noodles + boiled egg | $9 |
| Garden Noodle | cooked noodles + chopped greens | $10 |
| Chicken Ramen | cooked noodles + grilled chicken + chopped greens | $14 |
| Firecracker Ramen | cooked noodles + grilled chicken + boiled egg + chili | $18 |

Noodles and eggs boil in the pot, greens take three chops on the board, chicken grills over charcoal — and burns if you leave it. Serving fast earns a tip; serving back-to-back builds a combo that multiplies everything. At 70 seconds the **rush hour** hits and tickets arrive faster. A 150-second shift ends when the clock runs out or three tickets expire.

## Files

- `game/index.html` — the page, loads the game
- `game/src/main.js` — boot, the fixed-step loop, screens, sounds
- `game/src/world.js` — the rules: tickets, cookers, plating, serving, scoring
- `game/src/render.js` — every pixel, drawn in code
- `game/src/recipes.js` — the menu: ingredients, dishes, what a bowl matches
- `game/src/config.js` — tuning: timings, layout, scoring
- `game/src/input.js` — keyboard + click-to-move
- `game/src/audio.js` — sounds synthesized with WebAudio
- `game/src/random.js` — seeded random, so `?seed=N` replays the same night
- `game/src/shots.js` — the screenshot scenes and their autopilot
- `main.ts` — hands the game in (copies `game/` + `screenshots/`, writes `dossier.json`)
- `serve.ts` — a tiny local static server for play-testing

## Screenshots

`?shot=start|play|rush|end&seed=1` stages each scene deterministically: the title over a
simmering stall, mid-service play, the rush hour, and the end of a shift. The autopilot
plays the real rules — it fetches, preps, plates and serves — so every shot is a real game.

## License

MIT — see [LICENSE](LICENSE).
