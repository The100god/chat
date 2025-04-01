'use client'
// FindUser.tsx (Search and Send Friend Request)
import { useState, useEffect } from "react";

// Function to search users by username
const searchUsers = async (username: string) => {
  const response = await fetch(`http://localhost:5000/api/users/search?username=${username}`);
  return await response.json();
};

// Function to send a friend request
const sendFriendRequest = async (senderId: string|null, receiverId: string) => {
  const response = await fetch("http://localhost:5000/api/friends/send-request", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ senderId, receiverId }),
  });

  const data = await response.json();
  return data.message;
};

const FindUser = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");

  const userId = localStorage.getItem("userId")? localStorage.getItem("userId") : null; // You should replace this with the actual logged-in user ID

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      const foundUsers = await searchUsers(searchQuery);
      setUsers(foundUsers);
    }
  };

  const handleSendRequest = async (receiverId: string) => {
    const result = await sendFriendRequest(userId, receiverId);
    setMessage(result);
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
