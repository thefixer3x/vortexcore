#!/usr/bin/env node

const {
  GITHUB_SHA,
  VERCEL_TOKEN,
  VERCEL_PROJECT_ID,
  VERCEL_TEAM_ID,
  VERCEL_EXPECT_TARGET = "preview",
} = process.env;

if (!GITHUB_SHA || !VERCEL_TOKEN || !VERCEL_PROJECT_ID) {
  console.error("Missing GITHUB_SHA, VERCEL_TOKEN, or VERCEL_PROJECT_ID");
  process.exit(1);
}

const endpoint = new URL("https://api.vercel.com/v6/deployments");
endpoint.searchParams.set("projectId", VERCEL_PROJECT_ID);
endpoint.searchParams.set("limit", "100");
if (VERCEL_TEAM_ID) endpoint.searchParams.set("teamId", VERCEL_TEAM_ID);

const isExpectedTarget = (deployment) =>
  VERCEL_EXPECT_TARGET === "production"
    ? deployment.target === "production"
    : deployment.target !== "production";

const attempts = 24;
for (let attempt = 1; attempt <= attempts; attempt += 1) {
  const response = await fetch(endpoint, {
    headers: { Authorization: `Bearer ${VERCEL_TOKEN}` },
  });

  if (!response.ok) {
    console.error(`Vercel deployment query failed with HTTP ${response.status}`);
    process.exit(1);
  }

  const body = await response.json();
  const deployment = body.deployments?.find(
    (candidate) =>
      candidate.meta?.githubCommitSha === GITHUB_SHA && isExpectedTarget(candidate),
  );

  if (deployment?.state === "READY") {
    console.log(
      `Verified ${VERCEL_EXPECT_TARGET} deployment ${deployment.uid} for ${GITHUB_SHA}`,
    );
    process.exit(0);
  }

  if (deployment && ["ERROR", "CANCELED"].includes(deployment.state)) {
    console.error(
      `Vercel deployment ${deployment.uid} ended in state ${deployment.state}`,
    );
    process.exit(1);
  }

  if (attempt < attempts) {
    await new Promise((resolve) => setTimeout(resolve, 5_000));
  }
}

console.error(
  `No READY ${VERCEL_EXPECT_TARGET} deployment found for ${GITHUB_SHA} within 120 seconds`,
);
process.exit(1);
