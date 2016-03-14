var noble = require('../index');

var ANCS = function() {
  this._send_ns_notification = null;
  this._send_ds_notification = null;

  this._cur_ns_notification = null;
  this._cur_notif_attributes = null;
  this._cur_appattributes = null;

  ancs = this;

  this._notification_source = new noble.CharacteristicPeripheral({
    uuid: '9FBF120D630142D98C5825E699A21DBD',
    properties: ['notify'],
    onSubscribe: function(maxValueSize, updateValueCallback) {
      console.log('Watch subscribed to the notification source');
      ancs._send_ns_notification = updateValueCallback;
    },
    onUnsubscribe: function() {
      console.log('Watch unsubscribed to the notificationSource');
      ancs._send_ns_notification = null;
    },
  });

  this._data_source = new noble.CharacteristicPeripheral({
    uuid: '22EAC6E9-24D6-4BB5-BE44-B36ACE7C7BFB',
    properties: ['notify'],
    onSubscribe: function(maxValueSize, updateValueCallback) {
      console.log('Watch subscribed to the data source');
      ancs._send_ds_notification = updateValueCallback;
    },
    onUnsubscribe: function() {
      console.log('Watch unsubscribed to the data source');
      ancs._send_ds_notification = null;
    },
  });

  this._control_point = new noble.CharacteristicPeripheral({
    uuid: '69D1D8F3-45E1-49A8-9821-9BBDFDAAD9D9',
    properties: ['write'],
    onWriteRequest: function(data, offset, withoutResponse, callback) {
      // console.log('Got a control point write request');

      var data;
      if (data[0] == 0) {
        console.log('Get notif attributes');
        data = ancs._cur_notif_attributes;
      } else if (data[0] == 1) {
        console.log('Get app attributes');
        data = ancs._cur_app_attributes;
      } else {
        console.log('Unknown control point request: ' + data[0]);
      }

      if (ancs._send_ds_notification && data) {
        console.log('Sending DS notification');
        ancs._send_ds_notification(data);
      } else {
        console.log('Error sending DS notification');
      }

      callback(this.RESULT_SUCCESS);
    },
  });

  this._ancs_service = new noble.PrimaryService({
    uuid: '7905F431B5CE4E99A40F4B1E122D00D0',
    characteristics: [
        ancs._notification_source,
        ancs._control_point,
        ancs._data_source,
    ],
  });
};

ANCS.prototype.get_service = function() {
  return this._ancs_service;
};

ANCS.prototype.send_notification = function(ns_notification, notif_attributes, app_attributes) {
  if (this._send_ns_notification) {
    console.log('Sending notification');
    this._cur_ns_notification = ns_notification;
    this._cur_notif_attributes = notif_attributes;
    this._cur_app_attributes = app_attributes;
    this._send_ns_notification(ns_notification);
  } else {
    console.log('Error sending notification');
  }
};

module.exports = ANCS;
