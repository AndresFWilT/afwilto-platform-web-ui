import { type ReactElement } from "react";
import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";

// Renderiza con un QueryClient fresco por test (sin reintentos, para fallar rápido).
// MemoryRouter: App ahora usa BaseLayout (@afwilto/design-system), cuyo Navbar
// renderiza <Link>/<NavLink> — necesitan un Router ancestro incluso en tests.
export function renderWithClient(ui: ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <MemoryRouter>
      <QueryClientProvider client={client}>{ui}</QueryClientProvider>
    </MemoryRouter>,
  );
}
