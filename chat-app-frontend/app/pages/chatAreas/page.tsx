"use client";

import React, { useEffect, useRef, useState } from "react";
import { useSocket } from "../../hooks/useSocket";
import { useAtom } from "jotai";
import { friendsAtom, selectedFriendAtom } from "../../states/States";

interface Message {
  _id?: string;
  chatId?: string;
  sender?:
    | {
        _id: string;
        username: string;
        profilePic: string;
      }
    | string;
  receiver?: string | object;
  content?: string;
  media?: string[]; // not [string]
  createdAt?: string;
  isRead?: boolean;
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
  // const hasMounted = useRef(false);
  const shouldScroll = useRef(true);

  const [selectedFriend] = useAtom(selectedFriendAtom);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState<string>("");
  const [chatId, setChatId] = useState<string | null>(null);
  const [friends, setFriends] = useAtom(friendsAtom);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingFriend, setTypingFriend] = useState<string | null>(null);
  let typingTimeout: NodeJS.Timeout;
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const MAX_SIZE_MB = 50;

  // Join chat and fetch messages
  useEffect(() => {
    if (!selectedFriend || !userId) return;

    const fetchChat = async () => {
      shouldScroll.current = true; // Only scroll on opening chat

      try {
        const res = await fetch(`http://localhost:5000/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify([userId, selectedFriend.friendId]),
        });
        const data = await res.json();
        setChatId(data._id);
        // console.log("data", data._id);

        if (socket && chatId) {
          console.log("Joining chat room:", chatId);
          socket.emit("join", chatId);
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
      } catch (err) {
        console.error("Error fetching chat or messages:", err);
      }
    };

    fetchChat();
  }, [selectedFriend, chatId, socket]);

  // Receive new messages via Socket.IO
  useEffect(() => {
    if (!socket || !chatId) return;

    const handleNewMessage = (message: Message) => {
      if (message.chatId !== chatId) return; // Only if it's the open chat
      setMessages((prev) => {
        const alreadyExists = prev.some((m) => m._id === message._id);
        if (!alreadyExists) {
          return [...prev, message];
        }
        return prev;
      });
      // if (message.chatId === chatId) {
      //   setMessages((prev) => [...prev, message]);
      // }
    };

    socket.on("newMessage", handleNewMessage);

    return () => {
      socket.off("newMessage", handleNewMessage);
    };
  }, [socket, chatId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageInput(e.target.value);

    if (socket && selectedFriend && !isTyping) {
      setIsTyping(true);
      socket.emit("typing", {
        receiverId: selectedFriend.friendId,
        userId: userId,
      });
    }

    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      if (socket && selectedFriend) {
        socket.emit("stopTyping", {
          receiverId: selectedFriend.friendId,
          userId: userId,
        });
      }
      setIsTyping(false);
    }, 1500); // 1.5 seconds after stop
  };

  const sendMessage = async () => {
    if (
      !messageInput.trim() ||
      !chatId ||
      !userId ||
      !selectedFriend ||
      !socket
    )
      return;

      // Convert media files to base64
  const convertToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });

    
    try {
      const mediaBase64 = await Promise.all(mediaFiles.map((file) => convertToBase64(file)));
      console.log("media", mediaBase64)
      const newMessage = {
        chatId,
        senderId: userId,
        receiverId: selectedFriend.friendId,
        content: messageInput,
        media: mediaBase64,
        isRead: false,
      };
      const res = await fetch("http://localhost:5000/api/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMessage),
      });

      const savedMessage = await res.json();
      console.log("saveMessage", savedMessage);
      //   // Optimistically update the UI
      // setMessages((prev) => [...prev, savedMessage]);
      // Scroll to bottom if allowed
      if (shouldScroll.current && bottomRef.current) {
        bottomRef.current.scrollIntoView({ behavior: "smooth" });
      }
      // Send message to Socket.IO server to broadcast

      socket.emit("sendMessage", {
        chatId: savedMessage.chatId,
        senderId: savedMessage.sender._id,
        receiverId: savedMessage.receiver,
        media: savedMessage.media,
        content: savedMessage.content,
      });

      // Update local message state
      setMediaFiles([]);
    setPreviewVisible(false);
    setMessageInput("");
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  useEffect(() => {
    if (!socket) return;

    const handleMessagesReadAck = ({
      chatId: ackChatId,
      readerId,
    }: {
      chatId: string;
      readerId: string;
    }) => {
      if (readerId === userId) return;
      // Mark messages as read locally if they were sent by current user
      setMessages((prevMessages) =>
        prevMessages.map((msg) => {
          const isSenderCurrentUser =
            (typeof msg.sender === "string" && msg.sender === userId) ||
            (typeof msg.sender === "object" && msg.sender._id === userId);
          return isSenderCurrentUser && msg.chatId === ackChatId
            ? { ...msg, isRead: true }
            : msg;
        })
      );
    };

    socket.on("messagesReadAck", handleMessagesReadAck);

    return () => {
      socket.off("messagesReadAck", handleMessagesReadAck);
    };
  }, [friends]);

  useEffect(() => {
    if (shouldScroll.current && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
      // shouldScroll.current = false; // only scroll once per chat entry
    }
  }, [messages]);

  useEffect(() => {
    if (!socket || !selectedFriend) return;

    const handleTyping = (senderId: string) => {
      if (senderId === selectedFriend.friendId) {
        setTypingFriend(senderId);
      }
    };

    const handleStopTyping = (senderId: string) => {
      if (senderId === selectedFriend.friendId) {
        setTypingFriend(null);
      }
    };

    socket.on("typing", handleTyping);
    socket.on("stopTyping", handleStopTyping);

    return () => {
      socket.off("typing", handleTyping);
      socket.off("stopTyping", handleStopTyping);
    };
  }, [socket, selectedFriend]);

  useEffect(() => {
    if (
      !socket ||
      !selectedFriend ||
      !userId ||
      !chatId ||
      messages.length === 0
    )
      return;

    // Check if there are any unread messages from the selected friend
    const hasUnreadFromFriend = messages.some(
      (msg) =>
        !msg.isRead &&
        ((typeof msg.sender === "string" &&
          msg.sender === selectedFriend.friendId) ||
          (typeof msg.sender === "object" &&
            msg.sender._id === selectedFriend.friendId))
    );

    if (hasUnreadFromFriend) {
      // Emit read events to server
      socket.emit("messagesRead", {
        chatId,
        readerId: userId,
        senderId: selectedFriend.friendId,
      });

      socket.emit("mark_messages_read", {
        senderId: selectedFriend.friendId,
        receiverId: userId,
      });
    }
  }, [chatId, selectedFriend, socket, userId, messages.length]);

  // Handle file input change
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxSizeMB = 50; // base64-safe limit
    const validFiles = files.filter(file => {
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > maxSizeMB) {
        alert(`${file.name} is too large. Max allowed size is ${maxSizeMB}MB.`);
        return false;
      }
      return true;
    });
    setMediaFiles(validFiles);
    setPreviewVisible(true);
  };


const renderMediaPreviews = () => {
  return mediaFiles.map((file, index) => {
    const isImage = file.type.startsWith("image/");
    const url = URL.createObjectURL(file);
    return (
      <div key={index} className="relative">
        {isImage ? (
          <img src={url} className="w-20 h-20 object-cover rounded" />
        ) : (
          <video src={url} className="w-20 h-20 rounded" controls />
        )}
      </div>
    );
  });
};

  // console.log("selectedFriend", selectedFriend)
  // console.log("messages", messages);
  return (
    <div className="flex flex-col bg-transparent h-full p-2 pb-5 overflow-y-auto">
      <div className="flex flex-row justify-center items-center gap-2 p-3">
        {selectedFriend && (
          <img
            src={selectedFriend.profilePic}
            alt="image"
            className="w-[30px] rounded-full"
          />
        )}
        <h2 className="flex justify-center items-center text-lg font-semibold">
          {selectedFriend
            ? `${selectedFriend.username}`
            : "Select a friend to chat"}
        </h2>
      </div>

      <div className="h-[70%] bg-gray-950 p-4 rounded-lg shadow-inner overflow-y-auto space-y-2">
        {messages.length > 0 &&
          messages.map((msg, idx) => {
            const isSentByUser =
              (typeof msg.sender === "string" && msg.sender === userId) ||
              (typeof msg.sender === "object" && msg.sender._id === userId);
            const isFromFriend =
              (typeof msg.sender === "string" &&
                msg.sender === selectedFriend?.friendId) ||
              (typeof msg.sender === "object" &&
                msg.sender._id === selectedFriend?.friendId);
            // const isFromFriend = senderId === selectedFriend?.friendId;

            // Only render messages sent by you or the selected friend
            if (!isSentByUser && !isFromFriend) return null;
            // console.log("msg", msg)
            return (
              <div
                key={msg?._id || idx}
                className={`p-2 relative rounded-md max-w-[70%] break-words whitespace-pre-wrap text-black ${
                  isSentByUser ? "bg-lime-400 ml-auto" : "bg-lime-100 mr-auto"
                }`}
              >
                {msg.content}
                {msg.media && msg.media?.length > 0 && (
  <div className="grid grid-cols-3 gap-2">
    {msg.media.map((url, index) =>
      url.endsWith(".mp4") ? (
        <video key={index} src={url} controls className="w-24 h-24" />
      ) : (
        <img key={index} src={url} className="w-24 h-24 rounded" />
      )
    )}
  </div>
 )}
                {isSentByUser && msg.isRead && (
                  <span className="text-sm absolute right-0 bottom-0 text-gray-400 ml-2">
                    👁️
                  </span>
                )}
              </div>
            );
          })}
        {typingFriend && (
          <div className="text-sm italic text-white">Typing...</div>
        )}
        <div ref={bottomRef} />
      </div>
      {selectedFriend && previewVisible && mediaFiles.length > 0 && (
  <div className="flex flex-wrap gap-2 mb-2">
    {renderMediaPreviews()}
    <span className="text-white text-sm ml-2">
      {mediaFiles.length} selected
    </span>
  </div>
)}
      {selectedFriend && (
        
        <div className="flex flex-row items-center mt-4 gap-1">
          <input
            type="file"
             multiple
  accept="image/*,video/*"
            onChange={handleFileSelect}
            className="hidden"
            id="upload"
          />
          <label
            htmlFor="upload"
            className="cursor-pointer px-4 py-2 text-white bg-gray-800 rounded"
          >
            📷
          </label>
          <textarea
            value={messageInput}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault(); // Prevent newline
                sendMessage();
              }
            }}
            className="flex-1 px-4 py-2 rounded-md bg-gray-800 text-white outline-none resize-none"
            placeholder="Type a message..."
            rows={1}
          />
          {/* <input
            type="text"
            value={messageInput}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault(); // prevent line break
                sendMessage();
              }
            }}
            className="flex-1 px-4 py-2 rounded-md bg-gray-800 text-white outline-none"
            placeholder="Type your message..."
          /> */}
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
