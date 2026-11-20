import { builtinRules } from 'eslint/use-at-your-own-risk';
import type { Rule, Scope, SourceCode } from 'eslint';

function functionLengthRule() {
  const rule = builtinRules.get('max-lines-per-function');
  if (!rule) throw new Error('ESLint must provide the function-length rule.');
  return rule;
}

const coreFunctionLength = functionLengthRule();

function isVitestSuite(node: Rule.Node, source: SourceCode): boolean {
  const call = node.parent;
  if (call?.type !== 'CallExpression' || call.callee.type !== 'Identifier') return false;
  if (call.arguments.at(-1) !== node) return false;
  const name = call.callee.name;
  for (let scope: Scope.Scope | null = source.getScope(node); scope; scope = scope.upper) {
    const binding = scope.variables.find((variable) => variable.name === name);
    if (!binding) continue;
    return binding.defs.some(
      (definition) =>
        definition.type === 'ImportBinding' &&
        definition.parent.source.value === 'vitest' &&
        definition.node.type === 'ImportSpecifier' &&
        definition.node.imported.type === 'Identifier' &&
        definition.node.imported.name === 'describe',
    );
  }
  return false;
}

/** Reuse ESLint's metric; only declarative Vitest suite containers are exempt. */
export const testFunctionLength: Rule.RuleModule = {
  ...coreFunctionLength,
  create(context) {
    const listeners = coreFunctionLength.create(context);
    const { FunctionDeclaration, FunctionExpression, ArrowFunctionExpression } = listeners;
    if (
      !FunctionDeclaration ||
      !FunctionExpression ||
      !ArrowFunctionExpression ||
      Object.keys(listeners).length !== 3
    ) {
      throw new Error('Review the changed ESLint function-length listeners before use.');
    }
    return {
      FunctionDeclaration,
      FunctionExpression(node) {
        if (!isVitestSuite(node, context.sourceCode)) FunctionExpression(node);
      },
      ArrowFunctionExpression(node) {
        if (!isVitestSuite(node, context.sourceCode)) ArrowFunctionExpression(node);
      },
    };
  },
};
