import { describe, expect, it, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { axe } from "vitest-axe";
import { http, HttpResponse } from "msw";
import { App } from "./App";
import { renderWithClient } from "./test/renderWithClient";
import { server, makeEntry, MEMBER_A, MEMBER_B } from "./test/msw";

beforeEach(() => localStorage.clear());

describe("accesibilidad de la pantalla principal", () => {
  it("no tiene violaciones con movimientos cargados", async () => {
    localStorage.setItem("puntitos.currentMember", MEMBER_B);
    server.use(
      http.get("/api/v1/entries", () =>
        HttpResponse.json({
          entries: [
            makeEntry({ id: "e1", amount: 3, awarded_to: MEMBER_A }),
            makeEntry({ id: "e2", amount: 1, status: "voided", reason: "porque me equivoqué al abonar esto" }),
          ],
          next_cursor: null,
        }),
      ),
    );

    const { container } = renderWithClient(<App />);
    // espera a que la libreta cargue
    await screen.findByText(/porque me contó del susto/i);
    await waitFor(() => expect(screen.getByRole("table")).toBeInTheDocument());

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
