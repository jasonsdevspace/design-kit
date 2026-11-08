import { THEME_KEY } from 'design-kit-release/theme';

/*
 * The site's own script, which the kit does not ship: the theme switch in the strip. The theme
 * script the kit puts inline has already drawn the theme before this runs, so the switch only
 * shows the choice and saves a new one. It saves under the portfolio's key and with the
 * portfolio's values, so a choice made here holds on every page of jasonsdevspace.com, and the
 * other way around.
 */

/** The three choices the portfolio saves, and the word each is shown by. */
const CHOICES = [
    ['system', 'System'],
    ['light', 'Light'],
    ['dark', 'Dark'],
] as const;

type Choice = (typeof CHOICES)[number][0];

const isChoice = (value: string | null): value is Choice =>
    CHOICES.some(([choice]) => choice === value);

/** The system's scheme, read as light where the browser cannot report it, as the theme script does. */
const systemIsDark = () => {
    try {
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
        return false;
    }
};

/** The choice saved, or System where nothing usable is saved or the browser refuses storage. */
const savedChoice = (): Choice => {
    try {
        const value = localStorage.getItem(THEME_KEY);
        return isChoice(value) ? value : 'system';
    } catch {
        return 'system';
    }
};

/** Saves a choice where the browser allows it, and draws it on this page either way. */
const choose = (choice: Choice) => {
    try {
        localStorage.setItem(THEME_KEY, choice);
    } catch {
        // A page refused storage still draws the choice until it is left.
    }
    const theme = choice === 'system' ? (systemIsDark() ? 'dark' : 'light') : choice;
    document.documentElement.setAttribute('data-theme', theme);
};

/**
 * The switch: three radios in a group named Theme, described by a note that says where the choice
 * is kept. Each is built with the DOM, so the page's policy needs no inline script or style.
 */
const themeSwitch = () => {
    const group = document.createElement('fieldset');
    group.className = 'site-theme';
    group.setAttribute('aria-describedby', 'site-theme-note');
    const legend = document.createElement('legend');
    legend.id = 'site-theme-name';
    legend.textContent = 'Theme';
    group.append(legend);
    const current = savedChoice();
    for (const [choice, word] of CHOICES) {
        const label = document.createElement('label');
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'site-theme';
        radio.value = choice;
        radio.checked = choice === current;
        radio.addEventListener('change', () => {
            choose(choice);
        });
        label.append(radio, word);
        group.append(label);
    }
    const note = document.createElement('span');
    note.id = 'site-theme-note';
    note.className = 'dk-visually-hidden';
    note.textContent = 'Saved for every page on jasonsdevspace.com, as the portfolio saves it.';
    return { group, note };
};

/**
 * Puts the switch in the room the strip kept for it, and names the strip's section by the switch's
 * legend, so the section becomes the landmark the kit makes of switches that have come.
 */
const room = document.querySelector('.dk-strip-room');
const section = room?.parentElement;
if (room && section) {
    const { group, note } = themeSwitch();
    room.replaceWith(group, note);
    section.setAttribute('aria-labelledby', 'site-theme-name');
    // A choice saved in another tab, which the theme script has already drawn.
    window.addEventListener('storage', (event) => {
        if (event.key !== null && event.key !== THEME_KEY) return;
        const current = savedChoice();
        for (const radio of group.querySelectorAll('input'))
            radio.checked = radio.value === current;
    });
}
