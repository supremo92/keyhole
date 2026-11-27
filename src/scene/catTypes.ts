// The Institute's cat. It belongs to nobody and goes wherever it likes.
//   sleep: curled up asleep.  stare: sitting very still, staring at the keyhole.
//   knock: sitting by something, swatting at it while maintaining eye contact.
export type CatMood = "sleep" | "stare" | "knock";

export type CatCoat = { fur: string; dark: string; eyes: string };

// Ginger, like the photo on the notice board (Employee of the Month, every month).
export const THE_CAT: CatCoat = { fur: "#d9822b", dark: "#a85a17", eyes: "#9be05a" };
