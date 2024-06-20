module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true,
    jest: true,
  },
  ignorePatterns: ["*.spec.js"],
  extends: ["airbnb", "plugin:prettier/recommended"],
  parser: "@babel/eslint-parser",
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: "module",
    ecmaFeatures: {
      legacyDecorators: true,
    },
    babelOptions: {
      configFile: "./.babelrc",
    },
  },
  plugins: ["prettier"],
  rules: {
    semi: "warn",
    "no-underscore-dangle": 0,
    "func-names": "off",
    "no-unused-vars": "warn",
    "no-param-reassign": 0,
    "import/prefer-default-export": "off",
    "class-methods-use-this": "off",
    "no-useless-escape": 0,
  },
};
