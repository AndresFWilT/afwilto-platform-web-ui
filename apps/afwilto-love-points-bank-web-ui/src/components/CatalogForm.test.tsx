import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CatalogForm } from "./CatalogForm";

describe("CatalogForm (nuevo plan)", () => {
  it("muestra el nivel derivado en vivo al teclear el costo", async () => {
    const user = userEvent.setup();
    render(<CatalogForm onCreate={vi.fn()} />);

    const cost = screen.getByLabelText(/costo del plan/i);
    await user.type(cost, "8");
    expect(screen.getByText(/nivel medio/i)).toBeInTheDocument();

    await user.clear(cost);
    await user.type(cost, "60");
    expect(screen.getByText(/nivel alto/i)).toBeInTheDocument();

    await user.clear(cost);
    await user.type(cost, "3");
    expect(screen.getByText(/nivel baratito/i)).toBeInTheDocument();
  });

  it("crea un plan válido", async () => {
    const onCreate = vi.fn().mockResolvedValue({});
    const user = userEvent.setup();
    render(<CatalogForm onCreate={onCreate} />);

    await user.type(screen.getByLabelText(/nombre del plan/i), "Escapada de finde");
    await user.type(screen.getByLabelText(/costo del plan/i), "40");
    await user.click(screen.getByRole("button", { name: /crear plan/i }));

    expect(onCreate).toHaveBeenCalledWith({ name: "Escapada de finde", cost: 40, description: "" });
  });

  it("no crea con nombre corto", async () => {
    const onCreate = vi.fn();
    const user = userEvent.setup();
    render(<CatalogForm onCreate={onCreate} />);

    await user.type(screen.getByLabelText(/nombre del plan/i), "ab");
    await user.type(screen.getByLabelText(/costo del plan/i), "8");
    await user.click(screen.getByRole("button", { name: /crear plan/i }));

    expect(await screen.findByText(/al menos 3 caracteres/i)).toBeInTheDocument();
    expect(onCreate).not.toHaveBeenCalled();
  });
});
