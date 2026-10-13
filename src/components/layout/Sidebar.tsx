import { useEffect, useMemo, useRef, useState } from "react"
import type { PermissionSet, SubAccountPermissions, User } from "../../types"
import {
  BarChart3, Bell, Boxes, CalendarClock, ChevronDown, CircleHelp, ClipboardList, CreditCard, FileText, FolderOpen,
  Home, Inbox, LogOut, Mail, MessageSquare, Moon, PoundSterling, Search, Settings, ShieldCheck, ShoppingBasket,
  UserPlus, Users, UsersRound, Wrench, X, type LucideIcon,
} from "lucide-react"

const CUSTOMER_NAV_PERMISSION_KEY: Partial<Record<string, keyof SubAccountPermissions>> = {
  "place-order": "placeOrders", orders: "viewOrders", payments: "viewInvoicesBalance",
  documents: "viewDocuments", tickets: "raiseTickets", complaints: "raiseTickets",
}

const NAV_PERMISSION_KEY: Partial<Record<string, keyof PermissionSet>> = {
  products: "products", orders: "orders", customers: "customers", "add-customer": "customersCreate", tickets: "tickets",
  payments: "payments", "payment-proofs": "payments", "credit-control": "payments",
  "credit-notes": "creditNotesIssue", "customer-applications": "applicationsManage",
  "reminders-due-today": "invoicesSendReminders", "reminders-14-day": "invoicesSendReminders", "reminders-21-day": "invoicesSendReminders",
  stats: "stats", "day-check": "stats", stock: "stock", "data-extract": "extracts",
  enquiries: "enquiries", complaints: "complaints",
  invoices: "invoicesView", "create-invoice": "invoicesView", "invoice-numbers": "invoicesView", outstanding: "invoicesView",
  "email-imports": "emailImportsView", files: "filesView", "communication-history": "communicationsView",
}

type NavItem = {
  key: string; label: string; icon: LucideIcon; hint?: string; badgeKey?: string
  access?: "users" | "superAdmin" | "systemDeveloper"
  /** Other page keys that should light this item up as "where you are". */
  alsoActive?: string[]
}
type NavSection = { label: string; items: NavItem[] }

/* The everyday jobs - always on screen, always labelled, one click each.
   Everything else lives under "More options" so the main list stays short. */
const ADMIN_MAIN: NavItem[] = [
  { key: "dashboard", label: "Home", icon: Home, hint: "Today at a glance" },
  { key: "customers", label: "Customers", icon: UsersRound, hint: "Find a customer" },
  { key: "invoices", label: "Invoices", icon: FileText, hint: "Paid and unpaid" },
  { key: "reminders-due-today", label: "Reminders", icon: CalendarClock, hint: "Who to chase today", alsoActive: ["reminders-14-day", "reminders-21-day", "outstanding"] },
  { key: "payments", label: "Payments", icon: PoundSterling, hint: "Money received" },
  { key: "files", label: "Documents", icon: FolderOpen, hint: "Invoice PDFs and files" },
  { key: "email-imports", label: "Email Imports", icon: Inbox, hint: "Invoices sent by email" },
  { key: "communication-history", label: "Sent Messages", icon: Mail, hint: "Emails and reminders sent" },
]

