// backend/utils/socketManager.js
const {
  handleFriendRequestSocket,
} = require("../controllers/friendController");
const User = require("../models/User");
const Message = require("../models/Message");
const Chat = require("../models/Chat");
const { sendMessages } = require("../controllers/messageController");
const users = new Map(); // userId -> socket.id
const groups = new Map(); // groupId -> { members, admins, chatName }

const initializeSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("🟢 New user connected:", socket.id);

    socket.on("join", (userId) => {
      socket.join(userId);
      console.log("userId", userId);
      console.log("Id", socket.id);
      users.set(userId, socket.id);
      console.log(`✅ User ${userId} joined with socket ID: ${socket.id}`);
    });

    // socket.on("markMessagesAsRead", async ({ chatId, userId, friendId }) => {
    //   try {
    //     await Message.updateMany(
    //       { chatId, receiver: userId, sender: friendId, isRead: false },
    //       { $set: { isRead: true } }
    //     );

    //     // Count remaining unread from the same sender (should be 0)
    //     const unreadCount = await Message.countDocuments({
    //       sender: friendId,
    //       receiver: userId,
    //       isRead: false,
    //     });

    //     const receiverSocket = users.get(userId);
    //     if (receiverSocket) {
    //       io.to(receiverSocket).emit("unreadMessageCountUpdated", {
    //         friendId,
    //         count: unreadCount,
    //       });
    //     }
    //   } catch (err) {
    //     console.error("❌ Error in markMessagesAsRead:", err.message);
    //   }
    // });

    socket.on("getFriendListWithUnseen", async ({ userId }) => {
      try {
        const receiver = await User.findById(userId).populate(
          "friends",
          "username profilePic"
        );
        if (!receiver) return;

        const friendDetails = await Promise.all(
          receiver.friends.map(async (friend) => {
            const unreadMessagesCount = await Message.countDocuments({
              sender: friend._id,
              receiver: userId,
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

        socket.emit("friendsUpdated", friendDetails);
      } catch (error) {
        console.error("❌ Error in getFriendListWithUnseen:", error.message);
        socket.emit("friendsUpdated", []);
      }
    });

    socket.on(
      "handleFriendRequest",
      async ({ senderId, receiverId, status }) => {
        try {
          await handleFriendRequestSocket({
            senderId,
            receiverId,
            status,
            io,
            users,
          });

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
            const receiver = await User.findById(receiverId).populate(
              "friends",
              "username profilePic"
            );
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
      }
    );
    socket.on("typing", ({ receiverId, userId }) => {
      io.to(receiverId).emit("typing", userId);
    });
    socket.on("stopTyping", ({ receiverId, userId }) => {
      io.to(receiverId).emit("stopTyping", userId);
    });

    socket.on("messagesRead", async ({ chatId, readerId, senderId }) => {
      await Message.updateMany(
        {
          chat: chatId,
          sender: senderId,
          receiver: readerId,
          isRead: false,
        },
        { $set: { isRead: true } }
      );

      io.to(chatId).emit("messagesReadAck", {
        chatId,
        readerId,
      });

      const readerSocket = users.get(readerId);
      if (readerSocket) {
        io.to(readerSocket).emit("update_unseen_count", {
          friendId: senderId,
          count: 0,
        });
      }
    });

    socket.on(
      "sendMessage",
      async ({ chatId, senderId, content, receiverId }) => {
        console.log("rid", receiverId);
        try {
          const newMessage = new Message({
            chatId,
            sender: senderId,
            receiver: receiverId,
            content,
            isRead: false,
          });
          // const savedMessage = await newMessage.save();

          // await Chat.findByIdAndUpdate(chatId, {
          //   lastMessage: savedMessage._id,
          // });

          // const populatedMessage = await savedMessage.populate(
          //   "sender",
          //   "username profilePic"
          // );

          // console.log("populateMessage". populatedMessage)

          // io.to(chatId.toString()).emit("newMessage", {
          //   chatId,
          //   senderId,
          //   content,
          //   receiverId,
          // });
          // io.to(receiverId.toString()).emit("newMessage", {
          //   chatId,
          //   senderId,
          //   content,
          //   receiverId,
          // });

          // Update unread count for receiver in real-time
          const unreadCount = await Message.countDocuments({
            sender: senderId,
            receiver: receiverId,
            isRead: false,
          });
          // console.log("unreadCount", unreadCount);
          // console.log("users", users);
          // console.log("receiverId", receiverId);

          const receiverSocket = users.get(receiverId);
          // console.log("receiverSocket", receiverSocket);
          if (receiverSocket) {
            io.to(receiverSocket).emit("unreadMessageCountUpdated", {
              friendId: senderId,
              count: unreadCount,
            });
          }
        } catch (error) {
          console.error("Error sending message:", error);
        }
      }
    );

    // read unseen message
    socket.on("mark_messages_read", async ({ senderId, receiverId }) => {
      await Message.updateMany(
        { sender: senderId, receiver: receiverId, isRead: false },
        { $set: { isRead: true } }
      );

      // Send updated unread count to receiver
      const receiverSocketId = users.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("unreadMessageCountUpdated", {
          friendId: senderId,
          count: 0,
        });
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
        const receiverSocketId = users.get(receiverId); // Assuming you maintain a map of online users
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
        const user = await User.findById(userId).populate(
          "friendRequests",
          "_id username profilePic email"
        );
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
