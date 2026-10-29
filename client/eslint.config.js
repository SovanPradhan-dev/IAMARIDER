import globals from 'globals';
import react from 'eslint-plugin-react';

const commonRules = {
  'no-undef': 'error',
  'no-unused-vars': ['warn', {
    args: 'all',
    argsIgnorePattern: '^_',
    caughtErrorsIgnorePattern: '^_',
  }],
};

export default [
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: { react },
    settings: { react: { version: 'detect' } },
    rules: {
      ...commonRules,
      'react/jsx-uses-vars': 'error',
    },
  },
];
