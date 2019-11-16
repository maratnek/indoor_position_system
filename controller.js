// controller.js
const express = require('express')
var path = require('path');
const app = express()
const port = 3000

const mqtt = require('mqtt')
const client = mqtt.connect('mqtt://broker.hivemq.com')

let topic = 'iot-hub-kzn-marat-mikhail';
let topic_send = 'iot-hub-kzn-marat-mikhail-receive';

client.on('connect', () => {
  client.subscribe(topic);
})

client.on('message', (topic, message) => {
  switch (topic) {
    case topic:
      return calculateXY(message)
  }
  console.log('No handler for topic %s', topic)
})

let pos;

function calculateXY (message) {
//   console.log('calculate connected status %s', message)

  var obj = JSON.parse(message);
//   var pos = calculateData(obj);
    pos = calculateData(obj);


  console.log('publish data');
  setTimeout(()=>{
    client.publish(topic_send, JSON.stringify(pos));
  }, 3000);
}

// app.get('/', function(req, res) {
//     res.sendFile(path.join(__dirname + '/index.html'));
// });

app.get('/data', (req, res) => res.send(pos));

function getDistance(rssi, calibratedRssi, pathLossFactor) {
    console.log('get distance');
    return Math.pow(10.0, (calibratedRssi - rssi) / (10.0 * pathLossFactor));
}

function roundToTwo(num) {    
    return +(Math.round(num + "e+2")  + "e-2");
}

var trilateration = require('trilateration');

function distance_rssi(rssi_d) {
    console.log('Rssi ', rssi_d);
    let rssi = Math.abs(rssi_d);
    if (30 < rssi && rssi <= 40)
        return 0.5;
    else if (40 < rssi && rssi <= 50)
        return 1;
    else if (50 < rssi && rssi <= 60)
        return 2.5;
    else if (60 < rssi && rssi <= 70)
        return 5;
    else if (70 < rssi && rssi <= 80)
        return 7.5;
    else if (80 < rssi && rssi <= 90)
        return 17.5;
    else if (90 < rssi && rssi <= 100)
        return 30;
    console.log('Errror rssi', rssi)

}

function getTrilateration(position1, position2, position3) {
    var xa = position1.x;
    var ya = position1.y;
    var xb = position2.x;
    var yb = position2.y;
    var xc = position3.x;
    var yc = position3.y;
    var ra = position1.distance;
    var rb = position2.distance;
    var rc = position3.distance;

    var S = (Math.pow(xc, 2.) - Math.pow(xb, 2.) + Math.pow(yc, 2.) - Math.pow(yb, 2.) + Math.pow(rb, 2.) - Math.pow(rc, 2.)) / 2.0;
    var T = (Math.pow(xa, 2.) - Math.pow(xb, 2.) + Math.pow(ya, 2.) - Math.pow(yb, 2.) + Math.pow(rb, 2.) - Math.pow(ra, 2.)) / 2.0;
    var y = ((T * (xb - xc)) - (S * (xb - xa))) / (((ya - yb) * (xb - xc)) - ((yc - yb) * (xb - xa)));
    var x = ((y * (ya - yb)) - T) / (xb - xa);

    return {
        x: x,
        y: y
    };
}

function calculateData(data) {

    let arr = [];

    for (const iter in data) {
        if (data.hasOwnProperty(iter)) {
            const beacon = data[iter];
            arr.push(beacon);
        }
    }
    arr.sort((a,b)=> {return b.rssi - a.rssi;});

    let new_arr = [];
    let count = 0;
    for (const beacon of arr) {

        let x = beacon.xCord / 100.0;
        let y = beacon.yCord / 100.0;
        let id = beacon.beaconId;
        // trilateration.addBeacon(id - 1, trilateration.vector(x, y));
    }
    let positArr = [];

    for (const beacon of arr) {

        let x = beacon.xCord / 100;
        let y = beacon.yCord / 100;
        let dis = getDistance(beacon.rssi, beacon.rssCalib, 2);
        // let dis = distance_rssi(beacon.rssi);
        let id = beacon.beaconId;
        console.log(x, y, dis, id);
        // trilateration.setDistance(id - 1, Math.floor(dis));
        // if (id == 1 || id == 3 || id == 7)
        if(count++ == 3)
            break;
        new_arr.push({ x: roundToTwo(x), y: roundToTwo(y), distance: roundToTwo(dis) });

    }

    for (let i = 0; i < new_arr.length; i++) {
        const elem = new_arr[i];
        var vec = trilateration.vector(elem.x, elem.y);
        console.log(i, vec);
        trilateration.addBeacon(i, vec);
    }
    for (let i = 0; i < new_arr.length; i++) {
        const elem = new_arr[i];
        var distance = Math.floor(elem.distance);
        console.log(i,distance)
        trilateration.setDistance(i, distance);
    }

    let position = getTrilateration(new_arr[0], new_arr[1], new_arr[2]);
    console.log('get trialiter', position);


    return position;
}



app.listen(port, () => console.log(`Example app listening on port ${port}!`))