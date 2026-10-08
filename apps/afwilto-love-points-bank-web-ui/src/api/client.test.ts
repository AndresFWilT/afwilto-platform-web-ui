import { afterEach, describe, expect, it, vi } from "vitest";
import { request } from "./client";

// Embebido en la plataforma AFWILTO, la app corre en el origen del shell host
// (localhost:3000), no en el de su propio contenedor — un fetch relativo a "/api/v1"
// llegaría al shell, no a la API. VITE_API_URL hace la base absoluta y configurable;
// sin ella, el comportamiento standalone (mismo origen, proxy nginx) no cambia.

function stubFetchOk(body: unknown = {}) {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("request() API base URL", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("uses the relative /api/v1 base when VITE_API_URL is unset (standalone)", async () => {
    vi.stubEnv("VITE_API_URL", "");
    const fetchMock = stubFetchOk();

    await request("/members");

    expect(fetchMock).toHaveBeenCalledWith("/api/v1/members", expect.anything());
  });

  it("prefixes VITE_API_URL when set (federated / containerized)", async () => {
    vi.stubEnv("VITE_API_URL", "http://localhost:8083");
    const fetchMock = stubFetchOk();

    await request("/members");

    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8083/api/v1/members", expect.anything());
  });

  it("strips a trailing slash from VITE_API_URL before prefixing", async () => {
    vi.stubEnv("VITE_API_URL", "http://localhost:8083/");
    const fetchMock = stubFetchOk();

    await request("/members");

    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8083/api/v1/members", expect.anything());
  });
});
