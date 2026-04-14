// This file runs BEFORE the Jest test framework is installed.
// It must be CommonJS (no TypeScript).

// Stub Expo's winter runtime globals so the lazy getter in installGlobal.ts
// never fires and tries to require() outside jest scope.
global.__ExpoImportMetaRegistry = { url: null };

// Node 17+ has structuredClone natively, but if jest-expo's preset tries to polyfill it
// before the module system is ready, it throws "import outside scope".
// Provide a simple fallback so the lazy getter is never triggered.
if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));
}

// Enable Immer's MapSet plugin so Zustand stores that use Set/Map work in tests.
const { enableMapSet } = require('immer');
enableMapSet();
