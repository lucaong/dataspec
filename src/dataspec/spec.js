const { isOk, extend, print, listErrors } = require('./utils')
const { SpecError } = require('./errors')
const { ExampleIterable, FunctionIterable } = require('./iterables')

const Spec = extend(Object, {
  constructor: function(predicate, name) {
    this.predicate = predicate
    this.specName = name || predicate.name || predicate.toString()
    this.exampleIterable = new ExampleIterable([])
  },
  isSpec: true,
  isValid: function (obj) {
    return isOk(this.errors(obj))
  },
  validate: function (obj) {
    const errors = this.errors(obj)
    if (isOk(errors)) return true
    throw new SpecError(errors)
  },
  errors: function (obj) {
    let isValid
    try {
      isValid = this.predicate(obj)
    } catch (e) {
      return [print(obj) + ' throws error on specification ' + this.specName]
    }
    if (isValid) {
      return []
    } else {
      return [print(obj) + ' does not satisfy specification ' + this.specName]
    }
  },
  explainErrors: function (obj) {
    const errors = this.errors(obj)
    if (isOk(errors)) return null
    return listErrors(errors)
  },
  and: function (other) {
    const otherSpec = other.isSpec ? other : new Spec(other)
    return new And(this, otherSpec)
  },
  or: function (other) {
    const otherSpec = other.isSpec ? other : new Spec(other)
    return new Or(this, otherSpec)
  },
  hasExamples: function () {
    return this.exampleIterable != null && !this.exampleIterable.isEmpty()
  },
  mustHaveExamples: function () {
    if (!this.hasExamples()) {
      throw new Error('no example provided for ' + this.specName)
    }
  },
  examples: function () {
    const examples = Array.from(arguments)
    examples.forEach(example => this.validate(example))
    return new WithExamples(this, examples)
  },
  generator: function (fn) {
    for (let i = 0; i < 10; i++) {
      this.validate(fn())
    }
    return new WithGenerator(this, fn)
  },
  generate: function () {
    this.mustHaveExamples()
    if (!this._exampleGenerator) {
      this._exampleGenerator = this.exampleIterable.generator()
    }
    return this._exampleGenerator.next().value
  }
})

const And = extend(Spec, {
  constructor: function (left, right) {
    this.left = left
    this.right = right
    this.specName = left.specName + ' and ' + right.specName
    const iter = this.right.exampleIterable.randomZip(this.left.exampleIterable)
    try {
      this.exampleIterable = iter.filter(x => this.left.isValid(x) && this.right.isValid(x))
    } catch (_) {
      throw new Error('no suitable example found for ' + this.specName +
        ' after 200 attempts, provide explicit examples')
    }
  },
  errors: function (obj) {
    return this.left.errors(obj).concat(this.right.errors(obj))
  }
})

const Or = extend(Spec, {
  constructor: function (left, right) {
    this.left = left
    this.right = right
    this.specName = left.specName + ' or ' + right.specName
    if (this.left.hasExamples() && this.right.hasExamples()) {
      this.exampleIterable = this.left.exampleIterable.randomZip(this.right.exampleIterable)
    }
  },
  generate: function () {
    this.left.mustHaveExamples()
    this.right.mustHaveExamples()
    return this._super('generate')
  },
  errors: function (obj) {
    const leftErrors = this.left.errors(obj)
    if (isOk(leftErrors)) return []
    const rightErrors = this.right.errors(obj)
    if (isOk(rightErrors)) return []
    return [print(obj) + ' does not satisfy specification ' + this.specName]
  }
})

const WithExamples = extend(Spec, {
  constructor: function (spec, examples) {
    this.spec = spec
    this.exampleIterable = (new ExampleIterable(examples)).random()
    this.specName = spec.specName
  },
  errors: function (obj) {
    return this.spec.errors(obj)
  }
})

const WithGenerator = extend(Spec, {
  constructor: function (spec, generator) {
    this.spec = spec
    this.exampleIterable = new FunctionIterable(generator)
    this.specName = spec.specName
  },
  errors: function (obj) {
    return this.spec.errors(obj)
  }
})

const ObjectSpec = extend(Spec, {
  constructor: function (specs, name) {
    this.keys = Object.keys(specs)
    this.specs = this.keys.reduce((obj, key) => {
      obj[key] = specs[key].isSpec ? specs[key] : new Spec(specs[key])
      return obj
    }, {})
    this.specName = name || 'objectOf({ ' + this.keys.join(', ') + ' })'
    if (this.keys.every(key => this.specs[key].hasExamples())) {
      this.exampleIterable = new FunctionIterable(() => {
        return this.keys.reduce((example, key) => {
          example[key] = this.specs[key].generate()
          return example
        }, {})
      })
    }
  },
  errors: function (obj) {
    if (typeof obj !== 'object') {
      return [print(obj) + ' is not an object']
    }
    const errors = this.keys.reduce((errors, key) => {
      const subject = (obj || {})[key]
      const errs = this.specs[key].errors(subject)
      if (!isOk(errs)) {
        errors[key] = errs
      }
      return errors
    }, {})
    if (isOk(errors)) return []
    return [errors]
  }
})

const ArraySpec = extend(Spec, {
  constructor: function (spec) {
    this.spec = spec
    this.specName = 'arrayOf(' + spec.specName + ')'
    if (spec.hasExamples()) {
      if (this.spec.exampleIterable.isFinite()) {
        this._elementExampleIterator = this.spec.exampleIterable.random()
      } else {
        this._elementExampleIterator = this.spec.exampleIterable
      }
      this.exampleIterable = new FunctionIterable(() => {
        return this._elementExampleIterator.take(Math.floor(Math.random() * 10)).toArray()
      })
    }
  },
  errors: function (obj) {
    if (!Array.isArray(obj)) {
      return [print(obj) + ' is not an array']
    }
    const errors = obj.map(element => this.spec.errors(element))
      .reduce((errs, x, idx) => {
        if (!isOk(x)) {
          errs[idx] = x
        }
        return errs
      }, {})
    if (isOk(errors)) return []
    return [errors]
  }
})

module.exports = { Spec, And, Or, WithExamples, ObjectSpec, ArraySpec }
