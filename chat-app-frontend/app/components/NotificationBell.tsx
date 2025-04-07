"use client"
import { useEffect, useState } from "react";
import { Bell } from "lucide-react"; // Using Lucide Icons
import { getSocket, useSocket } from "../hooks/useSocket";

// Function to fetch pending friend requests count
// const fetchRequestCount = async (userId: string|null) => {
//   const response = await fetch(`http://localhost:5000/api/friends/friend-requests/${userId}`);
//   const data = await response.json();
//   return data.length;
// };

const NotificationBell = () => {
//   const [requestCount, setRequestCount] = useState(0);
//   const userId = localStorage.getItem("userId");

//   useEffect(() => {
//     if (userId) {
//       const updateCount = async () => {
//         const count = await fetchRequestCount(userId);
//         setRequestCount(count);
//       };

//       updateCount();

//       // Poll every 10 seconds for updates
//       const interval = setInterval(updateCount, 10000);
//       return () => clearInterval(interval);
//     }
//   }, [userId]);

const [requestCount, setRequestCount] = useState(0);
  const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;

  useEffect(() => {
    if (!userId) return;

    useSocket(userId); // 🔌 Join socket room

    const socket = getSocket();

    // 📥 Initial fetch from server via socket
    socket?.emit("getFriendRequests", { userId });

    // 📌 When server sends the full friend requests list
    const handleFriendRequestsList = (data: any[]) => {
      setRequestCount(data.length);
    };

    // 🆕 When a new friend request is received
    const handleNewFriendRequest = ({ senderId }: { senderId: string }) => {
      setRequestCount((prev) => prev + 1);
    };

    // ✅ When user accepts or declines a request
    const handleRequestHandled = () => {
      setRequestCount((prev) => Math.max(prev - 1, 0));
    };

    socket?.on("friendRequestsList", handleFriendRequestsList);
    socket?.on("friendRequestReceived", handleNewFriendRequest);
    socket?.on("friendRequestAccepted", handleRequestHandled);
    socket?.on("friendRequestDenied", handleRequestHandled);

    return () => {
      socket?.off("friendRequestsList", handleFriendRequestsList);
      socket?.off("friendRequestReceived", handleNewFriendRequest);
      socket?.off("friendRequestAccepted", handleRequestHandled);
      socket?.off("friendRequestDenied", handleRequestHandled);
    };
  }, [userId]);

  return (
    <div className="relative">
      {/* <Bell size={24} className="cursor-pointer" /> */}
      {requestCount > 0 && (
        <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {requestCount}
        </span>
      )}
    </div>
  );
};

export default NotificationBell;
