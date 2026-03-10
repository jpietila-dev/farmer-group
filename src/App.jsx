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
    { id: "dashboard", label: "Dashboard", icon: "⊞" },
    { id: "pipeline", label: "Pipeline", icon: "◈" },
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

const PIPELINE_STAGES = {
  all:      ["Lead", "Initial Meeting", "Proposal / Bid", "Negotiation", "Won", "Lost"],
major:    ["Budgeting", "Lead", "Proposal / Bid", "Negotiation", "Won", "Lost"],
  capital:  ["Lead", "Initial Meeting", "Proposal / Bid", "Negotiation", "Won", "Lost"],
  facility: ["Lead", "Bid Submitted", "Negotiation", "Won", "Lost"],
  lawn:     ["Lead", "Proposal / Bid", "Negotiation", "Won", "Lost"],
  snow:     ["Lead", "Proposal / Bid", "Negotiation", "Won", "Lost"],
};

const STAGE_COLORS = {
  "Lead":            { color: "#60A5FA", bg: "#60A5FA15" },
  "Initial Meeting": { color: "#A78BFA", bg: "#A78BFA15" },
  "Proposal / Bid":  { color: "#FCD34D", bg: "#FCD34D15" },
  "Bid Submitted":   { color: "#FCD34D", bg: "#FCD34D15" },
  "Negotiation":     { color: "#F97316", bg: "#F9731615" },
  "Won":             { color: "#4ADE80", bg: "#4ADE8015" },
  "Lost":            { color: "#F87171", bg: "#F8717115" },
};

const STATUS_CONFIG = {
  "On Schedule":     { color: "#4ADE80", bg: "#4ADE8015" },
  "Behind Schedule": { color: "#F97316", bg: "#F9731615" },
  "At Risk":         { color: "#F87171", bg: "#F8717115" },
};

const BU_COLORS = {
  all:      { accent: "#3B6FE8", light: "#3B6FE815" },
  major:    { accent: "#3B6FE8", light: "#3B6FE815" },
  capital:  { accent: "#5B8FF0", light: "#5B8FF015" },
  facility: { accent: "#7BA7F5", light: "#7BA7F515" },
  lawn:     { accent: "#4CAF82", light: "#4CAF8215" },
  snow:     { accent: "#A8C4F8", light: "#A8C4F815" },
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

const SAMPLE_JOBS = [
  { id: 1, name: "Riverside Community Center", client: "Riverside City", contractValue: 450000, startDate: "2026-02-01", endDate: "2026-06-30", pm: "John Smith", pct: 35, status: "On Schedule", notes: "Foundation complete, framing in progress", bu: "major" },
  { id: 2, name: "Elmwood School Renovation", client: "Elmwood School District", contractValue: 280000, startDate: "2026-03-15", endDate: "2026-08-15", pm: "Sarah Lee", pct: 10, status: "On Schedule", notes: "Permits approved, mobilizing crew", bu: "major" },
  { id: 3, name: "Harbor View Expansion", client: "Harbor View LLC", contractValue: 620000, startDate: "2026-01-10", endDate: "2026-09-30", pm: "Mike Torres", pct: 52, status: "Behind Schedule", notes: "Weather delays in January set us back 2 weeks", bu: "major" },
];

const SAMPLE_PIPELINE = [
  { id: 1, name: "Riverside Community Center", contact: "mike@riverside.com", value: 450000, stage: "Negotiation", closeDate: "2026-04-15", notes: "Final contract review", bu: "major" },
  { id: 2, name: "Elmwood School Renovation", contact: "sara@elmwood.edu", value: 280000, stage: "Proposal / Bid", closeDate: "2026-03-28", notes: "Submitted last Tuesday", bu: "major" },
  { id: 3, name: "Oak Street Parking Lot", contact: "tom@cityworks.gov", value: 95000, stage: "Lead", closeDate: "2026-05-01", notes: "Initial inquiry", bu: "capital" },
  { id: 4, name: "Westfield HVAC Upgrade", contact: "jen@westfield.com", value: 180000, stage: "Initial Meeting", closeDate: "2026-04-10", notes: "Site visit scheduled", bu: "capital" },
  { id: 5, name: "Harbor View Maintenance Contract", contact: "bob@harborview.com", value: 42000, stage: "Bid Submitted", closeDate: "2026-03-20", notes: "Competitive bid", bu: "facility" },
  { id: 6, name: "Downtown Plaza Upkeep", contact: "lisa@downtown.org", value: 28000, stage: "Lead", closeDate: "2026-04-30", notes: "Referral from existing client", bu: "facility" },
];

const fmt = (v) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v || 0);
const dayName = () => new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function getGanttMonths(jobs) {
  if (!jobs.length) {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }
  const starts = jobs.map(j => new Date(j.startDate));
  const ends = jobs.map(j => new Date(j.endDate));
  let minDate = new Date(Math.min(...starts));
  let maxDate = new Date(Math.max(...ends));
  minDate = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  maxDate = new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 1);
  const months = [];
  let cur = new Date(minDate);
  while (cur < maxDate) {
    months.push({ year: cur.getFullYear(), month: cur.getMonth() });
    cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
  }
  return months;
}

function getBarStyle(job, months) {
  if (!months.length) return { left: "0%", width: "0%" };
  const totalStart = new Date(months[0].year, months[0].month, 1);
  const totalEnd = new Date(months[months.length - 1].year, months[months.length - 1].month + 1, 1);
  const totalMs = totalEnd - totalStart;
  const jobStart = new Date(job.startDate);
  const jobEnd = new Date(job.endDate);
  const left = Math.max(0, (jobStart - totalStart) / totalMs) * 100;
  const right = Math.min(1, (jobEnd - totalStart) / totalMs) * 100;
  const width = Math.max(0.5, right - left);
  return { left: `${left}%`, width: `${width}%` };
}

const EMPTY_JOB = { name: "", client: "", contractValue: "", startDate: "", endDate: "", pm: "", pct: 0, status: "On Schedule", notes: "", bu: "major" };

