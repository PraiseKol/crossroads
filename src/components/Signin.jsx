import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Signin({ setIsSignedIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Sign in existing account
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
    } else if (data.user) {
      localStorage.setItem("signed_in_user", data.user.id);
      setIsSignedIn(true);
      setMessage("Signed in successfully!");
      window.location.href = "/";
    }

    setLoading(false);
  };

  // Create new account
  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
    } else if (data.user) {
      localStorage.setItem("signed_in_user", data.user.id);
      setIsSignedIn(true);
      setMessage("Account created! Check your email for confirmation.");
      window.location.href = "/";
    }

    setLoading(false);
  };

  // Google OAuth sign-in
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
    });

    if (error) setMessage(error.message);

    setLoading(false);
    // Supabase handles redirect automatically; you can catch post-redirect in App.jsx
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-sm">
        <h2 className="text-2xl font-semibold text-center mb-6">Sign In</h2>

        {message && (
          <p className="text-center text-sm text-red-500 mb-4">{message}</p>
        )}

        <form className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded-lg px-4 py-2"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded-lg px-4 py-2"
            required
          />
          <button
            onClick={handleSignup}
            type="button"
            disabled={loading}
            className="w-full bg-gray-200 text-gray-700 rounded-lg px-4 py-2 hover:bg-gray-300 transition"
          >
            {loading ? "Processing..." : "Create Account"}
          </button>
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-blue-500 text-white rounded-lg px-4 py-2 hover:bg-blue-600 transition"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-red-500 text-white rounded-lg px-4 py-2 hover:bg-red-600 transition"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 533.5 544.3"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill="#4285F4"
                d="M533.5 278.4c0-17.7-1.4-34.7-4-51.2H272v96.8h146.9c-6.3 34-25.3 62.9-54 82v68h87.2c50.9-46.9 80.4-116 80.4-195.6z"
              />
              <path
                fill="#34A853"
                d="M272 544.3c72.6 0 133.7-24 178.2-65.2l-87.2-68c-24.2 16.3-55.3 26.1-91 26.1-69.9 0-129.2-47.1-150.3-110.2H32v69.2C76.5 488.5 169.3 544.3 272 544.3z"
              />
              <path
                fill="#FBBC05"
                d="M121.7 332c-10.7-32-10.7-66.6 0-98.6V164.2H32c-42.3 84.8-42.3 185.4 0 270.2l89.7-69.2z"
              />
              <path
                fill="#d12315"
                d="M272 107.7c37.7 0 71.5 12.9 98.2 34.7l73.4-73.4C404.5 29.3 345.4 0 272 0 169.3 0 76.5 55.8 32 140.2l89.7 69.2c21.1-63.1 80.4-110.2 150.3-110.2z"
              />
            </svg>
            {loading ? "Signing in..." : "Sign in with Google"}
          </button>
        </div>
      </div>
    </div>
  );
}
