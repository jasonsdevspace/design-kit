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
type Declared = ReturnType<typeof declaredIn>;

const THEME_NAMES = { light: 'Light', dark: 'Dark' } as const;

/** A table the kit draws, titled, in a frame that scrolls inside itself on a narrow screen. */
const Table = ({
    id,
    title,
    head,
    children,
}: {
    readonly id: string;
    readonly title: string;
    readonly head: readonly string[];
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
                        {head.map((cell, index) => (
                            <th
                                key={cell}
                                scope="col"
                                className={
                                    index > 1 && head.length === 5 ? 'dk-table-number' : undefined
                                }
                            >
                                {cell}
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
        head={['Role', 'Draws', 'Light', 'Dark']}
    >
        {ROLES.map(([role, draws]) => (
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

/**
 * A pairing's ratio in each theme, to the two places the page shows, and the lower of the two
 * against what the pairing needs, which is how tight it runs. The order follows the figures shown,
 * so it reads as sorted.
 */
const measuredIn = (declared: Declared) =>
    PAIRS.map(([front, back, needs]) => {
        const ratios = THEMES.map((theme) =>
            Number(
                contrast(colorOf(declared, front, theme), colorOf(declared, back, theme)).toFixed(2)
            )
        );
        return { front, back, needs, ratios, margin: Math.min(...ratios) / needs };
    }).sort((a, b) => a.margin - b.margin);

/** Every pairing the palette is meant for, the tightest against what it needs first. */
export const Contrast = ({ declared }: { readonly declared: Declared }) => (
    <Table
        id="contrast-title"
        title="The contrast of every pairing, the tightest first"
        head={['Color', 'On', 'Needs', ...THEMES.map((theme) => THEME_NAMES[theme])]}
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

/** Every token that is not a color, by name, with its value as the sheet writes it. */
export const Scale = ({ declared }: { readonly declared: Declared }) => (
    <Table id="scale-title" title="The scale a component is built from" head={['Token', 'Value']}>
        {[...declared]
            .filter(([, value]) => !value.includes('light-dark('))
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
