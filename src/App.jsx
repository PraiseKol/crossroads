import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Feed from "./components/Feed";
import PollPage from "./components/PollPage";
import Signin from "./components/Signin";
import Navbar from "./components/Navbar";

const queryClient = new QueryClient();



function App() {
  
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
      <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        
          <Routes>
            <Route path="/" element={<Feed />} />
            <Route path="/signin" element={<Signin />} />
            <Route path="/poll/:id" element={<PollPage />} />
          </Routes>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
