// Compiled in the same empty project as consumer.mjs, against the installed package, once as Node
// resolves it and once as a bundler does. It fails if the types do not ship or do not resolve, or
// if a theme's type or the plugin's has quietly become `any`. Declaration files are skipped, since
// the plugin's types name Vite's, and Vite's own need Node's types and a newer library than this
// check compiles against.
import { type Theme, THEME_KEY, themeScript, THEMES } from '@jasonsdevspace/design-kit/theme';
import { themeScriptHash, themeScriptPlugin } from '@jasonsdevspace/design-kit/vite';

export const first: Theme = THEMES[0];
export const key: string = THEME_KEY;
export const inline: string = `<script>${themeScript}</script>`;
export const source: string = themeScriptHash;

// @ts-expect-error A theme is light or dark, so the types are real rather than `any`.
export const wrong: Theme = 'sepia';

// @ts-expect-error The plugin is a Vite plugin, so its name is a string rather than `any`.
export const notAName: number = themeScriptPlugin().name;
