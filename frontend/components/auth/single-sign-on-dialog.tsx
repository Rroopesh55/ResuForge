"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  findUserByEmail,
  getInitialUsers,
  persistUsers,
  readFromStorage,
  type SSOUserRecord,
} from "@/lib/sso-users"
import { BadgeCheck, CheckCircle2, Globe2, LogIn, ShieldCheck, UserPlus, Users2 } from "lucide-react"

function formatDate(dateIso?: string) {
  if (!dateIso) return "—"
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateIso))
}

type FormStatus = {
  status: "idle" | "success" | "error"
  message?: string
  user?: SSOUserRecord
}

export function SingleSignOnDialog() {
  const [open, setOpen] = useState(false)
  const [activeView, setActiveView] = useState<"chooser" | "existing" | "new">("chooser")
  const [users, setUsers] = useState<SSOUserRecord[]>(() => {
    if (typeof window !== "undefined") {
      const stored = readFromStorage()
      if (stored) return stored
    }
    return getInitialUsers()
  })
  const [hasHydrated, setHasHydrated] = useState(false)
  const [existingEmail, setExistingEmail] = useState("")
  const [existingStatus, setExistingStatus] = useState<FormStatus>({ status: "idle" })
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    company: "",
    role: "",
  })
  const [creationStatus, setCreationStatus] = useState<FormStatus>({ status: "idle" })

  useEffect(() => {
    const stored = readFromStorage()
    if (stored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUsers(stored)
    }
    setHasHydrated(true)
  }, [])

  useEffect(() => {
    if (hasHydrated && users.length) {
      persistUsers(users)
    }
  }, [hasHydrated, users])

  const totalCompanies = useMemo(() => new Set(users.map((user) => user.company)).size, [users])

  const resetForms = () => {
    setActiveView("chooser")
    setExistingEmail("")
    setExistingStatus({ status: "idle" })
    setNewUser({ name: "", email: "", company: "", role: "" })
    setCreationStatus({ status: "idle" })
  }

  const handleExistingSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const match = findUserByEmail(users, existingEmail)

    if (!match) {
      setExistingStatus({ status: "error", message: "No SSO profile was found for that email." })
      return
    }

    const updatedUsers = users.map((user) =>
      user.id === match.id ? { ...user, lastLogin: new Date().toISOString() } : user
    )
    setUsers(updatedUsers)
    setExistingStatus({
      status: "success",
      message: "Authenticated via single sign-on. Redirecting to your workspace...",
      user: match,
    })
  }

  const handleNewSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const existingUser = findUserByEmail(users, newUser.email)

    if (existingUser) {
      setCreationStatus({
        status: "error",
        message: "An account already exists for that email. Switch to existing user to continue.",
      })
      return
    }

    const record: SSOUserRecord = {
      id: `u-${Date.now()}`,
      name: newUser.name.trim(),
      email: newUser.email.trim(),
      company: newUser.company.trim(),
      role: newUser.role.trim(),
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    }

    setUsers((prev) => [...prev, record])
    setCreationStatus({
      status: "success",
      message: "SSO profile created. You can now proceed with single sign-on.",
      user: record,
    })
  }

  const statusTone = (state: FormStatus) => {
    if (state.status === "success") return "text-green-600"
    if (state.status === "error") return "text-red-600"
    return "text-muted-foreground"
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) {
          resetForms()
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-purple-600 text-purple-600 hover:bg-purple-50">
          <LogIn className="mr-2 h-4 w-4" />
          Login
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-3xl">
        <DialogHeader className="gap-1">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <ShieldCheck className="h-5 w-5 text-purple-600" />
            Single Sign-On
          </DialogTitle>
          <DialogDescription>
            Choose how you want to continue. New users can register for SSO, while existing users can verify their profile and log in
            instantly.
          </DialogDescription>
        </DialogHeader>

        {activeView === "chooser" && (
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-purple-100 bg-purple-50">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-2 text-purple-900">
                  <Users2 className="h-5 w-5" />
                  <p className="font-semibold">Existing user</p>
                </div>
                <p className="text-sm text-purple-900/80">
                  Validate your SSO record, confirm we recognize your email, and get routed to your workspace.
                </p>
                <Button onClick={() => setActiveView("existing")} className="bg-purple-600 hover:bg-purple-700">
                  Continue
                </Button>
              </CardContent>
            </Card>

            <Card className="border-blue-100 bg-blue-50">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-2 text-blue-900">
                  <UserPlus className="h-5 w-5" />
                  <p className="font-semibold">New user</p>
                </div>
                <p className="text-sm text-blue-900/80">
                  Create an SSO profile with your company details. We will remember you for future logins.
                </p>
                <Button onClick={() => setActiveView("new")} className="bg-blue-600 hover:bg-blue-700">
                  Create profile
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {activeView === "existing" && (
          <div className="grid gap-6 md:grid-cols-[1.2fr,1fr]">
            <form onSubmit={handleExistingSubmit} className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BadgeCheck className="h-4 w-4 text-green-600" />
                <span>Authenticate with your company SSO email</span>
              </div>
              <div className="space-y-2">
                <Label htmlFor="existing-email">Work email</Label>
                <Input
                  id="existing-email"
                  type="email"
                  required
                  value={existingEmail}
                  onChange={(event) => setExistingEmail(event.target.value)}
                  placeholder="you@company.com"
                />
              </div>

              <div className={`text-sm ${statusTone(existingStatus)}`}>
                {existingStatus.status === "idle" && "We will check if your SSO profile already exists."}
                {existingStatus.message}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setActiveView("chooser")}>Back</Button>
                <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                  Continue with SSO
                </Button>
              </DialogFooter>
            </form>

            <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-purple-800">
                <Globe2 className="h-4 w-4" />
                <span>SSO directory preview</span>
              </div>
              <div className="flex flex-col gap-2 text-sm">
                {users.slice(0, 3).map((user) => (
                  <div key={user.id} className="rounded-md border bg-white px-3 py-2">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <span className="text-xs text-muted-foreground">{user.company}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                    <p className="text-xs text-muted-foreground">Last login: {formatDate(user.lastLogin)}</p>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">{users.length} users across {totalCompanies} companies enabled for SSO.</p>
              </div>
            </div>
          </div>
        )}

        {activeView === "new" && (
          <div className="grid gap-6 md:grid-cols-[1.2fr,1fr]">
            <form onSubmit={handleNewSubmit} className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                <span>Register a new SSO profile</span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="new-name">Full name</Label>
                  <Input
                    id="new-name"
                    required
                    value={newUser.name}
                    onChange={(event) => setNewUser((prev) => ({ ...prev, name: event.target.value }))}
                    placeholder="Avery Lee"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-email">Work email</Label>
                  <Input
                    id="new-email"
                    type="email"
                    required
                    value={newUser.email}
                    onChange={(event) => setNewUser((prev) => ({ ...prev, email: event.target.value }))}
                    placeholder="you@company.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-company">Company</Label>
                  <Input
                    id="new-company"
                    required
                    value={newUser.company}
                    onChange={(event) => setNewUser((prev) => ({ ...prev, company: event.target.value }))}
                    placeholder="Northwind Corp"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-role">Role / team</Label>
                  <Input
                    id="new-role"
                    required
                    value={newUser.role}
                    onChange={(event) => setNewUser((prev) => ({ ...prev, role: event.target.value }))}
                    placeholder="People Operations"
                  />
                </div>
              </div>

              <div className={`text-sm ${statusTone(creationStatus)}`}>
                {creationStatus.status === "idle" && "We will validate the email and create your SSO profile."}
                {creationStatus.message}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setActiveView("chooser")}>Back</Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  Save & enable SSO
                </Button>
              </DialogFooter>
            </form>

            <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-blue-800">
                <ShieldCheck className="h-4 w-4" />
                <span>What you get</span>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-blue-600" />
                  <span>Centralized access with your existing identity provider.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-blue-600" />
                  <span>Organization-aware routing and workspace scoping.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-blue-600" />
                  <span>Automatic user provisioning on first login.</span>
                </li>
              </ul>

              <Separator />

              <div className="space-y-2 text-sm">
                <p className="font-semibold text-gray-900">Sample SSO providers</p>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div className="rounded border bg-white px-3 py-2">Okta</div>
                  <div className="rounded border bg-white px-3 py-2">Azure AD</div>
                  <div className="rounded border bg-white px-3 py-2">Google Workspace</div>
                  <div className="rounded border bg-white px-3 py-2">Auth0</div>
                </div>
                <p className="text-xs text-muted-foreground">Configure the provider after saving your SSO profile.</p>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
