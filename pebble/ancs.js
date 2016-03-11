var noble = require('../index');

var ANCS = function() {
  this._send_ns_notification = null;
  this._send_ds_notification = null;
  this._connected = false;


  this._notification_source = new noble.CharacteristicPeripheral({
    uuid: '9FBF120D630142D98C5825E699A21DBD',
    properties: ['notify'],
    onSubscribe: function(maxValueSize, updateValueCallback) {
      console.log('Watch subscribed to the notification source');
      this._send_ns_notification = updateValueCallback;
    },
    onUnsubscribe: function() {
      console.log('Watch unsubscribed to the notificationSource');
      this._send_ns_notification = null;
    },
  });

  this._dataSource = new noble.CharacteristicPeripheral({
    uuid: '22EAC6E9-24D6-4BB5-BE44-B36ACE7C7BFB',
    properties: ['notify'],
    onSubscribe: function(maxValueSize, updateValueCallback) {
      console.log('Watch subscribed to the data source');
      this._send_ds_notification = updateValueCallback;
    },
    onUnsubscribe: function() {
      console.log('Watch unsubscribed to the data source');
      this._send_ds_notification = null;
    },
  });

  this._controlPoint = new noble.CharacteristicPeripheral({
    uuid: '69D1D8F3-45E1-49A8-9821-9BBDFDAAD9D9',
    properties: ['write'],
    onWriteRequest: function(data, offset, withoutResponse, callback) {
      // console.log('Got a control point write request');
      // console.log(data.toString('hex'));

      var data;
      if (data[0] == 0) {
        console.log('Get notif attributes');
        data = new Buffer([
          0x00, 0x00, 0x00, 0x00, 0x00, 0x06, 0x00, 0x00, 0x07, 0x05, 0x00, 0x43, 0x6c, 0x65, 0x61, 0x72,
          0x00, 0x13, 0x00, 0x63, 0x6f, 0x6d, 0x2e, 0x61, 0x70, 0x70, 0x6c, 0x65, 0x2e, 0x4d, 0x6f, 0x62,
          0x69, 0x6c, 0x65, 0x53, 0x4d, 0x53, 0x01, 0x13, 0x00, 0x46, 0x72, 0x61, 0x6e, 0x63, 0x6f, 0x69,
          0x73, 0x20, 0x42, 0x61, 0x6c, 0x64, 0x61, 0x73, 0x73, 0x61, 0x72, 0x69, 0x02, 0x00, 0x00, 0x03,
          0x1b, 0x00, 0x74, 0x68, 0x69, 0x73, 0x20, 0x69, 0x73, 0x20, 0x61, 0x20, 0x74, 0x65, 0x73, 0x74,
          0x20, 0x6e, 0x6f, 0x74, 0x69, 0x66, 0x69, 0x63, 0x61, 0x74, 0x69, 0x6f, 0x6e, 0x05, 0x0f, 0x00,
          0x32, 0x30, 0x31, 0x36, 0x30, 0x36, 0x31, 0x35, 0x54, 0x31, 0x36, 0x31, 0x38, 0x33, 0x37,
        ]);
      } else if (data[0] == 1) {
        console.log('Get app attributes');
        data = new Buffer([
          0x01, 0x63, 0x6f, 0x6d, 0x2e, 0x61, 0x70, 0x70, 0x6c, 0x65, 0x2e, 0x4d, 0x6f, 0x62, 0x69, 0x6c,
          0x65, 0x53, 0x4d, 0x53, 0x00, 0x00, 0x08, 0x00, 0x4d, 0x65, 0x73, 0x73, 0x61, 0x67, 0x65, 0x73,
        ]);
      } else {
        console.log('Unknown control point request: ' + data[0]);
      }

      if (this._send_ds_notification) {
        console.log('Sending DS notification');
        this._send_ds_notification(data);
      } else {
        console.log('Can\'t send DS notification');
      }
    },
  });

  this._ancs_service = new noble.PrimaryService({
    uuid: '7905F431B5CE4E99A40F4B1E122D00D0',
    characteristics: [
        this._notification_source,
        this._controlPoint,
        this._dataSource,
    ],
  });
};

ANCS.prototype.get_service = function() {
  return this._ancs_service;
};

ANCS.prototype.send_notification = function(data) {
  if (this.send_ns_notification && this.send_ds_notification) {
    console.log('Sending notification');
    var data = new Buffer([
      0x00, // EventID (Added)
      0x00, // EventFlags
      0x04, // CategoryID (Social)
      0x00, // CategoryCount
      0x00, 0x00, 0x00, 0x00, // NotificationUID
    ]);
    this._send_ns_notification(data);
  } else {
    console.log('Can\'t send notification');
  }
};

module.exports = ANCS;
