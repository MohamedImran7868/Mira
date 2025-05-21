// utils/profanityFilter.js
import { Filter } from "bad-words";

// Initialize the filter with custom configuration
const profanityFilter = new Filter({
  placeHolder: "*", // Character to replace bad words with
  emptyList: false, // Start with default list
  list: [], // Add custom words to this array
});

// Add custom words specific to your application
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
  "kelantan",
  "keling",
  "kimak",
  "cibai",
  "kontol",
  "ngentod",
  // Add more custom words here
];

// Add the custom words to the filter
profanityFilter.addWords(...customWords);

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

/**
 * Adds custom words to the filter
 * @param {string[]} words - Array of words to add
 */
export const addCustomWords = (words) => {
  profanityFilter.addWords(...words);
};
