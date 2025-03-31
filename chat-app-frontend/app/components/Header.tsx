'use client';
import { useAuth } from '../context/AuthContext';
import { FaUserFriends, FaBell, FaUsers, FaCog } from 'react-icons/fa';
import { MdLogout } from 'react-icons/md';
import Link from 'next/link';

const Header: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return null; // Don't show header if not authenticated
  }
  // Dummy data (replace with real data from backend)
  const friendCount = 10;
  const profilePic = '/profile.jpg'; // Dummy profile image

  return (
    <header className="w-full bg-black shadow-md py-4 px-6 flex justify-between items-center">
      {/* Left Section */}
      <div className="flex items-center space-x-6">
        {/* Profile Picture */}
        <Link href="/profile">
          <img
            src={profilePic}
            alt="Profile"
            className="w-10 h-10 rounded-full cursor-pointer border-2 border-blue-500 hover:opacity-80"
          />
        </Link>

        {/* Friend Requests */}
        <Link href="/requests" className="flex items-center space-x-2 hover:text-blue-500">
          <FaBell size={24} />
          <span>Requests</span>
        </Link>

        {/* Friends Count */}
        <Link href="/friends" className="flex items-center space-x-2 hover:text-blue-500">
          <FaUserFriends size={24} />
          <span>{friendCount} Friends</span>
        </Link>

        {/* Groups */}
        <Link href="/groups" className="flex items-center space-x-2 hover:text-blue-500">
          <FaUsers size={24} />
          <span>Groups</span>
        </Link>
      </div>

      {/* Center Section - Gappo Logo */}
      <div className="w-1/3 flex justify-center mr-[10%]">
        <div className="text-2xl font-bold text-blue-600">Gappo</div>
      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-4">
        {/* Settings */}
        <Link href="/settings" className="hover:text-blue-500">
          <FaCog size={24} />
        </Link>

        {/* Logout Button */}
        <button
          onClick={logout}
          className="flex items-center space-x-2 bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600"
        >
          <MdLogout size={20} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
