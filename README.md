# Dataspec

Write specification for data, assert validity and generate examples.

Specifications are built from plain predicate functions (returning `true` or
`false` depending on wether the specification is met or not) and can be composed
together.

Once some specification is built, it can be used to validate data and to
generate example data.


## Example Usage

```javascript
const { spec, arrayOf, objectOf } = require('dataspec')

// A specification for strings
const string = spec(x => typeof x === 'string')
  .examples('foo', 'bar', 'baz', 'qux')

// A specification for missing values (null or undefined)
const absent = spec(x => x === null || x === undefined)
  .examples(null, undefined)

// Specifications can be composed, for example to specify a string that can be
// absent, the previous two specifications can be combined.
// Whenever possible, Dataspec generates the examples for you composing from
// the previous specifications.
const maybeString = string.or(absent)

// A specification for integers (providing examples via a generator function).
const integer = spec(Number.isInteger)
  .generator(() => Math.floor(Math.random() * 2000) - 1000)

// Specifications about composite data (objects and arrays) are also easy:
const byte = integer.and(x => x >= 0 && x < 256)
const rgb = arrayOf(byte).and(x => x.length === 3)
const color = objectOf({
  name: maybeString,
  rgb: rgb
})

// Data validation:
color.isValid({ name: 'red', rgb: [255, 0, 0] })      // => true
color.validate('not a color')                         // => throws SpecError
color.explainErrors({ name: 'infrared', [-2, 0, 0] }) // => [ [ [ 'rgb', '0' ],
                                                      //    '-2 does not satisfy predicate x => x >= 0 && x < 256' ] ]

// Data generation:
color.generate() // => returns a random example, like `{ name: 'qux', rgb: [ 101, 3, 0 ] }`
```
