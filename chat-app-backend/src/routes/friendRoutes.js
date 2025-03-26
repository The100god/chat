const express = require("express");
const router = express.Router();
const { sendFriendRequest, respondToFriendRequest, getFriends, removeFriend } = require('../controllers/friendController');

router.post('/send-request', sendFriendRequest);
router.post('/respond-request', respondToFriendRequest);
router.get('/friends/:userId', getFriends);
router.post('/remove-friend', removeFriend);

module.exports = router;