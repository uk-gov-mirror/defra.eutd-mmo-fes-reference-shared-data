/**
 * uuid v14 is ESM-only (no CommonJS build). Jest runs in CommonJS mode, so when it tried to load uuid it threw SyntaxError: Unexpected token 'export', crashing the boomi.spec.ts test suite.

The test file already had:

When jest.mock('uuid') is called and a __mocks__/uuid.js file exists at the project root, Jest uses that CJS-compatible file instead of trying to parse the ESM package. This lets the test's .mockImplementation() calls work without needing complex Jest ESM configuration or installing additional Babel presets.
*/
const v4 = jest.fn();
const v1 = jest.fn();
const v3 = jest.fn();
const v5 = jest.fn();

module.exports = { v4, v1, v3, v5 };
