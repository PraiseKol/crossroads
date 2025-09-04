import { useEffect, useState, forwardRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { castVote } from "../lib/api";

const PollCard = ({ pair, highlight = false, onVoted }, ref) => {
  const queryClient = useQueryClient();
  const [hasVoted, setHasVoted] = useState(false);
  const [userChoice, setUserChoice] = useState(null);
  const [localVotes, setLocalVotes] = useState({
    votes_a: pair.votes_a,
    votes_b: pair.votes_b,
  });
  const [copied, setCopied] = useState(false);

  // ✅ Check if this device already voted
  useEffect(() => {
    let deviceId = localStorage.getItem("device_id");
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem("device_id", deviceId);
    }

    const voters = Array.isArray(pair.voters)
      ? pair.voters
      : Array.isArray(pair.votes)
      ? pair.votes
      : [];
    const existingVote = voters.find((v) => v.device_id === deviceId);
    if (existingVote) {
      setHasVoted(true);
      setUserChoice(existingVote.choice);
    }
  }, [pair]);

  const mutation = useMutation({
    mutationFn: async ({ pairId, choice }) => {
      let deviceId = localStorage.getItem("device_id");
      if (!deviceId) {
        deviceId = crypto.randomUUID();
        localStorage.setItem("device_id", deviceId);
      }
      return await castVote(pairId, choice, deviceId);
    },
    onMutate: async ({ pairId, choice }) => {
      await queryClient.cancelQueries({ queryKey: ["pairs"] });

      const prevPairs = queryClient.getQueryData(["pairs"]);
      const prevPair = queryClient.getQueryData(["pair", pairId]);

      // ✅ Optimistic update
      setHasVoted(true);
      setUserChoice(choice);
      setLocalVotes((prev) => ({
        votes_a: prev.votes_a + (choice === "A" ? 1 : 0),
        votes_b: prev.votes_b + (choice === "B" ? 1 : 0),
      }));

      queryClient.setQueryData(["pairs"], (old) => {
        if (!old) return old;
        return old.map((p) =>
          p.id === pairId
            ? {
                ...p,
                votes_a: p.votes_a + (choice === "A" ? 1 : 0),
                votes_b: p.votes_b + (choice === "B" ? 1 : 0),
              }
            : p
        );
      });

      queryClient.setQueryData(["pair", pairId], (old) =>
        old
          ? {
              ...old,
              votes_a: old.votes_a + (choice === "A" ? 1 : 0),
              votes_b: old.votes_b + (choice === "B" ? 1 : 0),
            }
          : old
      );

      return { prevPairs, prevPair };
    },
    onError: (err, variables, context) => {
      if (context?.prevPairs) {
        queryClient.setQueryData(["pairs"], context.prevPairs);
      }
      if (context?.prevPair) {
        queryClient.setQueryData(["pair", variables.pairId], context.prevPair);
      }
    },
    onSuccess: (row) => {
      if (row) {
        setLocalVotes({
          votes_a: row.votes_a,
          votes_b: row.votes_b,
        });

        queryClient.setQueryData(["pairs"], (old) => {
          if (!old) return old;
          return old.map((p) =>
            p.id === row.id
              ? { ...p, votes_a: row.votes_a, votes_b: row.votes_b }
              : p
          );
        });

        queryClient.setQueryData(["pair", row.id], (old) =>
          old ? { ...old, votes_a: row.votes_a, votes_b: row.votes_b } : old
        );
      }
      // 🔔 Notify parent Feed
      if (onVoted) {
        onVoted(row.id);
      }
    },
  });

  const total = localVotes.votes_a + localVotes.votes_b;
  const percentA = total > 0 ? Math.round((localVotes.votes_a / total) * 100) : 0;
  const percentB = total > 0 ? Math.round((localVotes.votes_b / total) * 100) : 0;

  const sharePoll = () => {
    const pollUrl = `${window.location.origin}/poll/${pair.id}`;
    navigator.clipboard.writeText(pollUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      ref={ref} // ✅ works now with forwardRef
      id={`poll-${pair.id}`}
      data-voted={hasVoted ? "true" : "false"}
      className={`poll-card bg-white p-6 rounded-2xl shadow-md w-full transition ${
        highlight ? "ring-2 ring-blue-400" : ""
      }`}
    >
      <h3 className="text-lg font-semibold mb-4 text-center">Choose one</h3>

      <div className="flex flex-col sm:flex-row gap-4">
        {/* Option A */}
        <button
          disabled={hasVoted || mutation.isLoading}
          onClick={() => {
            setUserChoice("A");
            mutation.mutate({ pairId: pair.id, choice: "A" });
          }}
          className={`flex-1 p-6 rounded-xl border text-lg font-medium transition duration-200 ${
            hasVoted
              ? userChoice === "A"
                ? "bg-green-500 text-white"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-green-100 hover:bg-green-200"
          }`}
        >
          {pair.option_a}
          {hasVoted && (
            <p className="mt-2 text-sm">
              {localVotes.votes_a} people ({percentA}%)
            </p>
          )}
        </button>

        {/* Option B */}
        <button
          disabled={hasVoted || mutation.isLoading}
          onClick={() => {
            setUserChoice("B");
            mutation.mutate({ pairId: pair.id, choice: "B" });
          }}
          className={`flex-1 p-6 rounded-xl border text-lg font-medium transition duration-200 ${
            hasVoted
              ? userChoice === "B"
                ? "bg-red-500 text-white"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-red-100 hover:bg-red-200"
          }`}
        >
          {pair.option_b}
          {hasVoted && (
            <p className="mt-2 text-sm">
              {localVotes.votes_b} people ({percentB}%)
            </p>
          )}
        </button>
      </div>

      {/* Total votes */}
      {hasVoted && (
        <p className="mt-4 text-center text-gray-600 text-sm">
          Total votes: {total}
        </p>
      )}

      <div className="mt-4 text-center">
        <button onClick={sharePoll} className="text-sm underline">
          {copied ? "Link copied!" : "Share this poll"}
        </button>
      </div>
    </div>
  );
};

// ✅ Wrap with forwardRef so Feed can scroll
export default forwardRef(PollCard);
