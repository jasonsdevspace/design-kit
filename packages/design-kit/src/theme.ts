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
 * changes or the portfolio saves a choice in another tab. Where the browser cannot report the
 * system's scheme, with no matchMedia, one that throws, or a result whose matches throws, the
 * script reads it as light, as the portfolio's own script does. It listens for another tab's
 * choice before anything else, and for a change of scheme only where the browser offers
 * addEventListener for it, so an older browser still hears the other tab. It is written with
 * var and a named catch, so an older engine still parses it.
 */
export const themeScript = `(function () {
    var root = document.documentElement;
    var media = null;
    try {
        media = window.matchMedia('(prefers-color-scheme: dark)');
    } catch (error) {
        media = null;
    }
    var saved = function () {
        try {
            var value = localStorage.getItem(${quoted(THEME_KEY)});
            return value === ${quoted(LIGHT)} || value === ${quoted(DARK)} ? value : null;
        } catch (error) {
            return null;
        }
    };
    var dark = function () {
        try {
            return Boolean(media && media.matches);
        } catch (error) {
            return false;
        }
    };
    var apply = function () {
        root.setAttribute('data-theme', saved() || (dark() ? ${quoted(DARK)} : ${quoted(LIGHT)}));
    };
    apply();
    window.addEventListener('storage', function (event) {
        if (event.key === null || event.key === ${quoted(THEME_KEY)}) apply();
    });
    if (media && typeof media.addEventListener === 'function') {
        media.addEventListener('change', apply);
    }
})();
`;
