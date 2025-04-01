'use client';
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import React, { useState } from "react";

interface AuthFormProps {
  type: "signup" | "login";
}

const AuthForm: React.FC<AuthFormProps> = ({ type }) => {
  const [formData, setFormData] = useState<{
    username: string;
    email: string;
    password: string;
  }>({
    username: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
const {login} = useAuth(); 
  const handleChange = (e:React.ChangeEvent<HTMLInputElement>)=>{
    setFormData({
        ...formData, [e.target.name]:e.target.value
    })
  }

  const handleSubmit = async (e:React.FormEvent<HTMLFormElement>)=>{
    e.preventDefault()

    try {

        const url = type === "login"? 'http://localhost:5000/api/auth/login':'http://localhost:5000/api/auth/signup'

        const response = await axios.post(url, formData)
        const token = response.data.token;
        if (token){
            login(token)
            localStorage.setItem("userId", response.data.userId)
        }
        setMessage(response.data.message || "success")
        setError(null)
        
    } catch (error:any) {
        setError(error.response?.data?.error || 'Something went wrong')
        setMessage(null)
    }
  }


  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="w-96 p-6 bg-white shadow-md rounded-lg">
        <h2 className="text-2xl font-bold mb-4 text-center">
          {type === "signup" ? "Sign Up" : "Login"}
        </h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {message && <p className="text-green-500 mb-4">{message}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {type === "signup" && (
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              required
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
            />
          )}

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
          />

          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition"
          >
            {type === "signup" ? "Sign Up" : "Login"}
          </button>
        </form>

        <p className="text-center mt-4 text-sm">
          {type === "signup" ? (
            <a href="/login" className="text-blue-500 hover:underline">
              Already have an account? Login
            </a>
          ) : (
            <a href="/signup" className="text-blue-500 hover:underline">
              Don't have an account? Sign Up
            </a>
          )}
        </p>
      </div>
    </div>
  );
};

export default AuthForm;
