import './state.js';

/*
 * What the kit's theme switch, copy button, stepper, toast, dialog, panel, table and status line
 * do, with moving focus after a change and on a view's arrival, the arrow keys in a group of cells,
 * a form's check and refusal, a busy button and progress, for a page to attach to the markup the
 * components draw or a page writes by hand. Each attach function finds its control's parts by their
 * classes, and `attachPanel` its panel by the id its button names. The switch, the copy button and
 * the stepper show their control, which the markup keeps hidden so a visitor without script meets
 * no control that does nothing, and return a function that takes it down again, as the table's, the
 * group's, the busy button's and progress's do. `attachToast` returns instead the function that
 * shows a message in it, `attachDialog` the function that opens it, `attachPanel` the functions
 * that open or close its panel and take its button down, `attachStatus` the function that says a
 * message, `attachForm` the function that refuses its form, and `moveFocus` and `focusOnArrival`
 * what call their request off. Nothing runs when the module is imported but listeners on the
 * document for keys, clicks and submits, in a page, which note whether the visitor's last input was
 * a press for `focusOnArrival`, and nothing here sets a style, so a page's policy can refuse every
 * style it did not serve.
 *
 * Each piece's code is a module of its own, which this one gathers, so a page's bundler can send a
 * piece only to the pages that import it. The state two pieces share, the presses, the focus
 * requests and the checked forms, is held in one module, so every part on a page reads one copy.
 */

export { attachBusy, type BusyOptions } from './busy.js';
export { attachCopyButton, type CopyOptions } from './copy.js';
export { attachDialog, type DialogOpener, type DialogOptions, type OpenDialog } from './dialog.js';
export { activeOf, type FocusTarget, type MoveFocusOptions } from './focus.js';
export {
    attachForm,
    type FailureWords,
    type FieldFailure,
    type FormOptions,
    type Refuse,
} from './form.js';
export { attachPanel, type PanelControl, type SetPanel } from './panel.js';
export { attachProgress, type ProgressOptions } from './progress.js';
export { type ArrivalOptions, focusOnArrival, moveFocus } from './request.js';
export { attachRoving, type RovingOptions, type RovingOrientation } from './roving.js';
export { attachStatus, type Say, type SayOptions } from './status.js';
export { attachStepper, type StepperOptions } from './stepper.js';
export { attachTable } from './table.js';
export type { AttachOptions } from './teardown.js';
export { attachThemeSwitch, chooseTheme } from './theme-switch.js';
export { attachToast, type ShowToast, type ToastAction } from './toast.js';
export type { Failure } from './words.js';
