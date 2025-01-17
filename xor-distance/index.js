module.exports = dist

function dist (a, b) {
  // console.info('1.xor-distance a b length :', a.length, b.length)
  if (a.length !== b.length) throw new Error('Inputs should have the same length')
  var result = Buffer.allocUnsafe(a.length)
  for (var i = 0; i < a.length; i++) result[i] = a[i] ^ b[i]
  return result
}

dist.compare = function compare (a, b) {
  // console.info('1.xor-distance compare a b length :', a.length, b.length)
  if (a.length !== b.length) throw new Error('Inputs should have the same length')
  for (var i = 0; i < a.length; i++) {
    if (a[i] === b[i]) continue
    return a[i] < b[i] ? -1 : 1
  }
  return 0
}

dist.gt = function gt (a, b) {
  return dist.compare(a, b) === 1
}

dist.lt = function lt (a, b) {
  return dist.compare(a, b) === -1
}

dist.eq = function eq (a, b) {
  return dist.compare(a, b) === 0
}
