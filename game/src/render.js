// Every pixel of Lantern Noodle Night: the header, the ticket rail, the counters with
// their ingredients, the cook, and the title / pause / game-over screens. All art is
// drawn from code — no images — and every animation reads state.time, so a screenshot
// scene paints the same frame every time.
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  FLOOR,
  GRILL_SECONDS,
  RUSH_AT_SECONDS,
  SHIFT_SECONDS,
  STATIONS,
  TICKET,
} from './config.js';
import { CARRIED_LABEL, DISHES, INGREDIENTS } from './recipes.js';
import { nearestStation } from './world.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

const CREAM = '#fff3d6';
const GOLD = '#f2c94c';
const RED = '#e0393e';
const TEAL = '#2ec4b6';
const WOOD = '#8a5a33';
const WOOD_DARK = '#6e4525';
const INK = '#241b3a';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawHeart(ctx, x, y, size, filled) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 16, size / 16);
  ctx.beginPath();
  ctx.moveTo(8, 14);
  ctx.bezierCurveTo(0, 8, -2, 3, 3, 1);
  ctx.bezierCurveTo(6, 0, 8, 2, 8, 4);
  ctx.bezierCurveTo(8, 2, 10, 0, 13, 1);
  ctx.bezierCurveTo(18, 3, 16, 8, 8, 14);
  ctx.closePath();
  ctx.fillStyle = filled ? '#ff5a6e' : 'rgba(255,255,255,0.18)';
  ctx.fill();
  ctx.restore();
}

function drawLantern(ctx, x, y, size, time, phase) {
  const sway = Math.sin(time * 1.2 + phase) * 3;
  ctx.save();
  ctx.translate(x + sway, y);
  ctx.strokeStyle = '#c9a227';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -size - 8);
  ctx.lineTo(0, -size / 2);
  ctx.stroke();
  ctx.fillStyle = '#ff4d4d';
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 0.62, size, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffb347';
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 0.34, size * 0.72, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#c9a227';
  ctx.fillRect(-size * 0.22, -size - 2, size * 0.44, 5);
  ctx.fillRect(-size * 0.22, size - 3, size * 0.44, 5);
  ctx.restore();
}

