// utils/profanityFilter.js
import { Filter } from "bad-words";

// Initialize the filter with custom configuration
const profanityFilter = new Filter({
  placeHolder: "*", // Character to replace bad words with
  emptyList: false, // Start with default list
  list: [], // Add custom words to this array
});

// Add custom words to the filter
const customWords = [
  "babi",
  "anjing",
  "njir",
  "sohai",
  "bodoh",
  "lancau",
  "pantat",
  "pariah",
  "wkwkwkwkwkwkw",
  "lol",
  "sigma",
  "gyat",
  "rizz",
  "keling",
  "kimak",
  "cibai",
  "kontol",
  "ngentod",
  "mak kau hijau",
  "pentan",
  // Add more custom words here
];
profanityFilter.addWords(...customWords);

// Remove specific words from the filter
const removeWords = [
  "hells",
  "god",
  "lol",
  "damn",
  "shit",
  "holy",
  "suck",
  "bullshit",
  "heck",
  "freaking",
  "freak",
  "freakin",
  "freakin'",
  "freakin'!",
  "freakin'!",
  "freakin'",
  "scerw",
  "lame",
  "dumb",
  "stupid",
  "idiot",
  "loser",
  "fool",
  "moron",
  "jerk",
];

profanityFilter.removeWords(...removeWords);

/**
 * Checks if text contains profanity
 * @param {string} text - The text to check
 * @returns {boolean} - True if profanity is detected
 */
export const containsProfanity = (text) => {
  return profanityFilter.isProfane(text);
};

/**
 * Cleans text by replacing profanity with placeholders
 * @param {string} text - The text to clean
 * @returns {string} - Cleaned text
 */
export const cleanText = (text) => {
  return profanityFilter.clean(text);
};
