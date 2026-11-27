/**
 * The rules: prose that should never reach a reader.
 *
 * Applied to comments, documentation, page text and workflow files. Code is
 * left alone, so a semicolon ending a statement is none of these rules'
 * business.
 *
 * 1. No em dashes, anywhere in a file. Pick the punctuation the sentence
 *    wants instead.
 * 2. No semicolons joining clauses in prose. Two sentences read better.
 * 3. No process artifacts. A reader should not be able to tell which parts
 *    were uncertain while they were being written, so nothing announces that
 *    something is missing, pending or blocked.
 * 4. No issue or pull request numbers in comments. The number means nothing
 *    once the tracker moves on, so the comment says what the issue said.
 * 5. American spelling, to agree with the identifiers beside it.
 * 6. No en dash used as a dash, spaced between words. One between numbers
 *    in a range is fine.
 * 7. No writing that fills space rather than saying something: a clause
 *    tacked on with -ing, a word that inflates, an opener that only
 *    announces, a stock closing line, a wordy phrase or an intensifier.
 * 8. No placeholder left in, and no emoji in place of words.
 *
 * Rhythm, structure and tone are left to people, since a check that reads
 * one line at a time would get them wrong.
 *
 * A repository runs every rule over its files with the `check-prose` command, and anything else,
 * such as a pull request's body, is checked by calling `proseProblems` with a path that says what
 * kind of text it is, such as `body.md`.
 */
import { basename, extname } from 'node:path';

/**
 * A Dockerfile by its usual names: `Dockerfile` alone, with a suffix as in
 * `Dockerfile.prod`, or as the extension in `api.Dockerfile`.
 *
 * @param {string} path
 */
export function isDockerfile(path) {
    return /^Dockerfile(\..+)?$|\.Dockerfile$/.test(basename(path));
}

const SCANNED = new Set([
    '.ts',
    '.tsx',
    '.jsx',
    '.js',
    '.mjs',
    '.cjs',
    '.md',
    '.yml',
    '.yaml',
    '.sql',
    '.html',
    '.sh',
]);

/**
 * Built from its code point rather than written literally, so this file does
 * not trip its own check.
 */
const EM_DASH = String.fromCodePoint(0x2014);

const PROCESS_ARTIFACTS =
    /\b(TODO|FIXME|XXX|HACK|TBD)\b|\b(coming soon|not implemented|a?waiting on|to be (decided|determined)|for now,? (leav(e|ing)|left|skip(ped|ping)?))\b/i;

const ISSUE_REFERENCES =
    /\b(issue|issues|ticket|tickets|pr|prs|pull request)s? ?#?\d+\b|\(#\d+\)|\bGH-\d+\b/i;

/**
 * British forms of words this codebase actually uses, listed rather than
 * matched by suffix. A rule like any word ending in -ise would catch promise,
 * otherwise and precise, and a check that cries wolf gets switched off.
 */
const BRITISH_SPELLINGS = new RegExp(
    [
        '\\b(serialis|initialis|recognis|unrecognis|organis|prioritis|optimis|normalis|parameteris|authoris|utilis|minimis|summaris|customis|standardis|synchronis|categoris)(e|es|ed|ing|ation|ations|able|er|ers)?\\b',
        '\\b(behaviour|favour|colour|honour|labour|neighbour)(s|ed|ing|ite|ites|al|ally)?\\b',
        '\\b(catalogue|catalogues|analyse|analysed|analysing|centre|centres|licence|defence|whilst|amongst)\\b',
        '\\b(cancell|modell|travell|labell)(ed|ing)\\b',
    ].join('|'),
    'i'
);

/**
 * A clause tacked on with -ing after a comma, which restates what the sentence showed. Only the
 * verbs that rarely lead a real result are listed, so a clause that says what follows passes.
 */
const TRAILING_CLAUSE =
    /, (ensuring|enabling|resulting in|highlighting|underscoring|showcasing|reflecting|contributing to|fostering)\b/i;

/**
 * Words and phrases that inflate rather than say. A word with a technical meaning in code or docs,
 * such as one naming a color, a test tool or a browser feature, is left out.
 */
const INFLATED_WORDS =
    /\b(?:utiliz(?:e|es|ed|ing|ation)|leverag(?:e|es|ed|ing)|spearhead(?:s|ed|ing)?|delv(?:e|es|ed|ing)|synerg(?:y|ies|istic)|seamless(?:ly)?|cutting-edge|groundbreaking|transformative|multifaceted|tapestry|vibrant|meticulous(?:ly)?|pivotal|bolster(?:s|ed|ing)?|garner(?:s|ed|ing)?|interplay|empower(?:s|ed|ing|ment)?|passionate|crucial(?:ly)?|thriv(?:e|es|ed|ing)|intricate|foster(?:s|ed|ing)?|resonates? with|testament to|sets? the stage for|at the intersection of|proven track record|deep dive|ever-evolving|at its core|the real question is|valuable insights|diverse array|meaningful impact|fast-paced)\b/i;

