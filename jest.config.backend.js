module.exports = {
  testMatch: ["**/backend/**/*.test.ts"],
  collectCoverage: true,
  coverageDirectory: "coverage/backend",
  coverageThreshold: {
    global: {
      lines: 60,
      branches: 60,
      functions: 60,
      statements: 60,
    },
  },
};
