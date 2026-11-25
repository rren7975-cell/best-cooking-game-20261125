// A tiny seeded random source (mulberry32), so a ?seed=N game always deals the same
// tickets and the screenshot scenes are reproducible frame for frame.
export function createRandom(seed) {
  let state = seed >>> 0;
  return {
    next() {
      state = (state + 0x6d2b79f5) >>> 0;
      let value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    },
    /** An integer from 0 up to (but not including) max. */
    int(max) {
      return Math.floor(this.next() * max);
    },
    /** One element of an array, picked uniformly. */
    pick(array) {
      return array[this.int(array.length)];
    },
  };
}
