const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const  cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const friendRoutes = require("./routes/friendRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");

dotenv.config();
const app = express()

// middleware
app.use(express.json())
app.use(cors());

//Routes
app.use("/api/auth", authRoutes);
app.use("/api/friends", friendRoutes)
app.use("/api/chat", chatRoutes)
app.use("/api/message", messageRoutes)


//connect MongoDb

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true, useUnifiedTopology: true
}).then(()=>console.log("MongoDb Connected")).catch((error)=>console.log("MongoDb Connection Error: ", error))

module.exports =app