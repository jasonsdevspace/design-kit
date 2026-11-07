// Compiled in the same empty project as consumer.mjs, against the installed package, once as Node
// resolves it and once as a bundler does. It fails if the types do not ship or do not resolve, or
// if a theme's type, the plugin's or a component's props have quietly become `any`. Declaration
// files are skipped, since the plugin's types name Vite's, and Vite's own need Node's types and a
// newer library than this check compiles against.
import {
    Button,
    Callout,
    InputField,
    PortfolioStrip,
    SelectField,
} from '@jasonsdevspace/design-kit/react';
import { type Theme, THEME_KEY, themeScript, THEMES } from '@jasonsdevspace/design-kit/theme';
import { themeScriptHash, themeScriptPlugin } from '@jasonsdevspace/design-kit/vite';
import { createRef } from 'react';

export const first: Theme = THEMES[0];
export const key: string = THEME_KEY;
export const inline: string = `<script>${themeScript}</script>`;
export const source: string = themeScriptHash;

// @ts-expect-error A theme is light or dark, so the types are real rather than `any`.
export const wrong: Theme = 'sepia';

// @ts-expect-error The plugin is a Vite plugin, so its name is a string rather than `any`.
export const notAName: number = themeScriptPlugin().name;

// @ts-expect-error The strip needs the demo's explainer and source, so its props are real too.
export const stripWithout = PortfolioStrip({});

// @ts-expect-error A field needs its label, so its props are real too.
export const fieldWithout = InputField({});

// @ts-expect-error The one action a view leads with is not a switch.
export const accentToggle = Button({ accent: true, pressed: true });

// A page moves focus to a button through its ref, which the props name as the button drawn.
export const opener = Button({ ref: createRef<HTMLButtonElement>(), children: 'Tour' });

// @ts-expect-error A button's ref is the button drawn, not some other element.
export const wrongRef = Button({ ref: createRef<HTMLInputElement>(), children: 'Tour' });

// A page moves focus to a field through its ref, which the props name as the control drawn.
export const nameField = InputField({ ref: createRef<HTMLInputElement>(), label: 'Name' });
export const sizeField = SelectField({ ref: createRef<HTMLSelectElement>(), label: 'Size' });

// @ts-expect-error An input field's ref is the input drawn, not some other element.
export const wrongField = InputField({ ref: createRef<HTMLSelectElement>(), label: 'Name' });

// @ts-expect-error A select field's ref is the select drawn, not some other element.
export const wrongSelect = SelectField({ ref: createRef<HTMLInputElement>(), label: 'Size' });

// @ts-expect-error A callout's tone is one of three.
export const loud = Callout({ tone: 'warning' });
