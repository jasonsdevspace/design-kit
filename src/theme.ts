/**
 * The storage key the portfolio saves a visitor's theme under, which every demo on the same
 * origin reads, so the portfolio and the demos switch together.
 */
export const THEME_KEY = 'theme';

/** The themes a visitor can save, each set on the root as data-theme and read by the tokens. */
export const THEMES = ['light', 'dark'] as const;

export type Theme = (typeof THEMES)[number];

const [LIGHT, DARK] = THEMES;
const quoted = (text: string) => JSON.stringify(text);

/**
 * The script a page runs inline in its head, before anything paints, so it never flashes the
 * other theme. It sets the theme the portfolio saved, or the system's when nothing usable is
 * saved or the browser refuses the page its storage, and sets it again whenever the system's
 * changes or the portfolio saves a choice in another tab.
 */
export const themeScript = `(function () {
    const root = document.documentElement;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const saved = function () {
        try {
            const value = localStorage.getItem(${quoted(THEME_KEY)});
            return value === ${quoted(LIGHT)} || value === ${quoted(DARK)} ? value : null;
        } catch {
            return null;
        }
    };
    const apply = function () {
        root.setAttribute('data-theme', saved() || (media.matches ? ${quoted(DARK)} : ${quoted(LIGHT)}));
    };
    apply();
    media.addEventListener('change', apply);
    window.addEventListener('storage', function (event) {
        if (event.key === null || event.key === ${quoted(THEME_KEY)}) apply();
    });
})();
`;
