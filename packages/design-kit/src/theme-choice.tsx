import { type ReactNode, type Ref, useId } from 'react';

import { ChoiceLabel, filled, spaced } from './react-parts.js';
import { THEME_CHOICES, type ThemeChoice } from './theme.js';

/** The word each theme choice is shown by. */
const CHOICE_WORDS: Readonly<Record<ThemeChoice, string>> = {
    system: 'System',
    light: 'Light',
    dark: 'Dark',
};

/**
 * The theme switch's markup: its name, Theme, a button that names the current choice for the
 * collapsed form, and a group named Theme of three native radios, described by a note that says
 * where the choice is kept. It is hidden and no radio is checked until `attachThemeSwitch` from
 * `@jasonsdevspace/design-kit/controls` shows it with the choice the page draws, so a visitor
 * without script meets no control that does nothing, and a line after the switch, inside `noscript`
 * so only a visitor without script sees it, says what sits there with scripts on. The radios carry
 * no checked prop, so React never undoes what the attach function sets. The button is drawn in
 * every switch and shown by the sheet alone, in a demo's strip on a screen narrower than 20rem,
 * where it opens the group under itself, so the markup is one whatever the width. The switch takes
 * a ref and a page's class after the kit's own, and nothing in its markup moves.
 */
export type ThemeSwitchProps = {
    /** What the name's and the note's ids start with, made with useId unless a page gives one. */
    readonly id?: string | undefined;
    /** The radios' name, unique on the page, the id unless a page gives one. */
    readonly name?: string | undefined;
    /** What the group is described by, out of sight. */
    readonly note?: string | undefined;
    /** What a visitor without script reads where the switch would be. Empty draws no line. */
    readonly noscript?: ReactNode;
    /** A page's class, after the kit's. */
    readonly className?: string | undefined;
    /** The switch drawn, for a page that attaches it through the element. */
    readonly ref?: Ref<HTMLDivElement> | undefined;
};

export const ThemeSwitch = ({
    id,
    name,
    note = 'Your choice is saved for every page of this site.',
    noscript = 'With scripts on, a Theme switch sits here.',
    className,
    ref,
}: ThemeSwitchProps) => {
    const made = useId();
    // An empty id would start every part's id with a hyphen, which two switches on a page would
    // share, so it is made as one left out is, as a field's is.
    const base = id === undefined || id === '' ? made : id;
    return (
        <>
            <div ref={ref} className={spaced('dk-theme-switch', className)} hidden>
                <span className="dk-theme-switch-name" id={`${base}-name`}>
                    Theme
                </span>
                <button
                    type="button"
                    className="dk-theme-switch-button"
                    id={`${base}-button`}
                    aria-labelledby={`${base}-name ${base}-button`}
                    aria-expanded={false}
                    aria-controls={`${base}-choices`}
                >
                    {CHOICE_WORDS.system}
                </button>
                <div
                    className="dk-theme-switch-choices"
                    id={`${base}-choices`}
                    role="radiogroup"
                    aria-labelledby={`${base}-name`}
                    aria-describedby={`${base}-note`}
                >
                    {THEME_CHOICES.map((value) => (
                        <ChoiceLabel
                            key={value}
                            className="dk-theme-switch-choice"
                            type="radio"
                            name={name ?? base}
                            value={value}
                            word={CHOICE_WORDS[value]}
                        />
                    ))}
                </div>
                <span className="dk-visually-hidden" id={`${base}-note`}>
                    {note}
                </span>
            </div>
            {filled(noscript) ? (
                <noscript>
                    <p className="dk-theme-switch-noscript">{noscript}</p>
                </noscript>
            ) : null}
        </>
    );
};
