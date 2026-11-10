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

/**
 * What a visitor chooses on a theme switch: System, which follows the system's scheme and saves as
 * `system`, and the two themes. The theme script treats `system` as nothing saved.
 */
export const THEME_CHOICES = ['system', ...THEMES] as const;

export type ThemeChoice = (typeof THEME_CHOICES)[number];

const [LIGHT, DARK] = THEMES;
const quoted = (text: string) => JSON.stringify(text);

/**
 * The script a page runs inline in its head, before anything paints, so it never flashes the other
 * theme. It sets the theme the portfolio saved, or the system's when nothing usable is saved or the
 * browser refuses the page its storage, and sets it again whenever the system's changes, when the
 * portfolio saves a choice in another tab, and when the browser restores the page from its back and
 * forward cache, where a page hears no storage event. Where the browser cannot report the system's
 * scheme, with no matchMedia, one that throws, or a result whose matches throws, the script reads
 * it as light, as the portfolio's own script does. It listens for another tab's choice before
 * anything else, and for a change of scheme only where the browser offers addEventListener for it,
 * so an older browser still hears the other tab. Where the page names a theme color for each
 * scheme, two `meta[name="theme-color"]` with a `prefers-color-scheme` query before the script, it
 * points both at the ground of the theme it draws, on the first paint and on every change of the
 * root's theme, the switch's included, which it watches with a mutation observer, so the browser's
 * bar follows the theme rather than the system alone. With either meta missing or without content
 * it leaves them alone. It is written with var and a named catch, so an older engine still parses
 * it.
 */
export const themeScript = `(function () {
    var root = document.documentElement;
    var metas = [];
    var grounds = {};
    try {
        var found = document.querySelectorAll('meta[name="theme-color"][media]');
        for (var i = 0; i < found.length; i += 1) {
            var query = (found[i].getAttribute('media') || '').replace(/\\s/g, '');
            var content = found[i].getAttribute('content');
            if (!content) continue;
            if (query.indexOf('prefers-color-scheme:light') !== -1) grounds.light = content;
            else if (query.indexOf('prefers-color-scheme:dark') !== -1) grounds.dark = content;
            metas.push(found[i]);
        }
    } catch (error) {
        metas = [];
    }
    var paint = function () {
        if (!grounds.light || !grounds.dark) return;
        var ground = grounds[root.getAttribute('data-theme')];
        if (!ground) return;
        for (var j = 0; j < metas.length; j += 1) metas[j].setAttribute('content', ground);
    };
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
        paint();
    };
    apply();
    window.addEventListener('storage', function (event) {
        if (event.key === null || event.key === ${quoted(THEME_KEY)}) apply();
    });
    window.addEventListener('pageshow', function (event) {
        if (event.persisted) apply();
    });
    if (media && typeof media.addEventListener === 'function') {
        media.addEventListener('change', apply);
    }
    if (typeof MutationObserver === 'function') {
        new MutationObserver(paint).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    }
})();
`;
