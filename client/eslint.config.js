import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import react from 'eslint-plugin-react';
import globals from 'globals';

export default [
  {
    ignores: ['dist/**', 'node_modules/**', 'vite.config.js'],
  },
  js.configs.recommended,
  {
    files: ['src/**/*.{js,jsx}'],
    plugins: {
      'react-hooks': reactHooks,
      react,
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.es2021,
        ...globals.node,
        React: 'readonly',
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'no-undef': 'error',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
      'react/jsx-uses-vars': 'error',
      'react/jsx-uses-react': 'error',
    },
  },
];
