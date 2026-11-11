import {
    Button,
    Callout,
    ChoiceField,
    CopyButton,
    CopyStatus,
    InputField,
    PortfolioStrip,
    SelectField,
    TextareaField,
    ThemeSwitch,
} from '@jasonsdevspace/design-kit/react';
import { type Theme, THEME_KEY, themeScript, THEMES } from '@jasonsdevspace/design-kit/theme';
import {
    browserFloor,
    lightningcssFloor,
    themeScriptHash,
    themeScriptPlugin,
} from '@jasonsdevspace/design-kit/vite';
import { createRef } from 'react';
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

// The switch, the copy button and the status line take a ref and a page's class.
export const switchRef = ThemeSwitch({ ref: createRef<HTMLDivElement>(), className: 'site' });
export const copyRef = CopyButton({ name: 'email', ref: createRef<HTMLButtonElement>() });
export const statusRef = CopyStatus({ ref: createRef<HTMLParagraphElement>() });

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
