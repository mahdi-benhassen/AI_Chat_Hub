// DOM Elements
const themeSwitch = document.getElementById('theme-switch');
const modelItems = document.querySelectorAll('.model-item');
const apiInputs = document.querySelectorAll('.api-input');
const toggleVisibilityButtons = document.querySelectorAll('.toggle-visibility');
const saveApiKeysButton = document.getElementById('save-api-keys');
const clearChatButton = document.getElementById('clear-chat');
const exportChatButton = document.getElementById('export-chat');
const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendMessageButton = document.getElementById('send-message');
const currentModelDisplay = document.getElementById('current-model');

// State variables
let currentModel = 'chatgpt';
let apiKeys = {
    chatgpt: '',
    claude: '',
    deepseek: '',
    grok: ''
};
let chatHistories = {
    chatgpt: [],
    claude: [],
    deepseek: [],
    grok: []
};

// Initialize the app
function initApp() {
    loadThemePreference();
    loadApiKeys();
    loadChatHistories();
    updateSendButtonState();
    checkServerStatus();
    
    // Auto-resize textarea
    userInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
        updateSendButtonState();
    });
}

// Check server status
function checkServerStatus() {
    fetch('/health')
        .then(response => {
            if (response.ok) {
                console.log('Server is online');
                // You could add a visual indicator here if desired
            }
        })
        .catch(error => {
            console.error('Server status check failed:', error);
            // You could add a visual indicator here if desired
        });
}

// Theme toggle functionality
themeSwitch.addEventListener('change', function() {
    if (this.checked) {
        document.body.classList.remove('light-theme');
        document.body.classList.add('dark-theme');
        localStorage.setItem('theme', 'dark');
    } else {
        document.body.classList.remove('dark-theme');
        document.body.classList.add('light-theme');
        localStorage.setItem('theme', 'light');
    }
});

function loadThemePreference() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        themeSwitch.checked = true;
        document.body.classList.remove('light-theme');
        document.body.classList.add('dark-theme');
    } else {
        themeSwitch.checked = false;
        document.body.classList.remove('dark-theme');
        document.body.classList.add('light-theme');
    }
}

// Model selection functionality
modelItems.forEach(item => {
    item.addEventListener('click', function() {
        const model = this.getAttribute('data-model');
        setActiveModel(model);
    });
});

