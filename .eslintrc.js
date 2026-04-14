module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
  },
  plugins: ['@typescript-eslint', 'react-hooks'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'prefer-const': 'error',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    // Reanimated SharedValues use .value assignment — not a React Compiler violation
    'react-hooks/immutability': 'off',
    // React Compiler rules — not used in this project
    'react-hooks/set-state-in-effect': 'off',
    'react-hooks/refs': 'off',
    'react-hooks/incompatible-library': 'off',
  },
  overrides: [
    {
      files: ['src/__tests__/**/*.{ts,tsx,js}'],
      rules: {
        '@typescript-eslint/no-require-imports': 'off',
        'no-empty': 'off',
      },
    },
  ],
  ignorePatterns: ['node_modules/', 'ios/', 'android/', '.expo/', 'dist/'],
};
