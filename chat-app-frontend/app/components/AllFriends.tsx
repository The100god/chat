"use client";
import React from "react";

interface Friend {
  friendId: string;
  username: string;
  profilePic: string;
}

interface AllFriendsListProps {
  friends: Friend[];
  loading: boolean;
}

const AllFriends: React.FC<AllFriendsListProps> = ({ friends, loading }) => {
  return (
    <div className="p-4 bg-transparent">
      <h2 className="text-lg font-semibold mb-4">Friends</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul className="space-y-3">
          {friends?.map((friend) => (
            <li
              key={friend?.friendId}
              className="flex mbflex flex-row justify-between items-center bg-gray-900 hover:bg-gray-800 rounded-lg w-[80%] px-3 py-4"
            >
              <img
                src={friend?.profilePic || "/default-profile-pic.jpg"}
                alt={friend?.username}
                className="w-12 h-12 rounded-full mr-3 border-2 border-lime-300"
              />
              <div className="flex-1">
                <p className="text-sm font-medium">{friend?.username}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AllFriends;
