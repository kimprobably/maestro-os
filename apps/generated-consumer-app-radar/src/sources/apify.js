function actorPath(actorId) {
  return String(actorId || "").replace("/", "~");
}

export async function runApifyActor(
  actorId,
  input,
  { token = process.env.APIFY_TOKEN, timeoutMs = 180000 } = {},
) {
  if (!token || token.includes("{{"))
    throw new Error("APIFY_TOKEN is not configured");
  const start = await fetch(
    "https://api.apify.com/v2/acts/" +
      actorPath(actorId) +
      "/runs?token=" +
      encodeURIComponent(token),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input || {}),
    },
  );
  if (!start.ok) throw new Error("Apify actor start failed: " + start.status);
  const started = await start.json();
  const runId = started?.data?.id;
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 3500));
    const status = await fetch(
      "https://api.apify.com/v2/actor-runs/" +
        runId +
        "?token=" +
        encodeURIComponent(token),
    );
    const statusPayload = await status.json();
    const state = statusPayload?.data?.status;
    if (state === "SUCCEEDED") {
      const datasetId = statusPayload.data.defaultDatasetId;
      const dataset = await fetch(
        "https://api.apify.com/v2/datasets/" +
          datasetId +
          "/items?clean=true&format=json&token=" +
          encodeURIComponent(token),
      );
      if (!dataset.ok)
        throw new Error("Apify dataset fetch failed: " + dataset.status);
      return dataset.json();
    }
    if (["FAILED", "ABORTED", "TIMED-OUT"].includes(state))
      throw new Error("Apify actor ended with status " + state);
  }
  throw new Error("Apify actor timed out");
}
