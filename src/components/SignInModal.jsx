import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

const SignInModal = ({ onClose, onSignIn }) => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    const email = e.target.email.value;
    const password = e.target.password.value;

    // 🔐 Replace with real auth later
    localStorage.setItem("signed_in_user", email);

    setLoading(false);
    if (onSignIn) onSignIn(email);
    onClose();
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
    });

    if (error) {
      console.log("Google sign-in error:", error);
      setLoading(false);
    }
    // Supabase will handle redirect; no need to manually set localStorage here
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-96 shadow-lg">
        <h2 className="text-lg font-semibold mb-4 text-center">Sign In</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            name="email"
            placeholder="Email"
            required
            className="w-full p-2 border rounded mb-3"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            required
            className="w-full p-2 border rounded mb-4"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full mt-3 bg-red-500 text-white py-2 rounded hover:bg-red-600 transition"
        >
          {loading ? "Signing in..." : "Sign in with Google"}
        </button>

        <button
          type="button"
          onClick={onClose}
          className="w-full mt-2 text-sm underline"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default SignInModal;
