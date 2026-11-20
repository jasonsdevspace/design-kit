import {
    Button,
    Callout,
    ChoiceField,
    CopyButton,
    CopyStatus,
    InputField,
    PortfolioStrip,
    Progress,
    SelectField,
    StatusLine,
    StepperField,
    TextareaField,
    type ArrivalKey,
    type FocusAfterDraw,
    type ProgressProps,
    StatusProvider,
    type StatusProviderProps as ProviderProps,
    ThemeSwitch,
    Toast,
    useArrivalFocus,
    useBusy,
    useFocusAfterDraw,
    useFormRefusal,
    useProgress,
    useRoving,
    useStatus,
} from '@jasonsdevspace/design-kit/react';
import {
    attachBusy,
    attachForm,
    type Failure,
    type FailureWords,
    type FieldFailure,
    attachPanel,
    attachProgress,
    attachRoving,
    attachStatus,
    attachStepper,
    focusOnArrival,
    moveFocus,
    type ArrivalOptions,
    type BusyOptions,
    type FocusTarget,
    type FormOptions,
    type MoveFocusOptions,
    type PanelControl,
    type ProgressOptions,
    type Refuse,
    type RovingOptions,
    type RovingOrientation,
    type Say,
    type SayOptions,
    type SetPanel,
    type StepperOptions,
} from '@jasonsdevspace/design-kit/controls';
import { type Theme, THEME_KEY, themeScript, THEMES } from '@jasonsdevspace/design-kit/theme';
import {
    browserFloor,
    lightningcssFloor,
    themeScriptHash,
    themeScriptPlugin,
} from '@jasonsdevspace/design-kit/vite';
import { createElement, createRef, type RefCallback } from 'react';
import type { UserConfig } from 'vite';

/*
 * Compiled in the same empty project as consumer.mjs, against the installed package, once as Node
 * resolves it and once as a bundler does. It fails if the types do not ship or do not resolve, or
 * if a theme's type, the plugin's or a component's props have quietly become `any`. Declaration
 * files are skipped, since the plugin's types name Vite's, and Vite's own need Node's types and a
 * newer library than this check compiles against.
 */

export const first: Theme = THEMES[0];
export const key: string = THEME_KEY;
export const inline: string = `<script>${themeScript}</script>`;
export const source: string = themeScriptHash;

// The floor goes straight into a Vite build's target, and into Lightning CSS's targets.
export const config: UserConfig = {
    build: { target: browserFloor() },
    css: { transformer: 'lightningcss', lightningcss: { targets: lightningcssFloor() } },
};

// @ts-expect-error The floor is a list of strings, so its entries are real rather than `any`.
export const notATarget: number = browserFloor()[0];

// @ts-expect-error A theme is light or dark, so the types are real rather than `any`.
export const wrong: Theme = 'sepia';

// @ts-expect-error The plugin is a Vite plugin, so its name is a string rather than `any`.
export const notAName: number = themeScriptPlugin().name;

// @ts-expect-error The strip needs the demo's explainer and source, so its props are real too.
export const stripWithout = PortfolioStrip({});

// @ts-expect-error Switches in the strip need the name their landmark is read by.
export const unnamedTools = PortfolioStrip({ about: './about/', source: './', tools: 'Tour' });
export const namedTools = PortfolioStrip({
    about: './about/',
    source: './',
    tools: 'Tour',
    toolsLabel: 'Settings',
});

// The switch, the copy button, the status line and the toast take a ref and a page's class.
export const switchRef = ThemeSwitch({ ref: createRef<HTMLDivElement>(), className: 'site' });
export const copyRef = CopyButton({ name: 'email', ref: createRef<HTMLButtonElement>() });
export const statusRef = CopyStatus({ ref: createRef<HTMLParagraphElement>() });
export const lineRef = StatusLine({ ref: createRef<HTMLParagraphElement>(), className: 'screen' });
export const toastRef = Toast({ ref: createRef<HTMLDivElement>(), className: 'site' });
// A label that is more than words needs a subject, so the buttons are named for their field.
const boldLabel = createElement('b', null, 'Bid');
// @ts-expect-error The buttons would be named Lower and Raise alone.
export const unnamedStepper = StepperField({ label: boldLabel, min: 0, max: 10 });
export const namedStepper = StepperField({ label: boldLabel, subject: 'the bid', min: 0, max: 10 });
export const stepperRef = StepperField({
    label: 'Bid',
    min: 0,
    max: 10,
    ref: createRef<HTMLInputElement>(),
});

