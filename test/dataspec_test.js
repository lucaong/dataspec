const Dataspec = require('../src/dataspec')
const { Spec } = require('../src/dataspec/spec')
const { SpecError } = require('../src/dataspec/errors')
const ds = Dataspec

describe('Spec', () => {
  const integer = ds.spec(Number.isInteger)
  const positive = ds.spec(n => n > 0)

  describe('isValid', () => {
    it('returns true if satisfied', () => {
      expect(integer.isValid(42)).to.eq(true)
    })

    it('returns false if unsatisfied', () => {
      expect(integer.isValid(1.23)).to.eq(false)
    })
  })

  describe('errors', () => {
    it('returns empty array if satisfied', () => {
      const errors = integer.errors(42)
      expect(errors).to.eql([])
    })

    it('includes function name in the error', () => {
      const errors = integer.errors('abc')
      expect(errors.length).to.eq(1)
      expect(errors[0]).to.eq('"abc" does not satisfy specification isInteger')
    })

    it('includes function source in the error, if it is an anonymous function', () => {
      const errors = positive.errors(-5)
      expect(errors.length).to.eq(1)
      expect(errors[0]).to.contain('n => n > 0')
    })
  })

  describe('validate', () => {
    it('returns true if satisfied', () => {
      expect(integer.validate(42)).to.eq(true)
    })

    it('throws error if unsatisfied', () => {
      expect(() => integer.validate(1.23)).to.throw(SpecError)
    })
  })

  describe('and', () => {
    const positiveInteger = integer.and(positive)

    it('returns a Spec', () => {
      expect(positiveInteger).to.be.an.instanceof(Spec)
    })

    it('validates when both left and right validate', () => {
      expect(positiveInteger.errors(42)).to.eql([])
    })

    it('does not validate if either left or right does not validate', () => {
      expect(positiveInteger.errors(-42)).not.to.be.empty
      expect(positiveInteger.errors(1.23)).not.to.be.empty
    })

    it('includes all errors from left and right', () => {
      const errors = positiveInteger.errors(-1.23)
      expect(errors).to.eql(integer.errors(-1.23).concat(positive.errors(-1.23)))
    })

    it('composes examples', () => {
      const spec = integer.examples(1, -2, 3).and(positive.examples(3.5, 42))
      for (let i = 0; i < 5; i++) {
        expect([1, 3, 42]).to.include(spec.generate())
      }
    })
  })

  describe('or', () => {
    const positiveOrInteger = integer.or(positive)

    it('returns a Spec', () => {
      expect(positiveOrInteger).to.be.an.instanceof(Spec)
    })

    it('validates when either left or right validates', () => {
      expect(positiveOrInteger.errors(-42)).to.eql([])
      expect(positiveOrInteger.errors(1.23)).to.eql([])
    })

    it('does not validate if both left and right do not validate', () => {
      expect(positiveOrInteger.errors(-1.42)).not.to.be.empty
    })

    it('mentions both left and right specifications in the error', () => {
      const errors = positiveOrInteger.errors(-1.23)
      expect(errors).to.eql(["-1.23 does not satisfy specification isInteger or n => n > 0"])
    })

    it('composes examples', () => {
      const spec = integer.examples(1, -2, 3).or(positive.examples(3.5, 42))
      for (let i = 0; i < 5; i++) {
        expect([1, -2, 3, 3.5, 42]).to.include(spec.generate())
      }
    })
  })

  describe('examples', () => {
    it('returns a Spec', () => {
      expect(integer.examples(1, 2, 3)).to.be.an.instanceof(Spec)
    })

    it('generates data using the given examples', () => {
      const example = integer.examples(1, 2, 3).generate()
      expect([1, 2, 3]).to.include(example)
    })

    it('validates the given examples', () => {
      expect(() => integer.examples(1, 2.5, 3)).to.throw(SpecError)
    })
  })

  describe('generator', () => {
    it('generates data using the given generator function', () => {
      const example = positive.generator(Math.random).generate()
      expect(example).to.be.a('Number')
    })

    it('validates the generated values', () => {
      expect(() => integer.generator(Math.random)).to.throw(SpecError)
    })
  })

  describe('arrayOf', () => {
    const allIntegers = ds.arrayOf(integer)

    it('returns a Spec', () => {
      expect(allIntegers).to.be.an.instanceof(Spec)
    })

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
    it('returns a Spec', () => {
      expect(ds.objectOf({ foo: integer })).to.be.an.instanceof(Spec)
    })

    it('asserts specs for key/value objects', () => {
      const spec = ds.objectOf({
        foo: integer,
        bar: positive,
        baz: ds.objectOf({ qux: positive })
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
    const integer = ds.spec(Number.isInteger)
      .examples(-5, -42, 0, 3, 42, 46, 102981, -97263)

    const bool = ds.spec(x => x === true || x === false)
      .generator(() => Math.random > 0.5)

    const string = ds.spec(s => typeof s === 'string')
      .examples('hello', 'hi', 'hehe', 'have a nice day', 'abc1234')

    const absent = ds.spec(x => x === null || x === undefined)
      .examples(null)

    const hasLength = length => ds.spec(x => x.length === length, 'hasLength(' + length + ')')

    const arrayOfThreeIntegers = ds.arrayOf(integer).and(hasLength(3))

    const maybeString = string.or(absent)

    const stringLongerThanFive = string.and(s => s.length > 5)
      .examples('asd78tk', 'asft97giug', '97agsf97at')

    const spec = ds.objectOf({
      baz: arrayOfThreeIntegers,
      xxx: maybeString,
      bool: bool,
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
