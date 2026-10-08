import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";

// App.tsx owns QueryClientProvider and the global stylesheets (and every other
// provider) so that the exposed Module Federation root (`./App`) is self-contained
// for the shell host too. BrowserRouter here is standalone-only — the shared
// BaseLayout's Navbar renders <Link>/<NavLink>, which need a Router ancestor; the
// shell host provides its own when this app runs federated.
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
