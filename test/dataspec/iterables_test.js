const { ExampleIterable } = require('../../src/dataspec/iterables')

describe('ExampleIterable', () => {
  const iter = new ExampleIterable([1, 2, 3])

  it('iterates through examples', () => {
    const elems = []
    for (let elem of iter) {
      elems.push(elem)
    }
    expect(elems).to.eql([1, 2, 3])
  })

  describe('.first', () => {
    it('returns the first element', () => {
      expect(iter.first()).to.eq(1)
      expect(iter.loop().first()).to.eq(1)
    })
  })

  describe('.loop', () => {
    it('iterates infinitely through examples', () => {
      const elems = []
      for (let elem of iter.loop()) {
        elems.push(elem)
        if (elems.length >= 10) break
      }
      expect(elems).to.eql([1, 2, 3, 1, 2, 3, 1, 2, 3, 1])
    })
  })

  describe('.take', () => {
    it('iterates only the given number of elements from iterator', () => {
      const firstFive = iter.loop().take(5).toArray()
      expect(firstFive).to.eql([1, 2, 3, 1, 2])
    })
  })

  describe('.random', () => {
    it('iterates random items in a loop', () => {
      const rand = iter.random().take(10).toArray()
      expect(rand.length).to.eq(10)
      expect(rand.every(x => [1, 2, 3].includes(x))).to.be.true
    })
  })

  describe('.filter', () => {
    it('iterates only the elements satisfying the predicate', () => {
      const odd = iter.filter(x => x % 2 !== 0).toArray()
      expect(odd).to.eql([1, 3])
    })
    it('throws error if skipping too many items', () => {
      const mostlyEven = new ExampleIterable([0, 2, 4, 8, 10, 15])
      expect(() => iter.filter(x => x % 2 !== 0, 5).toArray()).not.to.throw
      expect(() => iter.filter(x => x % 2 !== 0, 4).toArray()).to.throw
    })
  })

  describe('.randomZip', () => {
    it('randomly alternates elements from two iterables', () => {
      const chars = new ExampleIterable(['a', 'b', 'c', 'd'])
      const zipped = iter.randomZip(chars).take(100).toArray()
      expect(zipped.some(x => ['a', 'b', 'c', 'd'].includes(x))).to.be.true
      expect(zipped.some(x => [1, 2, 3].includes(x))).to.be.true
    })
  })
})
