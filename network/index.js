const discovery = require('@hyperswarm/discovery')
const utp = require('utp-native')
const net = require('net')
const { EventEmitter } = require('events')

module.exports = opts => new Swarm(opts)

class Swarm extends EventEmitter {
  constructor (opts) {
    super()

    if (!opts) opts = {}
    console.info('1.network Swarm options: ', opts)
    opts.socket = this.socket = opts.socket || utp()

    this.discovery = discovery(opts)
    this.server = net.createServer()
    this.queue = new Queue()

    const self = this

    this.server.on('connection', socket => self.emit('connection', socket, { type: 'tcp', client: false, peer: null }))
    this.socket.on('connection', socket => self.emit('connection', socket, { type: 'utp', client: false, peer: null }))

    this._bound = false
    this._topics = new Map()
  }

  join (key, opts) {
    if (!opts) opts = {}
    console.info('1.network Swarm join options: ', key.toString('hex'), opts)
    this._bind()
    this.leave(key)

    const localPort = this.socket.address().port
    const lookup = !!(opts && opts.lookup)
    const hex = key.toString('hex')

    const topic = opts.announce
      ? this.discovery.announce(key, { port: 0, localPort, lookup })
      : this.discovery.lookup(key)

    topic.on('peer', (peer) => this._onpeer(peer))
    topic.on('update', () => this.emit('update'))

    this._topics.set(hex, topic)
  }

  leave (key) {
    const hex = key.toString('hex')
    const prev = this._topics.get(hex)
    console.info('1.network Swarm leave: ', key.toString('hex'))
    if (prev) prev.destroy()
  }

  connect (peer, cb) {
    var utp = null
    var missing = 1
    var done = false

    const self = this
    const timeout = setTimeout(ontimeout, 10000)
    const tcp = net.connect(peer.port, peer.host)

    console.info('1.network Swarm connect: ',
      // peer,
      peer.referrer? peer.referrer.id.toString('hex') : {host: peer.host, port: peer.port},
    )

    tcp.on('connect', onconnect)
    tcp.on('error', onerror)
    tcp.on('close', onclose)

    if (!peer.referrer) return

    missing++
    this.discovery.holepunch(peer, onholepunch)

    function onholepunch (err) {
      if (err || done) return onclose()

      utp = self.socket.connect(peer.port, peer.host)
      utp.on('connect', onconnect)
      utp.on('error', onerror)
      utp.on('close', onclose)
    }

    function onconnect () {
      if (!finish()) return this.destroy()

      if (utp) utp.removeListener('close', onclose)
      tcp.removeListener('close', onclose)

      if (this === utp) tcp.destroy()
      else if (utp) utp.destroy()

      cb(null, this, { type: this === utp ? 'utp' : 'tcp', client: true, peer })
    }

    function ontimeout () {
      if (finish()) cb(new Error('Timed out trying to connect to peer'))
    }

    function onclose () {
      if (!--missing && finish()) cb(new Error('Could not connect to peer'))
    }

    function finish () {
      if (done) return false
      done = true
      clearTimeout(timeout)
      return true
    }
  }

  _bind () {
    if (this._bound) return
    this._bound = true
    this.socket.listen(0)
    this.server.listen(this.socket.address().port)
    console.info('1.network Swarm _bind port : ',this.socket.address().port)
  }

  _onpeer (peer) {
    this.emit('peer', peer)
    this.queue.push(peer)
    this._connectNext() // TODO: don't be this eager
    console.info('1.network Swarm _onpeer : ',
      // peer,
      peer.referrer? peer.referrer.id.toString('hex') : {host: peer.host, port: peer.port},
    )
  }

  _connectNext () {
    const self = this
    const peer = this.queue.pop()
    if (!peer) return
    this.connect(peer, function (err, socket, info) {
      if (err) return
      self.emit('connection', socket, info)
      self._connectNext() // TODO: don't be this eager
    })
    console.info('1.network Swarm _connectNext : ',
      // peer,
      peer.referrer? peer.referrer.id.toString('hex') : {host: peer.host, port: peer.port},
    )
  }
}

function onerror (err) {
  this.destroy(err)
}

class Queue {
  constructor () {
    this.local = []
    this.remote = []
    this.seen = new Map()
  }

  push (peer) {
    const id = peer.host + ':' + peer.port
    if (this.seen.has(id)) return
    this.seen.set(id, peer)
    if (peer.local) this.local.push(peer)
    else this.remote.push(peer)
    console.info('1.network Swarm push peer: ',
      // peer,
      peer.referrer? peer.referrer.id.toString('hex') : {host: peer.host, port: peer.port},
    )
  }

  pop (preferRemote) {
    console.info('1.network Swarm pop peer: local : ' + this.local.length + ' : remote : ' + this.remote.length)
    if (preferRemote) return this.remote.pop()
    return this.local.pop() || this.remote.pop()
  }
}
