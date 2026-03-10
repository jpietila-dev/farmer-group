import { useState } from "react";

const BUSINESS_UNITS = [
  { id: "all", label: "All", short: "ALL" },
  { id: "major", label: "Major Projects", short: "MP" },
  { id: "capital", label: "Capital Improvements", short: "CI" },
  { id: "facility", label: "Facility Maintenance", short: "FM" },
  { id: "lawn", label: "Lawn", short: "LN" },
  { id: "snow", label: "Snow", short: "SN" },
];

const NAV_ITEMS = {
  all: [
    { id: "dashboard", label: "Dashboard", icon: "▦" },
    { id: "calendar", label: "Calendar", icon: "▦" },
    { id: "jobs", label: "Active Jobs", icon: "▦" },
    { id: "pipeline", label: "Pipeline", icon: "▦" },
    { id: "budgeting", label: "Budgeting", icon: "▦" },
    { id: "team", label: "Team", icon: "▦" },
    { id: "customers", label: "Customers", icon: "▦" },
  ],
  major: [
    { id: "dashboard", label: "Dashboard", icon: "⊞" },
    { id: "calendar", label: "Calendar", icon: "📅" },
    { id: "jobs", label: "Active Jobs", icon: "🔨" },
    { id: "pipeline", label: "Pipeline", icon: "◈" },
    { id: "budgeting", label: "Budgeting", icon: "💲" },
    { id: "team", label: "Team", icon: "👥" },
    { id: "customers", label: "Customers", icon: "🤝" },
  ],
  capital: [
    { id: "dashboard", label: "Dashboard", icon: "⊞" },
    { id: "calendar", label: "Calendar", icon: "📅" },
    { id: "jobs", label: "Active Jobs", icon: "🔨" },
    { id: "pipeline", label: "Pipeline", icon: "◈" },
    { id: "budgeting", label: "Budgeting", icon: "💲" },
    { id: "team", label: "Team", icon: "👥" },
    { id: "customers", label: "Customers", icon: "🤝" },
  ],
  facility: [
    { id: "dashboard", label: "Dashboard", icon: "⊞" },
    { id: "calendar", label: "Calendar", icon: "📅" },
    { id: "jobs", label: "Active Jobs", icon: "🔨" },
    { id: "bids", label: "Bids", icon: "📋" },
    { id: "pipeline", label: "Pipeline", icon: "◈" },
    { id: "budgeting", label: "Budgeting", icon: "💲" },
    { id: "team", label: "Team", icon: "👥" },
    { id: "customers", label: "Customers", icon: "🤝" },
  ],
  lawn: [
    { id: "dashboard", label: "Dashboard", icon: "⊞" },
    { id: "calendar", label: "Calendar", icon: "📅" },
    { id: "sites", label: "Active Sites", icon: "📍" },
    { id: "budgeting", label: "Budgeting", icon: "💲" },
    { id: "team", label: "Team", icon: "👥" },
    { id: "customers", label: "Customers", icon: "🤝" },
  ],
  snow: [
    { id: "dashboard", label: "Dashboard", icon: "⊞" },
    { id: "calendar", label: "Calendar", icon: "📅" },
    { id: "sites", label: "Active Sites", icon: "📍" },
    { id: "budgeting", label: "Budgeting", icon: "💲" },
    { id: "team", label: "Team", icon: "👥" },
    { id: "customers", label: "Customers", icon: "🤝" },
  ],
};

const BU_COLORS = {
  all:      { accent: "#3B6FE8", light: "#3B6FE820" },
  major:    { accent: "#3B6FE8", light: "#3B6FE820" },
  capital:  { accent: "#5B8FF0", light: "#5B8FF020" },
  facility: { accent: "#7BA7F5", light: "#7BA7F520" },
  lawn:     { accent: "#4CAF82", light: "#4CAF8220" },
  snow:     { accent: "#A8C4F8", light: "#A8C4F820" },
};

