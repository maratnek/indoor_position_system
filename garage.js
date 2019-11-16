// garage.js
const mqtt = require('mqtt')
const client = mqtt.connect('mqtt://broker.hivemq.com')

/**
 * The state of the garage, defaults to closed
 * Possible states : closed, opening, open, closing
 */

client.on('connect', () => {
  client.subscribe('iot/receive')
})

client.on('message', (topic, message) => {
  console.log('received message %s %s', topic, message)
  switch (topic) {
    case 'iot/receive':
      return receiveXY(message)
  }
})

client.publish('iot/send', JSON.stringify({UUID:43}));

function receiveXY (message) {
  console.log('receiveXY state ', message);
  setTimeout(()=>{
    client.publish('iot/send', JSON.stringify({UUID:43}));
  }, 3000);
}

function handleCloseRequest (message) {
  if (state !== 'closed' && state !== 'closing') {
    state = 'closing'
    sendStateUpdate()

    // simulate door closed after 5 seconds (would be listening to hardware)
    setTimeout(() => {
      state = 'closed'
      sendStateUpdate()
    }, 5000)
  }
}

/**
 * Want to notify controller that garage is disconnected before shutting down
 */
function handleAppExit (options, err) {
  if (err) {
    console.log(err.stack)
  }

  if (options.cleanup) {
    client.publish('garage/connected', 'false')
  }

  if (options.exit) {
    process.exit()
  }
}

/**
 * Handle the different ways an application can shutdown
 */
process.on('exit', handleAppExit.bind(null, {
  cleanup: true
}))
process.on('SIGINT', handleAppExit.bind(null, {
  exit: true
}))
process.on('uncaughtException', handleAppExit.bind(null, {
  exit: true
}))