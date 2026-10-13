import { useMemo } from 'react'
import { CalendarClock, FileText, FolderOpen, Inbox, PoundSterling, Search, UserPlus, UsersRound, type LucideIcon } from 'lucide-react'
import type { Customer, Invoice, Payment, User } from '../../types'
import { invoiceOutstanding } from '../../lib/creditNotes'
import { can } from '../../lib/permissions'
import { greetingNameFor } from '../../lib/greetingName'
import { displayDate } from '../../lib/displayDate'

const DAY = 86_400_000
const money = (n: number) => `£${n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const daysSince = (iso: string, today: string) => Math.round((new Date(`${today}T00:00:00`).getTime() - new Date(`${iso}T00:00:00`).getTime()) / DAY)

const invoiceCount = (n: number) => `${n} invoice${n === 1 ? '' : 's'}`

/** "2 invoices at 14 days and 1 invoice at 21 days are ready for a reminder." */
function remindersText(day14: number, day21: number) {
  const parts = [day14 && `${invoiceCount(day14)} at 14 days`, day21 && `${invoiceCount(day21)} at 21 days`].filter(Boolean)
  return `${parts.join(' and ')} ${day14 + day21 === 1 ? 'is' : 'are'} ready for a reminder.`
}

function greeting() {
  const hour = new Date().getHours()
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
}

type Task = {
  key: string; icon: LucideIcon; title: string; count: number; amount?: number
  text: string; doneText: string; action: string; page: string; urgent?: boolean
}

/** The default Home view: what needs doing today, in plain words, with one
    big button each - designed to be read at a glance and used without any
    training. Everything here comes from data the dashboard already loads. */
export function TodayView({ user, customers, invoices, payments, emailImportsToCheck, onNavigate }: {
  user: User
  customers: Customer[]
  invoices: Invoice[]
  payments: Payment[]
  emailImportsToCheck: number
  onNavigate?: (page: string) => void
}) {
  const today = new Date().toISOString().slice(0, 10)
  const month = today.slice(0, 7)
  const customerName = useMemo(() => {
    const byId = new Map(customers.map(c => [c.id, c.companyName]))
    return (id: string) => byId.get(id) ?? 'Unknown customer'
  }, [customers])

  const figures = useMemo(() => {
    const unpaid = invoices.filter(i => invoiceOutstanding(i) > 0 && i.date)
    const day14 = unpaid.filter(i => daysSince(i.date!, today) === 14).length
    const day21 = unpaid.filter(i => daysSince(i.date!, today) === 21).length
    const over21 = unpaid.filter(i => daysSince(i.date!, today) > 21)
    const weekAgo = new Date(Date.now() - 7 * DAY).toISOString().slice(0, 10)
    const weekPayments = payments.filter(p => p.date >= weekAgo)
    return {
      day14, day21,
      over21Count: over21.length,
      over21Total: over21.reduce((sum, i) => sum + invoiceOutstanding(i), 0),
      weekPaymentsCount: weekPayments.length,
      weekPaymentsTotal: weekPayments.reduce((sum, p) => sum + p.amount, 0),
      owed: invoices.reduce((sum, i) => sum + invoiceOutstanding(i), 0),
      receivedThisMonth: payments.filter(p => p.date.startsWith(month)).reduce((sum, p) => sum + p.amount, 0),
      invoicedThisMonth: invoices.filter(i => (i.date ?? '').startsWith(month)).reduce((sum, i) => sum + Math.max(0, i.amount), 0),
    }
  }, [invoices, payments, today, month])

  const tasks: Task[] = []
  if (can(user, 'invoicesSendReminders')) tasks.push({
    key: 'reminders', icon: CalendarClock, title: 'Reminders due today', count: figures.day14 + figures.day21,
    text: remindersText(figures.day14, figures.day21),
    doneText: 'No reminders are due today.', action: 'Send reminders', page: 'reminders-due-today', urgent: figures.day14 + figures.day21 > 0,
  })
  if (can(user, 'invoicesView')) tasks.push({
    key: 'overdue', icon: FileText, title: 'Unpaid for over 21 days', count: figures.over21Count, amount: figures.over21Total,
    text: `${money(figures.over21Total)} is still owed on these invoices.`,
    doneText: 'No invoices are more than 21 days unpaid.', action: 'See these invoices', page: 'outstanding', urgent: figures.over21Count > 0,
  })
  if (can(user, 'emailImportsView')) tasks.push({
    key: 'imports', icon: Inbox, title: 'Email imports to check', count: emailImportsToCheck,
    text: 'Documents that arrived by email need a quick look.',
    doneText: 'Every emailed document has been handled.', action: 'Check email imports', page: 'email-imports', urgent: emailImportsToCheck > 0,
  })
  if (can(user, 'payments')) tasks.push({
    key: 'payments', icon: PoundSterling, title: 'Payments this week', count: figures.weekPaymentsCount, amount: figures.weekPaymentsTotal,
    text: `${money(figures.weekPaymentsTotal)} received in the last 7 days.`,
    doneText: 'No payments recorded in the last 7 days.', action: 'See payments', page: 'payments',
  })

  const actions: Array<{ label: string; icon: LucideIcon; page: string; show: boolean }> = [
    { label: 'Find a customer', icon: UsersRound, page: 'customers', show: can(user, 'customers') },
    { label: 'Add a customer', icon: UserPlus, page: 'add-customer', show: can(user, 'customersCreate') },
    { label: 'All invoices', icon: FileText, page: 'invoices', show: can(user, 'invoicesView') },
    { label: 'Documents', icon: FolderOpen, page: 'files', show: can(user, 'filesView') },
    { label: 'Search everything', icon: Search, page: 'global-search', show: true },
  ]

  const latestPayments = useMemo(() => [...payments].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5), [payments])
  const latestInvoices = useMemo(() => [...invoices].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '')).slice(0, 5), [invoices])
  const invoiceState = (i: Invoice) => invoiceOutstanding(i) <= 0 ? { label: 'Paid', tone: 'ok' } : i.dueDate && i.dueDate < today ? { label: 'Overdue', tone: 'bad' } : { label: 'Unpaid', tone: 'warn' }

  return (
    <div className="today">
      <section className="today-hello">
        <h2>{greeting()}, {greetingNameFor(user)}</h2>
        <p>{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}. Here is what needs your attention.</p>
      </section>

      {tasks.length > 0 && (
        <section aria-labelledby="today-tasks-title">
          <h3 className="today-title" id="today-tasks-title">Things to do</h3>
          <div className="today-tasks">
            {tasks.map(task => {
              const Icon = task.icon
              const done = task.count === 0
              return (
                <article key={task.key} className={`task-card${task.urgent ? ' urgent' : ''}${done ? ' done' : ''}`}>
                  <div className="task-card-top">
                    <span className="task-card-icon"><Icon size={26} strokeWidth={2} aria-hidden="true" /></span>
                    <h4 className="task-card-title">{task.title}</h4>
                  </div>
                  <p className="task-card-number">{done ? 'All done' : task.count}</p>
                  <p className="task-card-text">{done ? task.doneText : task.text}</p>
                  <button type="button" className={`btn ${task.urgent ? 'btn-primary' : 'btn-secondary'}`} onClick={() => onNavigate?.(task.page)}>
                    {task.action}
                  </button>
                </article>
              )
            })}
          </div>
        </section>
      )}

      {(can(user, 'invoicesView') || can(user, 'payments')) && (
        <section aria-labelledby="today-money-title">
          <h3 className="today-title" id="today-money-title">Money at a glance</h3>
          <div className="today-money">
            {can(user, 'invoicesView') && (
              <div className="money-tile owed"><p className="money-label">Customers owe you</p><p className="money-value">{money(figures.owed)}</p></div>
            )}
            {can(user, 'payments') && (
              <div className="money-tile"><p className="money-label">Received this month</p><p className="money-value">{money(figures.receivedThisMonth)}</p></div>
            )}
            {can(user, 'invoicesView') && (
              <div className="money-tile"><p className="money-label">Invoiced this month</p><p className="money-value">{money(figures.invoicedThisMonth)}</p></div>
            )}
          </div>
        </section>
      )}

      <section aria-labelledby="today-actions-title">
        <h3 className="today-title" id="today-actions-title">Quick links</h3>
        <div className="today-actions">
          {actions.filter(a => a.show).map(a => {
            const Icon = a.icon
            return (
              <button key={a.page} type="button" className="today-action" onClick={() => onNavigate?.(a.page)}>
                <Icon size={26} strokeWidth={2} aria-hidden="true" />
                <span>{a.label}</span>
              </button>
            )
          })}
        </div>
      </section>

      <div className="today-lists">
        {can(user, 'payments') && (
          <section className="today-list" aria-labelledby="today-pay-title">
            <div className="today-list-head">
              <h3 className="today-title" id="today-pay-title">Latest payments</h3>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => onNavigate?.('payments')}>See all</button>
            </div>
            {latestPayments.length === 0 ? <p className="today-empty">No payments recorded yet.</p> : latestPayments.map(p => (
              <div key={p.id} className="today-row">
                <div><strong>{customerName(p.customerId)}</strong><small>{displayDate(p.date)}{p.method ? ` · ${p.method}` : ''}</small></div>
                <span className="today-amount positive">{money(p.amount)}</span>
              </div>
            ))}
          </section>
        )}
        {can(user, 'invoicesView') && (
          <section className="today-list" aria-labelledby="today-inv-title">
            <div className="today-list-head">
              <h3 className="today-title" id="today-inv-title">Latest invoices</h3>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => onNavigate?.('invoices')}>See all</button>
            </div>
            {latestInvoices.length === 0 ? <p className="today-empty">No invoices yet.</p> : latestInvoices.map(i => {
              const state = invoiceState(i)
              return (
                <div key={i.id} className="today-row">
                  <div><strong>{customerName(i.customerId)}</strong><small>Invoice {i.invoiceNumber} · {displayDate(i.date ?? '')}</small></div>
                  <div className="today-row-right">
                    <span className="today-amount">{money(i.amount)}</span>
                    <span className={`today-pill ${state.tone}`}>{state.label}</span>
                  </div>
                </div>
              )
            })}
          </section>
        )}
      </div>
    </div>
  )
}
