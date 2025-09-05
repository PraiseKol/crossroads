import { supabase } from "../lib/supabaseClient";
import { useState, useEffect } from "react";

export default function Navbar() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // ✅ Get active user session on mount
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setUser(data.user);
      }
    });

    // ✅ Listen for auth changes (sign in / sign out)
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("signed_in_user"); // cleanup
    window.location.href = "/signin"; // redirect
  };

  return (
    <nav className="w-full bg-white shadow px-6 py-3 flex justify-between items-center">
      <h1 className="text-xl font-bold">Cross+Roads</h1>

      {user ? (
        <button
          onClick={handleSignOut}
          className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
        >
          Sign Out
        </button>
      ) : (
        <a
          href="/signin"
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
        >
          Sign In
        </a>
      )}
    </nav>
  );
}
