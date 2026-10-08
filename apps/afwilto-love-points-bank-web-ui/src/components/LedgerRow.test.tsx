import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LedgerRow } from "./LedgerRow";
import { makeEntry, members, MEMBER_A, MEMBER_B } from "../test/msw";

function renderRow(entry = makeEntry(), currentMember: string | null = MEMBER_B) {
  const onEdit = vi.fn().mockResolvedValue({});
  const onVoid = vi.fn().mockResolvedValue({});
  render(
    <table>
      <tbody>
        <LedgerRow
          entry={entry}
          members={members}
          currentMember={currentMember}
          onEdit={onEdit}
          onVoid={onVoid}
        />
      </tbody>
    </table>,
  );
  return { onEdit, onVoid };
}

describe("LedgerRow", () => {
  it("muestra el destinatario y la justificación", () => {
    renderRow();
    expect(screen.getByText(/a Ana/)).toBeInTheDocument();
    expect(screen.getByText(/porque me contó del susto/)).toBeInTheDocument();
  });

  it("expone el monto como puntitos accesibles", () => {
    renderRow(makeEntry({ amount: 3 }));
    expect(screen.getByLabelText("3 puntitos")).toBeInTheDocument();
  });

  it("entra en edición, cancela con Escape y restaura el valor", async () => {
    const user = userEvent.setup();
    const { onEdit } = renderRow();

    await user.click(screen.getByRole("button", { name: /editar/i }));
    const textarea = screen.getByLabelText(/justificación/i);
    await user.clear(textarea);
    await user.type(textarea, "un texto totalmente distinto aquí");
    await user.keyboard("{Escape}");

    expect(onEdit).not.toHaveBeenCalled();
    // vuelve a modo lectura con el texto original
    expect(screen.getByText(/porque me contó del susto/)).toBeInTheDocument();
  });

  it("guarda una edición con Enter", async () => {
    const user = userEvent.setup();
    const { onEdit } = renderRow();

    await user.click(screen.getByRole("button", { name: /editar/i }));
    const textarea = screen.getByLabelText(/justificación/i);
    await user.clear(textarea);
    await user.type(textarea, "porque además me ayudó a estudiar toda la tarde");
    await user.keyboard("{Enter}");

    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onEdit.mock.calls[0][1].reason).toMatch(/estudiar/);
  });

  it("no ofrece editar ni anular a quien no es el autor", () => {
    renderRow(makeEntry(), MEMBER_A); // A recibió, B fue el autor
    expect(screen.queryByRole("button", { name: /editar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /anular/i })).not.toBeInTheDocument();
  });

  it("anular pide confirmación en el mismo renglón", async () => {
    const user = userEvent.setup();
    const { onVoid } = renderRow();

    await user.click(screen.getByRole("button", { name: /^anular$/i }));
    expect(screen.getByText(/¿anular este abono\?/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /sí, anular/i }));
    expect(onVoid).toHaveBeenCalledWith("e-1");
  });

  it("un movimiento anulado se muestra marcado y sin acciones", () => {
    renderRow(makeEntry({ status: "voided" }));
    const row = screen.getByText(/porque me contó del susto/).closest("tr")!;
    expect(within(row).getByText(/anulado/i)).toBeInTheDocument();
    expect(within(row).queryByRole("button", { name: /editar/i })).not.toBeInTheDocument();
  });
});