export default function App() {
  const [activeBU, setActiveBU] = useState("all");
  const [activeNav, setActiveNav] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [pipeline, setPipeline] = useState(SAMPLE_PIPELINE);
  const [jobs, setJobs] = useState(SAMPLE_JOBS);
  const [showJobForm, setShowJobForm] = useState(false);
  const [editJobId, setEditJobId] = useState(null);
  const [jobForm, setJobForm] = useState(EMPTY_JOB);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: "", contact: "", value: "", stage: "Lead", closeDate: "", notes: "", bu: "major" });
  const [pipelineView, setPipelineView] = useState("kanban");
  const [filterBU, setFilterBU] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedOpp, setSelectedOpp] = useState(null);

  const navItems = NAV_ITEMS[activeBU] || NAV_ITEMS.all;
  const buColor = BU_COLORS[activeBU];
  const handleBUChange = (id) => { setActiveBU(id); setActiveNav("dashboard"); };

  const majorJobs = jobs.filter(j => j.bu === "major");
  const ganttMonths = getGanttMonths(majorJobs);
  const today = new Date();
  const totalGanttStart = ganttMonths.length ? new Date(ganttMonths[0].year, ganttMonths[0].month, 1) : today;
  const totalGanttEnd = ganttMonths.length ? new Date(ganttMonths[ganttMonths.length-1].year, ganttMonths[ganttMonths.length-1].month + 1, 1) : today;
  const totalGanttMs = totalGanttEnd - totalGanttStart;
  const todayPct = totalGanttMs > 0 ? Math.max(0, Math.min(100, ((today - totalGanttStart) / totalGanttMs) * 100)) : 0;

  const openAddJob = () => { setEditJobId(null); setJobForm({ ...EMPTY_JOB, bu: activeBU === "all" ? "major" : activeBU }); setShowJobForm(true); };
  const openEditJob = (j) => { setEditJobId(j.id); setJobForm({ ...j, contractValue: String(j.contractValue) }); setShowJobForm(true); };
  const saveJob = () => {
    if (!jobForm.name.trim()) return;
    const entry = { ...jobForm, contractValue: Number(jobForm.contractValue), pct: Number(jobForm.pct) };
    if (editJobId !== null) setJobs(jobs.map(j => j.id === editJobId ? { ...entry, id: editJobId } : j));
    else setJobs([...jobs, { ...entry, id: Date.now() }]);
    setShowJobForm(false);
  };
  const deleteJob = (id) => { setJobs(jobs.filter(j => j.id !== id)); setSelectedJob(null); };

  const openAdd = () => { setEditId(null); setForm({ name: "", contact: "", value: "", stage: PIPELINE_STAGES[activeBU === "all" ? "major" : activeBU]?.[0] || "Lead", closeDate: "", notes: "", bu: activeBU === "all" ? "major" : activeBU }); setShowForm(true); };
  const openEdit = (o) => { setEditId(o.id); setForm({ ...o, value: String(o.value) }); setShowForm(true); };
  const saveOpp = () => {
    if (!form.name.trim() || !form.value) return;
    const entry = { ...form, value: Number(form.value) };
    if (editId !== null) setPipeline(pipeline.map(o => o.id === editId ? { ...entry, id: editId } : o));
    else setPipeline([...pipeline, { ...entry, id: Date.now() }]);
    setShowForm(false);
  };
  const deleteOpp = (id) => { setPipeline(pipeline.filter(o => o.id !== id)); setSelectedOpp(null); };
  const moveStage = (id, dir) => {
    setPipeline(pipeline.map(o => {
      if (o.id !== id) return o;
      const stages = PIPELINE_STAGES[o.bu] || PIPELINE_STAGES.all;
      const idx = stages.indexOf(o.stage);
      return { ...o, stage: stages[Math.max(0, Math.min(stages.length - 1, idx + dir))] };
    }));
  };

  const fj = (k) => (e) => setJobForm({ ...jobForm, [k]: e.target.value });
  const fp = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const visiblePipeline = pipeline.filter(o => {
    const buMatch = activeBU === "all" ? (filterBU === "all" || o.bu === filterBU) : o.bu === activeBU;
    return buMatch && (o.name.toLowerCase().includes(search.toLowerCase()) || (o.contact || "").toLowerCase().includes(search.toLowerCase()));
  });
  const stages = PIPELINE_STAGES[activeBU === "all" ? (filterBU === "all" ? "all" : filterBU) : activeBU];
  const totalPipeline = visiblePipeline.filter(o => !["Won","Lost"].includes(o.stage)).reduce((s, o) => s + o.value, 0);
  const totalWon = visiblePipeline.filter(o => o.stage === "Won").reduce((s, o) => s + o.value, 0);
  const winRate = (() => { const closed = visiblePipeline.filter(o => ["Won","Lost"].includes(o.stage)); return closed.length ? Math.round((visiblePipeline.filter(o => o.stage === "Won").length / closed.length) * 100) : 0; })();

  const GanttSection = ({ jobList, showAddBtn = false }) => {
    const months = getGanttMonths(jobList);
    const tStart = months.length ? new Date(months[0].year, months[0].month, 1) : today;
    const tEnd = months.length ? new Date(months[months.length-1].year, months[months.length-1].month + 1, 1) : today;
    const tMs = tEnd - tStart;
    const tPct = tMs > 0 ? Math.max(0, Math.min(100, ((today - tStart) / tMs) * 100)) : 0;

    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#FFFFFF", textTransform: "uppercase", letterSpacing: "0.06em" }}>Active Jobs — Gantt</div>
            <div style={{ fontSize: 11, color: "#3A4560", marginTop: 2 }}>{jobList.length} active job{jobList.length !== 1 ? "s" : ""} · {fmt(jobList.reduce((s, j) => s + j.contractValue, 0))} total contract value</div>
          </div>
          {showAddBtn && <button className="btn-primary" onClick={openAddJob}>+ Add Job</button>}
        </div>

        {jobList.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px", color: "#2A3560", fontSize: 12, background: "#161B28", borderRadius: 10, border: "1px solid #1E2640" }}>No active jobs — add your first one</div>
        ) : (
          <div style={{ background: "#0B0E18", border: "1px solid #1E2640", borderRadius: 10, overflow: "hidden" }}>
            {/* Month headers */}
            <div style={{ display: "flex", borderBottom: "1px solid #1E2640" }}>
              <div style={{ width: 280, flexShrink: 0, padding: "8px 16px", fontSize: 10, color: "#3A4560", textTransform: "uppercase", letterSpacing: "0.08em", borderRight: "1px solid #1E2640" }}>JOB</div>
              <div style={{ flex: 1, display: "grid", gridTemplateColumns: `repeat(${months.length}, 1fr)`, position: "relative" }}>
                {months.map((m, i) => (
                  <div key={i} style={{ padding: "8px 6px", fontSize: 10, color: "#4A5270", textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "center", borderRight: i < months.length - 1 ? "1px solid #1A2035" : "none", fontWeight: m.month === today.getMonth() && m.year === today.getFullYear() ? 700 : 400, color: m.month === today.getMonth() && m.year === today.getFullYear() ? "#3B6FE8" : "#4A5270" }}>
                    {MONTHS[m.month]} {m.year !== today.getFullYear() ? m.year : ""}
                  </div>
                ))}
              </div>
            </div>

            {/* Job rows */}
            {jobList.map((job, idx) => {
              const bar = getBarStyle(job, months);
              const sc = STATUS_CONFIG[job.status] || STATUS_CONFIG["On Schedule"];
              return (
                <div key={job.id} style={{ display: "flex", borderBottom: idx < jobList.length - 1 ? "1px solid #1A2035" : "none", cursor: "pointer", transition: "background 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#111520"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  onClick={() => setSelectedJob(job)}>
                  {/* Job info */}
                  <div style={{ width: 280, flexShrink: 0, padding: "12px 16px", borderRight: "1px solid #1E2640" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: sc.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: "#E8ECF4", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{job.name}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#3A4560", marginBottom: 4, paddingLeft: 14 }}>{job.client}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, paddingLeft: 14 }}>
                      <span style={{ fontSize: 12, color: "#3B6FE8", fontWeight: 600 }}>{fmt(job.contractValue)}</span>
                      <span style={{ fontSize: 10, color: "#3A4560" }}>·</span>
                      <span style={{ fontSize: 10, color: "#3A4560" }}>{job.pm}</span>
                    </div>
                  </div>

                  {/* Gantt bar area */}
                  <div style={{ flex: 1, position: "relative", padding: "12px 0", minHeight: 56 }}>
                    {/* Today line */}
                    <div style={{ position: "absolute", left: `${tPct}%`, top: 0, bottom: 0, width: 1, background: "#3B6FE840", zIndex: 1 }} />
                    {/* Month grid lines */}
                    {months.map((m, i) => i > 0 && (
                      <div key={i} style={{ position: "absolute", left: `${(i / months.length) * 100}%`, top: 0, bottom: 0, width: 1, background: "#1A2035" }} />
                    ))}
                    {/* Bar */}
                    <div style={{ position: "absolute", top: "50%", transform: "translateY(-50%)", left: bar.left, width: bar.width, height: 28, borderRadius: 6, background: sc.bg, border: `1px solid ${sc.color}50`, overflow: "hidden" }}>
                      {/* Progress fill */}
                      <div style={{ height: "100%", width: `${job.pct}%`, background: sc.color + "40", borderRadius: "5px 0 0 5px", transition: "width 0.5s ease" }} />
                      {/* Label */}
                      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", paddingLeft: 8, gap: 6 }}>
                        <span style={{ fontSize: 10, color: sc.color, fontWeight: 600, whiteSpace: "nowrap" }}>{job.pct}%</span>
                        <span style={{ fontSize: 10, color: sc.color, opacity: 0.7, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{job.name}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Today marker label */}
            <div style={{ position: "relative", height: 20, borderTop: "1px solid #1A2035" }}>
              <div style={{ position: "absolute", left: `calc(280px + ${tPct}% * (100% - 280px) / 100)`, transform: "translateX(-50%)", fontSize: 9, color: "#3B6FE8", letterSpacing: "0.06em", top: 4 }}>TODAY</div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0F1117", color: "#E8ECF4", fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:#0F1117}
        ::-webkit-scrollbar-thumb{background:#2A2F3E;border-radius:2px}
        .nav-item{display:flex;align-items:center;gap:10px;padding:9px 16px;border-radius:6px;cursor:pointer;font-size:13px;color:#6B7694;transition:all 0.15s;border:none;background:none;width:100%;text-align:left;font-family:inherit;letter-spacing:0.01em}
        .nav-item:hover{background:#161B28;color:#B8C4E0}
        .nav-item.active{background:#1A2340;color:#FFFFFF;font-weight:500}
        .bu-tab{padding:5px 14px;border-radius:4px;font-size:11px;font-weight:600;letter-spacing:0.08em;cursor:pointer;border:1px solid transparent;transition:all 0.15s;font-family:inherit;background:none;color:#4A5270}
        .bu-tab:hover{color:#8892B0}
        .bu-tab.active{background:#1A2340;color:#FFFFFF;border-color:#2A3560}
        .stat-card{background:#161B28;border:1px solid #1E2640;border-radius:10px;padding:20px 22px;transition:border-color 0.2s}
        .stat-card:hover{border-color:#2A3560}
        .punch-item{display:flex;align-items:center;gap:12px;padding:12px 16px;background:#161B28;border:1px solid #1E2640;border-radius:8px;transition:all 0.15s}
        .punch-item:hover{border-color:#2A3560}
        .priority-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0}
        .btn-primary{background:#3B6FE8;color:#fff;border:none;cursor:pointer;padding:9px 18px;border-radius:6px;font-family:inherit;font-size:12px;font-weight:600;letter-spacing:0.06em;transition:all 0.2s}
        .btn-primary:hover{background:#5585ED}
        .btn-ghost{background:none;border:1px solid #1E2640;color:#4A5270;cursor:pointer;padding:5px 10px;border-radius:5px;font-family:inherit;font-size:11px;transition:all 0.2s}
        .btn-ghost:hover{border-color:#2A3560;color:#8892B0}
        .fi{background:#0A0D16;border:1px solid #1E2640;border-radius:6px;color:#E8ECF4;padding:9px 12px;font-family:inherit;font-size:12px;width:100%;outline:none;transition:border 0.2s}
        .fi:focus{border-color:#3B6FE8}
        select.fi option{background:#0F1117}
        .lbl{font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#3A4560;margin-bottom:5px;display:block;font-weight:500}
        .pill{display:inline-flex;align-items:center;padding:3px 9px;border-radius:20px;font-size:10px;letter-spacing:0.05em;white-space:nowrap;font-weight:500}
        .opp-row{background:#161B28;border:1px solid #1E2640;border-radius:8px;padding:14px 16px;transition:all 0.15s;cursor:pointer}
        .opp-row:hover{border-color:#2A3560;background:#1A1F30}
        .modal-bg{position:fixed;inset:0;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:100;backdrop-filter:blur(4px)}
        .modal{background:#0F1117;border:1px solid #2A3560;border-radius:12px;padding:28px;width:520px;max-height:90vh;overflow-y:auto}
        .g2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
        .g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px}
        .side-panel{position:fixed;right:0;top:52px;bottom:0;width:360px;background:#0B0E18;border-left:1px solid #1E2640;padding:24px;overflow-y:auto;z-index:40}
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .fade-in{animation:fadeIn 0.2s ease both}
        @keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}
        .slide-in{animation:slideIn 0.2s ease both}
        .coming-soon{display:flex;flex-direction:column;align-items:center;justify-content:center;height:300px;color:#2A3560;gap:12px}
        .view-toggle{background:none;border:1px solid #1E2640;color:#4A5270;cursor:pointer;padding:6px 12px;font-family:inherit;font-size:11px;transition:all 0.15s;font-weight:500}
        .view-toggle.on{background:#1A2340;color:#fff;border-color:#3B6FE8}
        .view-toggle:first-child{border-radius:6px 0 0 6px}
        .view-toggle:last-child{border-radius:0 6px 6px 0}
        input[type=range]{width:100%;accent-color:#3B6FE8}
      `}</style>

      {/* Sidebar */}
      <div style={{ width: sidebarCollapsed ? 60 : 200, background: "#0B0E18", borderRight: "1px solid #161B28", display: "flex", flexDirection: "column", transition: "width 0.2s", flexShrink: 0, position: "sticky", top: 0, height: "100vh", overflow: "hidden" }}>
        <div style={{ padding: "18px 16px 14px", borderBottom: "1px solid #161B28", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, background: "#3B6FE8", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0 }}>FG</div>
          {!sidebarCollapsed && <div><div style={{ fontSize: 13, fontWeight: 700, color: "#FFFFFF", letterSpacing: "0.04em" }}>FARMER</div><div style={{ fontSize: 10, color: "#3B6FE8", letterSpacing: "0.1em", fontWeight: 500 }}>GROUP</div></div>}
        </div>
        <div style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
          {navItems.map(item => (
            <button key={item.id} className={`nav-item ${activeNav === item.id ? "active" : ""}`} onClick={() => setActiveNav(item.id)}
              style={activeNav === item.id ? { borderLeft: `3px solid ${buColor.accent}`, paddingLeft: 13 } : { borderLeft: "3px solid transparent" }}>
              <span style={{ fontSize: 14, flexShrink: 0 }}>{item.icon}</span>
              {!sidebarCollapsed && <span style={{ textTransform: "uppercase", fontSize: 11, letterSpacing: "0.07em" }}>{item.label}</span>}
            </button>
          ))}
        </div>
        <div style={{ padding: "12px 8px", borderTop: "1px solid #161B28" }}>
          <button className="nav-item" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} style={{ justifyContent: "center" }}>
            <span style={{ fontSize: 14 }}>{sidebarCollapsed ? "→" : "←"}</span>
            {!sidebarCollapsed && <span style={{ textTransform: "uppercase", fontSize: 11, letterSpacing: "0.07em" }}>Collapse</span>}
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{ borderBottom: "1px solid #161B28", padding: "0 28px", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between", background: "#0B0E18", position: "sticky", top: 0, zIndex: 40 }}>
          <div style={{ display: "flex", gap: 4 }}>
            {BUSINESS_UNITS.map(bu => (
              <button key={bu.id} className={`bu-tab ${activeBU === bu.id ? "active" : ""}`} onClick={() => handleBUChange(bu.id)}>{bu.short}</button>
            ))}
          </div>
          <div style={{ fontSize: 11, color: "#2A3560", letterSpacing: "0.1em", textTransform: "uppercase" }}>{BUSINESS_UNITS.find(b => b.id === activeBU)?.label}</div>
          <div style={{ background: "#1A2340", border: "1px solid #3B6FE8", color: "#3B6FE8", fontSize: 11, fontWeight: 600, padding: "4px 14px", borderRadius: 4, letterSpacing: "0.08em" }}>OWNER</div>
        </div>

        <div style={{ flex: 1, padding: "28px 32px", overflowY: "auto", paddingRight: (selectedJob || selectedOpp) ? "calc(32px + 360px)" : "32px", transition: "padding-right 0.2s" }}>

          {/* DASHBOARD */}
          {activeNav === "dashboard" && (
            <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 28 }}>
              <div>
                <div style={{ fontSize: 28, fontWeight: 700, color: "#FFFFFF", letterSpacing: "-0.02em" }}>GOOD MORNING, FARMER GROUP</div>
                <div style={{ fontSize: 12, color: "#3A4560", marginTop: 4, letterSpacing: "0.06em" }}>{dayName().toUpperCase()}</div>
              </div>

              {activeBU === "all" ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
                  {Object.entries(SAMPLE_STATS).map(([key, s]) => (
                    <div key={key} className="stat-card" style={{ cursor: "pointer" }} onClick={() => handleBUChange(key)}>
                      <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: BU_COLORS[key].accent, marginBottom: 10, fontWeight: 600 }}>{s.label}</div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: "#FFFFFF", marginBottom: 4 }}>{s.pipeline}</div>
                      <div style={{ fontSize: 11, color: "#3A4560" }}>Pipeline</div>
                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #1E2640", display: "flex", justifyContent: "space-between" }}>
                        <div><div style={{ fontSize: 14, fontWeight: 600, color: "#B8C4E0" }}>{s.jobs}</div><div style={{ fontSize: 10, color: "#3A4560" }}>Active Jobs</div></div>
                        <div style={{ textAlign: "right" }}><div style={{ fontSize: 14, fontWeight: 600, color: "#B8C4E0" }}>{s.budget}</div><div style={{ fontSize: 10, color: "#3A4560" }}>Budget</div></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                  {[
                    { label: "Pipeline Value", value: SAMPLE_STATS[activeBU]?.pipeline, sub: "Active opportunities" },
                    { label: "Active Jobs", value: activeBU === "major" ? majorJobs.length : SAMPLE_STATS[activeBU]?.jobs, sub: "In progress" },
                    { label: "Total Contract Value", value: activeBU === "major" ? fmt(majorJobs.reduce((s,j) => s+j.contractValue,0)) : SAMPLE_STATS[activeBU]?.budget, sub: "Active jobs" },
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

              {/* Gantt on MP dashboard */}
              {activeBU === "major" && (
                <GanttSection jobList={majorJobs} showAddBtn={true} />
              )}

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
                      <span style={{ fontSize: 10, color: "#3A4560", background: "#1E2640", padding: "2px 8px", borderRadius: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>{BUSINESS_UNITS.find(b => b.id === item.bu)?.short}</span>
                    </div>
                  ))}
                  {PUNCH_LIST.filter(p => activeBU === "all" || p.bu === activeBU).length === 0 && (
                    <div style={{ textAlign: "center", padding: "24px", color: "#2A3560", fontSize: 12 }}>No reminders scheduled for today.</div>
                  )}
                </div>
              </div>

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

          {/* ACTIVE JOBS */}
          {activeNav === "jobs" && (
            <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 22 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "#FFFFFF", letterSpacing: "-0.01em", textTransform: "uppercase" }}>Active Jobs</div>
                  <div style={{ fontSize: 11, color: "#3A4560", marginTop: 3, letterSpacing: "0.06em" }}>{BUSINESS_UNITS.find(b => b.id === activeBU)?.label.toUpperCase()} · {majorJobs.length} JOBS · {fmt(majorJobs.reduce((s,j) => s+j.contractValue,0))} TOTAL</div>
                </div>
                <button className="btn-primary" onClick={openAddJob}>+ Add Job</button>
              </div>

              {/* Stats */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                {[
                  { label: "Total Contract Value", value: fmt(majorJobs.reduce((s,j) => s+j.contractValue,0)), color: buColor.accent },
                  { label: "On Schedule", value: majorJobs.filter(j => j.status === "On Schedule").length, color: "#4ADE80" },
                  { label: "Behind / At Risk", value: majorJobs.filter(j => ["Behind Schedule","At Risk"].includes(j.status)).length, color: "#F87171" },
                  { label: "Avg Completion", value: `${majorJobs.length ? Math.round(majorJobs.reduce((s,j) => s+j.pct,0)/majorJobs.length) : 0}%`, color: "#FCD34D" },
                ].map(s => (
                  <div key={s.label} className="stat-card" style={{ position: "relative", overflow: "hidden", padding: "14px 18px" }}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: s.color }} />
                    <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#3A4560", marginBottom: 6 }}>{s.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>

              <GanttSection jobList={majorJobs} showAddBtn={false} />

              {/* Job cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {majorJobs.map(job => {
                  const sc = STATUS_CONFIG[job.status] || STATUS_CONFIG["On Schedule"];
                  return (
                    <div key={job.id} className="opp-row" onClick={() => setSelectedJob(job)}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 7, height: 7, borderRadius: "50%", background: sc.color }} />
                          <span style={{ fontSize: 14, color: "#E8ECF4", fontWeight: 600 }}>{job.name}</span>
                          <span className="pill" style={{ background: sc.bg, color: sc.color }}>{job.status}</span>
                        </div>
                        <span style={{ fontSize: 16, fontWeight: 700, color: "#3B6FE8" }}>{fmt(job.contractValue)}</span>
                      </div>
                      <div style={{ display: "flex", gap: 20, marginBottom: 10 }}>
                        <span style={{ fontSize: 11, color: "#3A4560" }}>👤 {job.pm}</span>
                        <span style={{ fontSize: 11, color: "#3A4560" }}>🏢 {job.client}</span>
                        <span style={{ fontSize: 11, color: "#3A4560" }}>📅 {job.startDate} → {job.endDate}</span>
                      </div>
                      <div style={{ background: "#0A0D16", borderRadius: 4, height: 6, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${job.pct}%`, background: sc.color, borderRadius: 4, transition: "width 0.5s" }} />
                      </div>
                      <div style={{ fontSize: 10, color: "#3A4560", marginTop: 4, textAlign: "right" }}>{job.pct}% complete</div>
                    </div>
                  );
                })}
                {majorJobs.length === 0 && <div style={{ textAlign: "center", padding: "48px", color: "#2A3560", fontSize: 12 }}>No active jobs yet</div>}
              </div>
            </div>
          )}

          {/* PIPELINE */}
          {activeNav === "pipeline" && (
            <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 22 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "#FFFFFF", letterSpacing: "-0.01em", textTransform: "uppercase" }}>Pipeline</div>
                  <div style={{ fontSize: 11, color: "#3A4560", marginTop: 3, letterSpacing: "0.06em" }}>{BUSINESS_UNITS.find(b => b.id === activeBU)?.label.toUpperCase()} · {visiblePipeline.length} OPPORTUNITIES</div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {activeBU === "all" && (
                    <select className="fi" style={{ width: 160 }} value={filterBU} onChange={e => setFilterBU(e.target.value)}>
                      <option value="all">All Units</option>
                      {BUSINESS_UNITS.filter(b => b.id !== "all").map(b => <option key={b.id} value={b.id}>{b.label}</option>)}
                    </select>
                  )}
                  <input className="fi" style={{ width: 180 }} placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
                  <div style={{ display: "flex" }}>
                    <button className={`view-toggle ${pipelineView === "kanban" ? "on" : ""}`} onClick={() => setPipelineView("kanban")}>Kanban</button>
                    <button className={`view-toggle ${pipelineView === "list" ? "on" : ""}`} onClick={() => setPipelineView("list")}>List</button>
                  </div>
                  <button className="btn-primary" onClick={openAdd}>+ Add</button>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                {[
                  { label: "Active Pipeline", value: fmt(totalPipeline), color: buColor.accent },
                  { label: "Won", value: fmt(totalWon), color: "#4ADE80" },
                  { label: "Win Rate", value: `${winRate}%`, color: "#FCD34D" },
                ].map(s => (
                  <div key={s.label} className="stat-card" style={{ position: "relative", overflow: "hidden", padding: "14px 18px" }}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: s.color }} />
                    <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#3A4560", marginBottom: 6 }}>{s.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>
              {pipelineView === "kanban" && (
                <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 8 }}>
                  {stages.map(stage => {
                    const sc = STAGE_COLORS[stage] || { color: "#60A5FA", bg: "#60A5FA15" };
                    const stageOpps = visiblePipeline.filter(o => o.stage === stage);
                    return (
                      <div key={stage} style={{ minWidth: 200, flex: "0 0 200px" }}>
                        <div style={{ background: sc.bg, border: `1px solid ${sc.color}30`, borderRadius: 7, padding: "8px 12px", marginBottom: 10 }}>
                          <div style={{ fontSize: 10, letterSpacing: "0.07em", textTransform: "uppercase", color: sc.color, fontWeight: 600, marginBottom: 2 }}>{stage}</div>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ fontSize: 10, color: "#3A4560" }}>{stageOpps.length} opp{stageOpps.length !== 1 ? "s" : ""}</span>
                            <span style={{ fontSize: 11, color: sc.color, fontWeight: 600 }}>{fmt(stageOpps.reduce((s,o) => s+o.value,0))}</span>
                          </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {stageOpps.map(o => (
                            <div key={o.id} style={{ background: "#161B28", border: `1px solid ${sc.color}25`, borderRadius: 8, padding: 12, cursor: "pointer" }} onClick={() => setSelectedOpp(o)}>
                              <div style={{ fontSize: 12, color: "#E8ECF4", fontWeight: 500, lineHeight: 1.35, marginBottom: 5 }}>{o.name}</div>
                              <div style={{ fontSize: 10, color: "#3A4560", marginBottom: 8 }}>{o.contact}</div>
                              <div style={{ fontSize: 15, fontWeight: 700, color: sc.color, marginBottom: 8 }}>{fmt(o.value)}</div>
                              {o.closeDate && <div style={{ fontSize: 10, color: "#3A4560" }}>Close: {o.closeDate}</div>}
                              <div style={{ display: "flex", gap: 5, marginTop: 8 }} onClick={e => e.stopPropagation()}>
                                <button className="btn-ghost" style={{ flex: 1, fontSize: 11 }} onClick={() => moveStage(o.id, -1)}>←</button>
                                <button className="btn-ghost" style={{ flex: 1, fontSize: 11 }} onClick={() => moveStage(o.id, 1)}>→</button>
                                <button className="btn-ghost" style={{ fontSize: 11 }} onClick={() => openEdit(o)}>✎</button>
                              </div>
                            </div>
                          ))}
                          {stageOpps.length === 0 && <div style={{ border: `1px dashed ${sc.color}20`, borderRadius: 8, padding: "20px 8px", textAlign: "center", fontSize: 10, color: "#1E2840" }}>EMPTY</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {pipelineView === "list" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr auto", gap: 12, padding: "6px 16px", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: "#2A3560" }}>
                    <span>Opportunity</span><span>Contact</span><span>Stage</span><span style={{ textAlign: "right" }}>Value</span><span>Close Date</span><span />
                  </div>
                  {visiblePipeline.map(o => {
                    const sc = STAGE_COLORS[o.stage] || { color: "#60A5FA", bg: "#60A5FA15" };
                    return (
                      <div key={o.id} className="opp-row" style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr auto", gap: 12, alignItems: "center" }} onClick={() => setSelectedOpp(o)}>
                        <div>
                          <div style={{ fontSize: 13, color: "#E8ECF4", fontWeight: 500 }}>{o.name}</div>
                          {o.notes && <div style={{ fontSize: 10, color: "#3A4560", marginTop: 2 }}>{o.notes}</div>}
                        </div>
                        <div style={{ fontSize: 11, color: "#3A4560" }}>{o.contact}</div>
                        <span className="pill" style={{ background: sc.bg, color: sc.color }}>{o.stage}</span>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#E8ECF4", textAlign: "right" }}>{fmt(o.value)}</div>
                        <div style={{ fontSize: 11, color: "#3A4560" }}>{o.closeDate}</div>
                        <div style={{ display: "flex", gap: 5 }} onClick={e => e.stopPropagation()}>
                          <button className="btn-ghost" onClick={() => openEdit(o)}>✎</button>
                          <button className="btn-ghost" style={{ color: "#F87171", borderColor: "#F8717120" }} onClick={() => deleteOpp(o.id)}>✕</button>
                        </div>
                      </div>
                    );
                  })}
                  {visiblePipeline.length === 0 && <div style={{ textAlign: "center", padding: "48px", color: "#2A3560", fontSize: 12 }}>No opportunities found</div>}
                </div>
              )}
            </div>
          )}

          {/* OTHER SECTIONS */}
          {/* BUDGETING */}
          {activeNav === "budgeting" && activeBU === "major" && (
            <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 22 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "#FFFFFF", letterSpacing: "-0.01em", textTransform: "uppercase" }}>Budgeting</div>
                  <div style={{ fontSize: 11, color: "#3A4560", marginTop: 3, letterSpacing: "0.06em" }}>
                    MAJOR PROJECTS · PRE-LEAD SCOPING · {pipeline.filter(o => o.bu === "major" && o.stage === "Budgeting").length} PROJECTS
                  </div>
                </div>
                <button className="btn-primary" onClick={() => {
                  setEditId(null);
                  setForm({ name: "", contact: "", value: "", stage: "Budgeting", closeDate: "", notes: "", bu: "major" });
                  setShowForm(true);
                }}>+ Add Project</button>
              </div>

              {/* Stats */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                {[
                  { label: "Projects in Budgeting", value: pipeline.filter(o => o.bu === "major" && o.stage === "Budgeting").length, color: "#3B6FE8" },
                  { label: "Total Estimated Value", value: fmt(pipeline.filter(o => o.bu === "major" && o.stage === "Budgeting").reduce((s, o) => s + o.value, 0)), color: "#FCD34D" },
                  { label: "Avg Estimate", value: fmt(pipeline.filter(o => o.bu === "major" && o.stage === "Budgeting").length ? pipeline.filter(o => o.bu === "major" && o.stage === "Budgeting").reduce((s, o) => s + o.value, 0) / pipeline.filter(o => o.bu === "major" && o.stage === "Budgeting").length : 0), color: "#A78BFA" },
                ].map(s => (
                  <div key={s.label} className="stat-card" style={{ position: "relative", overflow: "hidden", padding: "14px 18px" }}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: s.color }} />
                    <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#3A4560", marginBottom: 6 }}>{s.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Projects list */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {pipeline.filter(o => o.bu === "major" && o.stage === "Budgeting").map(o => (
                  <div key={o.id} className="opp-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }} onClick={() => setSelectedOpp(o)}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, color: "#E8ECF4", fontWeight: 600, marginBottom: 4 }}>{o.name}</div>
                      <div style={{ display: "flex", gap: 16 }}>
                        <span style={{ fontSize: 11, color: "#3A4560" }}>👤 {o.contact || "No contact"}</span>
                        {o.closeDate && <span style={{ fontSize: 11, color: "#3A4560" }}>📅 Target: {o.closeDate}</span>}
                        {o.notes && <span style={{ fontSize: 11, color: "#3A4560", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>📝 {o.notes}</span>}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: "#FCD34D" }}>{fmt(o.value)}</div>
                        <div style={{ fontSize: 10, color: "#3A4560" }}>estimated value</div>
                      </div>
                      <button className="btn-primary" style={{ fontSize: 11, padding: "6px 12px", background: "#4ADE8020", color: "#4ADE80", border: "1px solid #4ADE8040" }}
                        onClick={e => { e.stopPropagation(); setPipeline(pipeline.map(p => p.id === o.id ? { ...p, stage: "Lead" } : p)); }}>
                        → Promote to Lead
                      </button>
                      <div style={{ display: "flex", gap: 5 }} onClick={e => e.stopPropagation()}>
                        <button className="btn-ghost" onClick={() => openEdit(o)}>✎</button>
                        <button className="btn-ghost" style={{ color: "#F87171", borderColor: "#F8717120" }} onClick={() => deleteOpp(o.id)}>✕</button>
                      </div>
                    </div>
                  </div>
                ))}
                {pipeline.filter(o => o.bu === "major" && o.stage === "Budgeting").length === 0 && (
                  <div style={{ textAlign: "center", padding: "48px", color: "#2A3560", fontSize: 12, background: "#161B28", borderRadius: 10, border: "1px solid #1E2640" }}>
                    No projects in budgeting yet — add one to start scoping
                  </div>
                )}
              </div>
            </div>
          )}
{!["dashboard","jobs","pipeline","budgeting"].includes(activeNav) && (
  <div className="fade-in">
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#FFFFFF", letterSpacing: "-0.01em", textTransform: "uppercase" }}>{navItems.find(n => n.id === activeNav)?.label}</div>
                <div style={{ fontSize: 11, color: "#3A4560", marginTop: 4, letterSpacing: "0.06em" }}>{BUSINESS_UNITS.find(b => b.id === activeBU)?.label.toUpperCase()}</div>
              </div>
              <div className="coming-soon">
                <div style={{ width: 48, height: 48, borderRadius: 12, background: buColor.light, border: `1px solid ${buColor.accent}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{navItems.find(n => n.id === activeNav)?.icon}</div>
                <div style={{ fontSize: 14, color: "#3A4560", fontWeight: 500 }}>{navItems.find(n => n.id === activeNav)?.label} — Coming Soon</div>
                <div style={{ fontSize: 12, color: "#2A3050" }}>This section is ready to be built out</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* JOB SIDE PANEL */}
      {selectedJob && (
        <div className="side-panel slide-in">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#FFFFFF", textTransform: "uppercase", letterSpacing: "0.06em" }}>Job Detail</div>
            <button className="btn-ghost" onClick={() => setSelectedJob(null)}>✕</button>
          </div>
          {(() => {
            const sc = STATUS_CONFIG[selectedJob.status] || STATUS_CONFIG["On Schedule"];
            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 16, color: "#E8ECF4", fontWeight: 600, marginBottom: 4 }}>{selectedJob.name}</div>
                  <div style={{ fontSize: 12, color: "#3A4560", marginBottom: 10 }}>{selectedJob.client}</div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span className="pill" style={{ background: sc.bg, color: sc.color }}>{selectedJob.status}</span>
                    <span style={{ fontSize: 20, fontWeight: 700, color: "#3B6FE8" }}>{fmt(selectedJob.contractValue)}</span>
                  </div>
                </div>
                <div style={{ background: "#0A0D16", borderRadius: 8, padding: "14px", border: "1px solid #1E2640", display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    { label: "Project Manager", value: selectedJob.pm },
                    { label: "Start Date", value: selectedJob.startDate },
                    { label: "End Date", value: selectedJob.endDate },
                  ].map(r => (
                    <div key={r.label} style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 11, color: "#3A4560" }}>{r.label}</span>
                      <span style={{ fontSize: 11, color: "#B8C4E0" }}>{r.value}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#3A4560", marginBottom: 8 }}>Completion — {selectedJob.pct}%</div>
                  <div style={{ background: "#0A0D16", borderRadius: 4, height: 8, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${selectedJob.pct}%`, background: sc.color, borderRadius: 4 }} />
                  </div>
                </div>
                {selectedJob.notes && <div style={{ fontSize: 12, color: "#6B7694", lineHeight: 1.6, background: "#0A0D16", padding: "10px 12px", borderRadius: 6, border: "1px solid #1E2640" }}>{selectedJob.notes}</div>}
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn-ghost" style={{ flex: 1 }} onClick={() => { openEditJob(selectedJob); setSelectedJob(null); }}>✎ Edit</button>
                  <button className="btn-ghost" style={{ color: "#F87171", borderColor: "#F8717120" }} onClick={() => deleteJob(selectedJob.id)}>✕</button>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* OPP SIDE PANEL */}
      {selectedOpp && (
        <div className="side-panel slide-in">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#FFFFFF", textTransform: "uppercase", letterSpacing: "0.06em" }}>Opportunity Detail</div>
            <button className="btn-ghost" onClick={() => setSelectedOpp(null)}>✕</button>
          </div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 15, color: "#E8ECF4", fontWeight: 600, marginBottom: 6 }}>{selectedOpp.name}</div>
            <div style={{ fontSize: 12, color: "#3A4560", marginBottom: 12 }}>{selectedOpp.contact}</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
              <span className="pill" style={{ background: STAGE_COLORS[selectedOpp.stage]?.bg, color: STAGE_COLORS[selectedOpp.stage]?.color }}>{selectedOpp.stage}</span>
              <span style={{ fontSize: 20, fontWeight: 700, color: "#FFFFFF" }}>{fmt(selectedOpp.value)}</span>
            </div>
            {selectedOpp.closeDate && <div style={{ fontSize: 11, color: "#3A4560", marginBottom: 8 }}><span style={{ color: "#4A5270" }}>Expected Close: </span>{selectedOpp.closeDate}</div>}
            {selectedOpp.notes && <div style={{ fontSize: 12, color: "#6B7694", lineHeight: 1.6, background: "#0A0D16", padding: "10px 12px", borderRadius: 6, border: "1px solid #1E2640", marginTop: 10 }}>{selectedOpp.notes}</div>}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-ghost" style={{ flex: 1 }} onClick={() => { openEdit(selectedOpp); setSelectedOpp(null); }}>✎ Edit</button>
            <button className="btn-ghost" style={{ color: "#F87171", borderColor: "#F8717120" }} onClick={() => deleteOpp(selectedOpp.id)}>✕</button>
          </div>
        </div>
      )}

      {/* JOB FORM MODAL */}
      {showJobForm && (
        <div className="modal-bg" onClick={e => e.target === e.currentTarget && setShowJobForm(false)}>
          <div className="modal fade-in">
            <div style={{ fontSize: 16, fontWeight: 700, color: "#FFFFFF", marginBottom: 22, textTransform: "uppercase", letterSpacing: "0.04em" }}>{editJobId !== null ? "Edit Job" : "Add Active Job"}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label className="lbl">Job Name *</label>
                <input className="fi" value={jobForm.name} onChange={fj("name")} placeholder="e.g. Riverside Community Center" />
              </div>
              <div className="g2">
                <div>
                  <label className="lbl">Client</label>
                  <input className="fi" value={jobForm.client} onChange={fj("client")} placeholder="Client name" />
                </div>
                <div>
                  <label className="lbl">Contract Value</label>
                  <input className="fi" type="number" value={jobForm.contractValue} onChange={fj("contractValue")} placeholder="0" />
                </div>
              </div>
              <div className="g2">
                <div>
                  <label className="lbl">Start Date</label>
                  <input className="fi" type="date" value={jobForm.startDate} onChange={fj("startDate")} />
                </div>
                <div>
                  <label className="lbl">End Date</label>
                  <input className="fi" type="date" value={jobForm.endDate} onChange={fj("endDate")} />
                </div>
              </div>
              <div className="g2">
                <div>
                  <label className="lbl">Project Manager</label>
                  <input className="fi" value={jobForm.pm} onChange={fj("pm")} placeholder="Name" />
                </div>
                <div>
                  <label className="lbl">Status</label>
                  <select className="fi" value={jobForm.status} onChange={fj("status")}>
                    {["On Schedule","Behind Schedule","At Risk"].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="lbl">% Complete — {jobForm.pct}%</label>
                <input type="range" min="0" max="100" value={jobForm.pct} onChange={fj("pct")} />
              </div>
              <div>
                <label className="lbl">Notes</label>
                <textarea className="fi" rows={3} value={jobForm.notes} onChange={fj("notes")} placeholder="Key updates or context…" style={{ resize: "vertical" }} />
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 6 }}>
                <button className="btn-ghost" style={{ padding: "8px 16px" }} onClick={() => setShowJobForm(false)}>Cancel</button>
                <button className="btn-primary" onClick={saveJob}>{editJobId !== null ? "Save Changes" : "Add Job"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OPP FORM MODAL */}
      {showForm && (
        <div className="modal-bg" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal fade-in">
            <div style={{ fontSize: 16, fontWeight: 700, color: "#FFFFFF", marginBottom: 22, textTransform: "uppercase", letterSpacing: "0.04em" }}>{editId !== null ? "Edit Opportunity" : "Add Opportunity"}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label className="lbl">Opportunity Name *</label>
                <input className="fi" value={form.name} onChange={fp("name")} placeholder="e.g. Riverside Community Center" />
              </div>
              <div className="g2">
                <div>
                  <label className="lbl">Client / Contact</label>
                  <input className="fi" value={form.contact} onChange={fp("contact")} placeholder="name@company.com" />
                </div>
                <div>
                  <label className="lbl">Estimated Value *</label>
                  <input className="fi" type="number" value={form.value} onChange={fp("value")} placeholder="0" />
                </div>
              </div>
              <div className="g2">
                <div>
                  <label className="lbl">Business Unit</label>
                  <select className="fi" value={form.bu} onChange={e => setForm({ ...form, bu: e.target.value, stage: PIPELINE_STAGES[e.target.value]?.[0] || "Lead" })}>
                    {BUSINESS_UNITS.filter(b => b.id !== "all").map(b => <option key={b.id} value={b.id}>{b.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="lbl">Stage</label>
                  <select className="fi" value={form.stage} onChange={fp("stage")}>
                    {(PIPELINE_STAGES[form.bu] || PIPELINE_STAGES.all).map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="lbl">Expected Close Date</label>
                <input className="fi" type="date" value={form.closeDate} onChange={fp("closeDate")} />
              </div>
              <div>
                <label className="lbl">Notes</label>
                <textarea className="fi" rows={3} value={form.notes} onChange={fp("notes")} placeholder="Key details…" style={{ resize: "vertical" }} />
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 6 }}>
                <button className="btn-ghost" style={{ padding: "8px 16px" }} onClick={() => setShowForm(false)}>Cancel</button>
                <button className="btn-primary" onClick={saveOpp}>{editId !== null ? "Save Changes" : "Add Opportunity"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
