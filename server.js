// https://grpc.io/docs/languages/node/quickstart
require('dotenv').config();

// npm run start -- 1 3001
global.app = {}
global.app.port = normalizePort(process.argv[3] || process.env.PORT || '50000');
global.app.nodeId = process.argv[2] || 0;
console.log('nodeId: '+app.nodeId + ' Port: ' + app.port);

// MONGODB
require('./starts/mongo');

// BLOCKCHAIN
require('./starts/blockchain');

// gRPC
require('./starts/grpc');

// UTILS

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
    var port = parseInt(val, 10);
  
    if (isNaN(port)) {
      // named pipe
      return val;
    }
  
    if (port >= 0) {
      // port number
      return port;
    }
  
    return false;
}
