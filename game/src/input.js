// Keyboard and mouse, both steering the same cook: WASD or arrows to walk, E or Space
// to use the nearest counter, and a click anywhere to walk there — clicking a counter
// walks up to it and uses it on arrival. M mutes, P pauses, Enter confirms menus.
import { INTERACT_RADIUS, STATIONS } from './config.js';

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_INTERACT = 4;
export const ACTION_MUTE = 8;

export function createInput(canvas) {
  const keys = new Set();
  let actions = 0;
  // Where the mouse told the cook to go, in canvas coordinates; null when walking by keys.
  let clickTarget = null;

  function canvasPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    keys.add(event.code);
    if (event.code === 'Space' || event.code === 'KeyE') actions |= ACTION_INTERACT;
    if (event.code === 'Enter') actions |= ACTION_CONFIRM;
    if (event.code === 'KeyP' || event.code === 'Escape') actions |= ACTION_PAUSE;
    if (event.code === 'KeyM') actions |= ACTION_MUTE;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
      event.preventDefault();
    }
  });
  window.addEventListener('keyup', (event) => {
    keys.delete(event.code);
  });
  window.addEventListener('blur', () => {
    keys.clear();
    clickTarget = null;
  });

  canvas.addEventListener('pointerdown', (event) => {
    clickTarget = canvasPoint(event);
    actions |= ACTION_CONFIRM;
  });

  function keyDirection() {
    let x = 0;
    let y = 0;
    if (keys.has('KeyA') || keys.has('ArrowLeft')) x -= 1;
    if (keys.has('KeyD') || keys.has('ArrowRight')) x += 1;
    if (keys.has('KeyW') || keys.has('ArrowUp')) y -= 1;
    if (keys.has('KeyS') || keys.has('ArrowDown')) y += 1;
    return { x, y };
  }

  function stationNear(point) {
    let best = null;
    let bestDistance = 130;
    for (const station of STATIONS) {
      const d = Math.hypot(point.x - station.x, point.y - station.y);
      if (d < bestDistance) {
        bestDistance = d;
        best = station;
      }
    }
    return best;
  }

  return {
    /** The move direction for this frame: keys win, otherwise walk to the click target. */
    direction(cook) {
      const keyed = keyDirection();
      if (keyed.x !== 0 || keyed.y !== 0) {
        clickTarget = null;
        return keyed;
      }
      if (clickTarget) {
        const dx = clickTarget.x - cook.x;
        const dy = clickTarget.y - cook.y;
        const distance = Math.hypot(dx, dy);
        if (distance < 12) {
          clickTarget = null;
          return { x: 0, y: 0 };
        }
        return { x: dx / distance, y: dy / distance };
      }
      return { x: 0, y: 0 };
    },
    /**
     * True once when the cook has walked up to the counter the mouse clicked:
     * the click landed near a station and the cook is now in range of that station.
     */
    pollClickInteract(cook) {
      if (!clickTarget) return false;
      const station = stationNear(clickTarget);
      if (!station) return false;
      if (Math.hypot(cook.x - station.x, cook.y - station.y) < INTERACT_RADIUS) {
        clickTarget = null;
        return true;
      }
      return false;
    },
    /** One-shot actions since the last call (confirm, pause, interact, mute). */
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
  };
}
