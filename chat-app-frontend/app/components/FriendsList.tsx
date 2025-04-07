"use client";
import React from "react";
import { selectedFriendAtom } from "../states/States";
import { useAtom } from "jotai";

interface Friend {
  friendId: string;
  username: string;
  profilePic: string;
  unreadMessagesCount: number;
}

interface FriendsListProps {
  friends: Friend[];
  loading: boolean;
}

const FriendsList: React.FC<FriendsListProps> = ({ friends, loading }) => {
  const [, setSelectedFriend] = useAtom(selectedFriendAtom);

  return (
    <div className="p-4 bg-transparent">
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul className="space-y-3">
          {friends.map((friend) => (
            <li
              key={friend.friendId}
              onClick={() => setSelectedFriend(friend)}
              className="flex items-center bg-gray-900 p-2 rounded-xl cursor-pointer hover:bg-gray-800 transition duration-200"
            >
              <img
                src={friend.profilePic || "/default-profile-pic.jpg"}
                alt={friend.username}
                className="w-12 h-12 rounded-full mr-4 object-cover"
              />
              <div className="flex-1">
                <p
                  className={`text-sm ${
                    friend.unreadMessagesCount > 0 ? "font-bold text-white" : "text-gray-300"
                  }`}
                >
                  {friend.username}
                </p>
                <div className="flex items-center text-xs mt-1">
                  {friend.unreadMessagesCount > 0 ? (
                    <span className="bg-green-500 text-white px-2 py-0.5 rounded-full">
                      {friend.unreadMessagesCount} unread
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
