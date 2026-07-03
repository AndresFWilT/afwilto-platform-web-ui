// Design tokens — mirrors the @theme defined in index.css.
// Use these in logic (charts, dynamic styles, etc.)

export const colors = {
  primary: {
    50:  '#e0fffd',
    100: '#b3fff9',
    200: '#66fff2',
    300: '#1affec',
    400: '#00fff0', // brand
    500: '#00e6d8',
    600: '#00b3a8',
    700: '#007f77',
    800: '#004f4a', // brand dark
    900: '#002b27',
    950: '#001210',
  },
  purple: {
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7', // main accent
    600: '#9333ea',
    700: '#7c3aed',
    800: '#6b21a8',
    900: '#3b0764',
  },
  dark: {
    950: '#050505',
    900: '#0a0a0a', // app background
    800: '#111111', // surface
    700: '#1a1a1a', // card
    600: '#242424', // elevated card
    500: '#2e2e2e', // hover states
    400: '#404040', // borders
    300: '#525252', // subtle borders
  },
  income: {
    400: '#34d399',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
  },
  expense: {
    400: '#fb7185',
    500: '#f43f5e',
    600: '#e11d48',
    700: '#be123c',
  },
  warning: {
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
  },
  text: {
    primary:   '#f8fafc',
    secondary: '#94a3b8',
    muted:     '#475569',
    disabled:  '#1e293b',
  },
  border: '#1e293b',
  borderSubtle: '#0f172a',
} as const
