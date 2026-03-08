module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      [
        'web',
        'admin',
        'api',
        'mobile',
        'ui',
        'types',
        'validators',
        'i18n',
        'config',
        'hooks',
        'utils',
        'infra',
        'deps',
        'ci',
      ],
    ],
  },
}
