const path = require('path');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const handlers = require('./handlers');

const PROTO_PATH = path.join(__dirname, '../../proto/subscriptions.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const proto = grpc.loadPackageDefinition(packageDefinition).subscriptions;

/**
 * Create and start the gRPC server.
 * @param {number} port
 * @returns {Promise<import('@grpc/grpc-js').Server>}
 */
function startGrpcServer(port) {
  return new Promise((resolve, reject) => {
    const server = new grpc.Server();

    server.addService(proto.SubscriptionService.service, {
      Subscribe: handlers.subscribe,
      Confirm: handlers.confirm,
      Unsubscribe: handlers.unsubscribe,
      ListSubscriptions: handlers.listSubscriptions,
    });

    server.bindAsync(
      `0.0.0.0:${port}`,
      grpc.ServerCredentials.createInsecure(),
      (err) => {
        if (err) return reject(err);
        console.log(`gRPC server running on port ${port}`);
        resolve(server);
      }
    );
  });
}

module.exports = { startGrpcServer };
