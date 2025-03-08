const socket = io("https://chatmate-inxw.onrender.com/");

const messageBox = document.querySelector(".msg-container");
const messageForm = document.getElementById("send-container");
const messageInput = document.getElementById("messageInp");
const notificationSound = new Audio("notification.mp3");
const userHeader = document.getElementById("user-header");
const typingIndicator = document.getElementById("typing-indicator");
const logoutBtn = document.getElementById("logout-btn");
const errorMsg = document.getElementById("error-msg");

const getCookie = (name) => {
  const cookies = document.cookie.split("; ");
  const cookie = cookies.find((row) => row.startsWith(name + "="));
  return cookie ? cookie.split("=")[1] : null;
};

const setCookie = (name, value, days) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/`;
};

const deleteCookie = (name) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
};

let username = getCookie("chatUsername");

if (username) {
  socket.emit("check-username", username, (isAvailable) => {
    if (isAvailable) {
      startChat(username);
    } else {
      deleteCookie("chatUsername");
    }
  });
}

document.getElementById("join-btn").addEventListener("click", function () {
  const usernameInput = document.getElementById("username");

  if (usernameInput.value.trim() === "") {
    errorMsg.innerText = "Username cannot be empty!";
    return;
  }

  const newUsername = usernameInput.value.trim();

  socket.emit("check-username", newUsername, (isAvailable) => {
    if (isAvailable) {
      setCookie("chatUsername", newUsername, 1);
      startChat(newUsername);
    } else {
      errorMsg.innerText = "Username already taken! Try another one.";
    }
  });
});

socket.on("username-taken", (message) => {
  errorMsg.innerText = message;
  deleteCookie("chatUsername");
});

const startChat = (name) => {
  username = name;
  document.getElementById(
    "user-header"
  ).innerText = `Logged in as: ${username}`;
  document.getElementById("login-container").classList.add("d-none");
  document.getElementById("chat-container").classList.remove("d-none");
  socket.emit("new-user-joined", username);
};

logoutBtn.addEventListener("click", () => {
  deleteCookie("chatUsername");
  location.reload();
});

const appendMessage = (message, position, timestamp, seen = false) => {
  const messageElement = document.createElement("div");
  messageElement.classList.add("message", position);
  messageElement.innerHTML = `
    <div>${message}</div>
    <small class="timestamp">${timestamp} ${seen ? "✓ Seen" : ""}</small>
  `;
  messageBox.append(messageElement);
  if (position === "left") notificationSound.play();
  messageBox.scrollTop = messageBox.scrollHeight;
};

socket.on("receive", (data) => {
  appendMessage(`${data.name}: ${data.message}`, "left", data.timestamp);
});

socket.on("message-seen", (data) => {
  const messages = document.querySelectorAll(".message.right .timestamp");
  messages[messages.length - 1].innerHTML = `${data.timestamp} ✓ Seen`;
});

socket.on("user-joined", (name) => {
  appendMessage(
    `${name} joined the chat`,
    "center",
    new Date().toLocaleTimeString()
  );
});

socket.on("left", (name) => {
  appendMessage(
    `${name} left the chat`,
    "center",
    new Date().toLocaleTimeString()
  );
});

messageInput.addEventListener("input", () => {
  socket.emit("typing", username);
});

messageInput.addEventListener("blur", () => {
  socket.emit("stop-typing", username);
});

socket.on("user-typing", (message) => {
  typingIndicator.innerText = message;
});

messageForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const message = messageInput.value;
  const timestamp = new Date().toLocaleTimeString();
  socket.emit("send", { message, username });
  appendMessage(`You: ${message}`, "right", timestamp, false);
  messageInput.value = "";
});
