// src/polyfills.js
if (typeof window !== "undefined" && typeof global === "undefined") {
  // create a browser-safe alias for packages that expect `global`
  window.global = window;
}
