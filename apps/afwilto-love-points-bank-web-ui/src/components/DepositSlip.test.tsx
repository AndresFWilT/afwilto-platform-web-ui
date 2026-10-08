import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DepositSlip } from "./DepositSlip";
import { members, MEMBER_B } from "../test/msw";
import { ApiError } from "../api/client";

describe("DepositSlip (boleta de abono)", () => {
  it("no envía con razón corta y muestra el mensaje", async () => {
    const onAward = vi.fn().mockResolvedValue({});
    const user = userEvent.setup();
    render(<DepositSlip members={members} currentMember={MEMBER_B} onAward={onAward} />);

    await user.type(screen.getByPlaceholderText(/qué fue lo que te gustó/i), "corto");
    await user.click(screen.getByRole("button", { name: /sellar abono/i }));

    expect(await screen.findByText(/al menos 10 caracteres/i)).toBeInTheDocument();
    expect(onAward).not.toHaveBeenCalled();
  });

  it("envía un abono válido con el porqué escrito", async () => {
    const onAward = vi.fn().mockResolvedValue({});
    const user = userEvent.setup();
    render(<DepositSlip members={members} currentMember={MEMBER_B} onAward={onAward} />);

    await user.type(
      screen.getByPlaceholderText(/qué fue lo que te gustó/i),
      "porque me trajo café sin que se lo pidiera",
    );
    await user.click(screen.getByRole("button", { name: /sellar abono/i }));

    await waitFor(() => expect(onAward).toHaveBeenCalledTimes(1));
    const body = onAward.mock.calls[0][0];
    expect(body.reason).toMatch(/café/);
    expect(body.amount).toBe(1);
    expect(body.awarded_to).toBe(members[0].id); // el otro titular
  });

  it("un 422 del servidor se muestra junto al campo de la razón", async () => {
    const onAward = vi.fn().mockRejectedValue(
      new ApiError(422, { code: "reason_too_short", detail: "La justificación necesita al menos 10 caracteres." }),
    );
    const user = userEvent.setup();
    render(<DepositSlip members={members} currentMember={MEMBER_B} onAward={onAward} />);

    await user.type(
      screen.getByPlaceholderText(/qué fue lo que te gustó/i),
      "un texto que el cliente cree válido",
    );
    await user.click(screen.getByRole("button", { name: /sellar abono/i }));

    expect(await screen.findByText(/al menos 10 caracteres/i)).toBeInTheDocument();
    // el texto sobrevive al error: no se pierde lo que la persona escribió
    expect(screen.getByPlaceholderText(/qué fue lo que te gustó/i)).toHaveValue(
      "un texto que el cliente cree válido",
    );
  });
});
