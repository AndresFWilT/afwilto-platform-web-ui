import { describe, expect, it, beforeEach } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { App } from "./App";
import { renderWithClient } from "./test/renderWithClient";
import { server, makeItem, makeRedemption, MEMBER_B, defaultBalances } from "./test/msw";

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("puntitos.currentMember", MEMBER_B);
  window.location.hash = "";
});

describe("App — navegación por chips (fase 2)", () => {
  it("cambia entre Movimientos, Canjear y Planes", async () => {
    const user = userEvent.setup();
    renderWithClient(<App />);
    await screen.findByRole("option", { name: "Beto" });

    // Movimientos por defecto: la boleta de abono está presente.
    expect(screen.getByRole("form", { name: /boleta de abono/i })).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Canjear" }));
    expect(await screen.findByText(/boleta de canje/i)).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Planes" }));
    expect(await screen.findByRole("form", { name: /nuevo plan/i })).toBeInTheDocument();
  });

  it("la pestaña Canjear ofrece los planes activos y descuenta del disponible", async () => {
    const user = userEvent.setup();
    // Beto tiene saldo disponible; hay un plan activo de 8.
    server.use(
      http.get("/api/v1/balances", () =>
        HttpResponse.json([
          { ...defaultBalances[0] },
          { member_id: MEMBER_B, display_name: "Beto", points_earned: 20, entries_count: 4, last_entry_at: "2026-09-10T15:00:00Z", points_redeemed: 0, points_available: 20 },
        ]),
      ),
      http.get("/api/v1/catalog-items", () => HttpResponse.json([makeItem({ id: "i8", cost: 8 })])),
    );
    let redeemedBody: unknown = null;
    server.use(
      http.post("/api/v1/redemptions", async ({ request }) => {
        redeemedBody = await request.json();
        return HttpResponse.json(makeRedemption(), { status: 201 });
      }),
    );

    renderWithClient(<App />);
    await screen.findByRole("option", { name: "Beto" });
    await user.click(screen.getByRole("tab", { name: "Canjear" }));

    await user.selectOptions(await screen.findByLabelText(/plan a canjear/i), "i8");
    await user.type(screen.getByPlaceholderText(/por qué lo canjean/i), "porque terminamos la semana bien");
    await user.click(screen.getByRole("button", { name: /sellar canje/i }));

    await waitFor(() => expect(redeemedBody).not.toBeNull());
    expect(redeemedBody).toMatchObject({ catalog_item_id: "i8", amount: 8 });
  });

  it("Planes agrupa por nivel derivado y muestra el catálogo", async () => {
    const user = userEvent.setup();
    server.use(
      http.get("/api/v1/catalog-items", () =>
        HttpResponse.json([
          makeItem({ id: "b", name: "Desayuno en cama", cost: 5, tier: "baratito" }),
          makeItem({ id: "a", name: "Escapada de finde", cost: 60, tier: "alto" }),
        ]),
      ),
    );
    renderWithClient(<App />);
    await screen.findByRole("option", { name: "Beto" });
    await user.click(screen.getByRole("tab", { name: "Planes" }));

    const catalog = await screen.findByRole("region", { name: /catálogo de planes/i });
    expect(within(catalog).getByText("Desayuno en cama")).toBeInTheDocument();
    expect(within(catalog).getByText("Escapada de finde")).toBeInTheDocument();
    expect(within(catalog).getByText(/baratito/i)).toBeInTheDocument();
    expect(within(catalog).getByText(/alto/i)).toBeInTheDocument();
  });
});
