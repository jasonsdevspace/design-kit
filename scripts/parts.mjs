/**
 * What each part of the package costs a page, for the package record: each piece's rules in the
 * three sheets, and each function of the controls.
 *
 * A piece's cost is what the three sheets save, sent together without their comments and gzipped as
 * the sheets' budget measures them, when that piece's rules are taken out. A rule belongs to the
 * piece it lays out, the first of the kit's classes in its first selector, read outside any
 * `:not()` or `:has()`, so a rule for a button in a grid counts to the grid and one for a dialog's
 * actions in or beside an app's frame counts to the frame. A rule with no class of the kit's counts
 * to the tokens in the tokens' sheet, and to the page's own elements in the others. The costs add
 * up to less than the whole, since a piece that repeats another saves little once taken out.
 *
 * A function's cost is measured twice from the controls as a page's bundler takes them, without
 * comments and gzipped: alone, what a page that imports only that function sends, and added, what
 * it adds to a page that imports every other. A function a page could drop costs nothing alone
 * past what it needs and the listeners the module adds as it loads.
 */
import {
    copyFileSync,
    mkdirSync,
    mkdtempSync,
    readdirSync,
    readFileSync,
    realpathSync,
    rmSync,
    writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, sep } from 'node:path';
import { gzipSync } from 'node:zlib';

import { withoutComments } from './summary.mjs';

/** The kit's pieces by the start of their classes, the longest first, so a grid is not a button. */
export const PIECES = [
    ['button-grid', 'button grid'],
    ['theme-switch', 'theme switch'],
    ['visually-hidden', 'visually hidden'],
    ['explainer', 'explainer'],
    ['stepper', 'stepper'],
    ['tabbar', 'tab bar'],
    ['dialog', 'dialog'],
    ['actions', 'actions'],
    ['callout', 'callout'],
    ['loading', 'loading line'],
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
    ['site', 'site header'],
    ['page', 'content page'],
    ['icon', 'icon'],
    ['rows', 'rows'],
    ['row', 'rows'],
    ['tabs', 'tabs'],
    ['tab', 'tabs'],
    ['app', 'app frame'],
];

/** The first of the kit's classes a selector names, outside :not() and :has(), if it names one. */
const firstClassOf = (/** @type {string} */ selector) => {
    let outside = selector.split(/,(?![^(]*\))/)[0] ?? '';
    // Read outside a :not() or a :has(), whose classes name what is left out or looked for.
    for (let before = ''; before !== outside;) {
        before = outside;
        outside = outside.replace(/:(?:not|has)\((?:[^()]|\([^()]*\))*\)/g, '');
    }
    return [...outside.matchAll(/\.dk-([a-z-]+)/g)].map((match) => match[1] ?? '')[0];
};

/** The start in the piece map a selector's first class matches, if any does. */
export const entryOf = (/** @type {string} */ selector) => {
    const named = firstClassOf(selector);
    if (named === undefined) return undefined;
    return PIECES.find(([start]) => named === start || named.startsWith(`${start}-`))?.[0];
};

/** The piece a selector lays out, the first of the kit's classes outside :not() and :has(). */
export const pieceOf = (/** @type {string} */ selector, unclassed = "the page's own elements") => {
    if (selector.startsWith('@keyframes')) return 'animations';
    const named = firstClassOf(selector);
    if (named === undefined) return unclassed;
    const start = entryOf(selector);
    return PIECES.find(([entry]) => entry === start)?.[1] ?? named;
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
            // A statement with no block before it, such as a layer order, ends at its semicolon.
            const head = text.slice(at, open).split(';').at(-1)?.trim() ?? '';
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
            let without = texts.reduce((left, text) => left.replace(text, ''), sent);
            // A media query or a layer left empty goes with the rules it held.
            for (let before = ''; before !== without;) {
                before = without;
                without = without.replace(/@(?:media|supports|layer)[^{;}]*\{\s*\}/g, '');
            }
            return { piece, rules: texts.length, gzip: whole - gzipSync(without).length };
        })
        .sort((a, b) => b.gzip - a.gzip || a.piece.localeCompare(b.piece));
};

/**
 * The code a page's bundler sends for the functions named from the module given, without comments
 * and blank lines, as the controls' budget and the package record both measure it.
 *
 * @param {string} module
 * @param {readonly string[]} names
 */
export const bundledOf = async (module, names) => {
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
        // Without comments as a compiler takes them out, so no comment's text is read as code.
        const { default: ts } = await import('typescript');
        const stripped = ts.transpileModule(code, {
            compilerOptions: { removeComments: true, target: ts.ScriptTarget.ESNext },
        }).outputText;
        return stripped.replace(/^[ \t]*\n/gm, '');
    } finally {
        rmSync(entries, { recursive: true, force: true });
    }
};

