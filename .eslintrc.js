module.exports = {
  extends: ['next/core-web-vitals'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  parserOptions: {
    // Suppress TypeScript version warnings
    warnOnUnsupportedTypeScriptVersion: false,
  },
  rules: {
    '@typescript-eslint/no-unused-vars': 'warn',
    '@typescript-eslint/no-explicit-any': 'off',
    'react-hooks/exhaustive-deps': 'warn',
  },
  overrides: [
    {
      files: ['src/**/*'],
      extends: ['eslint:recommended'],
      parser: '@typescript-eslint/parser',
      rules: {
        'no-console': 'warn',
        'prefer-const': 'error',
      },
    },
  ],
}