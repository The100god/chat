// routes/userRoute.js
const express = require("express");
const router = express.Router();
const { searchUsersByUsername } = require("../controllers/userController");

router.get("/search", searchUsersByUsername); // Search users by username

module.exports = router;
