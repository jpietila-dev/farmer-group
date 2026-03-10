import { useState, useMemo } from "react";

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
    { id: "customers", label: "Customers", icon: "🏢" },
    { id: "finance", label: "Finance", icon: "💰" },
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
  all:      ["Budgeting", "Lead", "Initial Meeting", "Proposal / Bid", "Negotiation", "Won", "Lost"],
  major:    ["Budgeting", "Lead", "Proposal / Bid", "Negotiation", "Won", "Lost"],
  capital:  ["Lead", "Initial Meeting", "Proposal / Bid", "Negotiation", "Won", "Lost"],
  facility: ["Lead", "Bid Submitted", "Negotiation", "Won", "Lost"],
  lawn:     ["Lead", "Proposal / Bid", "Negotiation", "Won", "Lost"],
  snow:     ["Lead", "Proposal / Bid", "Negotiation", "Won", "Lost"],
};

const STAGE_COLORS = {
  "Budgeting":       { color: "#818CF8", bg: "#818CF815" },
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

const PUNCH_LIST_STATIC = [
  { id: "s1", text: "Schedule crew for Elm St. maintenance", bu: "facility", priority: "medium", dueDate: null },
  { id: "s2", text: "Review Q1 lawn budget variance", bu: "lawn", priority: "medium", dueDate: null },
  { id: "s3", text: "Confirm snow routes for weekend", bu: "snow", priority: "high", dueDate: null },
];

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const fmt = (v) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v || 0);
const dayName = () => new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

function getGanttMonths(jobs) {
  if (!jobs.length) {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => { const d = new Date(now.getFullYear(), now.getMonth() + i, 1); return { year: d.getFullYear(), month: d.getMonth() }; });
  }
  const starts = jobs.map(j => new Date(j.startDate));
  const ends = jobs.map(j => new Date(j.endDate));
  let minDate = new Date(Math.min(...starts));
  let maxDate = new Date(Math.max(...ends));
  minDate = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  maxDate = new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 1);
  const months = [];
  let cur = new Date(minDate);
  while (cur < maxDate) { months.push({ year: cur.getFullYear(), month: cur.getMonth() }); cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1); }
  return months;
}

function getBarStyle(job, months) {
  if (!months.length) return { left: "0%", width: "0%" };
  const totalStart = new Date(months[0].year, months[0].month, 1);
  const totalEnd = new Date(months[months.length-1].year, months[months.length-1].month + 1, 1);
  const totalMs = totalEnd - totalStart;
  const jobStart = new Date(job.startDate);
  const jobEnd = new Date(job.endDate);
  const left = Math.max(0, (jobStart - totalStart) / totalMs) * 100;
  const right = Math.min(1, (jobEnd - totalStart) / totalMs) * 100;
  return { left: `${left}%`, width: `${Math.max(0.5, right - left)}%` };
}

const SAMPLE_COMPANIES = [
  { id: "c1", name: "Riverside City", website: "riverside.gov", address: "100 City Hall Rd, Riverside, NJ", logo: "", notes: "" },
  { id: "c2", name: "Elmwood School District", website: "elmwood.edu", address: "200 School Ave, Elmwood, NJ", logo: "", notes: "" },
  { id: "c3", name: "Harbor View LLC", website: "harborview.com", address: "300 Harbor Blvd, Newark, NJ", logo: "", notes: "" },
  { id: "c4", name: "Eastside Development", website: "eastside.com", address: "400 Eastside Dr, Trenton, NJ", logo: "", notes: "" },
];

const SAMPLE_CONTACTS = [
  { id: "p1", companyId: "c1", firstName: "Mike", lastName: "Johnson", title: "Project Director", email: "mike@riverside.gov", phone: "609-555-0101" },
  { id: "p2", companyId: "c1", firstName: "Dana", lastName: "Cruz", title: "Procurement", email: "dana@riverside.gov", phone: "609-555-0102" },
  { id: "p3", companyId: "c2", firstName: "Sara", lastName: "Lee", title: "Facilities Manager", email: "sara@elmwood.edu", phone: "732-555-0201" },
  { id: "p4", companyId: "c3", firstName: "Bob", lastName: "Harris", title: "Owner", email: "bob@harborview.com", phone: "201-555-0301" },
  { id: "p5", companyId: "c4", firstName: "Dev", lastName: "Patel", title: "VP Development", email: "dev@eastside.com", phone: "609-555-0401" },
];

