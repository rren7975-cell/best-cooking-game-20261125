// Lantern Noodle Night's world: the cook, the tickets, the pot, the board, the grill,
// the bowl on the plating counter, and every rule that turns work into coins.
// It knows nothing about the canvas or the keyboard — step() takes a move direction and
// one interact press, and returns a bitmask of what happened, so the same code drives
// the live game, the title-screen backdrop and the screenshot autopilot.
import {
  BOIL_EGG_SECONDS,
  BOIL_NOODLES_SECONDS,
  BURN_AFTER_SECONDS,
  CHOPS_TO_FINISH,
  COMBO_WINDOW_SECONDS,
  COOK_SPEED,
  FLOOR,
  GRILL_SECONDS,
  HEARTS,
  INTERACT_RADIUS,
  MAX_ORDERS,
  ORDER_PATIENCE,
  RUSH_AT_SECONDS,
  SHIFT_SECONDS,
  SPAWN_EVERY,
  SPAWN_EVERY_RUSH,
  STATIONS,
} from './config.js';
import { CARRIED_LABEL, DISHES, PREPPED_NAME, bowlMatchesDish, dishForBowl, menuFor } from './recipes.js';

export const EVENT_SERVED = 1;
export const EVENT_EXPIRED = 2;
export const EVENT_OVER = 4;
export const EVENT_RUSH = 8;
export const EVENT_CHOP = 16;
export const EVENT_CHOP_DONE = 32;
export const EVENT_PLATED = 64;
export const EVENT_PICKUP = 128;
export const EVENT_ERROR = 256;
export const EVENT_DISCARD = 512;
export const EVENT_COOK_DONE = 1024;
export const EVENT_BURN = 2048;
export const EVENT_START_COOK = 4096;

export const PREPPED_ITEMS = new Set(['cooked-noodles', 'boiled-egg', 'chopped-veg', 'grilled-chicken', 'chili']);

function stationById(id) {
  return STATIONS.find((station) => station.id === id);
}

function distance(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}

/** The station nearest the cook that is close enough to use, or null. */
export function nearestStation(state) {
  let best = null;
  let bestDistance = INTERACT_RADIUS;
  for (const station of STATIONS) {
    const d = distance(state.cook.x, state.cook.y, station.x, station.y);
    if (d < bestDistance) {
      bestDistance = d;
      best = station;
    }
  }
  return best;
}

