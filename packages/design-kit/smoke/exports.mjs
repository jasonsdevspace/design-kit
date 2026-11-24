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
        'Progress',
        'SelectField',
        'SkipLink',
        'StatusLine',
        'StatusProvider',
        'StepperField',
        'TextareaField',
        'ThemeSwitch',
        'Toast',
        'useArrivalFocus',
        'useBusy',
        'useFocusAfterDraw',
        'useFormRefusal',
        'useProgress',
        'useRoving',
        'useStatus',
        'ValueField',
    ],
    '@jasonsdevspace/design-kit/theme': ['THEME_CHOICES', 'THEMES', 'THEME_KEY', 'themeScript'],
    '@jasonsdevspace/design-kit/controls': [
        'activeOf',
        'attachBusy',
        'attachCopyButton',
        'attachDialog',
        'attachForm',
        'attachPanel',
        'attachProgress',
        'attachRoving',
        'attachStatus',
        'attachStepper',
        'attachTable',
        'attachThemeSwitch',
        'attachToast',
        'chooseTheme',
        'focusOnArrival',
        'moveFocus',
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

/** The tokens in the design tokens format, as a tool that reads that format imports them. */
export const TOKENS_FORMAT = '@jasonsdevspace/design-kit/tokens.resolver.json';
