const io = require('socket.io')(4000, {
  cors: {
    origin: "http://localhost:5500",
    methods: ["GET", "POST"],
  },
});

const users = {};

io.on('connection', socket => {
  socket.on('new-user-joined', name => {
    users[socket.id] = name;
    socket.broadcast.emit('user-joined', name);
  });

  socket.on('send', data => {
    const messageId = Math.random().toString(36).substring(7);
    const username = users[socket.id] || 'Anonymous';
    socket.broadcast.emit('receive', { ...data, name: username, messageId });
  });

  socket.on('mark-read', messageId => {
    socket.broadcast.emit('seen', messageId);
  });

  socket.on('typing', name => {
    socket.broadcast.emit('typing', name);
  });

  socket.on('disconnect', () => {
    const username = users[socket.id];
    if (username) {
      socket.broadcast.emit('left', username);
      delete users[socket.id];
    }
  });
});
