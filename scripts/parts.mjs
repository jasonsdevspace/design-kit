/**
 * What each part of the package costs a page, for the package record: each piece's rules in the
 * three sheets, and each function of the controls.
 *
 * A piece's cost is what the three sheets save, sent together without their comments and gzipped
 * as the sheets' budget measures them, when that piece's rules are taken out. A rule belongs to the
 * piece it lays out, the first of the kit's classes in its first selector, read outside any `:not()`
 * or `:has()`, so a rule for a button in a grid counts to the grid and one for a dialog on a page
 * with an app counts to the dialog. A rule with no class of the kit's counts to the tokens in the
 * tokens' sheet, and to the page's own elements in the others. The costs do not add up to the
 * whole, since gzip finds repeats across pieces.
 *
 * A function's cost is measured twice from the controls as a page's bundler takes them, without
 * comments and gzipped: alone, what a page that imports only that function sends, and added, what
 * it adds to a page that imports every other. A function a page could drop costs nothing alone
 * past what it needs, since the module runs nothing when it is imported.
 */
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

import { withoutComments } from './summary.mjs';

/** The kit's pieces by the start of their classes, the longest first, so a grid is not a button. */
const PIECES = [
    ['button-grid', 'button grid'],
    ['theme-switch', 'theme switch'],
    ['visually-hidden', 'visually hidden'],
    ['explainer', 'explainer'],
    ['stepper', 'stepper'],
    ['tabbar', 'tab bar'],
    ['dialog', 'dialog'],
    ['actions', 'actions'],
    ['callout', 'callout'],
    ['choices', 'choice'],
    ['choice', 'choice'],
    ['eyebrow', 'eyebrow'],
    ['footer', 'footer'],
    ['textarea', 'field'],
    ['select', 'field'],
    ['input', 'field'],
    ['field', 'field'],
    ['button', 'button'],
    ['table', 'table'],
    ['toast', 'toast'],
    ['panel', 'panel'],
    ['steps', 'steps'],
    ['strip', 'strip'],
    ['pill', 'pills'],
    ['code', 'code block'],
    ['copy', 'copy button'],
    ['skip', 'skip link'],
    ['rows', 'rows'],
    ['row', 'rows'],
    ['tabs', 'tabs'],
    ['tab', 'tabs'],
    ['app', 'app frame'],
];

/** The piece a selector lays out, the first of the kit's classes outside :not() and :has(). */
export const pieceOf = (/** @type {string} */ selector, unclassed = "the page's own elements") => {
    if (selector.startsWith('@keyframes')) return 'animations';
    let outside = selector.split(/,(?![^(]*\))/)[0] ?? '';
    // Read outside a :not() or a :has(), whose classes name what is left out or looked for.
    for (let before = ''; before !== outside;) {
        before = outside;
        outside = outside.replace(/:(?:not|has)\((?:[^()]|\([^()]*\))*\)/g, '');
    }
    const classes = [...outside.matchAll(/\.dk-([a-z-]+)/g)].map((match) => match[1] ?? '');
    const named = classes[0];
    if (named === undefined) return unclassed;
    return PIECES.find(([start]) => named === start || named.startsWith(`${start}-`))?.[1] ?? named;
};

/**
 * Each rule of a sheet, with the at-rules that hold it, as written.
 *
 * @param {string} css
 * @returns {{ selector: string, text: string }[]}
 */
export const rulesOf = (css) => {
    /** @type {{ selector: string, text: string }[]} */
    const found = [];
    const walk = (/** @type {string} */ text) => {
        let at = 0;
        while (at < text.length) {
            const open = text.indexOf('{', at);
            if (open < 0) return;
            const head = text.slice(at, open).trim();
            let depth = 1;
            let end = open + 1;
            while (depth > 0 && end < text.length) {
                if (text[end] === '{') depth += 1;
                else if (text[end] === '}') depth -= 1;
                end += 1;
            }
            const body = text.slice(open + 1, end - 1);
            if (/^@(?:layer|media|supports)\b/.test(head) && body.includes('{')) walk(body);
            else found.push({ selector: head, text: text.slice(at, end).trim() });
            at = end;
        }
    };
    walk(css);
    return found;
};

/**
 * What each piece costs the three sheets sent together, the most first.
 *
 * @param {readonly string[]} sheets the tokens' sheet first, then the others
 * @returns {{ piece: string, rules: number, gzip: number }[]}
 */
export const piecesOf = (sheets) => {
    const stripped = sheets.map(withoutComments);
    const sent = stripped.join('\n');
    const whole = gzipSync(sent).length;
    /** @type {Map<string, string[]>} */
    const byPiece = new Map();
    stripped.forEach((sheet, at) => {
        // The first sheet is the tokens, whose rules with no class of the kit's declare them.
        for (const rule of rulesOf(sheet)) {
            const piece = pieceOf(rule.selector, at === 0 ? 'tokens' : undefined);
            byPiece.set(piece, [...(byPiece.get(piece) ?? []), rule.text]);
        }
    });
    return [...byPiece]
        .map(([piece, texts]) => {
            const without = texts.reduce((left, text) => left.replace(text, ''), sent);
            return { piece, rules: texts.length, gzip: whole - gzipSync(without).length };
        })
        .sort((a, b) => b.gzip - a.gzip || a.piece.localeCompare(b.piece));
};

/**
 * What a page's bundler sends for the functions named from the module given, without comments and
 * gzipped, the way the controls' budget and the package record both measure it.
 *
 * @param {string} module
 * @param {readonly string[]} names
 */
export const sentOf = async (module, names) => {
    const { build } = await import('vite');
    const entries = mkdtempSync(join(tmpdir(), 'design-kit-sent-'));
    try {
        const entry = join(entries, 'entry.js');
        writeFileSync(entry, `export { ${names.join(', ')} } from ${JSON.stringify(module)};\n`);
        const output = await build({
            configFile: false,
            logLevel: 'silent',
            build: {
                write: false,
                minify: false,
                lib: { entry, formats: ['es'], fileName: 'controls' },
            },
        });
        const code = (Array.isArray(output) ? output : [output])
            .flatMap((result) => ('output' in result ? result.output : []))
            .map((file) => (file.type === 'chunk' ? file.code : ''))
            .join('\n');
        return gzipSync(withoutComments(code.replace(/^\s*\/\/.*$/gm, ''))).length;
    } finally {
        rmSync(entries, { recursive: true, force: true });
    }
};

/**
 * What each function of the controls costs a page, alone and added to every other, the most added
 * first, from the controls module and the theme module it imports, in the folder given.
 *
 * @param {string} folder
 * @param {readonly string[]} names
 * @returns {Promise<{ name: string, alone: number, added: number }[]>}
 */
export const functionsOf = async (folder, names) => {
    const module = join(folder, 'controls.js');
    const every = await sentOf(module, names);
    /** @type {{ name: string, alone: number, added: number }[]} */
    const costs = [];
    for (const name of names) {
        costs.push({
            name,
            alone: await sentOf(module, [name]),
            added:
                every -
                (await sentOf(
                    module,
                    names.filter((other) => other !== name)
                )),
        });
    }
    return costs.sort((a, b) => b.added - a.added || a.name.localeCompare(b.name));
};
