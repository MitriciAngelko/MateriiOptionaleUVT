const express = require('express');
const { getAIResponse } = require('../services/openaiService');

const router = express.Router();

/**
 * POST /chat
 * Get AI response for user query
 * Body: { message: string, previousResponseId?: string }
 */
router.post('/chat', async (req, res) => {
  try {
    const { message, previousResponseId } = req.body;

    if (!message) {
      return res.status(400).json({
        error: 'Message is required',
        message: 'Please provide a message in the request body'
      });
    }

    const result = await getAIResponse(message, previousResponseId);
    
    res.json({
      success: true,
      response: result.text,
      responseId: result.responseId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('OpenAI API error:', error);
    res.status(500).json({
      error: 'AI service unavailable',
      message: error.message || 'Failed to get AI response',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /status
 * Check OpenAI service status
 */
router.get('/status', (req, res) => {
  const hasApiKey = !!process.env.OPENAI_API_KEY;
  
  res.json({
    service: 'OpenAI',
    status: hasApiKey ? 'available' : 'unavailable',
    configured: hasApiKey,
    timestamp: new Date().toISOString()
  });
});

module.exports = router; 