"use client";
import React from "react";
import {
  friendsAtom,
  selectedFriendAtom,
  selectedGroupAtom,
  userIdAtom,
} from "../states/States";
import { useAtom } from "jotai";

interface Friend {
  friendId: string;
  username: string;
  profilePic: string;
  unreadMessagesCount: number;
}

interface FriendsListProps {
  // friends: Friend[];
  loading: boolean;
}

const FriendsList: React.FC<FriendsListProps> = ({ loading }) => {
  const [, setSelectedFriend] = useAtom(selectedFriendAtom);
  const [friends, setFriends] = useAtom(friendsAtom);
  const [, setSelectedGroup] = useAtom(selectedGroupAtom);
  const [userId] = useAtom(userIdAtom);

  const handleSelectFriend = (friend: Friend) => {
    setSelectedFriend(friend);

    // Sync to backend and mark messages as read
    // const userId = localStorage.getItem("userId");
    console.log("ids");
    if (userId) {
      fetch("http://localhost:5000/api/message/mark-read", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ senderId: friend.friendId, receiverId: userId }),
      });
    }

    // Update global state to reset unread count
    setFriends((prev) =>
      prev.map((f) =>
        f.friendId === friend.friendId ? { ...f, unreadMessagesCount: 0 } : f
      )
    );
    setSelectedGroup(null);
  };

  return (
    <div className="p-4 bg-transparent">
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul className="space-y-3">
          {friends && friends.map((friend) => (
            <li
              key={friend?.friendId}
              onClick={() => handleSelectFriend(friend)}
              className="flex items-center bg-gray-900 p-2 rounded-xl cursor-pointer hover:bg-gray-800 transition duration-200"
            >
              <img
                src={friend?.profilePic || "/default-profile-pic.jpg"}
                alt={friend?.username}
                className="w-12 h-12 rounded-full border-2 border-lime-300 mr-4 object-cover"
              />
              <div className="flex-1">
                <p
                  className={`text-sm ${
                    friend?.unreadMessagesCount > 0
                      ? "font-bold text-white"
                      : "text-gray-300"
                  }`}
                >
                  {friend.username}
                </p>
                <div className="flex items-center text-xs mt-1">
                  {friend?.unreadMessagesCount > 0 ? (
                    <span className="bg-green-500 text-white px-2 py-0.5 rounded-full">
                      {friend?.unreadMessagesCount} unread
                    </span>
                  ) : (
                    <span className="text-gray-500">No unread messages</span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FriendsList;
