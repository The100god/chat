"use client";

import { useAuth } from "./context/AuthContext";
import ResizableLayout from "./components/ResizableLayout"; // Import ResizableLayout
import LeftSection from "./pages/leftSection/page";
import ChatArea from "./pages/chatAreas/page";

export default function Home() {
  const { isAuthenticated } = useAuth();
  
  
  if (!isAuthenticated) {
    return null; // Don't show anything if not authenticated
  }

  return (
    // <div className="flex min-h-screen bg-gray-100">
      <ResizableLayout leftComponent={<LeftSection />} rightComponent={<ChatArea />}/>
      
    // </div>
  );
}