/** An opener that only announces, at the start of a sentence or as a stock phrase. */
const EMPTY_OPENERS =
    /(?:^[\s>*+-]*|[.!?]\s+)(?:Additionally|Moreover|Furthermore|Notably)\b|\b(?:it['\u2019]s|it is) (?:worth noting|important to note)\b|\b(?:simply put|to be clear|here['\u2019]s the thing)\b/i;

/**
 * A placeholder left in: a bracketed slot that is not a link or an index into code, a date with
 * its digits still to fill, or filler text.
 */
const PLACEHOLDERS =
    /(?<![\w\]])\[(?:insert [^\]]*|your name|company name|name|link)\](?![([:])|\b\d{4}-XX-XX\b|\blorem ipsum\b/i;

/** Built from its code point, as the em dash is. Spaced, it stands in for a dash. */
const EN_DASH_AS_DASH = new RegExp(`\\s${String.fromCodePoint(0x2013)}\\s`);

/** A phrase that says what a shorter one says. */
const WORDY_PHRASES = /\bin order to\b/i;

/** A stock line that says nothing, mostly met at the end of a body or a comment. */
const CANNED_CLOSERS =
    /\b(?:I hope this helps|let me know if you have any questions|happy to help|great question|in summary|in conclusion)\b|(?:^[\s>*+-]*|[.!?]\s+)Overall,/i;

/** Intensifiers that never carry a meaning of their own in technical writing. */
const INTENSIFIERS = /\b(?:extremely|incredibly)\b/i;

/**
 * A character drawn as a picture, or one asked to be drawn as one. Symbols such as a check mark,
 * an arrow or the copyright sign are text, and pass.
 */
const EMOJI = /\p{Emoji_Presentation}|\p{Extended_Pictographic}\uFE0F/u;

/**
 * The British spelling of gray as a word of its own, and its forms with an ending, in any case. A
 * longer word that starts with it, such as the name of a breed of dog, is a word of its own and
 * never matches.
 */
const GREY = /\bgrey(s|ed|ing|er|est|ish|ness)?\b/gi;

/**
 * Whether text spells gray the British way, leaving out a name: the word with a capital followed by
 * another word with a capital, as in a person's name or a tea's.
 *
 * @param {string} text
 * @returns {boolean}
 */
const spellsGrey = (text) =>
    [...text.matchAll(GREY)].some(
        (match) =>
            !(
                /^[A-Z]/.test(match[0]) &&
                /^ [A-Z]/.test(text.slice((match.index ?? 0) + match[0].length))
            )
    );

/**
 * How a comment starts, by the kind of file. A `#` starts one in a workflow,
 * a shell script or a Dockerfile, but in JavaScript it starts a private
 * field, so it is not read there.
 *
 * @param {string} path
 * @returns {string}
 */
const commentStart = (path) => {
    const ext = extname(path);
    if (ext === '.sql') return '--';
    if (['.yml', '.yaml', '.sh'].includes(ext) || isDockerfile(path)) return '#';
    return '\\/\\/|\\{?\\/\\*+|\\*(?!\\/)';
};

/**
 * Comment text only, so statement semicolons are never considered. A
 * comment that closes on its line ends there, so code after it is left alone.
 *
 * @param {string} path
 * @param {string} source
 * @returns {{ index: number, text: string }[]}
 */
const commentsOf = (path, source) => {
    const comment = new RegExp(`^\\s*(?:${commentStart(path)})\\s?(.*?)(?:\\*\\/.*)?$`);
    return source.split('\n').flatMap((line, index) => {
        const text = comment.exec(line)?.[1];
        return text === undefined ? [] : [{ index, text }];
    });
};

/**
 * Markdown body text, with fenced blocks, inline code and entities removed.
 *
 * @param {string} source
 * @returns {{ index: number, text: string }[]}
 */
const proseOf = (source) => {
    let fenced = false;
    return source.split('\n').flatMap((line, index) => {
        if (/^\s*```/.test(line)) {
            fenced = !fenced;
            return [];
        }
        return fenced
            ? []
            : [{ index, text: line.replace(/`[^`]*`/g, '').replace(/&[a-z]+;/gi, '') }];
    });
};

/** Attributes whose words a visitor reads or hears. */
const READ_ATTRIBUTES = /\b(?:alt|title|aria-label|aria-description|placeholder)\s*=\s*"([^"]*)"/gi;

