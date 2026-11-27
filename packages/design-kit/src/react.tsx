export {
    type ArrivalKey,
    type FocusAfterDraw,
    StatusProvider,
    type StatusProviderProps,
    useArrivalFocus,
    useBusy,
    useFocusAfterDraw,
    useFormRefusal,
    useProgress,
    useRoving,
    useStatus,
} from './hooks.js';

/*
 * The kit's React entry, which gathers the hooks hooks.tsx gathers and the markup components, each
 * component, or the few that share their parts, a module of its own, so a site's bundler sends a
 * page only the markup and the hooks it uses, even where another page of the site uses the rest.
 * The components are the page chrome a demo draws around its page, a skip link, a strip above the
 * page that says whose demo it is and a footer below it, and the pieces on the page itself: the
 * button, the input, select and textarea fields, the checkbox field, the set of choices, the
 * callout, the theme switch, the copy button and its status line, the toast, the stepper and
 * progress. Each draws the markup components.css styles and nothing else, with no stylesheet of its
 * own and no style attribute, so a page without React writes the same markup by hand, and a page
 * whose policy allows styles only from its own origin draws it. A control's state is a native, ARIA
 * or data attribute, never a class of the kit's. A component trusts its types, and guards at run
 * time only where a value plain JavaScript can pass would become a class, an element or an
 * attribute of its own, as a callout's tone, heading level, role and live region would.
 */

export { Button, type ButtonProps } from './button.js';
export { Callout, type CalloutProps, type CalloutTone } from './callout.js';
export { CheckboxField, type CheckboxFieldProps } from './checkbox-field.js';
export {
    DemoFooter,
    type DemoFooterProps,
    GITHUB_PROFILE_URL,
    PORTFOLIO_URL,
    PORTFOLIO_WORK_URL,
    PortfolioStrip,
    type PortfolioStripProps,
    SkipLink,
    type SkipLinkProps,
} from './chrome.js';
export {
    type Choice,
    ChoiceField,
    type ChoiceFieldProps,
    InputField,
    type InputFieldProps,
    SelectField,
    type SelectFieldProps,
    TextareaField,
    type TextareaFieldProps,
    ValueField,
    type ValueFieldProps,
} from './fields.js';
export {
    CopyButton,
    type CopyButtonProps,
    CopyStatus,
    type CopyStatusProps,
    Progress,
    type ProgressProps,
    StatusLine,
    type StatusLineProps,
} from './status-views.js';
export { StepperField, type StepperFieldProps } from './stepper-field.js';
export { ThemeSwitch, type ThemeSwitchProps } from './theme-choice.js';
export { Toast, type ToastProps } from './toast-view.js';
