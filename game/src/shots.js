// The screenshot scenes behind ?shot=start|play|rush|end. Each one plays the real rules
// forward from a fresh world for a fixed number of steps, steered by a goal-driven
// autopilot (finish the oldest ticket it can: fetch, prep, plate, serve), so every frame
// is what a real game looks like and the same seed always gives the same frame.
// The end scene's pilot stands still, so tickets expire and the shift ends for real.
import { FLOOR, INTERACT_RADIUS, RUSH_AT_SECONDS, STEP } from './config.js';
import { PREPPED_NAME, dishForBowl } from './recipes.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

const START_SECONDS = 5;
const PLAY_SECONDS = 58.25;
const RUSH_SECONDS = 76;
const END_LIMIT_SECONDS = 600;
const SAMPLE_STEPS_PER_SECOND = 60;

/** Where the cook stands to use a station: just inside the floor by its counter. */
function approachPoint(station) {
  if (station.id === 'bin') return { x: FLOOR.x + FLOOR.width - 14, y: station.y };
  if (station.y < 400) return { x: station.x, y: FLOOR.y + 14 };
  return { x: station.x, y: FLOOR.y + FLOOR.height - 14 };
}

function moveToward(from, to) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.hypot(dx, dy);
  if (distance < 8) return { x: 0, y: 0 };
  return { x: dx / distance, y: dy / distance };
}

function inRange(cook, station) {
  return Math.hypot(cook.x - station.x, cook.y - station.y) < INTERACT_RADIUS;
}

/** The ticket the bowl is building toward, or the oldest ticket when the bowl is empty. */
function targetOrder(state) {
  if (state.bowl.length === 0) return state.orders[0] ?? null;
  const building = state.orders.find((order) => state.bowl.every((item) => order.dish.needs.includes(item)));
  return building ?? state.orders[0] ?? null;
}

/**
 * The next thing to do for one missing component, as {station, action}:
 * 'take' (grab it from its bin or cooker), 'prep' (start or work its cooker) or null
 * when its cooker is busy with something else.
 */
function planComponent(state, component) {
  const pot = state.pot;
  const grill = state.grill;
  const board = state.board;
  switch (component) {
    case 'cooked-noodles':
      if (pot.done && pot.item === 'noodles') return { station: 'pot', action: 'take' };
      if (!pot.item) return { station: 'noodles', action: 'take' };
      return null;
    case 'boiled-egg':
      if (pot.done && pot.item === 'egg') return { station: 'pot', action: 'take' };
      if (!pot.item) return { station: 'egg', action: 'take' };
      return null;
    case 'chopped-veg':
      if (board.ready) return { station: 'board', action: 'take' };
      if (board.item === 'veg') return { station: 'board', action: 'prep' };
      if (!board.item) return { station: 'veg', action: 'take' };
      return null;
    case 'grilled-chicken':
      if (grill.burnt) return { station: 'grill', action: 'prep' };
      if (grill.done) return { station: 'grill', action: 'take' };
      if (!grill.item) return { station: 'chicken', action: 'take' };
      return null;
    case 'chili':
      return { station: 'chili', action: 'take' };
    default:
      return null;
  }
}

/** Where a raw ingredient goes to be prepped. */
function prepStationFor(carrying) {
  if (carrying === 'noodles' || carrying === 'egg') return 'pot';
  if (carrying === 'veg') return 'board';
  if (carrying === 'chicken') return 'grill';
  return null;
}

const PREPPED = new Set(['cooked-noodles', 'boiled-egg', 'chopped-veg', 'grilled-chicken', 'chili']);

/**
 * One step of the autopilot: a move direction and whether to use the counter in range.
 * It works one ticket at a time — fetch, prep, plate, serve — and bins anything that
 * does not belong in the ticket it is building.
 */
