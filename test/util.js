'use strict'
const dht = require('@hyperswarm/dht')
const { promisify } = require('util')
const once = require('events.once')
const done = Symbol('done')
const count = Symbol('count')

const when = () => {
  var done = () => { throw Error('did not happen') }
  const fn = () => done()
  fn.done = promisify((cb) => { done = cb })
  return fn
}
const whenify = (fn, { asyncOps } = { asyncOps: 1 }) => {
  const until = when()
  const max = asyncOps - 1
  const result = (...args) => {
    const cb = args.pop()
    return fn(...args, (...args) => {
      cb(...args) // eslint-disable-line
      if (++result[count] > max) until()
    })
  }
  result[count] = 0
  Object.defineProperty(result, done, {
    get () { return until.done() }
  })
  return result
}
const whenifyMethod = (instance, method, opts) => {
  const result = whenify(instance[method].bind(instance), opts)
  instance[method] = result
  return result
}
const promisifyMethod = (instance, method) => {
  const result = promisify(instance[method])
  instance[method] = result
  return result
}
const immediate = promisify(setImmediate)
const timeout = promisify(setTimeout)

async function dhtBootstrap () {
  const node = dht()
  await once(node, 'listening')
  const { port } = node.address()
  return {
    port,
    bootstrap: [`127.0.0.1:${port}`],
    closeDht: () => node.destroy()
  }
}

module.exports = {
  done,
  when,
  whenify,
  whenifyMethod,
  promisifyMethod,
  promisify,
  immediate,
  timeout,
  once,
  count,
  dhtBootstrap
}
