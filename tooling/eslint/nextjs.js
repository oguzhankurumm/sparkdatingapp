import { baseConfig } from './base.js'

/** @type {import("eslint").Linter.Config[]} */
export const nextjsConfig = [
  ...baseConfig,
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      // Next.js specific rules
      'react/react-in-jsx-scope': 'off',
    },
  },
]
