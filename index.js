var mqtt = require('mqtt')
var client  = mqtt.connect('tcp://broker.hivemq.com:1883');
 
client.on('connect', function () {
  client.subscribe('iot-hub-kzn-marat-mikhail', function (err) {
    if (!err) {
      client.publish('presence', 'Hello mqtt')
    }
  })
})
 
client.on('message', function (topic, message) {
  // message is Buffer
  console.log(message.toString())
  client.end()
})

// controller.js
const mqtt = require('mqtt')
const client = mqtt.connect('mqtt://broker.hivemq.com')

var garageState = ''
var connected = false

client.on('connect', () => {
  client.subscribe('iot/send');
})

client.on('message', (topic, message) => {
  switch (topic) {
    case 'iot/send':
        return console.log('Send',message);
  }
  console.log('No handler for topic %s', topic)
})

function openGarageDoor () {
  // can only open door if we're connected to mqtt and door isn't already open
  if (connected && garageState !== 'open') {
    // Ask the door to open
    client.publish('garage/open', 'true')
  }
}

function closeGarageDoor () {
  // can only close door if we're connected to mqtt and door isn't already closed
  if (connected && garageState !== 'closed') {
    // Ask the door to close
    client.publish('garage/close', 'true')
  }
}

// --- For Demo Purposes Only ----//

// simulate opening garage door
setTimeout(() => {
  console.log('open door')
  openGarageDoor()
}, 5000)

// simulate closing garage door
setTimeout(() => {
  console.log('close door')
  closeGarageDoor()
}, 20000)