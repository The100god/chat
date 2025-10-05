// controllers/userController.js
const User = require("../models/User");

// Search users by username
const searchUsersByUsername = async (req, res) => {
  const { username, userId } = req.query;

  if (!username || !userId){
    return res.status(400).json({message:"Missing search term or user ID"})
  }
  try {
    const currentUser = await User.findById(userId).populate("friends", "_id");
    const friendIds = currentUser.friends.map((f)=>f._id.toString());

    const users = await User.find({ username: { $regex: username, $options: "i" },
    _id:{$ne:userId, $nin:friendIds} })
      .select("_id username profilePic");
      // .limit(10); // Limit the number of users shown to 10
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { searchUsersByUsername };
