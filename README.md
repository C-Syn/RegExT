# RegExp to Template Converter

This package provides a class to convert regular expressions into template strings. It currently supports both a [Mustache](https://mustache.github.io/) and plain style.
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

RegExT is a class that takes two parameters: a regular expression and a type. The class has a `toString` method that returns the template string, it contains the following properties. The `convert` function that is used to generate the template string is also exposed `import { convert } from 'regex-template'`.

| Property | Type | Description |
| --- | --- | --- |
| `regexp` | `RegExp` | The regular expression that was used to generate the template string. |
| `type` | `string` | The type of template string that was generated. |
| `template` | `string` | The template string that was generated. |

## Example

```regexp
/(?:(?<=[^`\\])|^)\[(?=[^@\n\]]+\]\([^@)]*@[:a-z0-9_-]*\))(?<showtext>[^@\n\]]+)\]\((?:(?:(?<type>[a-z0-9_-]*):)?)(?:(?<term>[^@\n:#)]*?)?(?:#(?<trait>[^@\n:#)]*))?)?@(?<scopetag>[a-z0-9_-]*)(?::(?<vsntag>[a-z0-9_-]*))?\)/g
```

The regular expression above is used to match a markdown link with a [specific format](https://tno-terminology-design.github.io/tev2-specifications/docs/specs/tools/trrt#predefined-interpreters). Depending on the specified type, the regular expression will be converted into the following templates:
  
```typescript title="Mustache"
[{{showtext}}]({{#type}}{{type}}:{{/type}}{{term}}{{#trait}}#{{trait}}{{/trait}}@{{scopetag}}{{#vsntag}}:{{vsntag}}{{/vsntag}})
```

```typescript title="Plain"
[showtext](type:term#trait@scopetag:vsntag)
```

## Process

After the regular expression is parsed into an [abstract syntax tree (AST)](https://astexplorer.net/#/gist/4ea2b52f0e546af6fb14f9b2f5671c1c/39b55944da3e5782396ffa1fea3ba68d126cd394), the [AST](https://astexplorer.net/#/gist/4ea2b52f0e546af6fb14f9b2f5671c1c/39b55944da3e5782396ffa1fea3ba68d126cd394) is traversed to generate the template string. 
The following steps are taken to generate the template string:

1. Certain types of nodes are removed (i.e., [`CharacterClass`](https://www.npmjs.com/package/regexp-tree#character-class), [`Disjunction`](https://www.npmjs.com/package/regexp-tree#disjunction), [`Assertion`](https://www.npmjs.com/package/regexp-tree#assertions)) as they may contain [`Char`](https://www.npmjs.com/package/regexp-tree#char) nodes that should not be included in the template string. For instance: ranges of characters that the regular expression is supposed to match are removed.
2. Every [`Group`](https://www.npmjs.com/package/regexp-tree#groups) node is checked for its `capturing` property. If it is set to `true`, the group is converted into a [`Char`](https://www.npmjs.com/package/regexp-tree#char) node with the values of the template string based on the specified type. Either the `name` property or the `number` property is used to identify the group in the template string.
3. Every [`Alternative`](https://www.npmjs.com/package/regexp-tree#alternative) (or *concatenation*) node is converted into a template string according to the specified type. In the case of using the [`Mustache`](#usage) type, the [`Alternative`](https://www.npmjs.com/package/regexp-tree#alternative) node is wrapped in a `section` block (e.g., `{{#person}}{{person}} exists{{/person}})`).
4. Every [`Char`](https://www.npmjs.com/package/regexp-tree#char) node value is concatenated into the template string.
