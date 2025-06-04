require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const expressStaticGzip = require('express-static-gzip');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Serve static files from the 'public' directory with compression support
// Check if dist directory exists, otherwise fallback to public
const staticDir = fs.existsSync(path.join(__dirname, 'dist')) ? 'dist' : 'public';
app.use('/', expressStaticGzip(path.join(__dirname, staticDir), {
  enableBrotli: true,
  orderPreference: ['br', 'gz'],
  serveStatic: {
    maxAge: '1y',
    setHeaders: function (res, path) {
      if (path.endsWith('.html')) {
        res.setHeader('Cache-Control', 'public, max-age=0');
      }
    }
  }
}));

// Proxy endpoints for each AI model
app.post('/api/chatgpt', async (req, res) => {
  try {
    const { apiKey, messages } = req.body;
    
    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }
    
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages,
      temperature: 0.7
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    });
    
    return res.json(response.data);
  } catch (error) {
    console.error('ChatGPT API Error:', error.response?.data || error.message);
    return res.status(error.response?.status || 500).json({
      error: error.response?.data?.error?.message || 'Failed to get response from OpenAI'
    });
  }
});

app.post('/api/claude', async (req, res) => {
  try {
    const { apiKey, messages } = req.body;
    
    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }
    
    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-3-opus-20240229',
      messages,
      max_tokens: 1000
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      }
    });
    
    return res.json(response.data);
  } catch (error) {
    console.error('Claude API Error:', error.response?.data || error.message);
    return res.status(error.response?.status || 500).json({
      error: error.response?.data?.error?.message || 'Failed to get response from Anthropic'
    });
  }
});

app.post('/api/deepseek', async (req, res) => {
  try {
    const { apiKey, messages } = req.body;
    
    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }
    
    const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
      model: 'deepseek-chat',
      messages
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    });
    
    return res.json(response.data);
  } catch (error) {
    console.error('DeepSeek API Error:', error.response?.data || error.message);
    return res.status(error.response?.status || 500).json({
      error: error.response?.data?.error?.message || 'Failed to get response from DeepSeek'
    });
  }
});

app.post('/api/grok', async (req, res) => {
  try {
    const { apiKey, messages } = req.body;
    
    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }
    
    const response = await axios.post('https://api.grok.x.ai/v1/chat/completions', {
      model: 'grok-1',
      messages
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    });
    
    return res.json(response.data);
  } catch (error) {
    console.error('Grok API Error:', error.response?.data || error.message);
    
    // Ensure we always return a valid JSON response
    let errorMessage = 'Failed to get response from Grok';
    let statusCode = 500;
    
    try {
      if (error.response) {
        statusCode = error.response.status || 500;
        if (error.response.data) {
          if (typeof error.response.data === 'string') {
            // Handle string error responses
            errorMessage = error.response.data;
          } else if (error.response.data.error) {
            // Handle structured error responses
            errorMessage = error.response.data.error.message || error.response.data.error || errorMessage;
          }
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
    } catch (parseError) {
      console.error('Error parsing Grok API error response:', parseError);
    }
    
    return res.status(statusCode).json({
      error: errorMessage
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
