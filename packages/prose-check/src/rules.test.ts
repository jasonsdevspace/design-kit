// @vitest-environment node
import { proseProblems } from '@jasonsdevspace/prose-check';
import { describe, expect, it } from 'vitest';

const DASH = String.fromCodePoint(0x2014);
const rules = (path: string, source: string): string[] =>
    proseProblems(path, source).map((problem) => problem.split('\n')[0] ?? '');

describe('the prose check', () => {
    const RULES: readonly (readonly [string, readonly string[], readonly string[]])[] = [
        [
            'trailing -ing clause',
            [
                'The cache sits in front of the API, ensuring reads stay fast.',
                'Each step logs its time, highlighting the slow one.',
            ],
            [
                'Ensuring a fresh read costs one query.',
                'It mends the row only, leaving a stepper short.',
            ],
        ],
        [
            'inflated word',
            [
                'A seamless way to leverage the cache.',
                'This plays a crucial part and is a testament to the design.',
            ],
            [
                'Run the test harness on a highlighted row.',
                'A dynamic import loads the robust parser.',
            ],
        ],
        [
            'empty opener',
            [
                'Additionally, the check reads workflows.',
                "It's worth noting that the pin is exact.",
            ],
            ['The additional rows load on scroll.', 'Notable changes are listed in the changelog.'],
        ],
        [
            'leftover placeholder',
            ['Hi [Name], thanks for the review.', 'Released on 2026-XX-XX.'],
            ['See the [link](https://example.com).', 'The table reads env[name] for each key.'],
        ],
        [
            'en dash as a dash',
            ['The build passes – the deploy waits.', 'It reads comments – not code.'],
            ['Teams of 4–6 engineers.', 'Pages 10–12 hold the tables.'],
        ],
        [
            'wordy phrase',
            [
                'The page reads twice in order to warm the cache.',
                'In order to ship, the tag must match.',
            ],
            ['Rows come back in the order they went in.', 'A refusal is an order to stop.'],
        ],
        [
            'canned closer',
            ['I hope this helps.', 'Overall, the budget holds.'],
            ['The overall width is 320 pixels.', 'A summary row closes the table.'],
        ],
        [
            'intensifier',
            ['An extremely small bundle.', 'Incredibly fast on a phone.'],
            ['A truly empty list.', 'Deeply nested fields stop at six.'],
        ],
        ['emoji', ['Ships today \u{1F680}', 'Done ✅'], ['Tests pass ✓', '© 2026 and → next']],
    ];

    for (const [rule, caught, passed] of RULES) {
        it(`names a line as ${rule}, and passes the lines that only look like one`, () => {
            for (const line of caught)
                expect(rules('a.md', `${line}\n`), line).toEqual([`a.md:1  ${rule}`]);
            for (const line of passed) expect(rules('a.md', `${line}\n`), line).toEqual([]);
        });
    }

    it("leaves a page's code samples alone, and still reads the words around them", () => {
        const page = [
            '<pre aria-label="The snippet a store adds"><code>import { a } from \'b\';',
            '    a({ c: 1 });</code></pre>',
            '<p>Then <code>run();</code> it; once.</p>',
        ].join('\n');
        expect(rules('index.html', page)).toEqual(['index.html:3  semicolon in prose']);
        expect(rules('label.html', '<pre aria-label="One; two"><code>x</code></pre>\n')).toEqual([
            'label.html:1  semicolon in prose',
        ]);
    });

    it('reads a numeric character reference as a character, never as a semicolon', () => {
        expect(rules('a.md', 'Made by Jason &#169; 2026 and &#x2192; next.\n')).toEqual([]);
        expect(rules('a.html', '<p>Made by Jason &#169; 2026 and &#x2192; next.</p>\n')).toEqual(
            []
        );
        expect(rules('a.md', 'Made in 2026; then sold.\n')).toEqual(['a.md:1  semicolon in prose']);
    });

    it('leaves code quoted in a comment alone, and an example in its doc comment', () => {
        expect(rules('a.ts', '// Call `total(rows); render()` once.\n')).toEqual([]);
        expect(rules('a.ts', '// const total = sum(rows);\n')).toEqual([]);
        expect(
            rules(
                'a.ts',
                '/**\n * Sums the rows.\n *\n * @example\n * const total = sum(rows);\n * render(total);\n *\n * @param rows the rows\n */\n'
            )
        ).toEqual([]);
        expect(rules('a.ts', '// It saves (once); then it closes.\n')).toEqual([
            'a.ts:1  semicolon in prose',
        ]);
        expect(rules('a.ts', '// Fixed in version 12; see the notes.\n')).toEqual([
            'a.ts:1  semicolon in prose',
        ]);
    });

    it('reads a doc comment parameter in brackets and a Markdown reference as what they are, not placeholders', () => {
        expect(
            rules(
                'a.mjs',
                '/**\n * @param {string} [name] the label\n * @property {string} [link] where it goes\n */\n'
            )
        ).toEqual([]);
        expect(rules('a.md', 'See the [link] for more.\n\n[link]: https://example.com\n')).toEqual(
            []
        );
        expect(rules('a.md', 'Read [name] before it goes out.\n')).toEqual([
            'a.md:1  leftover placeholder',
        ]);
    });

    it('reads a stock phrase only where it opens a sentence with a comma', () => {
        expect(rules('a.md', 'The error message has to be clear.\n')).toEqual([]);
        expect(rules('a.md', 'Fill the form in summary view.\n')).toEqual([]);
        expect(rules('a.md', 'In summary, the budget holds.\n')).toEqual(['a.md:1  canned closer']);
        expect(rules('a.md', 'It holds. To be clear, nothing moved.\n')).toEqual([
            'a.md:1  empty opener',
        ]);
    });

    it('reads the rest of a page past a code element left open or one named in a comment', () => {
        expect(rules('a.html', '<p><code>x</p>\n<p>The colour</p>\n')).toEqual([
            'a.html:2  British spelling',
        ]);
        expect(rules('b.html', '<!-- a <code> sample -->\n<p>The colour</p>\n')).toEqual([
            'b.html:2  British spelling',
        ]);
        expect(rules('c.html', '<p title="use <code>">x</p>\n<p>The colour</p>\n')).toEqual([
            'c.html:2  British spelling',
        ]);
    });

    it('reads the comments in a .jsx file', () => {
        expect(rules('a.jsx', 'const a = 1;\n// One clause; then another.\n')).toEqual([
            'a.jsx:2  semicolon in prose',
        ]);
    });

    it('finds a semicolon after a digit, a closing bracket or a quote, and leaves the code alone', () => {
        for (const line of [
            'Fixed in version 12; see the notes.',
            'It reads the list (once); then it stops.',
            'Each key [as named]; then the value.',
            "It says 'done'; then it closes.",
        ])
            expect(rules('a.md', `${line}\n`), line).toEqual(['a.md:1  semicolon in prose']);
        expect(rules('a.ts', 'const a = f(1); const b = [2]; g("x");\n// Plain prose.\n')).toEqual(
            []
        );
        expect(rules('a.md', 'Run `a(); b()` to see it.\n')).toEqual([]);
    });

    it('reads comments in code and leaves the code alone', () => {
        expect(rules('a.ts', 'const a = 1;\n// One clause; then another.\n')).toEqual([
            'a.ts:2  semicolon in prose',
        ]);
        expect(rules('a.tsx', '{/* The colour of the facets */}\n<p>x;y</p>\n')).toEqual([
            'a.tsx:1  British spelling',
        ]);
    });

    it('refuses grey and its forms in any case, but leaves a name such as Earl Grey Tea alone', () => {
        expect(rules('a.md', 'A fast save never flashes it grey.\n')).toEqual([
            'a.md:1  British spelling',
        ]);
        expect(rules('a.md', 'The button is greyed out.\n')).toEqual(['a.md:1  British spelling']);
        expect(rules('a.md', 'Grey is used for a button that is off.\n')).toEqual([
            'a.md:1  British spelling',
        ]);
        expect(
            rules('a.md', 'A cup of Earl Grey Tea beside a Greyhound and a greyhound.\n')
        ).toEqual([]);
        expect(rules('a.md', 'A fast save never flashes it gray.\n')).toEqual([]);
    });

    it('stops a comment where it closes, so the code after it is left alone', () => {
        expect(rules('a.mjs', '/** @type {string} */ const a = b;\n/* one; two */ x();\n')).toEqual(
            ['a.mjs:2  semicolon in prose']
        );
    });

    it('reads every rule it lists', () => {
        expect(
            rules(
                'a.mjs',
                `// A pause ${DASH} then more.\n// TODO later\n// See issue #12\n// It was cancelled\n`
            )
        ).toEqual([
            'a.mjs:1  em dash',
            'a.mjs:2  process artifact',
            'a.mjs:3  issue reference',
            'a.mjs:4  British spelling',
        ]);
    });

    it('reads Markdown body text but not its code', () => {
        expect(
            rules('a.md', 'Fine prose.\n```sh\necho a; echo b\n```\nUse `a; b` here.\nOne; two.\n')
        ).toEqual(['a.md:6  semicolon in prose']);
        expect(rules('a.md', 'Fixed in issue #12.\n')).toEqual([]);
    });

    it('reads a page, its text and its comments, and not its scripts or styles', () => {
        const page =
            '<!-- one clause; another -->\n<style>a { b: c; }</style>\n<script>a(); b();</script>\n<p>The colour</p>\n';
        expect(rules('index.html', page)).toEqual([
            'index.html:1  semicolon in prose',
            'index.html:4  British spelling',
        ]);
        expect(rules('ends.html', '<!-- one; two --!>\n<p>The colour</p>\n')).toEqual([
            'ends.html:1  semicolon in prose',
            'ends.html:2  British spelling',
        ]);
        expect(rules('end.html', '<p>ok</p>\n<script src="x.js">\nconst a = b;\n')).toEqual([]);
    });

    it('reads a semicolon after a link, and the words a visitor reads in attributes', () => {
        const page = [
            '<p>See <a href="/x">the docs</a>; then go.</p>',
            '<img alt="The colour wheel" src="a.png">',
            '<meta name="description" content="One clause; another">',
            '<meta http-equiv="Content-Type" content="text/html; charset=utf-8">',
        ].join('\n');
        expect(rules('index.html', page)).toEqual([
            'index.html:1  semicolon in prose',
            'index.html:2  British spelling',
            'index.html:3  semicolon in prose',
        ]);
    });

    it('takes a hash as a comment only where it starts one', () => {
        expect(rules('a.tsx', 'class A {\n    #timer;\n}\n')).toEqual([]);
        expect(rules('a.sh', '# one; two\n')).toEqual(['a.sh:1  semicolon in prose']);
    });

    it('reads workflow and Dockerfile comments, and skips what it does not scan', () => {
        expect(rules('ci.yml', '# Build; then test\nrun: a; b\n')).toEqual([
            'ci.yml:1  semicolon in prose',
        ]);
        expect(rules('docker/Dockerfile', '# Whilst building\nRUN a; b\n')).toEqual([
            'docker/Dockerfile:1  British spelling',
        ]);
        expect(rules('logo.svg', '<!-- one; two -->')).toEqual([]);
    });
});

