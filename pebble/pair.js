var noble = require('../index');

noble.on('stateChange', function(state) {
  if (state === 'poweredOn') {
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
        console.log('Got characteristics');
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
