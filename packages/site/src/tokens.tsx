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
 * and its value in each theme, named by the theme for a screen reader. The swatches say nothing a
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
                            <span className="dk-visually-hidden">{THEME_NAMES[theme]} </span>
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
 * A ratio as a bar, its whole length the most two colors can have, with a mark where the pairing's
 * need falls, so how far past its need a pairing runs shows at a glance. It is drawn by the
 * attributes of its own shapes, which the page's policy allows where it refuses a style written
 * on an element, and a screen reader hears the figure beside it instead.
 */
const Bar = ({ ratio, needs }: { readonly ratio: number; readonly needs: number }) => (
    <svg
        className="site-bar"
        viewBox="0 0 100 8"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
    >
        <rect className="site-bar-track" x="0" y="2" width="100" height="4" rx="2" />
        <rect className="site-bar-fill" x="0" y="2" width={along(ratio)} height="4" rx="2" />
        <rect className="site-bar-needs" x={along(needs)} y="0" width="0.6" height="8" />
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
                    <td key={THEMES[index]} className="dk-table-number site-figure">
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
                        <span className={`site-space-drawn site-${name.replace(/^--dk-/, '')}`} />
                    </span>
                    <code>{name}</code>
                    <span className="site-space-value">{value}</span>
                </li>
            ))}
    </ul>
);

/** Every token the color roles and the spacing scale leave out, by name, with its value as written. */
export const Scale = ({ declared }: { readonly declared: Declared }) => (
    <Table
        id="scale-title"
        title="Every other token"
        columns={[{ name: 'Token' }, { name: 'Value' }]}
    >
        {[...declared]
            .filter(([name, value]) => !TWO_COLORS.test(value) && !SPACE.test(name))
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
