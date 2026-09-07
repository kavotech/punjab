/** System-Developer-only boot screen - shown for a fixed 10 seconds on cold
    page load, a reload, or right after signing in (see App.tsx's devBootUntil
    timer). Every other role keeps the plain, fast "Preparing your workspace"
    screen with no artificial delay. */
export function SystemDeveloperBootScreen({ name }: { name: string }) {
  return (
    <div className="devboot">
      <div className="devboot-glow devboot-glow-a" />
      <div className="devboot-glow devboot-glow-b" />
      <div className="devboot-content">
        <div className="devboot-logo-ring">
          <div className="devboot-logo-pulse" />
          <img src="/logo.png" alt="" className="devboot-logo" />
        </div>
        <p className="devboot-eyebrow">System Developer Access</p>
        <h1 className="devboot-welcome">Welcome, {name}</h1>
        <p className="devboot-sub">Preparing your workspace and checking system status&hellip;</p>
        <div className="devboot-dots">
          <span /><span /><span />
        </div>
        <div className="devboot-bar-track">
          <div className="devboot-bar-fill" />
        </div>
      </div>
    </div>
  )
}