const ADMIN_MORE: NavSection[] = [
  { label: "Customers", items: [
    { key: "add-customer", label: "Add a Customer", icon: UserPlus },
    { key: "customer-applications", label: "Customer Applications", icon: ClipboardList },
    { key: "outstanding", label: "21+ Days Overdue", icon: CalendarClock },
    { key: "credit-control", label: "Credit Control", icon: CreditCard },
  ] },
  { label: "Invoices & Money", items: [
    { key: "create-invoice", label: "Create an Invoice", icon: FileText },
    { key: "invoice-numbers", label: "Invoice Numbers", icon: FileText },
    { key: "credit-notes", label: "Credit Notes", icon: FileText },
    { key: "payment-proofs", label: "Payment Proofs", icon: PoundSterling, badgeKey: "payment-proofs" },
    { key: "expenses", label: "Expenses", icon: PoundSterling },
    { key: "day-trade", label: "Day Trades", icon: CalendarClock },
    { key: "day-check", label: "Day Check", icon: CalendarClock },
    { key: "stats", label: "Sales Reports", icon: BarChart3 },
  ] },
  { label: "Messages", items: [
    { key: "tickets", label: "Customer Messages", icon: MessageSquare, badgeKey: "tickets" },
    { key: "notifications", label: "Notifications", icon: Bell },
  ] },
  { label: "Stock & Orders", items: [
    { key: "orders", label: "Sales & Orders", icon: ShoppingBasket, badgeKey: "orders" },
    { key: "stock", label: "Stock", icon: Boxes },
    { key: "session", label: "Buying Desk", icon: PoundSterling },
    { key: "products", label: "Products", icon: Boxes },
    { key: "suppliers", label: "Suppliers", icon: UsersRound },
    { key: "enquiries", label: "Enquiries", icon: MessageSquare },
    { key: "data-extract", label: "Integration", icon: FolderOpen },
  ] },
  { label: "Team", items: [
    { key: "admins", label: "Users & Team", icon: Users, access: "users" },
    { key: "sales-users", label: "Sales Users", icon: Users, access: "users" },
    { key: "assign-task", label: "Assign a Task", icon: ClipboardList, access: "users" },
    { key: "sub-accounts", label: "Sub-Account Approvals", icon: Users, access: "superAdmin" },
    // Visible to every active admin (no `access` gate) so an admin can audit
    // security activity on their own account - the endpoint and RLS behind
    // it allow the same, and the log contains no secrets.
    { key: "login-activity", label: "Login Activity", icon: ShieldCheck },
  ] },
  { label: "System Developer", items: [
    { key: "system-overview", label: "System Overview", icon: Wrench, access: "systemDeveloper" },
    { key: "system-users", label: "Users", icon: Users, access: "systemDeveloper" },
    { key: "audit-logs", label: "Audit Logs", icon: FileText, access: "systemDeveloper" },
    { key: "error-log", label: "Error Log", icon: FileText, access: "systemDeveloper" },
    { key: "test-mode", label: "Test Mode", icon: Wrench, access: "systemDeveloper" },
    { key: "backup-recovery", label: "Backup & Recovery", icon: FolderOpen, access: "systemDeveloper" },
    { key: "database-reset", label: "Database Reset", icon: Wrench, access: "systemDeveloper" },
    { key: "system-health", label: "Integrations & Health", icon: Wrench, access: "systemDeveloper" },
    { key: "security", label: "Security", icon: ShieldCheck, access: "systemDeveloper" },
  ] },
]

const CUSTOMER_SECTIONS: NavSection[] = [
  { label: "Orders", items: [
    { key: "dashboard", label: "Home", icon: Home },
    { key: "stock", label: "Today's Stock", icon: Boxes },
    { key: "place-order", label: "Place an Order", icon: ShoppingBasket },
    { key: "orders", label: "My Orders", icon: ClipboardList, badgeKey: "orders" },
  ] },
  { label: "My Account", items: [
    { key: "payments", label: "My Balance", icon: PoundSterling },
    { key: "documents", label: "My Documents", icon: FolderOpen },
    { key: "team", label: "My Team", icon: Users },
  ] },
  { label: "Help", items: [
    { key: "tickets", label: "Messages", icon: MessageSquare, badgeKey: "tickets" },
    { key: "complaints", label: "Report a Problem", icon: CircleHelp },
  ] },
]

const MORE_OPEN_KEY = "punjab-nav-more-open"

