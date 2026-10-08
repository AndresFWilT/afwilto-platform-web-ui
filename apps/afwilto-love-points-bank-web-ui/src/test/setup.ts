import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll, expect } from "vitest";
import * as axeMatchers from "vitest-axe/matchers";
import { server } from "./msw";

expect.extend(axeMatchers);

// crypto.randomUUID existe en jsdom moderno; garantizamos su presencia.
if (!globalThis.crypto?.randomUUID) {
  // @ts-expect-error: polyfill mínimo para el guardado optimista en tests
  globalThis.crypto = { ...globalThis.crypto, randomUUID: () => `test-${Math.random().toString(16).slice(2)}` };
}

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

