import { useState } from "react"
import type { AppNotification, User } from "../../types"
import { Bell, Menu, Search } from "lucide-react"
import { NotificationsPanel } from "./NotificationsPanel"

/* Plain-English page names, matching the words used in the menu. */
const PAGE_LABELS: Record<string, string> = {
  dashboard: "Home", products: "Products", orders: "Sales & Orders", customers: "Customers",
  tickets: "Customer Messages", stock: "Stock", payments: "Payments", stats: "Sales Reports",
  "delivery-areas": "Deliveries", enquiries: "Enquiries", complaints: "Help",
  "credit-control": "Credit Control", "payment-proofs": "Payment Proofs", "credit-notes": "Credit Notes",
  "customer-applications": "Customer Applications",
  "reminders-due-today": "Reminders", "reminders-14-day": "Reminders", "reminders-21-day": "Reminders",
  notifications: "Notifications",
  admins: "Users & Team", "data-extract": "Integration", files: "Documents", "email-imports": "Email Imports",
  session: "Buying Desk", "place-order": "Place an Order",
  "invoice-numbers": "Invoice Numbers", "day-trade": "Day Trades",
  "add-customer": "Add a Customer", "create-invoice": "Create an Invoice", invoices: "Invoices",
  outstanding: "21+ Days Overdue", "global-search": "Search", expenses: "Expenses",
  "day-check": "Day Check", "communication-history": "Sent Messages",
  suppliers: "Suppliers", "sales-users": "Sales Users",
  "assign-task": "Assign a Task", "sub-accounts": "Sub-Account Approvals", "whatsapp-send": "Send WhatsApp",
  settings: "Settings", documents: "My Documents", team: "My Team",
  "system-overview": "System Overview", "system-users": "System Users", "login-activity": "Login Activity",
  "audit-logs": "Audit Logs", "error-log": "Error Log", "test-mode": "Test Mode", "backup-recovery": "Backup & Recovery",
  "system-health": "Integrations & Health", security: "Security", "database-reset": "Database Reset",
}

export function Topbar({ current, onMenuOpen, notifications, onMarkNotificationRead, onMarkAllNotificationsRead, onOpenNotification, notifCount, onBellClick, onSearch }: {
  user: User; onLogout: () => void; current?: string
  onMenuOpen?: () => void
  notifications?: AppNotification[]
  onMarkNotificationRead?: (id: string) => void
  onMarkAllNotificationsRead?: () => void
  onOpenNotification?: (notification: AppNotification) => void
  /** Legacy simple unread-count bell, still used by the customer portal
      (which has no real notification feed, just order/ticket unseen counts). */
  notifCount?: number
  onBellClick?: () => void
  onSearch?: (term: string) => void
}) {
  const title = current ? (PAGE_LABELS[current] ?? current.charAt(0).toUpperCase() + current.slice(1).replace(/-/g, " ")) : "Home"
  const count = notifCount ?? 0
  const [searchTerm, setSearchTerm] = useState("")
  return (
    <header className="topbar">
      <button className="tb-hamburger" onClick={onMenuOpen} aria-label="Open menu">
        <Menu size={24} strokeWidth={2} />
        <span>Menu</span>
      </button>
      <h1 className="topbar-title">{title}</h1>
      {onSearch && (
        <form
          className="tb-search" role="search"
          onSubmit={event => { event.preventDefault(); if (searchTerm.trim()) onSearch(searchTerm.trim()) }}
        >
          <Search size={20} strokeWidth={2} aria-hidden="true" />
          <input
            value={searchTerm} onChange={event => setSearchTerm(event.target.value)}
            placeholder="Search for a customer or invoice" aria-label="Search for a customer or invoice"
          />
          <button type="submit" className="tb-search-go">Search</button>
        </form>
      )}
      <div className="topbar-actions">
        {notifications && onMarkNotificationRead && onMarkAllNotificationsRead && onOpenNotification ? (
          <NotificationsPanel notifications={notifications} onMarkRead={onMarkNotificationRead} onMarkAllRead={onMarkAllNotificationsRead} onOpen={onOpenNotification} />
        ) : onBellClick ? (
          <button className="tb-icon-btn" onClick={onBellClick} aria-label={count > 0 ? `${count} new notification${count !== 1 ? "s" : ""}` : "No new notifications"}>
            <Bell size={22} strokeWidth={2} />
            {count > 0 && <span className="tb-bell-count">{count > 9 ? "9+" : count}</span>}
          </button>
        ) : null}
      </div>
    </header>
  )
}
