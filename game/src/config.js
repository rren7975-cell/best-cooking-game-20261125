// Lantern Noodle Night — every number that tunes the stall lives here: the canvas,
// the kitchen layout, the shift clock, the order pressure and the scoring.
export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 800;
export const STEP = 1 / 60;
export const BEST_KEY = 'lantern-noodle-night-best';

// The shift: how long a night lasts, how many missed orders end it, and when the rush hits.
export const SHIFT_SECONDS = 150;
export const HEARTS = 3;
export const RUSH_AT_SECONDS = 70;
export const ORDER_PATIENCE = 48;
export const MAX_ORDERS = 4;

// Spawn pacing: a new ticket arrives this often, faster once the rush starts.
export const SPAWN_EVERY = 13;
export const SPAWN_EVERY_RUSH = 8;

// How long each prep job takes, and how long the grill forgives you before food burns.
export const BOIL_NOODLES_SECONDS = 4;
export const BOIL_EGG_SECONDS = 3;
export const GRILL_SECONDS = 5;
export const BURN_AFTER_SECONDS = 4;
export const CHOPS_TO_FINISH = 3;

// The cook walks this fast (pixels per second) and can only be grabbed this close.
export const COOK_SPEED = 300;
export const INTERACT_RADIUS = 78;

// Scoring: a served dish pays its price plus a tip for the patience left on its ticket,
// multiplied by the combo the cook has kept alive. A missed ticket costs a heart.
export const COMBO_WINDOW_SECONDS = 12;
export const TIP_MAX = 8;

// The kitchen floor the cook walks on; the counters sit on its edges.
export const FLOOR = { x: 24, y: 236, width: 1232, height: 452 };

// One station per counter slot. x/y is the centre of its counter, kind is what it does.
export const STATIONS = [
  { id: 'noodles', kind: 'bin', label: 'Noodles', x: 150, y: 206, w: 190, h: 44 },
  { id: 'veg', kind: 'bin', label: 'Veg Crate', x: 380, y: 206, w: 190, h: 44 },
  { id: 'egg', kind: 'bin', label: 'Egg Basket', x: 610, y: 206, w: 190, h: 44 },
  { id: 'chicken', kind: 'bin', label: 'Chicken', x: 840, y: 206, w: 190, h: 44 },
  { id: 'chili', kind: 'bin', label: 'Chili Sauce', x: 1070, y: 206, w: 190, h: 44 },
  { id: 'pot', kind: 'pot', label: 'Boiling Pot', x: 150, y: 716, w: 190, h: 44 },
  { id: 'board', kind: 'board', label: 'Chopping Board', x: 380, y: 716, w: 190, h: 44 },
  { id: 'grill', kind: 'grill', label: 'Charcoal Grill', x: 610, y: 716, w: 190, h: 44 },
  { id: 'plate', kind: 'plate', label: 'Plating Counter', x: 840, y: 716, w: 190, h: 44 },
  { id: 'serve', kind: 'serve', label: 'Serve Window', x: 1070, y: 716, w: 190, h: 44 },
  { id: 'bin', kind: 'bin', label: 'Scrap Bin', x: 1224, y: 462, w: 44, h: 190 },
];

// The order board's ticket rail, top of the screen under the header.
export const TICKET = { x: 24, y: 84, width: 296, height: 88, gap: 12 };
