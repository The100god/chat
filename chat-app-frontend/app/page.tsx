"use client"

import { useAuth } from "./context/AuthContext";

export default function Home() {
  const {isAuthenticated, logout} = useAuth();
  if(!isAuthenticated){
    return null
  }
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-4xl font-bold mb-6">🎉 Welcome to Chat App!</h1>
      <button
        onClick={logout}
        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
      >
        Logout
      </button>
    </div>
  );
}
