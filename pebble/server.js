
const Hapi = require('hapi');
const hapiServer = new Hapi.Server();

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
                reply.file('./public/hello.html');
            }
        });
    });

    hapiServer.start((err) => {
        if (err) {
            return;
        }

        console.log('hapiServer running at:', hapiServer.info.uri);
    });
};

module.exports = server;