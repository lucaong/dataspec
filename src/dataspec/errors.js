const { extend, listErrors } = require('./utils')

const SpecError = extend(Error, {
  constructor: function SpecError (errors) {
    Error.call(this)
    Error.captureStackTrace(this, this.constructor)
    const explanation = listErrors(errors)
    this.name = 'SpecError'
    this.explanation = explanation
    this.message = explanation.map(([k, e]) => k.join('.') + ': ' + e).join('\n')
  }
})

module.exports = { SpecError }
