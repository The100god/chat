// backend/utils/socketManager.js
const { handleFriendRequestSocket } = require("../controllers/friendController");
const User = require("../models/User");
const users = new Map(); // userId -> socket.id
const groups = new Map(); // groupId -> { members, admins, chatName }

const initializeSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("🟢 New user connected:", socket.id);

    socket.on("join", (userId) => {
      socket.join(userId)
      users.set(userId, socket.id);
      console.log(`✅ User ${userId} joined with socket ID: ${socket.id}`);
    });

    socket.on("handleFriendRequest", async ({ senderId, receiverId, status }) => {
      try {
        await handleFriendRequestSocket({ senderId, receiverId, status,io, users });
    
        const senderSocket = users.get(senderId);
        const receiverSocket = users.get(receiverId);
        if (senderSocket) {
          if (status === "accepted") {
            io.to(senderSocket).emit("friendRequestAccepted", { receiverId });
            console.log(`🤝 Friend request accepted by ${receiverId}`);
          } else {
            io.to(senderSocket).emit("friendRequestDenied", { receiverId });
            console.log(`🚫 Friend request denied by ${receiverId}`);
          }
        }

         // Notify receiver (updated friend list)
         if (receiverSocket && status === "accepted") {
          const receiver = await User.findById(receiverId).populate("friends", "username profilePic");
          const friendDetails = await Promise.all(
            receiver.friends.map(async (friend) => {
              const unreadMessagesCount = await Message.countDocuments({
                sender: friend._id,
                receiver: receiverId,
                isRead: false,
              });
              return {
                friendId: friend._id,
                username: friend.username,
                profilePic: friend.profilePic,
                unreadMessagesCount,
              };
            })
          );

          io.to(receiverSocket).emit("friendsUpdated", friendDetails);
        }
      } catch (err) {
        console.error("Error handling friend request:", err.message);
        socket.emit("error", { message: err.message });
      }
    });

    socket.on("sendMessage", async ({ chatId, senderId, content, receiverId }) => {
      try {
        const newMessage = new Message({ chatId, sender: senderId, content,  receiver: receiverId,isRead: false,});
        const savedMessage = await newMessage.save();
    
        await Chat.findByIdAndUpdate(chatId, { lastMessage: savedMessage._id });
    
        const populatedMessage = await savedMessage.populate("sender", "username profilePic");
        // console.log("populateMessage". populatedMessage)
        io.to(chatId.toString()).emit("newMessage", populatedMessage);
        // Update unread count for receiver in real-time
        const unreadCount = await Message.countDocuments({
          sender: senderId,
          receiver: receiverId,
          isRead: false,
        });

        io.to(receiverId).emit("unreadMessageCountUpdated", {
          friendId: senderId,
          count: unreadCount,
        });
      } catch (error) {
        console.error("Error sending message:", error);
      }
    });

    socket.on("sendFriendRequest", async ({ senderId, receiverId }) => {
      try {
        const receiver = await User.findById(receiverId);
        const sender = await User.findById(senderId);
    
        if (!receiver || !sender) return;
    
        // Avoid duplicate requests
        if (receiver.friendRequests.includes(senderId)) return;
    
        // Add the senderId to the receiver's friendRequests list
        receiver.friendRequests.push(senderId);
        await receiver.save();
    
        // Send real-time notification to the receiver (if online)
        const receiverSocketId = onlineUsers[receiverId]; // Assuming you maintain a map of online users
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("friendRequestReceived", {
            senderId: sender._id,
            username: sender.username,
            profilePic: sender.profilePic,
          });
        }
      } catch (error) {
        console.error("Error sending friend request:", error);
      }
    });

    socket.on("getFriendRequests", async ({ userId }) => {
      try {
        const user = await User.findById(userId).populate("friendRequests", "_id username profilePic email");
        if (!user) {
          return socket.emit("friendRequestsList", []);
        }
        const friendRequests = user.friendRequests.map((requester) => ({
          _id: requester._id,
          username: requester.username,
          profilePic: requester.profilePic,
        }));
    
        socket.emit("friendRequestsList", friendRequests);
      } catch (error) {
        console.error("❌ Error in getFriendRequests:", error.message);
        socket.emit("friendRequestsList", []);
      }
    });

    socket.on("createGroup", ({ groupId, adminId, members, chatName }) => {
      groups.set(groupId, {
        members: new Set(members),
        admins: new Set([adminId]),
        chatName,
      });
      console.log(`👥 Group ${chatName} created by ${adminId}`);
    });

    socket.on("sendGroupMessage", ({ groupId, senderId, message }) => {
      const group = groups.get(groupId);
      if (group && group.members.has(senderId)) {
        group.members.forEach((memberId) => {
          const memberSocket = users.get(memberId);
          if (memberSocket) {
            io.to(memberSocket).emit("receiverGroupMessage", {
              groupId,
              senderId,
              message,
            });
          }
        });
        console.log(`📢 Group message sent to group ${groupId}`);
      } else {
        console.log(`❌ Sender not part of group ${groupId}`);
      }
    });

    socket.on("addToGroup", ({ groupId, adminId, newMemberId }) => {
      const group = groups.get(groupId);
      if (group && group.admins.has(adminId)) {
        group.members.add(newMemberId);
        console.log(`✅ Member ${newMemberId} added to group ${groupId}`);
      } else {
        console.log(`❌ Unauthorized action by ${adminId}`);
      }
    });

    socket.on("removeFromGroup", ({ groupId, adminId, memberId }) => {
      const group = groups.get(groupId);
      if (group && group.admins.has(adminId)) {
        group.members.delete(memberId);
        console.log(`🚪 Member ${memberId} removed from group ${groupId}`);
      } else {
        console.log(`❌ Unauthorized action by ${adminId}`);
      }
    });

    socket.on("grantAdmin", ({ groupId, adminId, newAdminId }) => {
      const group = groups.get(groupId);
      if (group && group.admins.has(adminId)) {
        group.admins.add(newAdminId);
        console.log(`👑 Admin privileges granted to ${newAdminId}`);
      } else {
        console.log(`❌ Unauthorized action by ${adminId}`);
      }
    });

    socket.on("disconnect", () => {
      for (let [key, value] of users.entries()) {
        if (value === socket.id) {
          console.log(`❌ User ${key} disconnected.`);
          users.delete(key);
          break;
        }
      }
    });
  });
};

module.exports = { initializeSocket };