describe('the words the prose check refuses', () => {
    it.each([
        'TODO',
        'FIXME',
        'XXX',
        'HACK',
        'TBD',
        'coming soon',
        'not implemented',
        'waiting on',
        'to be decided',
        'to be determined',
        'for now leave',
        'for now, leave',
        'for now skip',
    ])('refuses the process artifact %j in a comment', (words) => {
        expect(rules('a.ts', `// The search, ${words} the rest\n`)).toEqual([
            'a.ts:1  process artifact',
        ]);
    });

    it.each(['waiting once', 'waiting one', 'waiting only', 'awaiting one'])(
        'passes %j, which only starts like a process artifact',
        (words) => {
            expect(rules('a.ts', `// The page reloads after ${words} turn\n`)).toEqual([]);
        }
    );

    it.each(['Waiting on the release', 'Awaiting on the release'])(
        'refuses %j, the phrase on its own',
        (words) => {
            expect(rules('a.ts', `// ${words}\n`)).toEqual(['a.ts:1  process artifact']);
        }
    );

    it.each(['for now leaves', 'for now skips', 'not implementedly'])(
        'passes %j, which only starts like a process artifact',
        (words) => {
            expect(rules('a.ts', `// The tide ${words} the rocks bare\n`)).toEqual([]);
        }
    );

    it.each([
        'For now, skipping the check',
        'for now, leaving it',
        'for now skipped',
        'for now left',
    ])('refuses %j, a phrase that takes an ending', (words) => {
        expect(rules('a.ts', `// ${words}\n`)).toEqual(['a.ts:1  process artifact']);
    });

    it.each([
        'issue 12',
        'issue #12',
        'issue#12',
        'issues 12',
        'ticket 12',
        'tickets 12',
        'PR 12',
        'PRs 12',
        'pull request 12',
        'pull requests 12',
        'the fix (#12)',
        'GH-12',
    ])('refuses the issue form %j in a comment', (words) => {
        expect(rules('a.ts', `// As in ${words} here\n`)).toEqual(['a.ts:1  issue reference']);
    });

    it.each([
        ...[
            ...['serialis', 'initialis', 'recognis', 'unrecognis', 'organis', 'prioritis'],
            ...['optimis', 'normalis', 'parameteris', 'authoris', 'utilis', 'minimis'],
            ...['summaris', 'customis', 'standardis', 'synchronis', 'categoris'],
        ].map((stem) => `${stem}e`),
        ...['es', 'ed', 'ing', 'ation', 'ations', 'able', 'er', 'ers'].map(
            (end) => `organis${end}`
        ),
        ...['behaviour', 'favour', 'colour', 'honour', 'labour', 'neighbour'],
        ...['s', 'ed', 'ing', 'ite', 'ites', 'al', 'ally'].map((end) => `behaviour${end}`),
        ...['catalogue', 'catalogues', 'analyse', 'analysed', 'analysing', 'centre', 'centres'],
        ...['licence', 'defence', 'whilst', 'amongst'],
        ...['cancelled', 'modelled', 'travelled', 'labelled', 'labelling'],
    ])('refuses the British spelling %j in a comment', (word) => {
        expect(rules('a.ts', `// The ${word} here\n`)).toEqual(['a.ts:1  British spelling']);
    });

    it('passes the American forms and the words that only end like a British one', () => {
        expect(
            rules('a.ts', '// A promise, otherwise precise, to serialize the canceled behavior\n')
        ).toEqual([]);
    });
});

