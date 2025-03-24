const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const  cors = require("cors");
const authRoutes = require("./routes/authRoutes");

dotenv.config();
const app = express()

// middleware
app.use(express.json())
app.use(cors());

//Routes
app.use("/api/auth", authRoutes);

//connect MongoDb

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true, useUnifiedTopology: true
}).then(()=>console.log("MongoDb Connected")).catch((error)=>console.log("MongoDb Connection Error: ", error))

module.exports =app