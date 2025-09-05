import { supabase } from "./supabaseClient";

// Fetch polls (pairs) with category filter, pagination, and nested voters
export async function fetchPairs(
  category,
  page = 1,
  pageSize = 10,
  excludeId = null
) {
  let query = supabase
    .from("pairs")
    .select(
      `
      id,
      category,
      option_a,
      option_b,
      votes_a,
      votes_b,
      created_at,
      votes (
        device_id,
        user_id,
        choice
      )
    `
    )
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

  // Normalize: separate guest vs signed-in voters
  // After fetching each poll
  return (data || []).map((p) => ({
    ...p,
    guestVoters: Array.isArray(p.votes)
      ? p.votes.filter((v) => v.device_id)
      : [],
    userVoters: Array.isArray(p.votes) ? p.votes.filter((v) => v.user_id) : [],
    voters: Array.isArray(p.votes) ? p.votes : [], // ✅ add generic voters array
  }));
}

// Fetch single pair (with voters) by id
export async function fetchPairById(id) {
  const { data, error } = await supabase
    .from("pairs")
    .select(
      `
      id,
      category,
      option_a,
      option_b,
      votes_a,
      votes_b,
      created_at,
      votes (
        device_id,
        user_id,
        choice
      )
    `
    )
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching pair by id:", error);
    throw error;
  }

  return {
    ...data,
    guestVoters: Array.isArray(data?.votes) ? data.votes.filter(v => v.device_id) : [],
    userVoters: Array.isArray(data?.votes) ? data.votes.filter(v => v.user_id) : [],
    voters: Array.isArray(data?.votes) ? data.votes : [], // ✅ add generic voters array
  };
  
}

// Cast a vote (device_id is text)
export async function castVote(pairId, choice, deviceId) {
  // 🚨 Defensive check: ensure guests provide a device ID
  if (!deviceId && !(await supabase.auth.getUser()).data?.user) {
    throw new Error("Guests must provide a device ID to vote.");
  }

  const { data, error } = await supabase.rpc("cast_vote", {
    p_pair_id: pairId,
    p_choice: choice,
    p_device_id: deviceId,
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
