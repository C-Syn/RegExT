# RegExp to Template Converter

This package provides a class to convert regular expressions into template strings. It currently supports both a [Mustache](https://mustache.github.io/) and plain [style](#type).
The underlying function is strongly dependent on the [regexp-tree](https://www.npmjs.com/package/regexp-tree) package, which is used to parse the regular expression into an [abstract syntax tree (AST)](https://astexplorer.net/#/gist/4ea2b52f0e546af6fb14f9b2f5671c1c/39b55944da3e5782396ffa1fea3ba68d126cd394). Its parser module is generated from the [regexp grammar](https://github.com/DmitrySoshnikov/regexp-tree/blob/master/src/parser/regexp.bnf), which is based on the regular expressions grammar used in ECMAScript. After parsing, the [AST](https://astexplorer.net/#/gist/4ea2b52f0e546af6fb14f9b2f5671c1c/39b55944da3e5782396ffa1fea3ba68d126cd394) is then traversed to generate the template string.

## Installation

```bash
npm install @c-syn/regext
```

## Usage

```typescript
import RegExT from "@c-syn/regext" 

const regexp = /.../ // Your regular expression
const type = "Mustache" // or "plain"

const template = new RegExT(regexp, type).template
```
> [!TIP]
> Try this code in the [RegExT Playground](https://playcode.io/1769499). 

RegExT is a class that takes two parameters: a regular expression and a type. The class has a `toString` method that returns the template string, it contains the following properties. The `convert` function that is used to generate the template string is also exposed `import { convert } from 'regex-template'`.

| Property | Type | Description |
| --- | --- | --- |
| `regexp` | `RegExp` | The regular expression that was used to generate the template string. |
| `type` | `string` | The [type](#type) of template string that was generated. |
| `template` | `string` | The template string that was generated. |

### `type`

The `type` parameter is a string that specifies the type of template string that should be generated. The following types are supported. If no type, or an unknown type, is specified, type is set to `Mustache`.

| Type | Description |
| --- | --- |
| `Mustache` | A template string that uses the [Mustache](https://mustache.github.io/) syntax. |
| `plain` | A plain template string. |

## Example

```regexp
/(?:(?<=[^`\\])|^)\[(?=[^@\n\]]+\]\([^@)]*@[:a-z0-9_-]*\))(?<showtext>[^@\n\]]+)\]\((?:(?:(?<type>[a-z0-9_-]*):)?)(?:(?<term>[^@\n:#)]*?)?(?:#(?<trait>[^@\n:#)]*))?)?@(?<scopetag>[a-z0-9_-]*)(?::(?<vsntag>[a-z0-9_-]*))?\)/g
```

The regular expression above is used to match a markdown link with a [specific format](https://tno-terminology-design.github.io/tev2-specifications/docs/specs/tools/trrt#predefined-interpreters). Depending on the specified [type](#type), the regular expression will be converted into the following templates.

> **Mustache**
> ```handlebars
> [{{showtext}}]({{#type}}{{type}}:{{/type}}{{term}}{{#trait}}#{{trait}}{{/trait}}@{{scopetag}}{{#vsntag}}:{{vsntag}}{{/vsntag}})
> ```

> **Plain**
> ```
> [showtext](type:term#trait@scopetag:vsntag)
> ```

## Use Cases

The generated template string can be used to convert any texts into texts that match the regular expression. Conversion can be done by replacing the template string with the corresponding values. For instance, after interpreting a text, it is converted using [Handlebars](https://handlebarsjs.com/) to match another regular expression.

The generated template string can also be used to quickly visualize the structure of the regular expression. This can be useful when debugging or when trying to understand the structure of a regular expression.

## Process

After the regular expression is parsed into an [abstract syntax tree (AST)](https://astexplorer.net/#/gist/4ea2b52f0e546af6fb14f9b2f5671c1c/39b55944da3e5782396ffa1fea3ba68d126cd394), the [AST](https://astexplorer.net/#/gist/4ea2b52f0e546af6fb14f9b2f5671c1c/39b55944da3e5782396ffa1fea3ba68d126cd394) is traversed to generate the template string. 
The following steps are walked through on every [node](https://www.npmjs.com/package/regexp-tree#ast-nodes-specification), mostly depending on the specific type.

1. Certain types of nodes are removed (i.e., [`ClassRange`](https://www.npmjs.com/package/regexp-tree#character-class-ranges), [`Disjunction`](https://www.npmjs.com/package/regexp-tree#disjunction), [`Assertion`](https://www.npmjs.com/package/regexp-tree#assertions)) as they may contain [`Char`](https://www.npmjs.com/package/regexp-tree#char) nodes that should not be included in the template string. For instance: ranges of characters that the regular expression is supposed to match are removed.
2. [`Repetition`](https://www.npmjs.com/package/regexp-tree#quantifiers) nodes are changed to [`Alternative`](https://www.npmjs.com/package/regexp-tree#alternative) nodes if the [Quantifier's](https://www.npmjs.com/package/regexp-tree#quantifiers) `from` and `to` properties are identical. Within the changed node, the [`Repetition`](https://www.npmjs.com/package/regexp-tree#quantifiers) node is repeated `n` times.
3. [`Group`](https://www.npmjs.com/package/regexp-tree#groups) nodes are checked for their `capturing` property. If it is set to `true`, the group is converted into a [`Char`](https://www.npmjs.com/package/regexp-tree#char) node based on the specified template string type. Either the `name`, if it exists, or the `number` property is used to identify the group in the template string.
4. [`Alternative`](https://www.npmjs.com/package/regexp-tree#alternative) (or *concatenation*) nodes are handled according to the specified template string type. For instance, in the case of using the [`Mustache`](#usage) type, the [`Alternative`](https://www.npmjs.com/package/regexp-tree#alternative) node is wrapped in a `section` block (e.g., `{{#person}}{{person}} exists{{/person}}`).

After these steps halve been walked through, every [`Char`](https://www.npmjs.com/package/regexp-tree#char) node its value is concatenated, resulting in the template string.

## Limitations

Due to the nature of the [process](#process) used to generate the template string, the following limitations apply.

1. Nodes of types [`ClassRange`](https://www.npmjs.com/package/regexp-tree#character-class-ranges), [`Disjunction`](https://www.npmjs.com/package/regexp-tree#disjunction), and [`Assertion`](https://www.npmjs.com/package/regexp-tree#assertions) are removed from the [AST](https://astexplorer.net/#/gist/4ea2b52f0e546af6fb14f9b2f5671c1c/39b55944da3e5782396ffa1fea3ba68d126cd394). This means that the template string will not contain any information about these nodes.
2. [`Backreferences`](https://www.npmjs.com/package/regexp-tree#backreferences) are not (yet) supported. This means that the template string will not contain any information about backreferences.
3. [`Quantifiers`](https://www.npmjs.com/package/regexp-tree#quantifiers) (repetitions) are only handled if the `from` and `to` properties are identical, in this case we can assume the number of times the expressions is supposed to be repeated. If the `from` and `to` properties are different, the corresponding expression is not repeated in the template string.
