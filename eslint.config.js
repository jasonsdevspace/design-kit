import { base, tests, typed } from '@jasonsdevspace/config/eslint';
import { defineConfig } from 'eslint/config';

/*
 * The house's presets from @jasonsdevspace/config, which every project repository takes, and after
 * them the rules that name this repository's own folders.
 */
export default defineConfig(
    ...base({
        ignores: [
            // Compiled in the oldest Node check's empty project, against the installed package.
            // Its imports resolve to the package's build, which does not exist yet when the
            // checks that lint it run.
            'packages/design-kit/smoke/types.ts',
        ],
    }),
    {
        // The markup components draw markup alone, as record 20 has it, so they render the same on
        // a server and by hand. They live in the modules react.tsx gathers beside hooks.tsx, and
        // import no effect from React, while the hooks that attach the controls live in the modules
        // hooks.tsx gathers. Every module of the package that is not a hook's is held to it, so a
        // new component module is covered as it is written.
        files: ['packages/design-kit/src/*.tsx'],
        ignores: [
            'packages/design-kit/src/*-hook.tsx',
            'packages/design-kit/src/*-hooks.tsx',
            'packages/design-kit/src/after-commit.tsx',
            'packages/design-kit/src/hook-ref.tsx',
            'packages/design-kit/src/hooks.tsx',
            'packages/design-kit/src/*.test.tsx',
            'packages/design-kit/src/*.testing.tsx',
        ],
        rules: {
            'no-restricted-imports': [
                'error',
                {
                    paths: [
                        {
                            name: 'react',
                            importNames: ['useEffect', 'useLayoutEffect', 'useInsertionEffect'],
                            message:
                                'A markup component runs no effect. Put a hook in a module hooks.tsx gathers.',
                        },
                    ],
                },
            ],
        },
    },
    ...typed({ tsconfigRootDir: import.meta.dirname }),
    ...tests()
);