// One ingredient, drawn the same everywhere: tickets, counters, hands, bowls.
export function drawIngredientIcon(ctx, item, x, y, size) {
  const s = size / 2;
  ctx.save();
  ctx.translate(x, y);
  ctx.lineWidth = 2;
  if (item === 'noodles' || item === 'cooked-noodles') {
    ctx.strokeStyle = item === 'cooked-noodles' ? '#ffd97a' : '#e8c268';
    ctx.lineWidth = 3;
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.moveTo(-s + 2, i * s * 0.55);
      ctx.bezierCurveTo(-s * 0.3, i * s * 0.55 - 5, s * 0.3, i * s * 0.55 + 5, s - 2, i * s * 0.55);
      ctx.stroke();
    }
    if (item === 'cooked-noodles') {
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath();
      ctx.ellipse(0, -s * 0.5, s * 0.7, s * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (item === 'egg' || item === 'boiled-egg') {
    ctx.fillStyle = '#fff8e7';
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.85, s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f2a541';
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.45, 0, Math.PI * 2);
    ctx.fill();
    if (item === 'egg') {
      ctx.strokeStyle = '#c9a227';
      ctx.beginPath();
      ctx.moveTo(-s * 0.6, -s * 0.2);
      ctx.lineTo(s * 0.6, s * 0.3);
      ctx.stroke();
    }
  } else if (item === 'veg' || item === 'chopped-veg') {
    ctx.fillStyle = '#6fbf4a';
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.ellipse(-s * 0.5 + i * s * 0.5, (i % 2 === 0 ? -s * 0.25 : s * 0.25), s * 0.55, s * 0.32, (i - 1) * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = '#3e7d2c';
    ctx.beginPath();
    ctx.moveTo(-s * 0.7, s * 0.6);
    ctx.lineTo(s * 0.7, s * 0.6);
    ctx.stroke();
    if (item === 'chopped-veg') {
      ctx.strokeStyle = '#3e7d2c';
      ctx.beginPath();
      ctx.moveTo(-s * 0.4, -s * 0.5);
      ctx.lineTo(s * 0.4, s * 0.5);
      ctx.moveTo(s * 0.4, -s * 0.5);
      ctx.lineTo(-s * 0.4, s * 0.5);
      ctx.stroke();
    }
  } else if (item === 'chicken' || item === 'grilled-chicken') {
    ctx.fillStyle = item === 'grilled-chicken' ? '#b25a24' : '#e07840';
    ctx.beginPath();
    ctx.ellipse(0, s * 0.1, s * 0.85, s * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff3d6';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(s * 0.55, -s * 0.25);
    ctx.lineTo(s * 1.05, -s * 0.8);
    ctx.stroke();
    ctx.fillStyle = '#fff3d6';
    ctx.beginPath();
    ctx.arc(s * 1.05, -s * 0.85, s * 0.22, 0, Math.PI * 2);
    ctx.fill();
    if (item === 'grilled-chicken') {
      ctx.strokeStyle = '#5e2f12';
      ctx.beginPath();
      ctx.moveTo(-s * 0.5, -s * 0.2);
      ctx.lineTo(-s * 0.1, s * 0.3);
      ctx.moveTo(s * 0.1, -s * 0.3);
      ctx.lineTo(s * 0.5, s * 0.2);
      ctx.stroke();
    }
  } else if (item === 'chili') {
    ctx.fillStyle = '#d9392b';
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.5, s * 0.95, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#6fbf4a';
    ctx.fillRect(-s * 0.15, -s * 1.25, s * 0.3, s * 0.5);
  }
  ctx.restore();
}

/** A bowl holding the given prepped items, with chopsticks when it is a finished dish. */
function drawBowl(ctx, x, y, size, contents, ready, time) {
  const s = size / 2;
  ctx.save();
  ctx.translate(x, y);
  if (ready) {
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.7 + 0.3 * Math.sin(time * 4);
    ctx.beginPath();
    ctx.arc(0, 0, s + 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  // Noodle base shows whenever noodles are in the bowl.
  if (contents.includes('cooked-noodles')) {
    ctx.fillStyle = '#ffd97a';
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.15, s * 0.85, s * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#c9a227';
    ctx.lineWidth = 2;
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.moveTo(-s * 0.6, -s * 0.15 + i * 4);
      ctx.quadraticCurveTo(0, -s * 0.15 + i * 4 - 4, s * 0.6, -s * 0.15 + i * 4);
      ctx.stroke();
    }
  }
  ctx.fillStyle = '#2f6db3';
  ctx.beginPath();
  ctx.moveTo(-s, -s * 0.25);
  ctx.quadraticCurveTo(0, s * 1.05, s, -s * 0.25);
  ctx.quadraticCurveTo(s * 0.85, s * 0.55, s * 0.55, s * 0.75);
  ctx.lineTo(-s * 0.55, s * 0.75);
  ctx.quadraticCurveTo(-s * 0.85, s * 0.55, -s, -s * 0.25);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#3f83d6';
  ctx.beginPath();
  ctx.ellipse(0, -s * 0.25, s, s * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();
  // Toppings peek out of the bowl, in the order they were added.
  let offset = -s * 0.45;
  for (const item of contents) {
    if (item === 'cooked-noodles') continue;
    drawIngredientIcon(ctx, item, offset, -s * 0.35, s * 0.62);
    offset += s * 0.45;
  }
  if (ready) {
    ctx.strokeStyle = '#8a5a33';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(s * 0.55, -s * 0.9);
    ctx.lineTo(s * 1.05, s * 0.35);
    ctx.moveTo(s * 0.75, -s * 0.95);
    ctx.lineTo(s * 1.2, s * 0.25);
    ctx.stroke();
  }
  ctx.restore();
}

function drawProgressRing(ctx, x, y, radius, fraction, color) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, -Math.PI / 2, -Math.PI / 2 + fraction * Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawSteam(ctx, x, y, time, amount) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for (let i = 0; i < amount; i += 1) {
    const phase = (time * 0.7 + i * 0.55) % 1;
    const sx = x + Math.sin(time * 2 + i * 2.1) * 6 + (i - amount / 2) * 10;
    const sy = y - phase * 34;
    ctx.globalAlpha = 0.6 * (1 - phase);
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.quadraticCurveTo(sx + 6, sy - 8, sx - 2, sy - 14);
    ctx.stroke();
  }
  ctx.restore();
}

function patienceColor(fraction) {
  if (fraction > 0.55) return '#6fbf4a';
  if (fraction > 0.25) return '#f2a541';
  return '#e0393e';
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  const tips = [];

  function addTip(text, x, y, color) {
    tips.push({ text, x, y, color: color ?? GOLD, age: 0 });
    if (tips.length > 12) tips.shift();
  }

  function drawHeader(state, screen) {
    ctx.fillStyle = '#17102e';
    ctx.fillRect(0, 0, CANVAS_WIDTH, 64);
    ctx.fillStyle = RED;
    ctx.fillRect(0, 60, CANVAS_WIDTH, 4);
    drawLantern(ctx, 30, 34, 13, state.time, 0);
    drawLantern(ctx, CANVAS_WIDTH - 30, 34, 13, state.time, 2);
    ctx.fillStyle = GOLD;
    ctx.font = 'bold 26px Georgia, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('🏮 LANTERN NOODLE NIGHT', 56, 33);
    ctx.font = '16px Georgia, serif';
    ctx.fillStyle = CREAM;
    ctx.fillText('A night-market noodle stall', 486, 35);

    // Shift timer, centre-right, with a bar that drains as the night runs out.
    const minutes = Math.floor(state.shiftLeft / 60);
    const seconds = Math.floor(state.shiftLeft % 60);
    const timerText = `${minutes}:${String(seconds).padStart(2, '0')}`;
    const urgent = state.shiftLeft <= 30;
    ctx.font = 'bold 30px Georgia, serif';
    ctx.textAlign = 'right';
    ctx.fillStyle = urgent && Math.sin(state.time * 6) > 0 ? '#ff5a6e' : CREAM;
    ctx.fillText(`⏱ ${timerText}`, 1010, 30);
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(880, 50, 130, 6);
    ctx.fillStyle = urgent ? '#ff5a6e' : TEAL;
    ctx.fillRect(880, 50, 130 * (state.shiftLeft / SHIFT_SECONDS), 6);

    ctx.textAlign = 'left';
    ctx.font = 'bold 22px Georgia, serif';
    ctx.fillStyle = GOLD;
    ctx.fillText(`🪙 $${state.coins}`, 1040, 26);
    ctx.font = '16px Georgia, serif';
    ctx.fillStyle = state.combo > 1 ? GOLD : 'rgba(255,243,214,0.6)';
    ctx.fillText(state.combo > 1 ? `🔥 Combo x${state.combo}` : 'No combo yet', 1040, 50);
    for (let i = 0; i < 3; i += 1) drawHeart(ctx, 1210 + i * 24, 32, 17, i < state.hearts);
    if (screen === SCREEN_TITLE) {
      ctx.fillStyle = 'rgba(255,243,214,0.55)';
      ctx.font = '13px Georgia, serif';
      ctx.textAlign = 'right';
      ctx.fillText('M mute', 1180, 56);
    }
  }

  function drawTicket(order, index) {
    const x = TICKET.x + index * (TICKET.width + TICKET.gap);
    const y = TICKET.y;
    const w = TICKET.width;
    const h = TICKET.height;
    const fraction = Math.max(0, order.patience / order.maxPatience);
    ctx.save();
    roundRect(ctx, x, y, w, h, 10);
    ctx.fillStyle = '#fff8e7';
    ctx.fill();
    ctx.strokeStyle = '#d9c08a';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Torn top edge.
    ctx.fillStyle = '#fff8e7';
    for (let i = 0; i < 8; i += 1) {
      ctx.beginPath();
      ctx.arc(x + 12 + i * 36, y, 7, 0, Math.PI);
      ctx.fill();
    }
    ctx.fillStyle = INK;
    ctx.font = 'bold 17px Georgia, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(`#${order.id} ${order.dish.name}`, x + 12, y + 22);
    ctx.font = '15px Georgia, serif';
    ctx.fillStyle = '#5a4a33';
    ctx.fillText(`$${order.dish.price}  ·  ${order.dish.blurb}`, x + 12, y + 40);
    // What the dish needs, as icons.
    let iconX = x + 26;
    for (const need of order.dish.needs) {
      drawIngredientIcon(ctx, need, iconX, y + 58, 26);
      iconX += 34;
    }
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    roundRect(ctx, x + 12, y + 72, w - 24, 9, 4);
    ctx.fill();
    ctx.fillStyle = patienceColor(fraction);
    roundRect(ctx, x + 12, y + 72, (w - 24) * fraction, 9, 4);
    ctx.fill();
    ctx.restore();
  }

  function drawOrderBoard(state) {
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.fillRect(0, 64, CANVAS_WIDTH, 116);
    ctx.fillStyle = GOLD;
    ctx.font = 'bold 13px Georgia, serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(242,201,76,0.9)';
    ctx.fillText('— ORDER BOARD —', 24, 78);
    for (let i = 0; i < state.orders.length; i += 1) drawTicket(state.orders[i], i);
    if (state.orders.length === 0) {
      ctx.fillStyle = 'rgba(255,243,214,0.6)';
      ctx.font = 'italic 16px Georgia, serif';
      ctx.fillText('No orders yet — the night is young…', 340, 130);
    }
  }

  function drawCounterBase(station) {
    ctx.save();
    roundRect(ctx, station.x - station.w / 2, station.y - station.h / 2, station.w, station.h, 8);
    ctx.fillStyle = WOOD;
    ctx.fill();
    ctx.strokeStyle = WOOD_DARK;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(station.x - station.w / 2 + 4, station.y - station.h / 2 + 3, station.w - 8, 6);
    ctx.restore();
  }

  function drawCounterLabel(station, highlight) {
    ctx.save();
    ctx.font = 'bold 13px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = highlight ? GOLD : 'rgba(255,243,214,0.85)';
    const labelY = station.y > 400 ? station.y - station.h / 2 - 8 : station.y + station.h / 2 + 16;
    ctx.fillText(station.label.toUpperCase(), station.x, labelY);
    ctx.restore();
  }

  function drawStation(state, station, highlight) {
    drawCounterBase(station);
    const t = state.time;
    switch (station.id) {
      case 'noodles':
        drawIngredientIcon(ctx, 'noodles', station.x - 40, station.y, 30);
        drawIngredientIcon(ctx, 'noodles', station.x + 10, station.y, 30);
        ctx.fillStyle = '#e8c268';
        ctx.font = 'bold 13px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText('× ∞', station.x + 62, station.y + 5);
        break;
      case 'veg':
        drawIngredientIcon(ctx, 'veg', station.x - 30, station.y, 34);
        drawIngredientIcon(ctx, 'veg', station.x + 25, station.y, 34);
        break;
      case 'egg':
        drawIngredientIcon(ctx, 'egg', station.x - 35, station.y, 28);
        drawIngredientIcon(ctx, 'egg', station.x, station.y, 28);
        drawIngredientIcon(ctx, 'egg', station.x + 35, station.y, 28);
        break;
      case 'chicken':
        drawIngredientIcon(ctx, 'chicken', station.x - 25, station.y, 32);
        drawIngredientIcon(ctx, 'chicken', station.x + 30, station.y, 32);
        break;
      case 'chili': {
        ctx.fillStyle = '#d9392b';
        ctx.beginPath();
        ctx.ellipse(station.x, station.y, 14, 18, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#8a1f16';
        ctx.fillRect(station.x - 6, station.y - 24, 12, 8);
        ctx.fillStyle = '#fff3d6';
        ctx.font = 'bold 11px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText('HOT', station.x, station.y + 4);
        break;
      }
      case 'pot': {
        const pot = state.pot;
        ctx.fillStyle = '#3a3f4a';
        ctx.beginPath();
        ctx.ellipse(station.x, station.y + 2, 52, 16, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = pot.item ? '#7ec8e3' : '#4a5568';
        ctx.beginPath();
        ctx.ellipse(station.x, station.y, 44, 11, 0, 0, Math.PI * 2);
        ctx.fill();
        if (pot.item) {
          drawSteam(ctx, station.x, station.y - 8, t, 3);
          if (!pot.done) {
            drawProgressRing(ctx, station.x, station.y - 2, 26, pot.progress / pot.needed, TEAL);
          } else {
            drawIngredientIcon(ctx, pot.item === 'noodles' ? 'cooked-noodles' : 'boiled-egg', station.x, station.y - 4, 26);
          }
          ctx.fillStyle = CREAM;
          ctx.font = 'bold 12px Georgia, serif';
          ctx.textAlign = 'center';
          ctx.fillText(pot.done ? 'READY!' : 'boiling…', station.x, station.y - 52);
        }
        break;
      }
      case 'board': {
        const board = state.board;
        ctx.fillStyle = '#d9b380';
        roundRect(ctx, station.x - 62, station.y - 12, 124, 24, 4);
        ctx.fill();
        if (board.item) {
          drawIngredientIcon(ctx, board.ready ? 'chopped-veg' : 'veg', station.x, station.y - 2, 30);
          if (!board.ready) {
            ctx.fillStyle = INK;
            ctx.font = 'bold 13px Georgia, serif';
            ctx.textAlign = 'center';
            ctx.fillText(`chop ${board.chops}/3`, station.x, station.y - 52);
          } else {
            ctx.fillStyle = '#6fbf4a';
            ctx.font = 'bold 12px Georgia, serif';
            ctx.textAlign = 'center';
            ctx.fillText('CHOPPED!', station.x, station.y - 52);
          }
        } else {
          ctx.fillStyle = 'rgba(36,27,58,0.5)';
          ctx.font = '13px Georgia, serif';
          ctx.textAlign = 'center';
          ctx.fillText('bring greens', station.x, station.y + 5);
        }
        break;
      }
      case 'grill': {
        const grill = state.grill;
        ctx.fillStyle = '#2b2b33';
        roundRect(ctx, station.x - 58, station.y - 12, 116, 24, 6);
        ctx.fill();
        if (grill.item) {
          const flame = grill.burnt ? '#8a8a8a' : '#ff7a2f';
          for (let i = 0; i < 3; i += 1) {
            const fx = station.x - 30 + i * 30;
            const fh = 10 + Math.sin(t * 8 + i * 2) * 4;
            ctx.fillStyle = flame;
            ctx.beginPath();
            ctx.moveTo(fx - 8, station.y + 10);
            ctx.quadraticCurveTo(fx, station.y - fh, fx + 8, station.y + 10);
            ctx.closePath();
            ctx.fill();
          }
          if (grill.burnt) {
            ctx.fillStyle = '#1c1c1c';
            ctx.beginPath();
            ctx.ellipse(station.x, station.y - 2, 26, 12, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ff5a6e';
            ctx.font = 'bold 12px Georgia, serif';
            ctx.textAlign = 'center';
            ctx.fillText('BURNT! scrape it off', station.x, station.y - 52);
          } else if (grill.done) {
            drawIngredientIcon(ctx, 'grilled-chicken', station.x, station.y - 4, 28);
            ctx.fillStyle = GOLD;
            ctx.font = 'bold 12px Georgia, serif';
            ctx.textAlign = 'center';
            ctx.fillText('READY!', station.x, station.y - 52);
          } else {
            drawIngredientIcon(ctx, 'chicken', station.x, station.y - 4, 28);
            drawProgressRing(ctx, station.x, station.y - 4, 26, grill.progress / GRILL_SECONDS, '#ff7a2f');
          }
        } else {
          ctx.fillStyle = 'rgba(255,243,214,0.5)';
          ctx.font = '13px Georgia, serif';
          ctx.textAlign = 'center';
          ctx.fillText('bring chicken', station.x, station.y + 5);
        }
        break;
      }
      case 'plate': {
        const readyDish = state.bowl.length > 0 && DISHES.some((d) => state.bowl.length === d.needs.length && d.needs.every((n) => state.bowl.includes(n)));
        drawBowl(ctx, station.x, station.y + 2, 58, state.bowl, readyDish, t);
        if (state.bowl.length === 0) {
          ctx.fillStyle = 'rgba(255,243,214,0.55)';
          ctx.font = '13px Georgia, serif';
          ctx.textAlign = 'center';
          ctx.fillText('assemble here', station.x, station.y - 52);
        } else if (readyDish) {
          ctx.fillStyle = GOLD;
          ctx.font = 'bold 15px Georgia, serif';
          ctx.textAlign = 'center';
          ctx.fillText('★ PLATE READY — SERVE IT! ★', station.x, station.y - 52);
        } else {
          ctx.fillStyle = CREAM;
          ctx.font = '13px Georgia, serif';
          ctx.textAlign = 'center';
          ctx.fillText('mid-assembly…', station.x, station.y - 52);
        }
        break;
      }
      case 'serve': {
        ctx.fillStyle = '#3a2b1f';
        roundRect(ctx, station.x - 70, station.y - 16, 140, 32, 6);
        ctx.fill();
        ctx.fillStyle = '#ffd97a';
        ctx.beginPath();
        ctx.arc(station.x - 40, station.y, 10, 0, Math.PI * 2);
        ctx.arc(station.x + 40, station.y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = CREAM;
        ctx.font = 'bold 14px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText('SERVE →', station.x, station.y + 5);
        // A hungry customer waits at the window.
        const bob = Math.sin(t * 2.5) * 3;
        ctx.fillStyle = '#f2a541';
        ctx.beginPath();
        ctx.arc(station.x, station.y - 52 + bob, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = INK;
        ctx.beginPath();
        ctx.arc(station.x - 5, station.y - 54 + bob, 2, 0, Math.PI * 2);
        ctx.arc(station.x + 5, station.y - 54 + bob, 2, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'bin': {
        ctx.fillStyle = '#4a5568';
        roundRect(ctx, station.x - 16, station.y - 80, 32, 160, 6);
        ctx.fill();
        ctx.fillStyle = '#2f3542';
        ctx.fillRect(station.x - 16, station.y - 80, 32, 10);
        ctx.fillStyle = CREAM;
        ctx.font = 'bold 12px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.save();
        ctx.translate(station.x, station.y);
        ctx.rotate(Math.PI / 2);
        ctx.fillText('SCRAP', 0, 4);
        ctx.restore();
        break;
      }
      default:
        break;
    }
    if (highlight) {
      ctx.save();
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 4]);
      roundRect(ctx, station.x - station.w / 2 - 6, station.y - station.h / 2 - 6, station.w + 12, station.h + 12, 10);
      ctx.stroke();
      ctx.restore();
    }
    drawCounterLabel(station, highlight);
  }

  function drawCook(state) {
    const cook = state.cook;
    const bob = cook.moving ? Math.sin(state.time * 14) * 3 : Math.sin(state.time * 2) * 1.5;
    ctx.save();
    ctx.translate(cook.x, cook.y + bob * 0.4);
    // Shadow.
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(0, 26, 22, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    // Body: apron and arms.
    ctx.fillStyle = '#f5f0e6';
    roundRect(ctx, -15, -6, 30, 30, 8);
    ctx.fill();
    ctx.fillStyle = RED;
    ctx.fillRect(-15, 8, 30, 8);
    // Head.
    ctx.fillStyle = '#f2c184';
    ctx.beginPath();
    ctx.arc(0, -16, 13, 0, Math.PI * 2);
    ctx.fill();
    // Chef hat.
    ctx.fillStyle = '#fff8e7';
    ctx.beginPath();
    ctx.arc(-7, -26, 8, 0, Math.PI * 2);
    ctx.arc(0, -30, 9, 0, Math.PI * 2);
    ctx.arc(7, -26, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-13, -28, 26, 6);
    // Eyes look the way the cook faces.
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.arc(cook.face * 4 - 4, -16, 1.8, 0, Math.PI * 2);
    ctx.arc(cook.face * 4 + 4, -16, 1.8, 0, Math.PI * 2);
    ctx.fill();
    // Carried item floats above the hat.
    if (cook.carrying) {
      drawIngredientIcon(ctx, cook.carrying, 0, -52, 34);
      ctx.fillStyle = CREAM;
      ctx.font = 'bold 12px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText(CARRIED_LABEL[cook.carrying] ?? cook.carrying, 0, -70);
    }
    ctx.restore();
  }

  function drawPottedPlant(x, y) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#b25a24';
    ctx.beginPath();
    ctx.moveTo(-14, 0);
    ctx.lineTo(14, 0);
    ctx.lineTo(10, 18);
    ctx.lineTo(-10, 18);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#6fbf4a';
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.ellipse(i * 9, -12 - Math.abs(i) * -4, 7, 16, i * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawKitchen(state, highlightStation) {
    // Night street backdrop.
    const gradient = ctx.createLinearGradient(0, 180, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#241b3a');
    gradient.addColorStop(1, '#17102e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 180, CANVAS_WIDTH, CANVAS_HEIGHT - 180);
    // Floor tiles.
    ctx.fillStyle = '#2e2450';
    ctx.fillRect(FLOOR.x, FLOOR.y, FLOOR.width, FLOOR.height);
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let x = FLOOR.x; x <= FLOOR.x + FLOOR.width; x += 44) {
      ctx.beginPath();
      ctx.moveTo(x, FLOOR.y);
      ctx.lineTo(x, FLOOR.y + FLOOR.height);
      ctx.stroke();
    }
    for (let y = FLOOR.y; y <= FLOOR.y + FLOOR.height; y += 44) {
      ctx.beginPath();
      ctx.moveTo(FLOOR.x, y);
      ctx.lineTo(FLOOR.x + FLOOR.width, y);
      ctx.stroke();
    }
    // A worn red rug where the cook paces, and plants in the corners.
    ctx.fillStyle = 'rgba(224,57,62,0.10)';
    ctx.beginPath();
    ctx.ellipse(640, 470, 230, 75, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(242,201,76,0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(640, 470, 230, 75, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(640, 470, 190, 55, 0, 0, Math.PI * 2);
    ctx.stroke();
    drawPottedPlant(72, 640);
    drawPottedPlant(1188, 300);
    // Festival string lights across the top of the floor.
    ctx.strokeStyle = 'rgba(255,243,214,0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(60, 244);
    ctx.quadraticCurveTo(640, 292, 1220, 244);
    ctx.stroke();
    for (let i = 0; i <= 16; i += 1) {
      const t = i / 16;
      const x = 60 + t * 1160;
      const y = 244 + 96 * t * (1 - t);
      ctx.fillStyle = ['#ffd97a', '#ff7a6e', '#7ee8d8'][i % 3];
      ctx.beginPath();
      ctx.arc(x, y + 6, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }
    // Hanging lanterns over the kitchen.
    drawLantern(ctx, 120, 218, 11, state.time, 0.5);
    drawLantern(ctx, 640, 214, 12, state.time, 1.7);
    drawLantern(ctx, 1160, 218, 11, state.time, 2.9);
    for (const station of STATIONS) drawStation(state, station, highlightStation === station);
    drawCook(state);
    // Rush banner.
    if (state.rushAnnounced && state.time - RUSH_AT_SECONDS < 4) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, (4 - (state.time - RUSH_AT_SECONDS)) / 0.5);
      ctx.fillStyle = RED;
      roundRect(ctx, CANVAS_WIDTH / 2 - 190, 300, 380, 64, 12);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 34px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('🔥 RUSH HOUR! 🔥', CANVAS_WIDTH / 2, 343);
      ctx.restore();
    }
  }

  function drawHints() {
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(0, 762, CANVAS_WIDTH, 38);
    ctx.fillStyle = 'rgba(255,243,214,0.8)';
    ctx.font = '15px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      'Move: WASD / Arrows  ·  Use counter: E or Space  ·  Click a counter to walk there  ·  P pause  ·  M mute',
      CANVAS_WIDTH / 2,
      786,
    );
  }

  function drawTips(dt) {
    for (let i = tips.length - 1; i >= 0; i -= 1) {
      const tip = tips[i];
      tip.age += dt;
      if (tip.age > 1.4) {
        tips.splice(i, 1);
        continue;
      }
      ctx.save();
      ctx.globalAlpha = 1 - tip.age / 1.4;
      ctx.fillStyle = tip.color;
      ctx.font = 'bold 22px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText(tip.text, tip.x, tip.y - tip.age * 40);
      ctx.restore();
    }
  }

  function drawTitleScreen(state, best) {
    ctx.fillStyle = 'rgba(16,10,32,0.82)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = GOLD;
    ctx.font = 'bold 64px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('🏮 LANTERN NOODLE NIGHT 🏮', CANVAS_WIDTH / 2, 250);
    ctx.fillStyle = CREAM;
    ctx.font = 'italic 26px Georgia, serif';
    ctx.fillText('One cook. One stall. A whole hungry street.', CANVAS_WIDTH / 2, 295);
    // The menu, so the player plans before the first ticket.
    ctx.fillStyle = 'rgba(255,248,231,0.95)';
    roundRect(ctx, CANVAS_WIDTH / 2 - 330, 330, 660, 210, 14);
    ctx.fill();
    ctx.fillStyle = INK;
    ctx.font = 'bold 20px Georgia, serif';
    ctx.fillText('— TONIGHT’S MENU —', CANVAS_WIDTH / 2, 362);
    ctx.font = '17px Georgia, serif';
    ctx.textAlign = 'left';
    DISHES.forEach((dish, index) => {
      const y = 392 + index * 28;
      ctx.fillStyle = INK;
      ctx.fillText(`${dish.name} — $${dish.price}`, CANVAS_WIDTH / 2 - 300, y);
      let iconX = CANVAS_WIDTH / 2 + 190;
      for (const need of dish.needs) {
        drawIngredientIcon(ctx, need, iconX, y - 6, 20);
        iconX += 26;
      }
    });
    ctx.textAlign = 'center';
    ctx.fillStyle = CREAM;
    ctx.font = 'bold 24px Georgia, serif';
    const blink = Math.sin(state.time * 4) > -0.4;
    if (blink) ctx.fillText('Press SPACE or click to open the stall', CANVAS_WIDTH / 2, 600);
    ctx.font = '16px Georgia, serif';
    ctx.fillStyle = 'rgba(255,243,214,0.75)';
    ctx.fillText(
      'Boil noodles · Chop greens · Grill chicken · Plate to order · Serve before patience runs out',
      CANVAS_WIDTH / 2,
      640,
    );
    if (best > 0) {
      ctx.fillStyle = GOLD;
      ctx.font = 'bold 18px Georgia, serif';
      ctx.fillText(`Best night so far: $${best}`, CANVAS_WIDTH / 2, 676);
    }
  }

  function rankFor(coins) {
    if (coins >= 150) return 'Night Market Legend';
    if (coins >= 100) return 'Noodle Master';
    if (coins >= 60) return 'Steady Cook';
    if (coins >= 30) return 'Promising Stallhand';
    return 'Sleepy Stallhand';
  }

  function drawGameOverScreen(state, best) {
    ctx.fillStyle = 'rgba(16,10,32,0.78)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = GOLD;
    ctx.font = 'bold 52px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(state.overReason === 'missed' ? 'TOO MANY MISSED ORDERS!' : 'SHIFT OVER!', CANVAS_WIDTH / 2, 240);
    ctx.fillStyle = CREAM;
    ctx.font = 'italic 22px Georgia, serif';
    ctx.fillText(
      state.overReason === 'missed'
        ? 'The crowd drifted away hungry…'
        : 'The lanterns dim. The stall did its best.',
      CANVAS_WIDTH / 2,
      282,
    );
    ctx.fillStyle = 'rgba(255,248,231,0.95)';
    roundRect(ctx, CANVAS_WIDTH / 2 - 260, 320, 520, 220, 14);
    ctx.fill();
    ctx.fillStyle = INK;
    ctx.font = 'bold 24px Georgia, serif';
    ctx.fillText(`Tonight you earned  $${state.coins}`, CANVAS_WIDTH / 2, 366);
    ctx.font = '19px Georgia, serif';
    ctx.fillText(`Dishes served: ${state.served}      Missed: ${state.missed}`, CANVAS_WIDTH / 2, 404);
    ctx.fillText(`Best combo: x${state.bestCombo}`, CANVAS_WIDTH / 2, 434);
    ctx.fillStyle = RED;
    ctx.font = 'bold 22px Georgia, serif';
    ctx.fillText(`Rank: ${rankFor(state.coins)}`, CANVAS_WIDTH / 2, 474);
    ctx.fillStyle = GOLD;
    ctx.font = 'bold 18px Georgia, serif';
    ctx.fillText(`Best night: $${Math.max(best, state.coins)}`, CANVAS_WIDTH / 2, 508);
    ctx.fillStyle = CREAM;
    ctx.font = 'bold 24px Georgia, serif';
    if (Math.sin(state.time * 4) > -0.4) ctx.fillText('Press SPACE to cook again', CANVAS_WIDTH / 2, 600);
  }

  function drawPausedScreen() {
    ctx.fillStyle = 'rgba(16,10,32,0.6)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = CREAM;
    ctx.font = 'bold 48px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', CANVAS_WIDTH / 2, 380);
    ctx.font = '20px Georgia, serif';
    ctx.fillText('Press P or SPACE to get back to the stove', CANVAS_WIDTH / 2, 420);
  }

  return {
    addTip,
    draw(state, screen, best, dt) {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      const highlight = screen === SCREEN_PLAY ? nearestStation(state) : null;
      drawHeader(state, screen);
      drawOrderBoard(state);
      drawKitchen(state, highlight);
      drawHints();
      drawTips(dt);
      if (screen === SCREEN_TITLE) drawTitleScreen(state, best);
      else if (screen === SCREEN_PAUSED) drawPausedScreen();
      else if (screen === SCREEN_OVER) drawGameOverScreen(state, best);
    },
  };
}
