import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchPairById } from "../lib/api";
import PollCard from "./PollCard";
import Feed from "./Feed";

export default function PollPage({ isSignedIn, setIsSignedIn }) {
  const { id } = useParams();

  const { data: pair, isLoading, error } = useQuery({
    queryKey: ["pair", id],
    queryFn: () => fetchPairById(id),
    enabled: !!id,
  });

  if (isLoading) return <p className="text-center py-8">Loading poll...</p>;
  if (error || !pair) return <p className="text-center text-red-500">Poll not found.</p>;

  return (
    <div className="w-full max-w-md space-y-6 p-4">
      {/* Pinned/shared poll */}
      <PollCard
        pair={pair}
        highlight
        isSignedIn={isSignedIn}
        setIsSignedIn={setIsSignedIn}
      />

      <hr className="my-6 border-gray-300" />

      {/* Feed below the shared poll */}
      <Feed pinnedPollId={id} isSignedIn={isSignedIn} setIsSignedIn={setIsSignedIn} />
    </div>
  );
}
