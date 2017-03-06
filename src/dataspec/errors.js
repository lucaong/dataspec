const { extend, listErrors } = require('./utils')

const SpecError = extend(Error, {
  constructor: function (errors) {
    this.name = 'SpecError'
    this.message = 'Specification not satisfied:\n' +
      listErrors(errors).map(([k, e]) => k.join('.') + ': ' + e).join('\n')
    this.stack = (new Error()).stack
  }
})

module.exports = { SpecError }
