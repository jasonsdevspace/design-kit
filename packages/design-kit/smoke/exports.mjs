/**
 * Every value each of the package's modules exports, by the name a page imports it by. A type
 * export is erased from the build, so it is not here. The package's tests compare this with the
 * source's exports, so a new export cannot ship without the smoke test seeing it.
 */
export const VALUE_EXPORTS = {
    '@jasonsdevspace/design-kit/react': [
        'DemoFooter',
        'GITHUB_PROFILE_URL',
        'PORTFOLIO_URL',
        'PORTFOLIO_WORK_URL',
        'PortfolioStrip',
        'SkipLink',
    ],
    '@jasonsdevspace/design-kit/theme': ['THEMES', 'THEME_KEY', 'themeScript'],
    '@jasonsdevspace/design-kit/vite': [
        'THEME_PLACEHOLDER',
        'themeScriptHash',
        'themeScriptPlugin',
    ],
};

/** The sheets the package exports, by the name a page imports each by. */
export const SHEETS = [
    '@jasonsdevspace/design-kit/tokens.css',
    '@jasonsdevspace/design-kit/base.css',
    '@jasonsdevspace/design-kit/components.css',
];
