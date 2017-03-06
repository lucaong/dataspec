const Dataspec = require('../src/dataspec')
const { Spec } = require('../src/dataspec/spec')
const { SpecError } = require('../src/dataspec/errors')
const ds = Dataspec

describe('Spec', () => {
  const isInteger = ds.spec(Number.isInteger)
  const isPositive = ds.spec(n => n > 0)

  describe('isValid', () => {
    it('returns true if satisfied', () => {
      expect(isInteger.isValid(42)).to.eq(true)
    })

    it('returns false if unsatisfied', () => {
      expect(isInteger.isValid(1.23)).to.eq(false)
    })
  })

  describe('errors', () => {
    it('returns empty array if satisfied', () => {
      const errors = isInteger.errors(42)
      expect(errors).to.eql([])
    })

    it('includes function name in the error', () => {
      const errors = isInteger.errors('abc')
      expect(errors.length).to.eq(1)
      expect(errors[0]).to.eq('"abc" does not satisfy specification isInteger')
    })

    it('includes function source in the error, if it is an anonymous function', () => {
      const errors = isPositive.errors(-5)
      expect(errors.length).to.eq(1)
      expect(errors[0]).to.contain('n => n > 0')
    })
  })

  describe('validate', () => {
    it('returns true if satisfied', () => {
      expect(isInteger.validate(42)).to.eq(true)
    })

    it('throws error if unsatisfied', () => {
      expect(() => isInteger.validate(1.23)).to.throw(SpecError)
    })
  })

  describe('and', () => {
    const isPositiveInteger = isInteger.and(isPositive)

    it('is a Spec', () => {
      expect(isPositiveInteger).to.be.an.instanceof(Spec)
    })

    it('validates if both left and right validate', () => {
      expect(isPositiveInteger.errors(42)).to.eql([])
    })

    it('does not validates if either left or right does not validate', () => {
      expect(isPositiveInteger.errors(-42)).not.to.be.empty
      expect(isPositiveInteger.errors(1.23)).not.to.be.empty
    })

    it('includes all errors from left and right', () => {
      const errors = isPositiveInteger.errors(-1.23)
      expect(errors).to.eql(isInteger.errors(-1.23).concat(isPositive.errors(-1.23)))
    })
  })

  describe('or', () => {
    const isPositiveOrInteger = isInteger.or(isPositive)

    it('is a Spec', () => {
      expect(isPositiveOrInteger).to.be.an.instanceof(Spec)
    })

    it('validates if either left or right validates', () => {
      expect(isPositiveOrInteger.errors(-42)).to.eql([])
      expect(isPositiveOrInteger.errors(1.23)).to.eql([])
    })

    it('does not validates if both left and right do not validate', () => {
      expect(isPositiveOrInteger.errors(-1.42)).not.to.be.empty
    })

    it('mentions both left and right specifications in the error', () => {
      const errors = isPositiveOrInteger.errors(-1.23)
      expect(errors).to.eql(["-1.23 does not satisfy specification isInteger or n => n > 0"])
    })
  })

  describe('examples', () => {
    it('generates data using the given examples', () => {
      const example = isInteger.examples(1, 2, 3).generate()
      expect([1, 2, 3]).to.include(example)
    })

    it('validates the given examples', () => {
      expect(() => isInteger.examples(1, 2.5, 3)).to.throw(SpecError)
    })

    it('generates examples for or', () => {
      const example = isInteger.examples(1, -2, 3).or(isPositive.examples(3.5, 42)).generate()
      expect([1, -2, 3, 3.5, 42]).to.include(example)
    })
  })

  describe('arrayOf', () => {
    const allIntegers = ds.arrayOf(isInteger)

    it('fails verification if object is not an array', () => {
      expect(allIntegers.isValid(123)).to.be.false
    })

    it('asserts spec for every element of an array', () => {
      const errors = allIntegers.errors([1, 2, 'a', 5, false])
      expect(Object.keys(errors[0])).to.eql(['2', '4'])

      expect(allIntegers.errors([1, 2, 5])).to.eql([])
    })
  })

  describe('objectOf', () => {
    it('asserts specs for key/value objects', () => {
      const spec = ds.objectOf({
        foo: isInteger,
        bar: isPositive,
        baz: ds.objectOf({ qux: isPositive })
      })

      expect(spec.isValid({ foo: 1, bar: 2, baz: { qux: 1 } })).to.be.true
      expect(spec.isValid({ foo: 1, bar: -2, baz: { qux: 1 } })).to.be.false
      expect(spec.isValid({ foo: 1.5, bar: 2, baz: { qux: 1 } })).to.be.false
      expect(spec.isValid({ foo: 1, bar: 2, baz: { qux: -1 } })).to.be.false
      expect(spec.isValid({})).to.be.false

      const [errors] = spec.errors({ foo: 1, bar: -2, baz: {} })
      expect(errors.foo).not.to.be.defined
      expect(errors.bar).to.eql(['-2 does not satisfy specification n => n > 0'])
      expect(errors.baz[0].qux).to.eql(['undefined does not satisfy specification n => n > 0'])
    })
  })

  it('works', () => {
    const isInteger = ds.spec(Number.isInteger)
      .examples(-5, -42, 0, 3, 42, 46, 102981, -97263)

    const isBoolean = ds.spec(x => x === true || x === false)
      .examples(true, false)

    const isString = ds.spec(s => typeof s === 'string')
      .examples('hello', 'hi', 'hehe', 'have a nice day', 'abc1234')

    const isNull = ds.spec(x => x === null)
      .examples(null)

    const hasLength = length => ds.spec(x => x.length === length, 'hasLength(' + length + ')')

    const arrayOfThreeInteger = ds.arrayOf(isInteger).and(hasLength(3))

    const stringOrNull = isString.or(isNull)

    const stringLongerThanFive = isString.and(s => s.length > 5)
      .examples('asd78tk', 'asft97giug', '97agsf97at')

    const spec = ds.objectOf({
      baz: arrayOfThreeInteger,
      xxx: stringOrNull,
      bool: isBoolean,
      foo: ds.objectOf({ bar: stringLongerThanFive })
    })

    expect(() => {
      spec.validate({
        baz: [1, 2, 3],
        xxx: null,
        bool: false,
        foo: { bar: 'efghilm' }
      })
    }).not.to.throw

    expect(() => {
      spec.validate({
        baz: [1, 2, 3],
        xxx: null,
        foo: { bar: 'efg' }
      })
    }).to.throw(SpecError)

    const generated = spec.generate()
    expect(spec.isValid(generated)).to.be.true

    // console.log('Generated data:', JSON.stringify(generated, null, 2))
  })
})
