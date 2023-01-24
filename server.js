const { Server } = require("socket.io");
const { Client } = require("pg");

const db_url =
  process.env.DATABASE_URL ||
  "http://localhost:5432";

const messagesTable = `
  CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    message TEXT,
    sender TEXT,
    room TEXT
  )
`;

const PORT = process.env.PORT || 4000;

const run = async () => {
  const db = new Client({
    connectionString: db_url,
    // ssl: {
    //   rejectUnauthorized: false, // Använd inte i produktion
    // },
  });
  
  await db.connect();
  console.log('client connected');

  await db.query(messagesTable);
  console.log('db initialized');

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
}

run();


