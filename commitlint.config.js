/** @type {import('@commitlint/types').UserConfig} */
module.exports = {
    extends: ['@commitlint/config-conventional'],
    rules: {
        'type-enum': [
            2,
            'always',
            [
                'feat',     // new feature
                'fix',      // bug fix
                'docs',     // documentation only
                'style',    // formatting, no logic change
                'refactor', // code change that neither fixes bug nor adds feature
                'test',     // adding or updating tests
                'chore',    // maintenance (deps, build scripts, etc.)
                'perf',     // performance improvement
                'ci',       // CI/CD changes
                'revert',   // reverts a previous commit
            ],
        ],
        'scope-enum': [
            1, // warning (not error), scopes are optional
            'always',
            [
                'patients',
                'practitioners',
                'organizations',
                'encounters',
                'conditions',
                'observations',
                'medications',
                'allergies',
                'documents',
                'consents',
                'audit',
                'auth',
                'fhir',
                'schema',
                'api',
                'web',
                'mobile',
                'shared',
                'infra',
                'deps',
            ],
        ],
        'subject-case': [2, 'never', ['start-case', 'pascal-case', 'upper-case']],
        'subject-max-length': [2, 'always', 72],
        'body-max-line-length': [2, 'always', 100],
    },
};