export function createWorld(random) {
  const state = {
    time: 0,
    shiftLeft: SHIFT_SECONDS,
    hearts: HEARTS,
    coins: 0,
    served: 0,
    missed: 0,
    combo: 0,
    bestCombo: 0,
    comboLeft: 0,
    orders: [],
    nextOrderId: 1,
    spawnIn: 6,
    rushAnnounced: false,
    cook: { x: 640, y: 460, face: 1, moving: false, carrying: null },
    pot: { item: null, progress: 0, needed: 0, done: false },
    grill: { item: null, progress: 0, done: false, burnIn: 0, burnt: false },
    board: { item: null, chops: 0, ready: false },
    bowl: [],
    over: false,
    overReason: '',
  };

  function spawnOrder() {
    const menu = menuFor(state.time);
    const dish = random.pick(menu);
    const patience = state.time >= RUSH_AT_SECONDS ? ORDER_PATIENCE - 6 : ORDER_PATIENCE;
    state.orders.push({
      id: state.nextOrderId,
      dish,
      patience,
      maxPatience: patience,
    });
    state.nextOrderId += 1;
  }

  function clearStationTimers(station) {
    if (station === 'pot') state.pot = { item: null, progress: 0, needed: 0, done: false };
    if (station === 'grill') state.grill = { item: null, progress: 0, done: false, burnIn: 0, burnt: false };
    if (station === 'board') state.board = { item: null, chops: 0, ready: false };
  }

  function serveBowl() {
    const dish = dishForBowl(state.bowl);
    if (!dish) return EVENT_ERROR;
    const orderIndex = state.orders.findIndex((order) => order.dish.id === dish.id);
    if (orderIndex === -1) return EVENT_ERROR;
    const order = state.orders[orderIndex];
    const tip = Math.round((8 * order.patience) / order.maxPatience);
    const multiplier = 1 + 0.2 * Math.min(state.combo, 4);
    const earned = Math.round((dish.price + tip) * multiplier);
    state.coins += earned;
    state.served += 1;
    state.combo += 1;
    state.bestCombo = Math.max(state.bestCombo, state.combo);
    state.comboLeft = COMBO_WINDOW_SECONDS;
    state.orders.splice(orderIndex, 1);
    state.bowl = [];
    return EVENT_SERVED;
  }

  // One use of a station. Returns event bits; the caller turns them into sounds.
  function useStation(station) {
    const cook = state.cook;
    const carrying = cook.carrying;
    switch (station.kind) {
      case 'bin': {
        if (station.id === 'bin') {
          if (!carrying) return 0;
          cook.carrying = null;
          return EVENT_DISCARD;
        }
        // Ingredient bins along the top: take one, hands must be empty.
        if (carrying) return EVENT_ERROR;
        cook.carrying = station.id;
        return EVENT_PICKUP;
      }
      case 'pot': {
        const pot = state.pot;
        if (!pot.item && carrying && (carrying === 'noodles' || carrying === 'egg')) {
          pot.item = carrying;
          pot.needed = carrying === 'noodles' ? BOIL_NOODLES_SECONDS : BOIL_EGG_SECONDS;
          pot.progress = 0;
          pot.done = false;
          cook.carrying = null;
          return EVENT_START_COOK;
        }
        if (pot.done && !carrying) {
          cook.carrying = PREPPED_NAME[pot.item];
          clearStationTimers('pot');
          return EVENT_PICKUP;
        }
        return EVENT_ERROR;
      }
      case 'grill': {
        const grill = state.grill;
        if (grill.burnt) {
          clearStationTimers('grill');
          return EVENT_DISCARD;
        }
        if (!grill.item && carrying === 'chicken') {
          grill.item = 'chicken';
          grill.progress = 0;
          grill.done = false;
          grill.burnIn = BURN_AFTER_SECONDS;
          cook.carrying = null;
          return EVENT_START_COOK;
        }
        if (grill.done && !carrying) {
          cook.carrying = 'grilled-chicken';
          clearStationTimers('grill');
          return EVENT_PICKUP;
        }
        return EVENT_ERROR;
      }
      case 'board': {
        const board = state.board;
        if (!board.item && carrying === 'veg') {
          board.item = 'veg';
          board.chops = 0;
          board.ready = false;
          cook.carrying = null;
          return EVENT_START_COOK;
        }
        if (board.item === 'veg' && !board.ready) {
          board.chops += 1;
          if (board.chops >= CHOPS_TO_FINISH) {
            board.ready = true;
            return EVENT_CHOP_DONE;
          }
          return EVENT_CHOP;
        }
        if (board.ready && !carrying) {
          cook.carrying = 'chopped-veg';
          clearStationTimers('board');
          return EVENT_PICKUP;
        }
        return EVENT_ERROR;
      }
      case 'plate': {
        if (carrying && PREPPED_ITEMS.has(carrying)) {
          if (state.bowl.includes(carrying)) return EVENT_ERROR;
          state.bowl.push(carrying);
          cook.carrying = null;
          return EVENT_PLATED;
        }
        if (!carrying && state.bowl.length > 0) {
          // Take the last thing back out of the bowl, so a wrong topping can be fixed
          // one ingredient at a time instead of throwing the whole dish away.
          cook.carrying = state.bowl.pop();
          return EVENT_PICKUP;
        }
        return EVENT_ERROR;
      }
      case 'serve': {
        if (state.bowl.length === 0) return EVENT_ERROR;
        return serveBowl();
      }
      default:
        return 0;
    }
  }

  function tickCookers(dt) {
    let events = 0;
    const pot = state.pot;
    if (pot.item && !pot.done) {
      pot.progress += dt;
      if (pot.progress >= pot.needed) {
        pot.done = true;
        events |= EVENT_COOK_DONE;
      }
    }
    const grill = state.grill;
    if (grill.item && !grill.done) {
      grill.progress += dt;
      if (grill.progress >= GRILL_SECONDS) {
        grill.done = true;
        events |= EVENT_COOK_DONE;
      }
    } else if (grill.done && !grill.burnt) {
      grill.burnIn -= dt;
      if (grill.burnIn <= 0) {
        grill.burnt = true;
        events |= EVENT_BURN;
      }
    }
    return events;
  }

  function tickOrders(dt) {
    let events = 0;
    for (let index = state.orders.length - 1; index >= 0; index -= 1) {
      const order = state.orders[index];
      order.patience -= dt;
      if (order.patience <= 0) {
        state.orders.splice(index, 1);
        state.hearts -= 1;
        state.missed += 1;
        state.combo = 0;
        state.comboLeft = 0;
        events |= EVENT_EXPIRED;
      }
    }
    return events;
  }

  function reset() {
    state.time = 0;
    state.shiftLeft = SHIFT_SECONDS;
    state.hearts = HEARTS;
    state.coins = 0;
    state.served = 0;
    state.missed = 0;
    state.combo = 0;
    state.bestCombo = 0;
    state.comboLeft = 0;
    state.orders = [];
    state.nextOrderId = 1;
    state.spawnIn = 6;
    state.rushAnnounced = false;
    state.cook = { x: 640, y: 460, face: 1, moving: false, carrying: null };
    state.pot = { item: null, progress: 0, needed: 0, done: false };
    state.grill = { item: null, progress: 0, done: false, burnIn: 0, burnt: false };
    state.board = { item: null, chops: 0, ready: false };
    state.bowl = [];
    state.over = false;
    state.overReason = '';
  }

  // A busy-looking kitchen for the title screen: two tickets up, a bowl mid-assembly,
  // noodles on the boil and greens half chopped — the stall mid-service, before you start.
  function stageDemo() {
    reset();
    state.orders.push(
      { id: 1, dish: DISHES[3], patience: 34, maxPatience: ORDER_PATIENCE },
      { id: 2, dish: DISHES[1], patience: 22, maxPatience: ORDER_PATIENCE },
    );
    state.nextOrderId = 3;
    state.pot = { item: 'noodles', progress: 2.4, needed: BOIL_NOODLES_SECONDS, done: false };
    state.board = { item: 'veg', chops: 2, ready: false };
    state.bowl = ['cooked-noodles', 'chopped-veg'];
    state.cook = { x: 800, y: 620, face: -1, moving: false, carrying: 'grilled-chicken' };
    state.coins = 0;
    state.combo = 0;
    state.comboLeft = 0;
  }

  // Advance the world one fixed step. move is {x, y} (a unit-ish direction, may be 0,0);
  // interact is true on the single step a use key is pressed. Returns event bits.
  function step(dt, move, interact) {
    if (state.over) return 0;
    let events = 0;
    state.time += dt;
    state.shiftLeft = Math.max(0, SHIFT_SECONDS - state.time);

    if (!state.rushAnnounced && state.time >= RUSH_AT_SECONDS) {
      state.rushAnnounced = true;
      events |= EVENT_RUSH;
    }

    const cook = state.cook;
    if (move.x !== 0 || move.y !== 0) {
      const length = Math.hypot(move.x, move.y);
      cook.x += (move.x / length) * COOK_SPEED * dt;
      cook.y += (move.y / length) * COOK_SPEED * dt;
      cook.x = Math.min(FLOOR.x + FLOOR.width, Math.max(FLOOR.x, cook.x));
      cook.y = Math.min(FLOOR.y + FLOOR.height, Math.max(FLOOR.y, cook.y));
      if (move.x !== 0) cook.face = move.x > 0 ? 1 : -1;
      cook.moving = true;
    } else {
      cook.moving = false;
    }

    if (interact) {
      const station = nearestStation(state);
      if (station) events |= useStation(station);
    }

    events |= tickCookers(dt);
    events |= tickOrders(dt);

    if (state.comboLeft > 0) {
      state.comboLeft -= dt;
      if (state.comboLeft <= 0) state.combo = 0;
    }

    state.spawnIn -= dt;
    if (state.spawnIn <= 0 && state.orders.length < MAX_ORDERS) {
      spawnOrder();
      state.spawnIn = state.time >= RUSH_AT_SECONDS ? SPAWN_EVERY_RUSH : SPAWN_EVERY;
    }

    if (state.hearts <= 0) {
      state.over = true;
      state.overReason = 'missed';
    } else if (state.shiftLeft <= 0) {
      state.over = true;
      state.overReason = 'shift';
    }
    if (state.over) events |= EVENT_OVER;
    return events;
  }

  return {
    state,
    reset,
    stageDemo,
    step,
    stationById,
    carriedLabel(item) {
      return CARRIED_LABEL[item] ?? item;
    },
    bowlDish() {
      return dishForBowl(state.bowl);
    },
    bowlMatches(order) {
      return bowlMatchesDish(state.bowl, order.dish);
    },
  };
}
