const Groq = require('groq-sdk');
const logger = require('../../utils/logger');

let groqInstance = null;

function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return null;
  }

  if (!groqInstance) {
    groqInstance = new Groq({ apiKey });
  }

  return groqInstance;
}

/**
 * Creates chat completion using Groq with automatic model fallback
 */
async function createGroqChatCompletion({ messages, response_format, temperature = 0.1, max_tokens = 600 }) {
  const client = getGroqClient();
  if (!client) {
    throw new Error('GROQ_API_KEY is not configured');
  }

  const models = [
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
    'mixtral-8x7b-32768'
  ];
  let lastError = null;

  for (const model of models) {
    try {
      const params = {
        model,
        messages,
        temperature,
        max_tokens
      };

      if (response_format) {
        params.response_format = response_format;
      }

      const response = await client.chat.completions.create(params);

      return {
        modelUsed: model,
        content: response.choices[0]?.message?.content?.trim() || ''
      };
    } catch (err) {
      lastError = err;
      logger.warn({ model, error: err.message }, 'Groq model attempt failed, trying fallback model if available');
    }
  }

  throw lastError;
}

module.exports = {
  getGroqClient,
  createGroqChatCompletion
};
