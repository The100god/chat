"use client";

import React, { useEffect, useState } from "react";
import { useSocket } from "../../hooks/useSocket";
import { useAtom } from "jotai";
import { friendsAtom, selectedFriendAtom } from "../../states/States";

interface Message {
  _id?: string;
  chatId?: string;
  sender:
    | {
        _id: string;
        username: string;
        profilePic: string;
      }
    | string;
  content: string;
  createdAt?: string;
}

export interface Friend {
  friendId: string;
  username: string;
  profilePic: string;
  unreadMessagesCount: number;
}

export default function ChatArea() {
  const userId = localStorage.getItem("userId")
    ? localStorage.getItem("userId")
    : null;
  const socket = useSocket(userId);

  const [selectedFriend] = useAtom(selectedFriendAtom);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState<string>("");
  const [chatId, setChatId] = useState<string | null>(null);
  const [friends, setFriends] =useAtom(friendsAtom)

  // Join chat and fetch messages
  useEffect(() => {
    const fetchChat = async () => {
      if (!selectedFriend || !userId) return;

      try {
        const res = await fetch(`http://localhost:5000/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify([userId, selectedFriend.friendId]),
        });
        const data = await res.json();
        setChatId(data._id);
        // console.log("data", data);

        if (socket) {
          socket.emit("join", data._id);
        }

        const messagesRes = await fetch(
          `http://localhost:5000/api/message/${data._id}`
        );
        const messagesData = await messagesRes.json();
        if (messagesData.length > 0) {
          setMessages(messagesData);
        } else {
          setMessages([]); // or handle the error gracefully
          console.error("Fetched messages is not an array", messagesData);
        }

        await fetch(`http://localhost:5000/api/message/mark-read/${data._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });
      } catch (err) {
        console.error("Error fetching chat or messages:", err);
      }
    };

    fetchChat();
  }, [selectedFriend, userId, socket]);

  // Receive new messages via Socket.IO
  useEffect(() => {
    if (!socket || !chatId) return;

    const handleNewMessage = (message: Message) => {
      setMessages((prev) => [...prev, message]);
    };

    socket.on("newMessage", handleNewMessage);

    return () => {
      socket.off("newMessage", handleNewMessage);
    };
  }, [socket, chatId]);

  useEffect(() => {
    if (!socket) return;

    const handleUnreadCountUpdate = ({
      senderId,
      count,
    }: {
      senderId: string;
      count: number;
    }) => {
      setFriends((prev) =>
        prev.map((f) =>
          f.friendId === senderId ? { ...f, unreadMessagesCount: count } : f
        )
      );
    };

    socket.on("unreadMessageCountUpdated", handleUnreadCountUpdate);

    return () => {
      socket.off("unreadMessageCountUpdated", handleUnreadCountUpdate);
    };
  }, [socket, setFriends]);

  const sendMessage = async () => {
    if (
      !messageInput.trim() ||
      !chatId ||
      !userId ||
      !selectedFriend ||
      !socket
    )
      return;

    const newMessage = {
      chatId,
      senderId: userId,
      receiver:selectedFriend.friendId,
      content: messageInput,
    };

    try {
      const res = await fetch("http://localhost:5000/api/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMessage),
      });

      const savedMessage = await res.json();

      // Send message to Socket.IO server to broadcast
      socket.emit("sendMessage", savedMessage);

      // Update local message state
      // setMessages((prev) => [...prev, savedMessage]);
      setMessageInput("");
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  // console.log("messages", messages);
  return (
    <div className="flex flex-col bg-transparent h-full p-2 pb-5 overflow-y-auto">
      <div className="flex flex-row justify-center items-center gap-2 p-3">
      {selectedFriend && <img src={selectedFriend.profilePic} alt="image" className="w-[30px] rounded-full"/>}
      <h2 className="flex justify-center items-center text-lg font-semibold">
        {selectedFriend
          ? `${selectedFriend.username}`
          : "Select a friend to chat"}
      </h2>
      </div>

      <div className=" h-[70%] bg-gray-950 p-4 rounded-lg shadow-inner overflow-y-auto space-y-2">
        {messages.length > 0 &&
          messages.map((msg, idx) => (
            
              <div
                key={msg?._id || idx}
                className={`p-2 rounded-md max-w-[70%] text-black ${
                  typeof msg.sender === "string"
                    ? msg.sender === userId
                    : msg.sender?._id === userId
                    ? "bg-lime-400 ml-auto"
                    : "bg-lime-100 mr-auto"
                }`}
              >
                {msg.content}
              </div>
          
          ))}
      </div>

      {selectedFriend && (
        <div className="flex items-center mt-4">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            className="flex-1 px-4 py-2 rounded-md bg-gray-800 text-white outline-none"
            placeholder="Type your message..."
          />
          <button
            onClick={sendMessage}
            className="ml-2 bg-lime-700 px-4 py-2 rounded-md text-white"
          >
            Send
          </button>
        </div>
      )}
    </div>
  );
}
