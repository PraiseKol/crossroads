import { supabase } from "./supabaseClient";

// Fetch polls (pairs) with category filter, pagination, and nested voters
export async function fetchPairs(category, page = 1, pageSize = 10, excludeId = null) {
  let query = supabase
    .from("pairs")
    .select(`
      id,
      category,
      option_a,
      option_b,
      votes_a,
      votes_b,
      created_at,
      votes (
        device_id,
        choice
      )
    `)
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (category && category !== "All") {
    query = query.eq("category", category);
  }

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching pairs:", error);
    throw error;
  }

  // Normalize: map nested votes -> voters expected by UI
  return (data || []).map((p) => ({
    ...p,
    voters: Array.isArray(p.votes) ? p.votes : [],
  }));
}

// Fetch single pair (with voters) by id
export async function fetchPairById(id) {
  const { data, error } = await supabase
    .from("pairs")
    .select(`
      id,
      category,
      option_a,
      option_b,
      votes_a,
      votes_b,
      created_at,
      votes (
        device_id,
        choice
      )
    `)
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching pair by id:", error);
    throw error;
  }

  return {
    ...data,
    voters: Array.isArray(data?.votes) ? data.votes : [],
  };
}

// Cast a vote (device_id is text)
export async function castVote(pairId, choice, deviceId) {
  const { data, error } = await supabase.rpc("cast_vote", {
    pair_id: pairId,   // must match Postgres function signature
    choice: choice,    // 'A' or 'B'
    device_id: deviceId,
  });

  if (error) {
    console.error("Error casting vote:", error);
    throw error;
  }

  if (!data || (Array.isArray(data) && data.length === 0)) {
    console.warn("No data returned from cast_vote RPC");
    return null;
  }

  // Normalize: always return a single row { id, votes_a, votes_b }
  const row = Array.isArray(data) ? data[0] : data;
  return {
    id: row.id,
    votes_a: row.votes_a,
    votes_b: row.votes_b,
  };
}
