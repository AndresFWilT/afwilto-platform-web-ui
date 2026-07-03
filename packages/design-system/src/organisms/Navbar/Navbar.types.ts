export interface NavLink {
  label: string
  to: string
}

export interface NavbarProps {
  brand: string
  links?: NavLink[]
}
