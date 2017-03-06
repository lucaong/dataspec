const isOk = function (x) {
  if (Array.isArray(x)) {
    return x.filter(e => !isOk(e)).length === 0
  } else {
    return Object.keys(x).length === 0
  }
}

const print = function (x) {
  if (typeof x === 'string') return '"' + x + '"'
  if (Array.isArray(x)) {
    const shortened = x.slice(0, 3)
    const ellipsis = x.length > 3 ? ', ...' : ''
    return '[' + shortened.map(print).join(', ') + ellipsis + ']'
  }
  if (x && typeof x === 'object') {
    const keyVals = Object.keys(x).slice(0, 3).reduce((kv, k) => {
      kv.push(print(k) + ': ' + print(x[k]))
      return kv
    }, [])
    const ellipsis = Object.keys(x).length > 3 ? ', ...' : ''
    return '{' + keyVals.join(', ') + ellipsis + '}'
  }
  return String(x)
}

const listErrors = function (errorObj, prefix = []) {
  if (errorObj == null) {
    return []
  }
  if (typeof errorObj === 'string') {
    return [[prefix, errorObj]]
  }
  if (Array.isArray(errorObj)) {
    return errorObj.map(error => listErrors(error, prefix)).reduce((x, y) => x.concat(y), [])
  }
  return Object.keys(errorObj).map(key => {
    return listErrors(errorObj[key], prefix.concat(key))
  }).reduce((x, y) => x.concat(y), [])
}

const extend = function (parent, props) {
  const constr = props.hasOwnProperty('constructor') ? props.constructor : function() {}
  const _super = function (method, args = []) {
    return parent.prototype[method].apply(this, args)
  }
  constr.prototype = Object.assign(Object.create(parent.prototype), { _super }, props)
  return constr
}

module.exports = { isOk, extend, print, listErrors }