export function Sidebar({ user, current, onNavigate, mobileOpen, onMobileClose, badges, onDayEnd, onLogout }: {
  user: User; current: string; onNavigate: (key: string) => void; mobileOpen?: boolean
  onMobileClose: () => void; badges?: Record<string, number>
  onDayEnd?: () => void; onLogout: () => void
}) {
  const isAdmin = user.role === "admin"

  const allowed = useMemo(() => (item: NavItem) => {
    if (isAdmin) {
      if (item.access === "superAdmin" && !user.isSuperAdmin) return false
      if (item.access === "users" && !user.isSuperAdmin && !user.permissions?.usersManage) return false
      if (item.access === "systemDeveloper" && !user.isSystemDeveloper) return false
      if (user.isSuperAdmin) return true
      const permission = NAV_PERMISSION_KEY[item.key]
      return !permission || Boolean(user.permissions?.[permission])
    }
    if (!user.subAccount) return true
    if (item.key === "team") return false
    const permission = CUSTOMER_NAV_PERMISSION_KEY[item.key]
    return !permission || Boolean(user.subAccount.permissions[permission])
  }, [isAdmin, user.isSuperAdmin, user.isSystemDeveloper, user.permissions, user.subAccount])

  const mainItems = useMemo(() => isAdmin ? ADMIN_MAIN.filter(allowed) : [], [isAdmin, allowed])
  const sections = useMemo(() => (isAdmin ? ADMIN_MORE : CUSTOMER_SECTIONS)
    .map(section => ({ ...section, items: section.items.filter(allowed) }))
    .filter(section => section.items.length > 0), [isAdmin, allowed])

  const currentInMore = isAdmin && sections.some(s => s.items.some(i => i.key === current)) && !mainItems.some(i => i.key === current || i.alsoActive?.includes(current))
  const [moreOpen, setMoreOpen] = useState(() => {
    try { return localStorage.getItem(MORE_OPEN_KEY) === "true" } catch { return false }
  })
  // Opening a page that lives under "More options" opens the list so the
  // highlighted item is visible; the person can still close it again.
  const [lastCurrentInMore, setLastCurrentInMore] = useState(currentInMore)
  if (currentInMore !== lastCurrentInMore) {
    setLastCurrentInMore(currentInMore)
    if (currentInMore) setMoreOpen(true)
  }
  const showMore = moreOpen
  const moreRef = useRef<HTMLButtonElement>(null)
  const toggleMore = () => {
    const next = !showMore
    setMoreOpen(next)
    try { localStorage.setItem(MORE_OPEN_KEY, String(next)) } catch { /* ignore */ }
    // Bring the newly shown options into view - on a laptop they would
    // otherwise open below the bottom of the menu and look like nothing happened.
    if (next) requestAnimationFrame(() => moreRef.current?.scrollIntoView({ block: "start", behavior: "smooth" }))
  }

  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (isAdmin && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); onNavigate("global-search") }
      if (event.key === "Escape" && mobileOpen) onMobileClose()
    }
    window.addEventListener("keydown", keydown)
    return () => window.removeEventListener("keydown", keydown)
  }, [isAdmin, mobileOpen, onMobileClose, onNavigate])

  const badgeFor = (key?: string) => { const count = key ? badges?.[key] ?? 0 : 0; return count > 0 ? (count > 99 ? "99+" : String(count)) : undefined }
  const moreHasBadge = sections.some(s => s.items.some(i => badgeFor(i.badgeKey)))
  const isActive = (item: NavItem) => current === item.key || Boolean(item.alsoActive?.includes(current))

  const renderItem = (item: NavItem, big: boolean) => {
    const Icon = item.icon
    const badge = badgeFor(item.badgeKey)
    const active = isActive(item)
    return (
      <button
        key={item.key} type="button" className={`snav-item${big ? " snav-item-main" : ""}${active ? " active" : ""}`}
        onClick={() => onNavigate(item.key)} aria-current={active ? "page" : undefined}
      >
        <Icon className="snav-icon" size={big ? 22 : 20} strokeWidth={2} aria-hidden="true" />
        <span className="snav-label">{item.label}</span>
        {badge && <span className="snav-badge" aria-label={`${badge} new`}>{badge}</span>}
      </button>
    )
  }

  const initials = user.displayName.trim().split(/\s+/).map(part => part[0]).join("").slice(0, 2).toUpperCase() || "PF"
  const roleLabel = isAdmin ? (user.isSystemDeveloper ? "System Developer" : user.isSuperAdmin ? "Super Admin" : "Team Member") : "Customer account"

  return (
    <aside className={`snav${mobileOpen ? " snav-open" : ""}`} aria-label="Main menu">
      <div className="snav-top">
        <div className="snav-brand">
          <img src="/logo.png" alt="" />
          <span><strong>Punjab Exotic Foods</strong><small>{isAdmin ? "Business Dashboard" : "Customer Portal"}</small></span>
        </div>
        <button className="snav-close" type="button" onClick={onMobileClose} aria-label="Close menu"><X size={24} strokeWidth={2} /></button>
      </div>

      {isAdmin && (
        <button className={`snav-search${current === "global-search" ? " active" : ""}`} type="button" onClick={() => onNavigate("global-search")}>
          <Search size={20} strokeWidth={2} aria-hidden="true" />
          <span>Search</span>
        </button>
      )}

      <nav className="snav-scroll" aria-label="Dashboard sections">
        {isAdmin ? (
          <>
            <div className="snav-list">{mainItems.map(item => renderItem(item, true))}</div>
            {sections.length > 0 && (
              <>
                <button ref={moreRef} type="button" className={`snav-more${showMore ? " open" : ""}`} onClick={toggleMore} aria-expanded={showMore}>
                  <span>{showMore ? "Fewer options" : "More options"}</span>
                  {moreHasBadge && !showMore && <span className="snav-dot" aria-label="New items inside" />}
                  <ChevronDown size={20} strokeWidth={2} aria-hidden="true" />
                </button>
                {showMore && sections.map(section => (
                  <div key={section.label} className="snav-section">
                    <p className="snav-heading">{section.label}</p>
                    <div className="snav-list">{section.items.map(item => renderItem(item, false))}</div>
                  </div>
                ))}
              </>
            )}
          </>
        ) : sections.map(section => (
          <div key={section.label} className="snav-section">
            <p className="snav-heading">{section.label}</p>
            <div className="snav-list">{section.items.map(item => renderItem(item, true))}</div>
          </div>
        ))}
      </nav>

      <div className="snav-foot">
        <div className="snav-user">
          <span className="snav-avatar" aria-hidden="true">{initials}</span>
          <span className="snav-user-text"><strong>{user.displayName}</strong><small>{roleLabel}</small></span>
        </div>
        <div className="snav-tools">
          {isAdmin && (
            <>
              <button type="button" className={`snav-tool${current === "settings" ? " active" : ""}`} onClick={() => onNavigate("settings")}>
                <Settings size={20} strokeWidth={2} aria-hidden="true" /><span>Settings</span>
              </button>
              <button type="button" className={`snav-tool${current === "complaints" ? " active" : ""}`} onClick={() => onNavigate("complaints")}>
                <CircleHelp size={20} strokeWidth={2} aria-hidden="true" /><span>Help</span>
              </button>
              {onDayEnd && (
                <button type="button" className="snav-tool" onClick={onDayEnd}>
                  <Moon size={20} strokeWidth={2} aria-hidden="true" /><span>End of Day</span>
                </button>
              )}
            </>
          )}
          <button type="button" className="snav-tool snav-signout" onClick={onLogout}>
            <LogOut size={20} strokeWidth={2} aria-hidden="true" /><span>Sign out</span>
          </button>
        </div>
      </div>
    </aside>
  )
}
