require('dotenv').config();

const Hapi = require('@hapi/hapi');
const routes = require('../server/routes');
const loadModel = require('../services/loadModel');
const InputError = require('../exceptions/InputError');

(async () => {
    try {
        const server = await createServer();

        await startServer(server);
    } catch (error) {
        console.error(`Error starting server: ${error.message}`);
    }
})();

async function createServer() {
    const server = Hapi.server({
        port: process.env.PORT || 3000,
        host: '0.0.0.0',
        routes: {
            cors: {
                origin: ['*'],
            },
        },
    });

    const model = await loadModel();
    server.app.model = model;

    server.route(routes);

    server.ext('onPreResponse', handleResponse);

    return server;
}

async function startServer(server) {
    await server.start();
    console.log(`Server started at: ${server.info.uri}`);
}

function handleResponse(request, h) {
    const response = request.response;

    if (response.isBoom && response.output.statusCode === 413) {
        return handlePayloadTooLarge(h);
    }

    if (response instanceof InputError || response.isBoom) {
        return handlePredictionError(response, h);
    }

    return h.continue;
}

function handlePayloadTooLarge(h) {
    const newResponse = h.response({
        status: 'fail',
        message: 'Payload content length greater than maximum allowed: 1000000',
    });

    newResponse.code(413);
    return newResponse;
}

function handlePredictionError(response, h) {
    const statusCode = response instanceof InputError ? response.statusCode : response.output.statusCode;
    const newResponse = h.response({
        status: 'fail',
        message: 'Terjadi kesalahan dalam melakukan prediksi',
    });

    newResponse.code(parseInt(statusCode));
    return newResponse;
}
