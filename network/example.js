const network = require('./')
const crypto = require('crypto')

const net = network()

const FLAG_NAUTILUS = 'nautilus'
const announcing = true

const k = crypto.createHash('sha256')
  .update(FLAG_NAUTILUS)
  .digest()

// const k = crypto.createHash('sha256')
//   .update(process.argv[2])
//   .digest()

console.info('key :',k.toString('hex'))
net.discovery.holepunchable((err, yes) => console.log('network is hole punchable?', err, yes))

net.on('connection', function (socket, info) {
  console.log('new connection!', info)
  process.stdin.pipe(socket).pipe(process.stdout)
})



net.join(k, {
  announce: announcing,
  lookup: !announcing
})

process.once('SIGINT', function () {
  console.log('Shutting down ...')
  net.discovery.destroy()
  net.discovery.on('close', function () {
    process.exit()
  })
})
