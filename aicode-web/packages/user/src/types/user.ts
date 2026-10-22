export type UserProfile = {
  name: string
  email: string
  role: string
  phone: string
}

export type UserAccount = {
  id: number
  name: string
  email: string
  phone?: string | null
  roleLabel: string
}

export type UserAccountPayload = {
  email: string
  name: string
  phone?: string
  password?: string
}
