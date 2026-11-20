/** @type {import('jest').Config} */
const config = {
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".ts"],
  // Source files import siblings as "./x.js" (NodeNext style); map those back to the .ts sources.
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  transform: {
    "^.+\\.ts$": ["ts-jest", { useESM: true, tsconfig: "tsconfig.json" }],
  },
  testMatch: ["**/src/tests/**/*.test.ts"],
  collectCoverageFrom: ["src/**/*.ts", "!src/tests/**", "!src/index.ts", "!src/demo.ts"],
  // Every rule and defensive branch in the gateway must be exercised by a test.
  coverageThreshold: {
    global: { branches: 100, functions: 100, lines: 100, statements: 100 },
  },
};

export default config;