// @ts-expect-error A copy button's ref is the button drawn, not some other element.
export const wrongCopy = CopyButton({ name: 'email', ref: createRef<HTMLDivElement>() });

// @ts-expect-error A field needs its label, so its props are real too.
export const fieldWithout = InputField({});

// @ts-expect-error The one action a view leads with is not a switch.
export const accentToggle = Button({ accent: true, pressed: true });

// @ts-expect-error The one action a view leads with is not drawn as a link.
export const accentText = Button({ accent: true, text: true });

// A large button and a text button take their props, and a wrapper can hand each on as undefined.
const grown: boolean | undefined = undefined;
export const wayIn = Button({ large: grown, children: 'Try it' });
export const link = Button({ text: true, children: 'Show the markup' });
export const linkOrNot = Button({ text: grown, children: 'Show the markup' });

// @ts-expect-error A text button is not a toggle.
export const textToggle = Button({ text: true, pressed: true });

// @ts-expect-error A text button is not large.
export const textLarge = Button({ text: true, large: true });

// A quiet button is a text button, and a wrapper can hand its prop on.
export const close = Button({ text: true, quiet: true, children: 'Close' });
export const closeOrNot = Button({ text: true, quiet: grown, children: 'Close' });

// @ts-expect-error A quiet button is a text button.
export const quietAlone = Button({ quiet: true });

// @ts-expect-error A Close always closes, so a quiet button is never off.
export const quietOff = Button({ text: true, quiet: true, off: true });

// A tall button takes its prop alone or with the large button's, and a wrapper can hand it on.
export const tallLead = Button({
    tall: true,
    large: grown,
    accent: true,
    children: 'Save the round',
});

// @ts-expect-error A text button is not tall.
export const textTall = Button({ text: true, tall: true });

// A page moves focus to a button through its ref, which the props name as the button drawn.
export const opener = Button({ ref: createRef<HTMLButtonElement>(), children: 'Tour' });

// @ts-expect-error A button's ref is the button drawn, not some other element.
export const wrongRef = Button({ ref: createRef<HTMLInputElement>(), children: 'Tour' });

// A page moves focus to a field through its ref, which the props name as the control drawn.
export const nameField = InputField({ ref: createRef<HTMLInputElement>(), label: 'Name' });
export const sizeField = SelectField({ ref: createRef<HTMLSelectElement>(), label: 'Size' });
export const noteField = TextareaField({ ref: createRef<HTMLTextAreaElement>(), label: 'Note' });

// @ts-expect-error A textarea field's ref is the textarea drawn, not some other element.
export const wrongNote = TextareaField({ ref: createRef<HTMLInputElement>(), label: 'Note' });

// @ts-expect-error An input field's ref is the input drawn, not some other element.
export const wrongField = InputField({ ref: createRef<HTMLSelectElement>(), label: 'Name' });

// @ts-expect-error A select field's ref is the select drawn, not some other element.
export const wrongSelect = SelectField({ ref: createRef<HTMLInputElement>(), label: 'Size' });

// A choice field needs its name and its choices beside its label, and its ref is the fieldset drawn.
export const rules = ChoiceField({
    ref: createRef<HTMLFieldSetElement>(),
    label: 'Rule',
    name: 'rule',
    choices: [{ value: 'pin', label: 'Pin' }],
});

// @ts-expect-error A choice field needs its choices, so its props are real too.
export const choicesWithout = ChoiceField({ label: 'Rule', name: 'rule' });

