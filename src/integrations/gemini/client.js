const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../../utils/logger');

let genAI = null;

const DEFAULT_MODEL = 'gemini-3.6-flash';
const FALLBACK_MODELS = ['gemini-3.6-flash', 'gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-flash-latest'];

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
 * Generate content with automatic model fallback for maximum resilience
 */
async function generateWithFallback(generateOptions) {
  const ai = getGeminiClient();
  let lastError;

  for (const modelName of FALLBACK_MODELS) {
    try {
      const model = ai.getGenerativeModel({ model: modelName });
      return await model.generateContent(generateOptions);
    } catch (err) {
      lastError = err;
      logger.warn(`Model ${modelName} encountered error (${err.status || err.message?.slice(0, 80)}). Trying fallback model...`);
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
