var

    io = require('../node_modules/socket.io-client'),

    ioClient = io.connect('ws://localhost:8081');


ioClient.emit('subscribe','DataChange','/test/url');
ioClient.on('foo', function(msg) {

    console.log(msg);

});