export const roledChoices = ChoiceField({
    label: 'Rule',
    name: 'rule',
    choices: [],
    // @ts-expect-error The set's role follows its type.
    role: 'group',
});

export const wrongChoices = ChoiceField({
    // @ts-expect-error A choice field's ref is the fieldset drawn, not a control.
    ref: createRef<HTMLInputElement>(),
    label: 'Rule',
    name: 'rule',
    choices: [],
});

// @ts-expect-error A callout's tone is one of four.
export const loud = Callout({ tone: 'sepia' });

// A wrapper hands on an optional prop it may not have been given, as undefined, and it compiles.
const given: 'about' | undefined = undefined;
export const handedOn = PortfolioStrip({ about: './about/', source: './', current: given });

// A callout takes an id, a page's class and a ref, as a button and a field do.
export const summary = Callout({
    ref: createRef<HTMLDivElement>(),
    id: 'problems',
    className: 'summary',
    title: 'Two problems',
});

// A wrapper hands on a button's accent as it got it, and it compiles.
const lead: true | undefined = undefined;
export const handedAccent = Button({ accent: lead, children: 'Save rule' });

// A panel's button returns the set that opens or closes the panel and the detach that lets it go.
export const panelOf = (button: HTMLButtonElement): PanelControl => attachPanel(button);
export const setOf = (button: HTMLButtonElement): SetPanel => attachPanel(button).set;

// @ts-expect-error A panel opens or closes by a boolean.
export const setByWord = (set: SetPanel) => set('open');

// A stepper takes a page's own line and its words after the value, and returns what takes it away.
const tricks: StepperOptions = { status: null, words: (value: string) => `${value} in all.` };
export const stepperOf = (stepper: HTMLElement): (() => void) => attachStepper(stepper, tricks);

// A stepper's line and words may be undefined, as a page's optional ones are, and it speaks
// through a page's own say.
export const stepperSaying = (
    stepper: HTMLElement,
    line: HTMLElement | undefined,
    words: ((value: string) => string) | undefined,
    say: Say
): (() => void) => attachStepper(stepper, { status: line, words, say });

// A status line says at once, or waits for its words to settle, and says nothing back.
export const sayOf = (line: HTMLElement): Say => attachStatus(line);
export const settled = (say: Say): void => {
    say('3 tricks still to enter.', { settle: 700 });
};

// @ts-expect-error A settle is a number of milliseconds.
export const settledByWord = (say: Say) => say('Saved.', { settle: 'soon' });

// Focus moves to an element or an id, with fallbacks, and the request can be called off.
export const cancelOf = (heading: HTMLElement): (() => void) =>
    moveFocus('remove-ben', { fallbacks: [heading, null] });

// A view's heading takes focus on an arrival a press brought, from where focus was as it began.
export const arrivalOf = (heading: HTMLElement, from: Element | null): (() => void) =>
    focusOnArrival(() => heading, { from });

// A view drawn before that changed on a press takes focus whatever the last input was.
export const changedOf = (heading: HTMLElement): (() => void) =>
    focusOnArrival(heading, { changed: true, fallbacks: [null] });

// A form refused once its errors are drawn, said on a line or through a page's own say.
export const refuseOf = (form: HTMLElement, line: HTMLElement): Refuse =>
    attachForm(form, { status: line, summary: () => null });

// A form's failures take the page's words, or go to a page that draws them itself.
export const checkedOf = (form: HTMLFormElement, words: FailureWords): Refuse =>
    attachForm(form, {
        errorWords: { ...words, rangeUnderflow: (control) => `At least ${control.id}.` },
        invalid: (failures: readonly FieldFailure[]) => {
            const first: Failure | undefined = failures[0]?.failure;
            void first;
        },
    });

// @ts-expect-error A failure is named as validity names it.
export const misnamed: FailureWords = { missing: 'Enter it.' };

// A group of cells takes its orientation, its current cell and what to do as focus moves.
const tabs: RovingOptions = {
    orientation: 'horizontal',
    current: () => null,
    onMove: () => undefined,
};
export const rovingOf = (group: HTMLElement): (() => void) => attachRoving(group, tabs);

