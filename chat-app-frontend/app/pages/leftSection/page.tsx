"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import FriendsList from "../../components/FriendsList";

interface Friend {
  friendId: string;
  username: string;
  profilePic: string;
  unreadMessagesCount: number;
}

export default function LeftSection() {
  const { isAuthenticated } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch friends data from backend
  const fetchFriends = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/friends/${localStorage.getItem("userId")}`
      );
      setFriends(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching friends:", error);
      setLoading(false);
    }
  };

  // Run fetchFriends when the component mounts
  useEffect(() => {
    if (isAuthenticated) {
      fetchFriends();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return null; // Don't show anything if not authenticated
  }

  return (
      <div className="p-4">

      <FriendsList friends={friends} loading={loading} />
      </div>
  );
}