const SAMPLE_STATS = {
  major:    { jobs: 3, pipeline: "$1.2M", budget: "$980K", label: "Major Projects" },
  capital:  { jobs: 2, pipeline: "$540K", budget: "$410K", label: "Capital Improvements" },
  facility: { jobs: 7, pipeline: "$88K",  budget: "$72K",  label: "Facility Maintenance" },
  lawn:     { jobs: 14, pipeline: "$32K", budget: "$28K",  label: "Lawn" },
  snow:     { jobs: 9,  pipeline: "$65K", budget: "$58K",  label: "Snow" },
};

const PUNCH_LIST = [
  { id: 1, text: "Follow up with Riverside project bid", bu: "major", priority: "high" },
  { id: 2, text: "Schedule crew for Elm St. maintenance", bu: "facility", priority: "medium" },
  { id: 3, text: "Review Q1 lawn budget variance", bu: "lawn", priority: "medium" },
  { id: 4, text: "Confirm snow routes for weekend", bu: "snow", priority: "high" },
  { id: 5, text: "Capital improvement proposal due Friday", bu: "capital", priority: "high" },
];

const dayName = () => new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

export default function App() {
  const [activeBU, setActiveBU] = useState("all");
  const [activeNav, setActiveNav] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const navItems = NAV_ITEMS[activeBU] || NAV_ITEMS.all;
  const buColor = BU_COLORS[activeBU];

  const handleBUChange = (id) => {
    setActiveBU(id);
    setActiveNav("dashboard");
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0F1117", color: "#E8ECF4", fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0F1117; }
        ::-webkit-scrollbar-thumb { background: #2A2F3E; border-radius: 2px; }
        .nav-item { display: flex; align-items: center; gap: 10px; padding: 9px 16px; border-radius: 6px; cursor: pointer; font-size: 13px; color: #6B7694; transition: all 0.15s; border: none; background: none; width: 100%; text-align: left; font-family: inherit; letter-spacing: 0.01em; }
        .nav-item:hover { background: #161B28; color: #B8C4E0; }
        .nav-item.active { background: #1A2340; color: #FFFFFF; font-weight: 500; }
        .bu-tab { padding: 5px 14px; border-radius: 4px; font-size: 11px; font-weight: 600; letter-spacing: 0.08em; cursor: pointer; border: 1px solid transparent; transition: all 0.15s; font-family: inherit; background: none; color: #4A5270; }
        .bu-tab:hover { color: #8892B0; }
        .bu-tab.active { background: #1A2340; color: #FFFFFF; border-color: #2A3560; }
        .stat-card { background: #161B28; border: 1px solid #1E2640; border-radius: 10px; padding: 20px 22px; transition: border-color 0.2s; }
        .stat-card:hover { border-color: #2A3560; }
        .punch-item { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: #161B28; border: 1px solid #1E2640; border-radius: 8px; transition: all 0.15s; }
        .punch-item:hover { border-color: #2A3560; }
        .priority-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
        .coming-soon { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 300px; color: #2A3560; gap: 12px; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.2s ease both; }
      `}</style>

      {/* Sidebar */}
      <div style={{ width: sidebarCollapsed ? 60 : 200, background: "#0B0E18", borderRight: "1px solid #161B28", display: "flex", flexDirection: "column", transition: "width 0.2s", flexShrink: 0, position: "sticky", top: 0, height: "100vh", overflow: "hidden" }}>
        
        {/* Logo */}
        <div style={{ padding: "18px 16px 14px", borderBottom: "1px solid #161B28", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, background: "#3B6FE8", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0 }}>FG</div>
          {!sidebarCollapsed && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#FFFFFF", letterSpacing: "0.04em" }}>FARMER</div>
              <div style={{ fontSize: 10, color: "#3B6FE8", letterSpacing: "0.1em", fontWeight: 500 }}>GROUP</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <div style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
          {navItems.map(item => (
            <button
              key={item.id}
              className={`nav-item ${activeNav === item.id ? "active" : ""}`}
              onClick={() => setActiveNav(item.id)}
              style={ activeNav === item.id ? { borderLeft: `3px solid ${buColor.accent}`, paddingLeft: 13 } : { borderLeft: "3px solid transparent" }}
            >
              <span style={{ fontSize: 14, flexShrink: 0 }}>{item.icon}</span>
              {!sidebarCollapsed && <span style={{ textTransform: "uppercase", fontSize: 11, letterSpacing: "0.07em" }}>{item.label}</span>}
            </button>
          ))}
        </div>

        {/* Collapse toggle */}
        <div style={{ padding: "12px 8px", borderTop: "1px solid #161B28" }}>
          <button className="nav-item" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} style={{ justifyContent: "center" }}>
            <span style={{ fontSize: 14 }}>{sidebarCollapsed ? "→" : "←"}</span>
            {!sidebarCollapsed && <span style={{ textTransform: "uppercase", fontSize: 11, letterSpacing: "0.07em" }}>Collapse</span>}
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

        {/* Top bar */}
        <div style={{ borderBottom: "1px solid #161B28", padding: "0 28px", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between", background: "#0B0E18", position: "sticky", top: 0, zIndex: 40 }}>
          {/* BU Tabs */}
          <div style={{ display: "flex", gap: 4 }}>
            {BUSINESS_UNITS.map(bu => (
              <button key={bu.id} className={`bu-tab ${activeBU === bu.id ? "active" : ""}`} onClick={() => handleBUChange(bu.id)}>
                {bu.short}
              </button>
            ))}
          </div>
          {/* Current BU label */}
          <div style={{ fontSize: 11, color: "#2A3560", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            {BUSINESS_UNITS.find(b => b.id === activeBU)?.label}
          </div>
          {/* Owner badge */}
          <div style={{ background: "#1A2340", border: "1px solid #3B6FE8", color: "#3B6FE8", fontSize: 11, fontWeight: 600, padding: "4px 14px", borderRadius: 4, letterSpacing: "0.08em" }}>OWNER</div>
        </div>

        {/* Page content */}
        <div style={{ flex: 1, padding: "28px 32px", overflowY: "auto" }}>

          {/* DASHBOARD */}
          {activeNav === "dashboard" && (
            <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 28 }}>
              {/* Greeting */}
              <div>
                <div style={{ fontSize: 28, fontWeight: 700, color: "#FFFFFF", letterSpacing: "-0.02em" }}>
                  GOOD MORNING, FARMER GROUP
                </div>
                <div style={{ fontSize: 12, color: "#3A4560", marginTop: 4, letterSpacing: "0.06em" }}>{dayName().toUpperCase()}</div>
              </div>

              {/* Stats row */}
              {activeBU === "all" ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
                  {Object.entries(SAMPLE_STATS).map(([key, s]) => (
                    <div key={key} className="stat-card" style={{ cursor: "pointer" }} onClick={() => handleBUChange(key)}>
                      <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: BU_COLORS[key].accent, marginBottom: 10, fontWeight: 600 }}>{s.label}</div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: "#FFFFFF", marginBottom: 4 }}>{s.pipeline}</div>
                      <div style={{ fontSize: 11, color: "#3A4560" }}>Pipeline</div>
                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #1E2640", display: "flex", justifyContent: "space-between" }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: "#B8C4E0" }}>{s.jobs}</div>
                          <div style={{ fontSize: 10, color: "#3A4560" }}>Active Jobs</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: "#B8C4E0" }}>{s.budget}</div>
                          <div style={{ fontSize: 10, color: "#3A4560" }}>Budget</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                  {[
                    { label: "Pipeline Value", value: SAMPLE_STATS[activeBU]?.pipeline, sub: "Active opportunities" },
                    { label: "Active Jobs", value: SAMPLE_STATS[activeBU]?.jobs, sub: "In progress" },
                    { label: "Budget", value: SAMPLE_STATS[activeBU]?.budget, sub: "This period" },
                  ].map(s => (
                    <div key={s.label} className="stat-card" style={{ position: "relative", overflow: "hidden" }}>
                      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: buColor.accent }} />
                      <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#3A4560", marginBottom: 10 }}>{s.label}</div>
                      <div style={{ fontSize: 28, fontWeight: 700, color: buColor.accent }}>{s.value}</div>
                      <div style={{ fontSize: 11, color: "#3A4560", marginTop: 5 }}>{s.sub}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Punch list */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "#3A4560", fontWeight: 600 }}>Today's Punch List</div>
                  <div style={{ fontSize: 11, color: "#3A4560" }}>{new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {PUNCH_LIST.filter(p => activeBU === "all" || p.bu === activeBU).map(item => (
                    <div key={item.id} className="punch-item">
                      <div className="priority-dot" style={{ background: item.priority === "high" ? "#F87171" : "#FCD34D" }} />
                      <span style={{ fontSize: 13, color: "#B8C4E0", flex: 1 }}>{item.text}</span>
                      <span style={{ fontSize: 10, color: "#3A4560", background: "#1E2640", padding: "2px 8px", borderRadius: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        {BUSINESS_UNITS.find(b => b.id === item.bu)?.short}
                      </span>
                    </div>
                  ))}
                  {PUNCH_LIST.filter(p => activeBU === "all" || p.bu === activeBU).length === 0 && (
                    <div style={{ textAlign: "center", padding: "24px", color: "#2A3560", fontSize: 12 }}>No reminders scheduled for today.</div>
                  )}
                </div>
              </div>

              {/* Quick links */}
              {activeBU !== "all" && (
                <div>
                  <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "#3A4560", fontWeight: 600, marginBottom: 14 }}>Quick Access</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                    {navItems.filter(n => n.id !== "dashboard").map(item => (
                      <button key={item.id} onClick={() => setActiveNav(item.id)} style={{ background: "#161B28", border: "1px solid #1E2640", borderRadius: 8, padding: "16px", cursor: "pointer", textAlign: "left", transition: "all 0.15s", fontFamily: "inherit" }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = buColor.accent; e.currentTarget.style.background = buColor.light; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = "#1E2640"; e.currentTarget.style.background = "#161B28"; }}>
                        <div style={{ fontSize: 18, marginBottom: 8 }}>{item.icon}</div>
                        <div style={{ fontSize: 11, color: "#B8C4E0", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 500 }}>{item.label}</div>
                        <div style={{ fontSize: 10, color: "#3A4560", marginTop: 3 }}>→ View</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ALL OTHER SECTIONS — Coming Soon shells */}
          {activeNav !== "dashboard" && (
            <div className="fade-in">
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#FFFFFF", letterSpacing: "-0.01em", textTransform: "uppercase" }}>
                  {navItems.find(n => n.id === activeNav)?.label}
                </div>
                <div style={{ fontSize: 11, color: "#3A4560", marginTop: 4, letterSpacing: "0.06em" }}>
                  {BUSINESS_UNITS.find(b => b.id === activeBU)?.label.toUpperCase()} · {dayName().toUpperCase()}
                </div>
              </div>
              <div className="coming-soon">
                <div style={{ width: 48, height: 48, borderRadius: 12, background: buColor.light, border: `1px solid ${buColor.accent}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
                  {navItems.find(n => n.id === activeNav)?.icon}
                </div>
                <div style={{ fontSize: 14, color: "#3A4560", fontWeight: 500 }}>
                  {navItems.find(n => n.id === activeNav)?.label} — Coming Soon
                </div>
                <div style={{ fontSize: 12, color: "#2A3050" }}>This section is ready to be built out</div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
