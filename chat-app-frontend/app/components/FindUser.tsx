'use client'
// FindUser.tsx (Search and Send Friend Request)
import { useEffect, useState } from "react";
import {getSocket, useSocket} from "../hooks/useSocket";

// Function to search users by username
const searchUsers = async (username: string) => {
  const response = await fetch(`http://localhost:5000/api/users/search?username=${username}`);
  return await response.json();
};

// Function to send a friend request
// const sendFriendRequest = async (socket:any, senderId: string|null, receiverId: string) => {
//   if (!senderId) return;
//   // Emit real-time event to receiver
//   socket.emit("sendFriendRequest", { senderId, receiverId });
//   const response = await fetch("http://localhost:5000/api/friends/send-request", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({ senderId, receiverId }),
//   });

//   const data = await response.json();
//   return data.message;
// };

const FindUser = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");

  const userId = localStorage.getItem("userId") ? localStorage.getItem("userId") : null;
  useEffect(() => {
    if (userId) {
      useSocket(userId); // ✅ Connect and emit 'join'
    }
  }, [userId]);

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      const foundUsers = await searchUsers(searchQuery);
      setUsers(foundUsers);
    }
  };

  const handleSendRequest = async (receiverId: string) => {
    // const result = await sendFriendRequest(socket, userId, receiverId);
    // setMessage(result);
    const socket = getSocket(); // ✅ Get connected socket
    if (!socket || !userId) return;

    socket.emit("sendFriendRequest", {
      senderId: userId,
      receiverId,
    });

    setMessage("Friend request sent!");
  };

  return (
    <div>
      <h1>Search Users</h1>
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search by username"
      />
      <button onClick={handleSearch}>Search</button>

      {message && <p>{message}</p>}

      <div>
        {users.map((user: any) => (
          <div key={user._id}>
            <p>{user.username}</p>
            <button onClick={() => handleSendRequest(user._id)}>Send Friend Request</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FindUser;
