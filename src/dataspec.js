const { Spec, ArraySpec, ObjectSpec } = require('./dataspec/spec')
const { SpecError } = require('./dataspec/errors')

const Dataspec = {
  spec: function (predicate, name) {
    if (predicate._isSpec) {
      return predicate
    } else {
      return new Spec(predicate, name)
    }
  },
  objectOf: function (specs) {
    return new ObjectSpec(specs)
  },
  arrayOf: function (spec) {
    return new ArraySpec(spec)
  },
  SpecError
}

module.exports = Dataspec
