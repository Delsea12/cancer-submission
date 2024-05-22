const tf = require('@tensorflow/tfjs-node');
const InputError = require('../exceptions/InputError');

async function predictClassification(model, image) {
    try {
        const tensor = preprocessImage(image);
        const confidenceScore = await getConfidenceScore(model, tensor);
        const { result, suggestion } = determineResult(confidenceScore);

        return { result, suggestion };

    } catch (error) {
        throw new InputError(`Terjadi kesalahan input: ${error.message}`);
    }
}

function preprocessImage(image) {
    return tf.node
        .decodeJpeg(image)
        .resizeNearestNeighbor([224, 224])
        .expandDims()
        .toFloat();
}

async function getConfidenceScore(model, tensor) {
    const prediction = model.predict(tensor);
    const score = await prediction.data();
    return score[0] * 100;
}

function determineResult(confidenceScore) {
    if (confidenceScore > 50) {
        return {
            result: "Cancer",
            suggestion: "Segera periksa ke dokter!"
        };
    } else {
        return {
            result: "Non-cancer",
            suggestion: "Anda sehat!"
        };
    }
}

module.exports = predictClassification;