function setActiveModel(model) {
    currentModel = model;
    
    // Update UI
    modelItems.forEach(item => {
        if (item.getAttribute('data-model') === model) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    currentModelDisplay.textContent = capitalizeFirstLetter(model);
    
    // Load chat history for selected model
    displayChatHistory(model);
    
    // Update send button state
    updateSendButtonState();
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// API key functionality
toggleVisibilityButtons.forEach(button => {
    button.addEventListener('click', function() {
        const input = this.previousElementSibling;
        const icon = this.querySelector('i');
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    });
});

saveApiKeysButton.addEventListener('click', function() {
    saveApiKeys();
    showNotification('API keys saved successfully!');
    updateSendButtonState();
});

function saveApiKeys() {
    apiKeys = {
        chatgpt: document.getElementById('chatgpt-api').value,
        claude: document.getElementById('claude-api').value,
        deepseek: document.getElementById('deepseek-api').value,
        grok: document.getElementById('grok-api').value
    };
    
    localStorage.setItem('apiKeys', JSON.stringify(apiKeys));
}

function loadApiKeys() {
    const savedApiKeys = localStorage.getItem('apiKeys');
    if (savedApiKeys) {
        apiKeys = JSON.parse(savedApiKeys);
        
        document.getElementById('chatgpt-api').value = apiKeys.chatgpt || '';
        document.getElementById('claude-api').value = apiKeys.claude || '';
        document.getElementById('deepseek-api').value = apiKeys.deepseek || '';
        document.getElementById('grok-api').value = apiKeys.grok || '';
    }
}

// Chat functionality
sendMessageButton.addEventListener('click', sendMessage);
userInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

function sendMessage() {
    const message = userInput.value.trim();
    if (!message || !apiKeys[currentModel]) return;
    
    // Add user message to chat
    addMessageToChat('user', message);
    
    // Clear input
    userInput.value = '';
    userInput.style.height = 'auto';
    
    // Show typing indicator
    showTypingIndicator();
    
    // Send to API and get response
    sendToAI(message);
}

async function sendToAI(message) {
    try {
        // Create the appropriate API handler
        const handler = createApiHandler(currentModel, apiKeys[currentModel]);
        
        // Get conversation history for context (last 10 messages)
        const history = chatHistories[currentModel].slice(-10);
        
        // Send message to API
        const response = await handler.sendMessage(message, history);
        
        // Remove typing indicator
        removeTypingIndicator();
        
        if (response.success) {
            // Add AI response to chat
            addMessageToChat('ai', response.data.message);
        } else {
            // Show error message with special formatting for server errors
            const errorMessage = `
                <div class="error-message">
                    <h4>Error</h4>
                    <p>${response.error || 'Failed to get response from AI'}</p>
                </div>
            `;
            addMessageToChat('ai', errorMessage, true);
        }
    } catch (error) {
        // Remove typing indicator
        removeTypingIndicator();
        
        // Show error message
        addMessageToChat('ai', `Error: ${error.message || 'An unexpected error occurred'}`, true);
    }
}

function addMessageToChat(sender, content, isHTML = false) {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Create message element
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender === 'user' ? 'user-message' : 'ai-message');
    
    // Create avatar
    const avatarDiv = document.createElement('div');
    avatarDiv.classList.add('message-avatar');
    const avatarIcon = document.createElement('i');
    avatarIcon.classList.add('fas', sender === 'user' ? 'fa-user' : 'fa-robot');
    avatarDiv.appendChild(avatarIcon);
    
    // Create content
    const contentDiv = document.createElement('div');
    contentDiv.classList.add('message-content');
    
    // Set content as HTML or text
    if (isHTML) {
        // Safely set HTML content
        try {
            contentDiv.innerHTML = content;
        } catch (error) {
            console.error('Error setting HTML content:', error);
            contentDiv.textContent = 'Error displaying message: ' + (error.message || 'Unknown error');
        }
    } else {
        // Set as plain text (safe)
        contentDiv.textContent = content;
    }
    
    // Create timestamp
    const timeDiv = document.createElement('div');
    timeDiv.classList.add('message-time');
    timeDiv.textContent = timestamp;
    contentDiv.appendChild(timeDiv);
    
    // Assemble message
    messageDiv.appendChild(avatarDiv);
    messageDiv.appendChild(contentDiv);
    
    // Add to chat
    if (chatMessages.querySelector('.welcome-message')) {
        chatMessages.innerHTML = '';
    }
    chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Save to history (only save text content for non-HTML messages)
    if (!isHTML) {
        saveChatMessage(sender, content, timestamp);
    } else {
        // For HTML messages (like error messages), save a simplified version
        try {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = content;
            const textContent = tempDiv.textContent || tempDiv.innerText || "Error message";
            saveChatMessage(sender, textContent, timestamp);
        } catch (error) {
            console.error('Error processing HTML content for history:', error);
            saveChatMessage(sender, "Error message", timestamp);
        }
    }
}

function saveChatMessage(sender, content, timestamp) {
    chatHistories[currentModel].push({
        sender,
        content,
        timestamp
    });
    
    localStorage.setItem('chatHistories', JSON.stringify(chatHistories));
}

function loadChatHistories() {
    const savedChatHistories = localStorage.getItem('chatHistories');
    if (savedChatHistories) {
        chatHistories = JSON.parse(savedChatHistories);
        displayChatHistory(currentModel);
    }
}

function displayChatHistory(model) {
    // Clear current chat
    chatMessages.innerHTML = '';
    
    const history = chatHistories[model];
    
    if (history && history.length > 0) {
        history.forEach(msg => {
            // Create message element
            const messageDiv = document.createElement('div');
            messageDiv.classList.add('message', msg.sender === 'user' ? 'user-message' : 'ai-message');
            
            // Create avatar
            const avatarDiv = document.createElement('div');
            avatarDiv.classList.add('message-avatar');
            const avatarIcon = document.createElement('i');
            avatarIcon.classList.add('fas', msg.sender === 'user' ? 'fa-user' : 'fa-robot');
            avatarDiv.appendChild(avatarIcon);
            
            // Create content
            const contentDiv = document.createElement('div');
            contentDiv.classList.add('message-content');
            contentDiv.textContent = msg.content;
            
            // Create timestamp
            const timeDiv = document.createElement('div');
            timeDiv.classList.add('message-time');
            timeDiv.textContent = msg.timestamp;
            contentDiv.appendChild(timeDiv);
            
            // Assemble message
            messageDiv.appendChild(avatarDiv);
            messageDiv.appendChild(contentDiv);
            
            // Add to chat
            chatMessages.appendChild(messageDiv);
        });
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    } else {
        // Show welcome message if no history
        chatMessages.innerHTML = `
            <div class="welcome-message">
                <h3>Welcome to AI Chat Hub!</h3>
                <p>Select an AI model from the sidebar and enter your API key to start chatting.</p>
                <p>Your API keys and chat history are stored locally in your browser.</p>
                <p class="server-note">All API requests are processed through a secure server to avoid CORS issues.</p>
            </div>
        `;
    }
}

function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.classList.add('message', 'ai-message', 'typing-indicator');
    
    const avatarDiv = document.createElement('div');
    avatarDiv.classList.add('message-avatar');
    const avatarIcon = document.createElement('i');
    avatarIcon.classList.add('fas', 'fa-robot');
    avatarDiv.appendChild(avatarIcon);
    
    const contentDiv = document.createElement('div');
    contentDiv.classList.add('message-content');
    contentDiv.innerHTML = '<div class="typing-dots"><span>.</span><span>.</span><span>.</span></div>';
    
    typingDiv.appendChild(avatarDiv);
    typingDiv.appendChild(contentDiv);
    
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeTypingIndicator() {
    const typingIndicator = chatMessages.querySelector('.typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Chat actions
clearChatButton.addEventListener('click', function() {
    if (confirm('Are you sure you want to clear the current chat history?')) {
        chatHistories[currentModel] = [];
        localStorage.setItem('chatHistories', JSON.stringify(chatHistories));
        displayChatHistory(currentModel);
    }
});

exportChatButton.addEventListener('click', function() {
    exportChat();
});

function exportChat() {
    const history = chatHistories[currentModel];
    
    if (!history || history.length === 0) {
        showNotification('No chat history to export!');
        return;
    }
    
    let exportText = `# ${capitalizeFirstLetter(currentModel)} Chat Export\n`;
    exportText += `Generated on ${new Date().toLocaleString()}\n\n`;
    
    history.forEach(msg => {
        const sender = msg.sender === 'user' ? 'You' : capitalizeFirstLetter(currentModel);
        exportText += `**${sender}** (${msg.timestamp}):\n${msg.content}\n\n`;
    });
    
    const blob = new Blob([exportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentModel}-chat-export.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.classList.add('notification');
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

function updateSendButtonState() {
    const hasMessage = userInput.value.trim() !== '';
    const hasApiKey = apiKeys[currentModel] !== '';
    
    sendMessageButton.disabled = !(hasMessage && hasApiKey);
}

// Add CSS for notification and typing indicator
const style = document.createElement('style');
style.textContent = `
    .notification {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background-color: var(--primary-color);
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transform: translateY(100px);
        opacity: 0;
        transition: all 0.3s ease;
        z-index: 1000;
    }
    
    .notification.show {
        transform: translateY(0);
        opacity: 1;
    }
    
    .typing-dots {
        display: flex;
    }
    
    .typing-dots span {
        width: 8px;
        height: 8px;
        margin: 0 2px;
        background-color: var(--text-secondary-light);
        border-radius: 50%;
        display: inline-block;
        animation: typing 1.4s infinite ease-in-out both;
    }
    
    .dark-theme .typing-dots span {
        background-color: var(--text-secondary-dark);
    }
    
    .typing-dots span:nth-child(1) {
        animation-delay: 0s;
    }
    
    .typing-dots span:nth-child(2) {
        animation-delay: 0.2s;
    }
    
    .typing-dots span:nth-child(3) {
        animation-delay: 0.4s;
    }
    
    @keyframes typing {
        0%, 80%, 100% {
            transform: scale(0.6);
        }
        40% {
            transform: scale(1);
        }
    }
`;
document.head.appendChild(style);

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);
