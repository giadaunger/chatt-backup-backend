const { Server } = require("socket.io");
const db = require("./db");
const PORT = process.env.PORT || 4000;

const io = new Server({
  cors: {
    origin: ["http://localhost:5173", "https://osuka-chatt.herokuapp.com"],
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  socket.join("default");
  socket.currentRoom = "default";

  socket.on("room:join", async (room) => {
    socket.leave(socket.currentRoom);
    socket.join(room);
    socket.currentRoom = room;

    const { rows } = await db.query("SELECT * FROM messages WHERE room = $1", [
      room,
    ]);
    socket.emit("message:update", rows);
  });

  socket.on("message:send", async (message) => {
    await db.query(
      "INSERT INTO messages (message, sender, room) VALUES ($1, $2, $3)",
      [message, socket.id, socket.currentRoom]
    );
    const { rows } = await db.query("SELECT * FROM messages WHERE room = $1", [
      socket.currentRoom,
    ]);
    io.to(socket.currentRoom).emit("message:update", rows);
  });
});

io.listen(PORT);
