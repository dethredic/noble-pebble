var noble = require('../index');

var notificationSource = new noble.CharacteristicPeripheral({
    uuid: '9FBF120D630142D98C5825E699A21DBD',
    properties: ['notify'],
});

var controlPoint = new noble.CharacteristicPeripheral({
    uuid: '69D1D8F3-45E1-49A8-9821-9BBDFDAAD9D9',
    properties: ['write'],
    onWriteRequest: function(data, offset, withoutResponse, callback) {
      console.log('Got a control point write request');
    },
});

var dataSource = new noble.CharacteristicPeripheral({
    uuid: '22EAC6E9-24D6-4BB5-BE44-B36ACE7C7BFB',
    properties: ['notify'],
});

var ANCS = new noble.PrimaryService({
    uuid: '7905F431B5CE4E99A40F4B1E122D00D0',
    characteristics: [
        notificationSource,
        controlPoint,
        dataSource,
    ],
});


noble.on('stateChange', function(state) {
  if (state === 'poweredOn') {
    noble.setServices([ANCS]);
    // noble.startAdvertising("Pebble ANCS", [ANCS.uuid], function(err) {
    //   if (err) {
    //     console.log(err);
    //   }
    // });

    noble.startScanning();
  } else {
    noble.stopScanning();
  }
});

noble.on('discover', function(peripheral) {
  var advertisement = peripheral.advertisement;

  var localName = advertisement.localName;
  if (localName) {
    console.log('Local Name: ' + localName);
  }

  if (localName == "Pebble Time LE 5BA8") {
    noble.stopScanning();
    peripheral.connect(function(error) {
      var serviceUUIDs = ["fed9"];
      var characteristicUUIDs = ["00000001328e0fbbc6421aa6699bdada", "00000002328e0fbbc6421aa6699bdada"];
      peripheral.discoverSomeServicesAndCharacteristics(serviceUUIDs, characteristicUUIDs, function(error, services, characteristics) {
        var connectivity_status = characteristics[0];
        var trigger_pairing = characteristics[1];

        // Write to CCCD so the watch treats us as a gateway
        connectivity_status.discoverDescriptors(function(error, descriptors) {
          var CCCD = descriptors[0];
          descriptors[0].writeValue(new Buffer([0x01, 0x01]), function(error) {
            console.log('Wrote to CCCD');
          });
        });

        // Trigger pairing
        console.log('Triggering Pairing');
        trigger_pairing.read(function(error, data) {});
      });
    });
    return;
  }
});
