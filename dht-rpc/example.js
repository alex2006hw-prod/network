const dht = require('./')

const port = 10001
const bootstrap = dht({
  ephemeral: true
})

bootstrap.listen(Number(port))

const nodes = []
var swarm = 5
loop(null)

/// ///////////////////
function loop (err) {
  // console.info('1.dht-rpc loop swarm : ',swarm)
  if (err) throw err
  if (swarm--) addNode(loop)
  else done()
}

function done () {
  const i = Math.floor(Math.random() * nodes.length)
  const rs = nodes[i].update('hi', Buffer.alloc(32))
  const rsNode = rs._node
  const id = rsNode.id.toString('hex')
  const nodeLatestPort = rsNode.nodes.latest.port
  const nodeLatestPrevPort = rsNode.nodes.latest.prev.port
  const nodeOldestPort = rsNode.nodes.oldest.port
  const nodeOldestNextPort = rsNode.nodes.oldest.next.port
  const nodeCount = rsNode.nodes.length
  const bucketId = rsNode.bucket.localNodeId.toString('hex')
  console.info('1.dht-rpc executing update : ',
    // rsNode,
    '\n count  : ' + nodeCount + ' : index : ' + i,
    '\n node   : ' + id,
    '\n oldest : ' + nodeOldestPort + ' -> ' + nodeOldestNextPort,
    '\n latest : ' + nodeLatestPort + ' <- ' + nodeLatestPrevPort,
    '\n bucket : ', bucketId
  )
  rs.resume()
  rs.on('end', function () {
    setTimeout(done, 2000)
  })
}

function addNode (cb) {
  var counter = 0
  let r = Math.floor(Math.random() * (counter + 100))
  const node = dht({
    bootstrap: [
      Number(port)
    ]
  })

  node.command('hi', {
    update (query, cb) {
      console.info(node.id.toString('hex') + ' : count : ', ++counter, r)
      cb(null)
    },
    query (query, cb) {
      cb(null)
    }
  })

  node.once('ready', function () {
    console.log('1.dht-rpc addNode : ', node.id.toString('hex'))
    nodes.push(node)
    cb()
  })
}
