// ===============================================
// 🔧 .eslintrc.js MÍNIMO (SEM TYPESCRIPT-ESLINT)
// ===============================================

// filepath: c:\Users\cripp\projetos-andamento\angular_buzz_developer\functions\.eslintrc.js

module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended"
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: "module",
  },
  ignorePatterns: [
    "/lib/**/*",
    "/generated/**/*",
    "**/*.js",
  ],
  rules: {
    "quotes": ["error", "double"],
    "no-unused-vars": "off",
    "no-undef": "off",
    "require-jsdoc": "off",
    "valid-jsdoc": "off"
  },
};
