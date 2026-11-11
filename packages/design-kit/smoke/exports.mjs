/**
 * Every value each of the package's modules exports, by the name a page imports it by. A type
 * export is erased from the build, so it is not here. The package's tests compare this with the
 * source's exports, so a new export cannot ship without the smoke test seeing it.
 */
export const VALUE_EXPORTS = {
    '@jasonsdevspace/design-kit/react': [
        'Button',
        'Callout',
        'ChoiceField',
        'CopyButton',
        'CopyStatus',
        'DemoFooter',
        'GITHUB_PROFILE_URL',
        'InputField',
        'PORTFOLIO_URL',
        'PORTFOLIO_WORK_URL',
        'PortfolioStrip',
        'SelectField',
        'SkipLink',
        'StepperField',
        'TextareaField',
        'ThemeSwitch',
        'Toast',
    ],
    '@jasonsdevspace/design-kit/theme': ['THEME_CHOICES', 'THEMES', 'THEME_KEY', 'themeScript'],
    '@jasonsdevspace/design-kit/controls': [
        'attachCopyButton',
        'attachStepper',
        'attachThemeSwitch',
        'attachToast',
        'chooseTheme',
    ],
    '@jasonsdevspace/design-kit/vite': [
        'browserFloor',
        'lightningcssFloor',
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
