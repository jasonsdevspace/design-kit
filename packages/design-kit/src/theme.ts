/**
 * The storage key the portfolio saves a visitor's theme under. A page on the same origin that
 * reads it draws the theme the visitor chose on the portfolio.
 */
export const THEME_KEY = 'theme';

/**
 * The two themes the script sets on the root as data-theme, each with a rule in the tokens. The
 * portfolio also saves `system`, which the script treats as nothing saved.
 */
export const THEMES = ['light', 'dark'] as const;

export type Theme = (typeof THEMES)[number];

const [LIGHT, DARK] = THEMES;
const quoted = (text: string) => JSON.stringify(text);

/**
 * The script a page runs inline in its head, before anything paints, so it never flashes the
 * other theme. It sets the theme the portfolio saved, or the system's when nothing usable is
 * saved or the browser refuses the page its storage, and sets it again whenever the system's
 * changes or the portfolio saves a choice in another tab. A browser that cannot report the
 * system's scheme, with no matchMedia or one that throws, reads it as light, as the portfolio's
 * own script does, and still hears a choice made in another tab.
 */
export const themeScript = `(function () {
    const root = document.documentElement;
    const media = (function () {
        try {
            return window.matchMedia('(prefers-color-scheme: dark)');
        } catch {
            return null;
        }
    })();
    const saved = function () {
        try {
            const value = localStorage.getItem(${quoted(THEME_KEY)});
            return value === ${quoted(LIGHT)} || value === ${quoted(DARK)} ? value : null;
        } catch {
            return null;
        }
    };
    const apply = function () {
        const system = media && media.matches ? ${quoted(DARK)} : ${quoted(LIGHT)};
        root.setAttribute('data-theme', saved() || system);
    };
    apply();
    if (media) media.addEventListener('change', apply);
    window.addEventListener('storage', function (event) {
        if (event.key === null || event.key === ${quoted(THEME_KEY)}) apply();
    });
})();
`;
