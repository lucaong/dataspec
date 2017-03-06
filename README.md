# Dataspec

Specify how data should look like, assert validity and generate examples.


## Example

```javascript
const ds = require('dataspec')

const string = ds.spec(x => typeof x === 'string').examples('foo', 'bar', 'baz', 'qux')

const integer = ds.spec(Number.isInteger).examples(-102, -8, 0, 3, 74, 101, 200, 10279)

const rgbChannel = integer.and(x => x >= 0 && x < 256)

const rgb = ds.arrayOf(rgbChannel).and(x => x.length === 3)

const color = ds.objectOf({
  name: string,
  rgb: rgb
})

# Validate:

color.isValid({ name: 'red', rgb: [255, 0, 0] }) # => true
color.validate('not a color') # => throws SpecError
color.explainErrors({ name: 'infrared', [-2, 0, 0] })
# => [ [ [ 'rgb', '0' ],
#    '-2 does not satisfy predicate x => x >= 0 && x < 256' ] ]

# Generate:

color.generate() # => returns a random example, e.g. { name: 'qux', rgb: [ 101, 3, 0 ] }
```
