const users = new Map(); // Stores active users: userId -> socket.id
const groups = new Map(); // Stores group details: groupId -> { members, admins }

// Initialize Socket.io

const initializeSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("🟢 New user connected:", socket.id);
    //user joins Chat with userId

    socket.on("join", (userId) => {
      users.set(userId, socket.id);
      console.log(`✅ User ${userId} joined with socket ID: ${socket.id}`);
    });

    // =========================
    // Accept / Deny Friend Request
    // =========================
    socket.on("handleFriendRequest", ({ senderId, receiverId, status }) => {
      const receiverSocket = users.get(senderId);
      if (status === "accepted") {
        io.to(receiverSocket).emit("friendRequestAccepted", { receiverId });
        console.log(`🤝 Friend request accepted by ${receiverId}`);
      } else {
        io.to(receiverSocket).emit("friendRequestDenied", { receiverId });
        console.log(`🚫 Friend request denied by ${receiverId}`);
      }
    });

    // Handle Sending messages

    socket.on("sendMessage", ({ senderId, receiverId, message }) => {
      const receiverSocket = users.get(receiverId);

      if (receiverSocket) {
        io.to(receiverSocket).emit("receiveMessage", {
          senderId,
          message,
        });
        console.log(`📩 Message sent to ${receiverId}`);
      } else {
        console.log("❌ Receiver not online.");
      }
    });

    //Notify Friend requests

    socket.on("sendFriendRequest", ({ senderId, receiverId }) => {
      const receiverSocket = users.get(receiverId);
      if (receiverSocket) {
        io.to(receiverSocket).emit("friendRequestReceived", { senderId });
        console.log(`🔔 Friend request sent to ${receiverId}`);
      } else {
        console.log("❌ Receiver not online.");
      }
    });

    // create Group Chat

    socket.on("createGroup", ({ groupId, adminId, members, chatName }) => {
      groups.set(groupId, {
        members: new Set(members),
        admins: new Set([adminId]),
        chatName,
      });
      console.log(`👥 Group ${chatName} created by ${adminId}`);
    });

    //send group message

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

    // Add member to group

    socket.on("addToGroup", ({ groupId, adminId, newMemberId })=>{
        const group =groups.get(groupId);
        if(group && group.admins.has(adminId)){
            group.members.add(newMemberId);
            console.log(`✅ Member ${newMemberId} added to group ${groupId}`);
      } else {
        console.log(`❌ Unauthorized action by ${adminId}`);
      }
    })

    //Remove Member From Group

    socket.on('removeFromGroup', ({ groupId, adminId, memberId })=>{
        const group =groups.get(groupId);
        if(group && group.admins.has(adminId)){
            group.members.delete(memberId);
            console.log(`🚪 Member ${memberId} removed from group ${groupId}`);
      } else {
        console.log(`❌ Unauthorized action by ${adminId}`);
      }
    })

    // Grant Admin Privileges

    socket.on('grantAdmin', ({ groupId, adminId, newAdminId }) => {
        const group = groups.get(groupId);
        if (group && group.admins.has(adminId)) {
          group.admins.add(newAdminId);
          console.log(`👑 Admin privileges granted to ${newAdminId}`);
        } else {
          console.log(`❌ Unauthorized action by ${adminId}`);
        }
      });

    // handle user disconnect

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
