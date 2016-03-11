var noble = require('../index');

var ANCS = require('./ancs');
var PebblePair = require('./pair');
var ANCSNotifBuilder = require('./ancs_notif_builder');

var server = new (require('./server'))();

var ancs = new ANCS();
var pebble_pair = new PebblePair();
var notif_builder = new ANCSNotifBuilder();

noble.on('stateChange', function(state) {
  if (state === 'poweredOn') {
    noble.setServices([ancs.get_service()]);

    console.log('Scanning...');
    noble.startScanning();
  }
});

noble.on('discover', function(peripheral) {
  var advertisement = peripheral.advertisement;

  var localName = advertisement.localName;
  // if (localName) {
  //   console.log('Local Name: ' + localName);
  // }

  if (localName == "Pebble Time LE 5BA8") {
    console.log('Found ' + localName);
    noble.stopScanning();
    pebble_pair.pair(peripheral);
  }
});
