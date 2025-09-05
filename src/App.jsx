import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import Feed from "./components/Feed";
import PollPage from "./components/PollPage";
import Signin from "./components/Signin";
import Navbar from "./components/Navbar";

const queryClient = new QueryClient();

function App() {
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem("signed_in_user");
    if (user) setIsSignedIn(true);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Navbar isSignedIn={isSignedIn} setIsSignedIn={setIsSignedIn} />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Routes>
            <Route
              path="/"
              element={<Feed isSignedIn={isSignedIn} setIsSignedIn={setIsSignedIn} />}
            />
            <Route
              path="/signin"
              element={<Signin setIsSignedIn={setIsSignedIn} />}
            />
            <Route
              path="/poll/:id"
              element={<PollPage isSignedIn={isSignedIn} setIsSignedIn={setIsSignedIn} />}
            />
          </Routes>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
