import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RedemptionSlip } from "./RedemptionSlip";
import { makeItem } from "../test/msw";

const items = [
  makeItem({ id: "i8", name: "Noche de película", cost: 8 }),
  makeItem({ id: "i40", name: "Escapada de finde", cost: 40 }),
];

describe("RedemptionSlip (boleta de canje)", () => {
  it("al elegir un plan precarga su costo como monto (híbrido)", async () => {
    const user = userEvent.setup();
    render(<RedemptionSlip items={items} available={100} onRedeem={vi.fn()} />);

    await user.selectOptions(screen.getByLabelText(/plan a canjear/i), "i8");
    expect(screen.getByLabelText(/puntitos a gastar/i)).toHaveValue(8);
  });

  it("bloquea el envío y avisa si el monto supera el disponible", async () => {
    const onRedeem = vi.fn();
    const user = userEvent.setup();
    render(<RedemptionSlip items={items} available={5} onRedeem={onRedeem} />);

    await user.selectOptions(screen.getByLabelText(/plan a canjear/i), "i8"); // cuesta 8 > 5
    const button = screen.getByRole("button", { name: /sellar canje/i });
    expect(button).toBeDisabled();

    await user.type(screen.getByPlaceholderText(/por qué lo canjean/i), "porque nos lo merecemos hoy");
    // intento forzado igual no llama a onRedeem
    await user.click(button);
    expect(onRedeem).not.toHaveBeenCalled();
  });

  it("canjea con monto editado (híbrido) y nota", async () => {
    const onRedeem = vi.fn().mockResolvedValue({});
    const user = userEvent.setup();
    render(<RedemptionSlip items={items} available={100} onRedeem={onRedeem} />);

    await user.selectOptions(screen.getByLabelText(/plan a canjear/i), "i8");
    const amount = screen.getByLabelText(/puntitos a gastar/i);
    await user.clear(amount);
    await user.type(amount, "6");
    await user.type(screen.getByPlaceholderText(/por qué lo canjean/i), "porque solo queremos algo chico");
    await user.click(screen.getByRole("button", { name: /sellar canje/i }));

    expect(onRedeem).toHaveBeenCalledTimes(1);
    expect(onRedeem.mock.calls[0][0]).toMatchObject({ catalog_item_id: "i8", amount: 6 });
  });

  it("no canjea con nota corta", async () => {
    const onRedeem = vi.fn();
    const user = userEvent.setup();
    render(<RedemptionSlip items={items} available={100} onRedeem={onRedeem} />);

    await user.selectOptions(screen.getByLabelText(/plan a canjear/i), "i8");
    await user.type(screen.getByPlaceholderText(/por qué lo canjean/i), "corto");
    await user.click(screen.getByRole("button", { name: /sellar canje/i }));

    expect(await screen.findByText(/al menos 10 caracteres/i)).toBeInTheDocument();
    expect(onRedeem).not.toHaveBeenCalled();
  });

  it("sin planes activos invita a crear uno", () => {
    render(<RedemptionSlip items={[]} available={10} onRedeem={vi.fn()} />);
    expect(screen.getByText(/no hay planes activos/i)).toBeInTheDocument();
  });
});
