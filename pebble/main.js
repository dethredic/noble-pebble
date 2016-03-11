var noble = require('../index');

var ANCS = require('./ancs');
var PebblePair = require('./pair');
var ANCSNotifBuilder = require('./ancs_notif_builder');

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

var notif_uid = 10;
var ns_notif = notif_builder.create_ns_notification(notif_uid);

var app_id = new Buffer("com.phil.is.awesome");
var title = new Buffer("Phil");
var subtitle = new Buffer("Rules");
var message = new Buffer("We are about to go for sushi and I'm starving");
var date = new Buffer("20160901T141523");
var notif_attributes = notif_builder.create_notif_attribtues(notif_uid, app_id, title, subtitle, message, date);

var display_name = new Buffer("Display Name");
var app_attributes = notif_builder.create_app_attributes(app_id, display_name);


var prompt = require('prompt');
prompt.start();
prompt.get(['a'], function (err, result) {
  ancs.send_notification(ns_notif, notif_attributes, app_attributes);
});
