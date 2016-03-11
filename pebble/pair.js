var PebblePair = function() {
};

PebblePair.prototype.pair = function(peripheral) {
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
}

module.exports = PebblePair;
