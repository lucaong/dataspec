const { extend } = require('./utils')

const Iterable = extend(Object, {
  [Symbol.iterator]: function* () {
    throw 'not implemented'
  },
  take: function(n) {
    if (this.isEmpty()) return this
    return new Take(n, this)
  },
  randomZip: function (other) {
    if (this.isEmpty()) return other
    if (other.isEmpty()) return this
    return new RandomZip(this, other)
  },
  toArray: function() {
    if (!this.isFinite()) throw new Error('cannot turn infinite iterable into Array')
    const array = []
    for (let item of this) {
      array.push(item)
    }
    return array
  },
  loop: function () {
    if (this.isEmpty()) return this
    return new Loop(this)
  },
  generator: function () {
    return this[Symbol.iterator]()
  },
  first: function () {
    if (this.isEmpty()) return null
    const [first] = this
    return first
  },
  filter: function (predicate, maxSkip) {
    if (this.isEmpty()) return this
    return new Filter(this, predicate, maxSkip)
  },
  isFinite: function () {
    throw 'not implemented'
  },
  isEmpty: function () {
    throw 'not implemented'
  }
})

const ExampleIterable = extend(Iterable, {
  constructor: function (examples) {
    this.examples = examples
  },
  [Symbol.iterator]: function* () {
    for (let example of this.examples) {
      yield example
    }
  },
  random: function () {
    return new Random(this)
  },
  isFinite: () => true,
  isEmpty: function () {
    return this.examples.length === 0
  }
})

const Take = extend(Iterable, {
  constructor: function (limit, iterable) {
    this.limit = limit
    this.iterable = iterable
  },
  [Symbol.iterator]: function* () {
    let count = 0
    for (let item of this.iterable) {
      if (count >= this.limit) break
      yield item
      count = count + 1
    }
  },
  isFinite: () => true,
  isEmpty: function () {
    return this.iterable.isEmpty() || this.limit === 0
  }
})

const RandomZip = extend(Iterable, {
  constructor: function (left, right) {
    this.left = left.loop()
    this.right = right.loop()
  },
  [Symbol.iterator]: function* () {
    const leftIterator = this.left.generator()
    const rightIterator = this.right.generator()
    while (true) {
      if (Math.random() < 0.5) {
        yield leftIterator.next().value
      } else {
        yield rightIterator.next().value
      }
    }
  },
  isFinite: () => false,
  isEmpty: function () {
    return false
  }
})

const Loop = extend(Iterable, {
  constructor: function (iterable) {
    this.iterable = iterable
  },
  [Symbol.iterator]: function* () {
    if (this.iterable.isEmpty()) return
    while (true) {
      for (let item of this.iterable) {
        yield item
      }
    }
  },
  isFinite: () => false,
  isEmpty: function () {
    return this.iterable.isEmpty()
  }
})

const Random = extend(Iterable, {
  constructor: function (iterable) {
    this.iterable = iterable
  },
  [Symbol.iterator]: function* () {
    if (this.iterable.isEmpty()) return
    const items = this.iterable.toArray()
    while (true) {
      let idx = Math.floor(Math.random() * items.length)
      yield items[idx]
    }
  },
  isFinite: () => false,
  isEmpty: function () {
    return this.iterable.isEmpty()
  }
})

const Filter = extend(Iterable, {
  constructor: function (iterable, predicate, maxSkip) {
    this.iterable = iterable
    this.predicate = predicate
    this.maxSkip = maxSkip || 200
  },
  [Symbol.iterator]: function* () {
    if (this.iterable.isEmpty()) return
    let skipped = 0
    for (let item of this.iterable) {
      if (skipped > this.maxSkip) throw Error('max skip reached')
      if (this.predicate(item)) {
        skipped = 0
        yield item
      } else {
        skipped = skipped + 1
      }
    }
  },
  isFinite: function () {
    return this.iterable.isFinite()
  },
  isEmpty: function () {
    return this.iterable.isEmpty()
  }
})

const FunctionIterable = extend(Iterable, {
  constructor: function (fn) {
    this.fn = fn
  },
  [Symbol.iterator]: function* () {
    while (true) {
      yield this.fn()
    }
  },
  isFinite: () => false,
  isEmpty: () => false
})

module.exports = { ExampleIterable, FunctionIterable }
