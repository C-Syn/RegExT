import { expect } from "chai"
import RegExT from "../lib/index.js"

console.log(
  new RegExT(/^(?<country_code>\+\d{1,2}\s?)?(?<area_code>\(\d{3}\)|\d{3})[-.\s]?\d{3}[-.\s]?\d{4}$/).template
)

const regexps = [
  /(?:(?<=[^`\\])|^)\[(?=[^@\n\]]+\]\([^@)]*@[:a-z0-9_-]*\))(?<showtext>[^@\n\]]+)\]\((?:(?:(?<type>[a-z0-9_-]*):)?)(?:(?<term>[^@\n:#)]*?)?(?:#(?<trait>[^@\n:#)]*))?)?@(?<scopetag>[a-z0-9_-]*)(?::(?<vsntag>[a-z0-9_-]*))?\)/g,
  /(?:(?<=[^`\\])|^)\[(?=[^@\n\]]+?@[:a-z0-9_-]*\](?:\([#:a-z0-9_-]+\))?)(?<showtext>[^@\n\]]+?)@(?<scopetag>[a-z0-9_-]*)(?::(?<vsntag>[a-z0-9_-]*?))?\](?:\((?:(?:(?<type>[a-z0-9_-]+):)?)(?<term>[^@\n:#)]*?)(?:#(?<trait>[^@\n:#)]+?))?\))?/
]

const templates = [
  "[{{showtext}}]({{#type}}{{type}}:{{/type}}{{term}}{{#trait}}#{{trait}}{{/trait}}@{{scopetag}}{{#vsntag}}:{{vsntag}}{{/vsntag}})",
  "[showtext](type:term#trait@scopetag:vsntag)",
  "[{{showtext}}@{{scopetag}}{{#vsntag}}:{{vsntag}}{{/vsntag}}]{{#term}}({{#type}}{{type}}:{{/type}}{{term}}{{#trait}}#{{trait}}{{/trait}}){{/term}}",
  "[showtext@scopetag:vsntag](type:term#trait)"
]

const modes = ["Mustache", "plain"]

describe("Templates", () => {
  regexps.forEach((regexp, i) => {
    modes.forEach((mode, j) => {
      const query = new RegExT(regexp, mode).template
      const template = templates[i * modes.length + j]
      it(`Template ${i * modes.length + j + 1}: '${regexp.toString().slice(0, 20)}...${regexp.toString().slice(-20)}' > '${template.slice(0, 20)}...${template.toString().slice(-20)}`, () => {
        expect(query).to.equal(template)
      })
    })
  })
})
