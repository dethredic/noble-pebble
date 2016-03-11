
const Hapi = require('hapi');
const hapiServer = new Hapi.Server();
const ANCSNotifBuilder = require('./ancs_notif_builder');
var notif_builder = new ANCSNotifBuilder();

var lastUid = 0;

var server =  function() {
  hapiServer.connection({
    host: 'localhost',
    port: '8080'
  });

  hapiServer.register(require('inert'), (err) => {

    if (err) {
      return;
    }

    hapiServer.route({
      method: 'GET',
      path: '/ancs',
      handler: function (request, reply) {
        reply.file('./pebble/view/ancs_form.html');
      }
    });

    hapiServer.route({
      method: 'POST',
      path: '/ancs',
      handler: function (request, reply) {
        var notificationUID = lastUid++;
        var notification = notif_builder.create_ns_notification(notificationUID);

        var payload = request.payload;
        var appIdentifier = new Buffer(payload['appIdentifier']);
        var title = new Buffer(payload['title']);
        var subtitle = new Buffer(payload['subtitle']);
        var message = new Buffer(payload['message']);
        // var date = new Buffer(new Date(payload['date']).toISOString());
        var date = new Buffer("20160901T141523");


        var notificationAttributes = notif_builder.create_notif_attribtues(
          notificationUID,
          appIdentifier,
          title,
          subtitle,
          message,
          date
        );

        var displayName = new Buffer(payload['appName']);
        var appAttributes = notif_builder.create_app_attributes(appIdentifier, displayName);

        ancs.send_notification(notification, notificationAttributes, appAttributes);

        reply.file('./pebble/view/ancs_form.html');
      }
    });
  });

  hapiServer.start((err) => {
    if (err) {
      return;
    }

    console.log('Open ' + hapiServer.info.uri + '/ancs to use send an ANCS notification.');
  });
};

module.exports = server;
