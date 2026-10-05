const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../../utils/logger');
const { sleep } = require('../../utils/retry');

let genAI = null;

const DEFAULT_MODEL = 'gemini-2.5-flash';
const FALLBACK_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
  'gemini-1.5-pro'
];

function getGeminiClient() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

function getGeminiModel(modelName = DEFAULT_MODEL) {
  const ai = getGeminiClient();
  return ai.getGenerativeModel({
    model: modelName
  });
}

/**
 * Generate content with automatic model fallback and retry for maximum resilience
 */
async function generateWithFallback(generateOptions) {
  const ai = getGeminiClient();
  let lastError;

  for (const modelName of FALLBACK_MODELS) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const model = ai.getGenerativeModel({ model: modelName });
        return await model.generateContent(generateOptions);
      } catch (err) {
        lastError = err;
        const is503 = err.status === 503 || err.message?.includes('503') || err.message?.includes('Service Unavailable');
        
        if (is503 && attempt === 1) {
          logger.warn(`Model ${modelName} returned 503. Retrying in 800ms...`);
          await sleep(800);
          continue;
        }

        logger.warn(`Model ${modelName} encountered error (${err.status || err.message?.slice(0, 80)}). Trying fallback model...`);
        break;
      }
    }
  }

  throw lastError;
}

module.exports = {
  getGeminiClient,
  getGeminiModel,
  generateWithFallback,
  DEFAULT_MODEL
};
