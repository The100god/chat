const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const {createServer} = require("http");
const {Server} = require("socket.io");

const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const friendRoutes = require("./routes/friendRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const userRoutes = require("./routes/userRoute");
const { initializeSocket } = require("./utils/socketManager");

dotenv.config();
const app = express();


// middleware
app.use(express.json());
app.use(cors());

// =========================
// Create HTTP Server & Socket.io
// =========================
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Change to your frontend URL,
    // methods: ["GET", "POST"],
    // transports: ["websocket", "polling"], // Ensure WebSocket is allowed
  },
});

//initialize socket.io

initializeSocket(io);

//Attach Socket.io to req in all routes
app.use((req, res, next)=>{
    req.io = io;
    next();
})

//Routes
app.use("/api/auth", authRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);
app.use("/api/users", userRoutes);

//connect MongoDb

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDb Connected"))
  .catch((error) => console.log("MongoDb Connection Error: ", error));

  const PORT = process.env.PORT || 5000;
  httpServer.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  

module.exports = app;
