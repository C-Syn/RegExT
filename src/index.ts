import pkg from "regexp-tree"
const { traverse, transform } = pkg
import { Alternative, Char } from "regexp-tree/ast"

const types = ["Mustache", "plain"] as const
type Type = (typeof types)[number]

/**
 * A class that represents a regular expression as a template string
 * @param regexp - The regular expression to convert
 * @param type - The type of template string to create
 */
export default class RegExT {
  public regexp: RegExp
  public type: Type
  public template: string

  constructor(regexp: RegExp, type: Type) {
    this.regexp = regexp
    this.type = type
    this.template = convert(regexp, type)
  }

  toString(): string {
    return this.template
  }
}

/**
 * Convert a regular expression to a template string
 * @param regexp - The regular expression to convert
 * @param type - The type of template string to convert to
 * @returns The template string
 */
export function convert(regexp: RegExp, type: Type) {
  if (!types.includes(type)) {
    type = "Mustache"
  }
  const ast = transform(regexp, {
    // Remove certain types of nodes from the AST
    "*": function (path) {
      if (
        path.node.type === "ClassRange" ||
        path.node.type === "Disjunction" ||
        path.node.type === "Assertion" ||
        (path.node.type === "CharacterClass" && path.node.negative)
      ) {
        path.remove()
      }
    },
    // Replace capturing groups with template strings
    Group(path) {
      const { node } = path
      if (node.capturing) {
        switch (type) {
          case "Mustache":
            path.replace(createCharNode(`{{${node.name || node.number}}}`))
            break
          case "plain":
            path.replace(createCharNode(`${node.name || node.number}`))
            break
        }
      }
    },
    // Change Repetition node to Alternative node with n repetitions of the expression
    Repetition(path) {
      const { node } = path
      if (node.quantifier.kind === "Range") {
        if (node.quantifier.to === node.quantifier.from) {
          path.replace({
            type: "Alternative",
            expressions: Array(node.quantifier.to).fill(node.expression)
          } as Alternative)
        }
      }
    },
    // Add template strings to alternatives that contain capturing groups
    Alternative(path) {
      const { node, parentPath } = path
      if (!parentPath?.parentPath?.parentPath) {
        return // Ignore the root node
      }
      let capturing: string | number | null = null

      for (let i = 0; i < node.expressions.length; i++) {
        const expression = node.expressions[i]
        if (expression.type === "Group") {
          if (expression.capturing) {
            capturing = expression.name || expression.number
            break
          }
        }
      }
      if (capturing) {
        switch (type) {
          case "Mustache":
            node.expressions.unshift(createCharNode(`{{#${capturing}}}`))
            node.expressions.push(createCharNode(`{{/${capturing}}}`))
            break
        }
      }
    }
  })

  // Convert the AST to a template string
  let template = ""
  traverse(ast.getAST(), {
    Char({ node }) {
      template += node.value
    }
  })

  return template
}

// Helper function to create a Char node
const createCharNode = (value: string) =>
  ({
    type: "Char",
    value,
    kind: "simple",
    codePoint: NaN
  }) as Char
