const { generateWithFallback } = require('../integrations/gemini/client');
const Email = require('../models/Email');
const logger = require('../utils/logger');
const { withRetry } = require('../utils/retry');

/**
 * Generates 3 distinct, concise, professional reply draft options for a given email
 */
async function generateReplyDrafts(emailDoc) {
  if (!emailDoc) throw new Error('Email document required');

  const prompt = `
You are an expert executive communication assistant.
Generate 3 distinct, concise, and professional email reply options (Option 1: Positive/Acceptance, Option 2: Polite Acknowledgement / Need More Time, Option 3: Polite Decline or Request for Clarification) based on the received email metadata below.

EMAIL CONTEXT:
From: ${emailDoc.sender}
Subject: ${emailDoc.subject}
Summary / Snippet: ${emailDoc.summary || emailDoc.snippet}

INSTRUCTIONS:
1. Keep each option concise (under 60-80 words).
2. Ensure high professionalism and natural tone.
3. Use clean formatting and placeholder [Your Name].
4. Output strictly valid JSON without markdown code fences in this exact format:
{
  "options": [
    {
      "label": "Option 1: Quick Acceptance / Confirmation",
      "text": "Dear ...\\n\\nBest regards,\\n[Your Name]"
    },
    {
      "label": "Option 2: Acknowledgement / Request Details",
      "text": "Dear ...\\n\\nBest regards,\\n[Your Name]"
    },
    {
      "label": "Option 3: Polite Decline / Reschedule",
      "text": "Dear ...\\n\\nBest regards,\\n[Your Name]"
    }
  ]
}
`;

  try {
    const result = await withRetry(
      () =>
        generateWithFallback({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2,
            maxOutputTokens: 1024,
            thinkingConfig: {
              thinkingBudget: 0
            }
          }
        }),
      { context: `Draft replies for: ${emailDoc.subject}` }
    );

    const responseText = result.response.text().trim();
    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch (e) {
      const cleaned = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleaned);
    }

    return parsed.options || [];
  } catch (error) {
    logger.error({ error: error.message, emailId: emailDoc._id }, 'Failed to generate reply drafts with AI. Using fallback templates.');
    return [
      {
        label: "Option 1: Standard Acknowledgement",
        text: `Dear ${emailDoc.sender || 'Sir/Madam'},\n\nThank you for your email regarding "${emailDoc.subject}". I have received your message and will review the details and respond shortly.\n\nBest regards,\n[Your Name]`
      },
      {
        label: "Option 2: Positive Confirmation",
        text: `Dear ${emailDoc.sender || 'Sir/Madam'},\n\nThank you for reaching out. I confirm receipt and agree with the proposed details for "${emailDoc.subject}". Please let me know if you need anything else from my end.\n\nBest regards,\n[Your Name]`
      }
    ];
  }
}

module.exports = {
  generateReplyDrafts
};
