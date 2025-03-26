const express = require("express");
const router = express.Router();

const {sendMessages, getMessages} = require("../controllers/messageController");

router.post("/", sendMessages);
router.get("/:chatId", getMessages)

module.exports = router