/** A meta tag whose content is shown as the page's description or title. */
const SHOWN_META =
    /<meta\s[^>]*\b(?:name|property)="(?:description|og:description|og:title|twitter:description)"[^>]*>/i;

/**
 * A page's text and its comments, line by line. Scripts and styles are code,
 * so they are blanked, and a block left open runs to the end of the page, as
 * a browser reads it. A code sample's text is blanked too, as Markdown's
 * inline code is, while the tag that holds it keeps its attributes. A tag gives way to the words in the attributes a
 * visitor reads, and otherwise to nothing, so a semicolon after a link still
 * sits beside the word before it. Line breaks are kept so line numbers match.
 *
 * @param {string} source
 * @returns {{ index: number, text: string }[]}
 */
const pageTextOf = (source) =>
    source
        .replace(/<(script|style)\b[\s\S]*?(?:<\/\1\s*>|$)/gi, (block) =>
            block.replace(/[^\n]/g, '')
        )
        .replace(
            /(<code\b[^>]*>)([\s\S]*?)(<\/code\s*>|$)/gi,
            (_, open, sample, close) => `${open}${sample.replace(/[^\n]/g, '')}${close}`
        )
        .replace(/<!--|--!?>/g, ' ')
        .replace(/<[^>]*>/g, (tag) => {
            const read = [...tag.matchAll(READ_ATTRIBUTES)].map((attribute) => attribute[1]);
            if (SHOWN_META.test(tag)) read.push(/\bcontent="([^"]*)"/i.exec(tag)?.[1] ?? '');
            const breaks = tag.replace(/[^\n]/g, '');
            return read.length === 0 ? breaks : ` ${read.join(' ')} ${breaks}`;
        })
        .split('\n')
        .map((line, index) => ({ index, text: line.replace(/&[a-z]+;/gi, '') }));

/**
 * The rules that are one pattern each, by the name a problem is reported under, in the order
 * they are reported.
 *
 * @type {readonly (readonly [RegExp, string])[]}
 */
const PATTERNS = [
    [EN_DASH_AS_DASH, 'en dash as a dash'],
    [TRAILING_CLAUSE, 'trailing -ing clause'],
    [INFLATED_WORDS, 'inflated word'],
    [EMPTY_OPENERS, 'empty opener'],
    [CANNED_CLOSERS, 'canned closer'],
    [WORDY_PHRASES, 'wordy phrase'],
    [INTENSIFIERS, 'intensifier'],
    [PLACEHOLDERS, 'leftover placeholder'],
    [EMOJI, 'emoji'],
];

/**
 * The problems in one piece of prose, by rule.
 *
 * @param {string} text
 * @param {{ issues: boolean }} options
 * @returns {string[]}
 */
export function problemsIn(text, { issues }) {
    return [
        PROCESS_ARTIFACTS.test(text) && 'process artifact',
        issues && ISSUE_REFERENCES.test(text) && 'issue reference',
        /[A-Za-z0-9)\]'"`\u2019];/.test(text) && 'semicolon in prose',
        (BRITISH_SPELLINGS.test(text) || spellsGrey(text)) && 'British spelling',
        ...PATTERNS.map(([pattern, rule]) => pattern.test(text) && rule),
    ].filter((rule) => typeof rule === 'string');
}

/**
 * Whether the check reads a file, by its kind.
 *
 * @param {string} path
 */
export function isScanned(path) {
    return SCANNED.has(extname(path)) || isDockerfile(path);
}

/**
 * Every problem in one file, as `path:line  rule` with the line beneath. The path says what kind
 * of text it is, so a pull request's or an issue's body goes in as `body.md`, and a path of a kind
 * the check does not read finds nothing.
 *
 * @param {string} path the file's path, which says what kind of text it is
 * @param {string} source the file's text
 * @param {string} [label] the name each problem is reported under, the path unless given
 * @returns {string[]}
 */
export function proseProblems(path, source, label = path) {
    const ext = extname(path);
    if (!isScanned(path)) return [];
    const isMarkdown = ext === '.md';
    const segments = isMarkdown
        ? proseOf(source)
        : ext === '.html'
          ? pageTextOf(source)
          : commentsOf(path, source);
    /** @type {(index: number, rule: string, text: string) => string} */
    const report = (index, rule, text) =>
        `${label}:${index + 1}  ${rule}\n    ${text.trim().slice(0, 100)}`;
    return [
        ...source
            .split('\n')
            .flatMap((line, index) =>
                line.includes(EM_DASH) ? [report(index, 'em dash', line)] : []
            ),
        ...segments.flatMap(({ index, text }) =>
            problemsIn(text, { issues: !isMarkdown }).map((rule) => report(index, rule, text))
        ),
    ];
}
