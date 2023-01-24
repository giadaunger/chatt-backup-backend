const { createServer } = require("http");
const { Server } = require("socket.io");
const { Client } = require("pg");

const db_url =
  process.env.DATABASE_URL ||
  "postgresql://postgres:2bth5OrLhQfWzkKFpPxc@containers-us-west-147.railway.app:7530/railway";

const messagesTable = `
  CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    message TEXT,
    sender TEXT,
    room TEXT
  )
`;

// const PORT = process.env.PORT || 4000;

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

  const httpServer = createServer();
  const io = new Server(httpServer, {
    cors: {
      origin: ["http://localhost:5173", "https://chatt-backup-frontend-production.up.railway.app"],
      methods: ["GET", "POST"],
    },
  });
  
  io.on("connection", (socket) => {
    console.log('socket io connected')
    socket.join("default");
    socket.currentRoom = "default";
  
    socket.on("room:join", async (room) => {
      console.log('join', room)
      socket.leave(socket.currentRoom);
      socket.join(room);
      socket.currentRoom = room;
  
      const { rows } = await db.query("SELECT * FROM messages WHERE room = $1", [
        room,
      ]);
      socket.emit("message:update", rows);
    });
  
    socket.on("message:send", async (message) => {
      console.log('message', message)
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

  httpServer.listen(80)
  // io.listen(80);
}

run();


