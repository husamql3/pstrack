export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'refactor',
        'docs',
        'style',
        'test',
        'chore',
        'prettier',
        'lint',
        'build',
        'ci',
        'db',
      ],
    ],
    'type-case': [2, 'always', 'lower-case'],
    'subject-case': [2, 'always', 'lower-case'],
    'subject-empty': [2, 'always'],
    'type-empty': [2, 'always'],
    'header-max-length': [2, 'always', 72],
  },
}
