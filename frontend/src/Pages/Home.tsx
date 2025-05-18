import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();
  const handleStartDrwaing = async () => {
    navigate("/whiteboard");
  };
  return (
    <div className="relative flex flex-col items-center justify-center h-screen w-full text-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Background Gradient */}
      <div className="absolute top-8 right-8 rounded-full">
        <SignedIn>
          <UserButton />
        </SignedIn>
      </div>

      {/* Abstract Shapes */}
      <div className="absolute top-16 left-16 w-36 h-36 bg-blue-500 opacity-20 blur-3xl rounded-full"></div>
      <div className="absolute bottom-16 right-16 w-40 h-40 bg-purple-500 opacity-20 blur-3xl rounded-full"></div>
      <div className="absolute bottom-32 left-40 w-24 h-24 bg-cyan-500 opacity-20 blur-3xl rounded-full"></div>

      {/* Main Content */}
      <h1 className="text-6xl font-bold tracking-tight drop-shadow-lg">
        Welcome to <span className="text-blue-400">FlowBoard</span>
      </h1>
      <p className="text-xl text-gray-300 mt-4">Where ideas take shape.</p>

      {/* Sign In Button (Appears Only When Signed Out) */}
      <div>
        <SignedOut>
          <SignInButton>
            <button className="mt-6 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white text-lg font-semibold rounded-lg shadow-md transition">
              Sign In to Get Started
            </button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <button
            onClick={handleStartDrwaing}
            className="mt-6 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white text-lg font-semibold rounded-lg shadow-md transition"
          >
            Start Drawing ✏️
          </button>
        </SignedIn>
      </div>

      {/* Thin Artistic Line (Mimicking a Pen Stroke) */}
      <div className="absolute top-32 right-12 w-32 h-1 bg-blue-400 transform rotate-12 opacity-50"></div>
      <div className="absolute bottom-24 left-12 w-24 h-1 bg-purple-400 transform -rotate-12 opacity-50"></div>

      {/* Subtle Icon */}
      <div className="absolute bottom-10 right-10">
        <svg
          className="w-12 h-12 text-gray-500 opacity-30"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4v16m8-8H4"
          ></path>
        </svg>
      </div>
    </div>
  );
}
