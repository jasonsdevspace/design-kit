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

/** Each color role, with what it draws and its value in each theme beside a swatch of it. */
export const Colors = ({ declared }: { readonly declared: Declared }) => (
    <Table
        id="colors-title"
        title="Each color role in both themes"
        columns={[
            { name: 'Role' },
            { name: 'Draws' },
            ...THEMES.map((theme) => ({ name: THEME_NAMES[theme] })),
        ]}
    >
        {rolesIn(declared).map(({ role, draws }) => (
            <tr key={role}>
                <th scope="row">
                    <code>--dk-{role}</code>
                </th>
                <td>{draws}</td>
                {THEMES.map((theme) => (
                    <td key={theme}>
                        <span
                            className={`site-swatch site-swatch-${role} site-${theme}`}
                            aria-hidden="true"
                        />
                        <code>{colorOf(declared, role, theme)}</code>
                    </td>
                ))}
            </tr>
        ))}
    </Table>
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
                    </td>
                ))}
            </tr>
        ))}
    </Table>
);

/** Every token the color roles leave out, by name, with its value as the sheet writes it. */
export const Scale = ({ declared }: { readonly declared: Declared }) => (
    <Table
        id="scale-title"
        title="The scale, and every other token"
        columns={[{ name: 'Token' }, { name: 'Value' }]}
    >
        {[...declared]
            .filter(([, value]) => !TWO_COLORS.test(value))
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
