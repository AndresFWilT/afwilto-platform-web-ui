/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Base absoluta de la API cuando esta app corre embebida como remote federado
  // (el origen de la página no es el del contenedor de este remote). Vacía o ausente
  // en standalone: "/api/v1" queda relativo al proxy nginx/vite.
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "*.module.css" {
  const classes: { readonly [key: string]: string };
  export default classes;
}
