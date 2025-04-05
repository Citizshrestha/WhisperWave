/** @type {import ('tailwindcss').Config} */

module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "teal-custom": "#01aa85", // Button background
        "teal-dark": "#008970", // Hover state for button
        "teal-light": "#01aa851d", // Input background (with opacity)
        "teal-text": "#004939f3", // Input text
        "teal-placeholder": "#004939858", // Placeholder text (with opacity)
      },
    },
  },
  plugins: [],
};