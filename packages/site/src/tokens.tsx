import type { ReactNode } from 'react';

import {
    colorOf,
    contrast,
    declaredIn,
    PAIRS,
    ROLES,
    THEMES,
} from '../../design-kit/examples/palette.js';

/** The custom properties the tokens sheet declares, by name. */
export type Declared = ReturnType<typeof declaredIn>;

const THEME_NAMES = { light: 'Light', dark: 'Dark' } as const;

/** A role's value, a `light-dark()` of two colors, as the palette reads one. */
const TWO_COLORS = /^light-dark\(\s*#[\da-f]{6}\s*,\s*#[\da-f]{6}\s*\)$/i;

/**
 * The color roles the sheet itself declares, so the page shows the version it pins even when the
 * kit's sources have since gained or lost a role, each with what it draws where the palette says.
 */
const rolesIn = (declared: Declared) =>
    [...declared]
        .filter(([, value]) => TWO_COLORS.test(value))
        .map(([name]) => {
            const role = name.replace(/^--dk-/, '');
            return { role, draws: ROLES.find(([each]) => each === role)?.[1] ?? '' };
        });

/** A column of a table, and whether it holds figures, which sit to the right. */
interface Column {
    readonly name: string;
    readonly figures?: boolean;
}

/** A table the kit draws, titled, in a frame that scrolls inside itself on a narrow screen. */
const Table = ({
    id,
    title,
    columns,
    children,
}: {
    readonly id: string;
    readonly title: string;
    readonly columns: readonly Column[];
    readonly children: ReactNode;
}) => (
    <>
        <p className="dk-table-title" id={id}>
            {title}
        </p>
        <div className="dk-table-scroll" role="region" aria-labelledby={id} tabIndex={0}>
            <table className="dk-table" aria-labelledby={id}>
                <thead>
                    <tr>
                        {columns.map(({ name, figures = false }) => (
                            <th
                                key={name}
                                scope="col"
                                className={figures ? 'dk-table-number' : undefined}
                            >
                                {name}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>{children}</tbody>
            </table>
        </div>
    </>
);

/**
 * Each color role as a card: a swatch of it in light beside one in dark, its name, what it draws,
 * and its value in each theme under that theme's swatch, named by the theme. The swatches say nothing a
 * reader does not hear in the values, so a screen reader passes them by.
 */
export const Colors = ({ declared }: { readonly declared: Declared }) => (
    <ul className="site-roles" role="list">
        {rolesIn(declared).map(({ role, draws }) => (
            <li key={role}>
                <span className="site-role-swatches" aria-hidden="true">
                    {THEMES.map((theme) => (
                        <span
                            key={theme}
                            className={`site-swatch site-swatch-${role} site-${theme}`}
                        />
                    ))}
                </span>
                <code className="site-role-name">--dk-{role}</code>
                <span className="site-role-draws">{draws}</span>
                <span className="site-role-values">
                    {THEMES.map((theme) => (
                        <span key={theme} className={`site-role-${theme}`}>
                            <span className="site-role-theme">{THEME_NAMES[theme]}</span>{' '}
                            <code>{colorOf(declared, role, theme)}</code>
                        </span>
                    ))}
                </span>
            </li>
        ))}
    </ul>
);

/** A ratio to the two places the page shows, rounded down, so a pairing is never shown passing. */
const shown = (ratio: number) => Math.floor(ratio * 100) / 100;

/**
 * Each pairing whose colors the sheet declares, its ratio in each theme as the page shows it, and
 * the lower of the two against what the pairing needs, which is how tight it runs. The order
 * follows the figures shown, so it reads as sorted.
 */
const measuredIn = (declared: Declared) => {
    const roles = new Set(rolesIn(declared).map(({ role }) => role));
    return PAIRS.filter(([front, back]) => roles.has(front) && roles.has(back))
        .map(([front, back, needs]) => {
            const ratios = THEMES.map((theme) =>
                shown(contrast(colorOf(declared, front, theme), colorOf(declared, back, theme)))
            );
            return { front, back, needs, ratios, margin: Math.min(...ratios) / needs };
        })
        .sort((a, b) => a.margin - b.margin);
};

/** The highest contrast two colors can have, white on black, which a bar's full length stands for. */
const MOST = 21;

/** A length along a bar, as a share of its whole, to a hundredth. */
const along = (ratio: number) => Math.round((ratio / MOST) * 10000) / 100;

/**
 * A ratio as a bar, its whole length the most two colors can have, edged so its length shows, with
 * a mark centered where the pairing's need falls that runs past the bar above and below, so it is
 * seen against the page and not only against the fill. How far past its need a pairing runs shows
 * at a glance. It is drawn by the attributes of its own shapes, which the page's policy allows
 * where it refuses a style written on an element, its lines kept to a pixel width however the bar
 * is stretched, and a screen reader hears the figure beside it instead.
 */
const Bar = ({ ratio, needs }: { readonly ratio: number; readonly needs: number }) => (
    <svg
        className="site-bar"
        viewBox="0 0 100 12"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
    >
        <rect className="site-bar-track" x="0" y="4" width="100" height="4" />
        <rect className="site-bar-fill" x="0" y="4" width={along(ratio)} height="4" />
        <line className="site-bar-needs" x1={along(needs)} x2={along(needs)} y1="0" y2="12" />
    </svg>
);

/** Every pairing the palette is meant for, the tightest against what it needs first. */
export const Contrast = ({ declared }: { readonly declared: Declared }) => (
    <Table
        id="contrast-title"
        title="The contrast of every pairing, the tightest first"
        columns={[
            { name: 'Color' },
            { name: 'On' },
            { name: 'Needs', figures: true },
            ...THEMES.map((theme) => ({ name: THEME_NAMES[theme], figures: true })),
        ]}
    >
        {measuredIn(declared).map(({ front, back, needs, ratios }) => (
            <tr key={`${front}-${back}`}>
                <th scope="row">
                    <code>--dk-{front}</code>
                </th>
                <td>
                    <code>--dk-{back}</code>
                </td>
                <td className="dk-table-number">{needs} to 1</td>
                {ratios.map((ratio, index) => (
                    <td key={THEMES[index]} className="dk-table-number">
                        {ratio.toFixed(2)} to 1
                        <Bar ratio={ratio} needs={needs} />
                    </td>
                ))}
            </tr>
        ))}
    </Table>
);

/** A spacing step, its name the scale's and its number the step. */
const SPACE = /^--dk-space-\d+$/;

/**
 * The steps the site's sheet has a class to draw, one for each, since a size can only reach an
 * element through a class under the page's policy. A step the pinned sheet adds fails the build
 * here, rather than drawing as an empty square, until the sheet draws it too.
 */
const DRAWN = new Set(['1', '2', '3', '4', '5', '6', '7', '8']);

/** A step's own class, or a build that fails for a step the sheet cannot draw. */
const drawnAs = (name: string) => {
    const step = name.replace(/^--dk-space-/, '');
    if (!DRAWN.has(step)) throw new Error(`the site's sheet has no class to draw ${name}`);
    return `site-space-${step}`;
};

/**
 * The spacing scale, each step drawn to size as a square the step wide beside its name and its
 * value. Each square takes its size from its own token by a class, as the page's policy allows,
 * so it is drawn from the pinned sheet. The squares say what the values say, so a screen reader
 * passes them by.
 */
export const Spaces = ({ declared }: { readonly declared: Declared }) => (
    <ul className="site-spaces" role="list">
        {[...declared]
            .filter(([name]) => SPACE.test(name))
            .map(([name, value]) => (
                <li key={name}>
                    <span className="site-space-room" aria-hidden="true">
                        <span className={`site-space-drawn ${drawnAs(name)}`} />
                    </span>
                    <code>{name}</code>
                    <span className="site-space-value">{value}</span>
                </li>
            ))}
    </ul>
);

/** A step of the type scale, its name the scale's and its step the size. */
const TEXT = /^--dk-text-[a-z]+$/;

/**
 * The steps of the type scale the site's sheet has a class to draw, one for each, as with the
 * spacing scale. A step the pinned sheet adds fails the build here until the sheet draws it too.
 * Code takes its size from the words around it, so it is drawn inside a sentence by the kit's own
 * rule for code, and the numeral by the kit's own class for it, with no class of the site's.
 */
const TEXT_DRAWN = new Set([
    'caption',
    'small',
    'body',
    'lead',
    'title',
    'heading',
    'display',
    'numeral',
    'code',
]);

/** A type step's sample, drawn at its size, or a build that fails for a step the sheet cannot draw. */
const sampleOf = (name: string) => {
    const step = name.replace(/^--dk-text-/, '');
    if (!TEXT_DRAWN.has(step)) throw new Error(`the site's sheet has no class to draw ${name}`);
    if (step === 'code') {
        return (
            <span className="site-type-sample">
                Run <code>npm test</code> first
            </span>
        );
    }
    if (step === 'numeral') return <span className="site-type-sample dk-numeral">212</span>;
    return <span className={`site-type-sample site-text-${step}`}>Round 3 is saved</span>;
};

/**
 * The type scale, each step drawn as words at its size beside its name and its value, each taking
 * its size from its own token by a class, as the page's policy allows, so it is drawn from the
 * pinned sheet. The words say nothing the name and value do not, so a screen reader passes them by.
 */
export const TypeScale = ({ declared }: { readonly declared: Declared }) => (
    <ul className="site-type" role="list">
        {[...declared]
            .filter(([name]) => TEXT.test(name))
            .map(([name, value]) => (
                <li key={name}>
                    <span className="site-type-room" aria-hidden="true">
                        {sampleOf(name)}
                    </span>
                    <code>{name}</code>
                    <span className="site-type-value">{value}</span>
                </li>
            ))}
    </ul>
);

/**
 * The groups the tokens the color roles and the spacing scale leave out are shown in, by the id
 * each heading carries, its name, the title of its table and the tokens it holds. The type scale's
 * own steps are drawn rather than listed, so the type table holds the rest of the type tokens.
 */
export const SCALE_GROUPS = [
    {
        id: 'type',
        name: 'Type',
        title: 'Line heights, weights, tracking and faces',
        holds: /^--dk-(leading|weight|tracking|font)-/,
    },
    { id: 'radius', name: 'Radius', title: 'Every radius', holds: /^--dk-radius(-|$)/ },
    {
        id: 'motion',
        name: 'Motion and waits',
        title: 'Every duration and wait',
        holds: /^--dk-(duration-|wait$)/,
    },
    {
        id: 'sizes',
        name: 'Sizes',
        title: 'Every other size',
        holds: /^--dk-(ring|indicator|field|target|strip|measure|column|app|dialog|space-\d+-held|safe|band|card|icon|flow)(-|$)/,
    },
    {
        id: 'layers',
        name: 'Shadows, layers and grounds',
        title: 'Every shadow, layer and ground',
        holds: /^--dk-(shadow-|scrim$|stack-|ground(-|$))/,
    },
] as const;

export type ScaleGroup = (typeof SCALE_GROUPS)[number]['id'];

/**
 * The group a token is shown in, or a build that fails for one no group holds, rather than a token
 * the page leaves out.
 */
const groupOfToken = (name: string): ScaleGroup => {
    const found = SCALE_GROUPS.find(({ holds }) => holds.test(name));
    if (found === undefined) throw new Error(`the tokens page shows ${name} in no group`);
    return found.id;
};

/**
 * Every token of a group the color roles, the spacing scale and the type scale leave out, by name,
 * with its value as written.
 */
export const Scale = ({
    declared,
    group,
}: {
    readonly declared: Declared;
    readonly group: ScaleGroup;
}) => {
    const { title } = SCALE_GROUPS.find(({ id }) => id === group) ?? SCALE_GROUPS[0];
    return (
        <Table id={`${group}-title`} title={title} columns={[{ name: 'Token' }, { name: 'Value' }]}>
            {[...declared]
                .filter(
                    ([name, value]) =>
                        !TWO_COLORS.test(value) &&
                        !SPACE.test(name) &&
                        !TEXT.test(name) &&
                        groupOfToken(name) === group
                )
                .map(([name, value]) => (
                    <tr key={name}>
                        <th scope="row">
                            <code>{name}</code>
                        </th>
                        <td>
                            <code>{value}</code>
                        </td>
                    </tr>
                ))}
        </Table>
    );
};
