import * as React from 'react';
import ts from 'typescript';

/**
 * A value an attribute of the React shown is written with: a string, a number, true, false, an
 * element, or a list or an object of those, as a choice field's choices are.
 */
type Value = string | number | boolean | React.ReactElement | readonly Value[] | Values;
interface Values {
    readonly [key: string]: Value;
}

/**
 * The React a page writes for a state, read by TypeScript's parser and built as an element with the
 * components it is given and the DOM's own elements, without running it as code. It reads what the
 * states write: string, number, boolean and element attributes, lists and objects of those, text
 * and elements as children, and fragments. The kit's tests build it with the sources' components,
 * and the site's with the version it pins.
 */
export const elementOf = (react: string, kit: object): React.ReactElement => {
    const file = ts.createSourceFile('state.tsx', `(${react});`, ts.ScriptTarget.Latest, true);
    const valueOf = (node: ts.Node): Value => {
        if (ts.isParenthesizedExpression(node)) return valueOf(node.expression);
        if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
        if (ts.isNumericLiteral(node)) return Number(node.text);
        if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
        if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
        if (ts.isArrayLiteralExpression(node)) return node.elements.map(valueOf);
        if (ts.isObjectLiteralExpression(node)) {
            return Object.fromEntries(
                node.properties.map((property) => {
                    if (!ts.isPropertyAssignment(property)) {
                        throw new Error(`a property this test cannot read: ${property.getText()}`);
                    }
                    const key = ts.isStringLiteral(property.name)
                        ? property.name.text
                        : property.name.getText();
                    return [key, valueOf(property.initializer)];
                })
            );
        }
        if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) return build(node);
        if (ts.isJsxFragment(node)) {
            return React.createElement(React.Fragment, null, ...childrenOf(node.children));
        }
        throw new Error(`the React shown writes what this test cannot read: ${node.getText()}`);
    };
    /** The children of an element or a fragment: its text with the layout's breaks dropped. */
    const childrenOf = (children: ts.NodeArray<ts.JsxChild>): React.ReactNode[] =>
        children.flatMap((child): React.ReactNode[] => {
            if (ts.isJsxText(child)) {
                const text = child.text.replaceAll(/\s*\n\s*/g, ' ').trim();
                return text === '' ? [] : [text];
            }
            if (ts.isJsxExpression(child))
                return child.expression ? [valueOf(child.expression) as React.ReactNode] : [];
            return [valueOf(child) as React.ReactNode];
        });
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
        const children = ts.isJsxElement(node) ? childrenOf(node.children) : [];
        return React.createElement(type as React.ElementType, props, ...children);
    };
    const [statement] = file.statements;
    if (statement === undefined || !ts.isExpressionStatement(statement)) {
        throw new Error('the React shown is not one element');
    }
    return valueOf(statement.expression) as React.ReactElement;
};
