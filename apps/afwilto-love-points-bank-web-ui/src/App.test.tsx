import { describe, expect, it, beforeEach } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse, delay } from "msw";
import { App } from "./App";
import { renderWithClient } from "./test/renderWithClient";
import { server, makeEntry, MEMBER_B } from "./test/msw";

beforeEach(() => {
  localStorage.clear();
});

async function chooseBeto(user: ReturnType<typeof userEvent.setup>) {
  // Espera a que la lista de titulares cargue antes de elegir.
  await screen.findByRole("option", { name: "Beto" });
  const select = screen.getByLabelText(/estás usando la libreta como/i);
  await user.selectOptions(select, MEMBER_B);
}

describe("App — chrome de la plataforma AFWILTO (Spec 15)", () => {
  it("renderiza dentro del BaseLayout compartido (navbar 'AFWILTO Platform')", () => {
    renderWithClient(<App />);
    // El footer también dice "AFWILTO Platform" (copyright) y Cover.tsx renderiza su
    // propio <header> ("Banco de Puntitos"), así que se acota al <nav> del Navbar,
    // el único elemento con ese role en el árbol.
    const nav = screen.getByRole("navigation");
    expect(within(nav).getByText(/AFWILTO Platform/i)).toBeInTheDocument();
  });
});

describe("App — guardado optimista (spec 001, plan §5)", () => {
  it("el renglón aparece de inmediato al enviar la boleta", async () => {
    const user = userEvent.setup();
    server.use(
      http.post("/api/v1/entries", async () => {
        await delay(50); // la respuesta tarda; el optimista debe verse antes
        return HttpResponse.json(makeEntry({ reason: "porque me escribió un mensaje muy lindo" }), { status: 201 });
      }),
    );

    renderWithClient(<App />);
    await chooseBeto(user);

    await user.type(
      screen.getByPlaceholderText(/qué fue lo que te gustó/i),
      "porque me escribió un mensaje muy lindo",
    );
    await user.click(screen.getByRole("button", { name: /sellar abono/i }));

    // aparece antes de que la API responda (guardado optimista)
    expect(await screen.findByText(/me escribió un mensaje muy lindo/i)).toBeInTheDocument();
  });

  it("si la API falla, el renglón se retira y el texto sobrevive en la boleta", async () => {
    const user = userEvent.setup();
    const texto = "porque preparó la cena aunque estaba cansada";
    server.use(
      http.post("/api/v1/entries", async () => {
        await delay(20);
        return HttpResponse.json({ code: "internal", detail: "boom" }, { status: 500 });
      }),
    );

    renderWithClient(<App />);
    await chooseBeto(user);

    const textarea = screen.getByPlaceholderText(/qué fue lo que te gustó/i);
    await user.type(textarea, texto);
    await user.click(screen.getByRole("button", { name: /sellar abono/i }));

    // tras el fallo, la entrada optimista desaparece del libro...
    await waitFor(() => {
      const ledger = screen.getByRole("region", { name: /movimientos/i });
      expect(within(ledger).queryByText(texto)).not.toBeInTheDocument();
    });
    // ...y el texto NO se pierde: sigue en la boleta.
    expect(textarea).toHaveValue(texto);
  });
});
