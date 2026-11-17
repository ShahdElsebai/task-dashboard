// @ts-check
import eslint from '@eslint/js';
import angular from 'angular-eslint';
import { defineConfig } from 'eslint/config';
import eslintConfigPrettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

export default defineConfig([
  // ── TypeScript files ──────────────────────────────────────────────────────
  {
    files: ['**/*.ts'],
    ignores: ['**/*.spec.ts', '**/*.test.ts', '**/*.test-helpers.ts', '**/*.spec.js', '**/*.test.js'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended,
      eslintConfigPrettier,
    ],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.app.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'app',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'app',
          style: 'kebab-case',
        },
      ],

      // Class naming
      '@angular-eslint/component-class-suffix': 'error',
      '@angular-eslint/directive-class-suffix': 'error',

      // Change detection (now in recommended, but explicit for clarity)

      // Angular 22 @Service decorator
      '@angular-eslint/prefer-service-decorator': 'warn',

      // Modern API organization
      '@angular-eslint/inject-at-top': 'error',

      // Signals & modern APIs
      '@angular-eslint/prefer-signals': 'error',
      '@angular-eslint/no-uncalled-signals': 'error',
      '@angular-eslint/computed-must-return': 'error',
      '@angular-eslint/prefer-signal-model': 'error',
      '@angular-eslint/prefer-output-emitter-ref': 'error',
      '@angular-eslint/prefer-output-readonly': 'error',

      // Host metadata (no @HostBinding / @HostListener)
      '@angular-eslint/prefer-host-metadata-property': 'error',

      // Lifecycle
      '@angular-eslint/no-async-lifecycle-method': 'error',
      '@angular-eslint/no-empty-lifecycle-method': 'error',
      'no-empty': ['error', { allowEmptyCatch: true }],
      '@angular-eslint/no-lifecycle-call': 'error',
      '@angular-eslint/use-lifecycle-interface': 'error',

      // Injectable
      '@angular-eslint/use-injectable-provided-in': 'error',

      // Code quality
      '@angular-eslint/contextual-decorator': 'error',
      '@angular-eslint/no-duplicates-in-metadata-arrays': 'error',
      '@angular-eslint/no-forward-ref': 'warn',
      '@angular-eslint/no-implicit-take-until-destroyed': 'error',
      '@angular-eslint/no-queries-metadata-property': 'error',
      '@angular-eslint/relative-url-prefix': 'error',
      '@angular-eslint/use-component-selector': 'error',

      // TypeScript
      '@typescript-eslint/no-inferrable-types': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/typedef': [
        'error',
        {
          arrayDestructuring: true,
          arrowParameter: true,
          memberVariableDeclaration: true,
          objectDestructuring: true,
          parameter: true,
          propertyDeclaration: true,
          variableDeclaration: true,
          variableDeclarationIgnoreFunction: false,
        },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],

      // TypeScript 8 new rules
      '@typescript-eslint/no-unsafe-enum-assignment': 'error',
      '@typescript-eslint/no-misused-spread': 'error',
      '@typescript-eslint/no-unsafe-type-assertion': 'warn',

      // Core JS
      'prefer-const': 'error',
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },

  // ── HTML templates ────────────────────────────────────────────────────────
  {
    files: ['**/*.html'],
    extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility, eslintConfigPrettier],
    rules: {
      // NgOptimizedImage
      '@angular-eslint/template/prefer-ngsrc': 'warn',

      // Native control flow
      '@angular-eslint/template/prefer-control-flow': 'warn',
      '@angular-eslint/template/prefer-at-else': 'warn',
      '@angular-eslint/template/prefer-at-empty': 'warn',

      // No ngClass / ngStyle
      '@angular-eslint/template/prefer-class-binding': 'error',
      '@angular-eslint/template/prefer-style-binding': 'error',
      '@angular-eslint/template/no-inline-styles': 'error',
      '@angular-eslint/template/no-outerhtml': 'error',
      '@angular-eslint/template/require-switch-default': 'error',

      // Accessibility
      '@angular-eslint/template/button-has-type': 'error',
      '@angular-eslint/template/no-positive-tabindex': 'error',

      // Code quality
      '@angular-eslint/template/no-any': 'error',
      '@angular-eslint/template/no-call-expression': 'off',
      '@angular-eslint/template/no-duplicate-attributes': 'error',
      '@angular-eslint/template/no-empty-control-flow': 'error',
      '@angular-eslint/template/no-interpolation-in-attributes': 'error',
      '@angular-eslint/template/no-non-null-assertion': 'warn',
      '@angular-eslint/template/use-track-by-function': 'error',
      '@angular-eslint/template/prefer-contextual-for-variables': 'warn',
      '@angular-eslint/template/prefer-self-closing-tags': 'warn',
      '@angular-eslint/template/attributes-order': 'warn',
    },
  },
]);