/**
 * What a site's bundler sends each of its pages, where each page imports the functions named from
 * the module given and the pages are built together, as a site with a page that attaches only a
 * form beside a page that attaches only a table builds them. Code that two pages import goes into a
 * chunk they share, and a module only one page imports stays out of the other's chunks. For each
 * page it gives the modules of the package folder that its entry chunk and the chunks that entry
 * imports hold, by their paths in that folder, and their code.
 *
 * @param {string} module the module's path inside a folder laid out as `packagedOf` lays it out
 * @param {readonly (readonly string[])[]} pages the names each page imports, none for a bare import
 * @returns {Promise<{ modules: string[], code: string }[]>}
 */
export const chunksOf = async (module, pages) => {
    const { build } = await import('vite');
    const entries = mkdtempSync(join(tmpdir(), 'design-kit-pages-'));
    // The package folder, whose `dist` holds the module, as the bundler names it, past links.
    const folder = realpathSync(join(module, '..', '..'));
    try {
        /** @type {Record<string, string>} */
        const entry = {};
        pages.forEach((names, at) => {
            const page = join(entries, `page${String(at)}.js`);
            writeFileSync(
                page,
                names.length === 0
                    ? `import ${JSON.stringify(module)};\n`
                    : `export { ${names.join(', ')} } from ${JSON.stringify(module)};\n`
            );
            entry[`page${String(at)}`] = page;
        });
        const output = await build({
            configFile: false,
            logLevel: 'silent',
            build: { write: false, minify: false, lib: { entry, formats: ['es'] } },
        });
        const chunks = (Array.isArray(output) ? output : [output])
            .flatMap((result) => ('output' in result ? result.output : []))
            .filter((file) => file.type === 'chunk');
        const byFile = new Map(chunks.map((chunk) => [chunk.fileName, chunk]));
        return pages.map((_, at) => {
            const first = chunks.find(
                (chunk) => chunk.isEntry && chunk.name === `page${String(at)}`
            );
            if (!first) throw new Error(`expected a chunk for page ${String(at)}`);
            // The entry chunk and every chunk it imports, and those they import in turn.
            const reached = new Set([first]);
            for (const chunk of reached)
                for (const name of chunk.imports) {
                    const imported = byFile.get(name);
                    if (imported) reached.add(imported);
                }
            const modules = [...reached]
                .flatMap((chunk) => chunk.moduleIds)
                .filter((id) => id.startsWith(folder))
                .map((id) => relative(folder, id).split(sep).join('/'));
            return {
                modules: [...new Set(modules)].sort(),
                code: [...reached].map((chunk) => chunk.code).join('\n'),
            };
        });
    } finally {
        rmSync(entries, { recursive: true, force: true });
    }
};

/**
 * What a page's bundler sends for the functions named from the module given, without comments and
 * gzipped, the way the controls' budget and the package record both measure it.
 *
 * @param {string} module
 * @param {readonly string[]} names
 */
export const sentOf = async (module, names) => gzipSync(await bundledOf(module, names)).length;

/**
 * The package's modules laid out as npm ships them, compiled from the sources in the package
 * folder given into a `dist` folder beside its manifest, in a folder of its own that the caller
 * removes. A bundler reads the manifest's `sideEffects` there as it does in a page's install, so
 * a page that imports the controls bare is measured with the listeners the module adds as it
 * loads. Measured from the sources, which the manifest's `sideEffects` does not name, a bundler
 * would drop those listeners.
 *
 * @param {string} folder
 * @returns {Promise<string>} the folder the package is laid out in
 */
export const packagedOf = async (folder) => {
    const { default: ts } = await import('typescript');
    const { config } = ts.readConfigFile(join(folder, 'tsconfig.build.json'), ts.sys.readFile);
    const { options } = ts.parseJsonConfigFileContent(config, ts.sys, folder);
    const into = mkdtempSync(join(tmpdir(), 'design-kit-packaged-'));
    try {
        mkdirSync(join(into, 'dist'));
        copyFileSync(join(folder, 'package.json'), join(into, 'package.json'));
        const sources = join(folder, 'src');
        for (const file of readdirSync(sources).filter((name) => /^[^.]+\.ts$/.test(name))) {
            const { outputText } = ts.transpileModule(readFileSync(join(sources, file), 'utf8'), {
                compilerOptions: { ...options, declaration: false },
                fileName: file,
            });
            writeFileSync(join(into, 'dist', file.replace(/\.ts$/, '.js')), outputText);
        }
        return into;
    } catch (error) {
        // The caller removes the folder only once it is handed back, so a failed layout goes here.
        rmSync(into, { recursive: true, force: true });
        throw error;
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
    // Each build is its own, so they run together.
    const costs = await Promise.all(
        names.map(async (name) => ({
            name,
            alone: await sentOf(module, [name]),
            added:
                every -
                (await sentOf(
                    module,
                    names.filter((other) => other !== name)
                )),
        }))
    );
    return costs.sort((a, b) => b.added - a.added || a.name.localeCompare(b.name));
};