export default function App() {
  const [activeBU, setActiveBU] = useState("all");
  const [activeNav, setActiveNav] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // CRM State
  const [companies, setCompanies] = useState(SAMPLE_COMPANIES);
  const [contacts, setContacts] = useState(SAMPLE_CONTACTS);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [editCompanyId, setEditCompanyId] = useState(null);
  const [editContactId, setEditContactId] = useState(null);
  const [companyForm, setCompanyForm] = useState({ name: "", website: "", address: "", logo: "", notes: "" });
  const [contactForm, setContactForm] = useState({ companyId: "", firstName: "", lastName: "", title: "", email: "", phone: "" });
  const [crmSearch, setCrmSearch] = useState("");

  // Pipeline State
  const [pipeline, setPipeline] = useState([
    { id: 1, name: "Riverside Community Center", companyId: "c1", contactId: "p1", contact: "mike@riverside.gov", value: 450000, stage: "Negotiation", closeDate: "2026-04-15", notes: "Final contract review", bu: "major", budgetDueDate: "", bidDueDate: "", nextSteps: [] },
    { id: 2, name: "Elmwood School Renovation", companyId: "c2", contactId: "p3", contact: "sara@elmwood.edu", value: 280000, stage: "Proposal / Bid", closeDate: "2026-03-28", notes: "Submitted last Tuesday", bu: "major", budgetDueDate: "", bidDueDate: "2026-03-28", nextSteps: [] },
    { id: 3, name: "Oak Street Parking Lot", companyId: "c3", contactId: "p4", contact: "bob@harborview.com", value: 95000, stage: "Lead", closeDate: "2026-05-01", notes: "Initial inquiry", bu: "capital", budgetDueDate: "", bidDueDate: "", nextSteps: [] },
    { id: 4, name: "Eastside Budget Scope", companyId: "c4", contactId: "p5", contact: "dev@eastside.com", value: 320000, stage: "Budgeting", closeDate: "", notes: "Early scoping", bu: "major", budgetDueDate: "2026-03-17", bidDueDate: "", nextSteps: [] },
    { id: 5, name: "Central Park Redevelopment", companyId: "c1", contactId: "p2", contact: "dana@riverside.gov", value: 580000, stage: "Lead", closeDate: "2026-06-01", notes: "Referral", bu: "major", budgetDueDate: "", bidDueDate: "", nextSteps: [{ step: "Geotechnical", dueDate: "2026-03-14" }, { step: "Engage Engineer", dueDate: "2026-03-21" }] },
  ]);

  // Jobs State
  const [jobs, setJobs] = useState([
    { id: 1, name: "Riverside Community Center", companyId: "c1", client: "Riverside City", contractValue: 450000, startDate: "2026-02-01", endDate: "2026-06-30", pm: "John Smith", pct: 35, status: "On Schedule", notes: "Foundation complete", bu: "major" },
    { id: 2, name: "Elmwood School Renovation", companyId: "c2", client: "Elmwood School District", contractValue: 280000, startDate: "2026-03-15", endDate: "2026-08-15", pm: "Sarah Lee", pct: 10, status: "On Schedule", notes: "Permits approved", bu: "major" },
    { id: 3, name: "Harbor View Expansion", companyId: "c3", client: "Harbor View LLC", contractValue: 620000, startDate: "2026-01-10", endDate: "2026-09-30", pm: "Mike Torres", pct: 52, status: "Behind Schedule", notes: "Weather delays", bu: "major" },
  ]);

  const [showJobForm, setShowJobForm] = useState(false);
  const [editJobId, setEditJobId] = useState(null);
  const [jobForm, setJobForm] = useState({ name: "", companyId: "", client: "", contractValue: "", startDate: "", endDate: "", pm: "", pct: 0, status: "On Schedule", notes: "", bu: "major" });
  const [selectedJob, setSelectedJob] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: "", companyId: "", contactId: "", contact: "", value: "", stage: "Budgeting", closeDate: "", notes: "", bu: "major", budgetDueDate: "", bidDueDate: "", nextSteps: [] });
  const [pipelineView, setPipelineView] = useState("kanban");
  const [filterBU, setFilterBU] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedOpp, setSelectedOpp] = useState(null);
  const [newNextStep, setNewNextStep] = useState({ step: "", dueDate: "" });

  // Inline add new company/contact from form
  const [showInlineCompany, setShowInlineCompany] = useState(false);
  const [showInlineContact, setShowInlineContact] = useState(false);
  const [inlineCompany, setInlineCompany] = useState({ name: "", website: "", address: "", logo: "", notes: "" });
  const [inlineContact, setInlineContact] = useState({ firstName: "", lastName: "", title: "", email: "", phone: "" });

  const navItems = NAV_ITEMS[activeBU] || NAV_ITEMS.all;
  const buColor = BU_COLORS[activeBU];
  const NEXT_STEP_OPTIONS = ["Geotechnical", "Engage Engineer", "Underwriting", "LOI", "Under Contract"];
  const handleBUChange = (id) => { setActiveBU(id); setActiveNav("dashboard"); };

  // Dynamic punch list
  const dynamicPunchList = useMemo(() => {
    const items = [...PUNCH_LIST_STATIC];
    const today = new Date();
    const soon = new Date(); soon.setDate(soon.getDate() + 7);
    pipeline.forEach(o => {
      if (o.budgetDueDate) { const d = new Date(o.budgetDueDate); if (d >= today && d <= soon) items.push({ id: `budget-${o.id}`, text: `Budget due: ${o.name}`, bu: o.bu, priority: d <= new Date(today.getTime() + 2*86400000) ? "high" : "medium", dueDate: o.budgetDueDate, tag: "BUDGET DUE" }); }
      if (o.bidDueDate) { const d = new Date(o.bidDueDate); if (d >= today && d <= soon) items.push({ id: `bid-${o.id}`, text: `Bid due: ${o.name}`, bu: o.bu, priority: d <= new Date(today.getTime() + 2*86400000) ? "high" : "medium", dueDate: o.bidDueDate, tag: "BID DUE" }); }
      (o.nextSteps || []).forEach((ns, i) => { if (ns.dueDate) { const d = new Date(ns.dueDate); if (d >= today && d <= soon) items.push({ id: `ns-${o.id}-${i}`, text: `${ns.step}: ${o.name}`, bu: o.bu, priority: d <= new Date(today.getTime() + 2*86400000) ? "high" : "medium", dueDate: ns.dueDate, tag: ns.step.toUpperCase() }); } });
    });
    return items.sort((a, b) => { if (!a.dueDate && !b.dueDate) return 0; if (!a.dueDate) return 1; if (!b.dueDate) return -1; return new Date(a.dueDate) - new Date(b.dueDate); });
  }, [pipeline]);

  const majorJobs = jobs.filter(j => j.bu === "major");

  // CRM helpers
  const getCompanyName = (companyId) => companies.find(c => c.id === companyId)?.name || "";
  const getContactName = (contactId) => { const c = contacts.find(p => p.id === contactId); return c ? `${c.firstName} ${c.lastName}` : ""; };
  const getCompanyContacts = (companyId) => contacts.filter(p => p.companyId === companyId);
  const getCompanyJobs = (companyId) => jobs.filter(j => j.companyId === companyId);
  const getCompanyPipeline = (companyId) => pipeline.filter(o => o.companyId === companyId);
  const getCompanyTotalValue = (companyId) => jobs.filter(j => j.companyId === companyId).reduce((s, j) => s + j.contractValue, 0);

  const saveCompany = () => {
    if (!companyForm.name.trim()) return;
    if (editCompanyId) setCompanies(companies.map(c => c.id === editCompanyId ? { ...companyForm, id: editCompanyId } : c));
    else setCompanies([...companies, { ...companyForm, id: `c${Date.now()}` }]);
    setShowCompanyForm(false); setEditCompanyId(null); setCompanyForm({ name: "", website: "", address: "", logo: "", notes: "" });
  };

  const saveContact = () => {
    if (!contactForm.firstName.trim()) return;
    if (editContactId) setContacts(contacts.map(p => p.id === editContactId ? { ...contactForm, id: editContactId } : p));
    else setContacts([...contacts, { ...contactForm, id: `p${Date.now()}` }]);
    setShowContactForm(false); setEditContactId(null); setContactForm({ companyId: "", firstName: "", lastName: "", title: "", email: "", phone: "" });
  };

  const addInlineCompany = () => {
    if (!inlineCompany.name.trim()) return;
    const newId = `c${Date.now()}`;
    setCompanies([...companies, { ...inlineCompany, id: newId }]);
    setForm({ ...form, companyId: newId, contactId: "" });
    setJobForm({ ...jobForm, companyId: newId, client: inlineCompany.name });
    setShowInlineCompany(false);
    setInlineCompany({ name: "", website: "", address: "", logo: "", notes: "" });
  };

  const addInlineContact = () => {
    if (!inlineContact.firstName.trim()) return;
    const newId = `p${Date.now()}`;
    const compId = form.companyId || jobForm.companyId;
    setContacts([...contacts, { ...inlineContact, id: newId, companyId: compId }]);
    setForm({ ...form, contactId: newId });
    setJobForm({ ...jobForm, contactId: newId });
    setShowInlineContact(false);
    setInlineContact({ firstName: "", lastName: "", title: "", email: "", phone: "" });
  };

  // Job helpers
  const openAddJob = () => { setEditJobId(null); setJobForm({ name: "", companyId: "", client: "", contractValue: "", startDate: "", endDate: "", pm: "", pct: 0, status: "On Schedule", notes: "", bu: activeBU === "all" ? "major" : activeBU }); setShowJobForm(true); };
  const openEditJob = (j) => { setEditJobId(j.id); setJobForm({ ...j, contractValue: String(j.contractValue) }); setShowJobForm(true); };
  const saveJob = () => {
    if (!jobForm.name.trim()) return;
    const co = companies.find(c => c.id === jobForm.companyId);
    const entry = { ...jobForm, contractValue: Number(jobForm.contractValue), pct: Number(jobForm.pct), client: co?.name || jobForm.client };
    if (editJobId !== null) setJobs(jobs.map(j => j.id === editJobId ? { ...entry, id: editJobId } : j));
    else setJobs([...jobs, { ...entry, id: Date.now() }]);
    setShowJobForm(false);
  };
  const deleteJob = (id) => { setJobs(jobs.filter(j => j.id !== id)); setSelectedJob(null); };

  // Pipeline helpers
  const openAdd = (defaultStage = "Budgeting") => { setEditId(null); setForm({ name: "", companyId: "", contactId: "", contact: "", value: "", stage: defaultStage, closeDate: "", notes: "", bu: activeBU === "all" ? "major" : activeBU, budgetDueDate: "", bidDueDate: "", nextSteps: [] }); setShowForm(true); };
  const openEdit = (o) => { setEditId(o.id); setForm({ ...o, value: String(o.value), nextSteps: o.nextSteps || [], budgetDueDate: o.budgetDueDate || "", bidDueDate: o.bidDueDate || "" }); setShowForm(true); };
  const saveOpp = () => {
    if (!form.name.trim() || !form.value) return;
    const co = companies.find(c => c.id === form.companyId);
    const ct = contacts.find(p => p.id === form.contactId);
    const entry = { ...form, value: Number(form.value), contact: ct ? ct.email : form.contact };
    if (editId !== null) { setPipeline(pipeline.map(o => o.id === editId ? { ...entry, id: editId } : o)); if (selectedOpp?.id === editId) setSelectedOpp({ ...entry, id: editId }); }
    else setPipeline([...pipeline, { ...entry, id: Date.now() }]);
    setShowForm(false);
  };
  const deleteOpp = (id) => { setPipeline(pipeline.filter(o => o.id !== id)); setSelectedOpp(null); };
  const moveStage = (id, dir) => setPipeline(pipeline.map(o => { if (o.id !== id) return o; const stages = PIPELINE_STAGES[o.bu] || PIPELINE_STAGES.all; const idx = stages.indexOf(o.stage); return { ...o, stage: stages[Math.max(0, Math.min(stages.length-1, idx+dir))] }; }));
  const addNextStep = () => { if (!newNextStep.step) return; setForm({ ...form, nextSteps: [...(form.nextSteps||[]), {...newNextStep}] }); setNewNextStep({ step: "", dueDate: "" }); };
  const removeNextStep = (i) => setForm({ ...form, nextSteps: form.nextSteps.filter((_,idx) => idx !== i) });

  const fj = (k) => (e) => setJobForm({ ...jobForm, [k]: e.target.value });
  const fp = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const visiblePipeline = pipeline.filter(o => { const buMatch = activeBU === "all" ? (filterBU === "all" || o.bu === filterBU) : o.bu === activeBU; return buMatch && (o.name.toLowerCase().includes(search.toLowerCase()) || (o.contact||"").toLowerCase().includes(search.toLowerCase())); });
  const stages = PIPELINE_STAGES[activeBU === "all" ? (filterBU === "all" ? "all" : filterBU) : activeBU];
  const totalPipeline = visiblePipeline.filter(o => !["Won","Lost"].includes(o.stage)).reduce((s,o) => s+o.value, 0);
  const totalWon = visiblePipeline.filter(o => o.stage === "Won").reduce((s,o) => s+o.value, 0);
  const winRate = (() => { const closed = visiblePipeline.filter(o => ["Won","Lost"].includes(o.stage)); return closed.length ? Math.round((visiblePipeline.filter(o => o.stage === "Won").length / closed.length) * 100) : 0; })();

  const GanttSection = ({ jobList, showAddBtn = false }) => {
    const months = getGanttMonths(jobList);
    const tStart = months.length ? new Date(months[0].year, months[0].month, 1) : new Date();
    const tEnd = months.length ? new Date(months[months.length-1].year, months[months.length-1].month+1, 1) : new Date();
    const tMs = tEnd - tStart;
    const tPct = tMs > 0 ? Math.max(0, Math.min(100, ((new Date()-tStart)/tMs)*100)) : 0;
    return (
      <div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <div>
            <div style={{ fontSize:13, fontWeight:600, color:"#FFFFFF", textTransform:"uppercase", letterSpacing:"0.06em" }}>Active Jobs — Gantt</div>
            <div style={{ fontSize:11, color:"#3A4560", marginTop:2 }}>{jobList.length} job{jobList.length!==1?"s":""} · {fmt(jobList.reduce((s,j)=>s+j.contractValue,0))} total</div>
          </div>
          {showAddBtn && <button className="btn-primary" onClick={openAddJob}>+ Add Job</button>}
        </div>
        {jobList.length === 0 ? <div style={{ textAlign:"center", padding:"32px", color:"#2A3560", fontSize:12, background:"#161B28", borderRadius:10, border:"1px solid #1E2640" }}>No active jobs</div> : (
          <div style={{ background:"#0B0E18", border:"1px solid #1E2640", borderRadius:10, overflow:"hidden" }}>
            <div style={{ display:"flex", borderBottom:"1px solid #1E2640" }}>
              <div style={{ width:280, flexShrink:0, padding:"8px 16px", fontSize:10, color:"#3A4560", textTransform:"uppercase", letterSpacing:"0.08em", borderRight:"1px solid #1E2640" }}>JOB</div>
              <div style={{ flex:1, display:"grid", gridTemplateColumns:`repeat(${months.length},1fr)` }}>
                {months.map((m,i) => <div key={i} style={{ padding:"8px 6px", fontSize:10, textTransform:"uppercase", textAlign:"center", borderRight:i<months.length-1?"1px solid #1A2035":"none", fontWeight:m.month===new Date().getMonth()&&m.year===new Date().getFullYear()?700:400, color:m.month===new Date().getMonth()&&m.year===new Date().getFullYear()?"#3B6FE8":"#4A5270" }}>{MONTHS[m.month]} {m.year!==new Date().getFullYear()?m.year:""}</div>)}
              </div>
            </div>
            {jobList.map((job,idx) => {
              const bar = getBarStyle(job, months);
              const sc = STATUS_CONFIG[job.status]||STATUS_CONFIG["On Schedule"];
              return (
                <div key={job.id} style={{ display:"flex", borderBottom:idx<jobList.length-1?"1px solid #1A2035":"none", cursor:"pointer" }} onMouseEnter={e=>e.currentTarget.style.background="#111520"} onMouseLeave={e=>e.currentTarget.style.background="transparent"} onClick={()=>setSelectedJob(job)}>
                  <div style={{ width:280, flexShrink:0, padding:"12px 16px", borderRight:"1px solid #1E2640" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                      <div style={{ width:6, height:6, borderRadius:"50%", background:sc.color, flexShrink:0 }} />
                      <span style={{ fontSize:12, color:"#E8ECF4", fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{job.name}</span>
                    </div>
                    <div style={{ fontSize:11, color:"#3A4560", marginBottom:4, paddingLeft:14 }}>{job.client}</div>
                    <div style={{ display:"flex", gap:8, paddingLeft:14 }}><span style={{ fontSize:12, color:"#3B6FE8", fontWeight:600 }}>{fmt(job.contractValue)}</span><span style={{ fontSize:10, color:"#3A4560" }}>· {job.pm}</span></div>
                  </div>
                  <div style={{ flex:1, position:"relative", padding:"12px 0", minHeight:56 }}>
                    <div style={{ position:"absolute", left:`${tPct}%`, top:0, bottom:0, width:1, background:"#3B6FE840", zIndex:1 }} />
                    {months.map((_,i) => i>0 && <div key={i} style={{ position:"absolute", left:`${(i/months.length)*100}%`, top:0, bottom:0, width:1, background:"#1A2035" }} />)}
                    <div style={{ position:"absolute", top:"50%", transform:"translateY(-50%)", left:bar.left, width:bar.width, height:28, borderRadius:6, background:sc.bg, border:`1px solid ${sc.color}50`, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${job.pct}%`, background:sc.color+"40", borderRadius:"5px 0 0 5px" }} />
                      <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", paddingLeft:8, gap:6 }}>
                        <span style={{ fontSize:10, color:sc.color, fontWeight:600, whiteSpace:"nowrap" }}>{job.pct}%</span>
                        <span style={{ fontSize:10, color:sc.color, opacity:0.7, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{job.name}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div style={{ position:"relative", height:20, borderTop:"1px solid #1A2035" }}>
              <div style={{ position:"absolute", left:`calc(280px + ${tPct}% * (100% - 280px) / 100)`, transform:"translateX(-50%)", fontSize:9, color:"#3B6FE8", top:4 }}>TODAY</div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Customer picker component used in forms
  const CustomerPicker = ({ companyId, contactId, onCompanyChange, onContactChange, showInline = true }) => {
    const companyContacts = contacts.filter(p => p.companyId === companyId);
    return (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  {(selectedOpp.nextSteps||[]).map((ns,i) => {
                    const nsOverdue = ns.dueDate && new Date(ns.dueDate) < new Date();
                    return (
                      <div key={i} className="ns-row">
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <div style={{ width:6, height:6, borderRadius:"50%", background:nsOverdue?"#F87171":"#3B6FE8", flexShrink:0 }} />
                          <span style={{ fontSize:12, color:"#E8ECF4", fontWeight:500 }}>{ns.step}</span>
                        </div>
                        <span style={{ fontSize:11, color:nsOverdue?"#F87171":"#3A4560" }}>{ns.dueDate||"No date"}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {selectedOpp.closeDate && <div style={{ fontSize:11, color:"#3A4560" }}><span style={{ color:"#4A5270" }}>Expected Close: </span>{selectedOpp.closeDate}</div>}
            {selectedOpp.notes && <div style={{ fontSize:12, color:"#6B7694", lineHeight:1.6, background:"#0A0D16", padding:"10px 12px", borderRadius:6, border:"1px solid #1E2640" }}>{selectedOpp.notes}</div>}
            <div style={{ display:"flex", gap:8 }}>
              <button className="btn-ghost" style={{ flex:1 }} onClick={()=>{openEdit(selectedOpp);setSelectedOpp(null);}}>✎ Edit</button>
              <button className="btn-ghost" style={{ color:"#F87171", borderColor:"#F8717120" }} onClick={()=>deleteOpp(selectedOpp.id)}>✕</button>
            </div>
          </div>
        </div>
      )}

      {/* JOB FORM */}
      {showJobForm && (
        <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&setShowJobForm(false)}>
          <div className="modal fade-in">
            <div style={{ fontSize:16, fontWeight:700, color:"#FFFFFF", marginBottom:22, textTransform:"uppercase", letterSpacing:"0.04em" }}>{editJobId!==null?"Edit Job":"Add Active Job"}</div>
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div><label className="lbl">Job Name *</label><input className="fi" value={jobForm.name} onChange={fj("name")} placeholder="e.g. Riverside Community Center" /></div>
              <CustomerPicker
                companyId={jobForm.companyId}
                contactId={jobForm.contactId||""}
                onCompanyChange={val=>setJobForm({...jobForm,companyId:val,client:companies.find(c=>c.id===val)?.name||""})}
                onContactChange={val=>setJobForm({...jobForm,contactId:val})}
              />
              <div className="g2">
                <div><label className="lbl">Contract Value</label><input className="fi" type="number" value={jobForm.contractValue} onChange={fj("contractValue")} placeholder="0" /></div>
                <div><label className="lbl">Project Manager</label><input className="fi" value={jobForm.pm} onChange={fj("pm")} placeholder="Name" /></div>
              </div>
              <div className="g2">
                <div><label className="lbl">Start Date</label><input className="fi" type="date" value={jobForm.startDate} onChange={fj("startDate")} /></div>
                <div><label className="lbl">End Date</label><input className="fi" type="date" value={jobForm.endDate} onChange={fj("endDate")} /></div>
              </div>
              <div><label className="lbl">Status</label>
                <select className="fi" value={jobForm.status} onChange={fj("status")}>
                  {["On Schedule","Behind Schedule","At Risk"].map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
              <div><label className="lbl">% Complete — {jobForm.pct}%</label><input type="range" min="0" max="100" value={jobForm.pct} onChange={fj("pct")} /></div>
              <div><label className="lbl">Notes</label><textarea className="fi" rows={3} value={jobForm.notes} onChange={fj("notes")} placeholder="Key updates…" style={{ resize:"vertical" }} /></div>
              <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:6 }}>
                <button className="btn-ghost" style={{ padding:"8px 16px" }} onClick={()=>setShowJobForm(false)}>Cancel</button>
                <button className="btn-primary" onClick={saveJob}>{editJobId!==null?"Save Changes":"Add Job"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OPP FORM */}
      {showForm && (
        <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&setShowForm(false)}>
          <div className="modal fade-in">
            <div style={{ fontSize:16, fontWeight:700, color:"#FFFFFF", marginBottom:22, textTransform:"uppercase", letterSpacing:"0.04em" }}>{editId!==null?"Edit":"Add"} — {form.stage}</div>
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div><label className="lbl">Opportunity Name *</label><input className="fi" value={form.name} onChange={fp("name")} placeholder="e.g. Riverside Community Center" /></div>
              <CustomerPicker
                companyId={form.companyId}
                contactId={form.contactId}
                onCompanyChange={val=>setForm({...form,companyId:val,contactId:""})}
                onContactChange={val=>setForm({...form,contactId:val})}
              />
              <div className="g2">
                <div><label className="lbl">Business Unit</label>
                  <select className="fi" value={form.bu} onChange={e=>setForm({...form,bu:e.target.value,stage:PIPELINE_STAGES[e.target.value]?.[0]||"Lead"})}>
                    {BUSINESS_UNITS.filter(b=>b.id!=="all").map(b=><option key={b.id} value={b.id}>{b.label}</option>)}
                  </select>
                </div>
                <div><label className="lbl">Stage</label>
                  <select className="fi" value={form.stage} onChange={fp("stage")}>
                    {(PIPELINE_STAGES[form.bu]||PIPELINE_STAGES.all).map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div><label className="lbl">Estimated Value *</label><input className="fi" type="number" value={form.value} onChange={fp("value")} placeholder="0" /></div>
              {form.stage==="Budgeting" && <div><label className="lbl">Budget Due Date</label><input className="fi" type="date" value={form.budgetDueDate} onChange={fp("budgetDueDate")} /></div>}
              {["Proposal / Bid","Bid Submitted"].includes(form.stage) && <div><label className="lbl">Bid Due Date</label><input className="fi" type="date" value={form.bidDueDate} onChange={fp("bidDueDate")} /></div>}
              {form.stage==="Lead" && (
                <div>
                  <label className="lbl">Next Steps</label>
                  <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:8 }}>
                    {(form.nextSteps||[]).map((ns,i) => (
                      <div key={i} className="ns-row">
                        <div style={{ display:"flex", gap:8 }}><span style={{ fontSize:12, color:"#E8ECF4" }}>{ns.step}</span><span style={{ fontSize:11, color:"#3A4560" }}>{ns.dueDate}</span></div>
                        <button className="btn-ghost" style={{ color:"#F87171", padding:"2px 6px" }} onClick={()=>removeNextStep(i)}>✕</button>
                      </div>
                    ))}
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    <select className="fi" value={newNextStep.step} onChange={e=>setNewNextStep({...newNextStep,step:e.target.value})} style={{ flex:2 }}>
                      <option value="">Select next step…</option>
                      {["Geotechnical","Engage Engineer","Underwriting","LOI","Under Contract"].map(s=><option key={s}>{s}</option>)}
                    </select>
                    <input className="fi" type="date" value={newNextStep.dueDate} onChange={e=>setNewNextStep({...newNextStep,dueDate:e.target.value})} style={{ flex:1 }} />
                    <button className="btn-ghost" onClick={addNextStep} style={{ whiteSpace:"nowrap", color:"#3B6FE8", borderColor:"#3B6FE840" }}>+ Add</button>
                  </div>
                </div>
              )}
              <div><label className="lbl">Expected Close Date</label><input className="fi" type="date" value={form.closeDate} onChange={fp("closeDate")} /></div>
              <div><label className="lbl">Notes</label><textarea className="fi" rows={3} value={form.notes} onChange={fp("notes")} placeholder="Key details…" style={{ resize:"vertical" }} /></div>
              <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:6 }}>
                <button className="btn-ghost" style={{ padding:"8px 16px" }} onClick={()=>setShowForm(false)}>Cancel</button>
                <button className="btn-primary" onClick={saveOpp}>{editId!==null?"Save Changes":"Add"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* COMPANY FORM */}
      {showCompanyForm && (
        <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&setShowCompanyForm(false)}>
          <div className="modal fade-in">
            <div style={{ fontSize:16, fontWeight:700, color:"#FFFFFF", marginBottom:22, textTransform:"uppercase" }}>{editCompanyId?"Edit Company":"Add Company"}</div>
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div><label className="lbl">Company Name *</label><input className="fi" value={companyForm.name} onChange={e=>setCompanyForm({...companyForm,name:e.target.value})} placeholder="e.g. Riverside City" /></div>
              <div><label className="lbl">Address</label><input className="fi" value={companyForm.address} onChange={e=>setCompanyForm({...companyForm,address:e.target.value})} placeholder="123 Main St, City, State" /></div>
              <div className="g2">
                <div><label className="lbl">Website</label><input className="fi" value={companyForm.website} onChange={e=>setCompanyForm({...companyForm,website:e.target.value})} placeholder="company.com" /></div>
                <div><label className="lbl">Logo URL</label><input className="fi" value={companyForm.logo} onChange={e=>setCompanyForm({...companyForm,logo:e.target.value})} placeholder="https://…" /></div>
              </div>
              <div><label className="lbl">Notes</label><textarea className="fi" rows={2} value={companyForm.notes} onChange={e=>setCompanyForm({...companyForm,notes:e.target.value})} style={{ resize:"vertical" }} /></div>
              <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
                <button className="btn-ghost" style={{ padding:"8px 16px" }} onClick={()=>setShowCompanyForm(false)}>Cancel</button>
                <button className="btn-primary" onClick={saveCompany}>{editCompanyId?"Save Changes":"Add Company"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONTACT FORM */}
      {showContactForm && (
        <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&setShowContactForm(false)}>
          <div className="modal fade-in">
            <div style={{ fontSize:16, fontWeight:700, color:"#FFFFFF", marginBottom:22, textTransform:"uppercase" }}>{editContactId?"Edit Contact":"Add Contact"}</div>
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div><label className="lbl">Company</label>
                <select className="fi" value={contactForm.companyId} onChange={e=>setContactForm({...contactForm,companyId:e.target.value})}>
                  <option value="">Select company…</option>
                  {companies.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="g2">
                <div><label className="lbl">First Name *</label><input className="fi" value={contactForm.firstName} onChange={e=>setContactForm({...contactForm,firstName:e.target.value})} /></div>
                <div><label className="lbl">Last Name</label><input className="fi" value={contactForm.lastName} onChange={e=>setContactForm({...contactForm,lastName:e.target.value})} /></div>
              </div>
              <div><label className="lbl">Title / Role</label><input className="fi" value={contactForm.title} onChange={e=>setContactForm({...contactForm,title:e.target.value})} placeholder="e.g. Project Director" /></div>
              <div className="g2">
                <div><label className="lbl">Email</label><input className="fi" value={contactForm.email} onChange={e=>setContactForm({...contactForm,email:e.target.value})} /></div>
                <div><label className="lbl">Phone</label><input className="fi" value={contactForm.phone} onChange={e=>setContactForm({...contactForm,phone:e.target.value})} /></div>
              </div>
              <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
                <button className="btn-ghost" style={{ padding:"8px 16px" }} onClick={()=>setShowContactForm(false)}>Cancel</button>
                <button className="btn-primary" onClick={saveContact}>{editContactId?"Save Changes":"Add Contact"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
