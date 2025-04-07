"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import FriendsList from "../../components/FriendsList";
import { useAtom } from "jotai";
import {
  allFriendsAtom,
  findFriendAtom,
  friendsAtom,
  friendsCountsAtom,
  friendsRequestsAtom,
} from "../../states/States";
import FindUser from "../../components/FindUser";
import FriendRequests from "../../components/FriendRequests";
import AllFriends from "../../components/AllFriends";
import { useSocket } from "../../hooks/useSocket";

interface Friend {
  friendId: string;
  username: string;
  profilePic: string;
  unreadMessagesCount: number;
}

export default function LeftSection() {
  const { isAuthenticated } = useAuth();
  const [friends, setFriends] = useAtom(friendsAtom);
  const [loading, setLoading] = useState<boolean>(true);
  const [findFriend] = useAtom(findFriendAtom);
  const [friendsRequests] = useAtom(friendsRequestsAtom);
  const [allFriends] = useAtom(allFriendsAtom);
  const [, setFriendsCounts] = useAtom(friendsCountsAtom);

  const userId = localStorage.getItem("userId")? localStorage.getItem("userId") : null;;
  const socket = useSocket(userId);
  // Fetch friends data from backend
  const fetchFriends = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/friends/get-friends/${userId}`
      );
      const data = await response.json();
      console.log(data)
      setFriends(data);
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

  // Listen to real-time updates from socket
  useEffect(() => {
    if (!socket || !userId) return;

    const handleFriendsUpdate = (updatedFriends: Friend[]) => {
      setFriends(updatedFriends);
    };

    socket.on("friendsUpdated", handleFriendsUpdate);

    return () => {
      socket.off("friendsUpdated", handleFriendsUpdate);
    };
  }, [socket, userId]);

  useEffect(() => {
    setFriendsCounts(friends.length);
  }, [friends]);

  
console.log("friends", friends)
  return (
    <div className="p-4 bg-transparent">
      {findFriend ? (
        <FindUser />
      ) : friendsRequests ? (
        <FriendRequests />
      ) : allFriends ? (
        <AllFriends friends={friends} loading={loading} />
      ) : (
        <FriendsList friends={friends} loading={loading} />
      )}
    </div>
  );
}
