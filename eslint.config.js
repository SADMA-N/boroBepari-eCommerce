//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'

export default [
  {
    ignores: [
      '.output/**',
      '.vinxi/**',
      'dist/**',
      'build/**',
      'eslint.config.js',
      'prettier.config.js',
      'tailwind.config.js',
    ],
  },
  ...tanstackConfig,
]
