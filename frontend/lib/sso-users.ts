export type SSOUserRecord = {
  id: string
  name: string
  email: string
  company: string
  role: string
  createdAt: string
  lastLogin?: string
}

const STORAGE_KEY = "sso_users"

const seededUsers: SSOUserRecord[] = [
  {
    id: "u-1001",
    name: "Amani Carter",
    email: "amani.carter@northwind.com",
    company: "Northwind Talent",
    role: "Hiring Manager",
    createdAt: "2024-04-12T14:23:00.000Z",
    lastLogin: "2025-01-11T09:00:00.000Z",
  },
  {
    id: "u-1002",
    name: "Diego Martínez",
    email: "diego.martinez@acme.io",
    company: "Acme IO",
    role: "Engineering Manager",
    createdAt: "2024-06-01T10:00:00.000Z",
    lastLogin: "2025-01-09T19:30:00.000Z",
  },
  {
    id: "u-1003",
    name: "Priya Desai",
    email: "priya.desai@aurora.ai",
    company: "Aurora AI",
    role: "People Operations",
    createdAt: "2024-08-18T08:45:00.000Z",
    lastLogin: "2025-01-10T15:15:00.000Z",
  },
]

export function readFromStorage(): SSOUserRecord[] | null {
  if (typeof window === "undefined") return null

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as SSOUserRecord[]
    if (!Array.isArray(parsed)) return null
    return parsed
  } catch (error) {
    console.warn("Failed to parse SSO users from storage", error)
    return null
  }
}

export function getInitialUsers(): SSOUserRecord[] {
  return readFromStorage() ?? seededUsers
}

export function persistUsers(users: SSOUserRecord[]) {
  if (typeof window === "undefined") return

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(users))
  } catch (error) {
    console.warn("Failed to persist SSO users", error)
  }
}

export function findUserByEmail(users: SSOUserRecord[], email: string) {
  const normalized = email.trim().toLowerCase()
  if (!normalized) return undefined
  return users.find((user) => user.email.toLowerCase() === normalized)
}
