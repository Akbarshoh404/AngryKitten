import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import globals from 'globals';
import { defineConfig } from 'eslint/config';

export default defineConfig(
  { ignores: ['dist/', '.astro/', '.wrangler/', 'node_modules/', 'public/'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
  ...astro.configs['jsx-a11y-strict'],
  {
    // eslint-plugin-astro's jsx-a11y config already registers the plugin; reuse its rules for islands.
    files: ['**/*.{tsx,jsx}'],
    languageOptions: jsxA11y.flatConfigs.strict.languageOptions,
    rules: jsxA11y.flatConfigs.strict.rules,
  },
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
);
