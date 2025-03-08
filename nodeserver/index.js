require("dotenv").config(); // Load environment variables

const io = require("socket.io")(process.env.PORT || 4000, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5500", // Update this with your frontend URL
    methods: ["GET", "POST"],
  },
});

const users = {};
const typingUsers = new Set();

io.on("connection", (socket) => {
  socket.on("check-username", (name, callback) => {
    const isAvailable = !Object.values(users).includes(name);
    callback(isAvailable);
  });

  socket.on("new-user-joined", (name) => {
    if (!Object.values(users).includes(name)) {
      users[socket.id] = name;
      socket.broadcast.emit("user-joined", name);
    } else {
      socket.emit("username-taken", "Username already taken! Try another one.");
    }
  });

  socket.on("send", (data) => {
    const username = users[socket.id] || "Anonymous";
    const timestamp = new Date().toLocaleTimeString();
    socket.broadcast.emit("receive", {
      name: username,
      message: data.message,
      timestamp,
    });

    setTimeout(() => {
      socket.emit("message-seen", { message: data.message, timestamp });
    }, 1000);
  });

  socket.on("typing", (username) => {
    typingUsers.add(username);
    socket.broadcast.emit(
      "user-typing",
      Array.from(typingUsers).join(", ") + " is typing..."
    );
  });

  socket.on("stop-typing", (username) => {
    typingUsers.delete(username);
    socket.broadcast.emit(
      "user-typing",
      typingUsers.size > 0
        ? Array.from(typingUsers).join(", ") + " is typing..."
        : ""
    );
  });

  socket.on("disconnect", () => {
    if (users[socket.id]) {
      socket.broadcast.emit("left", users[socket.id]);
      delete users[socket.id];
    }
  });
});

console.log(`Socket.io server running on port ${process.env.PORT || 4000}`);
