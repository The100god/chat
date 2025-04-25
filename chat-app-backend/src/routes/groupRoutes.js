const express = require("express")
const router = express.Router()
const { CreateGroup, GetAllGroups, SendGroupMessage, GetGroupMessages } = require("../controllers/groupController")

router.post("/create-group", CreateGroup)
router.post("/send-group-message", SendGroupMessage)
router.get("/:userId", GetAllGroups)
router.get("/group-message/:groupId", GetGroupMessages)

module.exports = router;