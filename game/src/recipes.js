// The stall's menu: every ingredient, where it is prepped, and every dish on the board.
// A dish is always cooked noodles plus a set of toppings; the same toppings combine into
// different dishes, so the cook plans one route and plates several tickets from it.
export const INGREDIENTS = {
  noodles: { id: 'noodles', name: 'Noodles', prep: 'pot', prepTime: 4, price: 0, color: '#f2c94c' },
  egg: { id: 'egg', name: 'Egg', prep: 'pot', prepTime: 3, price: 0, color: '#fff3d6' },
  veg: { id: 'veg', name: 'Greens', prep: 'board', prepTime: 0, price: 0, color: '#6fbf4a' },
  chicken: { id: 'chicken', name: 'Chicken', prep: 'grill', prepTime: 5, price: 0, color: '#e07840' },
  chili: { id: 'chili', name: 'Chili', prep: 'instant', prepTime: 0, price: 0, color: '#d9392b' },
};

// Carried items are raw or prepped versions of an ingredient: 'noodles' in hand is dry,
// 'cooked-noodles' is ready to plate; 'veg' becomes 'chopped-veg' at the board.
export const PREPPED_NAME = {
  noodles: 'cooked-noodles',
  egg: 'boiled-egg',
  veg: 'chopped-veg',
  chicken: 'grilled-chicken',
  chili: 'chili',
};

export const CARRIED_LABEL = {
  noodles: 'Dry Noodles',
  'cooked-noodles': 'Cooked Noodles',
  egg: 'Egg',
  'boiled-egg': 'Boiled Egg',
  veg: 'Greens',
  'chopped-veg': 'Chopped Greens',
  chicken: 'Raw Chicken',
  'grilled-chicken': 'Grilled Chicken',
  chili: 'Chili Sauce',
};

export const DISHES = [
  {
    id: 'plain',
    name: 'Plain Noodle Soup',
    needs: ['cooked-noodles'],
    price: 6,
    weight: 3,
    blurb: 'Just noodles, done right.',
  },
  {
    id: 'egg-noodle',
    name: 'Egg Noodle',
    needs: ['cooked-noodles', 'boiled-egg'],
    price: 9,
    weight: 3,
    blurb: 'A soft egg on hot noodles.',
  },
  {
    id: 'garden',
    name: 'Garden Noodle',
    needs: ['cooked-noodles', 'chopped-veg'],
    price: 10,
    weight: 3,
    blurb: 'Crisp greens, quick chop.',
  },
  {
    id: 'chicken-ramen',
    name: 'Chicken Ramen',
    needs: ['cooked-noodles', 'grilled-chicken', 'chopped-veg'],
    price: 14,
    weight: 3,
    blurb: 'Char-grilled, garden fresh.',
  },
  {
    id: 'firecracker',
    name: 'Firecracker Ramen',
    needs: ['cooked-noodles', 'grilled-chicken', 'boiled-egg', 'chili'],
    price: 18,
    weight: 2,
    blurb: 'Hot, rich and worth the rush.',
  },
];

/** The dishes a ticket may ask for: early on the simple ones, the full menu once the rush starts. */
export function menuFor(elapsedSeconds) {
  if (elapsedSeconds < 45) return DISHES.slice(0, 3);
  if (elapsedSeconds < 90) return DISHES.slice(0, 4);
  return DISHES;
}

/** True when the bowl's contents are exactly the dish's needs, in any order. */
export function bowlMatchesDish(bowl, dish) {
  if (bowl.length !== dish.needs.length) return false;
  const sortedBowl = [...bowl].sort();
  const sortedNeeds = [...dish.needs].sort();
  return sortedBowl.every((item, index) => item === sortedNeeds[index]);
}

/** The dish a bowl matches, or null while it is still mid-assembly. */
export function dishForBowl(bowl) {
  for (const dish of DISHES) {
    if (bowlMatchesDish(bowl, dish)) return dish;
  }
  return null;
}
