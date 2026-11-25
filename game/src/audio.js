// Every sound is synthesized in code with WebAudio — no audio files, no network.
// The kitchen stays silent until the first key or click, when the browser allows sound.
export function createSoundboard() {
  let context = null;
  let muted = false;

  function ensureContext() {
    if (!context) {
      try {
        const AudioContext = window.AudioContext ?? window.webkitAudioContext;
        context = new AudioContext();
      } catch {
        context = null;
      }
    }
    if (context && context.state === 'suspended') context.resume();
    return context;
  }

  function tone(frequency, duration, type, gainValue, slideTo) {
    const audio = ensureContext();
    if (!audio || muted) return;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audio.currentTime);
    if (slideTo) oscillator.frequency.exponentialRampToValueAtTime(slideTo, audio.currentTime + duration);
    gain.gain.setValueAtTime(gainValue, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start();
    oscillator.stop(audio.currentTime + duration);
  }

  function noiseBurst(duration, gainValue, lowPass) {
    const audio = ensureContext();
    if (!audio || muted) return;
    const length = Math.max(1, Math.floor(audio.sampleRate * duration));
    const buffer = audio.createBuffer(1, length, audio.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < length; index += 1) data[index] = (Math.random() * 2 - 1) * (1 - index / length);
    const source = audio.createBufferSource();
    source.buffer = buffer;
    const filter = audio.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = lowPass;
    const gain = audio.createGain();
    gain.gain.value = gainValue;
    source.connect(filter).connect(gain).connect(audio.destination);
    source.start();
  }

  return {
    /** Call from any key or click so the browser unlocks audio. */
    unlock() {
      ensureContext();
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    isMuted() {
      return muted;
    },
    pickup() {
      tone(520, 0.08, 'sine', 0.12, 700);
    },
    chop() {
      noiseBurst(0.07, 0.25, 1800);
      tone(180, 0.06, 'triangle', 0.15, 120);
    },
    chopDone() {
      tone(660, 0.09, 'sine', 0.14);
      tone(880, 0.12, 'sine', 0.14);
    },
    bubble() {
      tone(220 + Math.random() * 120, 0.1, 'sine', 0.05, 320);
    },
    sizzle() {
      noiseBurst(0.25, 0.1, 3200);
    },
    plated() {
      tone(740, 0.1, 'triangle', 0.14);
      tone(988, 0.14, 'triangle', 0.14);
    },
    served() {
      tone(880, 0.1, 'sine', 0.16);
      tone(1174, 0.12, 'sine', 0.16);
      tone(1568, 0.2, 'sine', 0.16);
    },
    coin() {
      tone(1320, 0.09, 'square', 0.06);
      tone(1760, 0.16, 'square', 0.06);
    },
    error() {
      tone(160, 0.18, 'sawtooth', 0.12, 110);
    },
    expired() {
      tone(392, 0.15, 'triangle', 0.14, 330);
      tone(311, 0.25, 'triangle', 0.14, 262);
    },
    rush() {
      tone(523, 0.1, 'square', 0.1);
      tone(659, 0.1, 'square', 0.1);
      tone(784, 0.18, 'square', 0.1);
    },
    gameOver() {
      tone(523, 0.2, 'triangle', 0.14, 392);
      tone(392, 0.2, 'triangle', 0.14, 330);
      tone(330, 0.35, 'triangle', 0.14, 262);
    },
  };
}
