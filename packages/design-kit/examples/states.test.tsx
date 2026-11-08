import { readFileSync } from 'node:fs';

import { format, resolveConfig } from 'prettier';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import * as kit from '../src/react.js';
import { CHROME, EXPLAINER } from './pieces.js';
import { CONTROLS } from './states.js';

/*
 * The states a page shows, of the controls, the page chrome and an explainer's pieces, drawn from
 * the kit's sources: each one draws the attribute the page prints under it, and the modules take
 * their components rather than importing them, so a page can draw the states from the version of
 * the kit it pins.
 */

const states = [...CONTROLS, ...CHROME, ...EXPLAINER].flatMap((control) => control.states);

/** A value an attribute of the React shown is written with: a string, true, false or an element. */
type Value = string | boolean | React.ReactElement;

/**
 * The React a page writes for a state, read by TypeScript's parser and built as an element with the
 * kit's components and the DOM's own elements, without running it as code. It reads what the
 * states write: string, boolean and element attributes, and text and elements as children.
 */
const elementOf = (react: string): React.ReactElement => {
    const file = ts.createSourceFile('state.tsx', `(${react});`, ts.ScriptTarget.Latest, true);
    const valueOf = (node: ts.Node): Value => {
        if (ts.isParenthesizedExpression(node)) return valueOf(node.expression);
        if (ts.isStringLiteral(node)) return node.text;
        if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
        if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
        if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) return build(node);
        throw new Error(`the React shown writes what this test cannot read: ${node.getText()}`);
    };
    const build = (node: ts.JsxElement | ts.JsxSelfClosingElement): React.ReactElement => {
        const opening = ts.isJsxElement(node) ? node.openingElement : node;
        const tag = opening.tagName.getText();
        const component = (kit as Record<string, unknown>)[tag];
        const type = /^[A-Z]/.test(tag) ? component : tag;
        if (type === undefined) throw new Error(`the kit has no ${tag}`);
        const props: Record<string, Value> = {};
        for (const attribute of opening.attributes.properties) {
            if (!ts.isJsxAttribute(attribute)) throw new Error('a spread cannot be read');
            const { initializer } = attribute;
            props[attribute.name.getText()] =
                initializer === undefined
                    ? true
                    : ts.isJsxExpression(initializer) && initializer.expression
                      ? valueOf(initializer.expression)
                      : valueOf(initializer);
        }
        const children = ts.isJsxElement(node)
            ? node.children.flatMap((child): Value[] => {
                  if (ts.isJsxText(child)) {
                      const text = child.text.replaceAll(/\s*\n\s*/g, ' ').trim();
                      return text === '' ? [] : [text];
                  }
                  if (ts.isJsxExpression(child) && child.expression)
                      return [valueOf(child.expression)];
                  return [valueOf(child)];
              })
            : [];
        return React.createElement(
            type as React.ElementType,
            props,
            ...(children as React.ReactNode[])
        );
    };
    const [statement] = file.statements;
    if (statement === undefined || !ts.isExpressionStatement(statement)) {
        throw new Error('the React shown is not one element');
    }
    return valueOf(statement.expression) as React.ReactElement;
};

describe('the states a page shows', () => {
    it('each draw the attribute printed under them', () => {
        expect(states.length).toBeGreaterThan(0);
        for (const state of states) {
            const markup = renderToStaticMarkup(state.draw(kit, (name) => name));
            // An attribute with a value is found whole, its closing quote included, and one with
            // none by its own name, not as the end of another such as aria-disabled.
            const drawn = state.attribute.includes('=')
                ? markup.includes(` ${state.attribute}`)
                : new RegExp(`(?<![-\\w])${state.attribute}(=""|[\\s/>])`).test(markup);
            expect(drawn, `${state.name}: ${state.attribute}`).toBe(true);
        }
    });

    it('draw what the React shown beside them draws', () => {
        const shown = states.filter((state) => state.react !== undefined);
        expect(shown.length).toBeGreaterThan(0);
        for (const state of shown) {
            expect(renderToStaticMarkup(elementOf(state.react ?? '')), state.name).toBe(
                renderToStaticMarkup(state.draw(kit, (name) => name))
            );
        }
    });

    it('show their React laid out as the repository lays out code', async () => {
        const config = (await resolveConfig(import.meta.filename)) ?? {};
        for (const state of states.filter((each) => each.react !== undefined)) {
            const laid = await format(`${state.react ?? ''};`, { ...config, parser: 'typescript' });
            expect(state.react, state.name).toBe(laid.trimEnd().replace(/;$/, ''));
        }
    });

    it('give each copy ids of its own', () => {
        // The live copy, the picture in the visitor's theme and the copy in the other theme, as
        // the site names their ids.
        const suffixes = ['', '-yours', '-other'];
        for (const state of states) {
            const ids = suffixes.flatMap((suffix) =>
                [
                    ...renderToStaticMarkup(state.draw(kit, (name) => `${name}${suffix}`)).matchAll(
                        / id="([^"]+)"/g
                    ),
                ].map((match) => match[1] ?? '')
            );
            expect(
                ids.filter((id, index) => ids.indexOf(id) !== index),
                state.name
            ).toEqual([]);
        }
    });

    it('import nothing of the kit but its types', () => {
        for (const module of ['states.tsx', 'pieces.tsx']) {
            const source = readFileSync(new URL(module, import.meta.url), 'utf8');
            // Every import, however it is wrapped: React's types, and the kit's by any path or
            // name.
            const imports = [...source.matchAll(/^import\s+([\s\S]*?)\s+from\s+'([^']+)';/gm)];
            const fromKit = imports.filter(([, , from]) => from !== 'react');
            expect(fromKit.length, module).toBeGreaterThan(0);
            expect(
                fromKit.filter(([, what]) => !what?.startsWith('type ')),
                module
            ).toEqual([]);
        }
    });
});
