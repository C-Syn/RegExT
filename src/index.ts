import pkg from "regexp-tree"
const { traverse, transform } = pkg
import { Char } from "regexp-tree/ast"

/**
 * A class that represents a regular expression as a template string
 * @param regexp - The regular expression to convert
 * @param type - The type of template string to create
 */
export default class RegExT {
  public regexp: RegExp
  public type: "Mustache" | "plain"
  public template: string

  constructor(regexp: RegExp, type: "Mustache" | "plain" = "Mustache") {
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
export function convert(regexp: RegExp, type: "Mustache" | "plain" = "Mustache") {
  const ast = transform(regexp, {
    // Remove certain types of nodes from the AST
    "*": function (path) {
      const type = path.node.type
      if (type === "CharacterClass" || type === "Disjunction" || type === "Assertion") {
        path.remove()
      }
    },
    // Replace capturing groups with template strings
    Group(path) {
      const { node } = path
      if (node.capturing) {
        if (type === "Mustache") {
          path.replace(createCharNode(`{{${node.name || node.number}}}`))
        } else {
          path.replace(createCharNode(`${node.name || node.number}`))
        }
      }
    },
    // Add template strings to alternatives that contain capturing groups
    Alternative(path) {
      const { node, parentPath } = path
      if (!parentPath?.parentPath?.parentPath) {
        return
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
        if (type === "Mustache") {
          node.expressions.unshift(createCharNode(`{{#${capturing}}}`))
          node.expressions.push(createCharNode(`{{/${capturing}}}`))
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
