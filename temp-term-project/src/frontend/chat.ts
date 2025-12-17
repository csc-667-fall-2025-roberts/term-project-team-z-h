import { io } from 'socket.io-client';

const socket = io();
const currentUser = (window as any).CURRENT_USER;

const listing = document.querySelector<HTMLDivElement>('.message-listing');
const input = document.querySelector<HTMLInputElement>('.message-submit input');
const button = document.querySelector<HTMLButtonElement>('.message-submit .btn-send');
const messageTemplate = document.querySelector<HTMLTemplateElement>('#template-chat-message');

if (input && button && listing && messageTemplate) {
    function formatTime(timestamp: string): string {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });
    }

    function addMessage(data: { username: string; message: string; created_at: string }) {
        const clone = messageTemplate!.content.cloneNode(true) as DocumentFragment;
        const messageElement = clone.querySelector('.chat-message') as HTMLElement;
        
        if (messageElement) {
            if (data.username === currentUser) {
                messageElement.classList.add('mine');
            }

            const usernameSpan = messageElement.querySelector('.message-username');
            const timeSpan = messageElement.querySelector('.message-time');
            const textSpan = messageElement.querySelector('.message-text');

            if (usernameSpan) usernameSpan.textContent = `${data.username}:`;
            if (timeSpan) timeSpan.textContent = formatTime(data.created_at);
            if (textSpan) textSpan.textContent = data.message;

            listing!.appendChild(clone);
            listing!.scrollTop = listing!.scrollHeight;
        }
    }

    function sendMessage() {
        const message = input!.value.trim();
        if (!message) return;

        socket.emit('chat:message', { message });
        input!.value = '';
    }

    button.addEventListener('click', (e) => {
        e.preventDefault();
        sendMessage();
    });

    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    socket.on('connect', () => {
        socket.emit('chat:load');
    });

    socket.on('chat:message', (data) => {
        addMessage(data);
    });

    socket.on('chat:history', (messages: any[]) => {
        listing.innerHTML = '';
        
        messages.reverse().forEach(msg => {
            addMessage({
                username: msg.username,
                message: msg.message,
                created_at: msg.created_at
            });
        });
    });

    socket.on('chat:error', (data) => {
        alert(data.error);
    });
}