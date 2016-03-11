var ANCSNotifBuilder = function() {

};

ANCSNotifBuilder.prototype.create_ns_notification = function(notification_uid) {
  var ns_notification = new Buffer([
    0x00, // EventID (Added)
    0x00, // EventFlags
    0x04, // CategoryID (Social)
    0x00, // CategoryCount
    0x00, 0x00, 0x00, 0x00, // Notification UID (will be overwritten below)
  ]);
  ns_notification.writeUInt32LE(notification_uid, 4);
  return ns_notification;
};

ANCSNotifBuilder.prototype.create_notif_attribtues = function(notification_uid, app_id, title, subtitle, message, date) {
  var notif_attributes_size = 1 + 4 + 3 + app_id.length + 3 + title.length + 3 + subtitle.length + 3 + message.length + 3 + date.length;

  var notif_attributes = new Buffer(notif_attributes_size);
  var offset = 0;

  // Command ID
  notif_attributes.writeUInt8(0, offset);
  offset += 1;

  // UID
  notif_attributes.writeUInt32LE(notification_uid, offset);
  offset += 4;

  // // TODO: randomize the order of the following (to test our parser)

  // App ID
  notif_attributes.writeUInt8(0, offset);
  offset += 1;
  // Length
  notif_attributes.writeUInt16LE(app_id.length, offset);
  offset += 2;
  // Data
  app_id.copy(notif_attributes, offset);
  offset += app_id.length;

  // Title
  notif_attributes.writeUInt8(1, offset);
  offset += 1;
  // Length
  notif_attributes.writeUInt16LE(title.length, offset);
  offset += 2;
  // Data
  title.copy(notif_attributes, offset);
  offset += title.length;

  // Subtitle
  notif_attributes.writeUInt8(2, offset);
  offset += 1;
  // Length
  notif_attributes.writeUInt16LE(subtitle.length, offset);
  offset += 2;
  // Data
  subtitle.copy(notif_attributes, offset);
  offset += subtitle.length;

  // Message
  notif_attributes.writeUInt8(3, offset);
  offset += 1;
  // Length
  notif_attributes.writeUInt16LE(message.length, offset);
  offset += 2;
  // Data
  message.copy(notif_attributes, offset);
  offset += message.length;

  // Date
  notif_attributes.writeUInt8(5, offset);
  offset += 1;
  // Length
  notif_attributes.writeUInt16LE(date.length, offset);
  offset += 2;
  // Data
  date.copy(notif_attributes, offset);
  offset += date.length;

  return notif_attributes;
};

ANCSNotifBuilder.prototype.create_app_attributes = function(app_id, display_name) {
  var app_attributes = new Buffer([
    0x01, 0x63, 0x6f, 0x6d, 0x2e, 0x61, 0x70, 0x70, 0x6c, 0x65, 0x2e, 0x4d, 0x6f, 0x62, 0x69, 0x6c,
    0x65, 0x53, 0x4d, 0x53, 0x00, 0x00, 0x08, 0x00, 0x4d, 0x65, 0x73, 0x73, 0x61, 0x67, 0x65, 0x73,
  ]);
  return app_attributes;
};

module.exports = ANCSNotifBuilder;
