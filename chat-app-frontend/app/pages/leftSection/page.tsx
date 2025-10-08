"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import FriendsList from "../../components/FriendsList";
import { useAtom } from "jotai";
import {
  allFriendsAtom,
  findFriendAtom,
  findFriendWithChatAtom,
  friendsAtom,
  friendsCountsAtom,
  friendsRequestsAtom,
  groupChatOpenAtom,
  userIdAtom,
} from "../../states/States";
import FindUser from "../../components/FindUser";
import FriendRequests from "../../components/FriendRequests";
import AllFriends from "../../components/AllFriends";
import { useSocket } from "../../hooks/useSocket";
import GroupChatPage from "../../components/GroupChatPage";

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
  const [groupChatOpen] = useAtom(groupChatOpenAtom);
  const [, setFriendsCounts] = useAtom(friendsCountsAtom);
  const [findFriendWithChat] = useAtom(findFriendWithChatAtom);

  const [userId, setUserId] = useAtom(userIdAtom);
  // const [userId, setUserId] = useAtom(() => localStorage.getItem("userId"));
  const socket = useSocket(userId);
  // Fetch friends data from backend
  const fetchFriends = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/friends/get-friends/${userId}`
      );
      const data = await response.json();
      // console.log(data)
      setFriends(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching friends:", error);
      setLoading(true);
    }
  };

  useEffect(() => {
    const id = localStorage.getItem("userId");
    if (id) {
      setUserId(id);
    }
  }, []);

  // Run fetchFriends when the component mounts
  useEffect(() => {
    if (isAuthenticated && userId) {
      fetchFriends();
    }
  }, [isAuthenticated, userId]);

  // Listen to real-time updates from socket
  useEffect(() => {
    if (!socket || !userId) return;

    const handleFriendsUpdate = (updatedFriends: Friend[]) => {
      setFriends(updatedFriends);
    };

    const handleUnseenCountUpdate = ({
      friendId,
      count,
    }: {
      friendId: string;
      count: number;
    }) => {
      // console.log("count", count);
      setFriends((prevFriends) =>
        prevFriends.map((friend) =>
          friend.friendId === friendId
            ? { ...friend, unreadMessagesCount: count }
            : friend
        )
      );
      setLoading(false);
    };

    socket.on("friendsUpdated", handleFriendsUpdate);
    // socket.on("update_unseen_count", handleUnseenCountUpdate);
    socket.on("unreadMessageCountUpdated", handleUnseenCountUpdate);
    // 🔌 Ask for unseen count on reconnect/mount
    socket.emit("getFriendListWithUnseen", { userId });
    return () => {
      socket.off("friendsUpdated", handleFriendsUpdate);
      socket.off("unreadMessageCountUpdated", handleUnseenCountUpdate);
      // socket.off("update_unseen_count", handleUnseenCountUpdate);
    };
  }, [socket]);

  useEffect(() => {
    setFriendsCounts((prev) => {
      if (prev !== friends.length) {
        return friends.length;
      }
      return prev;
    });
  }, [friends]);

  if (!isAuthenticated) {
    return null; // Don't show anything if not authenticated
  }

  // console.log("friends", friends);
  return (
    <div className="p-4 bg-transparent">
      {findFriend && <FindUser />}
      {friendsRequests && <FriendRequests />}
      {allFriends && <AllFriends friends={friends} loading={loading} />}
      {groupChatOpen && <GroupChatPage />}

      {findFriendWithChat && (
        <FriendsList loading={loading} />
      )}
      {/* {findFriend ? (
        <FindUser />
      ) : friendsRequests ? (
        <FriendRequests />
      ) : allFriends ? (
        <AllFriends friends={friends} loading={loading} />
      ) : groupChatOpen ? (
        <GroupChatPage/>
      ): (
        <FriendsList friends={friends} loading={loading} />
      )} */}
    </div>
  );
}