// @ts-expect-error A group is laid out as a grid, a row or a column.
export const diagonal: RovingOptions = { orientation: 'diagonal' };

// A button is busy with words of its own or with the default, and its attach says them.
export const busyNamed = Button({ busy: 'Saving the rule.', children: 'Save rule' });
export const busyPlain = Button({ busy: true, children: 'Save rule' });
const quiet: BusyOptions = { status: null };
export const busyOf = (button: HTMLElement): (() => void) => attachBusy(button, quiet);

// Progress has a label, an amount out of a whole and words, and its attach says it at steps.
export const importing = Progress({
    label: 'Importing products',
    value: 12,
    max: 40,
    words: '12 of 40',
});
export const waiting = Progress({ label: 'Importing products' });
const quarters: ProgressOptions = { steps: 4, done: 'Imported 40 products.', status: null };
export const progressOf = (bar: HTMLProgressElement): (() => void) => attachProgress(bar, quarters);

// @ts-expect-error Progress is named by its label.
export const unnamed = Progress({ value: 1, words: '1 of 1' });

// @ts-expect-error A bar with an amount carries the words that say it.
export const unsaid = Progress({ label: 'Importing products', value: 12, max: 40 });

// A field is marked required or optional in words, apart from the native required.
export const markedField = InputField({ label: 'Rule name', mark: 'required', required: true });

// @ts-expect-error A field's mark is required or optional.
export const wrongMark = InputField({ label: 'Rule name', mark: 'needed' });

// A select can be read only, drawn as a field with the chosen option's words.
export const fixedGame = SelectField({
    label: 'Game',
    name: 'game',
    defaultValue: 'wizard',
    readOnly: true,
    children: 'Wizard',
});

// Each hook as a component calls it, typed as the packed types give it, so a missing or broken
// hooks module fails here rather than reading as any.
export const HookTypes = (children: ProviderProps['children']): readonly unknown[] => {
    const say: Say = useStatus();
    say('Saved.', { settle: 400, polite: true });
    const focusNext: FocusAfterDraw = useFocusAfterDraw();
    const moveOptions: MoveFocusOptions = { fallbacks: ['players', null], from: null };
    const target: FocusTarget = 'next';
    const cancel: () => void = focusNext(target, moveOptions);
    const key: ArrivalKey = 3;
    const heading: RefCallback<HTMLHeadingElement> = useArrivalFocus<HTMLHeadingElement>(key);
    const formOptions: FormOptions = { summary: () => null };
    const [form, refuse]: readonly [RefCallback<HTMLFormElement>, Refuse] =
        useFormRefusal<HTMLFormElement>({
            invalid: (failures: readonly FieldFailure[]) => failures.map(({ field }) => field.id),
            errorWords: { valueMissing: 'Enter your name.' },
        });
    const orientation: RovingOrientation = 'grid';
    const group: RefCallback<HTMLDivElement> = useRoving<HTMLDivElement>({ orientation });
    const busy: RefCallback<HTMLButtonElement> = useBusy<HTMLButtonElement>();
    const bar: RefCallback<HTMLProgressElement> = useProgress({ steps: 4, done: 'Done.' });
    const provided = StatusProvider({ children });
    const sayOptions: SayOptions = { polite: true };
    const arrival: ArrivalOptions = { changed: true };
    const progressed: ProgressProps = { label: 'Importing', value: 1, max: 4, words: '1 of 4' };
    return [
        cancel,
        heading,
        formOptions,
        form,
        refuse,
        group,
        busy,
        bar,
        provided,
        sayOptions,
        arrival,
        progressed,
    ];
};

// @ts-expect-error The form's refusal asks for invalid, since the page draws the errors in React.
export const refusalWithout = () => useFormRefusal<HTMLFormElement>({});

// @ts-expect-error A group of cells is laid out as a grid, a row or a column, and nothing else.
export const rovingDiagonal = () => useRoving({ orientation: 'diagonal' });
