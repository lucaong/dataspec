# Dataspec

Specify how data should look like, assert validity and generate examples.

Specifications are built from functions (returning `true` or `false` depending
on wether the specification is met or not) and can be composed together.

Once some specification is built, it can be used to validate data and to
generate example data.


## Example

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

// A specification for integers
const integer = spec(Number.isInteger)
  .examples(-102, -8, 0, 3, 74, 101, 200, 10279)

// A byte is specified as an integer greater or equal than 0 and smaller than 256
const byte = integer.and(x => x >= 0 && x < 256)

// An rgb value is an array of 3 bytes
const rgb = arrayOf(byte).and(x => x.length === 3)

// A color is an object that has an optional name and a rgb value
const color = objectOf({
  name: maybeString,
  rgb: rgb
})

// Validate:

color.isValid({ name: 'red', rgb: [255, 0, 0] })      // => true
color.validate('not a color')                         // => throws SpecError
color.explainErrors({ name: 'infrared', [-2, 0, 0] }) // => [ [ [ 'rgb', '0' ],
                                                      //    '-2 does not satisfy predicate x => x >= 0 && x < 256' ] ]

// Generate:

color.generate() // => returns a random example, e.g. { name: 'qux', rgb: [ 101, 3, 0 ] }
```
