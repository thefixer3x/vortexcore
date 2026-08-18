#!/usr/bin/env node

const {
  VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY,
  TEST_USER_A_EMAIL,
  TEST_USER_A_PASSWORD,
  TEST_USER_B_EMAIL,
  TEST_USER_B_PASSWORD,
} = process.env;

const required = {
  VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY,
  TEST_USER_A_EMAIL,
  TEST_USER_A_PASSWORD,
  TEST_USER_B_EMAIL,
  TEST_USER_B_PASSWORD,
};

for (const [name, value] of Object.entries(required)) {
  if (!value) {
    console.error(`Missing ${name}`);
    process.exit(1);
  }
}

const decodeSubject = (token) => {
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8"));
    if (typeof payload.sub !== "string" || !payload.sub) throw new Error("missing sub");
    return payload.sub;
  } catch {
    console.error("A configured test JWT has no valid subject claim");
    process.exit(1);
  }
};

const signIn = async (label, email, password) => {
  const response = await fetch(
    `${VITE_SUPABASE_URL}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: {
        apikey: VITE_SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    },
  );

  if (!response.ok) {
    console.error(`Unable to create a fresh session for ${label} (HTTP ${response.status})`);
    process.exit(1);
  }

  const body = await response.json();
  if (typeof body.access_token !== "string") {
    console.error(`Supabase returned no access token for ${label}`);
    process.exit(1);
  }
  return body.access_token;
};

const tokenA = await signIn("userA", TEST_USER_A_EMAIL, TEST_USER_A_PASSWORD);
const tokenB = await signIn("userB", TEST_USER_B_EMAIL, TEST_USER_B_PASSWORD);
const users = [
  { label: "userA", token: tokenA, id: decodeSubject(tokenA) },
  { label: "userB", token: tokenB, id: decodeSubject(tokenB) },
];
const tables = [
  "vortex_wallets",
  "vortex_transactions",
  "vortex_settings",
  "ai_chat_sessions",
  "ai_chat_messages",
];

const requestRows = async (table, token, query) => {
  const response = await fetch(`${VITE_SUPABASE_URL}/rest/v1/${table}?${query}`, {
    headers: {
      apikey: VITE_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    console.error(`${table} returned HTTP ${response.status} for an authenticated test user`);
    process.exit(1);
  }

  const rows = await response.json();
  if (!Array.isArray(rows)) {
    console.error(`${table} returned a non-array response`);
    process.exit(1);
  }
  return rows;
};

for (const table of tables) {
  for (const [index, user] of users.entries()) {
    const otherUser = users[index === 0 ? 1 : 0];
    const visibleRows = await requestRows(table, user.token, "select=user_id&limit=100");

    if (visibleRows.some((row) => row.user_id !== user.id)) {
      console.error(`${table} exposed another user's row to ${user.label}`);
      process.exit(1);
    }

    const crossUserRows = await requestRows(
      table,
      user.token,
      `select=user_id&user_id=eq.${encodeURIComponent(otherUser.id)}&limit=1`,
    );
    if (crossUserRows.length !== 0) {
      console.error(`${table} allowed ${user.label} to query the other test user`);
      process.exit(1);
    }
  }

  const anonymousResponse = await fetch(
    `${VITE_SUPABASE_URL}/rest/v1/${table}?select=user_id&limit=1`,
    { headers: { apikey: VITE_SUPABASE_ANON_KEY } },
  );
  if (anonymousResponse.ok) {
    console.error(`${table} is readable without an authenticated user`);
    process.exit(1);
  }
}

console.log(`Verified owner isolation and anonymous denial on ${tables.length} Vortex facades`);
