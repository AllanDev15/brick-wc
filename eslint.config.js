import eslintJs from '@eslint/js';
import globals from 'globals';
import owcPlugin from 'eslint-plugin-wc';
import litPlugin from 'eslint-plugin-lit';
import litA11yPlugin from 'eslint-plugin-lit-a11y';
import jsdocPlugin from 'eslint-plugin-jsdoc';

export default [
  eslintJs.configs.recommended,
  jsdocPlugin.configs['flat/recommended'],
  {
    files: ['**/*.js', '*.mjs'],
    ignores: ['build/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node
      },
      parserOptions: {
        ecmaVersion: 2024,
        sourceType: 'module'
      }
    },
    plugins: {
      litPlugin,
      litA11yPlugin,
      owcPlugin,
      jsdocPlugin
    },
    rules: {
      semi: ['error', 'always'],
      'jsdoc/check-alignment': ['error'],
      'jsdoc/check-line-alignment': ['off'],
      'jsdoc/require-jsdoc': [
        'warn',
        {
          enableFixer: false,
          checkConstructors: false,
          contexts: ['MethodDefinition:not([key.name="render"])']
        }
      ],
      'jsdoc/require-hyphen-before-param-description': ['warn', 'always'],
      'jsdoc/require-returns-description': ['off'],
      'jsdoc/require-param-description': ['off']
    }
  },
  {
    ignores: ['build/**/*.js', './eslint.config.js']
  }
];
