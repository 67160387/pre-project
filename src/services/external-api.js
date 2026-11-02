// Public Wikipedia MediaWiki endpoint: game background for demonstration.
// Dependency is injected so retries/timeouts can be tested without network.
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function fetchWithRetry(
  url,
  { fetchImpl = fetch, timeoutMs = 1800, retries = 2, delayMs = 100 } = {},
) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetchImpl(url, {
        signal: AbortSignal.timeout(timeoutMs),
        headers: {
          "User-Agent": "BoardGameManagementAPI/1.0 (student project)",
        },
      });
      if (!response.ok) {
        const err = new Error("HTTP " + response.status);
        err.retryable = response.status >= 500 || response.status === 429;
        if (!err.retryable) throw err;
        throw err;
      }
      return await response.json();
    } catch (err) {
      if (err.retryable === false || attempt === retries) throw err;
      await sleep(delayMs * 2 ** attempt);
    }
  }
}
async function getGameBackground(name, options = {}) {
  const base =
    process.env.EXTERNAL_API_URL || "https://en.wikipedia.org/w/api.php";
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    prop: "extracts",
    exintro: "1",
    explaintext: "1",
    redirects: "1",
    titles: name + " (board game)",
  });
  try {
    const json = await fetchWithRetry(base + "?" + params, {
      timeoutMs: Number(process.env.EXTERNAL_TIMEOUT_MS || 1800),
      ...options,
    });
    const pages = json?.query?.pages || {};
    const page = Object.values(pages)[0];
    return {
      source: "wikipedia",
      available: Boolean(page?.extract),
      summary: page?.extract || "No description available",
    };
  } catch (err) {
    return {
      source: "fallback",
      available: false,
      summary: "External description is temporarily unavailable",
    };
  }
}
module.exports = { fetchWithRetry, getGameBackground };
