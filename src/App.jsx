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
    { id: "sites", label: "Sites", icon: "📍" },
    { id: "pipeline", label: "Pipeline", icon: "◈" },
    { id: "budgeting", label: "Budgeting", icon: "💲" },
    { id: "team", label: "Team", icon: "👥" },
    { id: "customers", label: "Customers", icon: "🤝" },
  ],
  facility: [
    { id: "dashboard", label: "Dashboard", icon: "⊞" },
    { id: "calendar", label: "Calendar", icon: "📅" },
    { id: "jobs", label: "Active Jobs", icon: "🔨" },
    { id: "sites", label: "Sites", icon: "📍" },
    { id: "bids", label: "Bids", icon: "📋" },
    { id: "pipeline", label: "Pipeline", icon: "◈" },
    { id: "budgeting", label: "Budgeting", icon: "💲" },
    { id: "team", label: "Team", icon: "👥" },
    { id: "customers", label: "Customers", icon: "🤝" },
  ],
  lawn: [
    { id: "dashboard", label: "Dashboard", icon: "⊞" },
    { id: "calendar", label: "Calendar", icon: "📅" },
    { id: "sites", label: "Sites", icon: "📍" },
    { id: "budgeting", label: "Budgeting", icon: "💲" },
    { id: "team", label: "Team", icon: "👥" },
    { id: "customers", label: "Customers", icon: "🤝" },
  ],
  snow: [
    { id: "dashboard", label: "Dashboard", icon: "⊞" },
    { id: "calendar", label: "Calendar", icon: "📅" },
    { id: "sites", label: "Sites", icon: "📍" },
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
  major:    { jobs: 3,  pipeline: "$1.2M", budget: "$980K", label: "Major Projects" },
  capital:  { jobs: 2,  pipeline: "$540K", budget: "$410K", label: "Capital Improvements" },
  facility: { jobs: 7,  pipeline: "$88K",  budget: "$72K",  label: "Facility Maintenance" },
  lawn:     { jobs: 14, pipeline: "$32K",  budget: "$28K",  label: "Lawn" },
  snow:     { jobs: 9,  pipeline: "$65K",  budget: "$58K",  label: "Snow" },
};

const PUNCH_LIST_STATIC = [
  { id: "s1", text: "Schedule crew for Elm St. maintenance", bu: "facility", priority: "medium", dueDate: null },
  { id: "s2", text: "Review Q1 lawn budget variance",        bu: "lawn",     priority: "medium", dueDate: null },
  { id: "s3", text: "Confirm snow routes for weekend",       bu: "snow",     priority: "high",   dueDate: null },
];

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const fmt = (v) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v || 0);
const dayName = () => new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

function getGanttMonths(jobs) {
  if (!jobs.length) {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }
  const starts = jobs.map(j => new Date(j.startDate));
  const ends   = jobs.map(j => new Date(j.endDate));
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
  const totalEnd   = new Date(months[months.length - 1].year, months[months.length - 1].month + 1, 1);
  const totalMs    = totalEnd - totalStart;
  const jobStart   = new Date(job.startDate);
  const jobEnd     = new Date(job.endDate);
  const left  = Math.max(0, (jobStart - totalStart) / totalMs) * 100;
  const right = Math.min(1, (jobEnd   - totalStart) / totalMs) * 100;
  return { left: left + "%", width: Math.max(0.5, right - left) + "%" };
}

const INIT_COMPANIES = [
  { id: "c1", name: "Riverside City",          website: "riverside.gov",  address: "100 City Hall Rd, Riverside, NJ",  logo: "", notes: "" },
  { id: "c2", name: "Elmwood School District",  website: "elmwood.edu",    address: "200 School Ave, Elmwood, NJ",       logo: "", notes: "" },
  { id: "c3", name: "Harbor View LLC",          website: "harborview.com", address: "300 Harbor Blvd, Newark, NJ",       logo: "", notes: "" },
  { id: "c4", name: "Eastside Development",     website: "eastside.com",   address: "400 Eastside Dr, Trenton, NJ",      logo: "", notes: "" },
];

const INIT_CONTACTS = [
  { id: "p1", companyId: "c1", firstName: "Mike",  lastName: "Johnson", title: "Project Director", email: "mike@riverside.gov",  phone: "609-555-0101" },
  { id: "p2", companyId: "c1", firstName: "Dana",  lastName: "Cruz",    title: "Procurement",      email: "dana@riverside.gov",  phone: "609-555-0102" },
  { id: "p3", companyId: "c2", firstName: "Sara",  lastName: "Lee",     title: "Facilities Mgr",   email: "sara@elmwood.edu",    phone: "732-555-0201" },
  { id: "p4", companyId: "c3", firstName: "Bob",   lastName: "Harris",  title: "Owner",            email: "bob@harborview.com",  phone: "201-555-0301" },
  { id: "p5", companyId: "c4", firstName: "Dev",   lastName: "Patel",   title: "VP Development",   email: "dev@eastside.com",    phone: "609-555-0401" },
];

const INIT_PIPELINE = [
  { id: 1, name: "Riverside Community Center",  companyId: "c1", contactId: "p1", value: 450000, stage: "Negotiation",   closeDate: "2026-04-15", notes: "Final contract review", bu: "major",    budgetDueDate: "",           bidDueDate: "",           nextSteps: [] },
  { id: 2, name: "Elmwood School Renovation",   companyId: "c2", contactId: "p3", value: 280000, stage: "Proposal / Bid",closeDate: "2026-03-28", notes: "Submitted last Tuesday",bu: "major",    budgetDueDate: "",           bidDueDate: "2026-03-28", nextSteps: [] },
  { id: 3, name: "Oak Street Parking Lot",      companyId: "c3", contactId: "p4", value:  95000, stage: "Lead",          closeDate: "2026-05-01", notes: "Initial inquiry",       bu: "capital",  budgetDueDate: "",           bidDueDate: "",           nextSteps: [] },
  { id: 4, name: "Eastside Budget Scope",       companyId: "c4", contactId: "p5", value: 320000, stage: "Budgeting",     closeDate: "",           notes: "Early scoping",         bu: "major",    budgetDueDate: "2026-03-17", bidDueDate: "",           nextSteps: [] },
  { id: 5, name: "Central Park Redevelopment",  companyId: "c1", contactId: "p2", value: 580000, stage: "Lead",          closeDate: "2026-06-01", notes: "Referral",              bu: "major",    budgetDueDate: "",           bidDueDate: "",           nextSteps: [{ step: "Geotechnical", dueDate: "2026-03-14" }, { step: "Engage Engineer", dueDate: "2026-03-21" }] },
];

const INIT_JOBS = [
  { id: 1, name: "Riverside Community Center", companyId: "c1", client: "Riverside City",         contractValue: 450000, startDate: "2026-02-01", endDate: "2026-06-30", pm: "John Smith",  pct: 35, status: "On Schedule",     notes: "Foundation complete", bu: "major" },
  { id: 2, name: "Elmwood School Renovation",  companyId: "c2", client: "Elmwood School District", contractValue: 280000, startDate: "2026-03-15", endDate: "2026-08-15", pm: "Sarah Lee",   pct: 10, status: "On Schedule",     notes: "Permits approved",    bu: "major" },
  { id: 3, name: "Harbor View Expansion",      companyId: "c3", client: "Harbor View LLC",         contractValue: 620000, startDate: "2026-01-10", endDate: "2026-09-30", pm: "Mike Torres", pct: 52, status: "Behind Schedule", notes: "Weather delays",      bu: "major" },
];

const INIT_SITES = [
  { id: "s1", companyId: "c2", contactIds: ["p3"], storeNumber: "001", address: "200 School Ave, Elmwood, NJ", phone: "732-555-0210", accessCode: "1234", notes: "" },
  { id: "s2", companyId: "c3", contactIds: ["p4"], storeNumber: "002", address: "300 Harbor Blvd, Newark, NJ", phone: "201-555-0310", accessCode: "5678", notes: "" },
];

const NEXT_STEP_OPTIONS = ["Geotechnical", "Engage Engineer", "Underwriting", "LOI", "Under Contract"];
const SITES_BUS = ["capital", "facility", "lawn", "snow"];

