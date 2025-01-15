const socket = io('http://localhost:4000');

const messageBox = document.querySelector(".msg-container");
const messageForm = document.getElementById('send-container');
const messageInput = document.getElementById('messageInp');
const notificationSound = new Audio('notification.mp3');
const userHeader = document.getElementById('user-header');
const typingIndicator = document.getElementById('typing-indicator');

const username = prompt('Enter your name to join:');
if (username) {
  userHeader.innerText = `Logged in as: ${username}`;
  socket.emit('new-user-joined', username);
}

const appendMessage = (message, position, timestamp, seen = false) => {
  const messageElement = document.createElement('div');
  const timeElement = document.createElement('span');
  const statusElement = document.createElement('span');

  messageElement.innerText = message;
  timeElement.innerText = ` (${timestamp})`;
  statusElement.innerText = seen ? ' ✓ Seen' : '';

  messageElement.classList.add('message', position);
  timeElement.classList.add('timestamp');
  statusElement.classList.add('status');

  messageElement.append(timeElement);
  messageElement.append(statusElement);
  messageBox.append(messageElement);

  if (position === 'left') notificationSound.play();
  messageBox.scrollTop = messageBox.scrollHeight;
};

socket.on('receive', data => {
  appendMessage(`${data.name}: ${data.message}`, 'left', data.timestamp);
  socket.emit('mark-read', data.messageId);
});

socket.on('user-joined', name => {
  appendMessage(`${name} joined the chat`, 'center', new Date().toLocaleTimeString());
});

socket.on('left', name => {
  appendMessage(`${name} left the chat`, 'center', new Date().toLocaleTimeString());
});

socket.on('typing', name => {
  typingIndicator.innerText = `${name} is typing...`;
  setTimeout(() => (typingIndicator.innerText = ''), 1000);
});

socket.on('seen', messageId => {
  const statusElement = document.querySelector(`[data-id="${messageId}"] .status`);
  if (statusElement) statusElement.innerText = ' ✓ Seen';
});

messageForm.addEventListener('submit', e => {
  e.preventDefault();
  const message = messageInput.value;
  const timestamp = new Date().toLocaleTimeString();

  appendMessage(`You: ${message}`, 'right', timestamp, true);
  socket.emit('send', { message, timestamp });
  messageInput.value = '';
});

messageInput.addEventListener('input', () => {
  socket.emit('typing', username);
});



