module.exports = {
  testMatch: ["**/frontend/**/*.test.tsx"],
  collectCoverage: true,
  coverageDirectory: "coverage/frontend",
  coverageThreshold: {
    global: {
      lines: 60,
      branches: 60,
      functions: 60,
      statements: 60,
    },
  },
};
