const {
  fetchWithRetry,
  getGameBackground,
} = require("../services/external-api");
test("retry 2 times after server errors", async () => {
  const fn = jest
    .fn()
    .mockResolvedValueOnce({ ok: false, status: 503 })
    .mockResolvedValueOnce({ ok: false, status: 500 })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ query: { pages: { 1: { extract: "Good" } } } }),
    });
  const value = await getGameBackground("Catan", { fetchImpl: fn, delayMs: 1 });
  expect(fn).toHaveBeenCalledTimes(3);
  expect(value.source).toBe("wikipedia");
});
test("nonretryable 404 only calls once", async () => {
  const fn = jest.fn().mockResolvedValue({ ok: false, status: 404 });
  await expect(
    fetchWithRetry("http://example.com", {
      fetchImpl: fn,
      retries: 2,
      delayMs: 1,
    }),
  ).rejects.toThrow("HTTP 404");
  expect(fn).toHaveBeenCalledTimes(1);
});
test("fallback after network failure", async () => {
  const fn = jest.fn().mockRejectedValue(new Error("no internet"));
  const value = await getGameBackground("Catan", { fetchImpl: fn, delayMs: 1 });
  expect(value.source).toBe("fallback");
  expect(fn).toHaveBeenCalledTimes(3);
});
test("timeout signal provided and timeout fallback", async () => {
  const fn = jest.fn(async (url, config) => {
    expect(config.signal).toBeDefined();
    return new Promise((resolve, reject) => {
      config.signal.addEventListener(
        "abort",
        () => reject(new Error("timeout")),
        { once: true },
      );
    });
  });
  const result = await getGameBackground("Catan", {
    fetchImpl: fn,
    timeoutMs: 10,
    delayMs: 1,
  });
  expect(result.source).toBe("fallback");
  expect(fn).toHaveBeenCalledTimes(3);
});
