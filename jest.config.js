{
  "testEnvironment": "jsdom",
  "setupFilesAfterEnv": ["<rootDir>/tests/setup.ts"],
  "moduleNameMapping": {
    "^@/(.*)$": "<rootDir>/$1"
  },
  "transform": {
    "^.+\\.(ts|tsx)$": "ts-jest"
  },
  "testMatch": [
    "<rootDir>/tests/**/*.(test|spec).(ts|tsx)"
  ],
  "collectCoverageFrom": [
    "app/**/*.{ts,tsx}",
    "components/**/*.{ts,tsx}",
    "lib/**/*.{ts,tsx}",
    "!**/*.d.ts",
    "!**/node_modules/**"
  ],
  "coverageThreshold": {
    "global": {
      "branches": 70,
      "functions": 70,
      "lines": 70,
      "statements": 70
    }
  },
  "testTimeout": 10000
}
