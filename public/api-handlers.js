// API Handlers for different AI models
// This file contains the proxy integration code for each model

// Base API Handler class
class ApiHandler {
    constructor(apiKey) {
        this.apiKey = apiKey;
        // Base URL for the proxy server - will be updated based on deployment
        this.proxyBaseUrl = '/api';
    }
    
    async sendMessage(message) {
        throw new Error('Method not implemented');
    }
}

// ChatGPT (OpenAI) API Handler
class ChatGptHandler extends ApiHandler {
    constructor(apiKey) {
        super(apiKey);
        this.proxyEndpoint = `${this.proxyBaseUrl}/chatgpt`;
        this.model = 'gpt-3.5-turbo'; // Can be updated to gpt-4 or other models
    }
    
    async sendMessage(message, conversationHistory = []) {
        try {
            // Format the conversation history for OpenAI API
            const messages = [
                ...conversationHistory.map(msg => ({
                    role: msg.sender === 'user' ? 'user' : 'assistant',
                    content: msg.content
                })),
                { role: 'user', content: message }
            ];
            
            if (!this.apiKey) {
                throw new Error('API key is required');
            }
            
            const response = await fetch(this.proxyEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    apiKey: this.apiKey,
                    messages: messages
                })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to get response from server');
            }
            
            const data = await response.json();
            return {
                success: true,
                data: {
                    message: data.choices[0].message.content,
                    model: data.model
                }
            };
        } catch (error) {
            console.error('ChatGPT API Error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// Claude (Anthropic) API Handler
class ClaudeHandler extends ApiHandler {
    constructor(apiKey) {
        super(apiKey);
        this.proxyEndpoint = `${this.proxyBaseUrl}/claude`;
        this.model = 'claude-3-opus-20240229'; // Can be updated to other Claude models
    }
    
    async sendMessage(message, conversationHistory = []) {
        try {
            // Format conversation for Claude API
            const messages = [
                ...conversationHistory.map(msg => ({
                    role: msg.sender === 'user' ? 'user' : 'assistant',
                    content: msg.content
                })),
                { role: 'user', content: message }
            ];
            
            if (!this.apiKey) {
                throw new Error('API key is required');
            }
            
            const response = await fetch(this.proxyEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    apiKey: this.apiKey,
                    messages: messages
                })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to get response from server');
            }
            
            const data = await response.json();
            return {
                success: true,
                data: {
                    message: data.content[0].text,
                    model: data.model
                }
            };
        } catch (error) {
            console.error('Claude API Error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// DeepSeek API Handler
class DeepSeekHandler extends ApiHandler {
    constructor(apiKey) {
        super(apiKey);
        this.proxyEndpoint = `${this.proxyBaseUrl}/deepseek`;
        this.model = 'deepseek-chat';
    }
    
    async sendMessage(message, conversationHistory = []) {
        try {
            // Format conversation for DeepSeek API
            const messages = [
                ...conversationHistory.map(msg => ({
                    role: msg.sender === 'user' ? 'user' : 'assistant',
                    content: msg.content
                })),
                { role: 'user', content: message }
            ];
            
            if (!this.apiKey) {
                throw new Error('API key is required');
            }
            
            const response = await fetch(this.proxyEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    apiKey: this.apiKey,
                    messages: messages
                })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to get response from server');
            }
            
            const data = await response.json();
            return {
                success: true,
                data: {
                    message: data.choices[0].message.content,
                    model: data.model
                }
            };
        } catch (error) {
            console.error('DeepSeek API Error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// Grok (xAI) API Handler
class GrokHandler extends ApiHandler {
    constructor(apiKey) {
        super(apiKey);
        this.proxyEndpoint = `${this.proxyBaseUrl}/grok`;
        this.model = 'grok-1';
    }
    
    async sendMessage(message, conversationHistory = []) {
        try {
            // Format conversation for Grok API
            const messages = [
                ...conversationHistory.map(msg => ({
                    role: msg.sender === 'user' ? 'user' : 'assistant',
                    content: msg.content
                })),
                { role: 'user', content: message }
            ];
            
            if (!this.apiKey) {
                throw new Error('API key is required');
            }
            
            const response = await fetch(this.proxyEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    apiKey: this.apiKey,
                    messages: messages
                })
            });
            
            // Check if response is ok
            if (!response.ok) {
                let errorData;
                try {
                    // Try to parse error as JSON
                    errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to get response from server');
                } catch (jsonError) {
                    // If JSON parsing fails, use text response or status
                    if (jsonError instanceof SyntaxError) {
                        const textError = await response.text().catch(() => null);
                        throw new Error(textError || `Server error: ${response.status}`);
                    }
                    throw jsonError; // Re-throw if it's the error we created above
                }
            }
            
            // Parse successful response
            let data;
            try {
                data = await response.json();
            } catch (jsonError) {
                console.error('Error parsing Grok response:', jsonError);
                throw new Error('Invalid response format from server');
            }
            
            // Validate response structure
            if (!data || !data.choices || !data.choices[0] || !data.choices[0].message) {
                throw new Error('Unexpected response format from Grok API');
            }
            
            return {
                success: true,
                data: {
                    message: data.choices[0].message.content,
                    model: data.model || 'grok-1'
                }
            };
        } catch (error) {
            console.error('Grok API Error:', error);
            return {
                success: false,
                error: error.message || 'An unknown error occurred'
            };
        }
    }
}

// Factory function to create the appropriate handler based on model
function createApiHandler(model, apiKey) {
    switch (model) {
        case 'chatgpt':
            return new ChatGptHandler(apiKey);
        case 'claude':
            return new ClaudeHandler(apiKey);
        case 'deepseek':
            return new DeepSeekHandler(apiKey);
        case 'grok':
            return new GrokHandler(apiKey);
        default:
            throw new Error(`Unsupported model: ${model}`);
    }
}

// Update proxy base URL based on deployment environment
function updateProxyBaseUrl(url) {
    ApiHandler.prototype.proxyBaseUrl = url;
}