export default function App() {
  const [activeBU,  setActiveBU]  = useState("all");
  const [activeNav, setActiveNav] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // CRM
  const [companies,       setCompanies]       = useState(INIT_COMPANIES);
  const [contacts,        setContacts]        = useState(INIT_CONTACTS);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [editCompanyId,   setEditCompanyId]   = useState(null);
  const [editContactId,   setEditContactId]   = useState(null);
  const [companyForm, setCompanyForm] = useState({ name: "", website: "", address: "", logo: "", notes: "" });
  const [contactForm, setContactForm] = useState({ companyId: "", firstName: "", lastName: "", title: "", email: "", phone: "" });
  const [crmSearch,   setCrmSearch]   = useState("");

  // Inline add
  const [showInlineCompany, setShowInlineCompany] = useState(false);
  const [showInlineContact, setShowInlineContact] = useState(false);
  const [inlineCompany, setInlineCompany] = useState({ name: "", website: "", address: "", logo: "", notes: "" });
  const [inlineContact, setInlineContact] = useState({ firstName: "", lastName: "", title: "", email: "", phone: "" });

  // Pipeline
  const [pipeline,     setPipeline]     = useState(INIT_PIPELINE);
  const [showForm,     setShowForm]     = useState(false);
  const [editId,       setEditId]       = useState(null);
  const [form,         setForm]         = useState({ name: "", companyId: "", contactId: "", value: "", stage: "Budgeting", closeDate: "", notes: "", bu: "major", budgetDueDate: "", bidDueDate: "", nextSteps: [] });
  const [pipelineView, setPipelineView] = useState("kanban");
  const [filterBU,     setFilterBU]     = useState("all");
  const [search,       setSearch]       = useState("");
  const [selectedOpp,  setSelectedOpp]  = useState(null);
  const [newNextStep,  setNewNextStep]  = useState({ step: "", dueDate: "" });

  // Jobs
  const [jobs,        setJobs]        = useState(INIT_JOBS);
  const [showJobForm, setShowJobForm] = useState(false);
  const [editJobId,   setEditJobId]   = useState(null);
  const [jobForm,     setJobForm]     = useState({ name: "", companyId: "", client: "", contractValue: "", startDate: "", endDate: "", pm: "", pct: 0, status: "On Schedule", notes: "", bu: "major" });
  const [selectedJob, setSelectedJob] = useState(null);

  // Sites
  const [sites,        setSites]        = useState(INIT_SITES);
  const [showSiteForm, setShowSiteForm] = useState(false);
  const [editSiteId,   setEditSiteId]   = useState(null);
  const [siteForm,     setSiteForm]     = useState({ companyId: "", contactIds: [], storeNumber: "", address: "", phone: "", accessCode: "", notes: "" });
  const [selectedSite, setSelectedSite] = useState(null);
  const [siteSearch,   setSiteSearch]   = useState("");

  const navItems = NAV_ITEMS[activeBU] || NAV_ITEMS.all;
  const buColor  = BU_COLORS[activeBU];

  const handleBUChange = (id) => { setActiveBU(id); setActiveNav("dashboard"); };

  // Punch list
  const dynamicPunchList = useMemo(() => {
    const items = [...PUNCH_LIST_STATIC];
    const today = new Date();
    const soon  = new Date(today.getTime() + 7 * 86400000);
    const urgent = new Date(today.getTime() + 2 * 86400000);
    pipeline.forEach(o => {
      if (o.budgetDueDate) {
        const d = new Date(o.budgetDueDate);
        if (d >= today && d <= soon) items.push({ id: "budget-" + o.id, text: "Budget due: " + o.name, bu: o.bu, priority: d <= urgent ? "high" : "medium", dueDate: o.budgetDueDate, tag: "BUDGET DUE" });
      }
      if (o.bidDueDate) {
        const d = new Date(o.bidDueDate);
        if (d >= today && d <= soon) items.push({ id: "bid-" + o.id, text: "Bid due: " + o.name, bu: o.bu, priority: d <= urgent ? "high" : "medium", dueDate: o.bidDueDate, tag: "BID DUE" });
      }
      (o.nextSteps || []).forEach((ns, i) => {
        if (ns.dueDate) {
          const d = new Date(ns.dueDate);
          if (d >= today && d <= soon) items.push({ id: "ns-" + o.id + "-" + i, text: ns.step + ": " + o.name, bu: o.bu, priority: d <= urgent ? "high" : "medium", dueDate: ns.dueDate, tag: ns.step.toUpperCase() });
        }
      });
    });
    return items.sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    });
  }, [pipeline]);

  const majorJobs = jobs.filter(j => j.bu === "major");

  // CRM helpers
  const getCompanyContacts  = (cid) => contacts.filter(p => p.companyId === cid);
  const getCompanyJobs      = (cid) => jobs.filter(j => j.companyId === cid);
  const getCompanyPipeline  = (cid) => pipeline.filter(o => o.companyId === cid);
  const getCompanyTotalValue = (cid) => jobs.filter(j => j.companyId === cid).reduce((s, j) => s + j.contractValue, 0);
  const getCompanySites     = (cid) => sites.filter(s => s.companyId === cid);

  // Site helpers
  const openAddSite = () => { setEditSiteId(null); setSiteForm({ companyId: "", contactIds: [], storeNumber: "", address: "", phone: "", accessCode: "", notes: "" }); setShowSiteForm(true); };
  const openEditSite = (s) => { setEditSiteId(s.id); setSiteForm({ ...s }); setShowSiteForm(true); };
  const saveSite = () => {
    if (!siteForm.storeNumber.trim() && !siteForm.address.trim()) return;
    if (editSiteId) setSites(sites.map(s => s.id === editSiteId ? { ...siteForm, id: editSiteId } : s));
    else setSites([...sites, { ...siteForm, id: "s" + Date.now() }]);
    setShowSiteForm(false);
  };
  const deleteSite = (id) => { setSites(sites.filter(s => s.id !== id)); setSelectedSite(null); };
  const toggleSiteContact = (contactId) => {
    const ids = siteForm.contactIds || [];
    setSiteForm(f => ({ ...f, contactIds: ids.includes(contactId) ? ids.filter(i => i !== contactId) : [...ids, contactId] }));
  };

  const saveCompany = () => {
    if (!companyForm.name.trim()) return;
    if (editCompanyId) setCompanies(companies.map(c => c.id === editCompanyId ? { ...companyForm, id: editCompanyId } : c));
    else setCompanies([...companies, { ...companyForm, id: "c" + Date.now() }]);
    setShowCompanyForm(false); setEditCompanyId(null);
    setCompanyForm({ name: "", website: "", address: "", logo: "", notes: "" });
  };

  const saveContact = () => {
    if (!contactForm.firstName.trim()) return;
    if (editContactId) setContacts(contacts.map(p => p.id === editContactId ? { ...contactForm, id: editContactId } : p));
    else setContacts([...contacts, { ...contactForm, id: "p" + Date.now() }]);
    setShowContactForm(false); setEditContactId(null);
    setContactForm({ companyId: "", firstName: "", lastName: "", title: "", email: "", phone: "" });
  };

  const addInlineCompany = () => {
    if (!inlineCompany.name.trim()) return;
    const newId = "c" + Date.now();
    setCompanies([...companies, { ...inlineCompany, id: newId }]);
    setForm(f => ({ ...f, companyId: newId, contactId: "" }));
    setJobForm(f => ({ ...f, companyId: newId, client: inlineCompany.name }));
    setShowInlineCompany(false);
    setInlineCompany({ name: "", website: "", address: "", logo: "", notes: "" });
  };

  const addInlineContact = () => {
    if (!inlineContact.firstName.trim()) return;
    const newId  = "p" + Date.now();
    const compId = form.companyId || jobForm.companyId;
    setContacts([...contacts, { ...inlineContact, id: newId, companyId: compId }]);
    setForm(f => ({ ...f, contactId: newId }));
    setJobForm(f => ({ ...f, contactId: newId }));
    setShowInlineContact(false);
    setInlineContact({ firstName: "", lastName: "", title: "", email: "", phone: "" });
  };

  // Job helpers
  const openAddJob = () => {
    setEditJobId(null);
    setJobForm({ name: "", companyId: "", client: "", contractValue: "", startDate: "", endDate: "", pm: "", pct: 0, status: "On Schedule", notes: "", bu: activeBU === "all" ? "major" : activeBU });
    setShowJobForm(true);
  };
  const openEditJob = (j) => { setEditJobId(j.id); setJobForm({ ...j, contractValue: String(j.contractValue) }); setShowJobForm(true); };
  const saveJob = () => {
    if (!jobForm.name.trim()) return;
    const co    = companies.find(c => c.id === jobForm.companyId);
    const entry = { ...jobForm, contractValue: Number(jobForm.contractValue), pct: Number(jobForm.pct), client: co ? co.name : jobForm.client };
    if (editJobId !== null) setJobs(jobs.map(j => j.id === editJobId ? { ...entry, id: editJobId } : j));
    else setJobs([...jobs, { ...entry, id: Date.now() }]);
    setShowJobForm(false);
  };
  const deleteJob = (id) => { setJobs(jobs.filter(j => j.id !== id)); setSelectedJob(null); };

  // Pipeline helpers
  const openAdd = (defaultStage) => {
    setEditId(null);
    setForm({ name: "", companyId: "", contactId: "", value: "", stage: defaultStage || "Budgeting", closeDate: "", notes: "", bu: activeBU === "all" ? "major" : activeBU, budgetDueDate: "", bidDueDate: "", nextSteps: [] });
    setShowForm(true);
  };
  const openEdit = (o) => {
    setEditId(o.id);
    setForm({ ...o, value: String(o.value), nextSteps: o.nextSteps || [], budgetDueDate: o.budgetDueDate || "", bidDueDate: o.bidDueDate || "" });
    setShowForm(true);
  };
  const saveOpp = () => {
    if (!form.name.trim() || !form.value) return;
    const ct    = contacts.find(p => p.id === form.contactId);
    const entry = { ...form, value: Number(form.value), contact: ct ? ct.email : "" };
    if (editId !== null) {
      setPipeline(pipeline.map(o => o.id === editId ? { ...entry, id: editId } : o));
      if (selectedOpp && selectedOpp.id === editId) setSelectedOpp({ ...entry, id: editId });
    } else {
      setPipeline([...pipeline, { ...entry, id: Date.now() }]);
    }
    setShowForm(false);
  };
  const deleteOpp  = (id) => { setPipeline(pipeline.filter(o => o.id !== id)); setSelectedOpp(null); };
  const moveStage  = (id, dir) => setPipeline(pipeline.map(o => {
    if (o.id !== id) return o;
    const stgs = PIPELINE_STAGES[o.bu] || PIPELINE_STAGES.all;
    const idx  = stgs.indexOf(o.stage);
    return { ...o, stage: stgs[Math.max(0, Math.min(stgs.length - 1, idx + dir))] };
  }));
  const addNextStep    = () => { if (!newNextStep.step) return; setForm(f => ({ ...f, nextSteps: [...(f.nextSteps || []), { ...newNextStep }] })); setNewNextStep({ step: "", dueDate: "" }); };
  const removeNextStep = (i) => setForm(f => ({ ...f, nextSteps: f.nextSteps.filter((_, idx) => idx !== i) }));

  const fj = (k) => (e) => setJobForm(f => ({ ...f, [k]: e.target.value }));
  const fp = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const buForFilter    = activeBU === "all" ? (filterBU === "all" ? "all" : filterBU) : activeBU;
  const stages         = PIPELINE_STAGES[buForFilter] || PIPELINE_STAGES.all;
  const visiblePipeline = pipeline.filter(o => {
    const buOk = activeBU === "all" ? (filterBU === "all" || o.bu === filterBU) : o.bu === activeBU;
    const q    = search.toLowerCase();
    return buOk && (o.name.toLowerCase().includes(q) || (o.contact || "").toLowerCase().includes(q));
  });
  const totalPipeline = visiblePipeline.filter(o => !["Won", "Lost"].includes(o.stage)).reduce((s, o) => s + o.value, 0);
  const totalWon      = visiblePipeline.filter(o => o.stage === "Won").reduce((s, o) => s + o.value, 0);
  const closedOpps    = visiblePipeline.filter(o => ["Won", "Lost"].includes(o.stage));
  const wonOpps       = visiblePipeline.filter(o => o.stage === "Won");
  const winRate       = closedOpps.length ? Math.round((wonOpps.length / closedOpps.length) * 100) : 0;

  // ── Gantt ──────────────────────────────────────────────────────────────────
  const GanttSection = ({ jobList, showAddBtn }) => {
    const months = getGanttMonths(jobList);
    const tStart = months.length ? new Date(months[0].year, months[0].month, 1) : new Date();
    const tEnd   = months.length ? new Date(months[months.length - 1].year, months[months.length - 1].month + 1, 1) : new Date();
    const tMs    = tEnd - tStart;
    const tPct   = tMs > 0 ? Math.max(0, Math.min(100, ((new Date() - tStart) / tMs) * 100)) : 0;
    const nowM   = new Date().getMonth();
    const nowY   = new Date().getFullYear();
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#FFFFFF", textTransform: "uppercase", letterSpacing: "0.06em" }}>Active Jobs — Gantt</div>
            <div style={{ fontSize: 11, color: "#3A4560", marginTop: 2 }}>{jobList.length} job{jobList.length !== 1 ? "s" : ""} · {fmt(jobList.reduce((s, j) => s + j.contractValue, 0))} total</div>
          </div>
          {showAddBtn && <button className="btn-primary" onClick={openAddJob}>+ Add Job</button>}
        </div>
        {jobList.length === 0
          ? <div style={{ textAlign: "center", padding: "32px", color: "#2A3560", fontSize: 12, background: "#161B28", borderRadius: 10, border: "1px solid #1E2640" }}>No active jobs</div>
          : (
            <div style={{ background: "#0B0E18", border: "1px solid #1E2640", borderRadius: 10, overflow: "hidden" }}>
              <div style={{ display: "flex", borderBottom: "1px solid #1E2640" }}>
                <div style={{ width: 280, flexShrink: 0, padding: "8px 16px", fontSize: 10, color: "#3A4560", textTransform: "uppercase", letterSpacing: "0.08em", borderRight: "1px solid #1E2640" }}>JOB</div>
                <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(" + months.length + ", 1fr)" }}>
                  {months.map((m, i) => (
                    <div key={i} style={{ padding: "8px 6px", fontSize: 10, textTransform: "uppercase", textAlign: "center", borderRight: i < months.length - 1 ? "1px solid #1A2035" : "none", fontWeight: m.month === nowM && m.year === nowY ? 700 : 400, color: m.month === nowM && m.year === nowY ? "#3B6FE8" : "#4A5270" }}>
                      {MONTHS[m.month]}{m.year !== nowY ? " " + m.year : ""}
                    </div>
                  ))}
                </div>
              </div>
              {jobList.map((job, idx) => {
                const bar = getBarStyle(job, months);
                const sc  = STATUS_CONFIG[job.status] || STATUS_CONFIG["On Schedule"];
                return (
                  <div key={job.id} style={{ display: "flex", borderBottom: idx < jobList.length - 1 ? "1px solid #1A2035" : "none", cursor: "pointer" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#111520"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    onClick={() => setSelectedJob(job)}>
                    <div style={{ width: 280, flexShrink: 0, padding: "12px 16px", borderRight: "1px solid #1E2640" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: sc.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: "#E8ECF4", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{job.name}</span>
                      </div>
                      <div style={{ fontSize: 11, color: "#3A4560", marginBottom: 4, paddingLeft: 14 }}>{job.client}</div>
                      <div style={{ display: "flex", gap: 8, paddingLeft: 14 }}>
                        <span style={{ fontSize: 12, color: "#3B6FE8", fontWeight: 600 }}>{fmt(job.contractValue)}</span>
                        <span style={{ fontSize: 10, color: "#3A4560" }}>· {job.pm}</span>
                      </div>
                    </div>
                    <div style={{ flex: 1, position: "relative", padding: "12px 0", minHeight: 56 }}>
                      <div style={{ position: "absolute", left: tPct + "%", top: 0, bottom: 0, width: 1, background: "#3B6FE840", zIndex: 1 }} />
                      {months.map((_, i) => i > 0 && <div key={i} style={{ position: "absolute", left: ((i / months.length) * 100) + "%", top: 0, bottom: 0, width: 1, background: "#1A2035" }} />)}
                      <div style={{ position: "absolute", top: "50%", transform: "translateY(-50%)", left: bar.left, width: bar.width, height: 28, borderRadius: 6, background: sc.bg, border: "1px solid " + sc.color + "50", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: job.pct + "%", background: sc.color + "40", borderRadius: "5px 0 0 5px" }} />
                        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", paddingLeft: 8, gap: 6 }}>
                          <span style={{ fontSize: 10, color: sc.color, fontWeight: 600, whiteSpace: "nowrap" }}>{job.pct}%</span>
                          <span style={{ fontSize: 10, color: sc.color, opacity: 0.7, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{job.name}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div style={{ position: "relative", height: 20, borderTop: "1px solid #1A2035" }}>
                <div style={{ position: "absolute", left: "calc(280px + " + tPct + "% * (100% - 280px) / 100)", transform: "translateX(-50%)", fontSize: 9, color: "#3B6FE8", top: 4 }}>TODAY</div>
              </div>
            </div>
          )}
      </div>
    );
  };

  // ── Customer Picker ────────────────────────────────────────────────────────
  const CustomerPicker = ({ companyId, contactId, onCompanyChange, onContactChange }) => {
    const compContacts = contacts.filter(p => p.companyId === companyId);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div>
          <label className="lbl">Company</label>
          <select className="fi" value={companyId} onChange={e => {
            if (e.target.value === "__new__") { setShowInlineCompany(true); }
            else { onCompanyChange(e.target.value); onContactChange(""); setShowInlineCompany(false); }
          }}>
            <option value="">Select company…</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            <option value="__new__">+ Add new company</option>
          </select>
          {showInlineCompany && (
            <div style={{ background: "#0A0D16", border: "1px solid #3B6FE840", borderRadius: 8, padding: 14, marginTop: 8, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ fontSize: 11, color: "#3B6FE8", fontWeight: 600, letterSpacing: "0.06em" }}>NEW COMPANY</div>
              <input className="fi" placeholder="Company name *" value={inlineCompany.name}    onChange={e => setInlineCompany(c => ({ ...c, name: e.target.value }))} />
              <input className="fi" placeholder="Address"        value={inlineCompany.address} onChange={e => setInlineCompany(c => ({ ...c, address: e.target.value }))} />
              <input className="fi" placeholder="Website"        value={inlineCompany.website} onChange={e => setInlineCompany(c => ({ ...c, website: e.target.value }))} />
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn-ghost"   onClick={() => setShowInlineCompany(false)} style={{ flex: 1 }}>Cancel</button>
                <button className="btn-primary" onClick={addInlineCompany}                 style={{ flex: 1 }}>Add Company</button>
              </div>
            </div>
          )}
        </div>
        {companyId && !showInlineCompany && (
          <div>
            <label className="lbl">Contact</label>
            <select className="fi" value={contactId} onChange={e => {
              if (e.target.value === "__new__") { setShowInlineContact(true); }
              else { onContactChange(e.target.value); setShowInlineContact(false); }
            }}>
              <option value="">Select contact…</option>
              {compContacts.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName} — {p.title}</option>)}
              <option value="__new__">+ Add new contact</option>
            </select>
            {showInlineContact && (
              <div style={{ background: "#0A0D16", border: "1px solid #3B6FE840", borderRadius: 8, padding: 14, marginTop: 8, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ fontSize: 11, color: "#3B6FE8", fontWeight: 600, letterSpacing: "0.06em" }}>NEW CONTACT</div>
                <div className="g2">
                  <input className="fi" placeholder="First name *" value={inlineContact.firstName} onChange={e => setInlineContact(c => ({ ...c, firstName: e.target.value }))} />
                  <input className="fi" placeholder="Last name"    value={inlineContact.lastName}  onChange={e => setInlineContact(c => ({ ...c, lastName: e.target.value }))} />
                </div>
                <input className="fi" placeholder="Title / Role" value={inlineContact.title} onChange={e => setInlineContact(c => ({ ...c, title: e.target.value }))} />
                <input className="fi" placeholder="Email"        value={inlineContact.email} onChange={e => setInlineContact(c => ({ ...c, email: e.target.value }))} />
                <input className="fi" placeholder="Phone"        value={inlineContact.phone} onChange={e => setInlineContact(c => ({ ...c, phone: e.target.value }))} />
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn-ghost"   onClick={() => setShowInlineContact(false)} style={{ flex: 1 }}>Cancel</button>
                  <button className="btn-primary" onClick={addInlineContact}                  style={{ flex: 1 }}>Add Contact</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // ── CSS ────────────────────────────────────────────────────────────────────
  const CSS = `
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
    .modal{background:#0F1117;border:1px solid #2A3560;border-radius:12px;padding:28px;width:540px;max-height:90vh;overflow-y:auto}
    .g2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
    .side-panel{position:fixed;right:0;top:52px;bottom:0;width:400px;background:#0B0E18;border-left:1px solid #1E2640;padding:24px;overflow-y:auto;z-index:40}
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
    .ns-row{display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:#0A0D16;border:1px solid #1E2640;border-radius:6px}
    .company-card{background:#161B28;border:1px solid #1E2640;border-radius:10px;padding:18px 20px;cursor:pointer;transition:all 0.15s}
    .company-card:hover{border-color:#3B6FE8;background:#1A1F30}
    .contact-chip{background:#0A0D16;border:1px solid #1E2640;border-radius:6px;padding:8px 12px;display:flex;align-items:center;justify-content:space-between}
  `;

  const panelOpen = selectedJob || selectedOpp || selectedCompany || selectedSite;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0F1117", color: "#E8ECF4", fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <style>{CSS}</style>

      {/* ── Sidebar ── */}
      <div style={{ width: sidebarCollapsed ? 60 : 200, background: "#0B0E18", borderRight: "1px solid #161B28", display: "flex", flexDirection: "column", transition: "width 0.2s", flexShrink: 0, position: "sticky", top: 0, height: "100vh", overflow: "hidden" }}>
        <div style={{ padding: "18px 16px 14px", borderBottom: "1px solid #161B28", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, background: "#3B6FE8", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0 }}>FG</div>
          {!sidebarCollapsed && <div><div style={{ fontSize: 13, fontWeight: 700, color: "#FFFFFF", letterSpacing: "0.04em" }}>FARMER</div><div style={{ fontSize: 10, color: "#3B6FE8", letterSpacing: "0.1em", fontWeight: 500 }}>GROUP</div></div>}
        </div>
        <div style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
          {navItems.map(item => (
            <button key={item.id} className={"nav-item" + (activeNav === item.id ? " active" : "")} onClick={() => setActiveNav(item.id)}
              style={activeNav === item.id ? { borderLeft: "3px solid " + buColor.accent, paddingLeft: 13 } : { borderLeft: "3px solid transparent" }}>
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

      {/* ── Main ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Topbar */}
        <div style={{ borderBottom: "1px solid #161B28", padding: "0 28px", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between", background: "#0B0E18", position: "sticky", top: 0, zIndex: 40 }}>
          <div style={{ display: "flex", gap: 4 }}>
            {BUSINESS_UNITS.map(bu => <button key={bu.id} className={"bu-tab" + (activeBU === bu.id ? " active" : "")} onClick={() => handleBUChange(bu.id)}>{bu.short}</button>)}
          </div>
          <div style={{ fontSize: 11, color: "#2A3560", letterSpacing: "0.1em", textTransform: "uppercase" }}>{BUSINESS_UNITS.find(b => b.id === activeBU)?.label}</div>
          <div style={{ background: "#1A2340", border: "1px solid #3B6FE8", color: "#3B6FE8", fontSize: 11, fontWeight: 600, padding: "4px 14px", borderRadius: 4, letterSpacing: "0.08em" }}>OWNER</div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: "28px 32px", overflowY: "auto", paddingRight: panelOpen ? "calc(32px + 420px)" : "32px", transition: "padding-right 0.2s" }}>

          {/* ── DASHBOARD ── */}
          {activeNav === "dashboard" && (
            <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 28 }}>
              <div>
                <div style={{ fontSize: 28, fontWeight: 700, color: "#FFFFFF", letterSpacing: "-0.02em" }}>GOOD MORNING, FARMER GROUP</div>
                <div style={{ fontSize: 12, color: "#3A4560", marginTop: 4, letterSpacing: "0.06em" }}>{dayName().toUpperCase()}</div>
              </div>

              {activeBU === "all" ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12 }}>
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
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                  {[
                    { label: "Pipeline Value",        value: SAMPLE_STATS[activeBU]?.pipeline,                                                              sub: "Active opportunities" },
                    { label: "Active Jobs",            value: activeBU === "major" ? majorJobs.length : SAMPLE_STATS[activeBU]?.jobs,                         sub: "In progress" },
                    { label: "Total Contract Value",   value: activeBU === "major" ? fmt(majorJobs.reduce((s, j) => s + j.contractValue, 0)) : SAMPLE_STATS[activeBU]?.budget, sub: "Active jobs" },
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

              {activeBU === "major" && <GanttSection jobList={majorJobs} showAddBtn={true} />}

              {/* Punch list */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "#3A4560", fontWeight: 600 }}>Today's Punch List</div>
                  <div style={{ fontSize: 11, color: "#3A4560" }}>{new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {dynamicPunchList.filter(p => activeBU === "all" || p.bu === activeBU).map(item => (
                    <div key={item.id} className="punch-item">
                      <div className="priority-dot" style={{ background: item.priority === "high" ? "#F87171" : "#FCD34D" }} />
                      <span style={{ fontSize: 13, color: "#B8C4E0", flex: 1 }}>{item.text}</span>
                      {item.tag && <span style={{ fontSize: 10, color: "#3B6FE8", background: "#3B6FE820", padding: "2px 8px", borderRadius: 10, letterSpacing: "0.06em", textTransform: "uppercase" }}>{item.tag}</span>}
                      {item.dueDate && <span style={{ fontSize: 10, color: "#3A4560" }}>{item.dueDate}</span>}
                      <span style={{ fontSize: 10, color: "#3A4560", background: "#1E2640", padding: "2px 8px", borderRadius: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>{BUSINESS_UNITS.find(b => b.id === item.bu)?.short}</span>
                    </div>
                  ))}
                  {dynamicPunchList.filter(p => activeBU === "all" || p.bu === activeBU).length === 0 && (
                    <div style={{ textAlign: "center", padding: "24px", color: "#2A3560", fontSize: 12 }}>No reminders in the next 7 days.</div>
                  )}
                </div>
              </div>

              {/* Quick access */}
              {activeBU !== "all" && (
                <div>
                  <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "#3A4560", fontWeight: 600, marginBottom: 14 }}>Quick Access</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
                    {navItems.filter(n => n.id !== "dashboard").map(item => (
                      <button key={item.id} onClick={() => setActiveNav(item.id)}
                        style={{ background: "#161B28", border: "1px solid #1E2640", borderRadius: 8, padding: "16px", cursor: "pointer", textAlign: "left", transition: "all 0.15s", fontFamily: "inherit" }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = buColor.accent; e.currentTarget.style.background = buColor.light; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = "#1E2640";      e.currentTarget.style.background = "#161B28"; }}>
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

          {/* ── CUSTOMERS ── */}
          {activeNav === "customers" && (
            <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 22 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "#FFFFFF", letterSpacing: "-0.01em", textTransform: "uppercase" }}>Customers</div>
                  <div style={{ fontSize: 11, color: "#3A4560", marginTop: 3, letterSpacing: "0.06em" }}>{companies.length} COMPANIES · {contacts.length} CONTACTS</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input className="fi" style={{ width: 200 }} placeholder="Search companies…" value={crmSearch} onChange={e => setCrmSearch(e.target.value)} />
                  <button className="btn-ghost" onClick={() => { setEditContactId(null); setContactForm({ companyId: "", firstName: "", lastName: "", title: "", email: "", phone: "" }); setShowContactForm(true); }}>+ Contact</button>
                  <button className="btn-primary" onClick={() => { setEditCompanyId(null); setCompanyForm({ name: "", website: "", address: "", logo: "", notes: "" }); setShowCompanyForm(true); }}>+ Company</button>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                {[
                  { label: "Total Companies",      value: companies.length,                                            color: "#3B6FE8" },
                  { label: "Total Contacts",        value: contacts.length,                                             color: "#A78BFA" },
                  { label: "Total Contract Value",  value: fmt(jobs.reduce((s, j) => s + j.contractValue, 0)),          color: "#4ADE80" },
                ].map(s => (
                  <div key={s.label} className="stat-card" style={{ position: "relative", overflow: "hidden", padding: "14px 18px" }}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: s.color }} />
                    <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#3A4560", marginBottom: 6 }}>{s.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                {companies.filter(c => c.name.toLowerCase().includes(crmSearch.toLowerCase())).map(company => {
                  const cc  = getCompanyContacts(company.id);
                  const cj  = getCompanyJobs(company.id);
                  const tv  = getCompanyTotalValue(company.id);
                  return (
                    <div key={company.id} className="company-card" onClick={() => setSelectedCompany(company)}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 8, background: "#1A2340", border: "1px solid #2A3560", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "#3B6FE8", flexShrink: 0 }}>
                          {company.logo ? <img src={company.logo} style={{ width: 36, height: 36, borderRadius: 6, objectFit: "cover" }} alt="" /> : company.name.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 14, color: "#E8ECF4", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{company.name}</div>
                          {company.website && <div style={{ fontSize: 11, color: "#3A4560" }}>{company.website}</div>}
                        </div>
                      </div>
                      {company.address && <div style={{ fontSize: 11, color: "#3A4560", marginBottom: 10 }}>📍 {company.address}</div>}
                      <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 10, borderTop: "1px solid #1E2640" }}>
                        <div><div style={{ fontSize: 13, fontWeight: 600, color: "#B8C4E0" }}>{cc.length}</div><div style={{ fontSize: 10, color: "#3A4560" }}>Contacts</div></div>
                        <div><div style={{ fontSize: 13, fontWeight: 600, color: "#B8C4E0" }}>{cj.length}</div><div style={{ fontSize: 10, color: "#3A4560" }}>Jobs</div></div>
                        <div style={{ textAlign: "right" }}><div style={{ fontSize: 13, fontWeight: 600, color: "#3B6FE8" }}>{fmt(tv)}</div><div style={{ fontSize: 10, color: "#3A4560" }}>Contract Val.</div></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── BUDGETING ── */}
          {activeNav === "budgeting" && activeBU === "major" && (
            <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 22 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "#FFFFFF", letterSpacing: "-0.01em", textTransform: "uppercase" }}>Budgeting</div>
                  <div style={{ fontSize: 11, color: "#3A4560", marginTop: 3, letterSpacing: "0.06em" }}>MAJOR PROJECTS · PRE-LEAD SCOPING · {pipeline.filter(o => o.bu === "major" && o.stage === "Budgeting").length} PROJECTS</div>
                </div>
                <button className="btn-primary" onClick={() => openAdd("Budgeting")}>+ Add Project</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                {[
                  { label: "Projects in Budgeting", value: pipeline.filter(o => o.bu === "major" && o.stage === "Budgeting").length,                                                                           color: "#3B6FE8" },
                  { label: "Total Estimated Value",  value: fmt(pipeline.filter(o => o.bu === "major" && o.stage === "Budgeting").reduce((s, o) => s + o.value, 0)),                                           color: "#FCD34D" },
                  { label: "Due This Week",          value: pipeline.filter(o => o.bu === "major" && o.stage === "Budgeting" && o.budgetDueDate && new Date(o.budgetDueDate) <= new Date(Date.now() + 7 * 86400000)).length, color: "#F87171" },
                ].map(s => (
                  <div key={s.label} className="stat-card" style={{ position: "relative", overflow: "hidden", padding: "14px 18px" }}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: s.color }} />
                    <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#3A4560", marginBottom: 6 }}>{s.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {pipeline.filter(o => o.bu === "major" && o.stage === "Budgeting").map(o => {
                  const now     = new Date();
                  const overdue = o.budgetDueDate && new Date(o.budgetDueDate) < now;
                  const soon    = o.budgetDueDate && new Date(o.budgetDueDate) <= new Date(now.getTime() + 7 * 86400000);
                  const co      = companies.find(c => c.id === o.companyId);
                  return (
                    <div key={o.id} className="opp-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }} onClick={() => setSelectedOpp(o)}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, color: "#E8ECF4", fontWeight: 600, marginBottom: 4 }}>{o.name}</div>
                        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                          {co && <span style={{ fontSize: 11, color: "#3B6FE8" }}>🏢 {co.name}</span>}
                          {o.budgetDueDate && <span style={{ fontSize: 11, color: overdue ? "#F87171" : soon ? "#FCD34D" : "#3A4560" }}>📅 Budget due: {o.budgetDueDate}{overdue ? " ⚠ OVERDUE" : ""}</span>}
                          {o.notes && <span style={{ fontSize: 11, color: "#3A4560" }}>📝 {o.notes}</span>}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 16, fontWeight: 700, color: "#FCD34D" }}>{fmt(o.value)}</div>
                          <div style={{ fontSize: 10, color: "#3A4560" }}>estimated</div>
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
                  );
                })}
                {pipeline.filter(o => o.bu === "major" && o.stage === "Budgeting").length === 0 && (
                  <div style={{ textAlign: "center", padding: "48px", color: "#2A3560", fontSize: 12, background: "#161B28", borderRadius: 10, border: "1px solid #1E2640" }}>No projects in budgeting yet</div>
                )}
              </div>
            </div>
          )}

          {/* ── ACTIVE JOBS ── */}
          {activeNav === "jobs" && (
            <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 22 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "#FFFFFF", letterSpacing: "-0.01em", textTransform: "uppercase" }}>Active Jobs</div>
                  <div style={{ fontSize: 11, color: "#3A4560", marginTop: 3, letterSpacing: "0.06em" }}>{majorJobs.length} JOBS · {fmt(majorJobs.reduce((s, j) => s + j.contractValue, 0))} TOTAL</div>
                </div>
                <button className="btn-primary" onClick={openAddJob}>+ Add Job</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
                {[
                  { label: "Total Contract Value", value: fmt(majorJobs.reduce((s, j) => s + j.contractValue, 0)),                                                           color: buColor.accent },
                  { label: "On Schedule",          value: majorJobs.filter(j => j.status === "On Schedule").length,                                                           color: "#4ADE80" },
                  { label: "Behind / At Risk",     value: majorJobs.filter(j => ["Behind Schedule", "At Risk"].includes(j.status)).length,                                   color: "#F87171" },
                  { label: "Avg Completion",       value: (majorJobs.length ? Math.round(majorJobs.reduce((s, j) => s + j.pct, 0) / majorJobs.length) : 0) + "%",           color: "#FCD34D" },
                ].map(s => (
                  <div key={s.label} className="stat-card" style={{ position: "relative", overflow: "hidden", padding: "14px 18px" }}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: s.color }} />
                    <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#3A4560", marginBottom: 6 }}>{s.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>
              <GanttSection jobList={majorJobs} showAddBtn={false} />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {majorJobs.map(job => {
                  const sc = STATUS_CONFIG[job.status] || STATUS_CONFIG["On Schedule"];
                  const co = companies.find(c => c.id === job.companyId);
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
                        {co && <span style={{ fontSize: 11, color: "#3B6FE8" }}>🏢 {co.name}</span>}
                        <span style={{ fontSize: 11, color: "#3A4560" }}>👤 {job.pm}</span>
                        <span style={{ fontSize: 11, color: "#3A4560" }}>📅 {job.startDate} → {job.endDate}</span>
                      </div>
                      <div style={{ background: "#0A0D16", borderRadius: 4, height: 6, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: job.pct + "%", background: sc.color, borderRadius: 4 }} />
                      </div>
                      <div style={{ fontSize: 10, color: "#3A4560", marginTop: 4, textAlign: "right" }}>{job.pct}% complete</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── PIPELINE ── */}
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
                    <button className={"view-toggle" + (pipelineView === "kanban" ? " on" : "")} onClick={() => setPipelineView("kanban")}>Kanban</button>
                    <button className={"view-toggle" + (pipelineView === "list"   ? " on" : "")} onClick={() => setPipelineView("list")}>List</button>
                  </div>
                  <button className="btn-primary" onClick={() => openAdd("Lead")}>+ Add</button>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                {[
                  { label: "Active Pipeline", value: fmt(totalPipeline), color: buColor.accent },
                  { label: "Won",             value: fmt(totalWon),      color: "#4ADE80" },
                  { label: "Win Rate",        value: winRate + "%",      color: "#FCD34D" },
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
                    const sc        = STAGE_COLORS[stage] || { color: "#60A5FA", bg: "#60A5FA15" };
                    const stageOpps = visiblePipeline.filter(o => o.stage === stage);
                    return (
                      <div key={stage} style={{ minWidth: 200, flex: "0 0 200px" }}>
                        <div style={{ background: sc.bg, border: "1px solid " + sc.color + "30", borderRadius: 7, padding: "8px 12px", marginBottom: 10 }}>
                          <div style={{ fontSize: 10, letterSpacing: "0.07em", textTransform: "uppercase", color: sc.color, fontWeight: 600, marginBottom: 2 }}>{stage}</div>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ fontSize: 10, color: "#3A4560" }}>{stageOpps.length} opp{stageOpps.length !== 1 ? "s" : ""}</span>
                            <span style={{ fontSize: 11, color: sc.color, fontWeight: 600 }}>{fmt(stageOpps.reduce((s, o) => s + o.value, 0))}</span>
                          </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {stageOpps.map(o => {
                            const co = companies.find(c => c.id === o.companyId);
                            return (
                              <div key={o.id} style={{ background: "#161B28", border: "1px solid " + sc.color + "25", borderRadius: 8, padding: 12, cursor: "pointer" }} onClick={() => setSelectedOpp(o)}>
                                <div style={{ fontSize: 12, color: "#E8ECF4", fontWeight: 500, lineHeight: 1.35, marginBottom: 4 }}>{o.name}</div>
                                {co && <div style={{ fontSize: 10, color: "#3B6FE8", marginBottom: 4 }}>🏢 {co.name}</div>}
                                {o.bidDueDate && <div style={{ fontSize: 10, color: "#FCD34D", marginBottom: 4 }}>📋 Bid: {o.bidDueDate}</div>}
                                <div style={{ fontSize: 15, fontWeight: 700, color: sc.color, marginBottom: 8 }}>{fmt(o.value)}</div>
                                <div style={{ display: "flex", gap: 5 }} onClick={e => e.stopPropagation()}>
                                  <button className="btn-ghost" style={{ flex: 1, fontSize: 11 }} onClick={() => moveStage(o.id, -1)}>←</button>
                                  <button className="btn-ghost" style={{ flex: 1, fontSize: 11 }} onClick={() => moveStage(o.id,  1)}>→</button>
                                  <button className="btn-ghost" style={{ fontSize: 11 }}            onClick={() => openEdit(o)}>✎</button>
                                </div>
                              </div>
                            );
                          })}
                          {stageOpps.length === 0 && <div style={{ border: "1px dashed " + sc.color + "20", borderRadius: 8, padding: "20px 8px", textAlign: "center", fontSize: 10, color: "#1E2840" }}>EMPTY</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {pipelineView === "list" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr auto", gap: 12, padding: "6px 16px", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: "#2A3560" }}>
                    <span>Opportunity</span><span>Company</span><span>Stage</span><span style={{ textAlign: "right" }}>Value</span><span>Close</span><span />
                  </div>
                  {visiblePipeline.map(o => {
                    const sc = STAGE_COLORS[o.stage] || { color: "#60A5FA", bg: "#60A5FA15" };
                    const co = companies.find(c => c.id === o.companyId);
                    return (
                      <div key={o.id} className="opp-row" style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr auto", gap: 12, alignItems: "center" }} onClick={() => setSelectedOpp(o)}>
                        <div>
                          <div style={{ fontSize: 13, color: "#E8ECF4", fontWeight: 500 }}>{o.name}</div>
                          {o.bidDueDate && <div style={{ fontSize: 10, color: "#FCD34D", marginTop: 2 }}>📋 Bid: {o.bidDueDate}</div>}
                        </div>
                        <div style={{ fontSize: 11, color: "#3B6FE8" }}>{co ? co.name : ""}</div>
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
                </div>
              )}
            </div>
          )}

          {/* ── SITES ── */}
          {activeNav === "sites" && SITES_BUS.includes(activeBU) && (
            <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 22 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "#FFFFFF", letterSpacing: "-0.01em", textTransform: "uppercase" }}>Sites</div>
                  <div style={{ fontSize: 11, color: "#3A4560", marginTop: 3, letterSpacing: "0.06em" }}>
                    {BUSINESS_UNITS.find(b => b.id === activeBU)?.label.toUpperCase()} · {sites.filter(s => activeBU === "all" || s.companyId).length} SITES
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input className="fi" style={{ width: 200 }} placeholder="Search sites…" value={siteSearch} onChange={e => setSiteSearch(e.target.value)} />
                  <button className="btn-primary" onClick={openAddSite}>+ Add Site</button>
                </div>
              </div>

              {/* Stats */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                {[
                  { label: "Total Sites",    value: sites.length,                                                        color: buColor.accent },
                  { label: "Companies",      value: [...new Set(sites.map(s => s.companyId))].length,                    color: "#A78BFA" },
                  { label: "Total Contacts", value: [...new Set(sites.flatMap(s => s.contactIds || []))].length,         color: "#4ADE80" },
                ].map(s => (
                  <div key={s.label} className="stat-card" style={{ position: "relative", overflow: "hidden", padding: "14px 18px" }}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: s.color }} />
                    <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#3A4560", marginBottom: 6 }}>{s.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Sites grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                {sites.filter(site => {
                  const co = companies.find(c => c.id === site.companyId);
                  const q  = siteSearch.toLowerCase();
                  return !q || (site.storeNumber || "").toLowerCase().includes(q) || (site.address || "").toLowerCase().includes(q) || (co?.name || "").toLowerCase().includes(q);
                }).map(site => {
                  const co           = companies.find(c => c.id === site.companyId);
                  const siteContacts = contacts.filter(p => (site.contactIds || []).includes(p.id));
                  return (
                    <div key={site.id} className="company-card" onClick={() => setSelectedSite(site)}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: buColor.light, border: "1px solid " + buColor.accent + "40", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>📍</div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, color: "#E8ECF4", fontWeight: 600 }}>Store #{site.storeNumber || "—"}</div>
                          {co && <div style={{ fontSize: 11, color: "#3B6FE8" }}>{co.name}</div>}
                        </div>
                      </div>
                      {site.address && <div style={{ fontSize: 11, color: "#3A4560", marginBottom: 8 }}>📍 {site.address}</div>}
                      {site.phone   && <div style={{ fontSize: 11, color: "#3A4560", marginBottom: 4 }}>📞 {site.phone}</div>}
                      <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 10, borderTop: "1px solid #1E2640" }}>
                        <div><div style={{ fontSize: 13, fontWeight: 600, color: "#B8C4E0" }}>{siteContacts.length}</div><div style={{ fontSize: 10, color: "#3A4560" }}>Contacts</div></div>
                        <div style={{ display: "flex", gap: 6 }} onClick={e => e.stopPropagation()}>
                          <button className="btn-ghost" style={{ fontSize: 11 }} onClick={() => openEditSite(site)}>✎</button>
                          <button className="btn-ghost" style={{ fontSize: 11, color: "#F87171", borderColor: "#F8717120" }} onClick={() => deleteSite(site.id)}>✕</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {sites.length === 0 && (
                  <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "48px", color: "#2A3560", fontSize: 12, background: "#161B28", borderRadius: 10, border: "1px solid #1E2640" }}>
                    No sites yet — add your first one
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── FINANCE ── */}
          {activeNav === "finance" && (
            <div className="fade-in">
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#FFFFFF", textTransform: "uppercase" }}>Finance</div>
                <div style={{ fontSize: 11, color: "#3A4560", marginTop: 4 }}>FARMER GROUP · ALL BUSINESS UNITS</div>
              </div>
              <div className="coming-soon">
                <div style={{ width: 48, height: 48, borderRadius: 12, background: "#3B6FE815", border: "1px solid #3B6FE833", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>💰</div>
                <div style={{ fontSize: 14, color: "#3A4560", fontWeight: 500 }}>Finance — Coming Soon</div>
              </div>
            </div>
          )}

          {/* ── COMING SOON (other nav items) ── */}
          {!["dashboard", "customers", "jobs", "pipeline", "budgeting", "finance", "sites"].includes(activeNav) && (
            <div className="fade-in">
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#FFFFFF", textTransform: "uppercase" }}>{navItems.find(n => n.id === activeNav)?.label}</div>
                <div style={{ fontSize: 11, color: "#3A4560", marginTop: 4 }}>{BUSINESS_UNITS.find(b => b.id === activeBU)?.label.toUpperCase()}</div>
              </div>
              <div className="coming-soon">
                <div style={{ width: 48, height: 48, borderRadius: 12, background: buColor.light, border: "1px solid " + buColor.accent + "33", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{navItems.find(n => n.id === activeNav)?.icon}</div>
                <div style={{ fontSize: 14, color: "#3A4560", fontWeight: 500 }}>{navItems.find(n => n.id === activeNav)?.label} — Coming Soon</div>
              </div>
            </div>
          )}

        </div>{/* end content */}
      </div>{/* end main */}

      {/* ── SITE SIDE PANEL ── */}
      {selectedSite && !selectedCompany && (
        <div className="side-panel slide-in">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#FFFFFF", textTransform: "uppercase", letterSpacing: "0.06em" }}>Site Detail</div>
            <button className="btn-ghost" onClick={() => setSelectedSite(null)}>✕</button>
          </div>
          {(() => {
            const co           = companies.find(c => c.id === selectedSite.companyId);
            const siteContacts = contacts.filter(p => (selectedSite.contactIds || []).includes(p.id));
            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: buColor.light, border: "1px solid " + buColor.accent + "40", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📍</div>
                  <div>
                    <div style={{ fontSize: 16, color: "#E8ECF4", fontWeight: 600 }}>Store #{selectedSite.storeNumber || "—"}</div>
                    {co && <div style={{ fontSize: 12, color: "#3B6FE8", cursor: "pointer" }} onClick={() => { setSelectedSite(null); setSelectedCompany(co); }}>🏢 {co.name}</div>}
                  </div>
                </div>

                <div style={{ background: "#0A0D16", borderRadius: 8, padding: "14px", border: "1px solid #1E2640", display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    { label: "Address",     value: selectedSite.address     || "—" },
                    { label: "Phone",       value: selectedSite.phone        || "—" },
                    { label: "Access Code", value: selectedSite.accessCode   || "—" },
                  ].map(r => (
                    <div key={r.label} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                      <span style={{ fontSize: 11, color: "#3A4560", flexShrink: 0 }}>{r.label}</span>
                      <span style={{ fontSize: 11, color: r.label === "Access Code" ? "#FCD34D" : "#B8C4E0", textAlign: "right", fontWeight: r.label === "Access Code" ? 600 : 400 }}>{r.value}</span>
                    </div>
                  ))}
                </div>

                {siteContacts.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#3A4560", marginBottom: 10, fontWeight: 600 }}>Contacts</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {siteContacts.map(p => (
                        <div key={p.id} className="contact-chip">
                          <div>
                            <div style={{ fontSize: 12, color: "#E8ECF4", fontWeight: 500 }}>{p.firstName} {p.lastName}</div>
                            <div style={{ fontSize: 10, color: "#3A4560" }}>{p.title} · {p.email}</div>
                            {p.phone && <div style={{ fontSize: 10, color: "#3A4560" }}>{p.phone}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedSite.notes && <div style={{ fontSize: 12, color: "#6B7694", lineHeight: 1.6, background: "#0A0D16", padding: "10px 12px", borderRadius: 6, border: "1px solid #1E2640" }}>{selectedSite.notes}</div>}

                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn-ghost" style={{ flex: 1 }} onClick={() => { openEditSite(selectedSite); setSelectedSite(null); }}>✎ Edit</button>
                  <button className="btn-ghost" style={{ color: "#F87171", borderColor: "#F8717120" }} onClick={() => deleteSite(selectedSite.id)}>✕</button>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ── COMPANY SIDE PANEL ── */}
      {selectedCompany && (
        <div className="side-panel slide-in">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#FFFFFF", textTransform: "uppercase", letterSpacing: "0.06em" }}>Company Profile</div>
            <button className="btn-ghost" onClick={() => setSelectedCompany(null)}>✕</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: 10, background: "#1A2340", border: "1px solid #2A3560", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, color: "#3B6FE8", flexShrink: 0 }}>
                {selectedCompany.logo ? <img src={selectedCompany.logo} style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover" }} alt="" /> : selectedCompany.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 16, color: "#E8ECF4", fontWeight: 600 }}>{selectedCompany.name}</div>
                {selectedCompany.website && <div style={{ fontSize: 11, color: "#3B6FE8" }}>{selectedCompany.website}</div>}
                {selectedCompany.address && <div style={{ fontSize: 11, color: "#3A4560" }}>{selectedCompany.address}</div>}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn-ghost" style={{ flex: 1 }} onClick={() => { setEditCompanyId(selectedCompany.id); setCompanyForm({ ...selectedCompany }); setShowCompanyForm(true); }}>✎ Edit</button>
              <button className="btn-ghost" style={{ color: "#3B6FE8", borderColor: "#3B6FE840" }} onClick={() => { setContactForm({ companyId: selectedCompany.id, firstName: "", lastName: "", title: "", email: "", phone: "" }); setShowContactForm(true); }}>+ Contact</button>
            </div>

            <hr style={{ border: "none", borderTop: "1px solid #1E2640" }} />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                { label: "Total Contract Value", value: fmt(getCompanyTotalValue(selectedCompany.id)), color: "#3B6FE8" },
                { label: "Active Jobs",          value: getCompanyJobs(selectedCompany.id).length,     color: "#4ADE80" },
                { label: "Pipeline Opps",        value: getCompanyPipeline(selectedCompany.id).length, color: "#FCD34D" },
                { label: "Sites",                value: getCompanySites(selectedCompany.id).length,    color: "#A78BFA" },
              ].map(s => (
                <div key={s.label} style={{ background: "#0A0D16", border: "1px solid #1E2640", borderRadius: 8, padding: "10px 12px" }}>
                  <div style={{ fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "#3A4560", marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>

            <div>
              <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#3A4560", marginBottom: 10, fontWeight: 600 }}>Contacts</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {getCompanyContacts(selectedCompany.id).map(p => (
                  <div key={p.id} className="contact-chip">
                    <div>
                      <div style={{ fontSize: 12, color: "#E8ECF4", fontWeight: 500 }}>{p.firstName} {p.lastName}</div>
                      <div style={{ fontSize: 10, color: "#3A4560" }}>{p.title} · {p.email}</div>
                      {p.phone && <div style={{ fontSize: 10, color: "#3A4560" }}>{p.phone}</div>}
                    </div>
                    <button className="btn-ghost" style={{ fontSize: 11 }} onClick={() => { setEditContactId(p.id); setContactForm({ ...p }); setShowContactForm(true); }}>✎</button>
                  </div>
                ))}
                {getCompanyContacts(selectedCompany.id).length === 0 && <div style={{ fontSize: 11, color: "#2A3560", textAlign: "center", padding: "12px" }}>No contacts yet</div>}
              </div>
            </div>

            {getCompanyJobs(selectedCompany.id).length > 0 && (
              <div>
                <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#3A4560", marginBottom: 10, fontWeight: 600 }}>Active Jobs</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {getCompanyJobs(selectedCompany.id).map(j => {
                    const sc = STATUS_CONFIG[j.status] || STATUS_CONFIG["On Schedule"];
                    return (
                      <div key={j.id} style={{ background: "#0A0D16", border: "1px solid #1E2640", borderRadius: 8, padding: "10px 12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 12, color: "#E8ECF4", fontWeight: 500 }}>{j.name}</span>
                          <span style={{ fontSize: 12, color: "#3B6FE8", fontWeight: 600 }}>{fmt(j.contractValue)}</span>
                        </div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <span className="pill" style={{ background: sc.bg, color: sc.color }}>{j.status}</span>
                          <span style={{ fontSize: 10, color: "#3A4560" }}>{j.pct}% complete</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {getCompanyPipeline(selectedCompany.id).length > 0 && (
              <div>
                <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#3A4560", marginBottom: 10, fontWeight: 600 }}>Pipeline</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {getCompanyPipeline(selectedCompany.id).map(o => {
                    const sc = STAGE_COLORS[o.stage] || { color: "#60A5FA", bg: "#60A5FA15" };
                    return (
                      <div key={o.id} style={{ background: "#0A0D16", border: "1px solid #1E2640", borderRadius: 8, padding: "10px 12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 12, color: "#E8ECF4", fontWeight: 500 }}>{o.name}</span>
                          <span style={{ fontSize: 12, fontWeight: 600, color: sc.color }}>{fmt(o.value)}</span>
                        </div>
                        <span className="pill" style={{ background: sc.bg, color: sc.color }}>{o.stage}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── JOB SIDE PANEL ── */}
      {selectedJob && !selectedOpp && !selectedCompany && (
        <div className="side-panel slide-in">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#FFFFFF", textTransform: "uppercase", letterSpacing: "0.06em" }}>Job Detail</div>
            <button className="btn-ghost" onClick={() => setSelectedJob(null)}>✕</button>
          </div>
          {(() => {
            const sc = STATUS_CONFIG[selectedJob.status] || STATUS_CONFIG["On Schedule"];
            const co = companies.find(c => c.id === selectedJob.companyId);
            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 16, color: "#E8ECF4", fontWeight: 600, marginBottom: 4 }}>{selectedJob.name}</div>
                  {co && <div style={{ fontSize: 12, color: "#3B6FE8", marginBottom: 6, cursor: "pointer" }} onClick={() => { setSelectedJob(null); setSelectedCompany(co); }}>🏢 {co.name}</div>}
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span className="pill" style={{ background: sc.bg, color: sc.color }}>{selectedJob.status}</span>
                    <span style={{ fontSize: 20, fontWeight: 700, color: "#3B6FE8" }}>{fmt(selectedJob.contractValue)}</span>
                  </div>
                </div>
                <div style={{ background: "#0A0D16", borderRadius: 8, padding: "14px", border: "1px solid #1E2640", display: "flex", flexDirection: "column", gap: 10 }}>
                  {[{ label: "Project Manager", value: selectedJob.pm }, { label: "Start Date", value: selectedJob.startDate }, { label: "End Date", value: selectedJob.endDate }].map(r => (
                    <div key={r.label} style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 11, color: "#3A4560" }}>{r.label}</span>
                      <span style={{ fontSize: 11, color: "#B8C4E0" }}>{r.value}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#3A4560", marginBottom: 8 }}>Completion — {selectedJob.pct}%</div>
                  <div style={{ background: "#0A0D16", borderRadius: 4, height: 8, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: selectedJob.pct + "%", background: sc.color, borderRadius: 4 }} />
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

      {/* ── OPP SIDE PANEL ── */}
      {selectedOpp && !selectedCompany && (
        <div className="side-panel slide-in">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#FFFFFF", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {selectedOpp.stage === "Budgeting" ? "Budget Detail" : selectedOpp.stage === "Lead" ? "Lead Detail" : "Opportunity Detail"}
            </div>
            <button className="btn-ghost" onClick={() => setSelectedOpp(null)}>✕</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <div style={{ fontSize: 15, color: "#E8ECF4", fontWeight: 600, marginBottom: 6 }}>{selectedOpp.name}</div>
              {(() => {
                const co = companies.find(c => c.id === selectedOpp.companyId);
                const ct = contacts.find(p => p.id === selectedOpp.contactId);
                return co ? (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 12, color: "#3B6FE8", cursor: "pointer", marginBottom: 2 }} onClick={() => { setSelectedOpp(null); setSelectedCompany(co); }}>🏢 {co.name}</div>
                    {ct && <div style={{ fontSize: 11, color: "#3A4560" }}>👤 {ct.firstName} {ct.lastName} · {ct.title}</div>}
                  </div>
                ) : null;
              })()}
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span className="pill" style={{ background: (STAGE_COLORS[selectedOpp.stage] || { bg: "#60A5FA15" }).bg, color: (STAGE_COLORS[selectedOpp.stage] || { color: "#60A5FA" }).color }}>{selectedOpp.stage}</span>
                <span style={{ fontSize: 20, fontWeight: 700, color: "#FFFFFF" }}>{fmt(selectedOpp.value)}</span>
              </div>
            </div>

            {selectedOpp.stage === "Budgeting" && (
              <div style={{ background: "#0A0D16", borderRadius: 8, padding: "12px", border: "1px solid #1E2640" }}>
                <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#3A4560", marginBottom: 6 }}>Budget Due Date</div>
                <div style={{ fontSize: 14, color: selectedOpp.budgetDueDate ? "#FCD34D" : "#3A4560", fontWeight: 500 }}>{selectedOpp.budgetDueDate || "Not set"}</div>
              </div>
            )}

            {["Proposal / Bid", "Bid Submitted"].includes(selectedOpp.stage) && (
              <div style={{ background: "#0A0D16", borderRadius: 8, padding: "12px", border: "1px solid #FCD34D30" }}>
                <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#3A4560", marginBottom: 6 }}>Bid Due Date</div>
                <div style={{ fontSize: 14, color: selectedOpp.bidDueDate ? "#FCD34D" : "#3A4560", fontWeight: 500 }}>{selectedOpp.bidDueDate || "Not set"}</div>
              </div>
            )}

            {selectedOpp.stage === "Lead" && (selectedOpp.nextSteps || []).length > 0 && (
              <div>
                <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#3A4560", marginBottom: 8, fontWeight: 600 }}>Next Steps</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {(selectedOpp.nextSteps || []).map((ns, i) => {
                    const nsOverdue = ns.dueDate && new Date(ns.dueDate) < new Date();
                    return (
                      <div key={i} className="ns-row">
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: nsOverdue ? "#F87171" : "#3B6FE8", flexShrink: 0 }} />
                          <span style={{ fontSize: 12, color: "#E8ECF4", fontWeight: 500 }}>{ns.step}</span>
                        </div>
                        <span style={{ fontSize: 11, color: nsOverdue ? "#F87171" : "#3A4560" }}>{ns.dueDate || "No date"}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {selectedOpp.closeDate && <div style={{ fontSize: 11, color: "#3A4560" }}><span style={{ color: "#4A5270" }}>Expected Close: </span>{selectedOpp.closeDate}</div>}
            {selectedOpp.notes     && <div style={{ fontSize: 12, color: "#6B7694", lineHeight: 1.6, background: "#0A0D16", padding: "10px 12px", borderRadius: 6, border: "1px solid #1E2640" }}>{selectedOpp.notes}</div>}
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn-ghost" style={{ flex: 1 }} onClick={() => { openEdit(selectedOpp); setSelectedOpp(null); }}>✎ Edit</button>
              <button className="btn-ghost" style={{ color: "#F87171", borderColor: "#F8717120" }} onClick={() => deleteOpp(selectedOpp.id)}>✕</button>
            </div>
          </div>
        </div>
      )}

      {/* ── JOB FORM ── */}
      {showJobForm && (
        <div className="modal-bg" onClick={e => e.target === e.currentTarget && setShowJobForm(false)}>
          <div className="modal fade-in">
            <div style={{ fontSize: 16, fontWeight: 700, color: "#FFFFFF", marginBottom: 22, textTransform: "uppercase", letterSpacing: "0.04em" }}>{editJobId !== null ? "Edit Job" : "Add Active Job"}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div><label className="lbl">Job Name *</label><input className="fi" value={jobForm.name} onChange={fj("name")} placeholder="e.g. Riverside Community Center" /></div>
              <CustomerPicker
                companyId={jobForm.companyId}
                contactId={jobForm.contactId || ""}
                onCompanyChange={val => setJobForm(f => ({ ...f, companyId: val, client: companies.find(c => c.id === val)?.name || "" }))}
                onContactChange={val => setJobForm(f => ({ ...f, contactId: val }))}
              />
              <div className="g2">
                <div><label className="lbl">Contract Value</label><input className="fi" type="number" value={jobForm.contractValue} onChange={fj("contractValue")} placeholder="0" /></div>
                <div><label className="lbl">Project Manager</label><input className="fi" value={jobForm.pm} onChange={fj("pm")} placeholder="Name" /></div>
              </div>
              <div className="g2">
                <div><label className="lbl">Start Date</label><input className="fi" type="date" value={jobForm.startDate} onChange={fj("startDate")} /></div>
                <div><label className="lbl">End Date</label>  <input className="fi" type="date" value={jobForm.endDate}   onChange={fj("endDate")} /></div>
              </div>
              <div><label className="lbl">Status</label>
                <select className="fi" value={jobForm.status} onChange={fj("status")}>
                  {["On Schedule", "Behind Schedule", "At Risk"].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div><label className="lbl">% Complete — {jobForm.pct}%</label><input type="range" min="0" max="100" value={jobForm.pct} onChange={fj("pct")} /></div>
              <div><label className="lbl">Notes</label><textarea className="fi" rows={3} value={jobForm.notes} onChange={fj("notes")} placeholder="Key updates…" style={{ resize: "vertical" }} /></div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 6 }}>
                <button className="btn-ghost"   style={{ padding: "8px 16px" }} onClick={() => setShowJobForm(false)}>Cancel</button>
                <button className="btn-primary" onClick={saveJob}>{editJobId !== null ? "Save Changes" : "Add Job"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── OPP FORM ── */}
      {showForm && (
        <div className="modal-bg" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal fade-in">
            <div style={{ fontSize: 16, fontWeight: 700, color: "#FFFFFF", marginBottom: 22, textTransform: "uppercase", letterSpacing: "0.04em" }}>{editId !== null ? "Edit" : "Add"} — {form.stage}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div><label className="lbl">Opportunity Name *</label><input className="fi" value={form.name} onChange={fp("name")} placeholder="e.g. Riverside Community Center" /></div>
              <CustomerPicker
                companyId={form.companyId}
                contactId={form.contactId}
                onCompanyChange={val => setForm(f => ({ ...f, companyId: val, contactId: "" }))}
                onContactChange={val => setForm(f => ({ ...f, contactId: val }))}
              />
              <div className="g2">
                <div><label className="lbl">Business Unit</label>
                  <select className="fi" value={form.bu} onChange={e => setForm(f => ({ ...f, bu: e.target.value, stage: PIPELINE_STAGES[e.target.value]?.[0] || "Lead" }))}>
                    {BUSINESS_UNITS.filter(b => b.id !== "all").map(b => <option key={b.id} value={b.id}>{b.label}</option>)}
                  </select>
                </div>
                <div><label className="lbl">Stage</label>
                  <select className="fi" value={form.stage} onChange={fp("stage")}>
                    {(PIPELINE_STAGES[form.bu] || PIPELINE_STAGES.all).map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div><label className="lbl">Estimated Value *</label><input className="fi" type="number" value={form.value} onChange={fp("value")} placeholder="0" /></div>

              {form.stage === "Budgeting" && (
                <div><label className="lbl">Budget Due Date</label><input className="fi" type="date" value={form.budgetDueDate} onChange={fp("budgetDueDate")} /></div>
              )}
              {["Proposal / Bid", "Bid Submitted"].includes(form.stage) && (
                <div><label className="lbl">Bid Due Date</label><input className="fi" type="date" value={form.bidDueDate} onChange={fp("bidDueDate")} /></div>
              )}
              {form.stage === "Lead" && (
                <div>
                  <label className="lbl">Next Steps</label>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 8 }}>
                    {(form.nextSteps || []).map((ns, i) => (
                      <div key={i} className="ns-row">
                        <div style={{ display: "flex", gap: 8 }}>
                          <span style={{ fontSize: 12, color: "#E8ECF4" }}>{ns.step}</span>
                          <span style={{ fontSize: 11, color: "#3A4560" }}>{ns.dueDate}</span>
                        </div>
                        <button className="btn-ghost" style={{ color: "#F87171", padding: "2px 6px" }} onClick={() => removeNextStep(i)}>✕</button>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <select className="fi" value={newNextStep.step} onChange={e => setNewNextStep(n => ({ ...n, step: e.target.value }))} style={{ flex: 2 }}>
                      <option value="">Select next step…</option>
                      {NEXT_STEP_OPTIONS.map(s => <option key={s}>{s}</option>)}
                    </select>
                    <input className="fi" type="date" value={newNextStep.dueDate} onChange={e => setNewNextStep(n => ({ ...n, dueDate: e.target.value }))} style={{ flex: 1 }} />
                    <button className="btn-ghost" onClick={addNextStep} style={{ whiteSpace: "nowrap", color: "#3B6FE8", borderColor: "#3B6FE840" }}>+ Add</button>
                  </div>
                </div>
              )}

              <div><label className="lbl">Expected Close Date</label><input className="fi" type="date" value={form.closeDate} onChange={fp("closeDate")} /></div>
              <div><label className="lbl">Notes</label><textarea className="fi" rows={3} value={form.notes} onChange={fp("notes")} placeholder="Key details…" style={{ resize: "vertical" }} /></div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 6 }}>
                <button className="btn-ghost"   style={{ padding: "8px 16px" }} onClick={() => setShowForm(false)}>Cancel</button>
                <button className="btn-primary" onClick={saveOpp}>{editId !== null ? "Save Changes" : "Add"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── COMPANY FORM ── */}
      {showCompanyForm && (
        <div className="modal-bg" onClick={e => e.target === e.currentTarget && setShowCompanyForm(false)}>
          <div className="modal fade-in">
            <div style={{ fontSize: 16, fontWeight: 700, color: "#FFFFFF", marginBottom: 22, textTransform: "uppercase" }}>{editCompanyId ? "Edit Company" : "Add Company"}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div><label className="lbl">Company Name *</label><input className="fi" value={companyForm.name}    onChange={e => setCompanyForm(f => ({ ...f, name:    e.target.value }))} placeholder="e.g. Riverside City" /></div>
              <div><label className="lbl">Address</label>        <input className="fi" value={companyForm.address} onChange={e => setCompanyForm(f => ({ ...f, address: e.target.value }))} placeholder="123 Main St, City, State" /></div>
              <div className="g2">
                <div><label className="lbl">Website</label>  <input className="fi" value={companyForm.website} onChange={e => setCompanyForm(f => ({ ...f, website: e.target.value }))} placeholder="company.com" /></div>
                <div><label className="lbl">Logo URL</label> <input className="fi" value={companyForm.logo}    onChange={e => setCompanyForm(f => ({ ...f, logo:    e.target.value }))} placeholder="https://…" /></div>
              </div>
              <div><label className="lbl">Notes</label><textarea className="fi" rows={2} value={companyForm.notes} onChange={e => setCompanyForm(f => ({ ...f, notes: e.target.value }))} style={{ resize: "vertical" }} /></div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button className="btn-ghost"   style={{ padding: "8px 16px" }} onClick={() => setShowCompanyForm(false)}>Cancel</button>
                <button className="btn-primary" onClick={saveCompany}>{editCompanyId ? "Save Changes" : "Add Company"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CONTACT FORM ── */}
      {showContactForm && (
        <div className="modal-bg" onClick={e => e.target === e.currentTarget && setShowContactForm(false)}>
          <div className="modal fade-in">
            <div style={{ fontSize: 16, fontWeight: 700, color: "#FFFFFF", marginBottom: 22, textTransform: "uppercase" }}>{editContactId ? "Edit Contact" : "Add Contact"}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div><label className="lbl">Company</label>
                <select className="fi" value={contactForm.companyId} onChange={e => setContactForm(f => ({ ...f, companyId: e.target.value }))}>
                  <option value="">Select company…</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="g2">
                <div><label className="lbl">First Name *</label><input className="fi" value={contactForm.firstName} onChange={e => setContactForm(f => ({ ...f, firstName: e.target.value }))} /></div>
                <div><label className="lbl">Last Name</label>   <input className="fi" value={contactForm.lastName}  onChange={e => setContactForm(f => ({ ...f, lastName:  e.target.value }))} /></div>
              </div>
              <div><label className="lbl">Title / Role</label><input className="fi" value={contactForm.title} onChange={e => setContactForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Project Director" /></div>
              <div className="g2">
                <div><label className="lbl">Email</label><input className="fi" value={contactForm.email} onChange={e => setContactForm(f => ({ ...f, email: e.target.value }))} /></div>
                <div><label className="lbl">Phone</label><input className="fi" value={contactForm.phone} onChange={e => setContactForm(f => ({ ...f, phone: e.target.value }))} /></div>
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button className="btn-ghost"   style={{ padding: "8px 16px" }} onClick={() => setShowContactForm(false)}>Cancel</button>
                <button className="btn-primary" onClick={saveContact}>{editContactId ? "Save Changes" : "Add Contact"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SITE FORM ── */}
      {showSiteForm && (
        <div className="modal-bg" onClick={e => e.target === e.currentTarget && setShowSiteForm(false)}>
          <div className="modal fade-in">
            <div style={{ fontSize: 16, fontWeight: 700, color: "#FFFFFF", marginBottom: 22, textTransform: "uppercase" }}>{editSiteId ? "Edit Site" : "Add Site"}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div><label className="lbl">Company</label>
                <select className="fi" value={siteForm.companyId} onChange={e => setSiteForm(f => ({ ...f, companyId: e.target.value, contactIds: [] }))}>
                  <option value="">Select company…</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="g2">
                <div><label className="lbl">Store Number</label><input className="fi" value={siteForm.storeNumber} onChange={e => setSiteForm(f => ({ ...f, storeNumber: e.target.value }))} placeholder="e.g. 001" /></div>
                <div><label className="lbl">Phone</label>       <input className="fi" value={siteForm.phone}       onChange={e => setSiteForm(f => ({ ...f, phone:       e.target.value }))} placeholder="555-555-0100" /></div>
              </div>
              <div><label className="lbl">Address</label><input className="fi" value={siteForm.address} onChange={e => setSiteForm(f => ({ ...f, address: e.target.value }))} placeholder="123 Main St, City, State" /></div>
              <div><label className="lbl">Access Code</label><input className="fi" value={siteForm.accessCode} onChange={e => setSiteForm(f => ({ ...f, accessCode: e.target.value }))} placeholder="e.g. 1234" /></div>
              {siteForm.companyId && (
                <div>
                  <label className="lbl">Assigned Contacts</label>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 160, overflowY: "auto" }}>
                    {contacts.filter(p => p.companyId === siteForm.companyId).map(p => (
                      <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: (siteForm.contactIds || []).includes(p.id) ? "#1A2340" : "#0A0D16", border: "1px solid " + ((siteForm.contactIds || []).includes(p.id) ? "#3B6FE8" : "#1E2640"), borderRadius: 6, cursor: "pointer" }}
                        onClick={() => toggleSiteContact(p.id)}>
                        <div style={{ width: 14, height: 14, borderRadius: 3, background: (siteForm.contactIds || []).includes(p.id) ? "#3B6FE8" : "transparent", border: "1px solid " + ((siteForm.contactIds || []).includes(p.id) ? "#3B6FE8" : "#3A4560"), display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {(siteForm.contactIds || []).includes(p.id) && <span style={{ fontSize: 9, color: "#fff" }}>✓</span>}
                        </div>
                        <div>
                          <div style={{ fontSize: 12, color: "#E8ECF4" }}>{p.firstName} {p.lastName}</div>
                          <div style={{ fontSize: 10, color: "#3A4560" }}>{p.title}</div>
                        </div>
                      </div>
                    ))}
                    {contacts.filter(p => p.companyId === siteForm.companyId).length === 0 && (
                      <div style={{ fontSize: 11, color: "#2A3560", padding: "8px 12px" }}>No contacts for this company yet</div>
                    )}
                  </div>
                </div>
              )}
              <div><label className="lbl">Notes</label><textarea className="fi" rows={2} value={siteForm.notes} onChange={e => setSiteForm(f => ({ ...f, notes: e.target.value }))} style={{ resize: "vertical" }} /></div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button className="btn-ghost"   style={{ padding: "8px 16px" }} onClick={() => setShowSiteForm(false)}>Cancel</button>
                <button className="btn-primary" onClick={saveSite}>{editSiteId ? "Save Changes" : "Add Site"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
