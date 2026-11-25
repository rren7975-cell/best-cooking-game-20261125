// Boot and the one loop: input is read every frame, the world advances in fixed 1/60 s
// steps (several in a slow frame, none in a fast one), and the renderer paints what is
// there. The game moves between four screens: title, play, paused and game over.
//
// ?seed=N fixes the ticket pattern. ?shot=start|play|rush|end (with &seed=N) stages that
// scene instead of running the loop, paints it twice and sets window.__shotReady.
import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import { createSoundboard } from './audio.js';
import {
  EVENT_BURN,
  EVENT_CHOP,
  EVENT_CHOP_DONE,
  EVENT_COOK_DONE,
  EVENT_DISCARD,
  EVENT_ERROR,
  EVENT_EXPIRED,
  EVENT_OVER,
  EVENT_PICKUP,
  EVENT_PLATED,
  EVENT_RUSH,
  EVENT_SERVED,
  EVENT_START_COOK,
  createWorld,
} from './world.js';
import { ACTION_CONFIRM, ACTION_INTERACT, ACTION_MUTE, ACTION_PAUSE, createInput } from './input.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);
const sounds = createSoundboard();

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best night then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best, 0);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();
  let lastCoins = 0;

  // Screen readers (and anyone watching the page's text) hear the screen changes.
  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    world.reset();
    accumulator = 0;
    lastCoins = 0;
    screen = SCREEN_PLAY;
    announce('Playing. Serve tickets before their patience runs out.');
  }

  function endGame() {
    screen = SCREEN_OVER;
    if (world.state.coins > best) {
      best = world.state.coins;
      saveBest(best);
    }
    sounds.gameOver();
    announce(
      `Shift over. You earned $${world.state.coins} and served ${world.state.served} dishes. Best night $${best}.`,
    );
  }

  function handleEvents(events) {
    if (events & EVENT_SERVED) {
      const earned = world.state.coins - lastCoins;
      lastCoins = world.state.coins;
      renderer.addTip(`+$${earned}`, 840, 640, '#f2c94c');
      sounds.served();
      sounds.coin();
      announce(`Served! $${earned}. ${world.state.coins} coins so far.`);
    }
    if (events & EVENT_EXPIRED) {
      renderer.addTip('Order missed!', 640, 300, '#ff5a6e');
      sounds.expired();
      announce('An order expired. A heart is gone.');
    }
    if (events & EVENT_RUSH) {
      sounds.rush();
      announce('Rush hour! Orders are coming faster.');
    }
    if (events & EVENT_CHOP) sounds.chop();
    if (events & EVENT_CHOP_DONE) sounds.chopDone();
    if (events & EVENT_PLATED) sounds.plated();
    if (events & EVENT_PICKUP) sounds.pickup();
    if (events & EVENT_ERROR) sounds.error();
    if (events & EVENT_DISCARD) sounds.error();
    if (events & EVENT_COOK_DONE) sounds.bubble();
    if (events & EVENT_BURN) {
      renderer.addTip('Burnt! Scrape it off', 610, 640, '#ff5a6e');
      sounds.error();
    }
    if (events & EVENT_START_COOK) sounds.sizzle();
    if (events & EVENT_OVER) endGame();
  }

  function handleActions(actions) {
    if (actions & ACTION_MUTE) {
      const muted = sounds.toggleMute();
      announce(muted ? 'Muted.' : 'Sound on.');
    }
    if (actions & (ACTION_CONFIRM | ACTION_INTERACT) && (screen === SCREEN_TITLE || screen === SCREEN_OVER)) {
      sounds.unlock();
      startGame();
    } else if (actions & ACTION_PAUSE && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    } else if (actions & (ACTION_PAUSE | ACTION_CONFIRM | ACTION_INTERACT) && screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      announce('Playing.');
    }
  }

  function step(actions) {
    const interact = Boolean(actions & ACTION_INTERACT) || input.pollClickInteract(world.state.cook);
    const events = world.step(STEP, input.direction(world.state.cook), interact);
    handleEvents(events);
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    let actions = input.takeActions();
    handleActions(actions);
    if (screen === SCREEN_TITLE) {
      // Keep the title backdrop alive without running a full shift.
      if (world.state.orders.length === 0 || world.state.over) world.stageDemo();
      world.step(STEP, { x: 0, y: 0 }, false);
      accumulator = 0;
    } else if (screen === SCREEN_PLAY) {
      while (accumulator >= STEP && screen === SCREEN_PLAY) {
        step(actions);
        actions = 0;
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    renderer.draw(world.state, screen, best, Math.min(accumulator, STEP));
  }

  // Leaving the tab pauses a running game rather than letting tickets expire unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  world.stageDemo();
  announce('Lantern Noodle Night. Press Space or click to open the stall.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
