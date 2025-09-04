import { useState, useRef, useEffect } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { fetchPairs } from "../lib/api";
import PollCard from "./PollCard";
import { supabase } from "../lib/supabaseClient"; // ✅ import supabase

const categories = ["All", "General", "Sports", "Music", "Tech"];

export default function Feed({ pinnedPollId = null }) {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const queryClient = useQueryClient();
  const pollRefs = useRef({}); // ✅ store refs for each poll

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["pairs", selectedCategory, pinnedPollId],
    queryFn: ({ pageParam = 1 }) =>
      fetchPairs(selectedCategory, pageParam, 10, pinnedPollId),
    getNextPageParam: (lastPage, pages) => {
      if (!lastPage || lastPage.length === 0) return undefined;
      return pages.length + 1;
    },
    keepPreviousData: true,
  });

  const loadMoreRef = useRef();

  // ✅ Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 1 }
    );

    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage]);

  // ✅ Supabase realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("pairs-updates")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "pairs" },
        (payload) => {
          const updatedPair = payload.new;

          // Patch infinite query cache (all pages)
          queryClient.setQueryData(
            ["pairs", selectedCategory, pinnedPollId],
            (oldData) => {
              if (!oldData) return oldData;
              return {
                ...oldData,
                pages: oldData.pages.map((page) =>
                  page.map((pair) =>
                    pair.id === updatedPair.id
                      ? {
                          ...pair,
                          votes_a: updatedPair.votes_a,
                          votes_b: updatedPair.votes_b,
                        }
                      : pair
                  )
                ),
              };
            }
          );

          // Patch single pair cache (if it’s open somewhere else)
          queryClient.setQueryData(["pair", updatedPair.id], (oldPair) => {
            if (!oldPair) return oldPair;
            return {
              ...oldPair,
              votes_a: updatedPair.votes_a,
              votes_b: updatedPair.votes_b,
            };
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, selectedCategory, pinnedPollId]);


    // ✅ Flatten all pages safely
    let allPairs = [];
    if (data?.pages) {
      allPairs = data.pages.flat();
    }
  
    // Remove pinned poll from feed to avoid duplication
    let pinnedPoll = null;
    if (pinnedPollId && allPairs.length > 0) {
      const index = allPairs.findIndex((p) => p.id === pinnedPollId);
      if (index >= 0) {
        pinnedPoll = allPairs.splice(index, 1)[0];
      }
    }
  
    // ✅ Reset refs when feed data changes
    useEffect(() => {
      pollRefs.current = {};
    }, [data?.pages]);
  
    if (isLoading)
      return <p className="text-center py-8">Loading polls...</p>;
    if (error)
      return (
        <p className="text-center text-red-500">Something went wrong.</p>
      );
  

  

  // ✅ Handle vote → scroll to next poll
  const handleVote = (pairId) => {
    const index = allPairs.findIndex((p) => p.id === pairId);
    if (index >= 0 && index < allPairs.length - 1) {
      const nextPoll = allPairs[index + 1];
      setTimeout(() => {
        const nextElement = pollRefs.current[nextPoll.id];
        if (nextElement) {
          nextElement.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6 p-4">
      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              selectedCategory === cat
                ? "bg-blue-500 text-white"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Pinned/shared poll */}
      {pinnedPoll && (
        <PollCard
          ref={(el) => (pollRefs.current[pinnedPoll.id] = el)}
          pair={pinnedPoll}
          highlight
          onVoted={handleVote}
        />
      )}

      {/* Polls feed */}
      {allPairs.length === 0 ? (
        <p className="text-center text-gray-500 py-6">No polls yet.</p>
      ) : (
        allPairs.map((pair) => (
          <PollCard
            key={pair.id}
            ref={(el) => (pollRefs.current[pair.id] = el)}
            pair={pair}
            onVoted={handleVote}
          />
        ))
      )}

      {/* Infinite scroll sentinel */}
      <div ref={loadMoreRef} className="text-center py-4">
        {isFetchingNextPage && <p>Loading more...</p>}
      </div>
    </div>
  );
}
