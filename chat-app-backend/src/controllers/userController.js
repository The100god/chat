// controllers/userController.js
const User = require("../models/User");

// Search users by username
const searchUsersByUsername = async (req, res) => {
  const { username } = req.query;
  try {
    const users = await User.find({ username: { $regex: username, $options: "i" } })
      .select("username profilePic")
      .limit(10); // Limit the number of users shown to 10
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { searchUsersByUsername };
