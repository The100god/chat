// routes/userRoute.js
const express = require("express");
const router = express.Router();
const { searchUsersByUsername, getUserProfile, updateUserProfile  } = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");

router.get("/search", searchUsersByUsername); // Search users by username
// ✅ Get logged-in user profile
router.get("/me", protect, getUserProfile);

// ✅ Update logged-in user profile
router.put("/updateProfile", protect, updateUserProfile);
module.exports = router;
