const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./",
});

const customJestConfig = {
  testEnvironment: "jsdom",
  collectCoverage: true,
  collectCoverageFrom: [
    "src/application/**/*.{ts,tsx}",
    "src/domain/**/*.{ts,tsx}",
    "src/lib/**/*.{ts,tsx}",
  ],
  coverageThreshold: {
    global: {
      lines: 60,
      branches: 60,
      functions: 60,
      statements: 60,
    },
  },
};

module.exports = createJestConfig(customJestConfig);
