import { THEME_KEY, THEMES } from 'design-kit-release/theme';

/*
 * The site's own script, which the kit does not ship: the theme switch in the strip. The theme
 * script the kit puts inline has already drawn the theme before this runs, so the switch shows the
 * choice, and saves and draws a new one. It saves under the portfolio's key and with the
 * portfolio's values, so a choice made here holds on every page of jasonsdevspace.com, and the
 * other way around.
 */

/** The portfolio's choices, System and the kit's two themes, and the word each is shown by. */
const CHOICES = ['system', ...THEMES] as const;
const WORDS: Readonly<Record<Choice, string>> = { system: 'System', light: 'Light', dark: 'Dark' };

type Choice = (typeof CHOICES)[number];

const isChoice = (value: string | null): value is Choice =>
    CHOICES.some((choice) => choice === value);

/**
 * The system's scheme, read as light where the browser cannot report it, as the theme script
 * does.
 */
const media = (() => {
    try {
        return window.matchMedia('(prefers-color-scheme: dark)');
    } catch {
        return null;
    }
})();

const systemIsDark = () => {
    try {
        return Boolean(media?.matches);
    } catch {
        return false;
    }
};

/** The choice saved, or null where the browser refuses the page its storage. */
const savedChoice = (): Choice | null => {
    try {
        const value = localStorage.getItem(THEME_KEY);
        return isChoice(value) ? value : 'system';
    } catch {
        return null;
    }
};

/**
 * The choice this page shows. Where the browser refuses storage it is held here alone, so a choice
 * still holds on this page until it is left.
 */
let chosen: Choice = savedChoice() ?? 'system';

/** Draws a choice on the page, the system's theme for System. */
const draw = (choice: Choice) => {
    const theme = choice === 'system' ? (systemIsDark() ? 'dark' : 'light') : choice;
    document.documentElement.setAttribute('data-theme', theme);
};

/** Saves a choice where the browser allows it, and draws it on this page either way. */
const choose = (choice: Choice) => {
    chosen = choice;
    try {
        localStorage.setItem(THEME_KEY, choice);
    } catch {
        // Held in `chosen` instead, for as long as the page is open.
    }
    draw(choice);
};

/**
 * The switch: a label and three radios, built with the DOM, so the page's policy needs no inline
 * script or style. The strip's section holds them and is named by the label, as the kit names a
 * section of switches, so a screen reader hears the name once, and a note says where the choice is
 * kept.
 */
const themeSwitch = () => {
    const name = document.createElement('span');
    name.id = 'site-theme-name';
    name.className = 'site-theme-name';
    name.textContent = 'Theme';
    const radios = CHOICES.map((choice) => {
        const label = document.createElement('label');
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'site-theme';
        radio.value = choice;
        radio.checked = choice === chosen;
        radio.addEventListener('change', () => {
            choose(choice);
        });
        label.append(radio, WORDS[choice]);
        return { label, radio };
    });
    const note = document.createElement('span');
    note.id = 'site-theme-note';
    note.className = 'dk-visually-hidden';
    note.textContent = 'Saved for every page on jasonsdevspace.com, as the portfolio saves it.';
    const show = () => {
        for (const { radio } of radios) radio.checked = radio.value === chosen;
    };
    return { parts: [name, ...radios.map(({ label }) => label), note], show };
};

/**
 * Puts the switch in the room the page's own strip kept for it, not in a picture of a strip, and
 * names the strip's section, so it becomes the landmark the kit makes of switches that have come.
 */
const room = document.querySelector('body > .dk-strip .dk-strip-room');
const section = room?.parentElement;
if (room && section) {
    const { parts, show } = themeSwitch();
    room.replaceWith(...parts);
    section.classList.add('site-theme');
    section.setAttribute('aria-labelledby', 'site-theme-name');
    section.setAttribute('aria-describedby', 'site-theme-note');

    /** Shows and draws what is saved, when this page may not have heard it saved. */
    const catchUp = () => {
        const saved = savedChoice();
        if (saved === null) return;
        chosen = saved;
        show();
        draw(saved);
    };

    // A choice saved in another tab, which the theme script has drawn too.
    window.addEventListener('storage', (event) => {
        if (event.key === null || event.key === THEME_KEY) catchUp();
    });
    // A page brought back from the browser's back and forward cache heard nothing while it was
    // away.
    window.addEventListener('pageshow', (event) => {
        if (event.persisted) catchUp();
    });
    // The theme script draws the system's theme when the system's changes, and where the browser
    // refuses storage it cannot know a choice was made, so the choice is drawn again after it.
    if (typeof media?.addEventListener === 'function') {
        media.addEventListener('change', () => {
            draw(chosen);
        });
    }
}