describe('what the prose check reads', () => {
    it.each([
        ['a.ts', '// One; two\n'],
        ['a.tsx', '// One; two\n'],
        ['a.js', '// One; two\n'],
        ['a.mjs', '// One; two\n'],
        ['a.cjs', '// One; two\n'],
        ['a.md', 'One; two\n'],
        ['a.yml', '# One; two\n'],
        ['a.yaml', '# One; two\n'],
        ['a.sql', '-- One; two\n'],
        ['a.html', '<p>One; two</p>\n'],
        ['a.sh', '# One; two\n'],
        ['Dockerfile', '# One; two\n'],
        ['docker/Dockerfile.prod', '# One; two\n'],
        ['api.Dockerfile', '# One; two\n'],
    ])('reads %s in its own comment style', (path, source) => {
        expect(rules(path, source)).toEqual([`${path}:1  semicolon in prose`]);
    });

    it.each([
        '<img alt="One; two" src="a.png">',
        '<abbr title="One; two">x</abbr>',
        '<button aria-label="One; two"></button>',
        '<button aria-description="One; two"></button>',
        '<input placeholder="One; two">',
        '<meta name="description" content="One; two">',
        '<meta property="og:description" content="One; two">',
        '<meta property="og:title" content="One; two">',
        '<meta name="twitter:description" content="One; two">',
    ])('reads the words a visitor is shown in %s', (tag) => {
        expect(rules('index.html', `${tag}\n`)).toEqual(['index.html:1  semicolon in prose']);
    });

    it('leaves entities alone in Markdown and in a page', () => {
        expect(rules('a.md', 'Fish &amp; chips, and &lt;b&gt; for bold.\n')).toEqual([]);
        expect(rules('index.html', '<p>Fish &amp; chips, and &lt;b&gt; for bold.</p>\n')).toEqual(
            []
        );
    });
});

describe('the prose check, given a pull request body or an issue', () => {
    it('reads text given a path that says it is Markdown, as a body is', () => {
        expect(rules('body.md', 'One clause; then another.\n')).toEqual([
            'body.md:1  semicolon in prose',
        ]);
    });

    it('reads nothing given a path of no kind it scans, so a body needs a path such as body.md', () => {
        expect(proseProblems('One clause; then another.', 'One clause; then another.\n')).toEqual(
            []
        );
    });
});