export function autopilot(state, world) {
  const cook = state.cook;
  const order = targetOrder(state);
  const bowl = state.bowl;

  function goTo(stationId, wantInteract = true) {
    const station = world.stationById(stationId);
    return {
      move: moveToward(cook, approachPoint(station)),
      interact: wantInteract && inRange(cook, station),
    };
  }

  // A finished bowl that matches a waiting ticket goes straight to the window.
  const finished = dishForBowl(bowl);
  if (finished && state.orders.some((o) => o.dish.id === finished.id)) return goTo('serve');

  if (order) {
    const needed = order.dish.needs;
    // Hands full of something this ticket does not need: bin it. A raw ingredient
    // counts as needed when its prepped form is on the ticket.
    const neededAsCarried =
      needed.includes(cook.carrying) || needed.includes(PREPPED_NAME[cook.carrying]);
    if (cook.carrying && (!neededAsCarried || bowl.includes(cook.carrying))) {
      return goTo('bin');
    }
    // A finished bowl nobody ordered, and one the ticket being built cannot use:
    // take it apart again, one ingredient at a time. (A bowl that is still a
    // stepping stone toward the ticket — plain noodles inside a ramen — stays.)
    const finishedDish = dishForBowl(bowl);
    if (
      !cook.carrying &&
      finishedDish &&
      !state.orders.some((order) => order.dish.id === finishedDish.id) &&
      !bowl.every((item) => order.dish.needs.includes(item))
    ) {
      return goTo('plate');
    }
    // The bowl holds something no ticket wants: take it back out at the plating
    // counter, one ingredient at a time, until the bowl can become a ticket again.
    if (!cook.carrying && bowl.length > 0 && !needed.some((need) => !bowl.includes(need)) && !dishForBowl(bowl)) {
      return goTo('plate');
    }
    // A prepped item this ticket needs goes into the bowl.
    if (cook.carrying && PREPPED.has(cook.carrying) && needed.includes(cook.carrying)) {
      return goTo('plate');
    }
    // A raw ingredient goes to its cooker.
    if (cook.carrying && !PREPPED.has(cook.carrying)) {
      const station = prepStationFor(cook.carrying);
      if (station) return goTo(station);
      return goTo('bin');
    }
    // Hands empty: fetch the next missing component the kitchen can provide.
    if (!cook.carrying) {
      for (const component of needed) {
        if (bowl.includes(component)) continue;
        const plan = planComponent(state, component);
        if (plan) return goTo(plan.station);
      }
      // Everything missing is stuck in a busy cooker: wait by the pot, hands still.
      return goTo('pot', false);
    }
  }
  // No tickets: wait by the plating counter, ready for the next one.
  return goTo('plate', false);
}

/** The pilot that stands still: tickets expire, hearts run out, the shift ends. */
function idlePilot() {
  return { move: { x: 0, y: 0 }, interact: false };
}

/**
 * The good pilot, but it admires a finished plate for a moment before serving it,
 * so a screenshot can catch the bowl glowing "ready" instead of only the walk there.
 */
function delayedPilot(world) {
  let readyAt = null;
  return (state) => {
    const finished = dishForBowl(state.bowl);
    const hasOrder = finished && state.orders.some((order) => order.dish.id === finished.id);
    if (hasOrder) {
      if (readyAt === null) readyAt = state.time;
      if (state.time - readyAt < 1.5) return { move: { x: 0, y: 0 }, interact: false };
    } else {
      readyAt = null;
    }
    return autopilot(state, world);
  };
}

/**
 * Set `world` to the named scene (start, play, rush or end; any other name is start)
 * and return the screen to draw over it and the best earnings to show.
 */
export function stageShot(name, world) {
  if (name !== 'play' && name !== 'rush' && name !== 'end') {
    world.stageDemo();
    for (let index = 0; index < START_SECONDS * SAMPLE_STEPS_PER_SECOND; index += 1) {
      world.step(STEP, { x: 0, y: 0 }, false);
    }
    return { screen: SCREEN_TITLE, best: 0 };
  }
  const seconds = name === 'rush' ? RUSH_SECONDS : name === 'end' ? END_LIMIT_SECONDS : PLAY_SECONDS;
  const pilot = name === 'end' ? idlePilot : delayedPilot(world);
  world.reset();
  for (let index = 0; index < seconds * SAMPLE_STEPS_PER_SECOND; index += 1) {
    const action = pilot(world.state);
    world.step(STEP, action.move, action.interact);
    if (world.state.over) break;
  }
  const over = world.state.over;
  return { screen: over ? SCREEN_OVER : SCREEN_PLAY, best: world.state.coins };
}
