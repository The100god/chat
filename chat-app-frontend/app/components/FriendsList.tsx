"use client"
import React from "react";

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
  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">Friends</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul>
          {friends.map((friend) => (
            <li key={friend.friendId} className="flex items-center mb-4">
              <img
                src={friend.profilePic || "/default-profile-pic.jpg"}
                alt={friend.username}
                className="w-12 h-12 rounded-full mr-3"
              />
              <div className="flex-1">
                <p className="text-sm font-medium">{friend.username}</p>
                <div className="flex items-center space-x-1">
                  <span
                    className={`w-3 h-3 rounded-full ${
                      friend.unreadMessagesCount > 0
                        ? "bg-green-500"
                        : "bg-red-500"
                    }`}
                  />
                  <span className="text-xs text-gray-500">
                    {friend.unreadMessagesCount} unread messages
                  </span>
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
