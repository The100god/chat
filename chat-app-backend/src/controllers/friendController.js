const User = require("../models/User");

// send Friend request

const sendFriendRequest = async (req, res) => {
  const { senderId, receiverId } = req.body;
  try {
    //Check if request already sent
    const receiver = await User.findById(receiverId);
    if (receiver.friendRequests.includes(senderId)) {
      return res.status(400).json({ message: "Friend request already sent." });
    }

    //Add senderId to receiver's FriendRequests
    receiver.friendRequests.push(senderId);
    await receiver.save();
    res.status(200).json({ message: "Friend request sent successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Accept/Reject Friends request

const respondToFriendRequest = async (req, res) => {
  const { userId, senderId, action } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user.friendRequests.includes(senderId)) {
      return res.status(400).json({ message: "No friend request found." });
    }

    // Remove senderId from FriendRequests
    user.friendRequests = user.friendRequests.filter(
      (id) => id.toString() !== senderId
    );

    if (action === "accept") {
      //add to friends list if accepted
      user.friends.push(senderId);
      const sender = await User.findById(senderId);
      sender.friends.push(userId);
      await sender.save();
      res.status(200).json({ message: "Friend request accepted." });
    } else {
      res.status(200).json({ message: "Friend request rejected." });
    }
    await user.save();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get Friend List
const getFriends = async (req, res) => {
  const { userId } = req.body;

  try {
    const user = await User.findById(userId).populate(
      "friends",
      "username email"
    );
    res.status(200).json(user.friends);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Remove a Friend

const removeFriend = async (req, res) => {
  const { userId, friendId } = req.body;

  try {
    const user = await User.findById(userId);
    const friend = await User.findById(friendId);

    if (!user.friends.includes(friendId)) {
      return res
        .status(400)
        .json({ message: "User is not in your friends list." });
    }

    //remove friend from both users
    user.friends = user.friends.filter((id) => id.toString() !== friendId);
    friend.friends = friend.friends.filter((id) => id.toString() !== userId);

    await user.save();
    await friend.save();
    res.status(200).json({ message: "Friend removed successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  sendFriendRequest,
  respondToFriendRequest,
  getFriends,
  removeFriend,
};
