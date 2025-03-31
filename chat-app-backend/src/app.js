const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const http = require("http");
const socketIo = require("socket.io");

const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const friendRoutes = require("./routes/friendRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const { initializeSocket } = require("./utils/socketManager");

dotenv.config();
const app = express();

// =========================
// Create HTTP Server & Socket.io
// =========================
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// middleware
app.use(express.json());
app.use(cors());

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

//connect MongoDb

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDb Connected"))
  .catch((error) => console.log("MongoDb Connection Error: ", error));

//initialize socket.io

initializeSocket(io);

module.exports = app;
