const chatInput = document.querySelector('.chat-input input');
const sendButton = document.querySelector('.send-btn');
const chatBody = document.querySelector('.chat-body');
const expandButton = document.querySelector('.expand-btn');

let userMessages = [];
let botMessages = [];

const API_KEY = "AIzaSyBsZrZLwvQSjZgmukPdURAcNRKjmx9GScA";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

function createMessage(content, type) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', `${type}-message`);

    if (type === 'bot' && content === 'thinking') {
        messageDiv.innerHTML = `
            <div class="thinking">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;
    } else {
        messageDiv.innerHTML = `<div class="message-text">${content}</div>`;
    }

    return messageDiv;
}

function scrollToBottom() {
    chatBody.scrollTop = chatBody.scrollHeight;
}

async function generateBotResponse(userMessage) {
    const thinkingMessage = createMessage('thinking', 'bot');
    chatBody.appendChild(thinkingMessage);
    scrollToBottom();

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    role: 'user',
                    parts: [{ text: userMessage }]
                }]
            })
        });

        if (!response.ok) {
            throw new Error('Failed to get response');
        }

        const data = await response.json();
        const botResponse = data.candidates?.[0]?.content?.parts?.[0]?.text ||
            "I apologize, but I'm having trouble processing your request. Could you please rephrase your question?";

        // Remove thinking animation with fade out
        thinkingMessage.style.opacity = '0';
        await new Promise(resolve => setTimeout(resolve, 300)); // Wait for fade out
        chatBody.removeChild(thinkingMessage);

        // Add bot response with fade in
        const botMessageDiv = createMessage(botResponse, 'bot');
        botMessageDiv.style.opacity = '0';
        chatBody.appendChild(botMessageDiv);

        // Trigger reflow for animation
        botMessageDiv.offsetHeight;
        botMessageDiv.style.opacity = '1';

        botMessages.push(botResponse);
        scrollToBottom();
    } catch (error) {
        console.error('Error:', error);
        chatBody.removeChild(thinkingMessage);
        const errorMessage = createMessage(
            "I apologize, but I'm experiencing technical difficulties. Please try again in a moment.",
            'bot'
        );
        chatBody.appendChild(errorMessage);
    }
}

function handleUserMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    // Disable input while processing
    chatInput.disabled = true;
    sendButton.disabled = true;

    // Add user message to chat
    const userMessageDiv = createMessage(message, 'user');
    chatBody.appendChild(userMessageDiv);
    userMessages.push(message);

    // Clear input and restore height
    chatInput.value = '';
    chatInput.style.height = 'auto';

    // Generate bot response
    generateBotResponse(message).finally(() => {
        // Re-enable input after processing
        chatInput.disabled = false;
        sendButton.disabled = false;
        chatInput.focus();
    });
}

// Auto-resize input field
chatInput.addEventListener('input', () => {
    chatInput.style.height = 'auto';
    chatInput.style.height = (chatInput.scrollHeight) + 'px';
});

// Event Listeners
sendButton.addEventListener('click', handleUserMessage);

chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleUserMessage();
    }
});

expandButton.addEventListener('click', () => {
    document.querySelector('.chat-container').classList.toggle('expanded');
    scrollToBottom();
});

// File upload functionality
document.querySelector('.attach-btn').addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const message = createMessage(
                    `<img src="${e.target.result}" alt="Uploaded skin image" style="max-width: 100%; border-radius: 8px;">`,
                    'user'
                );
                chatBody.appendChild(message);
                scrollToBottom();
                generateBotResponse("I've uploaded an image of my skin for analysis. Could you please examine it and provide your assessment?");
            };
            reader.readAsDataURL(file);
        }
    };
    input.click();
});

// Emoji picker functionality
document.querySelector('.emoji-btn').addEventListener('click', () => {
    // You can implement a proper emoji picker here
    const emojis = ['👋', '😊', '👍', '🤔', '👌', '✨'];
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];
    chatInput.value += emoji;
    chatInput.focus();
});
