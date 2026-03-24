import { useState, useMemo, useEffect, useCallback } from "react";

// ── Supabase client ─────────────────────────────────────────
const SUPA_URL = "https://bplleiwxbejqfinmyxnq.supabase.co";
const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwbGxlaXd4YmVqcWZpbm15eG5xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMzc3OTgsImV4cCI6MjA4ODgxMzc5OH0.AupjLONxaN73jbZN0Y9QHwWHJDuOyuyVL1tnG0X8cxw";
const supa = {
  from: (table) => ({
    select: function(cols = "*") {
      return fetch(`${SUPA_URL}/rest/v1/${table}?select=${cols}&order=created_at.asc`, {
        headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` }
      }).then(r => r.json()).then(data => ({ data, error: null })).catch(error => ({ data: null, error }));
    },
    insert: function(rows) {
      const body = Array.isArray(rows) ? rows : [rows];
      return fetch(`${SUPA_URL}/rest/v1/${table}`, {
        method: "POST",
        headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify(body)
      }).then(r => r.json()).then(data => ({ data, error: null })).catch(error => ({ data: null, error }));
    },
    update: function(row) {
      return {
        eq: (col, val) => fetch(`${SUPA_URL}/rest/v1/${table}?${col}=eq.${encodeURIComponent(val)}`, {
          method: "PATCH",
          headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" },
          body: JSON.stringify(row)
        }).then(r => r.json()).then(data => ({ data, error: null })).catch(error => ({ data: null, error }))
      };
    },
    delete: function() {
      return {
        eq: (col, val) => fetch(`${SUPA_URL}/rest/v1/${table}?${col}=eq.${encodeURIComponent(val)}`, {
          method: "DELETE",
          headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` }
        }).then(r => ({ data: null, error: r.ok ? null : "Delete failed" })).catch(error => ({ data: null, error }))
      };
    }
  })
};

// ── DB row mappers (snake_case ↔ camelCase) ──────────────────
const dbToCompany = r => ({ id: r.id, name: r.name, address: r.address||"", website: r.website||"", logo: r.logo||"", notes: r.notes||"" });
const companyToDB = c => ({ id: c.id, name: c.name, address: c.address||"", website: c.website||"", logo: c.logo||"", notes: c.notes||"" });

const dbToSite = r => ({ id: r.id, companyId: r.company_id||"", contactIds: r.contact_ids||[], storeNumber: r.store_number||"", address: r.address||"", phone: r.phone||"", accessCode: r.access_code||"", notes: r.notes||"", lat: r.lat ? parseFloat(r.lat) : null, lng: r.lng ? parseFloat(r.lng) : null, businessUnits: r.business_units||[] });
const siteToDB = s => ({ id: s.id, company_id: s.companyId||null, contact_ids: s.contactIds||[], store_number: s.storeNumber||"", address: s.address||"", phone: s.phone||"", access_code: s.accessCode||"", notes: s.notes||"", lat: s.lat||null, lng: s.lng||null, business_units: s.businessUnits||[] });

const dbToLsSite = r => dbToSite(r); // same structure now
const lsSiteToDB = s => siteToDB(s);

const dbToSub = r => ({ id: r.id, name: r.name||"", trade: r.trade||"", phone: r.phone||"", email: r.email||"", msaStatus: r.msa_status||"missing", coiExpiry: r.coi_expiry||"", w9: r.w9||false, notes: r.notes||"", services: r.services||[] });
const subToDB = s => ({ id: s.id, name: s.name||"", trade: s.trade||"", phone: s.phone||"", email: s.email||"", msa_status: s.msaStatus||"missing", coi_expiry: s.coiExpiry||null, w9: s.w9||false, notes: s.notes||"", services: s.services||[] });

const dbToFmJob = r => ({
  id: r.id, name: r.name||"", companyId: r.company_id||"", siteId: r.site_id||"",
  contractValue: Number(r.contract_value||0), grossProfit: Number(r.gross_profit||0),
  nte: Number(r.nte||0), stage: r.stage||"estimating",
  startDate: r.start_date||"", endDate: r.end_date||"", pm: r.pm||"", pct: Number(r.pct||0),
  bidDueDate: r.bid_due_date||"", quoteDueDate: r.quote_due_date||"",
  proposalDate: r.proposal_date||"", followUpDate: r.follow_up_date||"",
  buyoutDate: r.buyout_date||"", invoiceDate: r.invoice_date||"",
  notes: r.notes||"", storeCode: r.store_code||"", projectNo: r.project_no||"",
  ownersProjectNo: r.owners_project_no||"", vendorInvoiceAmount: Number(r.vendor_invoice_amount||0),
  vendorInvoiceNumber: r.vendor_invoice_number||"", subcontractorId: r.subcontractor_id||"",
  vendorNextStep: r.vendor_next_step||"", vendorQuotePrice: r.vendor_quote_price||"",
  vendorQuoteScope: r.vendor_quote_scope||"", scopeOfWork: r.scope_of_work||"",
  coordinator: r.coordinator||"",
  vendorToken: r.vendor_token||"", vendorSentAt: r.vendor_sent_at||"",
  vendorPortalStatus: r.vendor_portal_status||"", vendorPortalPrice: r.vendor_portal_price||"",
  vendorPortalDate: r.vendor_portal_date||"", vendorPortalTime: r.vendor_portal_time||"",
  vendorPortalNote: r.vendor_portal_note||"", vendorPortalRespondedAt: r.vendor_portal_responded_at||"",
  vendorAcceptedAt: r.vendor_accepted_at||"", vendorScheduleChangedAt: r.vendor_schedule_changed_at||"",
  vendorScheduleChangeReason: r.vendor_schedule_change_reason||"",
  photos: r.photos||[],
});
const fmJobToDB = j => ({
  id: j.id, name: j.name||"", company_id: j.companyId||null, site_id: j.siteId||null,
  contract_value: j.contractValue||0, gross_profit: j.grossProfit||0, nte: j.nte||0,
  stage: j.stage||"estimating", start_date: j.startDate||null, end_date: j.endDate||null,
  pm: j.pm||"", pct: j.pct||0,
  bid_due_date: j.bidDueDate||null, quote_due_date: j.quoteDueDate||null,
  proposal_date: j.proposalDate||null, follow_up_date: j.followUpDate||null,
  buyout_date: j.buyoutDate||null, invoice_date: j.invoiceDate||null,
  notes: j.notes||"", store_code: j.storeCode||"", project_no: j.projectNo||"",
  owners_project_no: j.ownersProjectNo||"", vendor_invoice_amount: j.vendorInvoiceAmount||0,
  vendor_invoice_number: j.vendorInvoiceNumber||"", subcontractor_id: j.subcontractorId||null,
  vendor_next_step: j.vendorNextStep||"", vendor_quote_price: j.vendorQuotePrice||"",
  vendor_quote_scope: j.vendorQuoteScope||"", scope_of_work: j.scopeOfWork||"",
  coordinator: j.coordinator||"",
  vendor_token: j.vendorToken||null, vendor_sent_at: j.vendorSentAt||null,
  vendor_portal_status: j.vendorPortalStatus||null, vendor_portal_price: j.vendorPortalPrice||null,
  vendor_portal_date: j.vendorPortalDate||null, vendor_portal_time: j.vendorPortalTime||null,
  vendor_portal_note: j.vendorPortalNote||null, vendor_portal_responded_at: j.vendorPortalRespondedAt||null,
  vendor_accepted_at: j.vendorAcceptedAt||null, vendor_schedule_changed_at: j.vendorScheduleChangedAt||null,
  vendor_schedule_change_reason: j.vendorScheduleChangeReason||null,
  photos: j.photos||[],
});

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
    { id: "subcontractors", label: "Subcontractors", icon: "🔧" },
    { id: "customers", label: "Customers", icon: "🤝" },
  ],
  lawn: [
    { id: "dashboard",    label: "Dashboard",    icon: "⊞" },
    { id: "calendar",     label: "Calendar",     icon: "📅" },
    { id: "sites",        label: "Sites",        icon: "📍" },
    { id: "bids",         label: "Bids",         icon: "📋" },
    { id: "pricing",      label: "Pricing",      icon: "💲" },
    { id: "active-sites", label: "Active Sites", icon: "✅" },
    { id: "team",         label: "Team",         icon: "👥" },
    { id: "subcontractors", label: "Subcontractors", icon: "🔧" },
    { id: "customers",    label: "Customers",    icon: "🤝" },
  ],
  snow: [
    { id: "dashboard",    label: "Dashboard",    icon: "⊞" },
    { id: "calendar",     label: "Calendar",     icon: "📅" },
    { id: "sites",        label: "Sites",        icon: "📍" },
    { id: "bids",         label: "Bids",         icon: "📋" },
    { id: "active-sites", label: "Active Sites", icon: "✅" },
    { id: "team",         label: "Team",         icon: "👥" },
    { id: "subcontractors", label: "Subcontractors", icon: "🔧" },
    { id: "customers",    label: "Customers",    icon: "🤝" },
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

// FM margin rules: GP = max($125, NTE × 30%). Vendor NTE = NTE − GP.
const fmGrossProfit = (nte) => { const n = Number(nte||0); return n ? Math.max(125, Math.round(n * 0.30)) : 125; };
const fmVendorNTE   = (nte) => { const n = Number(nte||0); return Math.max(0, n - fmGrossProfit(n)); };

const FDI_LOGO = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQABLAEsAAD/4QB0RXhpZgAATU0AKgAAAAgABAEaAAUAAAABAAAAPgEbAAUAAAABAAAARgEoAAMAAAABAAIAAIdpAAQAAAABAAAATgAAAAAAAAEsAAAAAQAAASwAAAABAAKgAgAEAAAAAQAABoOgAwAEAAAAAQAAA0IAAAAA/+0AOFBob3Rvc2hvcCAzLjAAOEJJTQQEAAAAAAAAOEJJTQQlAAAAAAAQ1B2M2Y8AsgTpgAmY7PhCfv/iB9hJQ0NfUFJPRklMRQABAQAAB8hhcHBsAiAAAG1udHJSR0IgWFlaIAfZAAIAGQALABoAC2Fjc3BBUFBMAAAAAGFwcGwAAAAAAAAAAAAAAAAAAAAAAAD21gABAAAAANMtYXBwbAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAC2Rlc2MAAAEIAAAAb2RzY20AAAF4AAAFimNwcnQAAAcEAAAAOHd0cHQAAAc8AAAAFHJYWVoAAAdQAAAAFGdYWVoAAAdkAAAAFGJYWVoAAAd4AAAAFHJUUkMAAAeMAAAADmNoYWQAAAecAAAALGJUUkMAAAeMAAAADmdUUkMAAAeMAAAADmRlc2MAAAAAAAAAFEdlbmVyaWMgUkdCIFByb2ZpbGUAAAAAAAAAAAAAABRHZW5lcmljIFJHQiBQcm9maWxlAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABtbHVjAAAAAAAAAB8AAAAMc2tTSwAAACgAAAGEZGFESwAAACQAAAGsY2FFUwAAACQAAAHQdmlWTgAAACQAAAH0cHRCUgAAACYAAAIYdWtVQQAAACoAAAI+ZnJGVQAAACgAAAJoaHVIVQAAACgAAAKQemhUVwAAABIAAAK4a29LUgAAABYAAALKbmJOTwAAACYAAALgY3NDWgAAACIAAAMGaGVJTAAAAB4AAAMocm9STwAAACQAAANGZGVERQAAACwAAANqaXRJVAAAACgAAAOWc3ZTRQAAACYAAALgemhDTgAAABIAAAO+amFKUAAAABoAAAPQZWxHUgAAACIAAAPqcHRQTwAAACYAAAQMbmxOTAAAACgAAAQyZXNFUwAAACYAAAQMdGhUSAAAACQAAARadHJUUgAAACIAAAR+ZmlGSQAAACgAAASgaHJIUgAAACgAAATIcGxQTAAAACwAAATwcnVSVQAAACIAAAUcZW5VUwAAACYAAAU+YXJFRwAAACYAAAVkAFYBYQBlAG8AYgBlAGMAbgD9ACAAUgBHAEIAIABwAHIAbwBmAGkAbABHAGUAbgBlAHIAZQBsACAAUgBHAEIALQBwAHIAbwBmAGkAbABQAGUAcgBmAGkAbAAgAFIARwBCACAAZwBlAG4A6AByAGkAYwBDHqUAdQAgAGgA7ABuAGgAIABSAEcAQgAgAEMAaAB1AG4AZwBQAGUAcgBmAGkAbAAgAFIARwBCACAARwBlAG4A6QByAGkAYwBvBBcEMAQzBDAEOwRMBD0EOAQ5ACAEPwRABD4ERAQwBDkEOwAgAFIARwBCAFAAcgBvAGYAaQBsACAAZwDpAG4A6QByAGkAcQB1AGUAIABSAFYAQgDBAGwAdABhAGwA4QBuAG8AcwAgAFIARwBCACAAcAByAG8AZgBpAGyQGnUoAFIARwBCgnJfaWPPj/DHfLwYACAAUgBHAEIAINUEuFzTDMd8AEcAZQBuAGUAcgBpAHMAawAgAFIARwBCAC0AcAByAG8AZgBpAGwATwBiAGUAYwBuAP0AIABSAEcAQgAgAHAAcgBvAGYAaQBsBeQF6AXVBeQF2QXcACAAUgBHAEIAIAXbBdwF3AXZAFAAcgBvAGYAaQBsACAAUgBHAEIAIABnAGUAbgBlAHIAaQBjAEEAbABsAGcAZQBtAGUAaQBuAGUAcwAgAFIARwBCAC0AUAByAG8AZgBpAGwAUAByAG8AZgBpAGwAbwAgAFIARwBCACAAZwBlAG4AZQByAGkAYwBvZm6QGgBSAEcAQmPPj/Blh072TgCCLAAgAFIARwBCACAw1zDtMNUwoTCkMOsDkwO1A70DuQO6A8wAIAPAA8EDvwPGA68DuwAgAFIARwBCAFAAZQByAGYAaQBsACAAUgBHAEIAIABnAGUAbgDpAHIAaQBjAG8AQQBsAGcAZQBtAGUAZQBuACAAUgBHAEIALQBwAHIAbwBmAGkAZQBsDkIOGw4jDkQOHw4lDkwAIABSAEcAQgAgDhcOMQ5IDicORA4bAEcAZQBuAGUAbAAgAFIARwBCACAAUAByAG8AZgBpAGwAaQBZAGwAZQBpAG4AZQBuACAAUgBHAEIALQBwAHIAbwBmAGkAaQBsAGkARwBlAG4AZQByAGkBDQBrAGkAIABSAEcAQgAgAHAAcgBvAGYAaQBsAFUAbgBpAHcAZQByAHMAYQBsAG4AeQAgAHAAcgBvAGYAaQBsACAAUgBHAEIEHgQxBEkEOAQ5ACAEPwRABD4ERAQ4BDsETAAgAFIARwBCAEcAZQBuAGUAcgBpAGMAIABSAEcAQgAgAFAAcgBvAGYAaQBsAGUGRQZEBkEAIAYqBjkGMQZKBkEAIABSAEcAQgAgBicGRAY5BicGRQAAdGV4dAAAAABDb3B5cmlnaHQgMjAwNyBBcHBsZSBJbmMuLCBhbGwgcmlnaHRzIHJlc2VydmVkLgBYWVogAAAAAAAA81IAAQAAAAEWz1hZWiAAAAAAAAB0TQAAPe4AAAPQWFlaIAAAAAAAAFp1AACscwAAFzRYWVogAAAAAAAAKBoAABWfAAC4NmN1cnYAAAAAAAAAAQHNAABzZjMyAAAAAAABDEIAAAXe///zJgAAB5IAAP2R///7ov///aMAAAPcAADAbP/AABEIA0IGgwMBEQACEQEDEQH/xAAfAAABBQEBAQEBAQAAAAAAAAAAAQIDBAUGBwgJCgv/xAC1EAACAQMDAgQDBQUEBAAAAX0BAgMABBEFEiExQQYTUWEHInEUMoGRoQgjQrHBFVLR8CQzYnKCCQoWFxgZGiUmJygpKjQ1Njc4OTpDREVGR0hJSlNUVVZXWFlaY2RlZmdoaWpzdHV2d3h5eoOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4eLj5OXm5+jp6vHy8/T19vf4+fr/xAAfAQADAQEBAQEBAQEBAAAAAAAAAQIDBAUGBwgJCgv/xAC1EQACAQIEBAMEBwUEBAABAncAAQIDEQQFITEGEkFRB2FxEyIygQgUQpGhscEJIzNS8BVictEKFiQ04SXxFxgZGiYnKCkqNTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqCg4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2dri4+Tl5ufo6ery8/T19vf4+fr/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/3QAEANH/2gAMAwEAAhEDEQA/AP7+KACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgD/9D+/igAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoA//R/v4oAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKAP/0v7+KACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgD/9P+/igAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKAPGPj/8f/hZ+zH8LPEvxi+MXiWDw14N8NQDe5Cz6rreqzrJ/Znhrw1pnmRTaz4j1mWNoNN02Blztmu7ua0020vb21+u4E4E4q8SuKsp4M4MyjEZ1xBnWIVDCYOgrRhBe9XxeLrytSweAwdJTxGNxuIlChhqEJ1KkkkkcuMx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wsHGMp1KlSbq169VqVbEVmoxlWrSjGEXJxjGEIQhCjRowpYfD06WHpUqcPm5ScntZLSMVtFdlu/Ntu7bu7tssV0EhQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQBnTwSwSve2Sb5H2/bLPcqLfKihFkjLlY4tRijVUhmkKQ3USJZXrpGlneab5tfD1aFaeNwUOepPl+u4NSjCGPjCKhGpTc3GnSzKlTjGnRrTlCjiqMIYLHThThgsZlukZKSUJuyXwT1fJfWztdum27tWbi/fhducJ/0+/8ABH3/AILAxaFF4V/ZY/an8V7/AAq/2Xw/8G/jH4gumRvDDIwstP8Ah18RNQvSkkPh+KRV07w14l1Flm8KSonh7xC6+H1sr3wx/kN9M/6GNKnSzPxp8F8r58un9YzHjfgnLsPOEsBKEpyx/EGQYCMFUpUKNSNWWfZDGlCrltWFbF4ajDDwxWEwX6hwnxY26eU5tUtUXLTweMqST57/AAUK872cmmvYV7tVVaMpOTjOX9Ylf5NH6YFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAFAH//1/7+KACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKAPH/jx8ePhd+zX8LvE3xg+MHia18LeCvC1r5tzcy4mv9Uv5gy6doGgacrC41jxDrFwotdL0u1BluJiZJGhtYbi4g+r4J4J4o8ReKMo4O4NyjE53xDneJjhsDgcNFduaticTWnajhMFhKUZ4jG43ESp4bCYanUrV6kKcJTObGYzDYDDVcXi6saNCjHmnOX4RilrKcnaMIRvKUmkk27H8D/8AwUL/AOChfxU/bw+K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AKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoA/9D+/igAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoA//R/v4oAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKAP/0v7+KACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgD/9P+/igAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoA//U/v4oAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKAP/1f7+KACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgD/9b+/igAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoA//X/v4oAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKAP/0P7+KACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgD/9H+/igAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoA//S/v4oAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKAP/0/7+KACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgD/9T+/igAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoA//V/v4oAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKAP/1v7+KACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgD/9f+/igAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoA//Z";


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

const NEXT_STEP_OPTIONS = {
  major:    ["Geotechnical", "Engage Engineer", "Underwriting", "LOI", "Under Contract", "Submit Bid", "Follow Up"],
  capital:  ["Site Visit", "Engage Engineer", "Submit Proposal", "Follow Up", "Under Contract"],
  facility: ["Estimating", "Waiting on Quotes", "Owner Approval"],
  lawn:     ["Site Visit", "Submit Proposal", "Follow Up"],
  snow:     ["Site Visit", "Submit Proposal", "Follow Up"],
  all:      ["Geotechnical", "Engage Engineer", "Underwriting", "LOI", "Under Contract", "Submit Bid", "Follow Up"],
};
const SITES_BUS = ["capital", "facility", "lawn", "snow"];
const LAWN_SNOW_SITES_BUS = ["lawn", "snow"];

// Owner proposal contract templates (5 preloaded by customer type)
const OWNER_CONTRACT_TEMPLATES = [
  { id: "cubesmart",   label: "CubeSmart",             color: "#F97316" },
  { id: "extraspace",  label: "Extra Space Storage",   color: "#60A5FA" },
  { id: "publicstor",  label: "Public Storage",        color: "#F87171" },
  { id: "storageking", label: "Storage King USA",      color: "#4ADE80" },
  { id: "generic",     label: "Standard / Generic",    color: "#A78BFA" },
];

const PIN_COLORS = ["#3B6FE8","#4ADE80","#F97316","#A78BFA","#F87171","#FCD34D","#60A5FA","#FB923C","#34D399","#E879F9","#F472B6","#38BDF8"];

const INIT_LAWN_SITES = [
  { id: "ln1", companyId: "c1", storeNumber: "L001", address: "Philadelphia, PA", phone: "", accessCode: "", notes: "", lat: 39.9526, lng: -75.1652 },
  { id: "ln2", companyId: "c2", storeNumber: "L002", address: "Baltimore, MD",    phone: "", accessCode: "", notes: "", lat: 39.2904, lng: -76.6122 },
];
const INIT_SNOW_SITES = [
  { id: "sn1", companyId: "c1", storeNumber: "S001", address: "Philadelphia, PA", phone: "", accessCode: "", notes: "", lat: 39.9526, lng: -75.1652 },
  { id: "sn2", companyId: "c3", storeNumber: "S002", address: "Pittsburgh, PA",   phone: "", accessCode: "", notes: "", lat: 40.4406, lng: -79.9959 },
];

const CAPEX_STAGES = [
  { id: "estimating",      label: "Estimating",        actionLabel: "Bid Due Date",    actionKey: "bidDueDate",    color: "#818CF8" },
  { id: "owner_approval",  label: "Owner Approval",    actionLabel: "Follow-up Date",  actionKey: "followUpDate",  color: "#60A5FA" },
  { id: "buyout",          label: "Buyout",             actionLabel: "Buyout Date",     actionKey: "buyoutDate",    color: "#FCD34D" },
  { id: "do_work",         label: "Do Work",            actionLabel: "Target End Date", actionKey: "endDate",       color: "#4ADE80" },
  { id: "bill",            label: "Bill",               actionLabel: "Invoice Date",    actionKey: "invoiceDate",   color: "#F97316" },
];

const FM_STAGES = [
  { id: "estimating",         label: "Estimating",          actionLabel: "Bid Due Date",    actionKey: "bidDueDate",    color: "#818CF8", phase: "pipeline" },
  { id: "waiting_quote",      label: "Waiting for Quote",   actionLabel: "Quote Due",       actionKey: "quoteDueDate",  color: "#A78BFA", phase: "pipeline" },
  { id: "generate_proposal",  label: "Generate Proposal",   actionLabel: "Proposal Date",   actionKey: "proposalDate",  color: "#C084FC", phase: "pipeline" },
  { id: "owner_approval",     label: "Owner Approval",      actionLabel: "Follow-up Date",  actionKey: "followUpDate",  color: "#60A5FA", phase: "pipeline" },
  { id: "buyout",             label: "Buyout",               actionLabel: "Buyout Date",     actionKey: "buyoutDate",    color: "#FCD34D", phase: "active"   },
  { id: "do_work",            label: "Do Work",              actionLabel: "Target End Date", actionKey: "endDate",       color: "#4ADE80", phase: "active"   },
  { id: "bill",               label: "Bill",                 actionLabel: "Invoice Date",    actionKey: "invoiceDate",   color: "#F97316", phase: "active"   },
];

const FM_PIPELINE_STAGES = FM_STAGES.filter(s => s.phase === "pipeline");
const FM_ACTIVE_STAGES   = FM_STAGES.filter(s => s.phase === "active");

// Keep CAPEX_FM_STAGES as alias for CapEx (uses same 5-stage system)
const CAPEX_FM_STAGES = CAPEX_STAGES;

const VENDOR_NEXT_STEPS = [
  { id: "need_quote",         label: "Need Quote",          hasQuote: true  },
  { id: "awaiting_confirm",   label: "Awaiting Confirmation", hasQuote: false },
  { id: "scheduled",          label: "Scheduled",           hasQuote: false },
  { id: "work_in_progress",   label: "Work in Progress",    hasQuote: false },
  { id: "work_complete",      label: "Work Complete",       hasQuote: false },
  { id: "invoice_submitted",  label: "Invoice Submitted",   hasQuote: false },
];

const INIT_CAPEX_JOBS = [
  { id: "cx1", name: "Harbor HVAC Upgrade",    companyId: "c3", siteId: "s2", contractValue: 85000,  stage: "do_work",      startDate: "2026-02-15", endDate: "2026-05-30", pm: "Sarah Lee",   pct: 40, bidDueDate: "", followUpDate: "", buyoutDate: "", invoiceDate: "", notes: "Phase 1 underway" },
  { id: "cx2", name: "Elmwood Roof Repair",     companyId: "c2", siteId: "s1", contractValue: 42000,  stage: "estimating",   startDate: "",           endDate: "",           pm: "John Smith",  pct: 0,  bidDueDate: "2026-03-20", followUpDate: "", buyoutDate: "", invoiceDate: "", notes: "Awaiting site visit" },
  { id: "cx3", name: "Parking Lot Restriping",  companyId: "c3", siteId: "s2", contractValue: 18000,  stage: "owner_approval",startDate: "",           endDate: "",           pm: "Mike Torres", pct: 0,  bidDueDate: "", followUpDate: "2026-03-18", buyoutDate: "", invoiceDate: "", notes: "Sent proposal" },
];

const INIT_FM_JOBS = [
  { id: "fm1", name: "Door Lock Replacement", companyId: "c2", siteId: "s1", contractValue: 3200,  grossProfit: 800,  stage: "do_work",    startDate: "2026-03-10", endDate: "2026-03-14", pm: "John Smith",  pct: 75,  bidDueDate: "", quoteDueDate: "", proposalDate: "", followUpDate: "", buyoutDate: "", invoiceDate: "", notes: "Parts on order",  storeCode: "001", projectNo: "260001", ownersProjectNo: "WO-001-0001", vendorInvoiceAmount: 2400, vendorInvoiceNumber: "", subcontractorId: "", vendorNextStep: "", vendorQuotePrice: "", vendorQuoteScope: "", scopeOfWork: "Replace door lock hardware on main entrance", coordinator: "" },
  { id: "fm2", name: "Ceiling Tile Repair",   companyId: "c3", siteId: "s2", contractValue: 1800,  grossProfit: 600,  stage: "bill",       startDate: "2026-03-05", endDate: "2026-03-06", pm: "Sarah Lee",   pct: 100, bidDueDate: "", quoteDueDate: "", proposalDate: "", followUpDate: "", buyoutDate: "", invoiceDate: "2026-03-15", notes: "Work complete", storeCode: "002", projectNo: "260002", ownersProjectNo: "WO-002-0002", vendorInvoiceAmount: 1200, vendorInvoiceNumber: "INV-2024", subcontractorId: "", vendorNextStep: "", vendorQuotePrice: "", vendorQuoteScope: "", scopeOfWork: "Replace damaged ceiling tiles in units 4 and 7", coordinator: "" },
  { id: "fm3", name: "Plumbing Leak Repair",  companyId: "c2", siteId: "s1", contractValue: 4500,  grossProfit: 1200, stage: "estimating", startDate: "",           endDate: "",           pm: "Mike Torres", pct: 0,   bidDueDate: "2026-03-19", quoteDueDate: "", proposalDate: "", followUpDate: "", buyoutDate: "", invoiceDate: "", notes: "Awaiting scope", storeCode: "001", projectNo: "260003", ownersProjectNo: "", vendorInvoiceAmount: 0, vendorInvoiceNumber: "", subcontractorId: "", vendorNextStep: "", vendorQuotePrice: "", vendorQuoteScope: "", scopeOfWork: "S207 pipe is leaking near unit 3B", coordinator: "" },
];

// ── VENDOR PORTAL PAGE ───────────────────────────────────────────────────────
function VendorPage({ token, fmJobs, setFmJobs, subcontractors, companies, sites }) {
  const job  = fmJobs.find(j => j.vendorToken === token);
  const sub  = subcontractors.find(s => s.id === job?.subcontractorId);
  const co   = companies.find(c => c.id === job?.companyId);
  const site = sites.find(s => s.id === job?.siteId);

  const [view,         setView]         = useState("main");
  const [price,        setPrice]        = useState("");
  const [schedDate,    setSchedDate]    = useState(job?.vendorPortalDate || "");
  const [schedTime,    setSchedTime]    = useState(job?.vendorPortalTime || "");
  const [schedNote,    setSchedNote]    = useState("");
  const [quoteNote,    setQuoteNote]    = useState("");
  const [accepted,     setAccepted]     = useState(false);
  const [changeWarnOk, setChangeWarnOk] = useState(false);

  const nte      = job ? Number(job.vendorNTE || fmVendorNTE(Number(job.contractValue || 0))) : 0;
  const priceNum = Number(price) || 0;
  const underNTE = priceNum > 0 && priceNum <= nte;
  const overNTE  = priceNum > 0 && priceNum > nte;
  const alreadyScheduled = !!(job?.vendorPortalDate);
  const canChangeSchedule = alreadyScheduled && !job?.vendorScheduleChangedAt;

  const update = patch => {
    const updated = { ...job, ...patch };
    setFmJobs(prev => prev.map(j => j.id === job.id ? updated : j));
    try { supa.from("fm_jobs").update(fmJobToDB(updated)).eq("id", job.id); } catch(e) {}
  };
  const fmt2 = v => "$" + Number(v||0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const S = { // shared styles
    page:   { minHeight: "100vh", background: "#0F1729", padding: "24px 20px", fontFamily: "'Inter','Segoe UI',sans-serif" },
    wrap:   { maxWidth: 500, margin: "0 auto" },
    card:   { background: "#1E2A48", borderRadius: 12, padding: 22, border: "1px solid #2A3860", marginBottom: 16 },
    input:  { width: "100%", boxSizing: "border-box", padding: "13px 14px", background: "#0F1729", border: "1px solid #2A3860", borderRadius: 8, color: "#F0F4FF", fontSize: 15, fontFamily: "inherit", outline: "none" },
    label:  { display: "block", fontSize: 11, color: "#4A5278", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.07em" },
    btnGreen: { width: "100%", padding: "15px", borderRadius: 10, border: "none", background: "#4ADE80", color: "#0A1F0A", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" },
    btnBlue:  { width: "100%", padding: "15px", borderRadius: 10, border: "none", background: "#3B6FE8", color: "#FFF", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },
    footer: { marginTop: 28, textAlign: "center", fontSize: 11, color: "#2A3860" },
    logo: (
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <div style={{ width: 36, height: 36, background: "#3B6FE8", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#fff" }}>FG</div>
        <div style={{ fontSize: 12, color: "#3B6FE8", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>FARMER DEVELOPMENT INC.</div>
      </div>
    ),
  };

  // ── Not found ──
  if (!job) return (
    <div style={{ ...S.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔗</div>
        <div style={{ fontSize: 18, color: "#4A5278" }}>Link not found or expired.</div>
      </div>
    </div>
  );

  // ── Job details card (reused across views) ──
  const JobCard = () => (
    <div style={S.card}>
      <div style={{ fontSize: 11, color: "#4A5278", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Job Details</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: "#F0F4FF", marginBottom: 12 }}>{job.name}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {co   && <div style={{ display: "flex", gap: 12 }}><span style={{ fontSize: 12, color: "#4A5278", width: 90, flexShrink: 0 }}>Client</span><span style={{ fontSize: 12, color: "#BCC6D8" }}>{co.name}</span></div>}
        {site && <div style={{ display: "flex", gap: 12 }}><span style={{ fontSize: 12, color: "#4A5278", width: 90, flexShrink: 0 }}>Location</span><span style={{ fontSize: 12, color: "#BCC6D8" }}>{site.address}{site.storeNumber ? " (Store #" + site.storeNumber + ")" : ""}</span></div>}
        {job.ownersProjectNo && <div style={{ display: "flex", gap: 12 }}><span style={{ fontSize: 12, color: "#4A5278", width: 90, flexShrink: 0 }}>Work Order</span><span style={{ fontSize: 12, color: "#BCC6D8" }}>{job.ownersProjectNo}</span></div>}
        {site?.phone && <div style={{ display: "flex", gap: 12 }}><span style={{ fontSize: 12, color: "#4A5278", width: 90, flexShrink: 0 }}>Site Phone</span><span style={{ fontSize: 12, color: "#BCC6D8" }}>{site.phone}</span></div>}
      </div>
      {job.scopeOfWork && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #2A3860" }}>
          <div style={{ fontSize: 11, color: "#4A5278", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Scope of Work</div>
          <div style={{ fontSize: 13, color: "#BCC6D8", lineHeight: 1.7 }}>{job.scopeOfWork}</div>
        </div>
      )}
    </div>
  );

  // ════════════════════════════════════════════════════════
  // ── BUYOUT STAGE FLOW ──────────────────────────────────
  // ════════════════════════════════════════════════════════
  if (job.stage === "buyout") {

    // Already fully accepted + scheduled
    if (job.vendorPortalStatus === "scheduled" && job.vendorPortalDate) return (
      <div style={S.page}><div style={S.wrap}>
        {S.logo}
        <div style={{ fontSize: 22, fontWeight: 800, color: "#4ADE80", marginBottom: 20 }}>✅ You're All Set!</div>
        <div style={S.card}>
          <div style={{ fontSize: 11, color: "#4A5278", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Confirmed</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", gap: 10 }}><span style={{ fontSize: 12, color: "#4A5278", width: 80 }}>Job</span><span style={{ fontSize: 12, color: "#BCC6D8" }}>{job.name}</span></div>
            <div style={{ display: "flex", gap: 10 }}><span style={{ fontSize: 12, color: "#4A5278", width: 80 }}>Price</span><span style={{ fontSize: 12, color: "#4ADE80", fontWeight: 700 }}>{fmt2(job.vendorPortalPrice)}</span></div>
            <div style={{ display: "flex", gap: 10 }}><span style={{ fontSize: 12, color: "#4A5278", width: 80 }}>Scheduled</span><span style={{ fontSize: 12, color: "#F0F4FF", fontWeight: 600 }}>{job.vendorPortalDate}{job.vendorPortalTime ? " @ " + job.vendorPortalTime : ""}</span></div>
          </div>
          {site?.accessCode && (
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #2A3860", background: "#4ADE8010", border: "1px solid #4ADE8030", borderRadius: 8, padding: "12px 14px", marginTop: 14 }}>
              <div style={{ fontSize: 10, color: "#4ADE80", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>🔐 Site Access Code</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#4ADE80", letterSpacing: "0.15em", fontFamily: "monospace" }}>{site.accessCode}</div>
            </div>
          )}
        </div>
        <div style={S.footer}>Farmer Development Inc. · (810) 844-1544 · farmerdevelopment.com</div>
      </div></div>
    );

    // Quote submitted (over NTE)
    if (job.vendorPortalStatus === "quote_submitted") return (
      <div style={{ ...S.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ maxWidth: 440, width: "100%", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#F0F4FF", marginBottom: 8 }}>Quote Submitted</div>
          <div style={{ fontSize: 13, color: "#4A5278" }}>Your quote of {fmt2(job.vendorPortalPrice)} is under review. We'll reach out within 1 business day.</div>
          <div style={S.footer}>Farmer Development Inc. · farmerdevelopment.com</div>
        </div>
      </div>
    );

    // ── BUYOUT: Step 1 — Accept Job ──
    if (view === "main") return (
      <div style={S.page}><div style={S.wrap}>
        {S.logo}
        <div style={{ fontSize: 22, fontWeight: 800, color: "#F0F4FF", marginBottom: 4 }}>Job Offer</div>
        {sub && <div style={{ fontSize: 14, color: "#4A5278", marginBottom: 20 }}>Hi {sub.name} — you've been selected for this job. Review the details and accept below.</div>}

        <JobCard />

        {/* Photos */}
        {job.photos && job.photos.length > 0 && (
          <div style={{ ...S.card }}>
            <div style={{ fontSize: 11, color: "#4A5278", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>📸 Site Photos</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 8 }}>
              {job.photos.map((p, i) => (
                <a key={i} href={p.data} target="_blank" rel="noreferrer">
                  <img src={p.data} alt={"Photo " + (i+1)} style={{ width: "100%", borderRadius: 8, objectFit: "cover", aspectRatio: "4/3", display: "block" }} />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* NTE */}
        <div style={{ background: "#FCD34D10", border: "1px solid #FCD34D40", borderRadius: 12, padding: "16px 20px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 10, color: "#FCD34D", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 3 }}>Authorized Amount (NTE)</div>
            <div style={{ fontSize: 11, color: "#8A7030" }}>Accept at this amount to self-schedule</div>
          </div>
          <div style={{ fontSize: 30, fontWeight: 800, color: "#FCD34D" }}>{fmt2(nte)}</div>
        </div>

        {/* Terms */}
        <div style={{ ...S.card }}>
          <div style={{ fontSize: 11, color: "#4A5278", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>📄 Terms & Conditions</div>
          <div style={{ fontSize: 12, color: "#BCC6D8", lineHeight: 1.7, marginBottom: 14 }}>
            By accepting this job you agree to: complete the work described in the scope above, comply with all site rules and safety requirements, provide proof of insurance upon request, submit your invoice within 5 business days of job completion, and allow Farmer Development Inc. to inspect the work before final payment.
          </div>
          <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
            <input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)}
              style={{ marginTop: 3, width: 16, height: 16, accentColor: "#4ADE80", flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: "#F0F4FF", lineHeight: 1.5 }}>I have read and agree to these terms and conditions</span>
          </label>
        </div>

        {/* Price entry */}
        <div style={S.card}>
          <div style={{ fontSize: 11, color: "#4A5278", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Your Price</div>
          <div style={{ position: "relative", marginBottom: 8 }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#4A5278", fontSize: 16 }}>$</span>
            <input value={price} onChange={e => setPrice(e.target.value)} type="number" min="0" step="0.01" placeholder="0.00"
              style={{ ...S.input, paddingLeft: 30, border: "1px solid " + (underNTE ? "#4ADE80" : overNTE ? "#F87171" : "#2A3860") }} />
          </div>
          {underNTE && <div style={{ fontSize: 11, color: "#4ADE80", fontWeight: 600 }}>✓ Within NTE — you can self-schedule</div>}
          {overNTE  && <div style={{ fontSize: 11, color: "#F87171", fontWeight: 600 }}>⚠ Over NTE by {fmt2(priceNum - nte)} — will go to management review</div>}
        </div>

        {/* Action */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {underNTE && accepted && (
            <button onClick={() => setView("schedule")} style={S.btnGreen}>📅 Accept & Schedule</button>
          )}
          {overNTE && accepted && (
            <button onClick={() => setView("quote")} style={S.btnBlue}>📋 Accept & Submit Quote for Approval</button>
          )}
          {(!price || !accepted) && (
            <div style={{ textAlign: "center", fontSize: 12, color: "#2A3860", padding: "8px 0" }}>
              {!accepted && !price && "Enter your price and accept the terms above to continue"}
              {!accepted && price && "Please accept the terms above to continue"}
              {accepted && !price && "Enter your price above to continue"}
            </div>
          )}
        </div>
        <div style={S.footer}>Farmer Development Inc. · (810) 844-1544 · farmerdevelopment.com</div>
      </div></div>
    );

    // ── BUYOUT: Step 2 — Schedule (under NTE) ──
    if (view === "schedule") return (
      <div style={S.page}><div style={S.wrap}>
        {S.logo}
        <button onClick={() => setView("main")} style={{ background: "transparent", border: "none", color: "#4A5278", fontSize: 13, cursor: "pointer", fontFamily: "inherit", padding: 0, marginBottom: 20 }}>← Back</button>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#F0F4FF", marginBottom: 4 }}>Schedule the Job</div>
        <div style={{ fontSize: 13, color: "#4A5278", marginBottom: 20 }}>{job.name}</div>

        <div style={{ background: "#FCD34D10", border: "1px solid #FCD34D40", borderRadius: 8, padding: "10px 14px", marginBottom: 16, display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 11, color: "#FCD34D" }}>✓ Accepted at</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#4ADE80" }}>{fmt2(price)}</span>
        </div>

        {/* One-change warning */}
        <div style={{ background: "#F8717110", border: "1px solid #F8717130", borderRadius: 8, padding: "12px 14px", marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#F87171", marginBottom: 4 }}>⚠ Schedule Change Policy</div>
          <div style={{ fontSize: 11, color: "#BCC6D8", lineHeight: 1.6 }}>Once you submit a schedule date, you can only change it <strong style={{ color: "#F0F4FF" }}>one time</strong>. Please confirm your availability before submitting.</div>
        </div>

        <div style={{ ...S.card, display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={S.label}>Date *</label>
            <input type="date" value={schedDate} onChange={e => setSchedDate(e.target.value)} style={S.input} />
          </div>
          <div>
            <label style={S.label}>Arrival Time (optional)</label>
            <input type="time" value={schedTime} onChange={e => setSchedTime(e.target.value)} style={S.input} />
          </div>
          <div>
            <label style={S.label}>Notes (optional)</label>
            <textarea value={schedNote} onChange={e => setSchedNote(e.target.value)} rows={2} placeholder="Access notes, prep needed, questions…"
              style={{ ...S.input, resize: "vertical" }} />
          </div>
          {schedDate && site?.accessCode && (
            <div style={{ background: "#4ADE8010", border: "1px solid #4ADE8030", borderRadius: 8, padding: "12px 14px" }}>
              <div style={{ fontSize: 10, color: "#4ADE80", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>🔐 Site Access Code — Save This!</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#4ADE80", letterSpacing: "0.15em", fontFamily: "monospace" }}>{site.accessCode}</div>
            </div>
          )}
          <button disabled={!schedDate} onClick={() => {
            update({
              vendorPortalPrice: price,
              vendorPortalDate: schedDate,
              vendorPortalTime: schedTime,
              vendorPortalNote: schedNote,
              vendorPortalStatus: "scheduled",
              vendorPortalRespondedAt: new Date().toISOString(),
              vendorAcceptedAt: new Date().toISOString(),
              stage: "do_work",
              startDate: schedDate,
              vendorInvoiceAmount: price,
            });
          }} style={{ ...S.btnGreen, opacity: schedDate ? 1 : 0.4, cursor: schedDate ? "pointer" : "not-allowed" }}>
            ✅ Confirm Schedule
          </button>
        </div>
        <div style={S.footer}>Farmer Development Inc. · (810) 844-1544 · farmerdevelopment.com</div>
      </div></div>
    );

    // ── BUYOUT: Over-NTE Quote ──
    if (view === "quote") return (
      <div style={S.page}><div style={S.wrap}>
        {S.logo}
        <button onClick={() => setView("main")} style={{ background: "transparent", border: "none", color: "#4A5278", fontSize: 13, cursor: "pointer", fontFamily: "inherit", padding: 0, marginBottom: 20 }}>← Back</button>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#F0F4FF", marginBottom: 4 }}>Submit Quote for Approval</div>
        <div style={{ background: "#F8717115", border: "1px solid #F8717140", borderRadius: 8, padding: "12px 14px", marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: "#F87171", fontWeight: 700, marginBottom: 3 }}>⚠ Over NTE by {fmt2(priceNum - nte)}</div>
          <div style={{ fontSize: 11, color: "#BCC6D8" }}>Management will review within 1 business day.</div>
        </div>
        <div style={{ ...S.card, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0F1729", borderRadius: 8, padding: "12px 14px" }}>
            <span style={{ fontSize: 12, color: "#4A5278" }}>Your Price</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: "#F87171" }}>{fmt2(price)}</span>
          </div>
          <div>
            <label style={S.label}>Why does this exceed the NTE? *</label>
            <textarea value={quoteNote} onChange={e => setQuoteNote(e.target.value)} rows={4} placeholder="Materials, labor, scope changes, access issues…"
              style={{ ...S.input, resize: "vertical" }} />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setView("main")} style={{ flex: "0 0 auto", padding: "12px 18px", borderRadius: 8, border: "1px solid #2A3860", background: "transparent", color: "#4A5278", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>← Back</button>
            <button disabled={!quoteNote.trim()} onClick={() => {
              update({ vendorPortalPrice: price, vendorPortalNote: quoteNote, vendorPortalStatus: "quote_submitted", vendorPortalRespondedAt: new Date().toISOString(), vendorAcceptedAt: new Date().toISOString(), stage: "generate_proposal", vendorQuotePrice: price, vendorQuoteScope: quoteNote, subResponse: "quoted" });
            }} style={{ flex: 1, padding: "12px", borderRadius: 8, border: "none", background: quoteNote.trim() ? "#3B6FE8" : "#1E2A48", color: quoteNote.trim() ? "#FFF" : "#2A3860", fontSize: 14, fontWeight: 700, cursor: quoteNote.trim() ? "pointer" : "not-allowed", fontFamily: "inherit" }}>
              📋 Submit Quote
            </button>
          </div>
        </div>
        <div style={S.footer}>Farmer Development Inc. · (810) 844-1544 · farmerdevelopment.com</div>
      </div></div>
    );
  }

  // ════════════════════════════════════════════════════════
  // ── DO WORK STAGE FLOW ─────────────────────────────────
  // Job is signed off, just needs a schedule date
  // ════════════════════════════════════════════════════════
  if (job.stage === "do_work") {

    // Already scheduled — show confirmation + optional change
    if (job.vendorPortalDate && view === "main") return (
      <div style={S.page}><div style={S.wrap}>
        {S.logo}
        <div style={{ fontSize: 22, fontWeight: 800, color: "#4ADE80", marginBottom: 20 }}>📅 Job Scheduled</div>
        <div style={S.card}>
          <div style={{ fontSize: 11, color: "#4A5278", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Current Schedule</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#F0F4FF", marginBottom: 4 }}>{job.vendorPortalDate}</div>
          {job.vendorPortalTime && <div style={{ fontSize: 14, color: "#BCC6D8" }}>Arrival: {job.vendorPortalTime}</div>}
          <div style={{ fontSize: 12, color: "#4A5278", marginTop: 8 }}>{job.name}</div>
          {site?.accessCode && (
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #2A3860", background: "#4ADE8010", border: "1px solid #4ADE8030", borderRadius: 8, padding: "12px 14px", marginTop: 14 }}>
              <div style={{ fontSize: 10, color: "#4ADE80", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>🔐 Site Access Code</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#4ADE80", letterSpacing: "0.15em", fontFamily: "monospace" }}>{site.accessCode}</div>
            </div>
          )}
        </div>

        {/* Change schedule — only if not already changed */}
        {!job.vendorScheduleChangedAt ? (
          <div style={{ background: "#FCD34D10", border: "1px solid #FCD34D30", borderRadius: 8, padding: "12px 14px", marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: "#FCD34D", fontWeight: 700, marginBottom: 4 }}>⚠ Schedule Change — One Time Only</div>
            <div style={{ fontSize: 11, color: "#BCC6D8", marginBottom: 12, lineHeight: 1.6 }}>You may change your schedule date <strong style={{ color: "#F0F4FF" }}>one time</strong>. After changing, the date will be locked. Please be sure before submitting.</div>
            <button onClick={() => setView("change")} style={{ width: "100%", padding: "10px", borderRadius: 7, border: "1px solid #FCD34D40", background: "#FCD34D15", color: "#FCD34D", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              📅 Request Schedule Change
            </button>
          </div>
        ) : (
          <div style={{ background: "#F8717110", border: "1px solid #F8717130", borderRadius: 8, padding: "12px 14px", marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: "#F87171", fontWeight: 700 }}>🔒 Schedule Locked</div>
            <div style={{ fontSize: 11, color: "#BCC6D8", marginTop: 4 }}>Your schedule has been changed once and is now locked. Please contact your coordinator for further changes.</div>
          </div>
        )}

        <div style={S.footer}>Farmer Development Inc. · (810) 844-1544 · farmerdevelopment.com</div>
      </div></div>
    );

    // Change schedule view
    if (view === "change") return (
      <div style={S.page}><div style={S.wrap}>
        {S.logo}
        <button onClick={() => setView("main")} style={{ background: "transparent", border: "none", color: "#4A5278", fontSize: 13, cursor: "pointer", fontFamily: "inherit", padding: 0, marginBottom: 20 }}>← Back</button>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#F0F4FF", marginBottom: 4 }}>Change Schedule Date</div>
        <div style={{ fontSize: 13, color: "#4A5278", marginBottom: 16 }}>{job.name}</div>

        <div style={{ background: "#F8717115", border: "1px solid #F8717140", borderRadius: 8, padding: "14px", marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#F87171", marginBottom: 6 }}>⚠ Final Warning — Last Change</div>
          <div style={{ fontSize: 11, color: "#BCC6D8", lineHeight: 1.6, marginBottom: 10 }}>This is your <strong style={{ color: "#F0F4FF" }}>one and only</strong> schedule change. After submitting, your date will be locked and you must contact your coordinator directly for any further adjustments.</div>
          <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
            <input type="checkbox" checked={changeWarnOk} onChange={e => setChangeWarnOk(e.target.checked)}
              style={{ marginTop: 2, width: 16, height: 16, accentColor: "#F87171", flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: "#F0F4FF" }}>I understand this is my final allowed schedule change</span>
          </label>
        </div>

        <div style={{ ...S.card, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "#0F1729", borderRadius: 6, padding: "8px 12px", fontSize: 11, color: "#4A5278" }}>
            Current date: <strong style={{ color: "#F87171" }}>{job.vendorPortalDate}</strong>
          </div>
          <div>
            <label style={S.label}>New Date *</label>
            <input type="date" value={schedDate} onChange={e => setSchedDate(e.target.value)} style={S.input} />
          </div>
          <div>
            <label style={S.label}>New Arrival Time (optional)</label>
            <input type="time" value={schedTime} onChange={e => setSchedTime(e.target.value)} style={S.input} />
          </div>
          <div>
            <label style={S.label}>Reason for Change</label>
            <textarea value={schedNote} onChange={e => setSchedNote(e.target.value)} rows={2} placeholder="Brief reason for the change…"
              style={{ ...S.input, resize: "vertical" }} />
          </div>
          <button disabled={!schedDate || !changeWarnOk} onClick={() => {
            update({
              vendorPortalDate: schedDate,
              vendorPortalTime: schedTime,
              vendorScheduleChangedAt: new Date().toISOString(),
              vendorScheduleChangeReason: schedNote,
              startDate: schedDate,
            });
            setView("main");
          }} style={{ ...S.btnGreen, opacity: (schedDate && changeWarnOk) ? 1 : 0.4, cursor: (schedDate && changeWarnOk) ? "pointer" : "not-allowed" }}>
            ✅ Confirm New Date
          </button>
        </div>
        <div style={S.footer}>Farmer Development Inc. · (810) 844-1544 · farmerdevelopment.com</div>
      </div></div>
    );

    // No date yet — prompt for schedule
    return (
      <div style={S.page}><div style={S.wrap}>
        {S.logo}
        <div style={{ fontSize: 22, fontWeight: 800, color: "#F0F4FF", marginBottom: 4 }}>Set Your Schedule</div>
        {sub && <div style={{ fontSize: 14, color: "#4A5278", marginBottom: 20 }}>Hi {sub.name} — the job is confirmed. Please set your schedule date below.</div>}

        <JobCard />

        <div style={{ background: "#F8717110", border: "1px solid #F8717130", borderRadius: 8, padding: "12px 14px", marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#F87171", marginBottom: 4 }}>⚠ Schedule Change Policy</div>
          <div style={{ fontSize: 11, color: "#BCC6D8", lineHeight: 1.6 }}>Once submitted, you may only change this date <strong style={{ color: "#F0F4FF" }}>one time</strong>. Please confirm your availability before submitting.</div>
        </div>

        <div style={{ ...S.card, display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={S.label}>Date *</label>
            <input type="date" value={schedDate} onChange={e => setSchedDate(e.target.value)} style={S.input} />
          </div>
          <div>
            <label style={S.label}>Arrival Time (optional)</label>
            <input type="time" value={schedTime} onChange={e => setSchedTime(e.target.value)} style={S.input} />
          </div>
          <div>
            <label style={S.label}>Notes (optional)</label>
            <textarea value={schedNote} onChange={e => setSchedNote(e.target.value)} rows={2} placeholder="Access notes, questions…"
              style={{ ...S.input, resize: "vertical" }} />
          </div>
          {schedDate && site?.accessCode && (
            <div style={{ background: "#4ADE8010", border: "1px solid #4ADE8030", borderRadius: 8, padding: "12px 14px" }}>
              <div style={{ fontSize: 10, color: "#4ADE80", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>🔐 Site Access Code — Save This!</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#4ADE80", letterSpacing: "0.15em", fontFamily: "monospace" }}>{site.accessCode}</div>
            </div>
          )}
          <button disabled={!schedDate} onClick={() => {
            update({
              vendorPortalDate: schedDate,
              vendorPortalTime: schedTime,
              vendorPortalNote: schedNote,
              vendorPortalStatus: "scheduled",
              vendorPortalRespondedAt: new Date().toISOString(),
              startDate: schedDate,
            });
            setView("main");
          }} style={{ ...S.btnGreen, opacity: schedDate ? 1 : 0.4, cursor: schedDate ? "pointer" : "not-allowed" }}>
            📅 Confirm Schedule
          </button>
        </div>
        <div style={S.footer}>Farmer Development Inc. · (810) 844-1544 · farmerdevelopment.com</div>
      </div></div>
    );
  }

  // ── Other stages — generic "link not ready" ──
  return (
    <div style={{ ...S.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🕐</div>
        <div style={{ fontSize: 18, color: "#F0F4FF", marginBottom: 8 }}>Not Ready Yet</div>
        <div style={{ fontSize: 13, color: "#4A5278" }}>This job is still being processed. Check back soon or contact your coordinator.</div>
        <div style={S.footer}>Farmer Development Inc. · farmerdevelopment.com</div>
      </div>
    </div>
  );
}

// ── SUB-FACING RESPONSE PAGE ─────────────────────────────────────────────────
function SubPage({ token, fmJobs, setFmJobs, subcontractors, companies, sites }) {
  const job = fmJobs.find(j => j.subToken === token);
  const sub = subcontractors.find(s => s.id === job?.subcontractorId);
  const co  = companies.find(c => c.id === job?.companyId);
  const site = sites.find(s => s.id === job?.siteId);

  const [view,       setView]       = useState("main"); // main | quote | declined | done
  const [quotePrice, setQuotePrice] = useState("");
  const [quoteScope, setQuoteScope] = useState("");
  const [quoteNote,  setQuoteNote]  = useState("");
  const [subAccepted,setSubAccepted]= useState(job?.subResponse === "accepted");

  const vendorNTE = job ? (job.vendorNTE ? Number(job.vendorNTE) : fmVendorNTE(Number(job.contractValue||0))) : 0;

  const update = (patch) => {
    const updated = { ...job, ...patch };
    setFmJobs(prev => prev.map(j => j.id === job.id ? updated : j));
    try { supa.from("fm_jobs").update(fmJobToDB(updated)).eq("id", job.id); } catch(e) {}
  };

  if (!job) return (
    <div style={{ minHeight: "100vh", background: "#1A2240", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", color: "#4A5278" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔗</div>
        <div style={{ fontSize: 18, color: "#1A2240", marginBottom: 8 }}>Link not found</div>
        <div style={{ fontSize: 13 }}>This link may have expired or already been responded to.</div>
      </div>
    </div>
  );

  if (view === "done" || job.subResponse) return (
    <div style={{ minHeight: "100vh", background: "#1A2240", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>
          {job.subResponse === "accepted" ? "✅" : job.subResponse === "quoted" ? "📋" : "❌"}
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color: "#1A2240", marginBottom: 8 }}>
          {job.subResponse === "accepted" ? "Accepted!" : job.subResponse === "quoted" ? "Quote Submitted!" : "Declined"}
        </div>
        <div style={{ fontSize: 14, color: "#4A5278" }}>
          {job.subResponse === "accepted" && "We'll be in touch shortly with next steps."}
          {job.subResponse === "quoted"   && "Your quote has been sent to the team for review."}
          {job.subResponse === "declined" && "Thank you for letting us know. We'll find another vendor."}
        </div>
        <div style={{ marginTop: 32, fontSize: 12, color: "#3D4570" }}>Farmer Development Inc. · farmerdevelopment.com</div>
      </div>
    </div>
  );

  if (view === "declined") return (
    <div style={{ minHeight: "100vh", background: "#1A2240", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ maxWidth: 480, width: "100%", background: "#ECEEF8", borderRadius: 16, padding: 32, border: "1px solid #CBD1E8" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#F87171", marginBottom: 16 }}>Decline this job?</div>
        <div style={{ fontSize: 13, color: "#4A5278", marginBottom: 24 }}>Please confirm you are unable to take <strong style={{ color: "#1A2240" }}>{job.name}</strong>. The team will be notified.</div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setView("main")} style={{ flex: 1, padding: "12px", borderRadius: 8, border: "1px solid #3D4570", background: "transparent", color: "#4A5278", fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>Go Back</button>
          <button onClick={() => { update({ subResponse: "declined", stage: "estimating", subSentAt: null }); setView("done"); }}
            style={{ flex: 1, padding: "12px", borderRadius: 8, border: "none", background: "#F87171", color: "#FFF", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            Confirm Decline
          </button>
        </div>
      </div>
    </div>
  );

  if (view === "quote") return (
    <div style={{ minHeight: "100vh", background: "#1A2240", padding: 24, fontFamily: "inherit" }}>
      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: "#3B6FE8", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>FARMER DEVELOPMENT INC.</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#1A2240" }}>Submit Your Quote</div>
          <div style={{ fontSize: 13, color: "#4A5278", marginTop: 4 }}>{job.name}</div>
        </div>

        <div style={{ background: "#FCD34D10", border: "1px solid #FCD34D30", borderRadius: 10, padding: "14px 16px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 11, color: "#FCD34D", textTransform: "uppercase", letterSpacing: "0.07em" }}>Client Authorized Amount</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#FCD34D" }}>{fmt(vendorNTE)}</div>
        </div>

        <div style={{ background: "#ECEEF8", borderRadius: 12, padding: 24, border: "1px solid #CBD1E8", display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, color: "#4A5278", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.07em" }}>Your Price *</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#4A5278", fontSize: 14 }}>$</span>
              <input value={quotePrice} onChange={e => setQuotePrice(e.target.value)} type="number" placeholder="0.00"
                style={{ width: "100%", boxSizing: "border-box", padding: "12px 12px 12px 28px", background: "#1A2240", border: "1px solid #3D4570", borderRadius: 8, color: "#1A2240", fontSize: 16, fontFamily: "inherit", outline: "none" }} />
            </div>
            {quotePrice && (
              <div style={{ marginTop: 6, fontSize: 12, fontWeight: 600, color: Number(quotePrice) <= vendorNTE ? "#4ADE80" : "#F87171" }}>
                {Number(quotePrice) <= vendorNTE ? "✓ Within authorized amount" : "⚠ Exceeds authorized amount by " + fmt(Number(quotePrice) - vendorNTE)}
              </div>
            )}
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, color: "#4A5278", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.07em" }}>Scope of Work You're Quoting</label>
            <textarea value={quoteScope} onChange={e => setQuoteScope(e.target.value)} rows={3} placeholder="Describe the work you are quoting for…"
              style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", background: "#1A2240", border: "1px solid #3D4570", borderRadius: 8, color: "#1A2240", fontSize: 14, fontFamily: "inherit", outline: "none", resize: "vertical" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, color: "#4A5278", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.07em" }}>Notes (optional)</label>
            <textarea value={quoteNote} onChange={e => setQuoteNote(e.target.value)} rows={2} placeholder="Any conditions, exclusions, or comments…"
              style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", background: "#1A2240", border: "1px solid #3D4570", borderRadius: 8, color: "#1A2240", fontSize: 14, fontFamily: "inherit", outline: "none", resize: "vertical" }} />
          </div>
          <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
            <button onClick={() => setView("main")} style={{ flex: 0, padding: "12px 20px", borderRadius: 8, border: "1px solid #3D4570", background: "transparent", color: "#4A5278", fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>← Back</button>
            <button disabled={!quotePrice}
              onClick={() => { update({ vendorQuotePrice: quotePrice, vendorQuoteScope: quoteScope, vendorQuoteNotes: quoteNote, subResponse: "quoted", stage: "generate_proposal" }); setView("done"); }}
              style={{ flex: 1, padding: "12px", borderRadius: 8, border: "none", background: !quotePrice ? "#3D4570" : "#3B6FE8", color: !quotePrice ? "#353C62" : "#FFF", fontSize: 15, fontWeight: 700, cursor: quotePrice ? "pointer" : "not-allowed", fontFamily: "inherit" }}>
              Submit Quote
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Main view
  return (
    <div style={{ minHeight: "100vh", background: "#1A2240", padding: 24, fontFamily: "inherit" }}>
      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, color: "#3B6FE8", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>FARMER DEVELOPMENT INC.</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#1A2240", lineHeight: 1.2 }}>Quote Request</div>
          {sub && <div style={{ fontSize: 14, color: "#4A5278", marginTop: 4 }}>Hi {sub.name} — please review and respond below.</div>}
        </div>

        {/* Job card */}
        <div style={{ background: "#ECEEF8", borderRadius: 12, padding: 24, border: "1px solid #CBD1E8", marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: "#4A5278", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Job Details</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#1A2240", marginBottom: 12 }}>{job.name}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {co && <div style={{ display: "flex", gap: 10 }}><span style={{ fontSize: 12, color: "#4A5278", width: 80, flexShrink: 0 }}>Client</span><span style={{ fontSize: 12, color: "#1A2240" }}>{co.name}</span></div>}
            {(site?.address || job.storeCode) && <div style={{ display: "flex", gap: 10 }}><span style={{ fontSize: 12, color: "#4A5278", width: 80, flexShrink: 0 }}>Location</span><span style={{ fontSize: 12, color: "#1A2240" }}>{site?.address || "Store " + job.storeCode}</span></div>}
            {job.ownersProjectNo && <div style={{ display: "flex", gap: 10 }}><span style={{ fontSize: 12, color: "#4A5278", width: 80, flexShrink: 0 }}>WO #</span><span style={{ fontSize: 12, color: "#1A2240" }}>{job.ownersProjectNo}</span></div>}
            {job.bidDueDate && <div style={{ display: "flex", gap: 10 }}><span style={{ fontSize: 12, color: "#4A5278", width: 80, flexShrink: 0 }}>Bid Due</span><span style={{ fontSize: 12, color: "#FCD34D" }}>{new Date(job.bidDueDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span></div>}
            {site?.phone && <div style={{ display: "flex", gap: 10 }}><span style={{ fontSize: 12, color: "#4A5278", width: 80, flexShrink: 0 }}>Site Phone</span><span style={{ fontSize: 12, color: "#1A2240" }}>{site.phone}</span></div>}
          </div>
          {job.scopeOfWork && (
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #CBD1E8" }}>
              <div style={{ fontSize: 11, color: "#4A5278", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Scope of Work</div>
              <div style={{ fontSize: 13, color: "#BCC6D8", lineHeight: 1.6 }}>{job.scopeOfWork}</div>
            </div>
          )}
          {job.notes && (
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #CBD1E8" }}>
              <div style={{ fontSize: 11, color: "#4A5278", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>Additional Notes</div>
              <div style={{ fontSize: 13, color: "#BCC6D8", lineHeight: 1.6 }}>{job.notes}</div>
            </div>
          )}

          {/* Access code — shown only after accept */}
          {subAccepted && site?.accessCode && (
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #CBD1E8" }}>
              <div style={{ background: "#4ADE8010", border: "1px solid #4ADE8030", borderRadius: 8, padding: "12px 14px" }}>
                <div style={{ fontSize: 11, color: "#4ADE80", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>🔐 Site Access Code</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#4ADE80", letterSpacing: "0.15em", fontFamily: "monospace" }}>{site.accessCode}</div>
              </div>
            </div>
          )}
          {subAccepted && !site?.accessCode && (
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #CBD1E8" }}>
              <div style={{ fontSize: 12, color: "#4A5278", fontStyle: "italic" }}>No access code on file — contact coordinator if needed.</div>
            </div>
          )}
        </div>

        {/* Job photos — shown only after accept */}
        {subAccepted && job.photos && job.photos.length > 0 && (
          <div style={{ background: "#ECEEF8", borderRadius: 12, padding: 20, border: "1px solid #CBD1E8", marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: "#4A5278", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>📸 Site Photos</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
              {job.photos.map((p, i) => (
                <a key={i} href={p.data} target="_blank" rel="noreferrer">
                  <img src={p.data} alt={p.name || "Photo " + (i+1)} style={{ width: "100%", borderRadius: 8, objectFit: "cover", aspectRatio: "4/3", display: "block" }} />
                  {p.caption && <div style={{ fontSize: 11, color: "#4A5278", marginTop: 4 }}>{p.caption}</div>}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Approved amount */}
        <div style={{ background: "#FCD34D0F", border: "1px solid #FCD34D40", borderRadius: 12, padding: 20, marginBottom: 24, textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "#FCD34D", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 6 }}>You Are Approved For</div>
          <div style={{ fontSize: 36, fontWeight: 800, color: "#FCD34D", letterSpacing: "-0.02em" }}>{fmt(vendorNTE)}</div>
          <div style={{ fontSize: 11, color: "#6A5020", marginTop: 4 }}>Accept this amount or submit a custom quote below</div>
        </div>

        {/* Three action buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button onClick={() => { update({ subResponse: "accepted", vendorQuotePrice: String(vendorNTE), stage: "generate_proposal" }); setSubAccepted(true); setView("done"); }}
            style={{ width: "100%", padding: "16px", borderRadius: 10, border: "none", background: "#4ADE80", color: "#0A1A0A", fontSize: 16, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", letterSpacing: "-0.01em" }}>
            ✅ Accept at {fmt(vendorNTE)}
          </button>
          <button onClick={() => setView("quote")}
            style={{ width: "100%", padding: "16px", borderRadius: 10, border: "2px solid #3B6FE8", background: "transparent", color: "#3B6FE8", fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            📋 Provide a Quote
          </button>
          <button onClick={() => setView("declined")}
            style={{ width: "100%", padding: "14px", borderRadius: 10, border: "1px solid #3D4570", background: "transparent", color: "#353C62", fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
            ✕ Unable to Help
          </button>
        </div>

        <div style={{ marginTop: 32, textAlign: "center", fontSize: 11, color: "#3D4570" }}>Farmer Development Inc. · (810) 844-1544 · farmerdevelopment.com</div>
      </div>
    </div>
  );
}

// ── SUB SCHEDULING + INVOICE PAGE ────────────────────────────────────────────
function SchedPage({ token, fmJobs, setFmJobs, subcontractors, companies, sites }) {
  const job = fmJobs.find(j => j.schedToken === token);
  const sub  = subcontractors.find(s => s.id === job?.subcontractorId);
  const co   = companies.find(c => c.id === job?.companyId);
  const site = sites.find(s => s.id === job?.siteId);

  const [view,         setView]         = useState("main"); // main | invoice | done
  const [schedDate,    setSchedDate]    = useState(job?.scheduledDate || "");
  const [invoiceAmt,   setInvoiceAmt]   = useState("");
  const [invoiceNotes, setInvoiceNotes] = useState("");
  const [invoicePhotos,setInvoicePhotos]= useState([]);
  const [uploading,    setUploading]    = useState(false);

  const update = (patch) => {
    const updated = { ...job, ...patch };
    setFmJobs(prev => prev.map(j => j.id === job.id ? updated : j));
    try { supa.from("fm_jobs").update(fmJobToDB(updated)).eq("id", job.id); } catch(e) {}
  };

  const today = new Date(); today.setHours(0,0,0,0);
  const schedDt = job?.scheduledDate ? new Date(job.scheduledDate + "T12:00:00") : null;
  const twoDaysBefore = schedDt ? new Date(schedDt.getTime() - 2*86400000) : null;
  const isReminder = twoDaysBefore && today >= twoDaysBefore && today < schedDt;

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    setUploading(true);
    Promise.all(files.map(f => new Promise(res => {
      const r = new FileReader();
      r.onload = ev => res({ data: ev.target.result, name: f.name });
      r.readAsDataURL(f);
    }))).then(photos => { setInvoicePhotos(prev => [...prev, ...photos]); setUploading(false); });
    e.target.value = "";
  };

  if (!job) return (
    <div style={{ minHeight: "100vh", background: "#1A2240", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", color: "#4A5278" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔗</div>
        <div style={{ fontSize: 18, color: "#1A2240", marginBottom: 8 }}>Link not found</div>
        <div style={{ fontSize: 13 }}>This scheduling link may have expired.</div>
      </div>
    </div>
  );

  const inputSt = { width: "100%", boxSizing: "border-box", padding: "12px", background: "#1A2240", border: "1px solid #3D4570", borderRadius: 8, color: "#1A2240", fontSize: 14, fontFamily: "inherit", outline: "none" };

  if (view === "done") return (
    <div style={{ minHeight: "100vh", background: "#1A2240", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: "#1A2240", marginBottom: 8 }}>Invoice Submitted!</div>
        <div style={{ fontSize: 14, color: "#4A5278" }}>Your invoice and photos have been sent to the team for review.</div>
        <div style={{ marginTop: 32, fontSize: 12, color: "#3D4570" }}>Farmer Development Inc. · (810) 844-1544</div>
      </div>
    </div>
  );

  if (view === "invoice") return (
    <div style={{ minHeight: "100vh", background: "#1A2240", padding: 24, fontFamily: "inherit" }}>
      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: "#3B6FE8", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>FARMER DEVELOPMENT INC.</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#1A2240" }}>Submit Invoice</div>
          <div style={{ fontSize: 13, color: "#4A5278", marginTop: 4 }}>{job.name}</div>
        </div>

        <div style={{ background: "#ECEEF8", borderRadius: 12, padding: 24, border: "1px solid #CBD1E8", display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, color: "#4A5278", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.07em" }}>Invoice Amount *</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#4A5278" }}>$</span>
              <input type="number" value={invoiceAmt} onChange={e => setInvoiceAmt(e.target.value)} placeholder="0.00" style={{ ...inputSt, paddingLeft: 28 }} />
            </div>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, color: "#4A5278", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.07em" }}>Work Completed Notes</label>
            <textarea value={invoiceNotes} onChange={e => setInvoiceNotes(e.target.value)} rows={3} placeholder="Describe the work completed…" style={{ ...inputSt, resize: "vertical" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, color: "#4A5278", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.07em" }}>
              Photos of Completed Work * <span style={{ color: "#F87171" }}>(Required)</span>
            </label>
            {invoicePhotos.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 10 }}>
                {invoicePhotos.map((p, i) => (
                  <div key={i} style={{ position: "relative" }}>
                    <img src={p.data} alt={p.name} style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 8 }} />
                    <button onClick={() => setInvoicePhotos(prev => prev.filter((_,j) => j !== i))}
                      style={{ position: "absolute", top: 4, right: 4, width: 20, height: 20, borderRadius: "50%", border: "none", background: "#F87171CC", color: "#FFF", fontSize: 10, cursor: "pointer", padding: 0 }}>✕</button>
                  </div>
                ))}
              </div>
            )}
            <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px", borderRadius: 8, border: "2px dashed #3D4570", cursor: "pointer", color: "#3B6FE8", fontSize: 13 }}>
              📷 {uploading ? "Uploading…" : "Add Photos"}
              <input type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handlePhotoUpload} />
            </label>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setView("main")} style={{ flex: 0, padding: "12px 20px", borderRadius: 8, border: "1px solid #3D4570", background: "transparent", color: "#4A5278", fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>← Back</button>
            <button
              disabled={!invoiceAmt || invoicePhotos.length === 0}
              onClick={() => { update({ subInvoiceSubmitted: true, subInvoiceAmount: invoiceAmt, subInvoiceNotes: invoiceNotes, subInvoicePhotos: invoicePhotos, subInvoiceDate: new Date().toISOString() }); setView("done"); }}
              style={{ flex: 1, padding: "12px", borderRadius: 8, border: "none", background: (!invoiceAmt || invoicePhotos.length === 0) ? "#3D4570" : "#4ADE80", color: (!invoiceAmt || invoicePhotos.length === 0) ? "#353C62" : "#0A1A0A", fontSize: 15, fontWeight: 700, cursor: (!invoiceAmt || invoicePhotos.length === 0) ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
              {invoicePhotos.length === 0 ? "Add photos to submit" : !invoiceAmt ? "Enter invoice amount" : "✅ Submit Invoice"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#1A2240", padding: 24, fontFamily: "inherit" }}>
      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: "#3B6FE8", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>FARMER DEVELOPMENT INC.</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#1A2240" }}>{job.scheduledDate ? (isReminder ? "⏰ Reminder: Work Tomorrow" : "📋 Job Details") : "📅 Schedule Your Visit"}</div>
          {sub && <div style={{ fontSize: 14, color: "#4A5278", marginTop: 4 }}>Hi {sub.name}</div>}
        </div>

        {/* 2-day reminder banner */}
        {isReminder && (
          <div style={{ background: "#FCD34D15", border: "1px solid #FCD34D40", borderRadius: 12, padding: 16, marginBottom: 16, textAlign: "center" }}>
            <div style={{ fontSize: 13, color: "#FCD34D", fontWeight: 700 }}>⏰ Work is scheduled for {new Date(job.scheduledDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</div>
            <div style={{ fontSize: 12, color: "#6A5020", marginTop: 4 }}>Please submit your invoice + photos after completing the work.</div>
          </div>
        )}

        {/* Job details */}
        <div style={{ background: "#ECEEF8", borderRadius: 12, padding: 24, border: "1px solid #CBD1E8", marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: "#4A5278", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Job Details</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#1A2240", marginBottom: 12 }}>{job.name}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {co   && <div style={{ display: "flex", gap: 10 }}><span style={{ fontSize: 12, color: "#4A5278", width: 80, flexShrink: 0 }}>Client</span><span style={{ fontSize: 12, color: "#1A2240" }}>{co.name}</span></div>}
            {(site?.address || job.storeCode) && <div style={{ display: "flex", gap: 10 }}><span style={{ fontSize: 12, color: "#4A5278", width: 80, flexShrink: 0 }}>Location</span><span style={{ fontSize: 12, color: "#1A2240" }}>{site?.address || "Store " + job.storeCode}</span></div>}
            {site?.accessCode && <div style={{ display: "flex", gap: 10 }}><span style={{ fontSize: 12, color: "#4A5278", width: 80, flexShrink: 0 }}>Access Code</span><span style={{ fontSize: 14, fontWeight: 700, color: "#4ADE80", fontFamily: "monospace", letterSpacing: "0.1em" }}>{site.accessCode}</span></div>}
            {job.ownersProjectNo && <div style={{ display: "flex", gap: 10 }}><span style={{ fontSize: 12, color: "#4A5278", width: 80, flexShrink: 0 }}>WO #</span><span style={{ fontSize: 12, color: "#1A2240" }}>{job.ownersProjectNo}</span></div>}
          </div>
          {job.scopeOfWork && (
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #CBD1E8" }}>
              <div style={{ fontSize: 11, color: "#4A5278", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Scope of Work</div>
              <div style={{ fontSize: 13, color: "#BCC6D8", lineHeight: 1.6 }}>{job.scopeOfWork}</div>
            </div>
          )}
          {/* Site photos */}
          {(job.photos||[]).length > 0 && (
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #CBD1E8" }}>
              <div style={{ fontSize: 11, color: "#4A5278", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>📸 Site Photos</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
                {(job.photos||[]).map((p,i) => <a key={i} href={p.data} target="_blank" rel="noreferrer"><img src={p.data} alt={p.name} style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", borderRadius: 8 }} /></a>)}
              </div>
            </div>
          )}
        </div>

        {/* Schedule or invoice actions */}
        {!job.subInvoiceSubmitted ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {!job.scheduledDate ? (
              <>
                <div style={{ background: "#ECEEF8", borderRadius: 12, padding: 20, border: "1px solid #CBD1E8" }}>
                  <div style={{ fontSize: 13, color: "#1A2240", fontWeight: 600, marginBottom: 12 }}>Confirm your scheduled date</div>
                  <input type="date" value={schedDate} onChange={e => setSchedDate(e.target.value)} style={{ ...inputSt, marginBottom: 12 }} min={new Date().toISOString().slice(0,10)} />
                  <button disabled={!schedDate}
                    onClick={() => update({ scheduledDate: schedDate })}
                    style={{ width: "100%", padding: "14px", borderRadius: 10, border: "none", background: schedDate ? "#3B6FE8" : "#3D4570", color: schedDate ? "#FFF" : "#353C62", fontSize: 15, fontWeight: 700, cursor: schedDate ? "pointer" : "not-allowed", fontFamily: "inherit" }}>
                    📅 Confirm Schedule Date
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{ background: "#4ADE8015", border: "1px solid #4ADE8030", borderRadius: 12, padding: 16, textAlign: "center" }}>
                  <div style={{ fontSize: 12, color: "#4ADE80", marginBottom: 4 }}>✓ Scheduled</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#1A2240" }}>{new Date(job.scheduledDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</div>
                </div>
                <button onClick={() => setView("invoice")}
                  style={{ width: "100%", padding: "16px", borderRadius: 10, border: "none", background: "#4ADE80", color: "#0A1A0A", fontSize: 16, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
                  📋 Submit Invoice + Photos
                </button>
              </>
            )}
          </div>
        ) : (
          <div style={{ background: "#4ADE8015", border: "1px solid #4ADE8030", borderRadius: 12, padding: 20, textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#4ADE80" }}>Invoice already submitted</div>
            <div style={{ fontSize: 13, color: "#4A5278", marginTop: 4 }}>Amount: {fmt(Number(job.subInvoiceAmount || 0))}</div>
          </div>
        )}

        <div style={{ marginTop: 32, textAlign: "center", fontSize: 11, color: "#3D4570" }}>Farmer Development Inc. · (810) 844-1544</div>
      </div>
    </div>
  );
}

export default function App() {
  // URL routing — sub-facing page
  const urlToken  = useMemo(() => new URLSearchParams(window.location.search).get("subtoken"), []);
  const urlSched  = useMemo(() => new URLSearchParams(window.location.search).get("schedtoken"), []);
  const urlVendor = useMemo(() => new URLSearchParams(window.location.search).get("vendortoken"), []);

  const [activeBU,  setActiveBU]  = useState("all");
  const [activeNav, setActiveNav] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [crmMode, setCrmMode] = useState(false); // top-level CRM/Sales view
  const [salesTab, setSalesTab] = useState("major"); // major | capex | acquisition
  const [crmTagFilter, setCrmTagFilter] = useState(null); // null | "FM" | "CapEx" | "Major" | "Lawn" | "Snow"

  // CRM
  const [companies,       setCompanies]       = useState([]);
  const [contacts,        setContacts]        = useState([]);
  const [dbLoading,       setDbLoading]       = useState({ companies: false, sites: false, lawnSites: false, subcontractors: false });
  const [dbError,         setDbError]         = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [editCompanyId,   setEditCompanyId]   = useState(null);
  const [editContactId,   setEditContactId]   = useState(null);
  const [companyForm, setCompanyForm] = useState({ name: "", website: "", address: "", logo: "", notes: "" });
  const [contactForm, setContactForm] = useState({ companyId: "", firstName: "", lastName: "", title: "", email: "", phone: "" });
  const [crmSearch,   setCrmSearch]   = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [crmTab, setCrmTab] = useState("overview");

  // Inline add
  const [showInlineCompany, setShowInlineCompany] = useState(false);
  const [showInlineContact, setShowInlineContact] = useState(false);
  const [inlineCompany, setInlineCompany] = useState({ name: "", website: "", address: "", logo: "", notes: "" });
  const [inlineContact, setInlineContact] = useState({ firstName: "", lastName: "", title: "", email: "", phone: "" });

  // Pipeline
  const [pipeline,     setPipeline]     = useState([]);
  const [showForm,     setShowForm]     = useState(false);
  const [editId,       setEditId]       = useState(null);
  const [form,         setForm]         = useState({ name: "", companyId: "", contactId: "", value: "", stage: "Budgeting", closeDate: "", notes: "", bu: "major", budgetDueDate: "", bidDueDate: "", nextSteps: [] });
  const [pipelineView, setPipelineView] = useState("kanban");
  const [filterBU,     setFilterBU]     = useState("all");
  const [search,       setSearch]       = useState("");
  const [selectedOpp,  setSelectedOpp]  = useState(null);
  const [newNextStep,  setNewNextStep]  = useState({ step: "", dueDate: "" });

  // Jobs (Major Projects)
  const [jobs,        setJobs]        = useState([]);
  const [showJobForm, setShowJobForm] = useState(false);
  const [editJobId,   setEditJobId]   = useState(null);
  const [jobForm,     setJobForm]     = useState({ name: "", companyId: "", client: "", contractValue: "", startDate: "", endDate: "", pm: "", pct: 0, status: "On Schedule", notes: "", bu: "major" });
  const [selectedJob, setSelectedJob] = useState(null);

  // CapEx Jobs
  const [capexJobs,        setCapexJobs]        = useState(INIT_CAPEX_JOBS);
  const [showCapexForm,    setShowCapexForm]    = useState(false);
  const [editCapexId,      setEditCapexId]      = useState(null);
  const [capexForm,        setCapexForm]        = useState({ name: "", companyId: "", siteId: "", contractValue: "", stage: "estimating", startDate: "", endDate: "", pm: "", pct: 0, bidDueDate: "", followUpDate: "", buyoutDate: "", invoiceDate: "", notes: "" });
  const [selectedCapexJob, setSelectedCapexJob] = useState(null);
  const [capexSearch,      setCapexSearch]      = useState("");

  // FM Jobs
  const [fmJobs,        setFmJobs]        = useState(INIT_FM_JOBS);
  const [showFmForm,    setShowFmForm]    = useState(false);
  const [editFmId,      setEditFmId]      = useState(null);
  const [fmCompanySearch, setFmCompanySearch] = useState("");
  const [fmSiteSearch,    setFmSiteSearch]    = useState("");
  const [fmForm,        setFmForm]        = useState({ name: "", companyId: "", siteId: "", contractValue: "", grossProfit: "", nte: "", stage: "estimating", startDate: "", endDate: "", pm: "", pct: 0, bidDueDate: "", quoteDueDate: "", proposalDate: "", followUpDate: "", buyoutDate: "", invoiceDate: "", notes: "", storeCode: "", projectNo: "", ownersProjectNo: "", vendorInvoiceAmount: "", vendorInvoiceNumber: "", subcontractorId: "", vendorNextStep: "", vendorQuotePrice: "", vendorQuoteScope: "", scopeOfWork: "", coordinator: "" });
  const [selectedFmJob, setSelectedFmJob] = useState(null);
  const [fmSearch,      setFmSearch]      = useState("");
  const [fmCoordFilter, setFmCoordFilter] = useState("all");
  const [selectedCoord, setSelectedCoord] = useState(null); // coordinator report
  const [fmInbox,       setFmInbox]       = useState([]);   // unassigned leads
  const [showInboxForm, setShowInboxForm] = useState(false);
  const [inboxParseText,setInboxParseText]= useState("");
  const [inboxParsing,  setInboxParsing]  = useState(false);
  const [inboxForm,     setInboxForm]     = useState({ name: "", companyId: "", storeId: "", address: "", scopeOfWork: "", ownersProjectNo: "", bidDueDate: "", authorizedAmount: "", contactName: "", contactPhone: "", notes: "", source: "manual" });
  const [showProposal,  setShowProposal]  = useState(false);
  const [proposalJob,   setProposalJob]   = useState(null);
  const [proposalNum,   setProposalNum]   = useState("");
  const [proposalGrossValue, setProposalGrossValue] = useState(0);  // overrideable gross value
  const [proposalScope, setProposalScope] = useState("");           // editable scope of work
  const [proposalSections, setProposalSections] = useState([]);
  const [proposalExtras, setProposalExtras] = useState({ laborBurden: 0, salesTax: 0, generalLiability: 0, permitCost: 0 });

  // Sites — unified across all BUs
  const [sites,        setSites]        = useState([]);
  const [supaReady,    setSupaReady]    = useState(false);
  const [showSiteForm, setShowSiteForm] = useState(false);
  const [editSiteId,   setEditSiteId]   = useState(null);
  const [siteForm,     setSiteForm]     = useState({ companyId: "", contactIds: [], storeNumber: "", address: "", phone: "", accessCode: "", notes: "", lat: "", lng: "", businessUnits: [] });
  const [selectedSite, setSelectedSite] = useState(null);
  const [siteSearch,   setSiteSearch]   = useState("");
  const [siteGeocoding, setSiteGeocoding] = useState(false);

  // Lawn / Snow — derived from unified sites
  const lawnSites = sites.filter(s => (s.businessUnits||[]).includes("lawn"));
  const snowSites = sites.filter(s => (s.businessUnits||[]).includes("snow"));
  const lsData    = activeBU === "lawn" ? lawnSites : snowSites;
  const setLawnSites = () => {}; // no-op, derived
  const setSnowSites = () => {}; // no-op, derived

  const [lsSearch,         setLsSearch]         = useState("");
  const [selectedLsSite,   setSelectedLsSite]   = useState(null);
  const [showLsSiteForm,   setShowLsSiteForm]   = useState(false);
  const [editLsSiteId,     setEditLsSiteId]     = useState(null);
  const [lsSiteForm,       setLsSiteForm]       = useState({ companyId: "", storeNumber: "", address: "", phone: "", accessCode: "", notes: "", lat: "", lng: "" });
  const [lsGeocoding,      setLsGeocoding]      = useState(false);
  const [geocodeAllProgress, setGeocodeAllProgress] = useState(null); // { done, total } or null
  const [pricingSearch,  setPricingSearch]  = useState("");
  const [pricingFilter,  setPricingFilter]  = useState("all");
  const [pricingSort,    setPricingSort]    = useState("company");
  const [pricingShowSub, setPricingShowSub] = useState(true);
  const [mapLoaded,        setMapLoaded]        = useState(false);
  const [lsMapFilter,      setLsMapFilter]      = useState("all");
  const [expandedCompany,  setExpandedCompany]  = useState(null);
  const [expandedState,    setExpandedState]    = useState(null);

  // Lawn Bids
  const LAWN_BID_STATUSES = [
    { id: "bidding",          label: "Bidding",           color: "#FCD34D" },
    { id: "proposed",         label: "Proposed to Owner", color: "#60A5FA" },
    { id: "owner_approved",   label: "Owner Approved",    color: "#4ADE80" },
    { id: "contracted",       label: "Contracted",        color: "#A78BFA" },
    { id: "not_bidding",      label: "Not Bidding",       color: "#353C62" },
  ];

  const LAWN_SERVICES = [
    { id: "spring_cleanup",    label: "Spring Clean-up",     freq: "1x/year",   unit: "flat" },
    { id: "spring_mulch",      label: "Mulch (2\")",          freq: "1x/year",   unit: "flat" },
    { id: "spring_sprinkler",  label: "Sprinkler Start-up",  freq: "1x/year",   unit: "flat" },
    { id: "spring_trees",      label: "Prune Trees ≤12'",    freq: "1x/year",   unit: "flat" },
    { id: "mowing",            label: "Weekly Mowing",       freq: "28 cuts",   unit: "per_cut" },
    { id: "fall_cleanup",      label: "Fall Clean-up",       freq: "1x/year",   unit: "flat" },
    { id: "gutter_cleaning",   label: "Gutter Cleaning",     freq: "up to 3x",  unit: "flat" },
    { id: "retention_areas",   label: "Retention Areas",     freq: "monthly",   unit: "monthly" },
    { id: "weed_control",      label: "Weed Control",        freq: "4x/year",   unit: "flat" },
  ];
  // lawnBids: one record per site-season
  // services: { [serviceId]: { subPrice: number, ourPrice: number, included: bool } }
  const [lawnBids,       setLawnBids]       = useState([]);
  const [lawnBidMode,    setLawnBidMode]    = useState("bid"); // "bid" | "contract"
  const [lawnBidSeason,  setLawnBidSeason]  = useState("2025");
  const [editLawnBidId,  setEditLawnBidId]  = useState(null); // which site row is open
  const [lawnBidDocSiteId, setLawnBidDocSiteId] = useState(null); // site id for bid doc modal
  const [lawnBidDocSubId,  setLawnBidDocSubId]  = useState(null); // selected sub for bid doc
  const [showNotBidding,   setShowNotBidding]   = useState(false); // show not-bidding sites
  const [bidMapColFilter,  setBidMapColFilter]  = useState("all"); // map filter by column
  const [lawnSubcontractSiteId, setLawnSubcontractSiteId] = useState(null); // site id for subcontract modal
  const [acreageModalSiteId, setAcreageModalSiteId] = useState(null); // site id for mowing acreage calc
  const [acreageInput, setAcreageInput] = useState(""); // acreage input value
  const [ownerProposalSiteId, setOwnerProposalSiteId] = useState(null); // site id for owner proposal template picker
  const [expandedActiveSiteId, setExpandedActiveSiteId] = useState(null); // active site expanded detail
  const [showBidArchive, setShowBidArchive] = useState(false);
  const [bidStatFilter,  setBidStatFilter]  = useState(null); // null | "all" | "bidding" | "locked"

  const GP_MARGIN = 0.30;
  const calcOurPrice = (subPrice) => subPrice > 0 ? Math.ceil(subPrice / (1 - GP_MARGIN) * 100) / 100 : 0;

  const initLawnBid = (siteId) => {
    const services = {};
    LAWN_SERVICES.forEach(s => { services[s.id] = { subPrice: 0, ourPrice: 0, included: false }; });
    return { id: "lb_" + siteId + "_" + Date.now(), siteId, season: lawnBidSeason, services, locked: false, lockedDate: null, subcontractorIds: [], selectedSubId: "", notes: "", status: "bidding", subToken: null, subSentAt: null, ownerApprovedDate: null, subcontractUrl: "", ownerContractUrl: "", ownerContractFile: null, ownerContractFileName: "", subcontractFile: null, subcontractFileName: "", ownerProposalTemplateId: "", sitefotosUrl: "" };
  };

  const getLawnBid = (siteId) => lawnBids.find(b => b.siteId === siteId && b.season === lawnBidSeason) || null;

  const upsertLawnBid = (siteId, updater) => {
    setLawnBids(prev => {
      const existing = prev.find(b => b.siteId === siteId && b.season === lawnBidSeason);
      if (existing) return prev.map(b => b.siteId === siteId && b.season === lawnBidSeason ? updater(b) : b);
      const fresh = initLawnBid(siteId);
      return [...prev, updater(fresh)];
    });
  };

  const lawnBidAnnualOur = (bid) => {
    if (!bid) return 0;
    return LAWN_SERVICES.reduce((sum, s) => {
      const sv = bid.services[s.id];
      if (!sv || !sv.included || !sv.ourPrice) return sum;
      if (s.unit === "per_cut") return sum + sv.ourPrice * 28;
      if (s.unit === "monthly") return sum + sv.ourPrice * 7; // ~7 months season
      return sum + sv.ourPrice;
    }, 0);
  };

  // FM Team
  const [fmTeam,         setFmTeam]         = useState([]);
  const [showTeamForm,   setShowTeamForm]   = useState(false);
  const [editTeamId,     setEditTeamId]     = useState(null);
  const [teamForm,       setTeamForm]       = useState({ name: "", phone: "", email: "" });

  // FM Subcontractors
  const [subcontractors,    setSubcontractors]    = useState([]);
  const [showSubForm,       setShowSubForm]       = useState(false);
  const [editSubId,         setEditSubId]         = useState(null);
  const [subForm,           setSubForm]           = useState({ name: "", trade: "", phone: "", email: "", msaStatus: "missing", coiExpiry: "", w9: false, notes: "", services: [] });

  const navItems = NAV_ITEMS[activeBU] || NAV_ITEMS.all;
  const buColor  = BU_COLORS[activeBU];

  const handleBUChange = (id) => { setActiveBU(id); setActiveNav("dashboard"); setSelectedCoord(null); setCrmTagFilter(null); setSelectedCustomer(null); };

  // Punch list
  const dynamicPunchList = useMemo(() => {
    const items = [...PUNCH_LIST_STATIC];
    const today = new Date(); today.setHours(0,0,0,0);
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
    // FM: owner_approval follow-up reminders (hit PM's list)
    fmJobs.forEach(j => {
      if (j.stage === "owner_approval" && j.followUpDate) {
        const d = new Date(j.followUpDate + "T12:00:00");
        const overdue = d < today;
        const pmName = j.pm || j.coordinator || "";
        if (overdue || d <= soon) {
          items.push({
            id: "followup-" + j.id,
            text: "Follow up on proposal: " + j.name + (pmName ? " (" + pmName + ")" : ""),
            bu: "facility", priority: overdue || d <= urgent ? "high" : "medium",
            dueDate: j.followUpDate, tag: "FOLLOW-UP", fmJobId: j.id
          });
        }
      }
      // 2-day reminder before scheduled work date
      if (j.stage === "do_work" && j.scheduledDate && !j.subInvoiceSubmitted) {
        const d = new Date(j.scheduledDate + "T12:00:00");
        const twoDaysBefore = new Date(d.getTime() - 2*86400000);
        if (today >= twoDaysBefore && today <= d) {
          items.push({
            id: "sched-" + j.id,
            text: "Work scheduled in 2 days: " + j.name,
            bu: "facility", priority: "high",
            dueDate: j.scheduledDate, tag: "SCHEDULED", fmJobId: j.id
          });
        }
      }
    });
    return items.sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    });
  }, [pipeline, fmJobs]);

  const majorJobs = jobs.filter(j => j.bu === "major");

  // CRM helpers
  const getCompanyContacts  = (cid) => contacts.filter(p => p.companyId === cid);
  const getCompanyJobs      = (cid) => jobs.filter(j => j.companyId === cid);
  const getCompanyPipeline  = (cid) => pipeline.filter(o => o.companyId === cid);
  const getCompanyTotalValue = (cid) => jobs.filter(j => j.companyId === cid).reduce((s, j) => s + j.contractValue, 0);
  const getCompanySites     = (cid) => sites.filter(s => s.companyId === cid);

  // ── Supabase: load data on mount ──────────────────────────
  useEffect(() => {
    // Safety: always show app after 8s even if DB hangs
    const timeout = setTimeout(() => { setSupaReady(true); setDbError("Connection timed out."); }, 8000);
    const load = async () => {
      setDbLoading(l => ({ ...l, companies: true, sites: true, lawnSites: true, subcontractors: true }));
      try {
        const [coRes, siteRes, subRes, fmRes] = await Promise.all([
          supa.from("companies").select("*"),
          supa.from("sites").select("*"),
          supa.from("subcontractors").select("*"),
          supa.from("fm_jobs").select("*"),
        ]);
        if (coRes.data?.length)   setCompanies(coRes.data.map(dbToCompany));
        if (siteRes.data?.length) setSites(siteRes.data.map(dbToSite));
        if (subRes.data?.length)  setSubcontractors(subRes.data.map(dbToSub));
        if (fmRes.data?.length)   setFmJobs(fmRes.data.map(dbToFmJob));
        setSupaReady(true);
      } catch(e) {
        setDbError("Could not connect to database.");
        setSupaReady(true); // Always show the app even if DB fails
      }
      setDbLoading(l => ({ ...l, companies: false, sites: false, lawnSites: false, subcontractors: false }));
      clearTimeout(timeout);
    };
    load();
  }, []);

  // Site helpers
  const openAddSite = () => { setEditSiteId(null); setSiteForm({ companyId: "", contactIds: [], storeNumber: "", address: "", phone: "", accessCode: "", notes: "" }); setShowSiteForm(true); };
  const openEditSite = (s) => { setEditSiteId(s.id); setSiteForm({ ...s }); setShowSiteForm(true); };
  const saveSite = async () => {
    if (!siteForm.storeNumber.trim() && !siteForm.address.trim()) return;
    const entry = { ...siteForm, lat: parseFloat(siteForm.lat)||null, lng: parseFloat(siteForm.lng)||null };
    if (editSiteId) {
      const updated = { ...entry, id: editSiteId };
      setSites(sites.map(s => s.id === editSiteId ? updated : s));
      supa.from("sites").update(siteToDB(updated)).eq("id", editSiteId);
    } else {
      const newId = "s" + Date.now();
      const newEntry = { ...entry, id: newId };
      setSites(s => [...s, newEntry]);
      supa.from("sites").insert(siteToDB(newEntry));
    }
    setShowSiteForm(false);
  };
  const deleteSite = async (id) => { setSites(sites.filter(s => s.id !== id)); setSelectedSite(null); supa.from("sites").delete().eq("id", id); };

  const geocodeAllSites = async (siteList) => {
    const ungeocoded = siteList.filter(s => !s.lat || !s.lng);
    if (!ungeocoded.length) return;
    setGeocodeAllProgress({ done: 0, total: ungeocoded.length });
    for (let i = 0; i < ungeocoded.length; i++) {
      const site = ungeocoded[i];
      if (!site.address) continue;
      try {
        const res = await fetch("https://nominatim.openstreetmap.org/search?format=json&limit=1&q=" + encodeURIComponent(site.address));
        const geo = await res.json();
        if (geo[0]) {
          const lat = parseFloat(geo[0].lat);
          const lng = parseFloat(geo[0].lon);
          setSites(prev => prev.map(s => s.id === site.id ? { ...s, lat, lng } : s));
          await supa.from("sites").update({ lat, lng }).eq("id", site.id);
        }
      } catch(e) {}
      setGeocodeAllProgress({ done: i + 1, total: ungeocoded.length });
      await new Promise(r => setTimeout(r, 1100)); // Nominatim rate limit: 1 req/sec
    }
    setGeocodeAllProgress(null);
  };
  const toggleSiteContact = (contactId) => {
    const ids = siteForm.contactIds || [];
    setSiteForm(f => ({ ...f, contactIds: ids.includes(contactId) ? ids.filter(i => i !== contactId) : [...ids, contactId] }));
  };

  // Lawn/Snow site helpers
  const openAddLsSite  = () => { setEditLsSiteId(null); setLsSiteForm({ companyId: "", storeNumber: "", address: "", phone: "", accessCode: "", notes: "", lat: "", lng: "" }); setShowLsSiteForm(true); };
  const openEditLsSite = (s) => { setEditLsSiteId(s.id); setLsSiteForm({ ...s, lat: String(s.lat || ""), lng: String(s.lng || "") }); setShowLsSiteForm(true); };
  const saveLsSite = async () => {
    if (!lsSiteForm.address.trim() && !lsSiteForm.storeNumber.trim()) return;
    const buTag = activeBU; // "lawn" or "snow"
    const entry = { ...lsSiteForm, lat: parseFloat(lsSiteForm.lat)||null, lng: parseFloat(lsSiteForm.lng)||null };
    if (editLsSiteId) {
      const existing = sites.find(s => s.id === editLsSiteId) || {};
      const bus = existing.businessUnits || [];
      const updated = { ...existing, ...entry, id: editLsSiteId, businessUnits: bus.includes(buTag) ? bus : [...bus, buTag] };
      setSites(sites.map(s => s.id === editLsSiteId ? updated : s));
      supa.from("sites").update(siteToDB(updated)).eq("id", editLsSiteId);
    } else {
      const newId = (activeBU === "lawn" ? "ln" : "sn") + Date.now();
      const newEntry = { ...entry, id: newId, contactIds: [], businessUnits: [buTag] };
      setSites(s => [...s, newEntry]);
      supa.from("sites").insert(siteToDB(newEntry));
    }
    setShowLsSiteForm(false);
  };
  const deleteLsSite = async (id) => {
    setSites(sites.filter(s => s.id !== id));
    setSelectedLsSite(null);
    supa.from("sites").delete().eq("id", id);
  };

  // Company color map for pins
  const companyColorMap = useMemo(() => {
    const map = {};
    companies.forEach((c, i) => { map[c.id] = PIN_COLORS[i % PIN_COLORS.length]; });
    return map;
  }, [companies]);

  // CapEx job helpers
  const openAddCapex = () => { setEditCapexId(null); setCapexForm({ name: "", companyId: "", siteId: "", contractValue: "", stage: "estimating", startDate: "", endDate: "", pm: "", pct: 0, bidDueDate: "", followUpDate: "", buyoutDate: "", invoiceDate: "", notes: "" }); setShowCapexForm(true); };
  const openEditCapex = (j) => { setEditCapexId(j.id); setCapexForm({ ...j, contractValue: String(j.contractValue) }); setShowCapexForm(true); };
  const saveCapex = () => {
    if (!capexForm.name.trim()) return;
    const entry = { ...capexForm, contractValue: Number(capexForm.contractValue), pct: Number(capexForm.pct || 0) };
    if (editCapexId) setCapexJobs(capexJobs.map(j => j.id === editCapexId ? { ...entry, id: editCapexId } : j));
    else setCapexJobs([...capexJobs, { ...entry, id: "cx" + Date.now() }]);
    setShowCapexForm(false);
  };
  const deleteCapex = (id) => { setCapexJobs(capexJobs.filter(j => j.id !== id)); setSelectedCapexJob(null); };
  const moveCapexStage = (id, dir) => setCapexJobs(capexJobs.map(j => { if (j.id !== id) return j; const idx = CAPEX_FM_STAGES.findIndex(s => s.id === j.stage); return { ...j, stage: CAPEX_FM_STAGES[Math.max(0, Math.min(CAPEX_FM_STAGES.length - 1, idx + dir))].id }; }));

  // FM job helpers
  const openAddFm = () => { setEditFmId(null); setFmForm({ name: "", companyId: "", siteId: "", contractValue: "", grossProfit: "", stage: "estimating", startDate: "", endDate: "", pm: "", pct: 0, bidDueDate: "", quoteDueDate: "", proposalDate: "", followUpDate: "", buyoutDate: "", invoiceDate: "", notes: "", storeCode: "", projectNo: "", ownersProjectNo: "", vendorInvoiceAmount: "", vendorInvoiceNumber: "", subcontractorId: "", vendorNextStep: "", vendorQuotePrice: "", vendorQuoteScope: "", scopeOfWork: "", coordinator: "" }); setShowFmForm(true); };
  const openEditFm = (j) => { setEditFmId(j.id); setFmForm({ ...j, contractValue: String(j.contractValue) }); setShowFmForm(true); };
  const saveFm = () => {
    if (!fmForm.name.trim()) return;
    const entry = { ...fmForm, contractValue: Number(fmForm.contractValue||0), grossProfit: Number(fmForm.grossProfit||0), vendorInvoiceAmount: Number(fmForm.vendorInvoiceAmount||0), pct: Number(fmForm.pct || 0) };
    if (editFmId) {
      const updated = { ...entry, id: editFmId };
      setFmJobs(fmJobs.map(j => j.id === editFmId ? updated : j));
      try { supa.from("fm_jobs").update(fmJobToDB(updated)).eq("id", editFmId); } catch(e) {}
    } else {
      const newId = "fm" + Date.now();
      const newJob = { ...entry, id: newId };
      setFmJobs([...fmJobs, newJob]);
      try { supa.from("fm_jobs").insert(fmJobToDB(newJob)); } catch(e) {}
      // Auto-tag site with "facility" so it shows under FM tab immediately
      if (entry.siteId) {
        setSites(prev => prev.map(s => {
          if (s.id !== entry.siteId) return s;
          const bus = s.businessUnits || [];
          if (bus.includes("facility")) return s;
          const updated = { ...s, businessUnits: [...bus, "facility"] };
          try { supa.from("sites").update(siteToDB(updated)).eq("id", s.id); } catch(e) {}
          return updated;
        }));
      }
    }
    setShowFmForm(false);
    setFmCompanySearch(""); setFmSiteSearch("");
  };
  const deleteFm = (id) => { setFmJobs(fmJobs.filter(j => j.id !== id)); setSelectedFmJob(null); try { supa.from("fm_jobs").delete().eq("id", id); } catch(e) {} };
  // Persist a patch to an FM job in both state and DB
  const updateFmJobPersist = (id, patch) => {
    setFmJobs(prev => prev.map(j => {
      if (j.id !== id) return j;
      const updated = { ...j, ...patch };
      try { supa.from("fm_jobs").update(fmJobToDB(updated)).eq("id", id); } catch(e) {}
      return updated;
    }));
  };

  const parseInboxEmail = async () => {
    if (!inboxParseText.trim()) return;
    setInboxParsing(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `You extract FM (Facility Maintenance) work order and lead info from any format — emails, work order systems (like RAMP, ServiceChannel, Corrigo, etc.), structured text, or plain emails. Be aggressive about finding data even in dense formatted text.

Return ONLY valid JSON, no markdown, no extra text:
{
  "name": "concise job title based on the subject/trade/issue e.g. 'Backflow Testing', 'HVAC Repair', 'Roof Leak'",
  "companyName": "the CLIENT company name (property owner or manager, NOT the vendor). Look for 'District Manager', location name, or the company that issued the WO",
  "storeCode": "store/location ID — look for store numbers, location codes, building IDs, or the number in the location name e.g. '26945' from '3Detroit - Kimball-26945'",
  "address": "full site address where work is to be performed",
  "scopeOfWork": "full description of work — combine Subject, Description, and 'Describe the issue' fields",
  "ownersProjectNo": "WO number — look for 'Reference Number', 'Work Order', 'WO-', 'IVR ID' fields",
  "bidDueDate": "YYYY-MM-DD format if any deadline, due date, or requested completion date is mentioned, else empty string",
  "authorizedAmount": "dollar amount if an authorized/not-to-exceed amount is mentioned, else empty string",
  "contactName": "site contact name if mentioned",
  "contactPhone": "site contact phone if mentioned",
  "notes": "priority level, any other relevant details like IVR check-in info, combination codes, district manager contact"
}`,
          messages: [{ role: "user", content: "Extract all lead info from this work order / email:\n\n" + inboxParseText }]
        })
      });
      const data = await res.json();
      const text = data.content?.find(b => b.type === "text")?.text || "{}";
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      setInboxForm(f => ({ ...f, ...parsed }));
      setInboxParseText("");
    } catch(e) {
      alert("Parse failed — please fill in manually.");
    }
    setInboxParsing(false);
  };

  const saveInboxLead = () => {
    if (!inboxForm.name.trim()) return;
    const co   = companies.find(c => c.id === inboxForm.companyId);
    const site = sites.find(s => s.id === inboxForm.storeId);
    setFmInbox(prev => [...prev, {
      ...inboxForm,
      companyName: co?.name || "",
      storeCode:   site?.storeNumber || "",
      address:     inboxForm.address || site?.address || "",
      id: "inbox" + Date.now(), createdAt: new Date().toISOString()
    }]);
    setInboxForm({ name: "", companyId: "", storeId: "", address: "", scopeOfWork: "", ownersProjectNo: "", bidDueDate: "", authorizedAmount: "", contactName: "", contactPhone: "", notes: "", source: "manual" });
    setShowInboxForm(false);
  };

  const assignInboxLead = (lead, coordinator) => {
    const co = companies.find(c => c.id === lead.companyId) || companies.find(c => c.name.toLowerCase() === (lead.companyName||"").toLowerCase());
    const companyId = co?.id || "";
    const nte = Number(lead.authorizedAmount || 0);
    const gp  = fmGrossProfit(nte);
    const vendorNTE = fmVendorNTE(nte);
    setFmJobs(prev => [...prev, {
      id: "fm" + Date.now(), name: lead.name, companyId, siteId: lead.storeId || "",
      contractValue: nte, grossProfit: gp, nte: String(nte), vendorNTE: String(vendorNTE),
      stage: "estimating", startDate: "", endDate: "", pm: "", pct: 0,
      bidDueDate: lead.bidDueDate || "", quoteDueDate: "", proposalDate: "", followUpDate: "", buyoutDate: "", invoiceDate: "",
      notes: lead.notes || "", storeCode: lead.storeCode || "", projectNo: "", ownersProjectNo: lead.ownersProjectNo || "",
      vendorInvoiceAmount: 0, vendorInvoiceNumber: "", subcontractorId: "", vendorNextStep: "",
      vendorQuotePrice: "", vendorQuoteScope: "", scopeOfWork: lead.scopeOfWork || lead.name,
      coordinator, subSentAt: null, pmPingedAt: null
    }]);
    setFmInbox(prev => prev.filter(l => l.id !== lead.id));
  };

  const deleteInboxLead = (id) => setFmInbox(prev => prev.filter(l => l.id !== id));

  const newItem = () => ({ id: "i" + Date.now() + Math.random(), desc: "", unit: "EA", qty: 1, unitPrice: 0, labor: 0, material: 0, sub: 0, misc: 0 });
  const newSection = (name="") => ({ id: "s" + Date.now() + Math.random(), name, items: [newItem()] });

  const initProposal = (job) => {
    const subPrice  = Number(job.vendorQuotePrice || 0);
    // Gross value = sub quote ÷ 0.70 (ensures 30% GP). Round to 2dp.
    const grossValue = subPrice > 0 ? Math.ceil(subPrice / 0.70 * 100) / 100 : Number(job.contractValue || 0);
    const gp = fmGrossProfit(grossValue);

    // Update job contract value to match
    if (grossValue !== Number(job.contractValue || 0)) {
      setFmJobs(prev => prev.map(j => j.id === job.id ? { ...j, contractValue: grossValue, grossProfit: gp } : j));
    }

    setProposalJob({ ...job, contractValue: grossValue, grossProfit: gp });
    setProposalGrossValue(grossValue);
    setProposalScope(job.scopeOfWork || job.name || "");
    setProposalNum("");
    setProposalExtras({ laborBurden: 0, salesTax: 0, generalLiability: 0, permitCost: 0 });
    setProposalSections([{
      id: "s1", name: "01 General",
      items: [
        { id: "i1", desc: job.scopeOfWork || job.name, unit: "LS", qty: 1, unitPrice: subPrice, labor: 0, material: 0, sub: subPrice, misc: 0 },
      ]
    }]);
    setShowProposal(true);
  };

  const proposalLineTotal = (item) => item.qty * item.unitPrice;
  const sectionTotal = (sec) => sec.items.reduce((s, i) => s + proposalLineTotal(i), 0);
  const proposalSubtotal = (sections) => sections.reduce((s, sec) => s + sectionTotal(sec), 0);

  const saveCompany = async () => {
    if (!companyForm.name.trim()) return;
    if (editCompanyId) {
      const updated = { ...companyForm, id: editCompanyId };
      setCompanies(companies.map(c => c.id === editCompanyId ? updated : c));
      supa.from("companies").update(companyToDB(updated)).eq("id", editCompanyId);
    } else {
      const newId = "c" + Date.now();
      const entry = { ...companyForm, id: newId };
      setCompanies(c => [...c, entry]);
      supa.from("companies").insert(companyToDB(entry));
    }
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
            <div style={{ fontSize: 13, fontWeight: 600, color: "#1A2240", textTransform: "uppercase", letterSpacing: "0.06em" }}>Active Jobs — Gantt</div>
            <div style={{ fontSize: 11, color: "#4A5278", marginTop: 2 }}>{jobList.length} job{jobList.length !== 1 ? "s" : ""} · {fmt(jobList.reduce((s, j) => s + j.contractValue, 0))} total</div>
          </div>
          {showAddBtn && <button className="btn-primary" onClick={openAddJob}>+ Add Job</button>}
        </div>
        {jobList.length === 0
          ? <div style={{ textAlign: "center", padding: "32px", color: "#3D4570", fontSize: 12, background: "#ECEEF8", borderRadius: 10, border: "1px solid #CBD1E8" }}>No active jobs</div>
          : (
            <div style={{ background: "#F5F7FC", border: "1px solid #CBD1E8", borderRadius: 10, overflow: "hidden" }}>
              <div style={{ display: "flex", borderBottom: "1px solid #CBD1E8" }}>
                <div style={{ width: 280, flexShrink: 0, padding: "8px 16px", fontSize: 10, color: "#4A5278", textTransform: "uppercase", letterSpacing: "0.08em", borderRight: "1px solid #CBD1E8" }}>JOB</div>
                <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(" + months.length + ", 1fr)" }}>
                  {months.map((m, i) => (
                    <div key={i} style={{ padding: "8px 6px", fontSize: 10, textTransform: "uppercase", textAlign: "center", borderRight: i < months.length - 1 ? "1px solid #1A2035" : "none", fontWeight: m.month === nowM && m.year === nowY ? 700 : 400, color: m.month === nowM && m.year === nowY ? "#3B6FE8" : "#353C62" }}>
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
                    onMouseEnter={e => e.currentTarget.style.background = "#EEF0F8"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    onClick={() => setSelectedJob(job)}>
                    <div style={{ width: 280, flexShrink: 0, padding: "12px 16px", borderRight: "1px solid #CBD1E8" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: sc.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: "#1A2240", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{job.name}</span>
                      </div>
                      <div style={{ fontSize: 11, color: "#4A5278", marginBottom: 4, paddingLeft: 14 }}>{job.client}</div>
                      <div style={{ display: "flex", gap: 8, paddingLeft: 14 }}>
                        <span style={{ fontSize: 12, color: "#3B6FE8", fontWeight: 600 }}>{fmt(job.contractValue)}</span>
                        <span style={{ fontSize: 10, color: "#4A5278" }}>· {job.pm}</span>
                      </div>
                    </div>
                    <div style={{ flex: 1, position: "relative", padding: "12px 0", minHeight: 56 }}>
                      <div style={{ position: "absolute", left: tPct + "%", top: 0, bottom: 0, width: 1, background: "#3B6FE840", zIndex: 1 }} />
                      {months.map((_, i) => i > 0 && <div key={i} style={{ position: "absolute", left: ((i / months.length) * 100) + "%", top: 0, bottom: 0, width: 1, background: "#E8EBFA" }} />)}
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
            <div style={{ background: "#F0F2F8", border: "1px solid #3B6FE840", borderRadius: 8, padding: 14, marginTop: 8, display: "flex", flexDirection: "column", gap: 10 }}>
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
              <div style={{ background: "#F0F2F8", border: "1px solid #3B6FE840", borderRadius: 8, padding: 14, marginTop: 8, display: "flex", flexDirection: "column", gap: 10 }}>
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
    ::-webkit-scrollbar-track{background:#EEF0F8}
    ::-webkit-scrollbar-thumb{background:#B0BAD4;border-radius:2px}
    .nav-item{display:flex;align-items:center;gap:10px;padding:9px 16px;border-radius:6px;cursor:pointer;font-size:13px;color:#9AAAC8;transition:all 0.15s;border:none;background:none;width:100%;text-align:left;font-family:inherit;letter-spacing:0.01em}
    .nav-item:hover{background:#334060;color:#FFFFFF}
    .nav-item.active{background:#3B6FE8;color:#FFFFFF;font-weight:500}
    .bu-tab{padding:5px 14px;border-radius:4px;font-size:11px;font-weight:600;letter-spacing:0.08em;cursor:pointer;border:1px solid transparent;transition:all 0.15s;font-family:inherit;background:none;color:#4A5278}
    .bu-tab:hover{color:#1A2240}
    .bu-tab.active{background:#3B6FE8;color:#FFFFFF;border-color:#3B6FE8}
    .stat-card{background:#FFFFFF;border:1px solid #D4D9EE;border-radius:10px;padding:20px 22px;transition:border-color 0.2s;box-shadow:0 1px 3px rgba(0,0,0,0.05)}
    .stat-card:hover{border-color:#3B6FE8}
    .punch-item{display:flex;align-items:center;gap:12px;padding:12px 16px;background:#FFFFFF;border:1px solid #D4D9EE;border-radius:8px;transition:all 0.15s}
    .punch-item:hover{border-color:#3B6FE8}
    .priority-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0}
    .btn-primary{background:#3B6FE8;color:#fff;border:none;cursor:pointer;padding:9px 18px;border-radius:6px;font-family:inherit;font-size:12px;font-weight:600;letter-spacing:0.06em;transition:all 0.2s}
    .btn-primary:hover{background:#2A5FD8}
    .btn-ghost{background:none;border:1px solid #C8D0E8;color:#3D4570;cursor:pointer;padding:5px 10px;border-radius:5px;font-family:inherit;font-size:11px;transition:all 0.2s}
    .btn-ghost:hover{border-color:#3B6FE8;color:#1A2240}
    .fi{background:#FFFFFF;border:1px solid #C8D0E8;border-radius:6px;color:#1A2240;padding:9px 12px;font-family:inherit;font-size:12px;width:100%;outline:none;transition:border 0.2s}
    .fi:focus{border-color:#3B6FE8}
    select.fi option{background:#FFFFFF}
    .lbl{font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#4A5278;margin-bottom:5px;display:block;font-weight:600}
    .pill{display:inline-flex;align-items:center;padding:3px 9px;border-radius:20px;font-size:10px;letter-spacing:0.05em;white-space:nowrap;font-weight:500}
    .opp-row{background:#FFFFFF;border:1px solid #D4D9EE;border-radius:8px;padding:14px 16px;transition:all 0.15s;cursor:pointer}
    .opp-row:hover{border-color:#3B6FE8;background:#F5F7FE}
    .modal-bg{position:fixed;inset:0;background:rgba(30,38,80,0.45);display:flex;align-items:center;justify-content:center;z-index:9000;backdrop-filter:blur(4px)}
    .modal{background:#FFFFFF;border:1px solid #D4D9EE;border-radius:12px;padding:28px;width:540px;max-height:90vh;overflow-y:auto;box-shadow:0 8px 32px rgba(30,38,80,0.12)}
    .g2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
    .side-panel{position:fixed;right:0;top:52px;bottom:0;width:400px;background:#FFFFFF;border-left:1px solid #D4D9EE;padding:24px;overflow-y:auto;z-index:40;box-shadow:-4px 0 20px rgba(30,38,80,0.07)}
    @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
    .fade-in{animation:fadeIn 0.2s ease both}
    @keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}
    .slide-in{animation:slideIn 0.2s ease both}
    .coming-soon{display:flex;flex-direction:column;align-items:center;justify-content:center;height:300px;color:#8892B8;gap:12px}
    .view-toggle{background:none;border:1px solid #C8D0E8;color:#3D4570;cursor:pointer;padding:6px 12px;font-family:inherit;font-size:11px;transition:all 0.15s;font-weight:500}
    .view-toggle.on{background:#3B6FE8;color:#fff;border-color:#3B6FE8}
    .view-toggle:first-child{border-radius:6px 0 0 6px}
    .view-toggle:last-child{border-radius:0 6px 6px 0}
    input[type=range]{width:100%;accent-color:#3B6FE8}
    .ns-row{display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:#F5F7FC;border:1px solid #D4D9EE;border-radius:6px}
    .company-card{background:#FFFFFF;border:1px solid #D4D9EE;border-radius:10px;padding:18px 20px;cursor:pointer;transition:all 0.15s;box-shadow:0 1px 3px rgba(0,0,0,0.04)}
    .company-card:hover{border-color:#3B6FE8;background:#F5F7FE}
    .contact-chip{background:#F5F7FC;border:1px solid #D4D9EE;border-radius:6px;padding:8px 12px;display:flex;align-items:center;justify-content:space-between}
  `;

  const panelOpen = selectedJob || selectedOpp || selectedCompany || selectedSite || selectedCapexJob || selectedFmJob;

  // Render sub-facing page if subtoken is in URL
  if (urlToken)  return <SubPage    token={urlToken}  fmJobs={fmJobs} setFmJobs={setFmJobs} subcontractors={subcontractors} companies={companies} sites={sites} />;
  if (urlSched)  return <SchedPage  token={urlSched}  fmJobs={fmJobs} setFmJobs={setFmJobs} subcontractors={subcontractors} companies={companies} sites={sites} />;
  if (urlVendor) return <VendorPage token={urlVendor} fmJobs={fmJobs} setFmJobs={setFmJobs} subcontractors={subcontractors} companies={companies} sites={sites} />;

  // Loading screen while Supabase fetches
  if (!supaReady && !dbError) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#EEF0F8", color: "#1A2240", fontFamily: "'Inter','Segoe UI',sans-serif", gap: 16 }}>
      <div style={{ width: 44, height: 44, background: "#3B6FE8", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: "#fff" }}>FG</div>
      <div style={{ fontSize: 13, color: "#4A5278", letterSpacing: "0.1em", textTransform: "uppercase" }}>Loading data…</div>
      <div style={{ width: 180, height: 3, background: "#CBD1E8", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ height: "100%", background: "#3B6FE8", borderRadius: 2, animation: "pulse 1.5s ease-in-out infinite", width: "60%" }} />
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#EEF0F8", color: "#1A2240", fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <style>{CSS}</style>

      {/* ── Sidebar ── */}
      <div style={{ width: sidebarCollapsed ? 60 : 200, background: "#1E2A48", borderRight: "1px solid #162040", display: "flex", flexDirection: "column", transition: "width 0.2s", flexShrink: 0, position: "sticky", top: 0, height: "100vh", overflow: "hidden" }}>
        <div style={{ padding: "18px 16px 14px", borderBottom: "1px solid #2A3860", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, background: "#3B6FE8", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0 }}>FG</div>
          {!sidebarCollapsed && <div><div style={{ fontSize: 13, fontWeight: 700, color: "#FFFFFF", letterSpacing: "0.04em" }}>FARMER</div><div style={{ fontSize: 10, color: "#6B9FE8", letterSpacing: "0.1em", fontWeight: 500 }}>GROUP</div></div>}
        </div>
        <div style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
          {navItems.map(item => (
            <button key={item.id} className={"nav-item" + (activeNav === item.id ? " active" : "")} onClick={() => { setActiveNav(item.id); setSelectedCoord(null); }}
              style={activeNav === item.id ? { borderLeft: "3px solid " + buColor.accent, paddingLeft: 13 } : { borderLeft: "3px solid transparent" }}>
              <span style={{ fontSize: 14, flexShrink: 0 }}>{item.icon}</span>
              {!sidebarCollapsed && <span style={{ textTransform: "uppercase", fontSize: 11, letterSpacing: "0.07em" }}>{item.label}</span>}
            </button>
          ))}
        </div>
        <div style={{ padding: "12px 8px", borderTop: "1px solid #2A3860" }}>
          <button className="nav-item" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} style={{ justifyContent: "center" }}>
            <span style={{ fontSize: 14 }}>{sidebarCollapsed ? "→" : "←"}</span>
            {!sidebarCollapsed && <span style={{ textTransform: "uppercase", fontSize: 11, letterSpacing: "0.07em" }}>Collapse</span>}
          </button>
        </div>
      </div>

      {/* ── Main ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Topbar */}
        <div style={{ borderBottom: "1px solid #D4D9EE", padding: "0 28px", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between", background: "#FFFFFF", position: "sticky", top: 0, zIndex: 40, boxShadow: "0 1px 4px rgba(30,42,80,0.06)" }}>
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            {BUSINESS_UNITS.map(bu => <button key={bu.id} className={"bu-tab" + (activeBU === bu.id && !crmMode ? " active" : "")} onClick={() => { setCrmMode(false); handleBUChange(bu.id); }}>{bu.short}</button>)}
            <div style={{ width: 1, height: 20, background: "#D4D9EE", margin: "0 4px" }} />
            <button className={"bu-tab" + (crmMode ? " active" : "")} onClick={() => setCrmMode(true)} style={{ background: crmMode ? "#3B6FE8" : "transparent", color: crmMode ? "#fff" : "#4A5278", border: crmMode ? "1px solid #3B6FE8" : "1px solid transparent", borderRadius: 6, padding: "4px 12px", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", cursor: "pointer", fontFamily: "inherit" }}>CRM</button>
          </div>
          <div style={{ fontSize: 11, color: "#4A5278", letterSpacing: "0.1em", textTransform: "uppercase" }}>{BUSINESS_UNITS.find(b => b.id === activeBU)?.label}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {supaReady && <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "#4ADE80", background: "#4ADE8015", border: "1px solid #4ADE8030", padding: "3px 10px", borderRadius: 4 }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ADE80", display: "inline-block" }}></span>DB Live</div>}
            {dbError && <div style={{ fontSize: 10, color: "#F87171", background: "#F8717115", border: "1px solid #F8717130", padding: "3px 10px", borderRadius: 4 }}>⚠ Offline</div>}
            <div style={{ background: "#EEF1FB", border: "1px solid #3B6FE840", color: "#3B6FE8", fontSize: 11, fontWeight: 600, padding: "4px 14px", borderRadius: 4, letterSpacing: "0.08em" }}>OWNER</div>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: "28px 32px", overflowY: "auto", paddingRight: panelOpen ? "calc(32px + 420px)" : "32px", transition: "padding-right 0.2s" }}>

          {/* ── DASHBOARD ── */}
          {activeNav === "dashboard" && (
            <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 28 }}>
              <div>
                <div style={{ fontSize: 28, fontWeight: 700, color: "#1A2240", letterSpacing: "-0.02em" }}>GOOD MORNING, FARMER GROUP</div>
                <div style={{ fontSize: 12, color: "#4A5278", marginTop: 4, letterSpacing: "0.06em" }}>{dayName().toUpperCase()}</div>
              </div>

              {activeBU === "all" ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12 }}>
                  {Object.entries(SAMPLE_STATS).map(([key, s]) => (
                    <div key={key} className="stat-card" style={{ cursor: "pointer" }} onClick={() => handleBUChange(key)}>
                      <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: BU_COLORS[key].accent, marginBottom: 10, fontWeight: 600 }}>{s.label}</div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: "#1A2240", marginBottom: 4 }}>{s.pipeline}</div>
                      <div style={{ fontSize: 11, color: "#4A5278" }}>Pipeline</div>
                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #CBD1E8", display: "flex", justifyContent: "space-between" }}>
                        <div><div style={{ fontSize: 14, fontWeight: 600, color: "#252E52" }}>{s.jobs}</div><div style={{ fontSize: 10, color: "#4A5278" }}>Active Jobs</div></div>
                        <div style={{ textAlign: "right" }}><div style={{ fontSize: 14, fontWeight: 600, color: "#252E52" }}>{s.budget}</div><div style={{ fontSize: 10, color: "#4A5278" }}>Budget</div></div>
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
                      <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#4A5278", marginBottom: 10 }}>{s.label}</div>
                      <div style={{ fontSize: 28, fontWeight: 700, color: buColor.accent }}>{s.value}</div>
                      <div style={{ fontSize: 11, color: "#4A5278", marginTop: 5 }}>{s.sub}</div>
                    </div>
                  ))}
                </div>
              )}

              {activeBU === "major"   && <GanttSection jobList={majorJobs} showAddBtn={true} />}
              {activeBU === "capital" && <GanttSection jobList={capexJobs.filter(j => j.stage === "do_work" && j.startDate && j.endDate).map(j => ({ ...j, client: companies.find(c => c.id === j.companyId)?.name || "", status: "On Schedule" }))} showAddBtn={false} />}

              {/* Punch list */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "#4A5278", fontWeight: 600 }}>Today's Punch List</div>
                  <div style={{ fontSize: 11, color: "#4A5278" }}>{new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {dynamicPunchList.filter(p => activeBU === "all" || p.bu === activeBU).map(item => (
                    <div key={item.id} className="punch-item">
                      <div className="priority-dot" style={{ background: item.priority === "high" ? "#F87171" : "#FCD34D" }} />
                      <span style={{ fontSize: 13, color: "#252E52", flex: 1 }}>{item.text}</span>
                      {item.tag && <span style={{ fontSize: 10, color: "#3B6FE8", background: "#3B6FE820", padding: "2px 8px", borderRadius: 10, letterSpacing: "0.06em", textTransform: "uppercase" }}>{item.tag}</span>}
                      {item.dueDate && <span style={{ fontSize: 10, color: "#4A5278" }}>{item.dueDate}</span>}
                      <span style={{ fontSize: 10, color: "#4A5278", background: "#CBD1E8", padding: "2px 8px", borderRadius: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>{BUSINESS_UNITS.find(b => b.id === item.bu)?.short}</span>
                    </div>
                  ))}
                  {dynamicPunchList.filter(p => activeBU === "all" || p.bu === activeBU).length === 0 && (
                    <div style={{ textAlign: "center", padding: "24px", color: "#3D4570", fontSize: 12 }}>No reminders in the next 7 days.</div>
                  )}
                </div>
              </div>

              {/* Quick access */}
              {activeBU !== "all" && (
                <div>
                  <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "#4A5278", fontWeight: 600, marginBottom: 14 }}>Quick Access</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
                    {navItems.filter(n => n.id !== "dashboard").map(item => (
                      <button key={item.id} onClick={() => setActiveNav(item.id)}
                        style={{ background: "#ECEEF8", border: "1px solid #CBD1E8", borderRadius: 8, padding: "16px", cursor: "pointer", textAlign: "left", transition: "all 0.15s", fontFamily: "inherit" }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = buColor.accent; e.currentTarget.style.background = buColor.light; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = "#CBD1E8";      e.currentTarget.style.background = "#ECEEF8"; }}>
                        <div style={{ fontSize: 18, marginBottom: 8 }}>{item.icon}</div>
                        <div style={{ fontSize: 11, color: "#252E52", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 500 }}>{item.label}</div>
                        <div style={{ fontSize: 10, color: "#4A5278", marginTop: 3 }}>→ View</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── CUSTOMERS ── */}
          {activeNav === "customers" && (() => {

            // ── Derive service tags per company from actual data ──
            const getCompanyTags = (coId) => {
              const tags = [];
              const coSites = sites.filter(s => s.companyId === coId);
              const coFm = fmJobs.filter(j => j.companyId === coId);
              const coCx = capexJobs.filter(j => j.companyId === coId);
              const coMaj = jobs.filter(j => j.companyId === coId);
              const coLawn = lawnBids.filter(b => coSites.some(s => s.id === b.siteId) && b.status !== "not_bidding");
              const coSnow = coSites.some(s => (s.businessUnits||[]).includes("snow"));
              // FM: any completed (bill stage) or do_work FM job
              if (coFm.some(j => ["do_work","bill","buyout"].includes(j.stage))) tags.push("FM");
              // CapEx
              if (coCx.length > 0) tags.push("CapEx");
              // Major
              if (coMaj.length > 0) tags.push("Major");
              // Lawn
              if (coLawn.length > 0) tags.push("Lawn");
              // Snow
              if (coSnow) tags.push("Snow");
              return tags;
            };

            const TAG_COLORS = {
              FM:    { bg: "#3B6FE815", color: "#3B6FE8", border: "#3B6FE840" },
              CapEx: { bg: "#60A5FA15", color: "#60A5FA", border: "#60A5FA40" },
              Major: { bg: "#818CF815", color: "#818CF8", border: "#818CF840" },
              Lawn:  { bg: "#4ADE8015", color: "#4ADE80", border: "#4ADE8040" },
              Snow:  { bg: "#A8C4F815", color: "#60A5FA", border: "#A8C4F840" },
            };

            const TagBadge = ({ tag }) => {
              const c = TAG_COLORS[tag] || { bg: "#F0F2F8", color: "#4A5278", border: "#CBD1E8" };
              return <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", background: c.bg, color: c.color, border: "1px solid " + c.border, borderRadius: 4, padding: "2px 6px" }}>{tag}</span>;
            };

            if (selectedCustomer) {
              const co = selectedCustomer;
              const coContacts = contacts.filter(c => c.companyId === co.id);
              const coSites = sites.filter(s => s.companyId === co.id);
              const coFmJobs = fmJobs.filter(j => j.companyId === co.id);
              const coCapex = capexJobs.filter(j => j.companyId === co.id);
              const coJobs = [...jobs.filter(j => j.companyId === co.id), ...coFmJobs, ...coCapex];
              const coOpps = pipeline.filter(o => o.companyId === co.id);
              const totalValue = [...jobs, ...coFmJobs, ...coCapex].filter(j => j.companyId === co.id).reduce((s, j) => s + (j.contractValue || 0), 0);
              const lawnBidsForCo = lawnBids.filter(b => coSites.some(s => s.id === b.siteId));
              const lawnAnnual = lawnBidsForCo.reduce((s, b) => s + lawnBidAnnualOur(b), 0);
              const coTags = getCompanyTags(co.id);
              const TABS = [
                { id: "overview",  label: "Overview" },
                { id: "sites",     label: "Sites (" + coSites.length + ")" },
                { id: "contacts",  label: "Contacts (" + coContacts.length + ")" },
                { id: "jobs",      label: "Jobs (" + coJobs.length + ")" },
                { id: "bids",      label: "Lawn Bids (" + lawnBidsForCo.length + ")" },
              ];
              return (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {/* Back + Header */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <button onClick={() => { setSelectedCustomer(null); setCrmTab("overview"); }} style={{ background: "#F0F2F8", border: "1px solid #CBD1E8", borderRadius: 6, padding: "6px 12px", fontSize: 12, color: "#4A5278", cursor: "pointer", fontFamily: "inherit" }}>← Back</button>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
                      <div style={{ width: 48, height: 48, borderRadius: 10, background: "#E8EEFA", border: "1px solid #3B6FE840", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, color: "#3B6FE8", flexShrink: 0 }}>
                        {co.logo ? <img src={co.logo} style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover" }} alt="" /> : co.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <div style={{ fontSize: 22, fontWeight: 700, color: "#1A2240", letterSpacing: "-0.01em" }}>{co.name}</div>
                          <div style={{ display: "flex", gap: 4 }}>{coTags.map(t => <TagBadge key={t} tag={t} />)}</div>
                        </div>
                        <div style={{ display: "flex", gap: 12 }}>
                          {co.website && <span style={{ fontSize: 11, color: "#3B6FE8" }}>🌐 {co.website}</span>}
                          {co.address && <span style={{ fontSize: 11, color: "#4A5278" }}>📍 {co.address}</span>}
                        </div>
                      </div>
                      <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                        <button className="btn-ghost" onClick={() => { setEditCompanyId(co.id); setCompanyForm({ ...co }); setShowCompanyForm(true); }}>✎ Edit</button>
                        <button className="btn-ghost" onClick={() => { setEditContactId(null); setContactForm({ companyId: co.id, firstName: "", lastName: "", title: "", email: "", phone: "" }); setShowContactForm(true); }}>+ Contact</button>
                        <button className="btn-ghost" onClick={() => { openAddSite(); setSiteForm(f => ({ ...f, companyId: co.id })); }}>+ Site</button>
                      </div>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10 }}>
                    {[
                      { label: "Sites",       value: coSites.length,       color: "#3B6FE8" },
                      { label: "Contacts",    value: coContacts.length,    color: "#818CF8" },
                      { label: "Active Jobs", value: coJobs.filter(j => !["bill","Won","Lost"].includes(j.stage)).length, color: "#FCD34D" },
                      { label: "Pipeline",    value: fmt(coOpps.filter(o => !["Won","Lost"].includes(o.stage)).reduce((s,o) => s + o.value, 0)), color: "#60A5FA" },
                      { label: lawnAnnual > 0 ? "Lawn/yr" : "Contract Val", value: lawnAnnual > 0 ? fmt(lawnAnnual) : fmt(totalValue), color: "#4ADE80" },
                    ].map(s => (
                      <div key={s.label} className="stat-card" style={{ padding: "12px 16px", position: "relative", overflow: "hidden" }}>
                        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: s.color }} />
                        <div style={{ fontSize: 9, color: "#4A5278", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>{s.label}</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
                      </div>
                    ))}
                  </div>

                  {co.notes && <div style={{ background: "#FFFBEB", border: "1px solid #FCD34D40", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#78600A" }}>📝 {co.notes}</div>}

                  {/* Tabs */}
                  <div style={{ display: "flex", borderBottom: "2px solid #EEF0F8" }}>
                    {TABS.map(t => (
                      <button key={t.id} onClick={() => setCrmTab(t.id)} style={{ padding: "10px 18px", border: "none", background: "transparent", cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: crmTab === t.id ? 700 : 500, color: crmTab === t.id ? "#3B6FE8" : "#4A5278", borderBottom: crmTab === t.id ? "2px solid #3B6FE8" : "2px solid transparent", marginBottom: -2 }}>
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {/* Overview tab */}
                  {crmTab === "overview" && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      {/* Sites summary */}
                      <div style={{ background: "#F5F7FC", borderRadius: 10, padding: 16 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#4A5278", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Sites ({coSites.length})</div>
                        {coSites.slice(0,5).map(s => (
                          <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #E8EBF4" }}>
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 600, color: "#1A2240" }}>{s.storeNumber ? "#" + s.storeNumber + " — " : ""}{s.address || "No address"}</div>
                            </div>
                            <div style={{ display: "flex", gap: 3 }}>
                              {(s.businessUnits || []).map(bu => <TagBadge key={bu} tag={bu === "facility" ? "FM" : bu.charAt(0).toUpperCase() + bu.slice(1)} />)}
                            </div>
                          </div>
                        ))}
                        {coSites.length > 5 && <div style={{ fontSize: 11, color: "#4A5278", marginTop: 8, cursor: "pointer", color: "#3B6FE8" }} onClick={() => setCrmTab("sites")}>+ {coSites.length - 5} more sites →</div>}
                        {coSites.length === 0 && <div style={{ fontSize: 11, color: "#4A5278", fontStyle: "italic" }}>No sites linked yet</div>}
                      </div>
                      {/* Jobs/Pipeline summary */}
                      <div style={{ background: "#F5F7FC", borderRadius: 10, padding: 16 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#4A5278", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Recent Activity</div>
                        {coJobs.slice(0,4).map(j => (
                          <div key={j.id} style={{ padding: "6px 0", borderBottom: "1px solid #E8EBF4" }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: "#1A2240" }}>{j.name}</div>
                            <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
                              <span style={{ fontSize: 10, color: "#4A5278" }}>{j.stage}</span>
                              {j.contractValue > 0 && <span style={{ fontSize: 10, color: "#4ADE80", fontWeight: 600 }}>{fmt(j.contractValue)}</span>}
                            </div>
                          </div>
                        ))}
                        {coJobs.length === 0 && <div style={{ fontSize: 11, color: "#4A5278", fontStyle: "italic" }}>No jobs yet</div>}
                      </div>
                    </div>
                  )}

                  {/* Sites tab */}
                  {crmTab === "sites" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {coSites.length === 0 && <div style={{ fontSize: 13, color: "#4A5278", fontStyle: "italic", padding: "20px 0" }}>No sites linked to this company. <button onClick={() => { openAddSite(); setSiteForm(f => ({ ...f, companyId: co.id })); }} style={{ color: "#3B6FE8", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>+ Add Site</button></div>}
                      {coSites.map(s => {
                        const siteContacts = contacts.filter(c => c.companyId === co.id);
                        const siteFmJobs = fmJobs.filter(j => j.siteId === s.id);
                        const siteLawnBids = lawnBids.filter(b => b.siteId === s.id);
                        const buTags = (s.businessUnits || []);
                        return (
                          <div key={s.id} style={{ background: "#fff", border: "1px solid #D4D9EE", borderRadius: 10, padding: "14px 16px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                              <div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: "#1A2240" }}>
                                  {s.storeNumber ? <span style={{ color: "#4A5278", fontWeight: 600 }}>Store #{s.storeNumber} — </span> : null}
                                  {s.address || "No address on file"}
                                </div>
                                {s.phone && <div style={{ fontSize: 11, color: "#4A5278", marginTop: 2 }}>📞 {s.phone}</div>}
                                {s.accessCode && <div style={{ fontSize: 11, color: "#4ADE80", marginTop: 2 }}>🔐 Access: {s.accessCode}</div>}
                              </div>
                              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "flex-end" }}>
                                {buTags.map(bu => <TagBadge key={bu} tag={bu === "facility" ? "FM" : bu.charAt(0).toUpperCase() + bu.slice(1)} />)}
                                {siteFmJobs.some(j => ["do_work","bill","buyout"].includes(j.stage)) && !buTags.includes("facility") && <TagBadge tag="FM" />}
                                {siteLawnBids.some(b => b.status !== "not_bidding") && !buTags.includes("lawn") && <TagBadge tag="Lawn" />}
                              </div>
                            </div>
                            <div style={{ display: "flex", gap: 16, marginTop: 8, paddingTop: 8, borderTop: "1px solid #EEF0F8" }}>
                              <div style={{ fontSize: 11, color: "#4A5278" }}>🔨 <strong>{siteFmJobs.length}</strong> FM jobs</div>
                              <div style={{ fontSize: 11, color: "#4A5278" }}>🌿 <strong>{siteLawnBids.length}</strong> lawn bids</div>
                              {s.notes && <div style={{ fontSize: 11, color: "#4A5278", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>📝 {s.notes}</div>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Contacts tab */}
                  {crmTab === "contacts" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {coContacts.length === 0 && <div style={{ fontSize: 13, color: "#4A5278", fontStyle: "italic" }}>No contacts yet.</div>}
                      {coContacts.map(c => (
                        <div key={c.id} style={{ background: "#fff", border: "1px solid #D4D9EE", borderRadius: 10, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14 }}>
                          <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#E8EEFA", border: "1px solid #3B6FE840", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "#3B6FE8", flexShrink: 0 }}>{(c.firstName||"?").charAt(0)}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#1A2240" }}>{c.firstName} {c.lastName}</div>
                            {c.title && <div style={{ fontSize: 11, color: "#4A5278" }}>{c.title}</div>}
                            <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
                              {c.email && <a href={"mailto:" + c.email} style={{ fontSize: 11, color: "#3B6FE8", textDecoration: "none" }}>✉ {c.email}</a>}
                              {c.phone && <a href={"tel:" + c.phone} style={{ fontSize: 11, color: "#4A5278", textDecoration: "none" }}>📞 {c.phone}</a>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Jobs tab */}
                  {crmTab === "jobs" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {coJobs.length === 0 && <div style={{ fontSize: 13, color: "#4A5278", fontStyle: "italic" }}>No jobs yet.</div>}
                      {coJobs.map(j => {
                        const isFM = fmJobs.some(f => f.id === j.id);
                        const isCapex = capexJobs.some(f => f.id === j.id);
                        const type = isFM ? "FM" : isCapex ? "CapEx" : "Major";
                        const typeColor = isFM ? "#3B6FE8" : isCapex ? "#60A5FA" : "#818CF8";
                        return (
                          <div key={j.id} style={{ background: "#fff", border: "1px solid #D4D9EE", borderRadius: 8, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: "#1A2240" }}>{j.name}</div>
                                <span style={{ fontSize: 9, fontWeight: 700, background: typeColor + "15", color: typeColor, border: "1px solid " + typeColor + "40", borderRadius: 4, padding: "1px 6px" }}>{type}</span>
                              </div>
                              <div style={{ fontSize: 11, color: "#4A5278" }}>{j.stage}{j.pm ? " · " + j.pm : ""}</div>
                            </div>
                            {j.contractValue > 0 && <div style={{ fontSize: 14, fontWeight: 700, color: "#4ADE80" }}>{fmt(j.contractValue)}</div>}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Lawn Bids tab */}
                  {crmTab === "bids" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {lawnBidsForCo.length === 0 && <div style={{ fontSize: 13, color: "#4A5278", fontStyle: "italic" }}>No lawn bids for this customer.</div>}
                      {lawnBidsForCo.map(b => {
                        const site = sites.find(s => s.id === b.siteId);
                        return (
                          <div key={b.id} style={{ background: "#fff", border: "1px solid #D4D9EE", borderRadius: 8, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 600, color: "#1A2240" }}>{site ? (site.storeNumber ? "#" + site.storeNumber + " — " : "") + site.address : "Unknown site"}</div>
                              <div style={{ fontSize: 11, color: "#4A5278", marginTop: 2 }}>Season {b.season} · {b.status}</div>
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#4ADE80" }}>{fmt(lawnBidAnnualOur(b))}/yr</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            // ── Customer List View ──
            // On non-ALL BU tabs, auto-filter by that BU — no toggle pills shown
            const buToTag = { facility: "FM", capital: "CapEx", major: "Major", lawn: "Lawn", snow: "Snow" };
            const autoTag = activeBU !== "all" ? buToTag[activeBU] : null;

            const allCompanies = companies.filter(c => c.name.toLowerCase().includes(crmSearch.toLowerCase()));
            const tagFilter = autoTag || crmTagFilter || "all";

            const filteredCompanies = tagFilter === "all"
              ? allCompanies
              : allCompanies.filter(c => getCompanyTags(c.id).includes(tagFilter));

            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "#1A2240", letterSpacing: "-0.01em", textTransform: "uppercase" }}>{autoTag ? autoTag + " Customers" : "Customers"}</div>
                  <div style={{ fontSize: 11, color: "#4A5278", marginTop: 3, letterSpacing: "0.06em" }}>{filteredCompanies.length} COMPANIES{autoTag ? " · " + autoTag + " ONLY" : " · " + contacts.length + " CONTACTS · " + sites.length + " SITES"}</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input className="fi" style={{ width: 200 }} placeholder="Search companies…" value={crmSearch} onChange={e => setCrmSearch(e.target.value)} />
                  <label className="btn-ghost" style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", padding: "5px 10px", borderRadius: 5, border: "1px solid #CBD1E8", color: "#353C62", fontSize: 11, fontFamily: "inherit" }}>
                    ↑ Import CSV
                    <input type="file" accept=".csv" style={{ display: "none" }} onChange={e => {
                      const file = e.target.files[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (evt) => {
                        const lines = evt.target.result.split("\n").map(l => l.trim()).filter(Boolean);
                        if (lines.length < 2) return;
                        const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/ /g,"_"));
                        const col = (name) => headers.indexOf(name);
                        const newCompanies = [];
                        const newContacts  = [];
                        const companyMap   = {};
                        companies.forEach(c => { companyMap[c.name.toLowerCase()] = c.id; });
                        lines.slice(1).forEach(line => {
                          const cells = line.split(",").map(c => c.trim().replace(/^"|"$/g, ""));
                          const companyName = col("company")   >= 0 ? cells[col("company")]   : "";
                          const firstName   = col("firstname") >= 0 ? cells[col("firstname")] : "";
                          const lastName    = col("lastname")  >= 0 ? cells[col("lastname")]  : "";
                          const email       = col("email")     >= 0 ? cells[col("email")]     : "";
                          const phone       = col("phone")     >= 0 ? cells[col("phone")]     : "";
                          const title       = col("title")     >= 0 ? cells[col("title")]     : "";
                          if (!firstName && !email) return;
                          let companyId = companyMap[companyName.toLowerCase()];
                          if (!companyId && companyName) {
                            companyId = "c" + Date.now() + Math.random().toString(36).slice(2, 6);
                            newCompanies.push({ id: companyId, name: companyName, website: "", address: "", logo: "", notes: "" });
                            companyMap[companyName.toLowerCase()] = companyId;
                          }
                          newContacts.push({ id: "p" + Date.now() + Math.random().toString(36).slice(2,6), companyId, firstName, lastName, email, phone, title });
                        });
                        if (newCompanies.length) setCompanies(prev => [...prev, ...newCompanies]);
                        if (newContacts.length)  setContacts(prev  => [...prev, ...newContacts]);
                        alert("Imported " + newCompanies.length + " companies and " + newContacts.length + " contacts.");
                        e.target.value = "";
                      };
                      reader.readAsText(file);
                    }} />
                  </label>
                  <button className="btn-ghost" onClick={() => { setEditContactId(null); setContactForm({ companyId: "", firstName: "", lastName: "", title: "", email: "", phone: "" }); setShowContactForm(true); }}>+ Contact</button>
                  <button className="btn-primary" onClick={() => { setEditCompanyId(null); setCompanyForm({ name: "", website: "", address: "", logo: "", notes: "" }); setShowCompanyForm(true); }}>+ Company</button>
                </div>
              </div>

              {/* Stats */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                {[
                  { label: autoTag ? autoTag + " Customers" : "Total Companies",  value: filteredCompanies.length,  color: "#3B6FE8" },
                  { label: "Total Sites",       value: sites.length,      color: "#A78BFA" },
                  { label: "Total Contacts",    value: contacts.length,   color: "#60A5FA" },
                ].map(s => (
                  <div key={s.label} className="stat-card" style={{ position: "relative", overflow: "hidden", padding: "14px 18px" }}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: s.color }} />
                    <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#4A5278", marginBottom: 6 }}>{s.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Service type filter pills — only on ALL tab */}
              {activeBU === "all" && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {["all","FM","CapEx","Major","Lawn","Snow"].map(tag => (
                  <button key={tag} onClick={() => setCrmTagFilter(tag === "all" ? null : tag)}
                    style={{ padding: "4px 12px", borderRadius: 20, border: "1px solid " + ((!crmTagFilter && tag === "all") || crmTagFilter === tag ? "#3B6FE8" : "#CBD1E8"), background: ((!crmTagFilter && tag === "all") || crmTagFilter === tag) ? "#3B6FE8" : "transparent", color: ((!crmTagFilter && tag === "all") || crmTagFilter === tag) ? "#fff" : "#4A5278", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                    {tag === "all" ? "All Customers" : tag}
                  </button>
                ))}
              </div>
              )}

              {/* Company grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
                {filteredCompanies.map(company => {
                  const cc     = getCompanyContacts(company.id);
                  const cSites = sites.filter(s => s.companyId === company.id);
                  const tv     = getCompanyTotalValue(company.id);
                  const lawnBidsForCo = lawnBids.filter(b => cSites.some(s => s.id === b.siteId));
                  const lawnAnn = lawnBidsForCo.reduce((s, b) => s + lawnBidAnnualOur(b), 0);
                  const tags   = getCompanyTags(company.id);
                  return (
                    <div key={company.id} className="company-card" onClick={() => { setSelectedCustomer(company); setCrmTab("overview"); }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 8, background: "#E8EEFA", border: "1px solid #3B6FE840", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "#3B6FE8", flexShrink: 0 }}>
                          {company.logo ? <img src={company.logo} style={{ width: 36, height: 36, borderRadius: 6, objectFit: "cover" }} alt="" /> : company.name.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: 14, color: "#1A2240", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{company.name}</div>
                          {company.website && <div style={{ fontSize: 11, color: "#4A5278" }}>{company.website}</div>}
                        </div>
                      </div>
                      {/* Service tags */}
                      {tags.length > 0 && (
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
                          {tags.map(t => <TagBadge key={t} tag={t} />)}
                        </div>
                      )}
                      {company.address && <div style={{ fontSize: 11, color: "#4A5278", marginBottom: 10 }}>📍 {company.address}</div>}
                      <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 10, borderTop: "1px solid #E8EBF4" }}>
                        <div><div style={{ fontSize: 13, fontWeight: 600, color: "#252E52" }}>{cSites.length}</div><div style={{ fontSize: 10, color: "#4A5278" }}>Sites</div></div>
                        <div><div style={{ fontSize: 13, fontWeight: 600, color: "#252E52" }}>{cc.length}</div><div style={{ fontSize: 10, color: "#4A5278" }}>Contacts</div></div>
                        {lawnAnn > 0
                          ? <div style={{ textAlign: "right" }}><div style={{ fontSize: 13, fontWeight: 600, color: "#4ADE80" }}>${Math.round(lawnAnn/1000)}k</div><div style={{ fontSize: 10, color: "#4A5278" }}>Lawn/yr</div></div>
                          : <div style={{ textAlign: "right" }}><div style={{ fontSize: 13, fontWeight: 600, color: "#3B6FE8" }}>{fmt(tv)}</div><div style={{ fontSize: 10, color: "#4A5278" }}>Contract Val.</div></div>
                        }
                      </div>
                    </div>
                  );
                })}
              </div>
              </div>
            );
          })()}
          {/* ── BUDGETING ── */}
          {activeNav === "budgeting" && activeBU === "major" && (
            <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 22 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "#1A2240", letterSpacing: "-0.01em", textTransform: "uppercase" }}>Budgeting</div>
                  <div style={{ fontSize: 11, color: "#4A5278", marginTop: 3, letterSpacing: "0.06em" }}>MAJOR PROJECTS · PRE-LEAD SCOPING · {pipeline.filter(o => o.bu === "major" && o.stage === "Budgeting").length} PROJECTS</div>
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
                    <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#4A5278", marginBottom: 6 }}>{s.label}</div>
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
                        <div style={{ fontSize: 14, color: "#1A2240", fontWeight: 600, marginBottom: 4 }}>{o.name}</div>
                        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                          {co && <span style={{ fontSize: 11, color: "#3B6FE8" }}>🏢 {co.name}</span>}
                          {o.budgetDueDate && <span style={{ fontSize: 11, color: overdue ? "#F87171" : soon ? "#FCD34D" : "#4A5278" }}>📅 Budget due: {o.budgetDueDate}{overdue ? " ⚠ OVERDUE" : ""}</span>}
                          {o.notes && <span style={{ fontSize: 11, color: "#4A5278" }}>📝 {o.notes}</span>}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 16, fontWeight: 700, color: "#FCD34D" }}>{fmt(o.value)}</div>
                          <div style={{ fontSize: 10, color: "#4A5278" }}>estimated</div>
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
                  <div style={{ textAlign: "center", padding: "48px", color: "#3D4570", fontSize: 12, background: "#ECEEF8", borderRadius: 10, border: "1px solid #CBD1E8" }}>No projects in budgeting yet</div>
                )}
              </div>
            </div>
          )}

          {/* ── ACTIVE JOBS (MP only) ── */}
          {activeNav === "jobs" && activeBU !== "capital" && activeBU !== "facility" && (
            <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 22 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "#1A2240", letterSpacing: "-0.01em", textTransform: "uppercase" }}>Active Jobs</div>
                  <div style={{ fontSize: 11, color: "#4A5278", marginTop: 3, letterSpacing: "0.06em" }}>{majorJobs.length} JOBS · {fmt(majorJobs.reduce((s, j) => s + j.contractValue, 0))} TOTAL</div>
                </div>
                <button className="btn-primary" onClick={openAddJob}>+ Add Job</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
                {[
                  { label: "Total Contract Value", value: fmt(majorJobs.reduce((s, j) => s + j.contractValue, 0)), color: buColor.accent },
                  { label: "On Schedule",          value: majorJobs.filter(j => j.status === "On Schedule").length, color: "#4ADE80" },
                  { label: "Behind / At Risk",     value: majorJobs.filter(j => ["Behind Schedule", "At Risk"].includes(j.status)).length, color: "#F87171" },
                  { label: "Avg Completion",       value: (majorJobs.length ? Math.round(majorJobs.reduce((s, j) => s + j.pct, 0) / majorJobs.length) : 0) + "%", color: "#FCD34D" },
                ].map(s => (
                  <div key={s.label} className="stat-card" style={{ position: "relative", overflow: "hidden", padding: "14px 18px" }}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: s.color }} />
                    <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#4A5278", marginBottom: 6 }}>{s.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>
              <GanttSection jobList={majorJobs} showAddBtn={false} />
            </div>
          )}

          {/* ── PIPELINE ── */}
          {activeNav === "pipeline" && (
            <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 22 }}>

              {/* ── FM INBOX (unassigned leads) — FM only ── */}
              {activeBU === "facility" && (
                <div style={{ background: "#F8F9FD", border: "1px solid #FCD34D30", borderRadius: 12, padding: "18px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#FCD34D", boxShadow: fmInbox.length > 0 ? "0 0 8px #FCD34D" : "none" }} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#FCD34D", textTransform: "uppercase", letterSpacing: "0.07em" }}>Lead Inbox</span>
                      <span style={{ fontSize: 11, color: "#4A5278" }}>{fmInbox.length} unassigned</span>
                    </div>
                    <button className="btn-ghost" style={{ fontSize: 11, borderColor: "#FCD34D40", color: "#FCD34D" }} onClick={() => { setInboxForm({ name: "", companyName: "", storeCode: "", address: "", scopeOfWork: "", ownersProjectNo: "", bidDueDate: "", notes: "", source: "manual" }); setInboxParseText(""); setShowInboxForm(true); }}>+ New Lead</button>
                  </div>

                  {fmInbox.length === 0 && (
                    <div style={{ textAlign: "center", padding: "24px", color: "#3D4570", fontSize: 12, border: "1px dashed #CBD1E8", borderRadius: 8 }}>
                      No unassigned leads — add one manually or paste an email to parse
                    </div>
                  )}

                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {fmInbox.map(lead => (
                      <div key={lead.id} style={{ background: "#ECEEF8", border: "1px solid #FCD34D20", borderRadius: 8, padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, flexWrap: "wrap" }}>
                              <span style={{ fontSize: 13, fontWeight: 600, color: "#1A2240" }}>{lead.name}</span>
                              {lead.source === "email" && <span style={{ fontSize: 10, background: "#3B6FE820", color: "#3B6FE8", padding: "1px 7px", borderRadius: 4 }}>✉ email</span>}
                              {lead.storeCode && <span style={{ fontSize: 10, background: "#E8EBFA", color: "#4A5278", padding: "1px 7px", borderRadius: 4 }}>#{lead.storeCode}</span>}
                              {lead.bidDueDate && <span style={{ fontSize: 10, background: "#FCD34D15", color: "#FCD34D", padding: "1px 7px", borderRadius: 4 }}>📋 Bid: {lead.bidDueDate}</span>}
                            </div>
                            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                              {lead.companyName && <span style={{ fontSize: 11, color: "#3B6FE8" }}>🏢 {lead.companyName}</span>}
                              {lead.address     && <span style={{ fontSize: 11, color: "#4A5278" }}>📍 {lead.address}</span>}
                            </div>
                            {lead.scopeOfWork && <div style={{ fontSize: 11, color: "#4A5278", marginTop: 4, fontStyle: "italic" }}>{lead.scopeOfWork}</div>}
                          </div>
                          <div style={{ display: "flex", gap: 6, flexShrink: 0, alignItems: "center" }}>
                            {/* Assign dropdown */}
                            <select
                              style={{ background: "#FFFFFF", border: "1px solid #3B6FE860", color: "#3B6FE8", fontSize: 11, borderRadius: 5, padding: "5px 10px", cursor: "pointer", fontFamily: "inherit" }}
                              defaultValue=""
                              onChange={e => { if (e.target.value) assignInboxLead(lead, e.target.value); }}>
                              <option value="" disabled>Assign to…</option>
                              {fmTeam.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                              {fmTeam.length === 0 && <option disabled>No team members yet</option>}
                            </select>
                            <button className="btn-ghost" style={{ fontSize: 11, color: "#F87171", borderColor: "#F8717120", padding: "4px 8px" }} onClick={() => deleteInboxLead(lead.id)}>✕</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add lead modal */}
                  {showInboxForm && (
                    <div className="modal-bg" onClick={e => e.target === e.currentTarget && setShowInboxForm(false)}>
                      <div className="modal fade-in" style={{ maxHeight: "90vh", overflowY: "auto" }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#FCD34D", marginBottom: 18, textTransform: "uppercase", letterSpacing: "0.05em" }}>New Lead</div>

                        {/* Email parse box */}
                        <div style={{ background: "#F8F9FD", border: "1px solid #3B6FE840", borderRadius: 8, padding: 14, marginBottom: 18 }}>
                          <div style={{ fontSize: 10, color: "#3B6FE8", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600, marginBottom: 8 }}>⚡ Parse from Email</div>
                          <textarea
                            className="fi" rows={5}
                            placeholder="Paste the email text here and click Parse — Claude will extract the lead details automatically…"
                            value={inboxParseText}
                            onChange={e => setInboxParseText(e.target.value)}
                            style={{ resize: "vertical", fontSize: 12 }} />
                          <button
                            className="btn-primary" style={{ marginTop: 8, width: "100%", opacity: inboxParsing ? 0.6 : 1 }}
                            onClick={parseInboxEmail} disabled={inboxParsing || !inboxParseText.trim()}>
                            {inboxParsing ? "Parsing…" : "⚡ Parse Email"}
                          </button>
                        </div>

                        <div style={{ fontSize: 10, color: "#3D4570", textTransform: "uppercase", letterSpacing: "0.1em", textAlign: "center", marginBottom: 14 }}>— or fill in manually —</div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                          <div><label className="lbl">Job Title / Name *</label><input className="fi" value={inboxForm.name} onChange={e => setInboxForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Roof Leak Repair" /></div>
                          <div className="g2">
                            <div><label className="lbl">Client / Company</label>
                              <select className="fi" value={inboxForm.companyId} onChange={e => setInboxForm(f => ({ ...f, companyId: e.target.value, storeId: "", address: "" }))}>
                                <option value="">Select company…</option>
                                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                              </select>
                            </div>
                            <div><label className="lbl">Store / Site</label>
                              <select className="fi" value={inboxForm.storeId} onChange={e => {
                                const s = sites.find(x => x.id === e.target.value);
                                setInboxForm(f => ({ ...f, storeId: e.target.value, address: s?.address || f.address }));
                              }}>
                                <option value="">Select store…</option>
                                {sites.filter(s => !inboxForm.companyId || s.companyId === inboxForm.companyId).map(s => <option key={s.id} value={s.id}>#{s.storeNumber} — {s.address}</option>)}
                              </select>
                            </div>
                          </div>
                          <div><label className="lbl">Site Address {inboxForm.storeId && <span style={{ color: "#4ADE80", fontSize: 9 }}>● AUTO-FILLED</span>}</label>
                            <input className="fi" value={inboxForm.address} onChange={e => setInboxForm(f => ({ ...f, address: e.target.value }))} placeholder="Auto-fills from store selection" />
                          </div>
                          <div><label className="lbl">Scope of Work</label><textarea className="fi" rows={3} value={inboxForm.scopeOfWork} onChange={e => setInboxForm(f => ({ ...f, scopeOfWork: e.target.value }))} style={{ resize: "vertical" }} /></div>
                          <div className="g2">
                            <div><label className="lbl">Owner's Project / WO #</label><input className="fi" value={inboxForm.ownersProjectNo} onChange={e => setInboxForm(f => ({ ...f, ownersProjectNo: e.target.value }))} /></div>
                            <div><label className="lbl">Bid Due Date</label><input className="fi" type="date" value={inboxForm.bidDueDate} onChange={e => setInboxForm(f => ({ ...f, bidDueDate: e.target.value }))} /></div>
                          </div>
                          <div>
                            <label className="lbl">Authorized Amount (NTE)</label>
                            <input className="fi" type="number" placeholder="e.g. 400" value={inboxForm.authorizedAmount} onChange={e => setInboxForm(f => ({ ...f, authorizedAmount: e.target.value }))} />
                            {inboxForm.authorizedAmount && Number(inboxForm.authorizedAmount) > 0 && (() => {
                              const nte = Number(inboxForm.authorizedAmount);
                              const gp  = fmGrossProfit(nte);
                              const vnte = fmVendorNTE(nte);
                              return (
                                <div style={{ marginTop: 8, background: "#F0F2F8", border: "1px solid #CBD1E8", borderRadius: 6, padding: "10px 14px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                                  <div>
                                    <div style={{ fontSize: 9, color: "#4A5278", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>Gross Value</div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: "#1A2240" }}>{fmt(nte)}</div>
                                  </div>
                                  <div>
                                    <div style={{ fontSize: 9, color: "#4A5278", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>Our GP</div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: "#4ADE80" }}>{fmt(gp)}</div>
                                    <div style={{ fontSize: 9, color: "#4A5278" }}>{Math.round((gp/nte)*100)}% · {gp === 125 ? "min $125" : "30%"}</div>
                                  </div>
                                  <div>
                                    <div style={{ fontSize: 9, color: "#4A5278", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>Vendor NTE</div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: "#FCD34D" }}>{fmt(vnte)}</div>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                          <div><label className="lbl">Notes</label><textarea className="fi" rows={2} value={inboxForm.notes} onChange={e => setInboxForm(f => ({ ...f, notes: e.target.value }))} style={{ resize: "vertical" }} /></div>
                          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", paddingTop: 4 }}>
                            <button className="btn-ghost" style={{ padding: "8px 16px" }} onClick={() => setShowInboxForm(false)}>Cancel</button>
                            <button className="btn-primary" onClick={saveInboxLead}>Add to Inbox</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "#1A2240", letterSpacing: "-0.01em", textTransform: "uppercase" }}>Pipeline</div>
                  <div style={{ fontSize: 11, color: "#4A5278", marginTop: 3, letterSpacing: "0.06em" }}>{BUSINESS_UNITS.find(b => b.id === activeBU)?.label.toUpperCase()} · {visiblePipeline.length} OPPORTUNITIES</div>
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
                    <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#4A5278", marginBottom: 6 }}>{s.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* ── FM PIPELINE: show fmJobs in pipeline stages ── */}
              {activeBU === "facility" && (() => {
                const q = search.toLowerCase();
                const fmPipelineJobs = fmJobs.filter(j =>
                  FM_PIPELINE_STAGES.some(s => s.id === j.stage) &&
                  (j.name.toLowerCase().includes(q) || (j.storeCode||"").toLowerCase().includes(q))
                );
                const totalFmPipeline = fmPipelineJobs.reduce((s,j) => s + (j.contractValue||0), 0);
                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div style={{ fontSize: 11, color: "#4A5278", letterSpacing: "0.07em", textTransform: "uppercase", borderBottom: "1px solid #CBD1E8", paddingBottom: 10 }}>
                      {fmPipelineJobs.length} jobs in pipeline · {fmt(totalFmPipeline)} total value
                    </div>
                    <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 8 }}>
                      {FM_PIPELINE_STAGES.map(st => {
                        const stageJobs = fmPipelineJobs.filter(j => j.stage === st.id);
                        return (
                          <div key={st.id} style={{ minWidth: 220, flex: "0 0 220px" }}>
                            <div style={{ background: st.color + "15", border: "1px solid " + st.color + "30", borderRadius: 7, padding: "8px 12px", marginBottom: 10 }}>
                              <div style={{ fontSize: 10, letterSpacing: "0.07em", textTransform: "uppercase", color: st.color, fontWeight: 600, marginBottom: 2 }}>{st.label}</div>
                              <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ fontSize: 10, color: "#4A5278" }}>{stageJobs.length} job{stageJobs.length !== 1 ? "s" : ""}</span>
                                <span style={{ fontSize: 11, color: st.color, fontWeight: 600 }}>{fmt(stageJobs.reduce((s,j) => s+(j.contractValue||0),0))}</span>
                              </div>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                              {stageJobs.map(job => {
                                const co  = companies.find(c => c.id === job.companyId);
                                const sub = subcontractors.find(s => s.id === job.subcontractorId);
                                const actionDate = job[st.actionKey];
                                const overdue = actionDate && new Date(actionDate) < new Date();
                                const soon    = actionDate && new Date(actionDate) <= new Date(Date.now() + 3*86400000);
                                return (
                                  <div key={job.id} style={{ background: "#ECEEF8", border: "1px solid " + st.color + "25", borderRadius: 8, padding: 12, cursor: "pointer" }} onClick={() => setSelectedFmJob(job)}>
                                    <div style={{ fontSize: 12, color: "#1A2240", fontWeight: 500, lineHeight: 1.35, marginBottom: 4 }}>{job.name}</div>
                                    {co && <div style={{ fontSize: 10, color: "#3B6FE8", marginBottom: 3 }}>🏢 {co.name}</div>}
                                    {job.storeCode && <div style={{ fontSize: 10, color: "#4A5278", marginBottom: 3 }}>#{job.storeCode}</div>}
                                    {job.coordinator && <div style={{ fontSize: 10, color: "#353C62", marginBottom: 3 }}>👤 {job.coordinator}</div>}
                                    {sub && <div style={{ fontSize: 10, color: "#353C62", marginBottom: 3 }}>🔧 {sub.name}</div>}
                                    {actionDate && <div style={{ fontSize: 10, color: overdue ? "#F87171" : soon ? "#FCD34D" : "#4A5278", marginBottom: 6 }}>📅 {st.actionLabel}: {actionDate}{overdue ? " ⚠" : ""}</div>}
                                    {job.contractValue > 0 && <div style={{ fontSize: 14, fontWeight: 700, color: st.color, marginBottom: 8 }}>{fmt(job.contractValue)}</div>}
                                    <div style={{ display: "flex", gap: 5 }} onClick={e => e.stopPropagation()}>
                                      {FM_PIPELINE_STAGES.map((s, i) => {
                                        const curIdx = FM_PIPELINE_STAGES.findIndex(x => x.id === job.stage);
                                        if (i === curIdx - 1) return <button key="prev" className="btn-ghost" style={{ flex: 1, fontSize: 11 }} onClick={() => updateFmJobPersist(job.id, { stage: s.id })}>←</button>;
                                        if (i === curIdx + 1) return <button key="next" className="btn-ghost" style={{ flex: 1, fontSize: 11 }} onClick={() => updateFmJobPersist(job.id, { stage: s.id })}>→</button>;
                                        return null;
                                      })}
                                      {/* Promote to Active */}
                                      {job.stage === "owner_approval" && (
                                        <button className="btn-ghost" style={{ fontSize: 10, color: "#4ADE80", borderColor: "#4ADE8040", whiteSpace: "nowrap" }}
                                          onClick={() => updateFmJobPersist(job.id, { stage: "buyout" })}>
                                          → Active ✓
                                        </button>
                                      )}
                                      <button className="btn-ghost" style={{ fontSize: 11 }} onClick={() => openEditFm(job)}>✎</button>
                                    </div>
                                  </div>
                                );
                              })}
                              {stageJobs.length === 0 && <div style={{ border: "1px dashed " + st.color + "20", borderRadius: 8, padding: "20px 8px", textAlign: "center", fontSize: 10, color: "#8892B8" }}>EMPTY</div>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* ── NON-FM PIPELINE (kanban + list) ── */}
              {activeBU !== "facility" && pipelineView === "kanban" && (
                <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 8 }}>
                  {stages.map(stage => {
                    const sc        = STAGE_COLORS[stage] || { color: "#60A5FA", bg: "#60A5FA15" };
                    const stageOpps = visiblePipeline.filter(o => o.stage === stage);
                    return (
                      <div key={stage} style={{ minWidth: 200, flex: "0 0 200px" }}>
                        <div style={{ background: sc.bg, border: "1px solid " + sc.color + "30", borderRadius: 7, padding: "8px 12px", marginBottom: 10 }}>
                          <div style={{ fontSize: 10, letterSpacing: "0.07em", textTransform: "uppercase", color: sc.color, fontWeight: 600, marginBottom: 2 }}>{stage}</div>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ fontSize: 10, color: "#4A5278" }}>{stageOpps.length} opp{stageOpps.length !== 1 ? "s" : ""}</span>
                            <span style={{ fontSize: 11, color: sc.color, fontWeight: 600 }}>{fmt(stageOpps.reduce((s, o) => s + o.value, 0))}</span>
                          </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {stageOpps.map(o => {
                            const co = companies.find(c => c.id === o.companyId);
                            return (
                              <div key={o.id} style={{ background: "#ECEEF8", border: "1px solid " + sc.color + "25", borderRadius: 8, padding: 12, cursor: "pointer" }} onClick={() => setSelectedOpp(o)}>
                                <div style={{ fontSize: 12, color: "#1A2240", fontWeight: 500, lineHeight: 1.35, marginBottom: 4 }}>{o.name}</div>
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
                          {stageOpps.length === 0 && <div style={{ border: "1px dashed " + sc.color + "20", borderRadius: 8, padding: "20px 8px", textAlign: "center", fontSize: 10, color: "#8892B8" }}>EMPTY</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {activeBU !== "facility" && pipelineView === "list" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr auto", gap: 12, padding: "6px 16px", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: "#3D4570" }}>
                    <span>Opportunity</span><span>Company</span><span>Stage</span><span style={{ textAlign: "right" }}>Value</span><span>Close</span><span />
                  </div>
                  {visiblePipeline.map(o => {
                    const sc = STAGE_COLORS[o.stage] || { color: "#60A5FA", bg: "#60A5FA15" };
                    const co = companies.find(c => c.id === o.companyId);
                    return (
                      <div key={o.id} className="opp-row" style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr auto", gap: 12, alignItems: "center" }} onClick={() => setSelectedOpp(o)}>
                        <div>
                          <div style={{ fontSize: 13, color: "#1A2240", fontWeight: 500 }}>{o.name}</div>
                          {o.bidDueDate && <div style={{ fontSize: 10, color: "#FCD34D", marginTop: 2 }}>📋 Bid: {o.bidDueDate}</div>}
                        </div>
                        <div style={{ fontSize: 11, color: "#3B6FE8" }}>{co ? co.name : ""}</div>
                        <span className="pill" style={{ background: sc.bg, color: sc.color }}>{o.stage}</span>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#1A2240", textAlign: "right" }}>{fmt(o.value)}</div>
                        <div style={{ fontSize: 11, color: "#4A5278" }}>{o.closeDate}</div>
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

          {/* ── SITES (CI / FM) ── */}
          {activeNav === "sites" && (activeBU === "capital" || activeBU === "facility" || activeBU === "all") && (
            <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 22 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "#1A2240", letterSpacing: "-0.01em", textTransform: "uppercase" }}>Sites</div>
                  <div style={{ fontSize: 11, color: "#4A5278", marginTop: 3, letterSpacing: "0.06em" }}>
                    {BUSINESS_UNITS.find(b => b.id === activeBU)?.label.toUpperCase()} · {activeBU === "all" ? sites.length : sites.filter(s => (s.businessUnits||[]).includes(activeBU === "facility" ? "facility" : activeBU)).length} SITES
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input className="fi" style={{ width: 200 }} placeholder="Search sites…" value={siteSearch} onChange={e => setSiteSearch(e.target.value)} />
                  <label className="btn-ghost" style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", padding: "5px 10px", borderRadius: 5, border: "1px solid #CBD1E8", color: "#353C62", fontSize: 11, fontFamily: "inherit" }}>
                    ↑ Import CSV
                    <input type="file" accept=".csv" style={{ display: "none" }} onChange={e => {
                      const file = e.target.files[0]; if (!file) return;
                      const reader = new FileReader();
                      reader.onload = async (evt) => {
                        let text = evt.target.result.replace(/^\uFEFF/, "");
                        const parseCSVLine = (line) => {
                          const cells = []; let cur = ""; let inQuote = false;
                          for (let i = 0; i < line.length; i++) {
                            const ch = line[i];
                            if (ch === '"') { inQuote = !inQuote; }
                            else if (ch === ',' && !inQuote) { cells.push(cur.trim()); cur = ""; }
                            else { cur += ch; }
                          }
                          cells.push(cur.trim());
                          return cells;
                        };
                        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
                        if (lines.length < 2) { alert("CSV appears empty"); return; }
                        const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/[^a-z]/g, ""));
                        const col = (name) => headers.indexOf(name);
                        const newCompanies = []; const newSites = []; const companyMap = {};
                        companies.forEach(c => { companyMap[c.name.toLowerCase()] = c.id; });
                        lines.slice(1).forEach(line => {
                          const cells = parseCSVLine(line);
                          const companyName = col("company") >= 0 ? cells[col("company")] || "" : "";
                          const storeNumber = col("storenumber") >= 0 ? cells[col("storenumber")] || "" : "";
                          const address = col("address") >= 0 ? cells[col("address")] || "" : "";
                          const phoneIdx = col("sitephone") >= 0 ? col("sitephone") : col("phone") >= 0 ? col("phone") : -1;
                          const phone = phoneIdx >= 0 ? cells[phoneIdx] || "" : "";
                          const accessCode = col("accesscode") >= 0 ? cells[col("accesscode")] || "" : "";
                          const notes = col("notes") >= 0 ? cells[col("notes")] || "" : "";
                          // business_units: read from CSV col, or fall back to current BU
                          const buRaw = col("businessunits") >= 0 ? cells[col("businessunits")] || "" : "";
                          const businessUnits = buRaw ? buRaw.split(/[,;|]/).map(b => b.trim()).filter(Boolean) : [activeBU === "all" ? "fm" : activeBU];
                          if (!storeNumber && !address) return;
                          let companyId = companyMap[companyName.toLowerCase()];
                          if (!companyId && companyName) {
                            companyId = "c" + Date.now() + Math.random().toString(36).slice(2,6);
                            newCompanies.push({ id: companyId, name: companyName, website: "", address: "", logo: "", notes: "" });
                            companyMap[companyName.toLowerCase()] = companyId;
                          }
                          newSites.push({ id: "s" + Date.now() + Math.random().toString(36).slice(2,6), companyId: companyId || "", contactIds: [], storeNumber, address, phone, accessCode, notes, lat: null, lng: null, businessUnits });
                        });
                        if (newCompanies.length) {
                          setCompanies(prev => [...prev, ...newCompanies]);
                          // Batch insert companies
                          supa.from("companies").insert(newCompanies.map(companyToDB));
                        }
                        if (newSites.length) {
                          setSites(prev => [...prev, ...newSites]);
                          // Batch insert sites in chunks of 100
                          for (let i = 0; i < newSites.length; i += 100) {
                            supa.from("sites").insert(newSites.slice(i, i + 100).map(siteToDB));
                          }
                        }
                        alert("✓ Imported " + newSites.length + " sites" + (newCompanies.length ? " + " + newCompanies.length + " new companies" : "") + "!");
                        e.target.value = "";
                      };
                      reader.readAsText(file);
                    }} />
                  </label>
                  <button className="btn-primary" onClick={openAddSite}>+ Add Site</button>
                </div>
              </div>
              {(() => {
                const visibleSites = activeBU === "all" ? sites : sites.filter(s => (s.businessUnits||[]).includes(activeBU === "facility" ? "facility" : activeBU));
                return (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                {[
                  { label: activeBU === "all" ? "All Sites" : (BUSINESS_UNITS.find(b => b.id === activeBU)?.label || "") + " Sites", value: visibleSites.length, color: buColor.accent },
                  { label: "Companies",   value: [...new Set(visibleSites.map(s => s.companyId))].length, color: "#A78BFA" },
                  { label: "Contacts",    value: [...new Set(visibleSites.flatMap(s => s.contactIds || []))].length, color: "#4ADE80" },
                ].map(s => (
                  <div key={s.label} className="stat-card" style={{ position: "relative", overflow: "hidden", padding: "14px 18px" }}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: s.color }} />
                    <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#4A5278", marginBottom: 6 }}>{s.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>
                );
              })()}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                {sites.filter(site => { const buMatch = activeBU === "all" || (site.businessUnits || []).includes(activeBU === "facility" ? "facility" : activeBU); const co = companies.find(c => c.id === site.companyId); const q = siteSearch.toLowerCase(); const textMatch = !q || (site.storeNumber||"").toLowerCase().includes(q) || (site.address||"").toLowerCase().includes(q) || (co?.name||"").toLowerCase().includes(q); return buMatch && textMatch; }).map(site => {
                  const co = companies.find(c => c.id === site.companyId);
                  const siteContacts = contacts.filter(p => (site.contactIds||[]).includes(p.id));
                  return (
                    <div key={site.id} className="company-card" onClick={() => setSelectedSite(site)}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: buColor.light, border: "1px solid " + buColor.accent + "40", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>📍</div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, color: "#1A2240", fontWeight: 600 }}>Store #{site.storeNumber || "—"}</div>
                          {co && <div style={{ fontSize: 11, color: "#3B6FE8" }}>{co.name}</div>}
                        </div>
                      </div>
                      {site.address && <div style={{ fontSize: 11, color: "#4A5278", marginBottom: 8 }}>📍 {site.address}</div>}
                      {site.phone   && <div style={{ fontSize: 11, color: "#4A5278", marginBottom: 4 }}>📞 {site.phone}</div>}
                      <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 10, borderTop: "1px solid #CBD1E8" }}>
                        <div><div style={{ fontSize: 13, fontWeight: 600, color: "#252E52" }}>{siteContacts.length}</div><div style={{ fontSize: 10, color: "#4A5278" }}>Contacts</div></div>
                        <div style={{ display: "flex", gap: 6 }} onClick={e => e.stopPropagation()}>
                          <button className="btn-ghost" style={{ fontSize: 11 }} onClick={() => openEditSite(site)}>✎</button>
                          <button className="btn-ghost" style={{ fontSize: 11, color: "#F87171", borderColor: "#F8717120" }} onClick={() => deleteSite(site.id)}>✕</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {sites.length === 0 && <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "48px", color: "#3D4570", fontSize: 12, background: "#ECEEF8", borderRadius: 10, border: "1px solid #CBD1E8" }}>No sites yet</div>}
              </div>
            </div>
          )}

          {/* ── SITES (Lawn / Snow) — Hierarchy View ── */}
          {activeNav === "sites" && LAWN_SNOW_SITES_BUS.includes(activeBU) && (() => {
            // Only show sites tagged for this specific BU — no fallback to all
            const buTag = activeBU;
            const currentSites = sites.filter(s => (s.businessUnits||[]).includes(buTag));
            const isContracted = (site) => { const b = getLawnBid(site.id); return b && (b.locked || b.status === "owner_approved" || b.status === "contracted" || b.status === "owner_accepted"); };

            // Parse state from address — "City, ST XXXXX" → "ST"
            const getState = (address) => {
              if (!address) return "Unknown";
              // Try: ", MI 48601" or ", MI," or ", MI" at end
              let m = address.match(/,\s*([A-Z]{2})\s*[\d,]/) || address.match(/,\s*([A-Z]{2})\s*$/);
              if (m) return m[1];
              // Try: "Saginaw MI 48601" (no comma before state)
              m = address.match(/\s([A-Z]{2})\s+\d{5}/);
              if (m) return m[1];
              // Try: "Flint MI, 40501" (comma after zip)
              m = address.match(/\s([A-Z]{2}),\s*\d/);
              if (m) return m[1];
              // Try lowercase state abbreviation: "Fall River Ma 02721"
              m = address.match(/\s([A-Z][a-z])\s+\d{5}/);
              if (m) return m[1].toUpperCase();
              // Try spelled-out state names
              const stateNames = {Ohio:"OH",Indiana:"IN",Michigan:"MI",Illinois:"IL",Wisconsin:"WI",Minnesota:"MN",Iowa:"IA",Nebraska:"NE",Missouri:"MO",Arkansas:"AR",Oklahoma:"OK",Kansas:"KS",Massachusetts:"MA"};
              for (const [name, abbr] of Object.entries(stateNames)) {
                if (address.includes(name)) return abbr;
              }
              return "Other";
            };

            // Build hierarchy: company → state → sites
            const searchQ = lsSearch.toLowerCase();
            const filteredSites = currentSites.filter(site => {
              const co = companies.find(c => c.id === site.companyId);
              return !searchQ || (site.storeNumber||"").toLowerCase().includes(searchQ) || (site.address||"").toLowerCase().includes(searchQ) || (co?.name||"").toLowerCase().includes(searchQ);
            });

            // Group by company
            const byCompany = {};
            filteredSites.forEach(site => {
              const cid = site.companyId || "__none__";
              if (!byCompany[cid]) byCompany[cid] = [];
              byCompany[cid].push(site);
            });

            const uniqueCompanyIds = [...new Set(currentSites.map(s => s.companyId).filter(Boolean))];
            const sitesWithCoords = currentSites.filter(s => s.lat && s.lng);
            const contractedCount = currentSites.filter(isContracted).length;

            return (
              <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: "#1A2240", letterSpacing: "-0.01em", textTransform: "uppercase" }}>Sites — {activeBU === "lawn" ? "Lawn" : "Snow"}</div>
                    <div style={{ fontSize: 11, color: "#4A5278", marginTop: 3, letterSpacing: "0.06em" }}>{currentSites.length} SITES · {uniqueCompanyIds.length} COMPANIES{taggedSites.length === 0 ? " · ⚠ No BU tags set — showing all sites" : ""}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input className="fi" style={{ width: 200 }} placeholder="Search sites, companies…" value={lsSearch} onChange={e => setLsSearch(e.target.value)} />
                    {(() => {
                      const ungeocoded = currentSites.filter(s => !s.lat || !s.lng);
                      if (geocodeAllProgress) return (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#60A5FA", background: "#60A5FA10", border: "1px solid #60A5FA30", borderRadius: 6, padding: "5px 10px" }}>
                          <span>⏳ Geocoding {geocodeAllProgress.done}/{geocodeAllProgress.total}…</span>
                        </div>
                      );
                      if (ungeocoded.length > 0) return (
                        <button className="btn-ghost" style={{ fontSize: 11, color: "#FBBF24", borderColor: "#FBBF2430", whiteSpace: "nowrap" }} onClick={() => geocodeAllSites(currentSites)}>
                          📍 Geocode {ungeocoded.length} sites
                        </button>
                      );
                      return null;
                    })()}
                    <label className="btn-ghost" style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", padding: "5px 10px", borderRadius: 5, border: "1px solid #CBD1E8", color: "#353C62", fontSize: 11, fontFamily: "inherit" }}>
                      ↑ Import CSV
                      <input type="file" accept=".csv" style={{ display: "none" }} onChange={e => {
                        const file = e.target.files[0]; if (!file) return;
                        const reader = new FileReader();
                        reader.onload = async (evt) => {
                          let text = evt.target.result.replace(/^\uFEFF/, "");
                          const parseCSVLine = (line) => {
                            const cells = []; let cur = ""; let inQuote = false;
                            for (let i = 0; i < line.length; i++) {
                              const ch = line[i];
                              if (ch === '"') { inQuote = !inQuote; }
                              else if (ch === ',' && !inQuote) { cells.push(cur.trim()); cur = ""; }
                              else { cur += ch; }
                            }
                            cells.push(cur.trim()); return cells;
                          };
                          const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
                          if (lines.length < 2) return;
                          const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/[^a-z]/g, ""));
                          const col = (name) => headers.indexOf(name);
                          const newCompanies = []; const newSites = []; const companyMap = {};
                          companies.forEach(c => { companyMap[c.name.toLowerCase()] = c.id; });
                          for (const line of lines.slice(1)) {
                            const cells = parseCSVLine(line);
                            const companyName = col("company") >= 0 ? cells[col("company")] || "" : "";
                            const storeNumber = col("storenumber") >= 0 ? cells[col("storenumber")] || "" : "";
                            const address = col("address") >= 0 ? cells[col("address")] || "" : "";
                            const phoneIdx = col("sitephone") >= 0 ? col("sitephone") : col("phone") >= 0 ? col("phone") : -1;
                            const phone = phoneIdx >= 0 ? cells[phoneIdx] || "" : "";
                            const accessCode = col("accesscode") >= 0 ? cells[col("accesscode")] || "" : "";
                            const notes = col("notes") >= 0 ? cells[col("notes")] || "" : "";
                            if (!storeNumber && !address) continue;
                            let companyId = companyMap[companyName.toLowerCase()];
                            if (!companyId && companyName) { companyId = "c" + Date.now() + Math.random().toString(36).slice(2,6); newCompanies.push({ id: companyId, name: companyName, website: "", address: "", logo: "", notes: "" }); companyMap[companyName.toLowerCase()] = companyId; }
                            newSites.push({ id: (activeBU === "lawn" ? "ln" : "sn") + Date.now() + Math.random().toString(36).slice(2,6), companyId: companyId || "", contactIds: [], storeNumber, address, phone, accessCode, notes, lat: null, lng: null, businessUnits: [activeBU] });
                          }
                          if (newCompanies.length) { setCompanies(prev => [...prev, ...newCompanies]); newCompanies.forEach(c => supa.from("companies").insert(companyToDB(c))); }
                          if (newSites.length) { setSites(prev => [...prev, ...newSites]); for (let i = 0; i < newSites.length; i += 100) supa.from("sites").insert(newSites.slice(i, i+100).map(siteToDB)); }
                          alert("✓ Imported " + newSites.length + " sites!");
                          e.target.value = "";
                        };
                        reader.readAsText(file);
                      }} />
                    </label>
                    <button className="btn-primary" onClick={openAddLsSite}>+ Add Site</button>
                  </div>
                </div>

                {/* Stats */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
                  {[
                    { label: "Total Sites",      value: currentSites.length,       color: "#3B6FE8" },
                    { label: "Companies",         value: uniqueCompanyIds.length,   color: "#A78BFA" },
                    { label: "Contracted",        value: contractedCount,           color: "#4ADE80" },
                    { label: "Mapped",            value: sitesWithCoords.length,    color: "#60A5FA" },
                  ].map(s => (
                    <div key={s.label} className="stat-card" style={{ position: "relative", overflow: "hidden", padding: "14px 18px" }}>
                      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: s.color }} />
                      <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#4A5278", marginBottom: 6 }}>{s.label}</div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
                    </div>
                  ))}
                </div>

                {/* Map */}
                <div style={{ background: "#ECEEF8", border: "1px solid #CBD1E8", borderRadius: 12, overflow: "hidden" }}>
                  <div style={{ padding: "10px 16px", borderBottom: "1px solid #CBD1E8", display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ fontSize: 11, color: "#4A5278", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600 }}>Service Area Map</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginLeft: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ADE80" }} /><span style={{ fontSize: 10, color: "#252E52" }}>Contracted ({contractedCount})</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#FCD34D" }} /><span style={{ fontSize: 10, color: "#252E52" }}>In Progress ({currentSites.length - contractedCount})</span>
                    </div>
                  </div>
                  <div style={{ height: 340, position: "relative" }}>
                    <iframe key={activeBU + currentSites.length} style={{ width: "100%", height: "100%", border: "none" }}
                      srcDoc={`<!DOCTYPE html><html><head>
                        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
                        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
                        <style>html,body,#map{margin:0;padding:0;height:100%;background:#FFFFFF;}</style>
                      </head><body><div id="map"></div><script>
                        var map = L.map('map', { zoomControl: true, attributionControl: false }).setView([39.5, -98.5], 4);
                        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(map);
                        var sites = ${JSON.stringify(sitesWithCoords.map(s => {
                          const contracted = isContracted(s);
                          const co = companies.find(c => c.id === s.companyId);
                          return { lat: s.lat, lng: s.lng, label: (co?.name||"") + " #" + (s.storeNumber||""), color: contracted ? "#4ADE80" : "#FCD34D" };
                        }))};
                        var bounds = [];
                        sites.forEach(function(s) {
                          var icon = L.divIcon({ className: '', html: '<div style="width:10px;height:10px;border-radius:50%;background:' + s.color + ';border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.5)"></div>', iconSize:[10,10], iconAnchor:[5,5] });
                          L.marker([s.lat,s.lng],{icon:icon}).addTo(map).bindPopup(s.label);
                          bounds.push([s.lat,s.lng]);
                        });
                        if(bounds.length > 1) map.fitBounds(bounds, {padding:[20,20]});
                        if(bounds.length === 0) { var el=document.getElementById('map'); el.innerHTML='<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#4A5278;font-family:sans-serif;font-size:13px">No geocoded sites yet</div>'; }
                      </script></body></html>`}
                    />
                  </div>
                </div>

                {/* ── Company → State → Sites Hierarchy ── */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {/* Column header */}
                  <div style={{ display: "grid", gridTemplateColumns: "28px 1fr 80px 90px 80px", padding: "6px 14px", fontSize: 9, color: "#3D4570", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: "1px solid #CBD1E8" }}>
                    <div></div><div>Company / Location</div><div style={{ textAlign: "right" }}>Sites</div><div style={{ textAlign: "right" }}>Contracted</div><div style={{ textAlign: "right" }}>Annual</div>
                  </div>

                  {Object.keys(byCompany).length === 0 && (
                    <div style={{ textAlign: "center", padding: "40px", color: "#3D4570", fontSize: 12, background: "#ECEEF8", borderRadius: 8, border: "1px solid #CBD1E8" }}>
                      No sites yet — import a CSV or add sites manually
                    </div>
                  )}

                  {Object.entries(byCompany).map(([cid, companySites]) => {
                    const co = companies.find(c => c.id === cid);
                    const coName = co?.name || "Unknown";
                    const coExpanded = expandedCompany === cid;
                    const coContracted = companySites.filter(isContracted).length;
                    const coAnnual = companySites.reduce((sum, s) => sum + lawnBidAnnualOur(getLawnBid(s.id)), 0);

                    // Group by state within this company
                    const byState = {};
                    companySites.forEach(site => {
                      const st = getState(site.address);
                      if (!byState[st]) byState[st] = [];
                      byState[st].push(site);
                    });
                    const stateKeys = Object.keys(byState).sort();

                    return (
                      <div key={cid} style={{ background: "#F0F2F8", border: "1px solid #CBD1E8", borderRadius: 8, overflow: "hidden" }}>
                        {/* Company row */}
                        <div onClick={() => { setExpandedCompany(coExpanded ? null : cid); setExpandedState(null); }}
                          style={{ display: "grid", gridTemplateColumns: "28px 1fr 80px 90px 80px", padding: "11px 14px", cursor: "pointer", alignItems: "center", background: coExpanded ? "#F5F7FC" : "transparent", transition: "background 0.15s" }}
                          onMouseEnter={e => { if (!coExpanded) e.currentTarget.style.background = "#F8F9FD"; }}
                          onMouseLeave={e => { if (!coExpanded) e.currentTarget.style.background = "transparent"; }}>
                          <div style={{ fontSize: 12, color: "#4A5278" }}>{coExpanded ? "▼" : "▶"}</div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#1A2240" }}>{coName}</div>
                            <div style={{ fontSize: 10, color: "#4A5278", marginTop: 2 }}>{stateKeys.length} {stateKeys.length === 1 ? "state" : "states"}</div>
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: "#252E52", textAlign: "right" }}>{companySites.length}</div>
                          <div style={{ fontSize: 11, color: coContracted > 0 ? "#4ADE80" : "#4A5278", textAlign: "right" }}>{coContracted > 0 ? coContracted + " ✓" : "—"}</div>
                          <div style={{ fontSize: 11, fontWeight: coAnnual > 0 ? 700 : 400, color: coAnnual > 0 ? "#4ADE80" : "#3D4570", textAlign: "right" }}>{coAnnual > 0 ? "$" + Math.round(coAnnual/1000) + "k" : "—"}</div>
                        </div>

                        {/* States within company */}
                        {coExpanded && stateKeys.map(stKey => {
                          const stateSites = byState[stKey];
                          const stExpanded = expandedState === (cid + stKey);
                          const stContracted = stateSites.filter(isContracted).length;
                          const stAnnual = stateSites.reduce((sum, s) => sum + lawnBidAnnualOur(getLawnBid(s.id)), 0);
                          return (
                            <div key={stKey} style={{ borderTop: "1px solid #CBD1E8" }}>
                              {/* State row */}
                              <div onClick={() => setExpandedState(stExpanded ? null : (cid + stKey))}
                                style={{ display: "grid", gridTemplateColumns: "28px 1fr 80px 90px 80px", padding: "9px 14px 9px 36px", cursor: "pointer", alignItems: "center", background: stExpanded ? "#EEF0F8" : "#F8F9FD", transition: "background 0.15s" }}>
                                <div style={{ fontSize: 11, color: "#4A5278" }}>{stExpanded ? "▼" : "▶"}</div>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <div style={{ fontSize: 11, fontWeight: 600, color: "#252E52" }}>{stKey}</div>
                                  <div style={{ fontSize: 10, color: "#4A5278" }}>{stateSites.length} sites</div>
                                </div>
                                <div style={{ fontSize: 11, color: "#6B7694", textAlign: "right" }}>{stateSites.length}</div>
                                <div style={{ fontSize: 11, color: stContracted > 0 ? "#4ADE80" : "#4A5278", textAlign: "right" }}>{stContracted > 0 ? stContracted + " ✓" : "—"}</div>
                                <div style={{ fontSize: 11, fontWeight: stAnnual > 0 ? 700 : 400, color: stAnnual > 0 ? "#4ADE80" : "#3D4570", textAlign: "right" }}>{stAnnual > 0 ? "$" + Math.round(stAnnual/1000) + "k" : "—"}</div>
                              </div>

                              {/* Site rows within state */}
                              {stExpanded && stateSites.map((site, idx) => {
                                const bid = getLawnBid(site.id);
                                const contracted = isContracted(site);
                                const bidStatus = bid ? LAWN_BID_STATUSES.find(s => s.id === bid.status) : null;
                                const sub = bid?.selectedSubId ? subcontractors.find(s => s.id === bid.selectedSubId) : null;
                                const annualVal = lawnBidAnnualOur(bid);
                                const dotColor = contracted ? "#4ADE80" : bid ? "#FCD34D" : "#3D4570";
                                return (
                                  <div key={site.id} onClick={() => setSelectedLsSite(site)}
                                    style={{ display: "grid", gridTemplateColumns: "28px 1fr 80px 90px 80px", padding: "8px 14px 8px 54px", alignItems: "center", borderTop: "1px solid #CBD1E840", background: idx % 2 === 0 ? "#FAFBFF" : "#F5F7FC", cursor: "pointer" }}
                                    onMouseEnter={e => e.currentTarget.style.background = "#F5F7FC"}
                                    onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? "#F5F7FC" : "#F0F2F8"}>
                                    <div style={{ display: "flex", alignItems: "center" }}>
                                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: dotColor }} />
                                    </div>
                                    <div>
                                      <div style={{ fontSize: 12, color: "#1A2240", fontWeight: 500 }}>
                                        {site.storeNumber ? <span style={{ fontWeight: 700 }}>#{site.storeNumber} </span> : null}
                                        <span style={{ color: "#6B7694", fontWeight: 400 }}>{site.address}</span>
                                      </div>
                                      {sub && <div style={{ fontSize: 10, color: "#A78BFA", marginTop: 1 }}>🔧 {sub.name}</div>}
                                    </div>
                                    <div style={{ fontSize: 10, color: "#4A5278", textAlign: "right" }}>
                                      {site.phone || ""}
                                    </div>
                                    <div style={{ fontSize: 10, textAlign: "right" }}>
                                      {contracted
                                        ? <span style={{ color: "#4ADE80" }}>✓ Contracted</span>
                                        : bidStatus
                                          ? <span style={{ color: bidStatus.color }}>{bidStatus.label}</span>
                                          : <span style={{ color: "#3D4570" }}>No Bid</span>
                                      }
                                    </div>
                                    <div style={{ fontSize: 11, fontWeight: annualVal > 0 ? 700 : 400, color: annualVal > 0 ? "#4ADE80" : "#3D4570", textAlign: "right" }}>
                                      {annualVal > 0 ? "$" + Math.round(annualVal/1000) + "k" : "—"}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* ── CAPEX JOBS ── */}
          {activeNav === "jobs" && activeBU === "capital" && (
            <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 22 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "#1A2240", letterSpacing: "-0.01em", textTransform: "uppercase" }}>Capital Improvements — Active Projects</div>
                  <div style={{ fontSize: 11, color: "#4A5278", marginTop: 3, letterSpacing: "0.06em" }}>{capexJobs.filter(j => j.stage !== "estimating").length} PROJECTS · {fmt(capexJobs.reduce((s,j) => s+j.contractValue,0))} TOTAL</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input className="fi" style={{ width: 180 }} placeholder="Search…" value={capexSearch} onChange={e => setCapexSearch(e.target.value)} />
                  <button className="btn-primary" onClick={openAddCapex}>+ Add Project</button>
                </div>
              </div>

              {/* Stage stats — exclude estimating */}
              <div style={{ display: "flex", gap: 8, overflowX: "auto" }}>
                {CAPEX_FM_STAGES.filter(st => st.id !== "estimating").map(st => {
                  const cnt = capexJobs.filter(j => j.stage === st.id).length;
                  const val = capexJobs.filter(j => j.stage === st.id).reduce((s,j) => s+j.contractValue, 0);
                  return (
                    <div key={st.id} style={{ flex: "0 0 160px", background: "#ECEEF8", border: "1px solid " + st.color + "30", borderRadius: 8, padding: "12px 14px", position: "relative", overflow: "hidden" }}>
                      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: st.color }} />
                      <div style={{ fontSize: 10, color: st.color, textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600, marginBottom: 4 }}>{st.label}</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: "#1A2240" }}>{cnt}</div>
                      <div style={{ fontSize: 11, color: "#4A5278" }}>{fmt(val)}</div>
                    </div>
                  );
                })}
              </div>

              {/* List grouped by stage — all except estimating */}
              {CAPEX_FM_STAGES.filter(st => st.id !== "estimating").map(st => {
                const stageJobs = capexJobs.filter(j => j.stage === st.id && (j.name.toLowerCase().includes(capexSearch.toLowerCase()) || !capexSearch));
                if (!stageJobs.length) return null;
                const actionField = st.actionKey;
                return (
                  <div key={st.id}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: st.color }} />
                      <span style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: st.color, fontWeight: 600 }}>{st.label}</span>
                      <span style={{ fontSize: 10, color: "#4A5278" }}>({stageJobs.length})</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {stageJobs.map(job => {
                        const co   = companies.find(c => c.id === job.companyId);
                        const site = sites.find(s => s.id === job.siteId);
                        const actionDate = job[actionField];
                        const overdue = actionDate && new Date(actionDate) < new Date();
                        const soon    = actionDate && new Date(actionDate) <= new Date(Date.now() + 7*86400000);
                        return (
                          <div key={job.id} className="opp-row" onClick={() => setSelectedCapexJob(job)}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13, color: "#1A2240", fontWeight: 600, marginBottom: 4 }}>{job.name}</div>
                                <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                                  {co   && <span style={{ fontSize: 11, color: "#3B6FE8" }}>🏢 {co.name}</span>}
                                  {site && <span style={{ fontSize: 11, color: "#4A5278" }}>📍 Store #{site.storeNumber}</span>}
                                  {job.pm && <span style={{ fontSize: 11, color: "#353C62" }}>👤 {job.pm}</span>}
                                  {actionDate && <span style={{ fontSize: 11, color: overdue ? "#F87171" : soon ? "#FCD34D" : "#4A5278" }}>📅 {st.actionLabel}: {actionDate}{overdue ? " ⚠" : ""}</span>}
                                </div>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                                <span style={{ fontSize: 15, fontWeight: 700, color: st.color }}>{fmt(job.contractValue)}</span>
                                <div style={{ display: "flex", gap: 5 }} onClick={e => e.stopPropagation()}>
                                  <button className="btn-ghost" style={{ fontSize: 11 }} onClick={() => moveCapexStage(job.id, -1)}>←</button>
                                  <button className="btn-ghost" style={{ fontSize: 11 }} onClick={() => moveCapexStage(job.id,  1)}>→</button>
                                  <button className="btn-ghost" style={{ fontSize: 11 }} onClick={() => openEditCapex(job)}>✎</button>
                                  <button className="btn-ghost" style={{ fontSize: 11, color: "#F87171", borderColor: "#F8717120" }} onClick={() => deleteCapex(job.id)}>✕</button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── FM JOBS ── */}
          {activeNav === "jobs" && activeBU === "facility" && (() => {
            const coords = ["all", ...Array.from(new Set(fmTeam.map(m => m.name)))];
            const filtered = fmJobs.filter(j => {
              const isActive    = FM_ACTIVE_STAGES.some(s => s.id === j.stage);
              const matchCoord  = fmCoordFilter === "all" || j.coordinator === fmCoordFilter;
              const matchSearch = !fmSearch || j.name.toLowerCase().includes(fmSearch.toLowerCase()) || (j.storeCode||"").toLowerCase().includes(fmSearch.toLowerCase()) || (j.projectNo||"").toLowerCase().includes(fmSearch.toLowerCase());
              return isActive && matchCoord && matchSearch;
            });
            const totalGross  = filtered.reduce((s,j) => s + (j.contractValue||0), 0);
            const totalProfit = filtered.reduce((s,j) => s + (j.grossProfit||0), 0);
            const FM_COLS = [
              { key: "storeCode",           label: "Store",          w: 70  },
              { key: "projectNo",           label: "Project #",      w: 90  },
              { key: "name",                label: "Scope of Work",  w: 220 },
              { key: "address",             label: "Site Address",   w: 180 },
              { key: "vendor",              label: "Vendor",         w: 140 },
              { key: "ownersProjectNo",     label: "Owner Proj #",   w: 110 },
              { key: "contractValue",       label: "Gross Value",    w: 100 },
              { key: "grossProfit",         label: "Gross Profit",   w: 100 },
              { key: "vendorInvoiceAmount", label: "Vendor Invoice", w: 110 },
              { key: "startDate",           label: "Start Work",     w: 90  },
              { key: "vendorInvoiceNumber", label: "Inv #",          w: 90  },
              { key: "nextStep",            label: "Next Step",      w: 120 },
              { key: "vendorNextStep",      label: "Vendor Next",    w: 120 },
            ];
            return (
              <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: "#1A2240", letterSpacing: "-0.01em", textTransform: "uppercase" }}>Active Jobs</div>
                    <div style={{ fontSize: 11, color: "#4A5278", marginTop: 3, letterSpacing: "0.06em" }}>{filtered.length} JOBS · {fmt(totalGross)} GROSS · {fmt(totalProfit)} PROFIT</div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input className="fi" style={{ width: 180 }} placeholder="Search…" value={fmSearch} onChange={e => setFmSearch(e.target.value)} />
                    <button className="btn-primary" onClick={openAddFm}>+ Add Job</button>
                  </div>
                </div>

                {/* Stage stats — active phase only */}
                <div style={{ display: "flex", gap: 8, overflowX: "auto" }}>
                  {FM_ACTIVE_STAGES.map(st => {
                    const cnt = filtered.filter(j => j.stage === st.id).length;
                    const val = filtered.filter(j => j.stage === st.id).reduce((s,j) => s+j.contractValue,0);
                    return (
                      <div key={st.id} style={{ flex: "0 0 140px", background: "#ECEEF8", border: "1px solid " + st.color + "30", borderRadius: 8, padding: "10px 14px", position: "relative", overflow: "hidden" }}>
                        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: st.color }} />
                        <div style={{ fontSize: 10, color: st.color, textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600, marginBottom: 3 }}>{st.label}</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: "#1A2240" }}>{cnt}</div>
                        <div style={{ fontSize: 10, color: "#4A5278" }}>{fmt(val)}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Coordinator filter tabs */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {coords.map(c => (
                    <button key={c} onClick={() => setFmCoordFilter(c)}
                      style={{ padding: "6px 14px", borderRadius: 20, border: "1px solid", cursor: "pointer", fontSize: 11, fontFamily: "inherit", fontWeight: 500, transition: "all 0.15s",
                        borderColor: fmCoordFilter === c ? buColor.accent : "#CBD1E8",
                        background:  fmCoordFilter === c ? buColor.light  : "transparent",
                        color:       fmCoordFilter === c ? buColor.accent  : "#4A5278" }}>
                      {c === "all" ? "All Jobs" : c}
                      <span style={{ marginLeft: 6, fontSize: 10, opacity: 0.7 }}>
                        {c === "all" ? fmJobs.length : fmJobs.filter(j => j.coordinator === c).length}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Spreadsheet table */}
                <div style={{ overflowX: "auto", borderRadius: 10, border: "1px solid #CBD1E8" }}>
                  <table style={{ borderCollapse: "collapse", width: "100%", minWidth: FM_COLS.reduce((s,c) => s+c.w, 0) + 80 }}>
                    <thead>
                      <tr style={{ background: "#FFFFFF", borderBottom: "1px solid #CBD1E8" }}>
                        <th style={{ width: 40, padding: "10px 12px", textAlign: "left" }}></th>
                        {FM_COLS.map(col => (
                          <th key={col.key} style={{ width: col.w, padding: "10px 12px", textAlign: "left", fontSize: 10, color: "#4A5278", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600, whiteSpace: "nowrap" }}>{col.label}</th>
                        ))}
                        <th style={{ width: 80, padding: "10px 12px" }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.length === 0 && (
                        <tr><td colSpan={FM_COLS.length + 2} style={{ textAlign: "center", padding: "48px", color: "#3D4570", fontSize: 12 }}>No jobs found</td></tr>
                      )}
                      {filtered.map((job, idx) => {
                        const st   = FM_STAGES.find(s => s.id === job.stage) || FM_STAGES[0];
                        const site = sites.find(s => s.id === job.siteId);
                        const sub  = subcontractors.find(s => s.id === job.subcontractorId);
                        const rowBg = idx % 2 === 0 ? "#F8F9FD" : "#F2F4FA";
                        return (
                          <tr key={job.id} style={{ background: rowBg, borderBottom: "1px solid #D8DCF0", cursor: "pointer", transition: "background 0.1s" }}
                            onMouseEnter={e => e.currentTarget.style.background = "#EBF0FF"}
                            onMouseLeave={e => e.currentTarget.style.background = rowBg}
                            onClick={() => setSelectedFmJob(job)}>
                            {/* Stage dot */}
                            <td style={{ padding: "10px 12px" }}>
                              <div style={{ width: 8, height: 8, borderRadius: "50%", background: st.color, margin: "auto" }} title={st.label} />
                            </td>
                            {/* Store Code */}
                            <td style={{ padding: "10px 12px", fontSize: 12, color: "#252E52", whiteSpace: "nowrap" }}>{job.storeCode || "—"}</td>
                            {/* Project No */}
                            <td style={{ padding: "10px 12px", fontSize: 12, color: "#252E52", whiteSpace: "nowrap" }}>{job.projectNo || "—"}</td>
                            {/* Scope / Name */}
                            <td style={{ padding: "10px 12px", fontSize: 12, color: "#1A2240", fontWeight: 500, maxWidth: 220 }}>
                              <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{job.name}</div>
                            </td>
                            {/* Site Address */}
                            <td style={{ padding: "10px 12px", fontSize: 11, color: "#353C62", maxWidth: 180 }}>
                              <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{site?.address || "—"}</div>
                            </td>
                            {/* Vendor */}
                            <td style={{ padding: "10px 12px", fontSize: 12 }}>
                              {sub ? <span style={{ background: "#3B6FE820", color: buColor.accent, padding: "2px 8px", borderRadius: 4, fontSize: 11, whiteSpace: "nowrap" }}>{sub.name}</span> : <span style={{ color: "#3D4570", fontSize: 11 }}>—</span>}
                            </td>
                            {/* Owner's Project No */}
                            <td style={{ padding: "10px 12px", fontSize: 11, color: "#353C62", whiteSpace: "nowrap" }}>{job.ownersProjectNo || "—"}</td>
                            {/* Gross Value */}
                            <td style={{ padding: "10px 12px", fontSize: 12, color: "#1A2240", fontWeight: 600, whiteSpace: "nowrap" }}>{fmt(job.contractValue)}</td>
                            {/* Gross Profit */}
                            <td style={{ padding: "10px 12px", fontSize: 12, color: "#4ADE80", fontWeight: 600, whiteSpace: "nowrap" }}>{fmt(job.grossProfit)}</td>
                            {/* Vendor Invoice Amount */}
                            <td style={{ padding: "10px 12px", fontSize: 12, color: "#252E52", whiteSpace: "nowrap" }}>{job.vendorInvoiceAmount ? fmt(job.vendorInvoiceAmount) : "—"}</td>
                            {/* Start Work Date */}
                            <td style={{ padding: "10px 12px", fontSize: 11, color: "#353C62", whiteSpace: "nowrap" }}>{job.startDate || "—"}</td>
                            {/* Vendor Invoice Number */}
                            <td style={{ padding: "10px 12px", fontSize: 11, color: "#353C62", whiteSpace: "nowrap" }}>{job.vendorInvoiceNumber || "—"}</td>
                            {/* Next Step */}
                            <td style={{ padding: "10px 12px" }}>
                              <span style={{ fontSize: 10, fontWeight: 600, color: st.color, background: st.color + "15", padding: "3px 8px", borderRadius: 4, whiteSpace: "nowrap" }}>{st.label}</span>
                            </td>
                            {/* Vendor Next Step */}
                            <td style={{ padding: "10px 12px", fontSize: 11, color: "#353C62", maxWidth: 120 }}>
                              <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{VENDOR_NEXT_STEPS.find(v => v.id === job.vendorNextStep)?.label || job.vendorNextStep || "—"}</div>
                            </td>
                            {/* Actions */}
                            <td style={{ padding: "10px 12px" }} onClick={e => e.stopPropagation()}>
                              <div style={{ display: "flex", gap: 4 }}>
                                <button className="btn-ghost" style={{ fontSize: 10, padding: "3px 7px" }} onClick={() => openEditFm(job)}>✎</button>
                                <button className="btn-ghost" style={{ fontSize: 10, padding: "3px 7px", color: "#F87171", borderColor: "#F8717120" }} onClick={() => deleteFm(job.id)}>✕</button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    {filtered.length > 0 && (
                      <tfoot>
                        <tr style={{ background: "#F0F2F8", borderTop: "2px solid #CBD1E8" }}>
                          <td colSpan={6} style={{ padding: "10px 12px", fontSize: 11, color: "#4A5278", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em" }}>Totals</td>
                          <td style={{ padding: "10px 12px" }}></td>
                          <td style={{ padding: "10px 12px", fontSize: 12, color: "#1A2240", fontWeight: 700 }}>{fmt(totalGross)}</td>
                          <td style={{ padding: "10px 12px", fontSize: 12, color: "#4ADE80", fontWeight: 700 }}>{fmt(totalProfit)}</td>
                          <td colSpan={5} style={{ padding: "10px 12px" }}></td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            );
          })()}

          {/* ── FINANCE ── */}
          {activeNav === "finance" && (
            <div className="fade-in">
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#1A2240", textTransform: "uppercase" }}>Finance</div>
                <div style={{ fontSize: 11, color: "#4A5278", marginTop: 4 }}>FARMER GROUP · ALL BUSINESS UNITS</div>
              </div>
              <div className="coming-soon">
                <div style={{ width: 48, height: 48, borderRadius: 12, background: "#3B6FE815", border: "1px solid #3B6FE833", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>💰</div>
                <div style={{ fontSize: 14, color: "#4A5278", fontWeight: 500 }}>Finance — Coming Soon</div>
              </div>
            </div>
          )}

          {/* ── TEAM ── */}
          {activeNav === "team" && !selectedCoord && (
            <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 22 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "#1A2240", letterSpacing: "-0.01em", textTransform: "uppercase" }}>Team</div>
                  <div style={{ fontSize: 11, color: "#4A5278", marginTop: 3, letterSpacing: "0.06em" }}>{BUSINESS_UNITS.find(b => b.id === activeBU)?.label.toUpperCase()} · {fmTeam.length} MEMBERS · CLICK A NAME TO SEE THEIR DAILY REPORT</div>
                </div>
                <button className="btn-primary" onClick={() => { setEditTeamId(null); setTeamForm({ name: "", phone: "", email: "" }); setShowTeamForm(true); }}>+ Add Member</button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {fmTeam.length === 0 && (
                  <div style={{ textAlign: "center", padding: "48px", color: "#3D4570", fontSize: 12, background: "#ECEEF8", borderRadius: 10, border: "1px solid #CBD1E8" }}>No team members yet — add your first one</div>
                )}
                {fmTeam.map(m => {
                  const myJobs   = fmJobs.filter(j => j.coordinator === m.name);
                  const active   = myJobs.filter(j => FM_ACTIVE_STAGES.some(s => s.id === j.stage));
                  const pipeline = myJobs.filter(j => FM_PIPELINE_STAGES.some(s => s.id === j.stage));
                  const urgentCount = myJobs.filter(j => {
                    const st = FM_STAGES.find(s => s.id === j.stage);
                    if (!st) return false;
                    const d = j[st.actionKey];
                    return d && new Date(d) <= new Date(Date.now() + 3*86400000);
                  }).length;
                  return (
                    <div key={m.id} className="opp-row" style={{ cursor: "pointer" }} onClick={() => setSelectedCoord(m.name)}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                          <div style={{ width: 44, height: 44, borderRadius: "50%", background: buColor.light, border: "1px solid " + buColor.accent + "40", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 700, color: buColor.accent, flexShrink: 0 }}>
                            {m.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontSize: 14, color: buColor.accent, fontWeight: 600, textDecoration: "underline", textDecorationColor: buColor.accent + "60" }}>{m.name}</div>
                            <div style={{ display: "flex", gap: 14, marginTop: 3, flexWrap: "wrap" }}>
                              {m.phone && <span style={{ fontSize: 11, color: "#4A5278" }}>📞 {m.phone}</span>}
                              {m.email && <span style={{ fontSize: 11, color: "#4A5278" }}>✉ {m.email}</span>}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          {/* Job count pills */}
                          <div style={{ display: "flex", gap: 6 }}>
                            <span style={{ fontSize: 10, background: "#4ADE8020", color: "#4ADE80", border: "1px solid #4ADE8040", padding: "3px 9px", borderRadius: 12, fontWeight: 600 }}>{active.length} active</span>
                            <span style={{ fontSize: 10, background: "#818CF820", color: "#818CF8", border: "1px solid #818CF840", padding: "3px 9px", borderRadius: 12, fontWeight: 600 }}>{pipeline.length} pipeline</span>
                            {urgentCount > 0 && <span style={{ fontSize: 10, background: "#F8717120", color: "#F87171", border: "1px solid #F8717140", padding: "3px 9px", borderRadius: 12, fontWeight: 600 }}>⚠ {urgentCount} urgent</span>}
                          </div>
                          <div style={{ display: "flex", gap: 5 }} onClick={e => e.stopPropagation()}>
                            <button className="btn-ghost" style={{ fontSize: 11 }} onClick={() => { setEditTeamId(m.id); setTeamForm({ name: m.name, phone: m.phone, email: m.email }); setShowTeamForm(true); }}>✎</button>
                            <button className="btn-ghost" style={{ fontSize: 11, color: "#F87171", borderColor: "#F8717120" }} onClick={() => setFmTeam(fmTeam.filter(x => x.id !== m.id))}>✕</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* showTeamForm rendered at root level */}
            </div>
          )}

          {/* ── COORDINATOR DAILY REPORT ── */}
          {activeNav === "team" && selectedCoord && (() => {
            const today      = new Date();
            const myJobs     = fmJobs.filter(j => j.coordinator === selectedCoord);
            const totalGross  = myJobs.reduce((s,j) => s + (j.contractValue||0), 0);
            const totalProfit = myJobs.reduce((s,j) => s + (j.grossProfit||0), 0);

            // Priority score: lower = more urgent. Based on days in stage (age) and date proximity
            const getPriority = (job) => {
              const st = FM_STAGES.find(s => s.id === job.stage);
              if (!st) return 999;
              const actionDate = job[st.actionKey];
              if (actionDate) {
                const daysUntil = (new Date(actionDate) - today) / 86400000;
                if (daysUntil < 0)  return 0;   // overdue
                if (daysUntil < 3)  return 1;   // due very soon
                if (daysUntil < 7)  return 2;   // due this week
                return 3;
              }
              return 4; // no date set
            };

            const getUrgencyLabel = (job) => {
              const st = FM_STAGES.find(s => s.id === job.stage);
              if (!st) return null;
              const d = job[st.actionKey];
              if (!d) return null;
              const days = Math.round((new Date(d) - today) / 86400000);
              if (days < 0)  return { text: `${Math.abs(days)}d overdue`, color: "#F87171", bg: "#F8717115" };
              if (days === 0) return { text: "Due today",               color: "#F87171", bg: "#F8717115" };
              if (days <= 3)  return { text: `Due in ${days}d`,          color: "#FCD34D", bg: "#FCD34D15" };
              if (days <= 7)  return { text: `Due in ${days}d`,          color: "#60A5FA", bg: "#60A5FA15" };
              return null;
            };

            const JobRow = ({ job }) => {
              const st      = FM_STAGES.find(s => s.id === job.stage);
              const urgency = getUrgencyLabel(job);
              const site    = sites.find(s => s.id === job.siteId);
              const sub     = subcontractors.find(s => s.id === job.subcontractorId);
              const actionDate = st ? job[st.actionKey] : null;
              return (
                <div style={{ background: "#F8F9FD", border: "1px solid #CBD1E8", borderRadius: 8, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8, cursor: "pointer", transition: "border-color 0.15s" }}
                  onClick={() => setSelectedFmJob(job)}
                  onMouseEnter={e => e.currentTarget.style.borderColor = buColor.accent + "60"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "#CBD1E8"}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                        <span style={{ fontSize: 13, color: "#1A2240", fontWeight: 600 }}>{job.name}</span>
                        {job.storeCode  && <span style={{ fontSize: 10, color: "#4A5278", background: "#E8EBFA", padding: "2px 7px", borderRadius: 4 }}>#{job.storeCode}</span>}
                        {job.projectNo  && <span style={{ fontSize: 10, color: "#4A5278", background: "#E8EBFA", padding: "2px 7px", borderRadius: 4 }}>{job.projectNo}</span>}
                        {urgency && <span style={{ fontSize: 10, fontWeight: 700, color: urgency.color, background: urgency.bg, padding: "2px 8px", borderRadius: 4 }}>{urgency.text}</span>}
                      </div>
                      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                        {site && <span style={{ fontSize: 11, color: "#4A5278" }}>📍 {site.address}</span>}
                        {sub  && <span style={{ fontSize: 11, color: "#353C62" }}>🔧 {sub.name}</span>}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#1A2240" }}>{fmt(job.contractValue)}</div>
                      <div style={{ fontSize: 11, color: "#4ADE80" }}>{fmt(job.grossProfit)} GP</div>
                    </div>
                  </div>
                  {/* Key dates row */}
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", paddingTop: 8, borderTop: "1px solid #1A2035" }}>
                    {st && actionDate && (
                      <span style={{ fontSize: 11, color: urgency ? urgency.color : "#353C62" }}>
                        📅 {st.actionLabel}: <strong>{actionDate}</strong>
                      </span>
                    )}
                    {job.startDate && <span style={{ fontSize: 11, color: "#353C62" }}>▶ Start: {job.startDate}</span>}
                    {job.vendorNextStep && <span style={{ fontSize: 11, color: "#252E52" }}>↪ Vendor: {VENDOR_NEXT_STEPS.find(v => v.id === job.vendorNextStep)?.label || job.vendorNextStep}</span>}
                    {job.ownersProjectNo && <span style={{ fontSize: 11, color: "#4A5278" }}>WO: {job.ownersProjectNo}</span>}
                  </div>
                  {job.notes && (
                    <div style={{ fontSize: 11, color: "#353C62", fontStyle: "italic", paddingTop: 4, borderTop: "1px solid #1A2035" }}>
                      {job.notes}
                    </div>
                  )}
                </div>
              );
            };

            return (
              <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 22 }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => setSelectedCoord(null)}>← Back</button>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: buColor.light, border: "2px solid " + buColor.accent + "60", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, color: buColor.accent, flexShrink: 0 }}>
                    {selectedCoord.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: "#1A2240", letterSpacing: "-0.01em" }}>{selectedCoord}</div>
                    <div style={{ fontSize: 11, color: "#4A5278", marginTop: 2, letterSpacing: "0.06em" }}>
                      {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }).toUpperCase()} · DAILY REPORT
                    </div>
                  </div>
                </div>

                {/* Summary KPIs */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
                  {[
                    { label: "Total Jobs",    value: myJobs.length,                                                                             color: buColor.accent },
                    { label: "Active Jobs",   value: myJobs.filter(j => FM_ACTIVE_STAGES.some(s => s.id === j.stage)).length,                   color: "#4ADE80" },
                    { label: "In Pipeline",   value: myJobs.filter(j => FM_PIPELINE_STAGES.some(s => s.id === j.stage)).length,                 color: "#818CF8" },
                    { label: "Urgent",        value: myJobs.filter(j => getPriority(j) <= 1).length,                                            color: "#F87171" },
                  ].map(k => (
                    <div key={k.label} style={{ background: "#ECEEF8", border: "1px solid " + k.color + "25", borderRadius: 8, padding: "12px 16px", position: "relative", overflow: "hidden" }}>
                      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: k.color }} />
                      <div style={{ fontSize: 10, color: "#4A5278", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>{k.label}</div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: k.color }}>{k.value}</div>
                    </div>
                  ))}
                </div>

                {/* Financial summary */}
                <div style={{ background: "#ECEEF8", border: "1px solid #CBD1E8", borderRadius: 8, padding: "14px 20px", display: "flex", gap: 32 }}>
                  <div>
                    <div style={{ fontSize: 10, color: "#4A5278", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>Total Gross Value</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#1A2240" }}>{fmt(totalGross)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: "#4A5278", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>Total Gross Profit</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#4ADE80" }}>{fmt(totalProfit)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: "#4A5278", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>GP Margin</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: totalGross ? (totalProfit/totalGross > 0.2 ? "#4ADE80" : "#FCD34D") : "#4A5278" }}>
                      {totalGross ? Math.round((totalProfit/totalGross)*100) + "%" : "—"}
                    </div>
                  </div>
                </div>

                {myJobs.length === 0 && (
                  <div style={{ textAlign: "center", padding: "48px", color: "#3D4570", fontSize: 12, background: "#ECEEF8", borderRadius: 10, border: "1px solid #CBD1E8" }}>
                    No jobs assigned to {selectedCoord} yet
                  </div>
                )}

                {/* Jobs grouped by stage in FM_STAGES order, sorted by priority within each group */}
                {FM_STAGES.map(st => {
                  const stageJobs = myJobs
                    .filter(j => j.stage === st.id)
                    .sort((a, b) => getPriority(a) - getPriority(b));
                  if (!stageJobs.length) return null;
                  const phaseLabel = st.phase === "pipeline" ? "PIPELINE" : "ACTIVE";
                  return (
                    <div key={st.id}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                        <div style={{ width: 10, height: 10, borderRadius: "50%", background: st.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 12, letterSpacing: "0.07em", textTransform: "uppercase", color: st.color, fontWeight: 700 }}>{st.label}</span>
                        <span style={{ fontSize: 10, color: "#3D4570", background: "#E8EBFA", padding: "1px 7px", borderRadius: 4 }}>{phaseLabel}</span>
                        <span style={{ fontSize: 10, color: "#4A5278" }}>{stageJobs.length} job{stageJobs.length !== 1 ? "s" : ""}</span>
                        <span style={{ fontSize: 10, color: "#4A5278" }}>· {fmt(stageJobs.reduce((s,j) => s+(j.contractValue||0),0))}</span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingLeft: 4 }}>
                        {stageJobs.map(j => <JobRow key={j.id} job={j} />)}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* ── SUBCONTRACTORS (master list — FM, Lawn, Snow) ── */}
          {activeNav === "subcontractors" && ["facility","lawn","snow"].includes(activeBU) && (() => {
            const SUB_SERVICE_OPTIONS = [
              { id: "fm",   label: "Facility Maint.", color: "#7BA7F5" },
              { id: "lawn", label: "Lawn",            color: "#4CAF82" },
              { id: "snow", label: "Snow",            color: "#A8C4F8" },
            ];
            // filter list by current BU for relevance highlight, but show all
            const visibleSubs = subcontractors.filter(s => {
              if (!s.services || s.services.length === 0) return true;
              return activeBU === "facility" ? s.services.includes("fm")
                   : activeBU === "lawn"     ? s.services.includes("lawn")
                   : s.services.includes("snow");
            });
            const allCount = subcontractors.length;
            return (
              <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 22 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: "#1A2240", letterSpacing: "-0.01em", textTransform: "uppercase" }}>Subcontractors</div>
                    <div style={{ fontSize: 11, color: "#4A5278", marginTop: 3, letterSpacing: "0.06em" }}>MASTER LIST · {allCount} TOTAL · showing {visibleSubs.length} for {activeBU.toUpperCase()}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <button className="btn-ghost" style={{ fontSize: 11, color: "#4A5278" }} onClick={() => { /* show all toggle handled by rendering all */ }}>
                      {visibleSubs.length < allCount ? "+ " + (allCount - visibleSubs.length) + " hidden (other BUs)" : ""}
                    </button>
                    <button className="btn-primary" onClick={() => { setEditSubId(null); setSubForm({ name: "", trade: "", phone: "", email: "", msaStatus: "missing", coiExpiry: "", w9: false, notes: "", services: [activeBU === "facility" ? "fm" : activeBU] }); setShowSubForm(true); }}>+ Add Subcontractor</button>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
                  {[
                    { label: "Total Subs",    value: allCount,                                                                                                                                color: buColor.accent },
                    { label: "MSA Signed",    value: subcontractors.filter(s => s.msaStatus === "signed").length,                                                                             color: "#4ADE80" },
                    { label: "COI Expiring",  value: subcontractors.filter(s => { if (!s.coiExpiry) return false; const d = new Date(s.coiExpiry); return d > new Date() && d <= new Date(Date.now() + 30*86400000); }).length, color: "#FCD34D" },
                    { label: "Missing Docs",  value: subcontractors.filter(s => s.msaStatus !== "signed" || !s.w9 || !s.coiExpiry).length,                                                   color: "#F87171" },
                  ].map(s => (
                    <div key={s.label} className="stat-card" style={{ position: "relative", overflow: "hidden", padding: "14px 18px" }}>
                      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: s.color }} />
                      <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#4A5278", marginBottom: 6 }}>{s.label}</div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {subcontractors.length === 0 && (
                    <div style={{ textAlign: "center", padding: "48px", color: "#3D4570", fontSize: 12, background: "#ECEEF8", borderRadius: 10, border: "1px solid #CBD1E8" }}>No subcontractors yet — add your first one</div>
                  )}
                  {subcontractors.map(s => {
                    const msaColor   = s.msaStatus === "signed" ? "#4ADE80" : s.msaStatus === "expired" ? "#F87171" : "#FCD34D";
                    const msaLabel   = s.msaStatus === "signed" ? "MSA ✓" : s.msaStatus === "expired" ? "MSA Expired" : "MSA Missing";
                    const coiDate    = s.coiExpiry ? new Date(s.coiExpiry) : null;
                    const coiExpired = coiDate && coiDate < new Date();
                    const coiSoon    = coiDate && !coiExpired && coiDate <= new Date(Date.now() + 30*86400000);
                    const coiColor   = !coiDate ? "#F87171" : coiExpired ? "#F87171" : coiSoon ? "#FCD34D" : "#4ADE80";
                    const coiLabel   = !coiDate ? "COI Missing" : coiExpired ? "COI Expired" : coiSoon ? "COI Expiring " + s.coiExpiry : "COI ✓ " + s.coiExpiry;
                    const w9Color    = s.w9 ? "#4ADE80" : "#F87171";
                    const assignedFmJobs   = fmJobs.filter(j => j.subcontractorId === s.id);
                    const assignedLawnBids = lawnBids.filter(b => b.subcontractorId === s.id);
                    const svcTags = (s.services || []).map(sv => SUB_SERVICE_OPTIONS.find(o => o.id === sv)).filter(Boolean);
                    const isCurrentBU = !s.services || s.services.length === 0 || (activeBU === "facility" ? s.services.includes("fm") : s.services.includes(activeBU));
                    return (
                      <div key={s.id} className="opp-row" style={{ opacity: isCurrentBU ? 1 : 0.5 }}>
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                              <div style={{ fontSize: 14, color: "#1A2240", fontWeight: 600 }}>{s.name}</div>
                              {s.trade && <span style={{ fontSize: 10, color: buColor.accent, background: buColor.light, padding: "2px 8px", borderRadius: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.trade}</span>}
                              {svcTags.map(sv => (
                                <span key={sv.id} style={{ fontSize: 10, color: sv.color, background: sv.color + "20", border: "1px solid " + sv.color + "40", padding: "2px 8px", borderRadius: 10, fontWeight: 600 }}>{sv.label}</span>
                              ))}
                              {(!s.services || s.services.length === 0) && <span style={{ fontSize: 10, color: "#4A5278", fontStyle: "italic" }}>All divisions</span>}
                            </div>
                            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 8 }}>
                              {s.phone && <span style={{ fontSize: 11, color: "#4A5278" }}>📞 {s.phone}</span>}
                              {s.email && <span style={{ fontSize: 11, color: "#4A5278" }}>✉ {s.email}</span>}
                              {assignedFmJobs.length > 0 && <span style={{ fontSize: 11, color: "#7BA7F5" }}>🔨 {assignedFmJobs.length} FM job{assignedFmJobs.length !== 1 ? "s" : ""}</span>}
                              {assignedLawnBids.length > 0 && <span style={{ fontSize: 11, color: "#4CAF82" }}>🌿 {assignedLawnBids.length} lawn site{assignedLawnBids.length !== 1 ? "s" : ""}</span>}
                            </div>
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                              <span style={{ fontSize: 10, fontWeight: 600, color: msaColor, background: msaColor + "15", border: "1px solid " + msaColor + "30", padding: "3px 10px", borderRadius: 10 }}>{msaLabel}</span>
                              <span style={{ fontSize: 10, fontWeight: 600, color: coiColor, background: coiColor + "15", border: "1px solid " + coiColor + "30", padding: "3px 10px", borderRadius: 10 }}>{coiLabel}</span>
                              <span style={{ fontSize: 10, fontWeight: 600, color: w9Color, background: w9Color + "15", border: "1px solid " + w9Color + "30", padding: "3px 10px", borderRadius: 10 }}>{s.w9 ? "W9 ✓" : "W9 Missing"}</span>
                            </div>
                            {s.notes && <div style={{ fontSize: 11, color: "#4A5278", marginTop: 8, fontStyle: "italic" }}>{s.notes}</div>}
                          </div>
                          <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                            <button className="btn-ghost" style={{ fontSize: 11 }} onClick={() => { setEditSubId(s.id); setSubForm({ name: s.name, trade: s.trade||"", phone: s.phone||"", email: s.email||"", msaStatus: s.msaStatus||"missing", coiExpiry: s.coiExpiry||"", w9: !!s.w9, notes: s.notes||"", services: s.services||[] }); setShowSubForm(true); }}>✎</button>
                            <button className="btn-ghost" style={{ fontSize: 11, color: "#F87171", borderColor: "#F8717120" }} onClick={() => setSubcontractors(subcontractors.filter(x => x.id !== s.id))}>✕</button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* showSubForm rendered at root level */}
              </div>
            );
          })()}

          {/* ── LAWN BUDGETING ── */}
          {activeNav === "bids" && activeBU === "lawn" && (() => {
            const allLawnSites = lawnSites;
            const currentSites = allLawnSites.filter(site => {
              const b = getLawnBid(site.id);
              const isNotBidding = b?.status === "not_bidding";
              return showNotBidding ? true : !isNotBidding;
            });
            const notBiddingCount = allLawnSites.filter(site => getLawnBid(site.id)?.status === "not_bidding").length;
            // Kanban columns
            const getCol = (site) => {
              const b = getLawnBid(site.id);
              if (!b) return "untouched";
              const hasSubs = (b.subcontractorIds || []).length > 0;
              if (b.status === "owner_approved") return "owner_approval";
              if (b.status === "owner_accepted" || b.status === "buyout" || b.status === "contracted") return "buyout";
              if (hasSubs) return "bidding";
              return "untouched";
            };
            const COLS = [
              { id: "untouched",      label: "Not Touched",      color: "#4A5278",  icon: "○" },
              { id: "bidding",        label: "Bidding",           color: "#FCD34D",  icon: "🔧" },
              { id: "owner_approval", label: "Owner Approval",    color: "#60A5FA",  icon: "⏳" },
              { id: "buyout",         label: "Buyout",            color: "#4ADE80",  icon: "💰" },
            ];
            const colSites = (colId) => currentSites.filter(s => getCol(s) === colId);
            const totalOur = currentSites.reduce((sum, site) => sum + lawnBidAnnualOur(getLawnBid(site.id)), 0);

            // Map: filter by column
            const mapSites = bidMapColFilter === "all"
              ? currentSites
              : currentSites.filter(s => getCol(s) === bidMapColFilter);
            const mapSitesWithCoords = mapSites.filter(s => s.lat && s.lng);

            return (
              <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: "#1A2240", letterSpacing: "-0.01em", textTransform: "uppercase" }}>Lawn Bids</div>
                    <div style={{ fontSize: 11, color: "#4A5278", marginTop: 3, letterSpacing: "0.06em" }}>SEASON {lawnBidSeason} · {currentSites.length} SITES · ${Math.round(totalOur).toLocaleString()} BOOK VALUE{notBiddingCount > 0 && !showNotBidding ? " · " + notBiddingCount + " HIDDEN" : ""}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {notBiddingCount > 0 && (
                      <button onClick={() => setShowNotBidding(v => !v)} style={{ background: showNotBidding ? "#353C6220" : "transparent", border: "1px solid #353C6250", color: showNotBidding ? "#9CA3C0" : "#353C62", borderRadius: 6, padding: "6px 12px", fontSize: 11, cursor: "pointer" }}>
                        {showNotBidding ? "👁 Hide Archived" : "📦 " + notBiddingCount + " Archived"}
                      </button>
                    )}
                    <select value={lawnBidSeason} onChange={e => setLawnBidSeason(e.target.value)} style={{ background: "#F5F7FC", border: "1px solid #CBD1E8", color: "#252E52", borderRadius: 6, padding: "6px 10px", fontSize: 13 }}>
                      {["2024","2025","2026","2027"].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>

                {/* ── Bid Map ── */}
                <div style={{ background: "#F0F2F8", border: "1px solid #CBD1E8", borderRadius: 12, overflow: "hidden" }}>
                  {/* Map filter tabs */}
                  <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #CBD1E8", padding: "10px 14px", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#4A5278", textTransform: "uppercase", letterSpacing: "0.08em" }}>📍 Bid Map</div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {[{ id: "all", label: "All", color: "#252E52" }, ...COLS].map(col => {
                        const count = col.id === "all" ? currentSites.length : colSites(col.id).length;
                        const active = bidMapColFilter === col.id;
                        return (
                          <button key={col.id} onClick={() => setBidMapColFilter(col.id)} style={{ background: active ? (col.color || "#252E52") + "20" : "transparent", border: "1px solid " + (active ? (col.color || "#252E52") + "50" : "#CBD1E8"), color: active ? (col.color || "#252E52") : "#4A5278", borderRadius: 6, padding: "4px 10px", fontSize: 10, cursor: "pointer", fontWeight: active ? 700 : 400 }}>
                            {col.label} <span style={{ opacity: 0.7 }}>({count})</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  {/* Map */}
                  <div style={{ position: "relative", height: 280 }}>
                    {mapSitesWithCoords.length === 0 ? (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#4A5278", fontSize: 13 }}>No sites with coordinates in this filter</div>
                    ) : (() => {
                      const lats = mapSitesWithCoords.map(s => s.lat);
                      const lngs = mapSitesWithCoords.map(s => s.lng);
                      const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
                      const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
                      const colColors = { untouched: "gray", bidding: "yellow", owner_approval: "blue", buyout: "green" };
                      const markers = mapSitesWithCoords.map(s => {
                        const col = getCol(s);
                        const color = colColors[col] || "red";
                        return `markers=color:${color}%7C${s.lat},${s.lng}`;
                      }).join("&");
                      const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${centerLat},${centerLng}&zoom=5&size=800x280&maptype=roadmap&${markers}&key=AIzaSyD-9tSrke72PouQMnMX-a7eZSW0jkFMBWY`;
                      return <img src={mapUrl} alt="Bid sites map" style={{ width: "100%", height: 280, objectFit: "cover", display: "block" }} />;
                    })()}
                    <div style={{ position: "absolute", bottom: 8, left: 12, display: "flex", gap: 6 }}>
                      {COLS.map(col => (
                        <div key={col.id} style={{ display: "flex", alignItems: "center", gap: 4, background: "#F0F2F8CC", borderRadius: 4, padding: "3px 7px" }}>
                          <div style={{ width: 7, height: 7, borderRadius: "50%", background: col.color }} />
                          <span style={{ fontSize: 9, color: col.color }}>{col.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Kanban board */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, alignItems: "start" }}>
                  {COLS.map(col => {
                    const sites = colSites(col.id);
                    return (
                      <div key={col.id} style={{ background: "#F0F2F8", border: "1px solid #CBD1E8", borderRadius: 10, overflow: "hidden" }}>
                        {/* Column header */}
                        <div style={{ padding: "12px 14px", borderBottom: "1px solid #CBD1E8", display: "flex", alignItems: "center", justifyContent: "space-between", background: col.color + "08" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                            <div style={{ width: 8, height: 8, borderRadius: "50%", background: col.color, flexShrink: 0 }} />
                            <span style={{ fontSize: 11, fontWeight: 700, color: col.color, textTransform: "uppercase", letterSpacing: "0.08em" }}>{col.label}</span>
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: col.color, background: col.color + "20", padding: "2px 8px", borderRadius: 10 }}>{sites.length}</span>
                        </div>

                        {/* Cards */}
                        <div style={{ padding: "10px 10px", display: "flex", flexDirection: "column", gap: 8, minHeight: 120 }}>
                          {sites.length === 0 && (
                            <div style={{ textAlign: "center", padding: "20px 0", color: "#3D4570", fontSize: 11 }}>No sites</div>
                          )}
                          {sites.map(site => {
                            const bid = getLawnBid(site.id);
                            const co = companies.find(c => c.id === site.companyId);
                            const assignedSubs = (bid?.subcontractorIds || []).map(id => subcontractors.find(s => s.id === id)).filter(Boolean);
                            const selectedSub = bid?.selectedSubId ? subcontractors.find(s => s.id === bid.selectedSubId) : null;
                            const annualOur = lawnBidAnnualOur(bid);
                            const isEditing = editLawnBidId === site.id;

                            return (
                              <div key={site.id} style={{ background: "#ECEEF8", border: "1px solid " + (isEditing ? col.color + "50" : "#CBD1E8"), borderRadius: 8, overflow: "hidden", transition: "border-color 0.15s" }}>
                                {/* Card header — click to expand */}
                                <div onClick={() => setEditLawnBidId(isEditing ? null : site.id)} style={{ padding: "10px 12px", cursor: "pointer" }}>
                                  <div style={{ fontSize: 12, fontWeight: 600, color: "#1A2240", marginBottom: 3 }}>
                                    {co?.name || "Unknown"} #{site.storeNumber || "—"}
                                  </div>
                                  <div style={{ fontSize: 10, color: "#4A5278", marginBottom: 6 }}>{site.address}</div>
                                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                    {annualOur > 0
                                      ? <span style={{ fontSize: 11, fontWeight: 700, color: "#4ADE80" }}>${Math.round(annualOur).toLocaleString()}<span style={{ fontSize: 9, fontWeight: 400, color: "#4A5278" }}>/yr</span></span>
                                      : <span style={{ fontSize: 10, color: "#3D4570" }}>No pricing yet</span>
                                    }
                                    <span style={{ fontSize: 10, color: "#4A5278" }}>{isEditing ? "▲" : "▼"}</span>
                                  </div>
                                  {/* Sub tags */}
                                  {assignedSubs.length > 0 && (
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                                      {assignedSubs.map(s => (
                                        <span key={s.id} style={{ fontSize: 9, padding: "1px 6px", borderRadius: 3, background: s.id === bid?.selectedSubId ? "#4ADE8020" : "#A78BFA15", color: s.id === bid?.selectedSubId ? "#4ADE80" : "#A78BFA", border: "1px solid " + (s.id === bid?.selectedSubId ? "#4ADE8030" : "#A78BFA30") }}>
                                          {s.id === bid?.selectedSubId ? "✓ " : ""}{s.name}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* Expanded edit panel */}
                                {isEditing && (
                                  <div style={{ borderTop: "1px solid #CBD1E8", padding: "14px 12px", display: "flex", flexDirection: "column", gap: 12 }}>

                                    {/* Move to column */}
                                    <div>
                                      <div style={{ fontSize: 9, color: "#4A5278", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Stage</div>
                                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                        {[
                                          { colId: "untouched",      status: null,             label: "Not Touched",     color: "#4A5278" },
                                          { colId: "bidding",        status: "bidding",         label: "Bidding",         color: "#FCD34D" },
                                          { colId: "owner_approval", status: "owner_approved",  label: "Owner Approval",  color: "#60A5FA" },
                                          { colId: "buyout",         status: "buyout",          label: "Buyout",          color: "#4ADE80" },
                                        ].map(opt => {
                                          const active = getCol(site) === opt.colId;
                                          return (
                                            <button key={opt.colId} onClick={() => {
                                              if (opt.status === null) {
                                                setLawnBids(prev => prev.filter(b => !(b.siteId === site.id && b.season === lawnBidSeason)));
                                              } else if (opt.status === "owner_approved") {
                                                const hasSub = (bid?.subcontractorIds||[]).length > 0;
                                                if (!hasSub) {
                                                  if (!window.confirm("No contractor assigned yet. Move to Owner Approval anyway?")) return;
                                                } else if (!bid?.selectedSubId && (bid?.subcontractorIds||[]).length > 1) {
                                                  if (!window.confirm("Multiple contractors but none selected as primary. Continue?")) return;
                                                }
                                                const autoId = (bid?.subcontractorIds||[]).length === 1 ? bid.subcontractorIds[0] : bid?.selectedSubId || "";
                                                upsertLawnBid(site.id, b => ({ ...b, status: opt.status, selectedSubId: autoId || b.selectedSubId }));
                                              } else if (opt.status === "buyout") {
                                                // Must have owner contract attached to move to Buyout
                                                if (!bid?.ownerContractFile) {
                                                  alert("⚠ Attach the signed owner contract first (see Contracts section below) before moving to Buyout.");
                                                  return;
                                                }
                                                upsertLawnBid(site.id, b => ({ ...b, status: opt.status }));
                                              } else {
                                                upsertLawnBid(site.id, b => ({ ...b, status: opt.status }));
                                              }
                                            }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 8px", background: active ? opt.color + "15" : "transparent", border: "1px solid " + (active ? opt.color + "40" : "#CBD1E8"), borderRadius: 5, cursor: "pointer", fontFamily: "inherit", fontSize: 10, color: active ? opt.color : "#4A5278", textAlign: "left", transition: "all 0.15s" }}>
                                              <div style={{ width: 6, height: 6, borderRadius: "50%", background: active ? opt.color : "#3D4570", flexShrink: 0 }} />
                                              {opt.label}
                                            </button>
                                          );
                                        })}
                                      </div>
                                      {/* Stage hints */}
                                      {getCol(site) === "owner_approval" && !bid?.ownerContractFile && (
                                        <div style={{ marginTop: 6, padding: "5px 8px", background: "#4ADE8015", border: "1px solid #4ADE8040", borderRadius: 5, fontSize: 9, color: "#4ADE80" }}>
                                          📎 Attach signed owner contract below to unlock Buyout
                                        </div>
                                      )}
                                      {getCol(site) === "buyout" && !bid?.subcontractFile && (
                                        <div style={{ marginTop: 6, padding: "5px 8px", background: "#4ADE8015", border: "1px solid #4ADE8040", borderRadius: 5, fontSize: 9, color: "#4ADE80" }}>
                                          📎 Attach signed subcontract below to convert to Active Site
                                        </div>
                                      )}
                                      {getCol(site) === "owner_approval" && (bid?.subcontractorIds||[]).length === 0 && (
                                        <div style={{ marginTop: 6, padding: "5px 8px", background: "#F8717115", border: "1px solid #F8717140", borderRadius: 5, fontSize: 9, color: "#F87171" }}>
                                          ⚠ No contractor assigned — add one below
                                        </div>
                                      )}
                                    </div>

                                    {/* Vendor assignment */}
                                    <div>
                                      <div style={{ fontSize: 9, color: "#4A5278", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Contractors</div>
                                      <select defaultValue="" onChange={e => {
                                        const subId = e.target.value;
                                        if (!subId) return;
                                        const cur = bid?.subcontractorIds || [];
                                        if (!cur.includes(subId)) upsertLawnBid(site.id, b => ({ ...b, subcontractorIds: [...(b.subcontractorIds||[]), subId] }));
                                        e.target.value = "";
                                      }} style={{ width: "100%", background: "#F0F2F8", border: "1px solid #CBD1E8", borderRadius: 5, padding: "5px 8px", fontSize: 11, color: "#1A2240", boxSizing: "border-box", marginBottom: 6 }}>
                                        <option value="">+ Add contractor…</option>
                                        {subcontractors.filter(s => !(bid?.subcontractorIds||[]).includes(s.id)).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                      </select>
                                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                        {(bid?.subcontractorIds || []).map(subId => {
                                          const s = subcontractors.find(x => x.id === subId);
                                          if (!s) return null;
                                          const isSelected = bid?.selectedSubId === subId;
                                          return (
                                            <div key={subId} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 8px", background: isSelected ? "#4ADE8010" : "#F0F2F8", border: "1px solid " + (isSelected ? "#4ADE8040" : "#CBD1E8"), borderRadius: 5 }}>
                                              <input type="radio" name={"sel_" + site.id} checked={isSelected} onChange={() => upsertLawnBid(site.id, b => ({ ...b, selectedSubId: subId }))} style={{ accentColor: "#4ADE80" }} />
                                              <span style={{ fontSize: 10, color: isSelected ? "#4ADE80" : "#252E52", flex: 1 }}>{s.name}</span>
                                              <button onClick={() => upsertLawnBid(site.id, b => ({ ...b, subcontractorIds: (b.subcontractorIds||[]).filter(id => id !== subId), selectedSubId: b.selectedSubId === subId ? "" : b.selectedSubId }))} style={{ background: "none", border: "none", color: "#F87171", cursor: "pointer", fontSize: 12, padding: 0 }}>✕</button>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>

                                    {/* ── SERVICE LINE ITEM PRICING ── */}
                                    <div>
                                      <div style={{ fontSize: 9, color: "#4A5278", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Service Pricing</div>
                                      <div style={{ background: "#F0F2F8", borderRadius: 6, border: "1px solid #CBD1E8", overflow: "hidden" }}>
                                        {/* Column headers */}
                                        <div style={{ display: "grid", gridTemplateColumns: "16px 1fr 70px 70px 60px", gap: 4, padding: "5px 8px", borderBottom: "1px solid #CBD1E8", alignItems: "center" }}>
                                          <div />
                                          <div style={{ fontSize: 9, color: "#3D4570", textTransform: "uppercase", letterSpacing: "0.06em" }}>Service</div>
                                          <div style={{ fontSize: 9, color: "#FBBF2480", textAlign: "right", textTransform: "uppercase", letterSpacing: "0.06em" }}>Sub $</div>
                                          <div style={{ fontSize: 9, color: "#4ADE8080", textAlign: "right", textTransform: "uppercase", letterSpacing: "0.06em" }}>Our $</div>
                                          <div style={{ fontSize: 9, color: "#4A5278", textAlign: "right", textTransform: "uppercase", letterSpacing: "0.06em" }}>Annual</div>
                                        </div>
                                        {LAWN_SERVICES.map(svc => {
                                          const sv = bid?.services?.[svc.id] || { subPrice: 0, ourPrice: 0, included: false };
                                          const annualLine = lawnBidAnnualOur({ services: { [svc.id]: { ...sv, included: true } } });
                                          return (
                                            <div key={svc.id} style={{ display: "grid", gridTemplateColumns: "16px 1fr 70px 70px 60px", gap: 4, padding: "5px 8px", borderBottom: "1px solid #E8EBF4", alignItems: "center", background: sv.included ? "#ECEEF8" : "transparent" }}>
                                              {/* Checkbox */}
                                              <input type="checkbox" checked={!!sv.included} onChange={e => {
                                                upsertLawnBid(site.id, b => ({
                                                  ...b,
                                                  services: { ...b.services, [svc.id]: { ...b.services[svc.id], included: e.target.checked } }
                                                }));
                                              }} style={{ accentColor: "#4ADE80", margin: 0, cursor: "pointer" }} />
                                              {/* Label + freq */}
                                              <div>
                                                <div style={{ fontSize: 10, color: sv.included ? "#1A2240" : "#4A5278", fontWeight: sv.included ? 500 : 400 }}>{svc.label}</div>
                                                <div style={{ fontSize: 8, color: "#3D4570" }}>{svc.freq}</div>
                                              </div>
                                              {/* Sub price input */}
                                              <input
                                                type="number" min="0" step="1"
                                                value={sv.subPrice || ""}
                                                placeholder="0"
                                                onChange={e => {
                                                  const sub = parseFloat(e.target.value) || 0;
                                                  const our = calcOurPrice(sub);
                                                  upsertLawnBid(site.id, b => ({
                                                    ...b,
                                                    services: { ...b.services, [svc.id]: { ...b.services[svc.id], subPrice: sub, ourPrice: our, included: sub > 0 ? true : b.services[svc.id]?.included } }
                                                  }));
                                                }}
                                                style={{ background: "#F0F2F8", border: "1px solid #CBD1E8", borderRadius: 4, padding: "3px 5px", fontSize: 10, color: "#FBBF24", textAlign: "right", width: "100%", fontFamily: "inherit", boxSizing: "border-box" }}
                                              />
                                              {/* Our price input (auto-filled but overridable) */}
                                              <input
                                                type="number" min="0" step="1"
                                                value={sv.ourPrice || ""}
                                                placeholder="0"
                                                onChange={e => {
                                                  const our = parseFloat(e.target.value) || 0;
                                                  upsertLawnBid(site.id, b => ({
                                                    ...b,
                                                    services: { ...b.services, [svc.id]: { ...b.services[svc.id], ourPrice: our } }
                                                  }));
                                                }}
                                                style={{ background: "#F0F2F8", border: "1px solid #CBD1E8", borderRadius: 4, padding: "3px 5px", fontSize: 10, color: "#4ADE80", textAlign: "right", width: "100%", fontFamily: "inherit", boxSizing: "border-box" }}
                                              />
                                              {/* Annual calc */}
                                              <div style={{ fontSize: 10, color: sv.included && sv.ourPrice > 0 ? "#4ADE80" : "#3D4570", textAlign: "right", fontWeight: 600 }}>
                                                {sv.included && sv.ourPrice > 0 ? "$" + Math.round(annualLine).toLocaleString() : "—"}
                                              </div>
                                            </div>
                                          );
                                        })}
                                        {/* Annual total footer */}
                                        <div style={{ display: "grid", gridTemplateColumns: "16px 1fr 70px 70px 60px", gap: 4, padding: "7px 8px", borderTop: "1px solid #CBD1E8", alignItems: "center", background: "#F0F2F8" }}>
                                          <div /><div style={{ fontSize: 9, color: "#4A5278", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Annual Total</div>
                                          <div style={{ fontSize: 10, color: "#FBBF24", textAlign: "right", fontWeight: 600 }}>
                                            ${Math.round(bid ? LAWN_SERVICES.reduce((s, sv2) => { const sv3 = bid.services?.[sv2.id]; if (!sv3?.included || !sv3.subPrice) return s; return s + (sv2.unit==="per_cut" ? sv3.subPrice*28 : sv2.unit==="monthly" ? sv3.subPrice*7 : sv3.subPrice); }, 0) : 0).toLocaleString()}
                                          </div>
                                          <div style={{ fontSize: 11, color: "#4ADE80", textAlign: "right", fontWeight: 700 }}>${Math.round(annualOur).toLocaleString()}</div>
                                          <div />
                                        </div>
                                      </div>
                                    </div>

                                    {/* Contracts — file attachments */}
                                    <div>
                                      <div style={{ fontSize: 9, color: "#4A5278", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Contracts</div>
                                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                        {/* Owner Contract */}
                                        <div>
                                          <div style={{ fontSize: 9, color: "#A78BFA", marginBottom: 4 }}>📋 Owner-Signed Contract</div>
                                          {bid?.ownerContractFile ? (
                                            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 8px", background: "#A78BFA10", border: "1px solid #A78BFA40", borderRadius: 5 }}>
                                              <span style={{ fontSize: 10, color: "#A78BFA", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>✓ {bid.ownerContractFileName || "owner_contract.pdf"}</span>
                                              <a href={bid.ownerContractFile} download={bid.ownerContractFileName || "owner_contract.pdf"} style={{ fontSize: 9, color: "#A78BFA", textDecoration: "none" }}>⬇</a>
                                              <button onClick={() => upsertLawnBid(site.id, b => ({ ...b, ownerContractFile: null, ownerContractFileName: "" }))} style={{ background: "none", border: "none", color: "#F87171", cursor: "pointer", fontSize: 11, padding: 0 }}>✕</button>
                                            </div>
                                          ) : (
                                            <label style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 8px", background: "#F0F2F8", border: "1px dashed #A78BFA50", borderRadius: 5, cursor: "pointer" }}>
                                              <span style={{ fontSize: 10, color: "#4A5278" }}>📎 Attach signed owner contract…</span>
                                              <input type="file" accept=".pdf,.doc,.docx,.jpg,.png" style={{ display: "none" }} onChange={e => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                const reader = new FileReader();
                                                reader.onload = ev => upsertLawnBid(site.id, b => ({ ...b, ownerContractFile: ev.target.result, ownerContractFileName: file.name }));
                                                reader.readAsDataURL(file);
                                              }} />
                                            </label>
                                          )}
                                        </div>
                                        {/* Signed Subcontract */}
                                        <div>
                                          <div style={{ fontSize: 9, color: "#60A5FA", marginBottom: 4 }}>📄 Signed Subcontract</div>
                                          {bid?.subcontractFile ? (
                                            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 8px", background: "#60A5FA10", border: "1px solid #60A5FA40", borderRadius: 5 }}>
                                              <span style={{ fontSize: 10, color: "#60A5FA", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>✓ {bid.subcontractFileName || "subcontract.pdf"}</span>
                                              <a href={bid.subcontractFile} download={bid.subcontractFileName || "subcontract.pdf"} style={{ fontSize: 9, color: "#60A5FA", textDecoration: "none" }}>⬇</a>
                                              <button onClick={() => {
                                                if (window.confirm("Remove the signed subcontract?")) {
                                                  upsertLawnBid(site.id, b => ({ ...b, subcontractFile: null, subcontractFileName: "" }));
                                                }
                                              }} style={{ background: "none", border: "none", color: "#F87171", cursor: "pointer", fontSize: 11, padding: 0 }}>✕</button>
                                            </div>
                                          ) : (
                                            <label style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 8px", background: "#F0F2F8", border: "1px dashed #60A5FA50", borderRadius: 5, cursor: "pointer" }}>
                                              <span style={{ fontSize: 10, color: "#4A5278" }}>📎 Attach signed subcontract…</span>
                                              <input type="file" accept=".pdf,.doc,.docx,.jpg,.png" style={{ display: "none" }} onChange={e => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                const reader = new FileReader();
                                                reader.onload = ev => {
                                                  upsertLawnBid(site.id, b => ({ ...b, subcontractFile: ev.target.result, subcontractFileName: file.name }));
                                                };
                                                reader.readAsDataURL(file);
                                              }} />
                                            </label>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Notes */}
                                    <div>
                                      <div style={{ fontSize: 9, color: "#4A5278", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Notes</div>
                                      <input value={bid?.notes || ""} onChange={e => upsertLawnBid(site.id, b => ({ ...b, notes: e.target.value }))} placeholder="Notes…" style={{ width: "100%", background: "#F0F2F8", border: "1px solid #CBD1E8", borderRadius: 5, padding: "5px 8px", fontSize: 11, color: "#1A2240", boxSizing: "border-box" }} />
                                    </div>

                                    {/* Sitefotos link */}
                                    <div>
                                      <div style={{ fontSize: 9, color: "#4A5278", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
                                        📸 Sitefotos Link
                                        <span style={{ marginLeft: 6, fontSize: 8, color: "#3D4570", textTransform: "none", fontWeight: 400 }}>paste your Sitefotos property URL</span>
                                      </div>
                                      <div style={{ display: "flex", gap: 5 }}>
                                        <input value={bid?.sitefotosUrl || ""} onChange={e => upsertLawnBid(site.id, b => ({ ...b, sitefotosUrl: e.target.value }))} placeholder="https://app.sitefotos.com/property/…" style={{ flex: 1, background: "#F0F2F8", border: "1px solid #CBD1E8", borderRadius: 5, padding: "5px 8px", fontSize: 10, color: "#60A5FA", boxSizing: "border-box" }} />
                                        {bid?.sitefotosUrl && (
                                          <a href={bid.sitefotosUrl} target="_blank" rel="noopener noreferrer" style={{ padding: "5px 10px", background: "#60A5FA15", border: "1px solid #60A5FA40", borderRadius: 5, color: "#60A5FA", fontSize: 11, textDecoration: "none", display: "flex", alignItems: "center" }}>Open →</a>
                                        )}
                                      </div>
                                    </div>

                                    {/* Archive / Not Bidding */}
                                    <div style={{ borderTop: "1px solid #CBD1E8", paddingTop: 10 }}>
                                      {bid?.status === "not_bidding" ? (
                                        <button onClick={() => upsertLawnBid(site.id, b => ({ ...b, status: "bidding" }))} style={{ width: "100%", padding: "7px 0", background: "#4ADE8010", border: "1px solid #4ADE8030", borderRadius: 7, color: "#4ADE80", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                                          ↩ Restore to Bidding
                                        </button>
                                      ) : (
                                        <button onClick={() => { if (window.confirm("Archive this site? It will be hidden from the kanban but can be restored.")) upsertLawnBid(site.id, b => ({ ...b, status: "not_bidding" })); }} style={{ width: "100%", padding: "7px 0", background: "transparent", border: "1px solid #4A527840", borderRadius: 7, color: "#4A5278", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>
                                          📦 Archive (not bidding this season)
                                        </button>
                                      )}
                                    </div>

                                    {/* Convert to Active Site — buyout stage + both contracts attached */}
                                    {bid?.status === "buyout" && bid?.ownerContractFile && bid?.subcontractFile && (
                                      <button onClick={() => {
                                        setEditLawnBidId(null);
                                        setTimeout(() => { setActiveNav("active-sites"); }, 150);
                                      }} style={{ width: "100%", padding: "10px 0", background: "linear-gradient(135deg, #4ADE8025, #4ADE8015)", border: "2px solid #4ADE8060", borderRadius: 8, color: "#4ADE80", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.04em" }}>
                                        ✅ Convert to Active Site →
                                      </button>
                                    )}
                                    {bid?.status === "buyout" && !(bid?.ownerContractFile && bid?.subcontractFile) && (
                                      <div style={{ padding: "8px 10px", background: "#FBBF2410", border: "1px solid #FBBF2430", borderRadius: 7, fontSize: 9, color: "#FBBF24", textAlign: "center" }}>
                                        ⚠ Attach {!bid?.ownerContractFile && !bid?.subcontractFile ? "both contracts" : !bid?.ownerContractFile ? "owner contract" : "signed subcontract"} above to convert to Active Site
                                      </div>
                                    )}

                                    {/* Actions */}
                                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                      <button className="btn-primary" style={{ flex: 1, minWidth: 80, fontSize: 11, padding: "7px 0", background: "#60A5FA15", color: "#60A5FA", border: "1px solid #60A5FA40", borderRadius: 6, cursor: "pointer", fontWeight: 600 }} onClick={() => { setLawnBidDocSubId(null); setLawnBidDocSiteId(site.id); }}>📄 Bid Doc</button>
                                      <button className="btn-ghost" style={{ flex: 1, minWidth: 80, fontSize: 10, padding: "5px 0", color: "#FCD34D", borderColor: "#FCD34D30" }} onClick={() => setOwnerProposalSiteId(site.id)}>📋 Owner Proposal</button>
                                      <button className="btn-ghost" style={{ flex: 1, minWidth: 80, fontSize: 10, padding: "5px 0", color: "#A78BFA", borderColor: "#A78BFA30" }} onClick={() => { setEditLawnBidId(null); setSelectedSite(site); }}>🔍 Full Details</button>
                                      {!bid && <button className="btn-ghost" style={{ flex: 1, minWidth: 80, fontSize: 10, padding: "5px 0", color: "#4ADE80", borderColor: "#4ADE8030" }} onClick={() => upsertLawnBid(site.id, b => b)}>+ Start Bid</button>}
                                      <button className="btn-ghost" style={{ flex: 1, minWidth: 80, fontSize: 10, padding: "5px 0", color: "#FBBF24", borderColor: "#FBBF2430" }} onClick={() => { setAcreageInput(bid?.acreage ? String(bid.acreage) : ""); setAcreageModalSiteId(site.id); }}>📐 Calc Mowing</button>
                                      {bid && (bid.status === "buyout" || bid.status === "owner_approved") && bid.selectedSubId && (
                                        <button className="btn-ghost" style={{ flex: 1, minWidth: 80, fontSize: 10, padding: "5px 0", color: "#4ADE80", borderColor: "#4ADE8030", fontWeight: 700 }} onClick={() => setLawnSubcontractSiteId(site.id)}>📋 Subcontract</button>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* ── PRICING SHEET (lawn) ── */}
          {activeNav === "pricing" && activeBU === "lawn" && (() => {
            const allSites = lawnSites;
            const searchQ = pricingSearch.toLowerCase();
            const showSub = pricingShowSub;

            const rows = allSites
              .map(site => {
                const bid = getLawnBid(site.id);
                const co = companies.find(c => c.id === site.companyId);
                const annual = lawnBidAnnualOur(bid);
                const annualSub = bid ? LAWN_SERVICES.reduce((sum, s) => {
                  const sv = bid.services?.[s.id];
                  if (!sv || !sv.included || !sv.subPrice) return sum;
                  if (s.unit === "per_cut") return sum + sv.subPrice * 28;
                  if (s.unit === "monthly") return sum + sv.subPrice * 7;
                  return sum + sv.subPrice;
                }, 0) : 0;
                const statusCol = !bid ? "untouched" : bid.status === "not_bidding" ? "not_bidding" : bid.status === "bidding" ? "bidding" : bid.status === "owner_approved" ? "owner_approval" : (bid.status === "buyout" || bid.status === "contracted") ? "buyout" : "untouched";
                return { site, co, bid, annual, annualSub, statusCol };
              })
              .filter(({ site, co, annual, bid }) => {
                if (pricingFilter === "priced" && annual === 0) return false;
                if (pricingFilter === "unpriced" && annual > 0) return false;
                if (searchQ && !(co?.name||"").toLowerCase().includes(searchQ) && !(site.address||"").toLowerCase().includes(searchQ) && !(site.storeNumber||"").toLowerCase().includes(searchQ)) return false;
                return true;
              })
              .sort((a, b) => {
                if (pricingSort === "annual") return b.annual - a.annual;
                if (pricingSort === "stage") return a.statusCol.localeCompare(b.statusCol);
                return ((a.co?.name||"") + (a.site.storeNumber||"")).localeCompare((b.co?.name||"") + (b.site.storeNumber||""));
              });

            const grandTotal = rows.reduce((s, r) => s + r.annual, 0);
            const grandSub = rows.reduce((s, r) => s + r.annualSub, 0);
            const pricedCount = rows.filter(r => r.annual > 0).length;

            const colColors = { untouched: "#4A5278", bidding: "#FBBF24", owner_approval: "#60A5FA", buyout: "#4ADE80", not_bidding: "#F87171" };
            const colLabels = { untouched: "Not Touched", bidding: "Bidding", owner_approval: "Owner Appr.", buyout: "Buyout", not_bidding: "Not Bidding" };

            const exportCSV = () => {
              const svcCols = LAWN_SERVICES.map(s => s.label);
              const header = ["Company", "Store #", "Address", "Stage", ...svcCols.map(l => l + " (Sub)"), ...svcCols.map(l => l + " (Ours)"), "Annual Sub", "Annual Ours"];
              const dataRows = rows.map(({ site, co, bid, annual, annualSub, statusCol }) => {
                const subVals = LAWN_SERVICES.map(s => {
                  const sv = bid?.services?.[s.id];
                  if (!sv || !sv.included) return "";
                  return sv.subPrice || 0;
                });
                const ourVals = LAWN_SERVICES.map(s => {
                  const sv = bid?.services?.[s.id];
                  if (!sv || !sv.included) return "";
                  return sv.ourPrice || 0;
                });
                return [co?.name||"", site.storeNumber||"", site.address||"", colLabels[statusCol]||"", ...subVals, ...ourVals, Math.round(annualSub), Math.round(annual)];
              });
              const csv = [header, ...dataRows].map(r => r.map(v => `"${v}"`).join(",")).join("\n");
              const blob = new Blob([csv], { type: "text/csv" });
              const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `lawn_pricing_${lawnBidSeason}.csv`; a.click();
            };

            return (
              <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: "#1A2240", letterSpacing: "-0.01em", textTransform: "uppercase" }}>Pricing Sheet — {lawnBidSeason}</div>
                    <div style={{ fontSize: 11, color: "#4A5278", marginTop: 3, letterSpacing: "0.06em" }}>{pricedCount} of {rows.length} sites priced · <span style={{ color: "#4ADE80" }}>Our Total: ${Math.round(grandTotal).toLocaleString()}/yr</span> · <span style={{ color: "#FBBF24" }}>Sub Total: ${Math.round(grandSub).toLocaleString()}/yr</span></div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <input className="fi" style={{ width: 180 }} placeholder="Search…" value={pricingSearch} onChange={e => setPricingSearch(e.target.value)} />
                    <select value={pricingFilter} onChange={e => setPricingFilter(e.target.value)} style={{ background: "#F5F7FC", border: "1px solid #CBD1E8", color: "#252E52", borderRadius: 6, padding: "6px 10px", fontSize: 12, fontFamily: "inherit" }}>
                      <option value="all">All Sites</option>
                      <option value="priced">Priced Only</option>
                      <option value="unpriced">Unpriced Only</option>
                    </select>
                    <select value={pricingSort} onChange={e => setPricingSort(e.target.value)} style={{ background: "#F5F7FC", border: "1px solid #CBD1E8", color: "#252E52", borderRadius: 6, padding: "6px 10px", fontSize: 12, fontFamily: "inherit" }}>
                      <option value="company">Sort: Company</option>
                      <option value="annual">Sort: Annual $</option>
                      <option value="stage">Sort: Stage</option>
                    </select>
                    <button className="btn-ghost" style={{ fontSize: 11, color: showSub ? "#FBBF24" : "#4ADE80", borderColor: showSub ? "#FBBF2430" : "#4ADE8030" }} onClick={() => setPricingShowSub(v => !v)}>
                      {showSub ? "Showing Sub $" : "Showing Our $"}
                    </button>
                    <button className="btn-ghost" style={{ fontSize: 11 }} onClick={exportCSV}>⬇ Export CSV</button>
                  </div>
                </div>

                {/* Table */}
                <div style={{ overflowX: "auto", borderRadius: 10, border: "1px solid #CBD1E8" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, tableLayout: "auto" }}>
                    <thead>
                      <tr style={{ background: "#F0F2F8", position: "sticky", top: 0, zIndex: 2 }}>
                        <th style={{ padding: "10px 12px", textAlign: "left", color: "#4A5278", fontWeight: 600, whiteSpace: "nowrap", borderBottom: "1px solid #CBD1E8", fontSize: 10 }}>Company / Site</th>
                        <th style={{ padding: "10px 8px", textAlign: "left", color: "#4A5278", fontWeight: 600, whiteSpace: "nowrap", borderBottom: "1px solid #CBD1E8", fontSize: 10 }}>Stage</th>
                        {LAWN_SERVICES.map(s => (
                          <th key={s.id} style={{ padding: "10px 8px", textAlign: "right", color: "#4A5278", fontWeight: 600, whiteSpace: "nowrap", borderBottom: "1px solid #CBD1E8", fontSize: 10, minWidth: 80 }}>
                            {s.label}<br /><span style={{ color: "#3D4570", fontSize: 9, fontWeight: 400 }}>{s.freq}</span>
                          </th>
                        ))}
                        <th style={{ padding: "10px 12px", textAlign: "right", color: "#4ADE80", fontWeight: 700, whiteSpace: "nowrap", borderBottom: "1px solid #CBD1E8", fontSize: 10, borderLeft: "1px solid #CBD1E8" }}>Annual</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map(({ site, co, bid, annual, annualSub, statusCol }) => {
                        const hasData = annual > 0 || annualSub > 0;
                        return (
                          <tr key={site.id} style={{ borderBottom: "1px solid #CBD1E8", background: "transparent" }}
                            onMouseEnter={e => e.currentTarget.style.background = "#ECEEF8"}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                          >
                            {/* Site info */}
                            <td style={{ padding: "9px 12px", whiteSpace: "nowrap" }}>
                              <div style={{ fontWeight: 600, color: "#1A2240", fontSize: 11 }}>{co?.name || "—"} <span style={{ color: "#4A5278", fontWeight: 400 }}>#{site.storeNumber || "—"}</span></div>
                              <div style={{ color: "#4A5278", fontSize: 10, marginTop: 1 }}>{(site.address || "").split(",").slice(-2).join(",").trim()}</div>
                            </td>
                            {/* Stage */}
                            <td style={{ padding: "9px 8px", whiteSpace: "nowrap" }}>
                              <span style={{ fontSize: 10, color: colColors[statusCol], background: colColors[statusCol] + "15", padding: "2px 7px", borderRadius: 3, border: "1px solid " + colColors[statusCol] + "30" }}>{colLabels[statusCol]}</span>
                            </td>
                            {/* Service columns */}
                            {LAWN_SERVICES.map(svc => {
                              const sv = bid?.services?.[svc.id];
                              const included = sv?.included;
                              const price = showSub ? (sv?.subPrice || 0) : (sv?.ourPrice || 0);
                              return (
                                <td key={svc.id} style={{ padding: "9px 8px", textAlign: "right", color: included && price > 0 ? (showSub ? "#FBBF24" : "#4ADE80") : "#3D4570", fontSize: 11 }}>
                                  {included && price > 0 ? "$" + price.toLocaleString() : "—"}
                                </td>
                              );
                            })}
                            {/* Annual total */}
                            <td style={{ padding: "9px 12px", textAlign: "right", borderLeft: "1px solid #CBD1E8", whiteSpace: "nowrap" }}>
                              {hasData ? (
                                <div>
                                  <div style={{ fontWeight: 700, color: "#4ADE80", fontSize: 12 }}>${Math.round(annual).toLocaleString()}</div>
                                  <div style={{ fontSize: 9, color: "#FBBF24" }}>sub ${Math.round(annualSub).toLocaleString()}</div>
                                </div>
                              ) : (
                                <span style={{ color: "#3D4570", fontSize: 10 }}>No pricing</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    {/* Footer totals */}
                    <tfoot>
                      <tr style={{ background: "#F0F2F8", borderTop: "2px solid #CBD1E8" }}>
                        <td colSpan={2} style={{ padding: "10px 12px", color: "#4A5278", fontSize: 11, fontWeight: 600 }}>TOTALS ({rows.length} sites)</td>
                        {LAWN_SERVICES.map(svc => {
                          const total = rows.reduce((sum, { bid }) => {
                            const sv = bid?.services?.[svc.id];
                            if (!sv || !sv.included) return sum;
                            const price = showSub ? (sv.subPrice || 0) : (sv.ourPrice || 0);
                            return sum + price;
                          }, 0);
                          return (
                            <td key={svc.id} style={{ padding: "10px 8px", textAlign: "right", color: total > 0 ? (showSub ? "#FBBF2490" : "#4ADE8090") : "#3D4570", fontSize: 11, fontWeight: 600 }}>
                              {total > 0 ? "$" + Math.round(total).toLocaleString() : "—"}
                            </td>
                          );
                        })}
                        <td style={{ padding: "10px 12px", textAlign: "right", borderLeft: "1px solid #CBD1E8" }}>
                          <div style={{ fontWeight: 700, color: "#4ADE80", fontSize: 13 }}>${Math.round(grandTotal).toLocaleString()}</div>
                          <div style={{ fontSize: 9, color: "#FBBF24" }}>sub ${Math.round(grandSub).toLocaleString()}</div>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            );
          })()}

          {/* ── ACTIVE SITES (lawn / snow) ── */}
          {activeNav === "active-sites" && LAWN_SNOW_SITES_BUS.includes(activeBU) && (() => {
            const currentSites = activeBU === "lawn" ? lawnSites : snowSites;
            const activeSites = currentSites.filter(site => {
              const b = getLawnBid(site.id);
              return b && (b.status === "buyout" || b.status === "contracted") && b.ownerContractFile && b.subcontractFile;
            });
            const pendingSites = currentSites.filter(site => {
              const b = getLawnBid(site.id);
              return b && (b.status === "buyout" || b.status === "contracted") && !(b.ownerContractFile && b.subcontractFile);
            });
            const totalBook = activeSites.reduce((sum, s) => sum + lawnBidAnnualOur(getLawnBid(s.id)), 0);

            return (
              <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: "#1A2240", letterSpacing: "-0.01em", textTransform: "uppercase" }}>Active Sites</div>
                    <div style={{ fontSize: 11, color: "#4A5278", marginTop: 3, letterSpacing: "0.06em" }}>{activeSites.length} ACTIVE · ${Math.round(totalBook).toLocaleString()} CONTRACTED</div>
                  </div>
                </div>

                {/* Stats */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                  {[
                    { label: "Active Sites",    value: activeSites.length,  color: "#4ADE80" },
                    { label: "Awaiting Docs",   value: pendingSites.length,  color: "#FCD34D" },
                    { label: "Annual Book",     value: "$" + Math.round(totalBook).toLocaleString(), color: "#C084FC" },
                  ].map(s => (
                    <div key={s.label} className="stat-card" style={{ position: "relative", overflow: "hidden", padding: "14px 18px" }}>
                      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: s.color }} />
                      <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#4A5278", marginBottom: 6 }}>{s.label}</div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
                    </div>
                  ))}
                </div>

                {/* Active sites list */}
                {activeSites.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#4ADE80", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>✅ Contracted & Docs Uploaded</div>
                    {activeSites.map(site => {
                      const bid = getLawnBid(site.id);
                      const co = companies.find(c => c.id === site.companyId);
                      const sub = bid?.selectedSubId ? subcontractors.find(s => s.id === bid.selectedSubId) : null;
                      const allSubs = (bid?.subcontractorIds||[]).map(id => subcontractors.find(s => s.id === id)).filter(Boolean);
                      const isExpanded = expandedActiveSiteId === site.id;
                      const annualOur = lawnBidAnnualOur(bid);
                      const annualSub = bid ? LAWN_SERVICES.reduce((sum, s) => {
                        const sv = bid.services?.[s.id];
                        if (!sv?.included || !sv.subPrice) return sum;
                        if (s.unit === "per_cut") return sum + sv.subPrice * 28;
                        if (s.unit === "monthly") return sum + sv.subPrice * 7;
                        return sum + sv.subPrice;
                      }, 0) : 0;
                      const gp = annualOur - annualSub;
                      const gpPct = annualOur > 0 ? Math.round(gp / annualOur * 100) : 0;
                      const includedServices = LAWN_SERVICES.filter(s => bid?.services?.[s.id]?.included);
                      return (
                        <div key={site.id} style={{ background: "#1A2240", border: "1px solid " + (isExpanded ? "#4ADE8060" : "#4ADE8030"), borderRadius: 10, overflow: "hidden", transition: "border-color 0.2s" }}>
                          {/* Card header row — always visible, click to expand */}
                          <div onClick={() => setExpandedActiveSiteId(isExpanded ? null : site.id)} style={{ padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, cursor: "pointer" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                              <div style={{ width: 36, height: 36, borderRadius: 8, background: "#4ADE8015", border: "1px solid #4ADE8030", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>✅</div>
                              <div>
                                <div style={{ fontSize: 14, fontWeight: 600, color: "#1A2240" }}>{co?.name || "Unknown"}{site.storeNumber ? ` — #${site.storeNumber}` : ""}</div>
                                <div style={{ fontSize: 11, color: "#4A5278" }}>{site.address}</div>
                                {sub && <div style={{ fontSize: 10, color: "#4ADE80", marginTop: 2 }}>🔧 {sub.name}</div>}
                              </div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
                              <div style={{ textAlign: "right" }}>
                                <div style={{ fontSize: 15, fontWeight: 700, color: "#4ADE80" }}>${Math.round(annualOur).toLocaleString()}<span style={{ fontSize: 10, color: "#4A5278", fontWeight: 400 }}>/yr</span></div>
                                <div style={{ fontSize: 10, color: gpPct >= 30 ? "#4ADE80" : "#FBBF24" }}>{gpPct}% GP</div>
                              </div>
                              <div style={{ fontSize: 16, color: "#4A5278", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>▼</div>
                            </div>
                          </div>

                          {/* Expanded detail panel */}
                          {isExpanded && (
                            <div style={{ borderTop: "1px solid #CBD1E8", padding: "18px 20px", display: "flex", flexDirection: "column", gap: 16 }}>

                              {/* Site info + financials */}
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                <div style={{ background: "#F0F2F8", borderRadius: 8, padding: "12px 14px", border: "1px solid #CBD1E8" }}>
                                  <div style={{ fontSize: 9, color: "#4A5278", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Site Info</div>
                                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                                    <div style={{ fontSize: 11, color: "#252E52" }}><span style={{ color: "#4A5278" }}>Company: </span>{co?.name || "—"}</div>
                                    {site.storeNumber && <div style={{ fontSize: 11, color: "#252E52" }}><span style={{ color: "#4A5278" }}>Store #: </span>{site.storeNumber}</div>}
                                    <div style={{ fontSize: 11, color: "#252E52" }}><span style={{ color: "#4A5278" }}>Address: </span>{site.address}</div>
                                    {site.phone && <div style={{ fontSize: 11, color: "#252E52" }}><span style={{ color: "#4A5278" }}>Phone: </span>{site.phone}</div>}
                                    {site.accessCode && <div style={{ fontSize: 11, color: "#252E52" }}><span style={{ color: "#4A5278" }}>Access: </span>{site.accessCode}</div>}
                                    {site.notes && <div style={{ fontSize: 11, color: "#252E52" }}><span style={{ color: "#4A5278" }}>Notes: </span>{site.notes}</div>}
                                    <div style={{ fontSize: 11, color: "#252E52" }}><span style={{ color: "#4A5278" }}>Season: </span>{bid?.season || lawnBidSeason}</div>
                                    {bid?.sitefotosUrl && <a href={bid.sitefotosUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: "#60A5FA", display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>📸 Sitefotos →</a>}
                                  </div>
                                </div>
                                <div style={{ background: "#F0F2F8", borderRadius: 8, padding: "12px 14px", border: "1px solid #CBD1E8" }}>
                                  <div style={{ fontSize: 9, color: "#4A5278", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Financials</div>
                                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                      <span style={{ fontSize: 11, color: "#4A5278" }}>Sub Cost / yr</span>
                                      <span style={{ fontSize: 12, color: "#FBBF24", fontWeight: 600 }}>${Math.round(annualSub).toLocaleString()}</span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                      <span style={{ fontSize: 11, color: "#4A5278" }}>Our Price / yr</span>
                                      <span style={{ fontSize: 12, color: "#4ADE80", fontWeight: 700 }}>${Math.round(annualOur).toLocaleString()}</span>
                                    </div>
                                    <div style={{ borderTop: "1px solid #CBD1E8", paddingTop: 6, display: "flex", justifyContent: "space-between" }}>
                                      <span style={{ fontSize: 11, color: "#4A5278" }}>Gross Profit</span>
                                      <span style={{ fontSize: 12, color: gpPct >= 30 ? "#4ADE80" : "#FBBF24", fontWeight: 700 }}>${Math.round(gp).toLocaleString()} ({gpPct}%)</span>
                                    </div>
                                    {bid?.acreage && <div style={{ display: "flex", justifyContent: "space-between" }}>
                                      <span style={{ fontSize: 11, color: "#4A5278" }}>Acreage</span>
                                      <span style={{ fontSize: 11, color: "#252E52" }}>{bid.acreage} acres</span>
                                    </div>}
                                  </div>
                                </div>
                              </div>

                              {/* Contractors */}
                              <div style={{ background: "#F0F2F8", borderRadius: 8, padding: "12px 14px", border: "1px solid #CBD1E8" }}>
                                <div style={{ fontSize: 9, color: "#4A5278", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Contractors</div>
                                {allSubs.length === 0 ? <div style={{ fontSize: 11, color: "#4A5278" }}>None assigned</div> : (
                                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                                    {allSubs.map(s => {
                                      const isPrimary = bid?.selectedSubId === s.id;
                                      return (
                                        <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: isPrimary ? "#4ADE80" : "#4A5278", flexShrink: 0 }} />
                                          <span style={{ fontSize: 11, color: isPrimary ? "#4ADE80" : "#252E52", fontWeight: isPrimary ? 600 : 400 }}>{s.name}{isPrimary ? " ✓ Primary" : ""}</span>
                                          {s.phone && <span style={{ fontSize: 10, color: "#4A5278" }}>· {s.phone}</span>}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>

                              {/* Services table */}
                              {includedServices.length > 0 && (
                                <div style={{ background: "#F0F2F8", borderRadius: 8, border: "1px solid #CBD1E8", overflow: "hidden" }}>
                                  <div style={{ fontSize: 9, color: "#4A5278", textTransform: "uppercase", letterSpacing: "0.08em", padding: "10px 14px 6px" }}>Services</div>
                                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                    <thead>
                                      <tr style={{ borderBottom: "1px solid #CBD1E8" }}>
                                        <th style={{ fontSize: 9, color: "#4A5278", textAlign: "left", padding: "5px 14px", fontWeight: 400, textTransform: "uppercase", letterSpacing: "0.06em" }}>Service</th>
                                        <th style={{ fontSize: 9, color: "#FBBF2480", textAlign: "right", padding: "5px 8px", fontWeight: 400 }}>Sub</th>
                                        <th style={{ fontSize: 9, color: "#4ADE8080", textAlign: "right", padding: "5px 8px", fontWeight: 400 }}>Ours</th>
                                        <th style={{ fontSize: 9, color: "#4A5278", textAlign: "right", padding: "5px 14px", fontWeight: 400 }}>Annual</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {includedServices.map(s => {
                                        const sv = bid.services[s.id];
                                        const freq = s.unit === "per_cut" ? 28 : s.unit === "monthly" ? 7 : 1;
                                        return (
                                          <tr key={s.id} style={{ borderBottom: "1px solid #E8EBF4" }}>
                                            <td style={{ fontSize: 11, color: "#252E52", padding: "6px 14px" }}>{s.label} <span style={{ fontSize: 9, color: "#4A5278" }}>×{freq}</span></td>
                                            <td style={{ fontSize: 11, color: "#FBBF24", textAlign: "right", padding: "6px 8px" }}>${sv.subPrice?.toLocaleString() || "—"}</td>
                                            <td style={{ fontSize: 11, color: "#4ADE80", textAlign: "right", padding: "6px 8px" }}>${sv.ourPrice?.toLocaleString() || "—"}</td>
                                            <td style={{ fontSize: 11, color: "#4ADE80", textAlign: "right", padding: "6px 14px", fontWeight: 600 }}>${Math.round((sv.ourPrice||0) * freq).toLocaleString()}</td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              )}

                              {/* Contracts + notes */}
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                                <div style={{ display: "flex", gap: 6 }}>
                                  {bid.subcontractFile && <a href={bid.subcontractFile} download={bid.subcontractFileName || "subcontract.pdf"} style={{ flex: 1, fontSize: 11, color: "#60A5FA", background: "#60A5FA10", border: "1px solid #60A5FA30", borderRadius: 6, padding: "8px 10px", textDecoration: "none", textAlign: "center" }}>📄 Download Subcontract</a>}
                                  {bid.ownerContractFile && <a href={bid.ownerContractFile} download={bid.ownerContractFileName || "owner_contract.pdf"} style={{ flex: 1, fontSize: 11, color: "#A78BFA", background: "#A78BFA10", border: "1px solid #A78BFA30", borderRadius: 6, padding: "8px 10px", textDecoration: "none", textAlign: "center" }}>📋 Download Owner Contract</a>}
                                </div>
                                <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                                  <button onClick={() => { setActiveNav("bids"); setEditLawnBidId(site.id); setExpandedActiveSiteId(null); }} style={{ fontSize: 11, color: "#60A5FA", background: "#60A5FA10", border: "1px solid #60A5FA30", borderRadius: 6, padding: "8px 12px", cursor: "pointer", fontFamily: "inherit" }}>✏️ Edit Bid</button>
                                  <button onClick={() => { if (window.confirm("Move this site back to Bidding? This will remove it from Active Sites.")) { upsertLawnBid(site.id, b => ({ ...b, status: "bidding" })); setExpandedActiveSiteId(null); } }} style={{ fontSize: 11, color: "#F87171", background: "#F8717110", border: "1px solid #F8717130", borderRadius: 6, padding: "8px 12px", cursor: "pointer", fontFamily: "inherit" }}>↩ Move to Bidding</button>
                                </div>
                              </div>

                              {bid?.notes && (
                                <div style={{ background: "#F0F2F8", borderRadius: 8, padding: "10px 14px", border: "1px solid #CBD1E8", fontSize: 11, color: "#252E52" }}>
                                  <span style={{ fontSize: 9, color: "#4A5278", textTransform: "uppercase", letterSpacing: "0.08em", marginRight: 8 }}>Notes:</span>{bid.notes}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "48px", color: "#3D4570", fontSize: 12, background: "#ECEEF8", borderRadius: 10, border: "1px solid #CBD1E8" }}>
                    <div style={{ fontSize: 28, marginBottom: 12 }}>✅</div>
                    No active sites yet. Sites move here automatically once they reach Buyout with both contracts attached.
                  </div>
                )}

                {/* Pending docs */}
                {pendingSites.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#FCD34D", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>⏳ Owner Accepted — Awaiting Documents</div>
                    {pendingSites.map(site => {
                      const bid = getLawnBid(site.id);
                      const co = companies.find(c => c.id === site.companyId);
                      return (
                        <div key={site.id} style={{ background: "#1A2240", border: "1px solid #FCD34D30", borderRadius: 10, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#1A2240" }}>{co?.name || "Unknown"} — #{site.storeNumber || "—"}</div>
                            <div style={{ fontSize: 11, color: "#4A5278" }}>{site.address}</div>
                          </div>
                          <div style={{ display: "flex", gap: 6, fontSize: 10, alignItems: "center" }}>
                            <span style={{ color: bid?.subcontractFile ? "#4ADE80" : "#F87171" }}>{bid?.subcontractFile ? "✓" : "✗"} Subcontract</span>
                            <span style={{ color: "#4A5278" }}>·</span>
                            <span style={{ color: bid?.ownerContractFile ? "#4ADE80" : "#F87171" }}>{bid?.ownerContractFile ? "✓" : "✗"} Owner Contract</span>
                            <button onClick={() => { setActiveNav("bids"); setEditLawnBidId(site.id); }} style={{ marginLeft: 8, fontSize: 10, color: "#60A5FA", background: "#60A5FA10", border: "1px solid #60A5FA30", borderRadius: 4, padding: "3px 8px", cursor: "pointer", fontFamily: "inherit" }}>Attach Docs →</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          {/* ── COMING SOON (other nav items) ── */}
          {!["dashboard", "customers", "jobs", "pipeline", "budgeting", "finance", "sites", "projects", "team", "subcontractors", "bids", "active-sites", "pricing"].includes(activeNav) && (
            <div className="fade-in">
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#1A2240", textTransform: "uppercase" }}>{navItems.find(n => n.id === activeNav)?.label}</div>
                <div style={{ fontSize: 11, color: "#4A5278", marginTop: 4 }}>{BUSINESS_UNITS.find(b => b.id === activeBU)?.label.toUpperCase()}</div>
              </div>
              <div className="coming-soon">
                <div style={{ width: 48, height: 48, borderRadius: 12, background: buColor.light, border: "1px solid " + buColor.accent + "33", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{navItems.find(n => n.id === activeNav)?.icon}</div>
                <div style={{ fontSize: 14, color: "#4A5278", fontWeight: 500 }}>{navItems.find(n => n.id === activeNav)?.label} — Coming Soon</div>
              </div>
            </div>
          )}

        </div>{/* end content */}
      </div>{/* end main */}

      {/* ── SITE SIDE PANEL ── */}
      {selectedSite && !selectedCompany && (
        <div className="side-panel slide-in">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#1A2240", textTransform: "uppercase", letterSpacing: "0.06em" }}>Site Detail</div>
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
                    <div style={{ fontSize: 16, color: "#1A2240", fontWeight: 600 }}>Store #{selectedSite.storeNumber || "—"}</div>
                    {co && <div style={{ fontSize: 12, color: "#3B6FE8", cursor: "pointer" }} onClick={() => { setSelectedSite(null); setSelectedCompany(co); }}>🏢 {co.name}</div>}
                  </div>
                </div>

                <div style={{ background: "#F0F2F8", borderRadius: 8, padding: "14px", border: "1px solid #CBD1E8", display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    { label: "Address",     value: selectedSite.address     || "—" },
                    { label: "Phone",       value: selectedSite.phone        || "—" },
                    { label: "Access Code", value: selectedSite.accessCode   || "—" },
                  ].map(r => (
                    <div key={r.label} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                      <span style={{ fontSize: 11, color: "#4A5278", flexShrink: 0 }}>{r.label}</span>
                      <span style={{ fontSize: 11, color: r.label === "Access Code" ? "#FCD34D" : "#252E52", textAlign: "right", fontWeight: r.label === "Access Code" ? 600 : 400 }}>{r.value}</span>
                    </div>
                  ))}
                </div>

                {siteContacts.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#4A5278", marginBottom: 10, fontWeight: 600 }}>Contacts</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {siteContacts.map(p => (
                        <div key={p.id} className="contact-chip">
                          <div>
                            <div style={{ fontSize: 12, color: "#1A2240", fontWeight: 500 }}>{p.firstName} {p.lastName}</div>
                            <div style={{ fontSize: 10, color: "#4A5278" }}>{p.title} · {p.email}</div>
                            {p.phone && <div style={{ fontSize: 10, color: "#4A5278" }}>{p.phone}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedSite.notes && <div style={{ fontSize: 12, color: "#6B7694", lineHeight: 1.6, background: "#F0F2F8", padding: "10px 12px", borderRadius: 6, border: "1px solid #CBD1E8" }}>{selectedSite.notes}</div>}

                {/* Lawn bid pricing section — shown when this site has a lawn bid */}
                {(() => {
                  const bid = getLawnBid ? getLawnBid(selectedSite.id) : null;
                  if (!bid) return null;
                  const assignedSubs = (bid.subcontractorIds || []).map(id => subcontractors.find(s => s.id === id)).filter(Boolean);
                  const selectedSub = bid.selectedSubId ? subcontractors.find(s => s.id === bid.selectedSubId) : null;
                  const annualOur = lawnBidAnnualOur ? lawnBidAnnualOur(bid) : 0;
                  const COLS_LABELS = { untouched: "Not Touched", bidding: "Bidding", owner_approval: "Owner Approval", not_bidding: "Not Bidding" };
                  const statusCol = bid.status === "bidding" ? "bidding" : bid.status === "owner_approved" ? "owner_approval" : bid.status === "buyout" ? "buyout" : bid.status === "contracted" ? "buyout" : bid.status === "not_bidding" ? "not_bidding" : "untouched";
                  const colColors = { untouched: "#4A5278", bidding: "#FBBF24", owner_approval: "#60A5FA", buyout: "#4ADE80", not_bidding: "#F87171" };
                  return (
                    <div>
                      <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#4A5278", marginBottom: 10, fontWeight: 600 }}>Lawn Bid — {lawnBidSeason}</div>
                      <div style={{ background: "#F0F2F8", borderRadius: 8, padding: 14, border: "1px solid #CBD1E8", display: "flex", flexDirection: "column", gap: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 11, color: "#4A5278" }}>Stage</span>
                          <span style={{ fontSize: 11, fontWeight: 600, color: colColors[statusCol] }}>{COLS_LABELS[statusCol]}</span>
                        </div>
                        {annualOur > 0 && (
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: 11, color: "#4A5278" }}>Annual Our Price</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "#4ADE80" }}>${Math.round(annualOur).toLocaleString()}/yr</span>
                          </div>
                        )}
                        {assignedSubs.length > 0 && (
                          <div>
                            <div style={{ fontSize: 10, color: "#4A5278", marginBottom: 6 }}>Contractors</div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                              {assignedSubs.map(s => (
                                <span key={s.id} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: s.id === bid.selectedSubId ? "#4ADE8020" : "#A78BFA15", color: s.id === bid.selectedSubId ? "#4ADE80" : "#A78BFA", border: "1px solid " + (s.id === bid.selectedSubId ? "#4ADE8030" : "#A78BFA30") }}>
                                  {s.id === bid.selectedSubId ? "✓ " : ""}{s.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {/* Service line items */}
                        {LAWN_SERVICES && bid.services && Object.entries(bid.services).filter(([,v]) => v?.subPrice > 0).length > 0 && (
                          <div>
                            <div style={{ fontSize: 10, color: "#4A5278", marginBottom: 6 }}>Services</div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                              {Object.entries(bid.services).filter(([,v]) => v?.subPrice > 0).map(([key, val]) => {
                                const svc = LAWN_SERVICES.find(s => s.id === key);
                                return (
                                  <div key={key} style={{ display: "flex", justifyContent: "space-between", fontSize: 10 }}>
                                    <span style={{ color: "#4A5278" }}>{svc?.label || key}</span>
                                    <span style={{ color: "#252E52" }}>${(val.subPrice || 0).toLocaleString()} sub · ${(val.ourPrice || 0).toLocaleString()} ours</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        {bid.notes && <div style={{ fontSize: 11, color: "#4A5278", fontStyle: "italic" }}>{bid.notes}</div>}
                        <button className="btn-ghost" style={{ fontSize: 10, padding: "5px 0", color: "#60A5FA", borderColor: "#60A5FA30" }} onClick={() => { setSelectedSite(null); setEditLawnBidId(selectedSite.id); }}>Open in Bids →</button>
                      </div>
                    </div>
                  );
                })()}

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
            <div style={{ fontSize: 13, fontWeight: 600, color: "#1A2240", textTransform: "uppercase", letterSpacing: "0.06em" }}>Company Profile</div>
            <button className="btn-ghost" onClick={() => setSelectedCompany(null)}>✕</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: 10, background: "#E8EEFA", border: "1px solid #3D4570", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, color: "#3B6FE8", flexShrink: 0 }}>
                {selectedCompany.logo ? <img src={selectedCompany.logo} style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover" }} alt="" /> : selectedCompany.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 16, color: "#1A2240", fontWeight: 600 }}>{selectedCompany.name}</div>
                {selectedCompany.website && <div style={{ fontSize: 11, color: "#3B6FE8" }}>{selectedCompany.website}</div>}
                {selectedCompany.address && <div style={{ fontSize: 11, color: "#4A5278" }}>{selectedCompany.address}</div>}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn-ghost" style={{ flex: 1 }} onClick={() => { setEditCompanyId(selectedCompany.id); setCompanyForm({ ...selectedCompany }); setShowCompanyForm(true); }}>✎ Edit</button>
              <button className="btn-ghost" style={{ color: "#3B6FE8", borderColor: "#3B6FE840" }} onClick={() => { setContactForm({ companyId: selectedCompany.id, firstName: "", lastName: "", title: "", email: "", phone: "" }); setShowContactForm(true); }}>+ Contact</button>
            </div>

            <hr style={{ border: "none", borderTop: "1px solid #CBD1E8" }} />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                { label: "Total Contract Value", value: fmt(getCompanyTotalValue(selectedCompany.id)), color: "#3B6FE8" },
                { label: "Active Jobs",          value: getCompanyJobs(selectedCompany.id).length,     color: "#4ADE80" },
                { label: "Pipeline Opps",        value: getCompanyPipeline(selectedCompany.id).length, color: "#FCD34D" },
                { label: "Sites",                value: getCompanySites(selectedCompany.id).length,    color: "#A78BFA" },
              ].map(s => (
                <div key={s.label} style={{ background: "#F0F2F8", border: "1px solid #CBD1E8", borderRadius: 8, padding: "10px 12px" }}>
                  <div style={{ fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "#4A5278", marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>

            <div>
              <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#4A5278", marginBottom: 10, fontWeight: 600 }}>Contacts</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {getCompanyContacts(selectedCompany.id).map(p => (
                  <div key={p.id} className="contact-chip">
                    <div>
                      <div style={{ fontSize: 12, color: "#1A2240", fontWeight: 500 }}>{p.firstName} {p.lastName}</div>
                      <div style={{ fontSize: 10, color: "#4A5278" }}>{p.title} · {p.email}</div>
                      {p.phone && <div style={{ fontSize: 10, color: "#4A5278" }}>{p.phone}</div>}
                    </div>
                    <button className="btn-ghost" style={{ fontSize: 11 }} onClick={() => { setEditContactId(p.id); setContactForm({ ...p }); setShowContactForm(true); }}>✎</button>
                  </div>
                ))}
                {getCompanyContacts(selectedCompany.id).length === 0 && <div style={{ fontSize: 11, color: "#3D4570", textAlign: "center", padding: "12px" }}>No contacts yet</div>}
              </div>
            </div>

            {getCompanyJobs(selectedCompany.id).length > 0 && (
              <div>
                <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#4A5278", marginBottom: 10, fontWeight: 600 }}>Active Jobs</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {getCompanyJobs(selectedCompany.id).map(j => {
                    const sc = STATUS_CONFIG[j.status] || STATUS_CONFIG["On Schedule"];
                    return (
                      <div key={j.id} style={{ background: "#F0F2F8", border: "1px solid #CBD1E8", borderRadius: 8, padding: "10px 12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 12, color: "#1A2240", fontWeight: 500 }}>{j.name}</span>
                          <span style={{ fontSize: 12, color: "#3B6FE8", fontWeight: 600 }}>{fmt(j.contractValue)}</span>
                        </div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <span className="pill" style={{ background: sc.bg, color: sc.color }}>{j.status}</span>
                          <span style={{ fontSize: 10, color: "#4A5278" }}>{j.pct}% complete</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {getCompanyPipeline(selectedCompany.id).length > 0 && (
              <div>
                <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#4A5278", marginBottom: 10, fontWeight: 600 }}>Pipeline</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {getCompanyPipeline(selectedCompany.id).map(o => {
                    const sc = STAGE_COLORS[o.stage] || { color: "#60A5FA", bg: "#60A5FA15" };
                    return (
                      <div key={o.id} style={{ background: "#F0F2F8", border: "1px solid #CBD1E8", borderRadius: 8, padding: "10px 12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 12, color: "#1A2240", fontWeight: 500 }}>{o.name}</span>
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
            <div style={{ fontSize: 13, fontWeight: 600, color: "#1A2240", textTransform: "uppercase", letterSpacing: "0.06em" }}>Job Detail</div>
            <button className="btn-ghost" onClick={() => setSelectedJob(null)}>✕</button>
          </div>
          {(() => {
            const sc = STATUS_CONFIG[selectedJob.status] || STATUS_CONFIG["On Schedule"];
            const co = companies.find(c => c.id === selectedJob.companyId);
            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 16, color: "#1A2240", fontWeight: 600, marginBottom: 4 }}>{selectedJob.name}</div>
                  {co && <div style={{ fontSize: 12, color: "#3B6FE8", marginBottom: 6, cursor: "pointer" }} onClick={() => { setSelectedJob(null); setSelectedCompany(co); }}>🏢 {co.name}</div>}
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span className="pill" style={{ background: sc.bg, color: sc.color }}>{selectedJob.status}</span>
                    <span style={{ fontSize: 20, fontWeight: 700, color: "#3B6FE8" }}>{fmt(selectedJob.contractValue)}</span>
                  </div>
                </div>
                <div style={{ background: "#F0F2F8", borderRadius: 8, padding: "14px", border: "1px solid #CBD1E8", display: "flex", flexDirection: "column", gap: 10 }}>
                  {[{ label: "Project Manager", value: selectedJob.pm }, { label: "Start Date", value: selectedJob.startDate }, { label: "End Date", value: selectedJob.endDate }].map(r => (
                    <div key={r.label} style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 11, color: "#4A5278" }}>{r.label}</span>
                      <span style={{ fontSize: 11, color: "#252E52" }}>{r.value}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#4A5278", marginBottom: 8 }}>Completion — {selectedJob.pct}%</div>
                  <div style={{ background: "#F0F2F8", borderRadius: 4, height: 8, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: selectedJob.pct + "%", background: sc.color, borderRadius: 4 }} />
                  </div>
                </div>
                {selectedJob.notes && <div style={{ fontSize: 12, color: "#6B7694", lineHeight: 1.6, background: "#F0F2F8", padding: "10px 12px", borderRadius: 6, border: "1px solid #CBD1E8" }}>{selectedJob.notes}</div>}
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
            <div style={{ fontSize: 13, fontWeight: 600, color: "#1A2240", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {selectedOpp.stage === "Budgeting" ? "Budget Detail" : selectedOpp.stage === "Lead" ? "Lead Detail" : "Opportunity Detail"}
            </div>
            <button className="btn-ghost" onClick={() => setSelectedOpp(null)}>✕</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <div style={{ fontSize: 15, color: "#1A2240", fontWeight: 600, marginBottom: 6 }}>{selectedOpp.name}</div>
              {(() => {
                const co = companies.find(c => c.id === selectedOpp.companyId);
                const ct = contacts.find(p => p.id === selectedOpp.contactId);
                return co ? (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 12, color: "#3B6FE8", cursor: "pointer", marginBottom: 2 }} onClick={() => { setSelectedOpp(null); setSelectedCompany(co); }}>🏢 {co.name}</div>
                    {ct && <div style={{ fontSize: 11, color: "#4A5278" }}>👤 {ct.firstName} {ct.lastName} · {ct.title}</div>}
                  </div>
                ) : null;
              })()}
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span className="pill" style={{ background: (STAGE_COLORS[selectedOpp.stage] || { bg: "#60A5FA15" }).bg, color: (STAGE_COLORS[selectedOpp.stage] || { color: "#60A5FA" }).color }}>{selectedOpp.stage}</span>
                <span style={{ fontSize: 20, fontWeight: 700, color: "#1A2240" }}>{fmt(selectedOpp.value)}</span>
              </div>
            </div>

            {selectedOpp.stage === "Budgeting" && (
              <div style={{ background: "#F0F2F8", borderRadius: 8, padding: "12px", border: "1px solid #CBD1E8" }}>
                <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#4A5278", marginBottom: 6 }}>Budget Due Date</div>
                <div style={{ fontSize: 14, color: selectedOpp.budgetDueDate ? "#FCD34D" : "#4A5278", fontWeight: 500 }}>{selectedOpp.budgetDueDate || "Not set"}</div>
              </div>
            )}

            {["Proposal / Bid", "Bid Submitted"].includes(selectedOpp.stage) && (
              <div style={{ background: "#F0F2F8", borderRadius: 8, padding: "12px", border: "1px solid #FCD34D30" }}>
                <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#4A5278", marginBottom: 6 }}>Bid Due Date</div>
                <div style={{ fontSize: 14, color: selectedOpp.bidDueDate ? "#FCD34D" : "#4A5278", fontWeight: 500 }}>{selectedOpp.bidDueDate || "Not set"}</div>
              </div>
            )}

            {selectedOpp.stage === "Lead" && (selectedOpp.nextSteps || []).length > 0 && (
              <div>
                <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#4A5278", marginBottom: 8, fontWeight: 600 }}>Next Steps</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {(selectedOpp.nextSteps || []).map((ns, i) => {
                    const nsOverdue = ns.dueDate && new Date(ns.dueDate) < new Date();
                    return (
                      <div key={i} className="ns-row">
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: nsOverdue ? "#F87171" : "#3B6FE8", flexShrink: 0 }} />
                          <span style={{ fontSize: 12, color: "#1A2240", fontWeight: 500 }}>{ns.step}</span>
                        </div>
                        <span style={{ fontSize: 11, color: nsOverdue ? "#F87171" : "#4A5278" }}>{ns.dueDate || "No date"}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {selectedOpp.closeDate && <div style={{ fontSize: 11, color: "#4A5278" }}><span style={{ color: "#353C62" }}>Expected Close: </span>{selectedOpp.closeDate}</div>}
            {selectedOpp.notes     && <div style={{ fontSize: 12, color: "#6B7694", lineHeight: 1.6, background: "#F0F2F8", padding: "10px 12px", borderRadius: 6, border: "1px solid #CBD1E8" }}>{selectedOpp.notes}</div>}
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
            <div style={{ fontSize: 16, fontWeight: 700, color: "#1A2240", marginBottom: 22, textTransform: "uppercase", letterSpacing: "0.04em" }}>{editJobId !== null ? "Edit Job" : "Add Active Job"}</div>
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
            <div style={{ fontSize: 16, fontWeight: 700, color: "#1A2240", marginBottom: 22, textTransform: "uppercase", letterSpacing: "0.04em" }}>{editId !== null ? "Edit" : "Add"} — {form.stage}</div>
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
                          <span style={{ fontSize: 12, color: "#1A2240" }}>{ns.step}</span>
                          <span style={{ fontSize: 11, color: "#4A5278" }}>{ns.dueDate}</span>
                        </div>
                        <button className="btn-ghost" style={{ color: "#F87171", padding: "2px 6px" }} onClick={() => removeNextStep(i)}>✕</button>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <select className="fi" value={newNextStep.step} onChange={e => setNewNextStep(n => ({ ...n, step: e.target.value }))} style={{ flex: 2 }}>
                      <option value="">Select next step…</option>
                      {(NEXT_STEP_OPTIONS[form.bu] || NEXT_STEP_OPTIONS.all).map(s => <option key={s}>{s}</option>)}
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
            <div style={{ fontSize: 16, fontWeight: 700, color: "#1A2240", marginBottom: 22, textTransform: "uppercase" }}>{editCompanyId ? "Edit Company" : "Add Company"}</div>
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
            <div style={{ fontSize: 16, fontWeight: 700, color: "#1A2240", marginBottom: 22, textTransform: "uppercase" }}>{editContactId ? "Edit Contact" : "Add Contact"}</div>
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
            <div style={{ fontSize: 16, fontWeight: 700, color: "#1A2240", marginBottom: 22, textTransform: "uppercase" }}>{editSiteId ? "Edit Site" : "Add Site"}</div>
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
                      <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: (siteForm.contactIds || []).includes(p.id) ? "#E8EEFA" : "#F0F2F8", border: "1px solid " + ((siteForm.contactIds || []).includes(p.id) ? "#3B6FE8" : "#CBD1E8"), borderRadius: 6, cursor: "pointer" }}
                        onClick={() => toggleSiteContact(p.id)}>
                        <div style={{ width: 14, height: 14, borderRadius: 3, background: (siteForm.contactIds || []).includes(p.id) ? "#3B6FE8" : "transparent", border: "1px solid " + ((siteForm.contactIds || []).includes(p.id) ? "#3B6FE8" : "#4A5278"), display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {(siteForm.contactIds || []).includes(p.id) && <span style={{ fontSize: 9, color: "#fff" }}>✓</span>}
                        </div>
                        <div>
                          <div style={{ fontSize: 12, color: "#1A2240" }}>{p.firstName} {p.lastName}</div>
                          <div style={{ fontSize: 10, color: "#4A5278" }}>{p.title}</div>
                        </div>
                      </div>
                    ))}
                    {contacts.filter(p => p.companyId === siteForm.companyId).length === 0 && (
                      <div style={{ fontSize: 11, color: "#3D4570", padding: "8px 12px" }}>No contacts for this company yet</div>
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

      {/* ── CAPEX JOB SIDE PANEL ── */}
      {selectedCapexJob && (
        <div className="side-panel slide-in">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#1A2240", textTransform: "uppercase", letterSpacing: "0.06em" }}>Capital Improvement</div>
            <button className="btn-ghost" onClick={() => setSelectedCapexJob(null)}>✕</button>
          </div>
          {(() => {
            const st   = CAPEX_FM_STAGES.find(s => s.id === selectedCapexJob.stage) || CAPEX_FM_STAGES[0];
            const co   = companies.find(c => c.id === selectedCapexJob.companyId);
            const site = sites.find(s => s.id === selectedCapexJob.siteId);
            const actionDate = selectedCapexJob[st.actionKey];
            const overdue = actionDate && new Date(actionDate) < new Date();
            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 15, color: "#1A2240", fontWeight: 600, marginBottom: 6 }}>{selectedCapexJob.name}</div>
                  {co && <div style={{ fontSize: 12, color: "#3B6FE8", marginBottom: 2, cursor: "pointer" }} onClick={() => { setSelectedCapexJob(null); setSelectedCompany(co); }}>🏢 {co.name}</div>}
                  {site && <div style={{ fontSize: 11, color: "#353C62", marginBottom: 8 }}>📍 Store #{site.storeNumber} — {site.address}</div>}
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span className="pill" style={{ background: st.color + "20", color: st.color }}>{st.label}</span>
                    <span style={{ fontSize: 20, fontWeight: 700, color: "#1A2240" }}>{fmt(selectedCapexJob.contractValue)}</span>
                  </div>
                </div>
                <div style={{ background: "#F0F2F8", borderRadius: 8, padding: "14px", border: "1px solid #CBD1E8", display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    { label: "PM",              value: selectedCapexJob.pm        || "—" },
                    { label: "Start Date",      value: selectedCapexJob.startDate || "—" },
                    { label: "End Date",        value: selectedCapexJob.endDate   || "—" },
                    { label: st.actionLabel,    value: actionDate || "—", highlight: overdue },
                  ].map(r => (
                    <div key={r.label} style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 11, color: "#4A5278" }}>{r.label}</span>
                      <span style={{ fontSize: 11, color: r.highlight ? "#F87171" : "#252E52", fontWeight: r.highlight ? 600 : 400 }}>{r.value}{r.highlight ? " ⚠" : ""}</span>
                    </div>
                  ))}
                </div>
                {selectedCapexJob.stage === "do_work" && (
                  <div>
                    <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#4A5278", marginBottom: 8 }}>Completion — {selectedCapexJob.pct}%</div>
                    <div style={{ background: "#F0F2F8", borderRadius: 4, height: 8, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: (selectedCapexJob.pct || 0) + "%", background: st.color, borderRadius: 4 }} />
                    </div>
                  </div>
                )}
                {selectedCapexJob.notes && <div style={{ fontSize: 12, color: "#6B7694", lineHeight: 1.6, background: "#F0F2F8", padding: "10px 12px", borderRadius: 6, border: "1px solid #CBD1E8" }}>{selectedCapexJob.notes}</div>}
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn-ghost" style={{ flex: 1 }} onClick={() => { openEditCapex(selectedCapexJob); setSelectedCapexJob(null); }}>✎ Edit</button>
                  <button className="btn-ghost" style={{ color: "#F87171", borderColor: "#F8717120" }} onClick={() => deleteCapex(selectedCapexJob.id)}>✕</button>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ── FM JOB SIDE PANEL ── */}
      {selectedFmJob && (
        <div className="side-panel slide-in" style={{ overflowY: "auto" }}>
          {(() => {
            const job  = selectedFmJob;
            const st   = FM_STAGES.find(s => s.id === job.stage) || FM_STAGES[0];
            const co   = companies.find(c => c.id === job.companyId);
            const site = sites.find(s => s.id === job.siteId);
            const sub  = subcontractors.find(s => s.id === job.subcontractorId);
            const actionDate = job[st.actionKey];
            const overdue = actionDate && new Date(actionDate) < new Date();
            const curStageIdx = FM_STAGES.findIndex(s => s.id === job.stage);
            const update = (fields) => {
              const updated = { ...job, ...fields };
              setFmJobs(fmJobs.map(j => j.id === job.id ? updated : j));
              setSelectedFmJob(updated);
              try { supa.from("fm_jobs").update(fmJobToDB(updated)).eq("id", job.id); } catch(e) {}
            };
            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: "#4A5278", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>FM Job</div>
                    <div style={{ fontSize: 15, color: "#1A2240", fontWeight: 700, lineHeight: 1.3 }}>{job.name}</div>
                    {job.storeCode && <div style={{ fontSize: 11, color: "#4A5278", marginTop: 2 }}>#{job.storeCode} {job.projectNo ? "· " + job.projectNo : ""}</div>}
                  </div>
                  <button className="btn-ghost" onClick={() => setSelectedFmJob(null)} style={{ flexShrink: 0 }}>✕</button>
                </div>

                {co && <div style={{ fontSize: 12, color: "#3B6FE8", cursor: "pointer" }} onClick={() => { setSelectedFmJob(null); setSelectedCompany(co); }}>🏢 {co.name}</div>}
                {site && <div style={{ fontSize: 11, color: "#4A5278" }}>📍 {site.address}</div>}

                {/* Stage selector — full pipeline across all 6 stages */}
                <div>
                  <div style={{ fontSize: 10, color: "#4A5278", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Stage</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {/* Pipeline stages */}
                    <div style={{ fontSize: 9, color: "#3D4570", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 2 }}>Pipeline</div>
                    <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
                      {FM_PIPELINE_STAGES.map(s => (
                        <button key={s.id} onClick={() => {
                          const patch = { stage: s.id };
                          if (s.id === "owner_approval" && job.stage !== "owner_approval") {
                            patch.ownerApprovalDate = new Date().toISOString();
                            patch.followUpDate = new Date(Date.now() + 3*86400000).toISOString().slice(0,10);
                            patch.vendorNextStep = "awaiting_confirm";
                          }
                          update(patch);
                        }}
                          style={{ flex: 1, padding: "6px 4px", borderRadius: 5, border: "1px solid", cursor: "pointer", fontSize: 10, fontFamily: "inherit", fontWeight: 600, transition: "all 0.15s", textAlign: "center",
                            borderColor: job.stage === s.id ? s.color : "#CBD1E8",
                            background:  job.stage === s.id ? s.color + "25" : "transparent",
                            color:       job.stage === s.id ? s.color : "#4A5278" }}>
                          {s.label}
                        </button>
                      ))}
                    </div>
                    {/* Active stages */}
                    <div style={{ fontSize: 9, color: "#3D4570", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 2 }}>Active Jobs</div>
                    <div style={{ display: "flex", gap: 4 }}>
                      {FM_ACTIVE_STAGES.map(s => (
                        <button key={s.id} onClick={() => {
                          const patch = { stage: s.id };
                          if (s.id === "do_work" && job.stage !== "do_work") {
                            // Generate scheduling token for sub
                            const schedToken = "sched" + Math.random().toString(36).slice(2, 10);
                            patch.schedToken = schedToken;
                            patch.schedSentAt = new Date().toISOString();
                            // Copy link to clipboard + alert
                            const link = window.location.origin + "/?schedtoken=" + schedToken;
                            navigator.clipboard?.writeText(link);
                            setTimeout(() => alert("📅 Scheduling link copied!\n\nSend to " + (subcontractors.find(sub => sub.id === job.subcontractorId)?.name || "the sub") + ":\n\n" + link), 50);
                          }
                          update(patch);
                        }}
                          style={{ flex: 1, padding: "6px 4px", borderRadius: 5, border: "1px solid", cursor: "pointer", fontSize: 10, fontFamily: "inherit", fontWeight: 600, transition: "all 0.15s", textAlign: "center",
                            borderColor: job.stage === s.id ? s.color : "#CBD1E8",
                            background:  job.stage === s.id ? s.color + "25" : "transparent",
                            color:       job.stage === s.id ? s.color : "#4A5278" }}>
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Owner Approval info panel */}
                {job.stage === "owner_approval" && (
                  <div style={{ background: "#60A5FA10", border: "1px solid #60A5FA30", borderRadius: 8, padding: "12px 14px" }}>
                    <div style={{ fontSize: 10, color: "#60A5FA", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>📋 Owner Approval</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {job.ownerApprovalDate && (
                        <div style={{ fontSize: 11, color: "#4A5278" }}>
                          Sent for approval: <span style={{ color: "#1A2240" }}>{new Date(job.ownerApprovalDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                        </div>
                      )}
                      <div>
                        <div style={{ fontSize: 10, color: "#4A5278", marginBottom: 4 }}>Follow-up Reminder Date</div>
                        <input className="fi" type="date" value={job.followUpDate || ""}
                          onChange={e => update({ followUpDate: e.target.value })}
                          style={{ borderColor: job.followUpDate && new Date(job.followUpDate) < new Date() ? "#F87171" : undefined }} />
                        {job.followUpDate && new Date(job.followUpDate) < new Date() && (
                          <div style={{ fontSize: 10, color: "#F87171", marginTop: 3 }}>⚠ Follow-up overdue</div>
                        )}
                      </div>
                      <div style={{ fontSize: 10, color: "#FCD34D", background: "#FCD34D10", borderRadius: 4, padding: "6px 10px" }}>
                        🔒 Vendor status locked: Awaiting Confirmation
                      </div>
                    </div>
                  </div>
                )}

                {/* Do Work — scheduling info */}
                {job.stage === "do_work" && job.schedToken && (
                  <div style={{ background: "#4ADE8010", border: "1px solid #4ADE8030", borderRadius: 8, padding: "12px 14px" }}>
                    <div style={{ fontSize: 10, color: "#4ADE80", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>📅 Scheduling</div>
                    {job.scheduledDate ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <div style={{ fontSize: 11, color: "#1A2240" }}>Scheduled: <strong>{new Date(job.scheduledDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</strong></div>
                        {job.subInvoiceSubmitted && (
                          <div style={{ background: "#4ADE8015", borderRadius: 6, padding: "8px 10px" }}>
                            <div style={{ fontSize: 10, color: "#4ADE80", fontWeight: 700, marginBottom: 4 }}>✓ Invoice Submitted</div>
                            {job.subInvoiceAmount && <div style={{ fontSize: 12, color: "#1A2240" }}>Amount: {fmt(Number(job.subInvoiceAmount))}</div>}
                            {job.subInvoiceNotes && <div style={{ fontSize: 11, color: "#4A5278", marginTop: 2 }}>{job.subInvoiceNotes}</div>}
                            {(job.subInvoicePhotos||[]).length > 0 && (
                              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4, marginTop: 6 }}>
                                {(job.subInvoicePhotos||[]).map((p,i) => <img key={i} src={p.data} style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 4 }} />)}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ fontSize: 11, color: "#4A5278" }}>
                        Awaiting sub to confirm schedule date
                        {job.schedSentAt && <div style={{ fontSize: 10, marginTop: 2 }}>Link sent: {new Date(job.schedSentAt).toLocaleDateString()}</div>}
                      </div>
                    )}
                    <button onClick={() => navigator.clipboard?.writeText(window.location.origin + "/?schedtoken=" + job.schedToken)}
                      style={{ marginTop: 8, fontSize: 10, background: "transparent", border: "1px solid #4ADE8030", borderRadius: 4, color: "#4ADE80", padding: "4px 8px", cursor: "pointer", fontFamily: "inherit" }}>
                      📋 Copy Scheduling Link
                    </button>
                  </div>
                )}

                {/* Key action date */}
                {st.actionKey && (
                  <div>
                    <div style={{ fontSize: 10, color: "#4A5278", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>{st.actionLabel}</div>
                    <input className="fi" type="date" value={job[st.actionKey] || ""}
                      onChange={e => update({ [st.actionKey]: e.target.value })}
                      style={{ borderColor: overdue ? "#F87171" : undefined }} />
                    {overdue && <div style={{ fontSize: 10, color: "#F87171", marginTop: 3 }}>⚠ Overdue</div>}
                  </div>
                )}

                {/* Coordinator */}
                <div>
                  <div style={{ fontSize: 10, color: "#4A5278", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>Coordinator</div>
                  <select className="fi" value={job.coordinator || ""} onChange={e => update({ coordinator: e.target.value })}>
                    <option value="">Unassigned</option>
                    {fmTeam.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                  </select>
                </div>

                {/* ── ESTIMATING stage panel ── */}
                {job.stage === "estimating" && (() => {
                  const nte      = Number(job.contractValue || job.nte || 0);
                  const gp       = job.grossProfit > 0 ? job.grossProfit : fmGrossProfit(nte);
                  const vendorNTE = job.vendorNTE ? Number(job.vendorNTE) : fmVendorNTE(nte);
                  const estPath  = job.estimatingPath || null; // "known_vendor" | "bid_out" | "self_estimate"
                  const bidInvites = job.bidInvites || []; // [{ subId, token, sentAt, price, status }]

                  return (
                    <div style={{ background: "#F0F2F8", border: "1px solid #818CF840", borderRadius: 8, padding: "14px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <div style={{ fontSize: 10, color: "#818CF8", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 700 }}>📋 Estimating</div>
                        {estPath && (
                          <button onClick={() => update({ estimatingPath: null })}
                            style={{ fontSize: 9, background: "transparent", border: "none", color: "#4A5278", cursor: "pointer", fontFamily: "inherit", padding: 0 }}>
                            ← Change path
                          </button>
                        )}
                      </div>

                      {/* NTE row */}
                      {!nte ? (
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ fontSize: 10, color: "#4A5278", marginBottom: 4 }}>Authorized Amount (NTE)</div>
                          <input className="fi" type="number" placeholder="From the work order ticket"
                            value={job.contractValue || job.nte || ""}
                            onChange={e => {
                              const n = Number(e.target.value||0);
                              const gp = fmGrossProfit(n);
                              update({ contractValue: n, grossProfit: gp, nte: String(n), vendorNTE: String(fmVendorNTE(n)) });
                            }} />
                        </div>
                      ) : (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12, background: "#ECEEF8", borderRadius: 6, padding: "10px 12px" }}>
                          <div>
                            <div style={{ fontSize: 9, color: "#4A5278", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>Gross Value</div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: "#1A2240" }}>{fmt(nte)}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 9, color: "#4A5278", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>Our GP</div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: "#4ADE80" }}>{fmt(gp)}</div>
                            <div style={{ fontSize: 9, color: "#4A5278" }}>{nte > 0 ? Math.round((gp/nte)*100) : 0}%</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 9, color: "#FCD34D", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>Vendor NTE</div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: "#FCD34D" }}>{fmt(vendorNTE)}</div>
                          </div>
                        </div>
                      )}

                      {/* ── PATH SELECTOR ── */}
                      {!estPath && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          <div style={{ fontSize: 10, color: "#4A5278", marginBottom: 2 }}>How are we estimating this job?</div>
                          <button onClick={() => update({ estimatingPath: "known_vendor" })}
                            style={{ width: "100%", padding: "10px 12px", borderRadius: 7, border: "1px solid #CBD1E8", background: "#FFF", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "#1A2240" }}>👤 Known Vendor</div>
                            <div style={{ fontSize: 10, color: "#4A5278", marginTop: 2 }}>I know who's doing this — send them the job directly</div>
                          </button>
                          <button onClick={() => update({ estimatingPath: "bid_out" })}
                            style={{ width: "100%", padding: "10px 12px", borderRadius: 7, border: "1px solid #CBD1E8", background: "#FFF", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "#1A2240" }}>🏁 Bid It Out</div>
                            <div style={{ fontSize: 10, color: "#4A5278", marginTop: 2 }}>Send to multiple vendors, pick the best price</div>
                          </button>
                          <button onClick={() => update({ estimatingPath: "self_estimate" })}
                            style={{ width: "100%", padding: "10px 12px", borderRadius: 7, border: "1px solid #CBD1E8", background: "#FFF", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "#1A2240" }}>🧮 Self-Estimate</div>
                            <div style={{ fontSize: 10, color: "#4A5278", marginTop: 2 }}>Use our calculators to build the price, find vendor post-approval</div>
                          </button>
                        </div>
                      )}

                      {/* ── PATH 1: KNOWN VENDOR ── */}
                      {estPath === "known_vendor" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          <div>
                            <div style={{ fontSize: 10, color: "#4A5278", marginBottom: 4 }}>Assign Vendor</div>
                            <select className="fi" value={job.subcontractorId || ""} onChange={e => update({ subcontractorId: e.target.value })}>
                              <option value="">Select vendor…</option>
                              {subcontractors.map(s => <option key={s.id} value={s.id}>{s.name}{s.trade ? " — " + s.trade : ""}</option>)}
                            </select>
                          </div>
                          {job.subcontractorId && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                              {/* Vendor portal status */}
                              {job.vendorPortalStatus === "scheduled" ? (
                                <div style={{ background: "#4ADE8015", border: "1px solid #4ADE8030", borderRadius: 6, padding: "10px 12px" }}>
                                  <div style={{ fontSize: 11, color: "#4ADE80", fontWeight: 700 }}>✅ Vendor Scheduled</div>
                                  <div style={{ fontSize: 11, color: "#1A2240", marginTop: 3 }}>Price: <strong>{fmt(Number(job.vendorPortalPrice||0))}</strong> · Date: <strong>{job.vendorPortalDate}</strong></div>
                                  {job.vendorPortalNote && <div style={{ fontSize: 10, color: "#4A5278", marginTop: 3 }}>{job.vendorPortalNote}</div>}
                                  <button onClick={() => update({ stage: "do_work", startDate: job.vendorPortalDate })}
                                    style={{ marginTop: 8, width: "100%", padding: "8px", borderRadius: 6, border: "none", background: "#4ADE80", color: "#0A1F0A", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                                    ✅ Move to Do Work
                                  </button>
                                </div>
                              ) : job.vendorPortalStatus === "quote_submitted" ? (
                                <div style={{ background: "#F8717115", border: "1px solid #F8717130", borderRadius: 6, padding: "10px 12px" }}>
                                  <div style={{ fontSize: 11, color: "#F87171", fontWeight: 700 }}>⚠ Over NTE — Quote Needs Review</div>
                                  <div style={{ fontSize: 11, color: "#1A2240", marginTop: 3 }}>Vendor price: <strong>{fmt(Number(job.vendorPortalPrice||0))}</strong> vs NTE: {fmt(vendorNTE)}</div>
                                  {job.vendorPortalNote && <div style={{ fontSize: 10, color: "#4A5278", marginTop: 3 }}>{job.vendorPortalNote}</div>}
                                  <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                                    <button onClick={() => update({ stage: "generate_proposal", vendorQuotePrice: job.vendorPortalPrice })}
                                      style={{ flex: 1, padding: "7px", borderRadius: 5, border: "none", background: "#3B6FE8", color: "#FFF", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                                      → Generate Proposal
                                    </button>
                                    <button onClick={() => update({ vendorPortalStatus: null, vendorToken: null, vendorSentAt: null })}
                                      style={{ flex: 0, padding: "7px 10px", borderRadius: 5, border: "1px solid #CBD1E8", background: "transparent", color: "#4A5278", fontSize: 10, cursor: "pointer", fontFamily: "inherit" }}>
                                      ↩ Reset
                                    </button>
                                  </div>
                                </div>
                              ) : job.vendorSentAt && job.vendorToken ? (
                                <div style={{ background: "#FCD34D10", border: "1px solid #FCD34D30", borderRadius: 6, padding: "10px 12px" }}>
                                  <div style={{ fontSize: 11, color: "#FCD34D", fontWeight: 600 }}>⏳ Awaiting vendor response</div>
                                  <div style={{ fontSize: 10, color: "#4A5278", marginTop: 2 }}>Sent {new Date(job.vendorSentAt).toLocaleDateString()}</div>
                                  <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                                    <button onClick={() => navigator.clipboard?.writeText(window.location.origin + "/?vendortoken=" + job.vendorToken)}
                                      style={{ flex: 1, fontSize: 10, background: "transparent", border: "1px solid #FCD34D30", borderRadius: 4, color: "#FCD34D", padding: "4px 8px", cursor: "pointer", fontFamily: "inherit" }}>
                                      📋 Copy Link
                                    </button>
                                    <button onClick={() => window.open(window.location.origin + "/?vendortoken=" + job.vendorToken, "_blank")}
                                      style={{ flex: 1, fontSize: 10, background: "#3B6FE820", border: "1px solid #3B6FE840", borderRadius: 4, color: "#3B6FE8", padding: "4px 8px", cursor: "pointer", fontFamily: "inherit" }}>
                                      👁 Preview Portal
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    const vt = "vendor" + Math.random().toString(36).slice(2, 10);
                                    const link = window.location.origin + "/?vendortoken=" + vt;
                                    update({ vendorToken: vt, vendorSentAt: new Date().toISOString(), vendorPortalStatus: "pending", stage: "waiting_quote" });
                                    navigator.clipboard?.writeText(link);
                                    if (window.confirm("✅ Link copied!\n\nOpen a preview of the vendor portal now?")) {
                                      window.open(link, "_blank");
                                    }
                                  }}
                                  style={{ width: "100%", padding: "10px", borderRadius: 6, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 700, background: "#3B6FE8", color: "#FFF" }}>
                                  🔗 Send Vendor Portal Link
                                </button>
                              )}
                            </div>
                          )}
                          {!job.subcontractorId && <div style={{ fontSize: 10, color: "#3D4570", fontStyle: "italic" }}>Select a vendor above to send them the job</div>}
                        </div>
                      )}

                      {/* ── PATH 2: BID OUT ── */}
                      {estPath === "bid_out" && (() => {
                        const invites = job.bidInvites || [];
                        const responded = invites.filter(i => i.price);
                        const lowestBid = responded.length ? responded.reduce((a, b) => Number(a.price) < Number(b.price) ? a : b) : null;
                        return (
                          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            <div style={{ fontSize: 10, color: "#4A5278" }}>Add vendors to the bid list. Each gets their own portal link.</div>

                            {/* Invite list */}
                            {invites.map((inv, idx) => {
                              const s = subcontractors.find(x => x.id === inv.subId);
                              const isLow = lowestBid && inv.subId === lowestBid.subId;
                              return (
                                <div key={inv.subId} style={{ background: isLow ? "#4ADE8010" : "#ECEEF8", border: "1px solid " + (isLow ? "#4ADE8040" : "#CBD1E8"), borderRadius: 6, padding: "10px 12px" }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                    <div>
                                      <div style={{ fontSize: 11, fontWeight: 700, color: "#1A2240" }}>{s?.name || "Unknown"}{isLow && <span style={{ marginLeft: 6, fontSize: 9, background: "#4ADE8020", color: "#4ADE80", padding: "1px 6px", borderRadius: 3 }}>LOWEST</span>}</div>
                                      {inv.sentAt && <div style={{ fontSize: 10, color: "#4A5278", marginTop: 1 }}>Sent {new Date(inv.sentAt).toLocaleDateString()}</div>}
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                      {inv.price ? (
                                        <div style={{ fontSize: 13, fontWeight: 700, color: isLow ? "#4ADE80" : "#1A2240" }}>{fmt(Number(inv.price))}</div>
                                      ) : inv.sentAt ? (
                                        <span style={{ fontSize: 10, color: "#FCD34D" }}>⏳ Waiting</span>
                                      ) : null}
                                    </div>
                                  </div>
                                  <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                                    {!inv.sentAt ? (
                                      <button onClick={() => {
                                        const vt = "vendor" + Math.random().toString(36).slice(2, 10);
                                        const link = window.location.origin + "/?vendortoken=" + vt;
                                        const updated = invites.map((x, i) => i === idx ? { ...x, token: vt, sentAt: new Date().toISOString() } : x);
                                        update({ bidInvites: updated });
                                        navigator.clipboard?.writeText(link);
                                        alert("✅ Link copied for " + (s?.name || "vendor") + ":\n\n" + link);
                                      }} style={{ flex: 1, padding: "6px", borderRadius: 5, border: "none", background: "#3B6FE8", color: "#FFF", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                                        🔗 Send Link
                                      </button>
                                    ) : inv.sentAt && !inv.price ? (
                                      <button onClick={() => navigator.clipboard?.writeText(window.location.origin + "/?vendortoken=" + inv.token)}
                                        style={{ flex: 1, padding: "6px", borderRadius: 5, border: "1px solid #FCD34D30", background: "transparent", color: "#FCD34D", fontSize: 10, cursor: "pointer", fontFamily: "inherit" }}>
                                        📋 Resend Link
                                      </button>
                                    ) : isLow ? (
                                      <button onClick={() => update({ subcontractorId: inv.subId, vendorPortalPrice: inv.price, vendorPortalStatus: "scheduled", estimatingPath: "known_vendor", bidInvites: invites })}
                                        style={{ flex: 1, padding: "6px", borderRadius: 5, border: "none", background: "#4ADE80", color: "#0A1F0A", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                                        ✅ Select Winner
                                      </button>
                                    ) : (
                                      <button onClick={() => update({ subcontractorId: inv.subId, vendorPortalPrice: inv.price, vendorPortalStatus: "scheduled", estimatingPath: "known_vendor", bidInvites: invites })}
                                        style={{ flex: 1, padding: "6px", borderRadius: 5, border: "1px solid #CBD1E8", background: "transparent", color: "#4A5278", fontSize: 10, cursor: "pointer", fontFamily: "inherit" }}>
                                        Select
                                      </button>
                                    )}
                                    <button onClick={() => update({ bidInvites: invites.filter((_, i) => i !== idx) })}
                                      style={{ padding: "6px 8px", borderRadius: 5, border: "1px solid #F8717130", background: "transparent", color: "#F87171", fontSize: 10, cursor: "pointer", fontFamily: "inherit" }}>
                                      ✕
                                    </button>
                                  </div>
                                </div>
                              );
                            })}

                            {/* Add vendor to bid */}
                            {(() => {
                              const alreadyAdded = new Set(invites.map(i => i.subId));
                              const available = subcontractors.filter(s => !alreadyAdded.has(s.id));
                              return available.length > 0 ? (
                                <select className="fi" value="" onChange={e => {
                                  if (!e.target.value) return;
                                  update({ bidInvites: [...invites, { subId: e.target.value, token: null, sentAt: null, price: null, status: "pending" }] });
                                }}>
                                  <option value="">+ Add vendor to bid list…</option>
                                  {available.map(s => <option key={s.id} value={s.id}>{s.name}{s.trade ? " — " + s.trade : ""}</option>)}
                                </select>
                              ) : <div style={{ fontSize: 10, color: "#4A5278", fontStyle: "italic" }}>All vendors added</div>;
                            })()}

                            {responded.length > 0 && (
                              <div style={{ background: "#FCD34D10", border: "1px solid #FCD34D30", borderRadius: 6, padding: "8px 12px", fontSize: 10, color: "#FCD34D" }}>
                                {responded.length} of {invites.length} vendors responded · Lowest: {fmt(Number(lowestBid.price))}
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* ── PATH 3: SELF-ESTIMATE ── */}
                      {estPath === "self_estimate" && (() => {
                        const se = job.selfEstimate || {};
                        const step = se.step || "category";
                        const updateSE = patch => update({ selfEstimate: { ...se, ...patch } });

                        // ── ABG PRICING (tonnage-based) ──
                        // 5x5 fully packed ≈ 0.5 ton → $300. Rate ~$600/ton.
                        // Sqft ratio drives tonnage capacity vs 5x5 baseline.
                        const ABG_UNITS = [
                          { size: "5x5",   sqft: 25,  baseTons: 0.50 },
                          { size: "5x10",  sqft: 50,  baseTons: 1.00 },
                          { size: "10x10", sqft: 100, baseTons: 2.00 },
                          { size: "10x15", sqft: 150, baseTons: 3.00 },
                          { size: "10x20", sqft: 200, baseTons: 4.00 },
                          { size: "10x30", sqft: 300, baseTons: 6.00 },
                        ];
                        const RATE_PER_TON = 600; // $600/ton → 5x5 full = $300 ✓
                        const abgUnits = se.abgUnits || {};
                        const calcABGRow = (u) => {
                          const row = abgUnits[u.size] || {};
                          const qty = Number(row.qty || 0);
                          const pct = Number(row.pct != null ? row.pct : 100) / 100;
                          const tons = qty * u.baseTons * pct;
                          const price = Math.round(tons * RATE_PER_TON);
                          return { qty, pct: Number(row.pct != null ? row.pct : 100), tons, price };
                        };
                        const calcABG = () => ABG_UNITS.reduce((t, u) => t + calcABGRow(u).price, 0);

                        // ── DOOR PRICING ──
                        const DOOR_PRICE_SINGLE = 125;
                        const DOOR_PRICE_DOUBLE = 195;
                        const doorQty  = Number(se.doorQty || 0);
                        const doorType = se.doorType || "single";
                        const calcDoors = () => doorQty * (doorType === "double" ? DOOR_PRICE_DOUBLE : DOOR_PRICE_SINGLE);

                        // ── TOTALS ──
                        const categories = se.categories || [];
                        const abgTotal   = categories.includes("abg")   ? calcABG()   : 0;
                        const doorTotal  = categories.includes("doors") ? calcDoors() : 0;
                        const calcTotal  = abgTotal + doorTotal;
                        const finalPrice = se.overridePrice != null ? Number(se.overridePrice) : calcTotal;

                        // ── BUILD PROPOSAL SECTIONS from line items ──
                        const buildProposalSections = () => {
                          const sections = [];
                          if (categories.includes("abg")) {
                            const items = ABG_UNITS
                              .filter(u => calcABGRow(u).qty > 0)
                              .map(u => {
                                const row = calcABGRow(u);
                                return {
                                  id: "i_abg_" + u.size,
                                  desc: "ABG — " + u.size + " units (" + row.pct + "% full, ~" + row.tons.toFixed(1) + " tons)",
                                  unit: "EA",
                                  qty: row.qty,
                                  unitPrice: row.qty > 0 ? Math.round(row.price / row.qty) : 0,
                                  labor: 0, material: 0, sub: row.price, misc: 0,
                                };
                              });
                            if (items.length) sections.push({ id: "s_abg", name: "01 Abandoned Goods Removal", items });
                          }
                          if (categories.includes("doors")) {
                            sections.push({
                              id: "s_doors", name: "02 Coiling Door Spring Replacement",
                              items: [{
                                id: "i_doors",
                                desc: "Coiling door spring replacement — " + doorType + " spring",
                                unit: "EA",
                                qty: doorQty,
                                unitPrice: doorType === "double" ? DOOR_PRICE_DOUBLE : DOOR_PRICE_SINGLE,
                                labor: 0, material: 0, sub: calcDoors(), misc: 0,
                              }]
                            });
                          }
                          if (!sections.length) {
                            sections.push({ id: "s1", name: "01 General", items: [{ id: "i1", desc: job.scopeOfWork || job.name, unit: "LS", qty: 1, unitPrice: finalPrice, labor: 0, material: 0, sub: finalPrice, misc: 0 }] });
                          }
                          return sections;
                        };

                        // ── STEP: CATEGORY SELECT ──
                        if (step === "category") return (
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            <div style={{ fontSize: 10, color: "#4A5278", marginBottom: 2 }}>What work is involved? Select all that apply.</div>
                            {[
                              { id: "abg",   label: "🗑 Abandoned Goods (ABG)", desc: "Trash removal priced by unit size & fill %" },
                              { id: "doors", label: "🚪 Coiling Doors", desc: "Spring replacement by door count" },
                              { id: "other", label: "📝 Other / Manual Entry", desc: "I'll enter the price directly" },
                            ].map(cat => {
                              const sel = categories.includes(cat.id);
                              return (
                                <button key={cat.id} onClick={() => {
                                  const next = sel ? categories.filter(c => c !== cat.id) : [...categories, cat.id];
                                  updateSE({ categories: next });
                                }} style={{ width: "100%", padding: "10px 12px", borderRadius: 7,
                                  border: "1px solid " + (sel ? "#3B6FE8" : "#CBD1E8"),
                                  background: sel ? "#3B6FE810" : "#FFF",
                                  cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                                  <div style={{ fontSize: 12, fontWeight: 700, color: sel ? "#3B6FE8" : "#1A2240" }}>{sel ? "☑ " : ""}{cat.label}</div>
                                  <div style={{ fontSize: 10, color: "#4A5278", marginTop: 1 }}>{cat.desc}</div>
                                </button>
                              );
                            })}
                            {categories.length > 0 && (
                              <button onClick={() => updateSE({ step: categories.includes("abg") ? "abg" : categories.includes("doors") ? "doors" : "summary" })}
                                style={{ width: "100%", padding: "10px", borderRadius: 6, border: "none", background: "#818CF8", color: "#1A2240", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", marginTop: 4 }}>
                                Next →
                              </button>
                            )}
                          </div>
                        );

                        // ── STEP: ABG UNITS ──
                        if (step === "abg") return (
                          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: "#818CF8" }}>🗑 Abandoned Goods — Unit Breakdown</div>
                              <button onClick={() => updateSE({ step: "category" })} style={{ fontSize: 9, background: "transparent", border: "none", color: "#4A5278", cursor: "pointer", fontFamily: "inherit" }}>← Back</button>
                            </div>
                            <div style={{ fontSize: 10, color: "#4A5278", lineHeight: 1.5 }}>Enter qty and fill % for each size. 5x5 @ 100% ≈ $300.</div>

                            {/* Header */}
                            <div style={{ display: "grid", gridTemplateColumns: "52px 1fr 1fr 60px", gap: "4px 6px", alignItems: "center" }}>
                              <div style={{ fontSize: 9, color: "#4A5278", textTransform: "uppercase" }}>Size</div>
                              <div style={{ fontSize: 9, color: "#4A5278", textTransform: "uppercase" }}># Units</div>
                              <div style={{ fontSize: 9, color: "#4A5278", textTransform: "uppercase" }}>% Full</div>
                              <div style={{ fontSize: 9, color: "#4A5278", textTransform: "uppercase", textAlign: "right" }}>Price</div>

                              {ABG_UNITS.map(u => {
                                const row = abgUnits[u.size] || {};
                                const calc = calcABGRow(u);
                                const hasData = calc.qty > 0;
                                return [
                                  <div key={u.size + "l"} style={{ fontSize: 11, fontWeight: 600, color: "#1A2240" }}>{u.size}</div>,
                                  <input key={u.size + "q"} className="fi" type="number" min="0" placeholder="0"
                                    value={row.qty || ""}
                                    onChange={e => updateSE({ abgUnits: { ...abgUnits, [u.size]: { ...row, qty: e.target.value } } })}
                                    style={{ padding: "6px 8px", fontSize: 12 }} />,
                                  <input key={u.size + "p"} className="fi" type="number" min="0" max="100" placeholder="100"
                                    value={row.pct != null ? row.pct : ""}
                                    onChange={e => updateSE({ abgUnits: { ...abgUnits, [u.size]: { ...row, pct: e.target.value } } })}
                                    style={{ padding: "6px 8px", fontSize: 12 }} />,
                                  <div key={u.size + "p2"} style={{ fontSize: 11, fontWeight: 700, color: hasData ? "#818CF8" : "#CBD1E8", textAlign: "right" }}>
                                    {hasData ? fmt(calc.price) : "—"}
                                  </div>,
                                ];
                              })}
                            </div>

                            {calcABG() > 0 && (
                              <div style={{ background: "#818CF810", border: "1px solid #818CF830", borderRadius: 6, padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: 11, color: "#4A5278" }}>ABG Subtotal</span>
                                <span style={{ fontSize: 14, fontWeight: 700, color: "#818CF8" }}>{fmt(calcABG())}</span>
                              </div>
                            )}
                            <button onClick={() => updateSE({ step: categories.includes("doors") ? "doors" : "summary" })}
                              style={{ width: "100%", padding: "10px", borderRadius: 6, border: "none", background: "#818CF8", color: "#1A2240", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                              Next →
                            </button>
                          </div>
                        );

                        // ── STEP: COILING DOORS ──
                        if (step === "doors") return (
                          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: "#818CF8" }}>🚪 Coiling Doors</div>
                              <button onClick={() => updateSE({ step: categories.includes("abg") ? "abg" : "category" })} style={{ fontSize: 9, background: "transparent", border: "none", color: "#4A5278", cursor: "pointer", fontFamily: "inherit" }}>← Back</button>
                            </div>
                            <div>
                              <div style={{ fontSize: 10, color: "#4A5278", marginBottom: 4 }}>Number of Doors</div>
                              <input className="fi" type="number" min="0" placeholder="0"
                                value={se.doorQty || ""}
                                onChange={e => updateSE({ doorQty: e.target.value })} />
                            </div>
                            <div>
                              <div style={{ fontSize: 10, color: "#4A5278", marginBottom: 6 }}>Spring Type</div>
                              <div style={{ display: "flex", gap: 8 }}>
                                {[
                                  { id: "single", label: "Single Spring", hint: "Small doors (5x5, 5x10)", price: DOOR_PRICE_SINGLE },
                                  { id: "double", label: "Double Spring", hint: "Large doors (10x10+)", price: DOOR_PRICE_DOUBLE },
                                ].map(t => (
                                  <button key={t.id} onClick={() => updateSE({ doorType: t.id })}
                                    style={{ flex: 1, padding: "10px 8px", borderRadius: 7,
                                      border: "1px solid " + (doorType === t.id ? "#3B6FE8" : "#CBD1E8"),
                                      background: doorType === t.id ? "#3B6FE810" : "#FFF",
                                      cursor: "pointer", fontFamily: "inherit", textAlign: "center" }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: doorType === t.id ? "#3B6FE8" : "#1A2240" }}>{t.label}</div>
                                    <div style={{ fontSize: 9, color: "#4A5278", marginTop: 2 }}>{t.hint}</div>
                                    <div style={{ fontSize: 10, color: "#FCD34D", marginTop: 3 }}>{fmt(t.price)}/door</div>
                                  </button>
                                ))}
                              </div>
                            </div>
                            {calcDoors() > 0 && (
                              <div style={{ background: "#818CF810", border: "1px solid #818CF830", borderRadius: 6, padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: 11, color: "#4A5278" }}>Doors Subtotal</span>
                                <span style={{ fontSize: 14, fontWeight: 700, color: "#818CF8" }}>{fmt(calcDoors())}</span>
                              </div>
                            )}
                            <button onClick={() => updateSE({ step: "summary" })}
                              style={{ width: "100%", padding: "10px", borderRadius: 6, border: "none", background: "#818CF8", color: "#1A2240", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                              Next →
                            </button>
                          </div>
                        );

                        // ── STEP: SUMMARY + OVERRIDE ──
                        if (step === "summary") return (
                          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: "#818CF8" }}>📊 Estimate Summary</div>
                              <button onClick={() => updateSE({ step: categories.includes("doors") ? "doors" : categories.includes("abg") ? "abg" : "category" })}
                                style={{ fontSize: 9, background: "transparent", border: "none", color: "#4A5278", cursor: "pointer", fontFamily: "inherit" }}>← Back</button>
                            </div>

                            {/* ABG breakdown */}
                            {categories.includes("abg") && (
                              <div style={{ background: "#ECEEF8", borderRadius: 6, padding: "10px 12px" }}>
                                <div style={{ fontSize: 9, color: "#4A5278", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Abandoned Goods</div>
                                {ABG_UNITS.filter(u => calcABGRow(u).qty > 0).map(u => {
                                  const r = calcABGRow(u);
                                  return (
                                    <div key={u.size} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
                                      <span style={{ color: "#4A5278" }}>{r.qty} × {u.size} @ {r.pct}% full ({r.tons.toFixed(1)} tons)</span>
                                      <span style={{ fontWeight: 700, color: "#1A2240" }}>{fmt(r.price)}</span>
                                    </div>
                                  );
                                })}
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, borderTop: "1px solid #CBD1E8", paddingTop: 5, marginTop: 4 }}>
                                  <span>ABG Total</span><span style={{ color: "#818CF8" }}>{fmt(abgTotal)}</span>
                                </div>
                              </div>
                            )}

                            {/* Doors breakdown */}
                            {categories.includes("doors") && doorTotal > 0 && (
                              <div style={{ background: "#ECEEF8", borderRadius: 6, padding: "10px 12px" }}>
                                <div style={{ fontSize: 9, color: "#4A5278", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Coiling Doors</div>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                                  <span style={{ color: "#4A5278" }}>{doorQty} door{doorQty !== 1 ? "s" : ""} × {doorType} spring @ {fmt(doorType === "double" ? DOOR_PRICE_DOUBLE : DOOR_PRICE_SINGLE)}</span>
                                  <span style={{ fontWeight: 700, color: "#1A2240" }}>{fmt(doorTotal)}</span>
                                </div>
                              </div>
                            )}

                            {/* Grand total */}
                            {calcTotal > 0 && (
                              <div style={{ background: "#818CF815", border: "1px solid #818CF840", borderRadius: 6, padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: 12, fontWeight: 700, color: "#1A2240" }}>Calculator Total</span>
                                <span style={{ fontSize: 16, fontWeight: 800, color: "#818CF8" }}>{fmt(calcTotal)}</span>
                              </div>
                            )}

                            {/* Override */}
                            <div>
                              <div style={{ fontSize: 10, color: "#4A5278", marginBottom: 4 }}>Override Price <span style={{ fontStyle: "italic" }}>(optional)</span></div>
                              <div style={{ position: "relative" }}>
                                <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#4A5278", fontSize: 13 }}>$</span>
                                <input className="fi" type="number" placeholder={calcTotal > 0 ? String(Math.round(calcTotal)) : "0.00"} style={{ paddingLeft: 22 }}
                                  value={se.overridePrice != null ? se.overridePrice : ""}
                                  onChange={e => updateSE({ overridePrice: e.target.value === "" ? null : e.target.value })} />
                              </div>
                              {se.overridePrice != null && <div style={{ fontSize: 10, color: "#FCD34D", marginTop: 3 }}>⚠ Override: using {fmt(Number(se.overridePrice))} instead of {fmt(calcTotal)}</div>}
                            </div>

                            <div>
                              <div style={{ fontSize: 10, color: "#4A5278", marginBottom: 4 }}>Additional Scope Notes</div>
                              <textarea className="fi" rows={2} placeholder="Access notes, conditions, exclusions…"
                                value={se.notes || ""}
                                onChange={e => updateSE({ notes: e.target.value })}
                                style={{ resize: "vertical" }} />
                            </div>

                            {finalPrice > 0 ? (
                              <button onClick={() => {
                                const n = se.overridePrice != null ? Number(se.overridePrice) : calcTotal;
                                const gp = fmGrossProfit(n);
                                const sections = buildProposalSections();
                                update({ selfEstimate: { ...se, step: "summary" }, selfEstimatePrice: String(n), contractValue: n, grossProfit: gp, nte: String(n), vendorNTE: String(fmVendorNTE(n)) });
                                // Open proposal pre-populated with line items
                                setProposalJob({ ...job, contractValue: n, grossProfit: gp });
                                setProposalGrossValue(n);
                                setProposalScope((job.scopeOfWork || job.name || "") + (se.notes ? "\n" + se.notes : ""));
                                setProposalNum("");
                                setProposalExtras({ laborBurden: 0, salesTax: 0, generalLiability: 0, permitCost: 0 });
                                setProposalSections(sections);
                                setShowProposal(true);
                                update({ stage: "generate_proposal" });
                              }} style={{ width: "100%", padding: "11px", borderRadius: 6, border: "none", background: "#818CF8", color: "#1A2240", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                                ✨ Use {fmt(finalPrice)} → Open Proposal
                              </button>
                            ) : (
                              <div style={{ fontSize: 10, color: "#3D4570", fontStyle: "italic" }}>Fill in quantities above or enter an override price</div>
                            )}
                          </div>
                        );

                        return null;
                      })()}

                    </div>
                  );
                })()}

                {/* ── WAITING FOR QUOTE panel ── */}
                {job.stage === "waiting_quote" && (() => {
                  const nte = Number(job.contractValue || 0);
                  const vendorNTE = job.vendorNTE ? Number(job.vendorNTE) : fmVendorNTE(nte);
                  const quotePrice = Number(job.vendorQuotePrice || 0);
                  const withinNTE = quotePrice > 0 && quotePrice <= vendorNTE;
                  return (
                    <div style={{ background: "#F0F2F8", border: "1px solid #A78BFA40", borderRadius: 8, padding: "14px" }}>
                      <div style={{ fontSize: 10, color: "#A78BFA", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 700, marginBottom: 12 }}>⏳ Waiting for Quote</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {/* Vendor NTE prominently displayed */}
                        <div style={{ background: "#FCD34D10", border: "1px solid #FCD34D30", borderRadius: 6, padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <div style={{ fontSize: 9, color: "#FCD34D", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>Vendor Approved For</div>
                            <div style={{ fontSize: 20, fontWeight: 700, color: "#FCD34D" }}>{fmt(vendorNTE)}</div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: 9, color: "#4A5278", marginBottom: 2 }}>Our Gross Value</div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#1A2240" }}>{fmt(nte)}</div>
                            <div style={{ fontSize: 9, color: "#4ADE80" }}>GP: {fmt(fmGrossProfit(nte))}</div>
                          </div>
                        </div>
                        {job.subSentAt && <div style={{ fontSize: 10, color: "#353C62" }}>📤 Sent: {new Date(job.subSentAt).toLocaleDateString()}</div>}
                        <div>
                          <div style={{ fontSize: 10, color: "#4A5278", marginBottom: 4 }}>Quote Received — Price</div>
                          <input className="fi" type="number" placeholder="Sub's quoted price"
                            value={job.vendorQuotePrice || ""}
                            onChange={e => update({ vendorQuotePrice: e.target.value })} />
                        </div>
                        <div>
                          <div style={{ fontSize: 10, color: "#4A5278", marginBottom: 4 }}>Quote Scope</div>
                          <textarea className="fi" rows={2} placeholder="What the sub quoted…"
                            value={job.vendorQuoteScope || ""}
                            onChange={e => update({ vendorQuoteScope: e.target.value })}
                            style={{ resize: "vertical" }} />
                        </div>
                        {quotePrice > 0 && (
                          <div style={{ background: withinNTE ? "#4ADE8015" : "#F8717115", border: "1px solid " + (withinNTE ? "#4ADE8030" : "#F8717130"), borderRadius: 6, padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: "#1A2240" }}>Quote: {fmt(quotePrice)}</span>
                            <span style={{ fontSize: 11, color: withinNTE ? "#4ADE80" : "#F87171", fontWeight: 600 }}>
                              {withinNTE ? "✓ Within vendor NTE" : "⚠ Exceeds vendor NTE by " + fmt(quotePrice - vendorNTE)}
                            </span>
                          </div>
                        )}
                        {(() => {
                          const hasPrice = quotePrice > 0;
                          const hasScope = !!(job.vendorQuoteScope || "").trim();
                          const ready = hasPrice && hasScope;
                          return (
                            <button onClick={() => ready && update({ stage: "generate_proposal" })}
                              style={{ width: "100%", padding: "10px", borderRadius: 6, border: ready ? "none" : "1px solid #3D4570", cursor: ready ? "pointer" : "not-allowed", fontFamily: "inherit", fontSize: 12, fontWeight: 700,
                                background: ready ? "#C084FC" : "transparent", color: ready ? "#1A2240" : "#4A5278", transition: "all 0.2s" }}>
                              {ready ? "→ Generate Proposal" : "Enter price + scope to continue"}
                            </button>
                          );
                        })()}
                      </div>
                    </div>
                  );
                })()}

                {/* ── GENERATE PROPOSAL panel ── */}
                {job.stage === "generate_proposal" && (
                  <div style={{ background: "#F0F2F8", border: "1px solid #C084FC40", borderRadius: 8, padding: "14px" }}>
                    <div style={{ fontSize: 10, color: "#C084FC", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 700, marginBottom: 12 }}>📄 Generate Proposal</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <div className="g2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <div>
                          <div style={{ fontSize: 10, color: "#4A5278", marginBottom: 4 }}>Work Order #</div>
                          <input className="fi" placeholder="WO-260311-00207"
                            value={job.ownersProjectNo || ""}
                            onChange={e => update({ ownersProjectNo: e.target.value })} />
                        </div>
                        <div>
                          <div style={{ fontSize: 10, color: "#4A5278", marginBottom: 4 }}>Proposal #</div>
                          <input className="fi" placeholder="e.g. PROP-2026-001"
                            value={proposalNum}
                            onChange={e => setProposalNum(e.target.value)} />
                        </div>
                      </div>
                      <button
                        onClick={() => { initProposal(job); }}
                        style={{ width: "100%", padding: "10px", borderRadius: 6, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 700, background: "#C084FC", color: "#1A2240" }}>
                        ✨ Generate Proposal
                      </button>
                      <button onClick={() => update({ stage: "owner_approval", pmPingedAt: new Date().toISOString() })}
                        style={{ width: "100%", padding: "9px", borderRadius: 6, border: "1px solid #60A5FA40", cursor: "pointer", fontFamily: "inherit", fontSize: 11, background: "transparent", color: "#60A5FA" }}>
                        → Send to Owner Approval
                      </button>
                    </div>
                  </div>
                )}
                {/* Vendor shown read-only when assigned via Known Vendor path */}
                {sub && (
                  <div>
                    <div style={{ fontSize: 10, color: "#4A5278", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>Assigned Vendor</div>
                    <div style={{ background: "#F0F2F8", borderRadius: 6, padding: "8px 12px", border: "1px solid #CBD1E8" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#1A2240", marginBottom: 4 }}>{sub.name}</div>
                      {(() => {
                        const coiDate = sub.coiExpiry ? new Date(sub.coiExpiry) : null;
                        const coiExpiring = coiDate && coiDate > new Date() && coiDate <= new Date(Date.now() + 30*86400000);
                        const coiExpired  = coiDate && coiDate < new Date();
                        return (
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 10, background: sub.msaStatus === "signed" ? "#4ADE8015" : "#F8717115", color: sub.msaStatus === "signed" ? "#4ADE80" : "#F87171", padding: "2px 7px", borderRadius: 4 }}>MSA: {sub.msaStatus}</span>
                            <span style={{ fontSize: 10, background: coiExpired ? "#F8717115" : coiExpiring ? "#FCD34D15" : "#4ADE8015", color: coiExpired ? "#F87171" : coiExpiring ? "#FCD34D" : "#4ADE80", padding: "2px 7px", borderRadius: 4 }}>COI: {sub.coiExpiry || "none"}</span>
                            <span style={{ fontSize: 10, background: sub.w9 ? "#4ADE8015" : "#F8717115", color: sub.w9 ? "#4ADE80" : "#F87171", padding: "2px 7px", borderRadius: 4 }}>W9: {sub.w9 ? "✓" : "Missing"}</span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* ── Vendor Status (auto-derived, read-only) ── */}
                {job.subcontractorId && (() => {
                  const vps = job.vendorPortalStatus;
                  const stage = job.stage;
                  // Derive status from actual job state
                  let label, color, bg, border, detail = null;
                  if (vps === "scheduled" || stage === "do_work") {
                    label = "✅ Scheduled";
                    color = "#4ADE80"; bg = "#4ADE8010"; border = "#4ADE8030";
                    if (job.vendorPortalDate) detail = job.vendorPortalDate + (job.vendorPortalTime ? " @ " + job.vendorPortalTime : "");
                  } else if (vps === "quote_submitted") {
                    label = "📋 Quote Submitted — Needs Review";
                    color = "#F87171"; bg = "#F8717110"; border = "#F8717130";
                    if (job.vendorPortalPrice) detail = "Price: " + fmt(Number(job.vendorPortalPrice));
                  } else if (vps === "pending" || job.vendorSentAt) {
                    label = "⏳ Portal Link Sent — Awaiting Response";
                    color = "#FCD34D"; bg = "#FCD34D10"; border = "#FCD34D30";
                    if (job.vendorSentAt) detail = "Sent " + new Date(job.vendorSentAt).toLocaleDateString();
                  } else if (stage === "bill") {
                    label = "🧾 Work Complete — Awaiting Invoice";
                    color = "#F97316"; bg = "#F9731610"; border = "#F9731630";
                  } else if (stage === "buyout") {
                    label = "📝 In Buyout";
                    color = "#FCD34D"; bg = "#FCD34D10"; border = "#FCD34D30";
                  } else if (stage === "owner_approval") {
                    label = "🔒 Awaiting Owner Approval";
                    color = "#60A5FA"; bg = "#60A5FA10"; border = "#60A5FA30";
                  } else if (stage === "generate_proposal") {
                    label = "📄 Proposal Being Generated";
                    color = "#C084FC"; bg = "#C084FC10"; border = "#C084FC30";
                  } else if (stage === "waiting_quote") {
                    label = "⏳ Waiting for Quote";
                    color = "#A78BFA"; bg = "#A78BFA10"; border = "#A78BFA30";
                  } else if (stage === "estimating") {
                    label = "📋 In Estimating";
                    color = "#818CF8"; bg = "#818CF810"; border = "#818CF830";
                  } else {
                    return null;
                  }
                  return (
                    <div style={{ background: bg, border: "1px solid " + border, borderRadius: 8, padding: "10px 14px" }}>
                      <div style={{ fontSize: 10, color: "#4A5278", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>Vendor Status</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color }}>{label}</div>
                      {detail && <div style={{ fontSize: 11, color: "#4A5278", marginTop: 3 }}>{detail}</div>}
                      {job.vendorPortalNote && (vps === "scheduled" || vps === "quote_submitted") && (
                        <div style={{ fontSize: 10, color: "#4A5278", marginTop: 3, fontStyle: "italic" }}>{job.vendorPortalNote}</div>
                      )}
                    </div>
                  );
                })()}

                {/* Financials */}
                <div style={{ background: "#F0F2F8", borderRadius: 8, padding: "12px 14px", border: "1px solid #CBD1E8", display: "flex", gap: 20 }}>
                  <div>
                    <div style={{ fontSize: 9, color: "#4A5278", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>Gross Value</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#1A2240" }}>{fmt(job.contractValue)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 9, color: "#4A5278", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>Gross Profit</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#4ADE80" }}>{fmt(job.grossProfit)}</div>
                  </div>
                  {job.vendorNTE && <div>
                    <div style={{ fontSize: 9, color: "#FCD34D", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>Vendor NTE</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#FCD34D" }}>{fmt(Number(job.vendorNTE))}</div>
                  </div>}
                </div>

                {/* Notes */}
                {job.notes && <div style={{ fontSize: 12, color: "#6B7694", lineHeight: 1.6, background: "#F0F2F8", padding: "10px 12px", borderRadius: 6, border: "1px solid #CBD1E8" }}>{job.notes}</div>}

                {/* Photos */}
                <div>
                  <div style={{ fontSize: 10, color: "#4A5278", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>📸 Site Photos</span>
                    <span style={{ color: "#3D4570" }}>{(job.photos||[]).length} photo{(job.photos||[]).length !== 1 ? "s" : ""} · shown to sub after accept</span>
                  </div>
                  {(job.photos||[]).length > 0 && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginBottom: 8 }}>
                      {(job.photos||[]).map((p, i) => (
                        <div key={i} style={{ position: "relative" }}>
                          <img src={p.data} alt={p.name} style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 6, display: "block" }} />
                          <button onClick={() => update({ photos: job.photos.filter((_,j) => j !== i) })}
                            style={{ position: "absolute", top: 3, right: 3, width: 18, height: 18, borderRadius: "50%", border: "none", background: "#F87171CC", color: "#FFF", fontSize: 9, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                  <label style={{ display: "block", padding: "8px 12px", borderRadius: 6, border: "1px dashed #3D4570", textAlign: "center", cursor: "pointer", fontSize: 11, color: "#4A5278" }}>
                    + Add Photos
                    <input type="file" accept="image/*" multiple style={{ display: "none" }} onChange={e => {
                      const files = Array.from(e.target.files);
                      Promise.all(files.map(f => new Promise(res => {
                        const r = new FileReader();
                        r.onload = ev => res({ data: ev.target.result, name: f.name });
                        r.readAsDataURL(f);
                      }))).then(newPhotos => update({ photos: [...(job.photos||[]), ...newPhotos] }));
                      e.target.value = "";
                    }} />
                  </label>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn-ghost" style={{ flex: 1 }} onClick={() => { openEditFm(job); setSelectedFmJob(null); }}>✎ Full Edit</button>
                  <button className="btn-ghost" style={{ color: "#F87171", borderColor: "#F8717120" }} onClick={() => deleteFm(job.id)}>✕</button>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ── CAPEX JOB FORM ── */}
      {showCapexForm && (
        <div className="modal-bg" onClick={e => e.target === e.currentTarget && setShowCapexForm(false)}>
          <div className="modal fade-in">
            <div style={{ fontSize: 16, fontWeight: 700, color: "#1A2240", marginBottom: 22, textTransform: "uppercase" }}>{editCapexId ? "Edit CapEx Job" : "Add CapEx Job"}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div><label className="lbl">Job Name *</label><input className="fi" value={capexForm.name} onChange={e => setCapexForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. HVAC Upgrade" /></div>
              <div className="g2">
                <div><label className="lbl">Company</label>
                  <select className="fi" value={capexForm.companyId} onChange={e => setCapexForm(f => ({ ...f, companyId: e.target.value, siteId: "" }))}>
                    <option value="">Select company…</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div><label className="lbl">Site</label>
                  <select className="fi" value={capexForm.siteId} onChange={e => setCapexForm(f => ({ ...f, siteId: e.target.value }))}>
                    <option value="">Select site…</option>
                    {sites.filter(s => !capexForm.companyId || s.companyId === capexForm.companyId).map(s => <option key={s.id} value={s.id}>Store #{s.storeNumber} — {s.address}</option>)}
                  </select>
                </div>
              </div>
              <div className="g2">
                <div><label className="lbl">Contract Value</label><input className="fi" type="number" value={capexForm.contractValue} onChange={e => setCapexForm(f => ({ ...f, contractValue: e.target.value }))} /></div>
                <div><label className="lbl">Project Manager</label><input className="fi" value={capexForm.pm} onChange={e => setCapexForm(f => ({ ...f, pm: e.target.value }))} /></div>
              </div>
              <div><label className="lbl">Stage</label>
                <select className="fi" value={capexForm.stage} onChange={e => setCapexForm(f => ({ ...f, stage: e.target.value }))}>
                  {CAPEX_FM_STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>
              {/* Stage-specific action date */}
              {(() => { const st = CAPEX_FM_STAGES.find(s => s.id === capexForm.stage); return st ? (
                <div><label className="lbl">{st.actionLabel}</label><input className="fi" type="date" value={capexForm[st.actionKey] || ""} onChange={e => setCapexForm(f => ({ ...f, [st.actionKey]: e.target.value }))} /></div>
              ) : null; })()}
              {capexForm.stage === "do_work" && (
                <>
                  <div className="g2">
                    <div><label className="lbl">Start Date</label><input className="fi" type="date" value={capexForm.startDate} onChange={e => setCapexForm(f => ({ ...f, startDate: e.target.value }))} /></div>
                    <div><label className="lbl">End Date</label>  <input className="fi" type="date" value={capexForm.endDate}   onChange={e => setCapexForm(f => ({ ...f, endDate:   e.target.value }))} /></div>
                  </div>
                  <div><label className="lbl">% Complete — {capexForm.pct || 0}%</label><input type="range" min="0" max="100" value={capexForm.pct || 0} onChange={e => setCapexForm(f => ({ ...f, pct: e.target.value }))} /></div>
                </>
              )}
              <div><label className="lbl">Notes</label><textarea className="fi" rows={3} value={capexForm.notes} onChange={e => setCapexForm(f => ({ ...f, notes: e.target.value }))} style={{ resize: "vertical" }} /></div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button className="btn-ghost"   style={{ padding: "8px 16px" }} onClick={() => setShowCapexForm(false)}>Cancel</button>
                <button className="btn-primary" onClick={saveCapex}>{editCapexId ? "Save Changes" : "Add Job"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── FM JOB FORM ── */}
      {showFmForm && (
        <div className="modal-bg" onClick={e => e.target === e.currentTarget && (setShowFmForm(false), setFmCompanySearch(""), setFmSiteSearch(""))}>
          <div className="modal fade-in" style={{ maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#1A2240", marginBottom: 22, textTransform: "uppercase" }}>{editFmId ? "Edit FM Job" : "Add FM Job"}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div><label className="lbl">Scope of Work / Job Name *</label><input className="fi" value={fmForm.name} onChange={e => setFmForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Door Lock Replacement" /></div>
              <div className="g2">
                <div><label className="lbl">Store Code</label><input className="fi" value={fmForm.storeCode} onChange={e => setFmForm(f => ({ ...f, storeCode: e.target.value }))} placeholder="e.g. CS 4308" /></div>
                <div><label className="lbl">Project No.</label><input className="fi" value={fmForm.projectNo} onChange={e => setFmForm(f => ({ ...f, projectNo: e.target.value }))} placeholder="e.g. 260520" /></div>
              </div>
              <div className="g2">
                <div><label className="lbl">Owner's Project No.</label><input className="fi" value={fmForm.ownersProjectNo} onChange={e => setFmForm(f => ({ ...f, ownersProjectNo: e.target.value }))} placeholder="e.g. WO-251117-00832" /></div>
                <div><label className="lbl">Coordinator</label>
                  <select className="fi" value={fmForm.coordinator} onChange={e => setFmForm(f => ({ ...f, coordinator: e.target.value }))}>
                    <option value="">Unassigned</option>
                    {fmTeam.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="g2">
                <div style={{ position: "relative" }}><label className="lbl">Company</label>
                  <input className="fi" value={fmCompanySearch || (companies.find(c => c.id === fmForm.companyId)?.name || "")}
                    onChange={e => { setFmCompanySearch(e.target.value); if (!e.target.value) setFmForm(f => ({ ...f, companyId: "", siteId: "" })); }}
                    placeholder="Type company name…" autoComplete="off" />
                  {fmCompanySearch && (() => {
                    const matches = companies.filter(c => c.name.toLowerCase().includes(fmCompanySearch.toLowerCase())).slice(0, 8);
                    if (!matches.length) return null;
                    return (
                      <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #CBD1E8", borderRadius: 6, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", zIndex: 200, maxHeight: 200, overflowY: "auto" }}>
                        {matches.map(c => (
                          <div key={c.id} style={{ padding: "8px 12px", cursor: "pointer", fontSize: 13, color: "#1A2240" }}
                            onMouseDown={() => { setFmForm(f => ({ ...f, companyId: c.id, siteId: "" })); setFmCompanySearch(""); setFmSiteSearch(""); }}>
                            {c.name}
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
                <div style={{ position: "relative" }}><label className="lbl">Site — Type store # to search</label>
                  <input className="fi"
                    value={fmSiteSearch !== "" ? fmSiteSearch : (fmForm.siteId ? (() => { const s = sites.find(x => x.id === fmForm.siteId); return s ? "Store #" + s.storeNumber + (s.address ? " — " + s.address : "") : ""; })() : "")}
                    onChange={e => { setFmSiteSearch(e.target.value); if (!e.target.value) setFmForm(f => ({ ...f, siteId: "" })); }}
                    placeholder={fmForm.companyId ? "Type store # or address…" : "Select company first…"}
                    disabled={!fmForm.companyId} autoComplete="off" />
                  {fmSiteSearch && fmForm.companyId && (() => {
                    const q = fmSiteSearch.toLowerCase();
                    const matches = sites.filter(s => s.companyId === fmForm.companyId && ((s.storeNumber||"").toLowerCase().includes(q) || (s.address||"").toLowerCase().includes(q))).slice(0, 10);
                    if (!matches.length) return <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #CBD1E8", borderRadius: 6, padding: "10px 12px", fontSize: 12, color: "#4A5278", zIndex: 200 }}>No sites match "{fmSiteSearch}"</div>;
                    return (
                      <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #CBD1E8", borderRadius: 6, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", zIndex: 200, maxHeight: 220, overflowY: "auto" }}>
                        {matches.map(s => (
                          <div key={s.id} style={{ padding: "8px 12px", cursor: "pointer", fontSize: 13, borderBottom: "1px solid #F0F2F8" }}
                            onMouseDown={() => { setFmForm(f => ({ ...f, siteId: s.id, storeCode: s.storeNumber ? "Store #" + s.storeNumber : f.storeCode })); setFmSiteSearch(""); }}>
                            <span style={{ fontWeight: 700, color: "#3B6FE8" }}>#{s.storeNumber}</span>
                            <span style={{ color: "#4A5278", marginLeft: 8, fontSize: 12 }}>{s.address}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
              <div><label className="lbl">Subcontractor / Vendor</label>
                <select className="fi" value={fmForm.subcontractorId} onChange={e => setFmForm(f => ({ ...f, subcontractorId: e.target.value }))}>
                  <option value="">Unassigned</option>
                  {subcontractors.map(s => <option key={s.id} value={s.id}>{s.name}{s.trade ? " — " + s.trade : ""}</option>)}
                </select>
              </div>
              <div className="g2">
                <div><label className="lbl">Gross Value</label><input className="fi" type="number" value={fmForm.contractValue} onChange={e => setFmForm(f => ({ ...f, contractValue: e.target.value }))} /></div>
                <div><label className="lbl">Gross Profit</label><input className="fi" type="number" value={fmForm.grossProfit} onChange={e => setFmForm(f => ({ ...f, grossProfit: e.target.value }))} /></div>
              </div>
              <div className="g2">
                <div><label className="lbl">Vendor Invoice Amount</label><input className="fi" type="number" value={fmForm.vendorInvoiceAmount} onChange={e => setFmForm(f => ({ ...f, vendorInvoiceAmount: e.target.value }))} /></div>
                <div><label className="lbl">Vendor Invoice Number</label><input className="fi" value={fmForm.vendorInvoiceNumber} onChange={e => setFmForm(f => ({ ...f, vendorInvoiceNumber: e.target.value }))} placeholder="e.g. INV-2024" /></div>
              </div>
              <div><label className="lbl">Stage</label>
                <select className="fi" value={fmForm.stage} onChange={e => setFmForm(f => ({ ...f, stage: e.target.value }))}>
                  <optgroup label="Pipeline">
                    {FM_PIPELINE_STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </optgroup>
                  <optgroup label="Active Jobs">
                    {FM_ACTIVE_STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </optgroup>
                </select>
              </div>
              {(() => { const st = FM_STAGES.find(s => s.id === fmForm.stage); return st ? (
                <div><label className="lbl">{st.actionLabel}</label><input className="fi" type="date" value={fmForm[st.actionKey] || ""} onChange={e => setFmForm(f => ({ ...f, [st.actionKey]: e.target.value }))} /></div>
              ) : null; })()}
              <div className="g2">
                <div><label className="lbl">Start Work Date</label><input className="fi" type="date" value={fmForm.startDate} onChange={e => setFmForm(f => ({ ...f, startDate: e.target.value }))} /></div>
                <div><label className="lbl">End Date</label><input className="fi" type="date" value={fmForm.endDate} onChange={e => setFmForm(f => ({ ...f, endDate: e.target.value }))} /></div>
              </div>
              <div><label className="lbl">Vendor Next Step</label>
                <select className="fi" value={fmForm.vendorNextStep} onChange={e => setFmForm(f => ({ ...f, vendorNextStep: e.target.value }))}>
                  <option value="">— Select —</option>
                  {VENDOR_NEXT_STEPS.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
                </select>
              </div>
              {fmForm.vendorNextStep === "need_quote" && (
                <div style={{ background: "#F0F2F8", border: "1px solid #A78BFA40", borderRadius: 8, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ fontSize: 10, color: "#A78BFA", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600 }}>Quote Details</div>
                  <div className="g2">
                    <div><label className="lbl">Quote Price</label><input className="fi" type="number" placeholder="0.00" value={fmForm.vendorQuotePrice} onChange={e => setFmForm(f => ({ ...f, vendorQuotePrice: e.target.value }))} /></div>
                  </div>
                  <div><label className="lbl">Quote Scope</label><textarea className="fi" rows={2} value={fmForm.vendorQuoteScope} onChange={e => setFmForm(f => ({ ...f, vendorQuoteScope: e.target.value }))} style={{ resize: "vertical" }} /></div>
                </div>
              )}
              <div><label className="lbl">Notes</label><textarea className="fi" rows={3} value={fmForm.notes} onChange={e => setFmForm(f => ({ ...f, notes: e.target.value }))} style={{ resize: "vertical" }} /></div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button className="btn-ghost" style={{ padding: "8px 16px" }} onClick={() => { setShowFmForm(false); setFmCompanySearch(""); setFmSiteSearch(""); }}>Cancel</button>
                <button className="btn-primary" onClick={saveFm}>{editFmId ? "Save Changes" : "Add Job"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── LAWN/SNOW SITE SIDE PANEL ── */}
      {selectedLsSite && (() => {
        const slCo  = companies.find(c => c.id === selectedLsSite.companyId);
        const slBid = getLawnBid(selectedLsSite.id);
        const slSub = slBid?.selectedSubId ? subcontractors.find(x => x.id === slBid.selectedSubId) : slBid?.subcontractorIds?.[0] ? subcontractors.find(x => x.id === slBid.subcontractorIds[0]) : null;
        const slStatus = slBid?.status || "bidding";
        const slStatusMeta = LAWN_BID_STATUSES.find(s => s.id === slStatus) || LAWN_BID_STATUSES[0];
        const STAGES = [
          { id: "bidding",        label: "Bidding",        color: "#FCD34D" },
          { id: "proposed",       label: "Proposed",       color: "#60A5FA" },
          { id: "owner_approved", label: "Owner Approved", color: "#4ADE80" },
          { id: "contracted",     label: "Contracted",     color: "#A78BFA" },
        ];
        const stageIdx = STAGES.findIndex(s => s.id === slStatus);
        return (
          <div className="side-panel slide-in">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#1A2240", textTransform: "uppercase", letterSpacing: "0.06em" }}>{activeBU === "lawn" ? "🌿 Lawn Site" : "❄️ Snow Site"}</div>
              <button className="btn-ghost" onClick={() => setSelectedLsSite(null)}>✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Site identity */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: companyColorMap[selectedLsSite.companyId] || "#4A5278", flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 15, color: "#1A2240", fontWeight: 600 }}>{selectedLsSite.storeNumber ? "Store #" + selectedLsSite.storeNumber : selectedLsSite.address}</div>
                  {slCo && <div style={{ fontSize: 11, color: "#3B6FE8" }}>{slCo.name}</div>}
                </div>
              </div>

              {/* Site details */}
              <div style={{ background: "#F0F2F8", borderRadius: 8, padding: "12px 14px", border: "1px solid #CBD1E8", display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { label: "Address",     value: selectedLsSite.address || "—" },
                  { label: "Phone",       value: selectedLsSite.phone   || "—" },
                  { label: "Coordinates", value: selectedLsSite.lat ? selectedLsSite.lat.toFixed(4) + ", " + selectedLsSite.lng.toFixed(4) : "Not geocoded" },
                ].map(r => (
                  <div key={r.label} style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ fontSize: 11, color: "#4A5278", flexShrink: 0 }}>{r.label}</span>
                    <span style={{ fontSize: 11, color: "#252E52", textAlign: "right", wordBreak: "break-all" }}>{r.value}</span>
                  </div>
                ))}
              </div>

              {/* Bid stage pipeline */}
              {slBid && (
                <div style={{ background: "#F0F2F8", borderRadius: 8, padding: "12px 14px", border: "1px solid #CBD1E8" }}>
                  <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#4A5278", marginBottom: 10 }}>Bid Stage</div>
                  <div style={{ display: "flex", gap: 0, alignItems: "center" }}>
                    {STAGES.map((st, i) => {
                      const active = i <= stageIdx;
                      return (
                        <div key={st.id} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                          <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                            {i > 0 && <div style={{ flex: 1, height: 2, background: active ? st.color : "#CBD1E8" }} />}
                            <div style={{ width: 10, height: 10, borderRadius: "50%", background: i <= stageIdx ? STAGES[Math.min(stageIdx, i)].color : "#CBD1E8", border: "2px solid " + (i === stageIdx ? STAGES[stageIdx].color : "#CBD1E8"), flexShrink: 0 }} />
                            {i < STAGES.length - 1 && <div style={{ flex: 1, height: 2, background: i < stageIdx ? STAGES[stageIdx].color : "#CBD1E8" }} />}
                          </div>
                          <div style={{ fontSize: 8, color: i === stageIdx ? STAGES[stageIdx].color : "#3D4570", letterSpacing: "0.06em", textAlign: "center", lineHeight: 1.2 }}>{st.label.toUpperCase()}</div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 4, background: slStatusMeta.color + "20", color: slStatusMeta.color, fontWeight: 600 }}>{slStatusMeta.label}</span>
                    {slBid.locked && <span style={{ fontSize: 10, color: "#A78BFA", background: "#A78BFA15", padding: "3px 8px", borderRadius: 4 }}>🔒 Locked</span>}
                  </div>
                </div>
              )}
              {!slBid && (
                <div style={{ background: "#F0F2F8", borderRadius: 8, padding: "10px 14px", border: "1px solid #CBD1E8", fontSize: 11, color: "#4A5278", textAlign: "center" }}>No bid started — go to Bids tab to create one</div>
              )}

              {/* Subcontractor */}
              <div style={{ background: "#F0F2F8", borderRadius: 8, padding: "12px 14px", border: "1px solid #CBD1E8" }}>
                <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#4A5278", marginBottom: 8 }}>Subcontractor</div>
                {slSub ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#1A2240" }}>{slSub.name}</div>
                    {slSub.phone && <div style={{ fontSize: 11, color: "#4A5278" }}>📞 {slSub.phone}</div>}
                    {slSub.email && <div style={{ fontSize: 11, color: "#3B6FE8" }}>✉ {slSub.email}</div>}
                    <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
                      {slSub.msaStatus && <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 3, background: slSub.msaStatus === "signed" ? "#4ADE8020" : "#FCD34D20", color: slSub.msaStatus === "signed" ? "#4ADE80" : "#FCD34D" }}>MSA: {slSub.msaStatus}</span>}
                      {slSub.coiExpiry && <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 3, background: "#60A5FA15", color: "#60A5FA" }}>COI: {slSub.coiExpiry}</span>}
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: 11, color: "#4A5278" }}>No contractor assigned</div>
                )}
              </div>

              {/* Contract links */}
              {slBid && (
                <div style={{ background: "#F0F2F8", borderRadius: 8, padding: "12px 14px", border: "1px solid #CBD1E8" }}>
                  <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#4A5278", marginBottom: 8 }}>Contracts</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    {slBid.subcontractUrl ? (
                      <a href={slBid.subcontractUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "#60A5FA", textDecoration: "none", display: "flex", alignItems: "center", gap: 5 }}>
                        📄 Subcontract <span style={{ fontSize: 10, color: "#4A5278" }}>→</span>
                      </a>
                    ) : (
                      <div style={{ fontSize: 11, color: "#4A5278" }}>📄 Subcontract — not uploaded</div>
                    )}
                    {slBid.ownerContractUrl ? (
                      <a href={slBid.ownerContractUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "#A78BFA", textDecoration: "none", display: "flex", alignItems: "center", gap: 5 }}>
                        📋 Owner Contract <span style={{ fontSize: 10, color: "#4A5278" }}>→</span>
                      </a>
                    ) : (
                      <div style={{ fontSize: 11, color: "#4A5278" }}>📋 Owner Contract — not uploaded</div>
                    )}
                  </div>
                </div>
              )}

              {selectedLsSite.accessCode && (
                <div style={{ background: "#FCD34D15", border: "1px solid #FCD34D40", borderRadius: 8, padding: "12px 14px" }}>
                  <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#4A5278", marginBottom: 4 }}>Access Code</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#FCD34D", letterSpacing: "0.15em" }}>{selectedLsSite.accessCode}</div>
                </div>
              )}
              {selectedLsSite.notes && <div style={{ fontSize: 12, color: "#6B7694", lineHeight: 1.6, background: "#F0F2F8", padding: "10px 12px", borderRadius: 6, border: "1px solid #CBD1E8" }}>{selectedLsSite.notes}</div>}

              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn-ghost" style={{ flex: 1 }} onClick={() => { openEditLsSite(selectedLsSite); setSelectedLsSite(null); }}>✎ Edit</button>
                <button className="btn-ghost" style={{ color: "#F87171", borderColor: "#F8717120" }} onClick={() => deleteLsSite(selectedLsSite.id)}>✕</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── LAWN/SNOW SITE FORM ── */}
      {showLsSiteForm && (
        <div className="modal-bg" onClick={e => e.target === e.currentTarget && setShowLsSiteForm(false)}>
          <div className="modal fade-in">
            <div style={{ fontSize: 16, fontWeight: 700, color: "#1A2240", marginBottom: 22, textTransform: "uppercase" }}>{editLsSiteId ? "Edit Site" : "Add Site"}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div><label className="lbl">Company</label>
                <select className="fi" value={lsSiteForm.companyId} onChange={e => setLsSiteForm(f => ({ ...f, companyId: e.target.value }))}>
                  <option value="">Select company…</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="g2">
                <div><label className="lbl">Store Number</label><input className="fi" value={lsSiteForm.storeNumber} onChange={e => setLsSiteForm(f => ({ ...f, storeNumber: e.target.value }))} placeholder="e.g. 1042" /></div>
                <div><label className="lbl">Phone</label><input className="fi" value={lsSiteForm.phone} onChange={e => setLsSiteForm(f => ({ ...f, phone: e.target.value }))} placeholder="(555) 000-0000" /></div>
              </div>
              <div>
                <label className="lbl">Address</label>
                <input
                  className="fi"
                  value={lsSiteForm.address}
                  onChange={e => setLsSiteForm(f => ({ ...f, address: e.target.value }))}
                  onBlur={async e => {
                    const addr = e.target.value.trim();
                    if (!addr || lsSiteForm.lat) return; // skip if empty or already has coords
                    setLsGeocoding(true);
                    try {
                      const res = await fetch("https://nominatim.openstreetmap.org/search?format=json&limit=1&q=" + encodeURIComponent(addr));
                      const geo = await res.json();
                      if (geo[0]) {
                        setLsSiteForm(f => ({ ...f, lat: parseFloat(geo[0].lat).toFixed(6), lng: parseFloat(geo[0].lon).toFixed(6) }));
                      }
                    } catch(e) {}
                    setLsGeocoding(false);
                  }}
                  placeholder="123 Main St, City, State"
                />
              </div>
              <div><label className="lbl">Access Code</label><input className="fi" value={lsSiteForm.accessCode} onChange={e => setLsSiteForm(f => ({ ...f, accessCode: e.target.value }))} placeholder="Gate / door code" /></div>
              <div style={{ background: "#F0F2F8", border: "1px solid #CBD1E8", borderRadius: 8, padding: "10px 14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <label className="lbl" style={{ margin: 0 }}>Coordinates</label>
                  {lsGeocoding && <span style={{ fontSize: 10, color: "#60A5FA", display: "flex", alignItems: "center", gap: 5 }}>⏳ Looking up address…</span>}
                  {!lsGeocoding && lsSiteForm.lat && lsSiteForm.lng && <span style={{ fontSize: 10, color: "#4ADE80" }}>✓ Coordinates found</span>}
                  {!lsGeocoding && lsSiteForm.address && (!lsSiteForm.lat || !lsSiteForm.lng) && (
                    <button onClick={async () => {
                      const addr = lsSiteForm.address.trim();
                      if (!addr) return;
                      setLsGeocoding(true);
                      try {
                        const res = await fetch("https://nominatim.openstreetmap.org/search?format=json&limit=1&q=" + encodeURIComponent(addr));
                        const geo = await res.json();
                        if (geo[0]) setLsSiteForm(f => ({ ...f, lat: parseFloat(geo[0].lat).toFixed(6), lng: parseFloat(geo[0].lon).toFixed(6) }));
                      } catch(e) {}
                      setLsGeocoding(false);
                    }} style={{ fontSize: 10, color: "#60A5FA", background: "#60A5FA15", border: "1px solid #60A5FA30", borderRadius: 4, padding: "2px 8px", cursor: "pointer", fontFamily: "inherit" }}>🔍 Look up</button>
                  )}
                </div>
                <div className="g2">
                  <div><label className="lbl">Latitude</label><input className="fi" type="number" step="0.000001" value={lsSiteForm.lat} onChange={e => setLsSiteForm(f => ({ ...f, lat: e.target.value }))} placeholder="Auto-filled from address" /></div>
                  <div><label className="lbl">Longitude</label><input className="fi" type="number" step="0.000001" value={lsSiteForm.lng} onChange={e => setLsSiteForm(f => ({ ...f, lng: e.target.value }))} placeholder="Auto-filled from address" /></div>
                </div>
              </div>
              <div><label className="lbl">Notes</label><textarea className="fi" rows={3} value={lsSiteForm.notes} onChange={e => setLsSiteForm(f => ({ ...f, notes: e.target.value }))} style={{ resize: "vertical" }} /></div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button className="btn-ghost" style={{ padding: "8px 16px" }} onClick={() => setShowLsSiteForm(false)}>Cancel</button>
                <button className="btn-primary" onClick={saveLsSite}>{editLsSiteId ? "Save Changes" : "Add Site"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── PROPOSAL MODAL — BID QUOTE TAKE-OFF ── */}
      {showProposal && proposalJob && (() => {
        const job = proposalJob;
        const co   = companies.find(c => c.id === job.companyId);
        const site = sites.find(s => s.id === job.siteId);
        const subtotal    = proposalSubtotal(proposalSections);
        const extrasTotal = Object.values(proposalExtras).reduce((s, v) => s + Number(v||0), 0);
        const lineSubTotal = subtotal + extrasTotal;
        const grossValue   = Number(proposalGrossValue || 0);
        // OH&P = 20% of gross value (displayed); real margin is the difference
        const ohp20pct     = Math.round(grossValue * 0.20 * 100) / 100;
        // Grand total = gross value (we force it)
        const grandTotal   = grossValue;
        // Sanity check: line items + OH&P should = grossValue
        const lineItemBudget = grossValue - ohp20pct; // what PM has to distribute

        const fmtD = (v) => "$\u00A0" + Number(v||0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

        const printProposal = () => {
          const el = document.getElementById("bqto-content");
          if (!el) return;
          const w = window.open("", "_blank");
          w.document.write(`<!DOCTYPE html><html><head><title>Bid Quote Take-Off</title><style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: Arial, sans-serif; font-size: 11px; color: #000; padding: 24px 32px; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 2px solid #ccc; }
            .co-info { text-align: right; }
            .title { text-align: center; font-size: 16px; font-weight: bold; margin: 20px 0 14px; }
            .scope-box { border: 1px solid #ddd; border-radius: 4px; padding: 10px 14px; margin-bottom: 16px; font-size: 11px; line-height: 1.6; }
            .scope-label { font-size: 10px; font-weight: bold; color: #555; text-transform: uppercase; margin-bottom: 4px; }
            table { width: 100%; border-collapse: collapse; font-size: 10px; }
            th { background: #4a4a4a; color: white; padding: 4px 6px; text-align: left; font-size: 10px; }
            td { padding: 3px 6px; border-bottom: 1px solid #eee; }
            .section-row td { font-weight: bold; background: #f0f0f0; }
            .subtotal-row td { font-weight: bold; border-top: 1px solid #999; background: #f9f9f9; }
            .summary { margin-left: auto; width: 300px; margin-top: 12px; }
            .summary-row { display: flex; justify-content: space-between; padding: 3px 0; font-size: 11px; }
            .summary-total { display: flex; justify-content: space-between; padding: 5px 0; font-weight: bold; font-size: 12px; border-top: 2px solid #000; }
            .summary-subtotal { display: flex; justify-content: space-between; padding: 4px 0; font-weight: bold; border-top: 1px solid #999; }
            @media print { body { padding: 12px 20px; } }
          </style></head><body>${el.innerHTML}</body></html>`);
          w.document.close();
          setTimeout(() => { w.print(); }, 300);
        };

        const updateItem = (secId, itemId, patch) => {
          setProposalSections(prev => prev.map(sec => sec.id !== secId ? sec : {
            ...sec, items: sec.items.map(it => it.id !== itemId ? it : { ...it, ...patch })
          }));
        };
        const addItem = (secId) => setProposalSections(prev => prev.map(sec => sec.id !== secId ? sec : { ...sec, items: [...sec.items, newItem()] }));
        const removeItem = (secId, itemId) => setProposalSections(prev => prev.map(sec => sec.id !== secId ? sec : { ...sec, items: sec.items.filter(i => i.id !== itemId) }));
        const addSection = () => setProposalSections(prev => [...prev, newSection("")]);
        const removeSection = (secId) => setProposalSections(prev => prev.filter(s => s.id !== secId));

        const inputSt = { border: "1px solid #ddd", borderRadius: 3, padding: "2px 4px", fontSize: 10, width: "100%", fontFamily: "Arial,sans-serif" };
        const numSt   = { ...inputSt, textAlign: "right" };

        return (
          <div className="modal-bg" onClick={e => e.target === e.currentTarget && setShowProposal(false)}>
            <div className="modal fade-in" style={{ maxWidth: 1100, width: "97vw", maxHeight: "94vh", overflowY: "auto", padding: 0, background: "#ECEEF8", borderRadius: 12 }}>

              {/* Dark toolbar */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid #CBD1E8", flexWrap: "wrap", gap: 12, background: "#1A2240", borderRadius: "12px 12px 0 0" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#C084FC", letterSpacing: "0.05em" }}>📄 Bid Quote Take-Off</div>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontSize: 10, color: "#4A5278", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600 }}>Proposal #</div>
                    <input className="fi" style={{ width: 150, fontSize: 14, fontWeight: 600, borderColor: "#3B6FE8", background: "#ECEEF8" }} placeholder="PS-2026-001" value={proposalNum} onChange={e => setProposalNum(e.target.value)} />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: "#FCD34D", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600 }}>Gross Value</div>
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#FCD34D", fontSize: 14, fontWeight: 700 }}>$</span>
                      <input className="fi" type="number" style={{ width: 130, paddingLeft: 24, fontSize: 16, fontWeight: 700, color: "#FCD34D", borderColor: "#FCD34D60", background: "#ECEEF8" }}
                        value={proposalGrossValue}
                        onChange={e => {
                          const v = Number(e.target.value);
                          setProposalGrossValue(v);
                          setFmJobs(prev => prev.map(j => j.id === proposalJob.id ? { ...j, contractValue: v, grossProfit: fmGrossProfit(v) } : j));
                        }} />
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: "#4ADE80", background: "#4ADE8015", border: "1px solid #4ADE8030", borderRadius: 6, padding: "8px 14px", whiteSpace: "nowrap", fontWeight: 600 }}>
                    OH&P {fmtD(Math.round(grossValue * 0.20 * 100)/100)} · Total {fmtD(grandTotal)}
                  </div>
                  <button className="btn-primary" onClick={printProposal}>🖨 Print / PDF</button>
                  <button className="btn-ghost" onClick={() => setShowProposal(false)}>✕</button>
                </div>
              </div>

              {/* White document area */}
              <div style={{ background: "#FFF", margin: 16, borderRadius: 8, padding: "24px 32px" }}>
                <div id="bqto-content">

                  {/* Header — real logo + company info */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, paddingBottom: 10, borderBottom: "2px solid #ccc" }}>
                    <img src={FDI_LOGO} alt="Farmer Development Inc." style={{ height: 72, width: "auto", objectFit: "contain" }} />
                    <div style={{ textAlign: "right", fontFamily: "Arial, sans-serif" }}>
                      <div style={{ fontSize: 13, fontWeight: "bold", color: "#000" }}>Farmer Development, Inc.</div>
                      <div style={{ fontSize: 11, fontStyle: "italic", color: "#333" }}>124 N Grand Ave Fowlerville, MI 48836</div>
                      <div style={{ marginTop: 4, fontSize: 11 }}><strong>Phone #:</strong> (810) 844-1544</div>
                      <div style={{ fontSize: 11 }}><strong>Fax #:</strong> (517) 682-0800</div>
                    </div>
                  </div>

                  {/* Title */}
                  <div style={{ textAlign: "center", fontSize: 18, fontWeight: "bold", fontFamily: "Arial, sans-serif", margin: "18px 0 14px", color: "#000" }}>Bid Quote Take-Off</div>

                  {/* Meta row */}
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontFamily: "Arial, sans-serif", fontSize: 11, color: "#000" }}>
                    <div>
                      <div>{proposalNum || job.ownersProjectNo || "—"}</div>
                      {co && <div>{co.name}</div>}
                      {site?.address && <div>{site.address}</div>}
                      {!site?.address && job.storeCode && <div>Store {job.storeCode}</div>}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div>Printed: {new Date().toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" })}</div>
                      {job.ownersProjectNo && <div>WO#: {job.ownersProjectNo}</div>}
                    </div>
                  </div>

                  {/* Scope of Work — editable, pulls from job */}
                  <div style={{ border: "1px solid #ddd", borderRadius: 4, padding: "10px 14px", marginBottom: 16, fontFamily: "Arial, sans-serif" }}>
                    <div style={{ fontSize: 10, fontWeight: "bold", color: "#555", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Scope of Work</div>
                    <textarea value={proposalScope} onChange={e => setProposalScope(e.target.value)} rows={3}
                      style={{ width: "100%", border: "none", outline: "none", resize: "vertical", fontFamily: "Arial, sans-serif", fontSize: 11, lineHeight: 1.6, color: "#000", background: "transparent", boxSizing: "border-box" }}
                      placeholder="Describe the scope of work…" />
                  </div>

                  {/* Line items table */}
                  <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "Arial, sans-serif", fontSize: 10 }}>
                    <thead>
                      <tr style={{ background: "#4a4a4a", color: "#fff" }}>
                        {[["Description","30%"],["Unit","6%"],["Qty","6%"],["Unit $","8%"],["Alt $","6%"],["Labor","7%"],["Material","9%"],["Sub","8%"],["Misc","6%"],["Total","8%"],["","4%"]].map(([h,w]) => (
                          <th key={h} style={{ padding: "5px 6px", textAlign: h === "Total" || h === "Unit $" || h === "Alt $" || h === "Labor" || h === "Material" || h === "Sub" || h === "Misc" ? "right" : "left", width: w, fontSize: 10 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {proposalSections.map(sec => {
                        const secTot = sectionTotal(sec);
                        const secLabor = sec.items.reduce((s,i) => s + Number(i.labor||0), 0);
                        const secMat   = sec.items.reduce((s,i) => s + Number(i.material||0), 0);
                        const secSub   = sec.items.reduce((s,i) => s + Number(i.sub||0), 0);
                        const secMisc  = sec.items.reduce((s,i) => s + Number(i.misc||0), 0);
                        return [
                          // Section header row
                          <tr key={sec.id + "-hdr"} style={{ background: "#f0f0f0" }}>
                            <td colSpan={11} style={{ padding: "4px 6px" }}>
                              <input value={sec.name} onChange={e => setProposalSections(prev => prev.map(s => s.id === sec.id ? { ...s, name: e.target.value } : s))}
                                placeholder="Section name (e.g. 08 Openings)" style={{ ...inputSt, fontWeight: "bold", background: "transparent", border: "1px dashed #ccc", width: "40%" }} />
                              <button onClick={() => removeSection(sec.id)} style={{ marginLeft: 8, fontSize: 10, color: "#999", background: "none", border: "none", cursor: "pointer" }}>✕ remove section</button>
                            </td>
                          </tr>,
                          // Item rows
                          ...sec.items.map(item => {
                            const lineTotal = Number(item.qty||0) * Number(item.unitPrice||0);
                            return (
                              <tr key={item.id} style={{ borderBottom: "1px solid #eee" }}>
                                <td style={{ padding: "2px 4px" }}><input value={item.desc} onChange={e => updateItem(sec.id, item.id, { desc: e.target.value })} placeholder="Description" style={inputSt} /></td>
                                <td style={{ padding: "2px 4px" }}>
                                  <select value={item.unit} onChange={e => updateItem(sec.id, item.id, { unit: e.target.value })} style={{ ...inputSt, width: 44 }}>
                                    {["EA","LS","LF","SF","CY","HR","DAY","TON"].map(u => <option key={u}>{u}</option>)}
                                  </select>
                                </td>
                                <td style={{ padding: "2px 4px" }}><input type="number" value={item.qty} onChange={e => updateItem(sec.id, item.id, { qty: e.target.value })} style={numSt} /></td>
                                <td style={{ padding: "2px 4px" }}><input type="number" value={item.unitPrice} onChange={e => updateItem(sec.id, item.id, { unitPrice: e.target.value })} style={numSt} /></td>
                                <td style={{ padding: "2px 4px" }}><input type="number" defaultValue="0.00" style={numSt} /></td>
                                <td style={{ padding: "2px 4px" }}><input type="number" value={item.labor} onChange={e => updateItem(sec.id, item.id, { labor: e.target.value })} style={numSt} /></td>
                                <td style={{ padding: "2px 4px" }}><input type="number" value={item.material} onChange={e => updateItem(sec.id, item.id, { material: e.target.value })} style={numSt} /></td>
                                <td style={{ padding: "2px 4px" }}><input type="number" value={item.sub} onChange={e => updateItem(sec.id, item.id, { sub: e.target.value })} style={numSt} /></td>
                                <td style={{ padding: "2px 4px" }}><input type="number" value={item.misc} onChange={e => updateItem(sec.id, item.id, { misc: e.target.value })} style={numSt} /></td>
                                <td style={{ padding: "2px 4px", textAlign: "right", fontWeight: 600, fontSize: 10, color: "#000" }}>{lineTotal.toFixed(2)}</td>
                                <td style={{ padding: "2px 4px", textAlign: "center" }}>
                                  <button onClick={() => removeItem(sec.id, item.id)} style={{ fontSize: 9, color: "#ccc", background: "none", border: "none", cursor: "pointer" }}>✕</button>
                                </td>
                              </tr>
                            );
                          }),
                          // Add item row
                          <tr key={sec.id + "-add"}>
                            <td colSpan={11} style={{ padding: "2px 6px" }}>
                              <button onClick={() => addItem(sec.id)} style={{ fontSize: 10, color: "#3B6FE8", background: "none", border: "none", cursor: "pointer", padding: "2px 0" }}>+ Add line item</button>
                            </td>
                          </tr>,
                          // Section subtotal
                          <tr key={sec.id + "-sub"} style={{ background: "#f9f9f9", borderTop: "1px solid #999" }}>
                            <td colSpan={2} style={{ padding: "4px 6px", fontWeight: "bold", fontSize: 10 }}>{sec.name ? sec.name + " - Subtotal" : "Subtotal"}</td>
                            <td /><td /><td />
                            <td style={{ padding: "4px 6px", textAlign: "right", fontWeight: "bold", fontSize: 10 }}>{secLabor.toFixed(2)}</td>
                            <td style={{ padding: "4px 6px", textAlign: "right", fontWeight: "bold", fontSize: 10 }}>{secMat.toFixed(2)}</td>
                            <td style={{ padding: "4px 6px", textAlign: "right", fontWeight: "bold", fontSize: 10 }}>{secSub.toFixed(2)}</td>
                            <td style={{ padding: "4px 6px", textAlign: "right", fontWeight: "bold", fontSize: 10 }}>{secMisc.toFixed(2)}</td>
                            <td style={{ padding: "4px 6px", textAlign: "right", fontWeight: "bold", fontSize: 10 }}>{secTot.toFixed(2)}</td>
                            <td />
                          </tr>
                        ];
                      })}
                    </tbody>
                  </table>

                  {/* Add section */}
                  <div style={{ marginTop: 8, marginBottom: 16 }}>
                    <button onClick={addSection} style={{ fontSize: 11, color: "#3B6FE8", background: "none", border: "1px dashed #3B6FE840", borderRadius: 4, cursor: "pointer", padding: "4px 12px" }}>+ Add Section</button>
                  </div>

                  {/* Summary block — right aligned matching template */}
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <div style={{ width: 320, fontFamily: "Arial, sans-serif", fontSize: 11 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #eee" }}>
                        <strong>Total</strong><strong>{fmtD(subtotal)}</strong>
                      </div>
                      {[
                        ["Labor Burden",      "laborBurden"],
                        ["Sales Tax",         "salesTax"],
                        ["General Liability", "generalLiability"],
                        ["Permit Cost",       "permitCost"],
                      ].map(([label, key]) => (
                        <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 0", borderBottom: "1px solid #f0f0f0" }}>
                          <span style={{ color: "#444" }}>{label}</span>
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <span style={{ color: "#888", fontSize: 10 }}>$</span>
                            <input type="number" value={proposalExtras[key]} onChange={e => setProposalExtras(p => ({ ...p, [key]: e.target.value }))}
                              style={{ width: 80, textAlign: "right", border: "1px solid #ddd", borderRadius: 3, padding: "1px 4px", fontSize: 10, fontFamily: "Arial" }} />
                          </div>
                        </div>
                      ))}
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontWeight: "bold", borderTop: "1px solid #999", borderBottom: "1px solid #eee" }}>
                        <strong>Sub Total</strong><strong>{fmtD(lineSubTotal)}</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #eee" }}>
                        <span>OH &amp; P</span>
                        <span style={{ fontWeight: 600 }}>{fmtD(ohp20pct)}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontWeight: "bold", fontSize: 13, borderTop: "2px solid #000" }}>
                        <strong>Total</strong><strong>{fmtD(grandTotal)}</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", color: "#666", fontSize: 10 }}>
                        <span>Cost/Sq. Ft. (0)</span><span>$&nbsp;0.00</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              <div style={{ padding: "12px 16px", borderTop: "1px solid #CBD1E8", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 11, color: "#4A5278" }}>
                  Line items: {fmtD(lineSubTotal)} · OH&P (20%): {fmtD(ohp20pct)} · <strong style={{ color: "#4ADE80" }}>Grand Total: {fmtD(grandTotal)}</strong>
                  {grossValue > 0 && <span style={{ marginLeft: 8, color: "#FCD34D" }}>· Actual margin: {fmtD(grossValue - lineSubTotal)} ({Math.round(((grossValue - lineSubTotal)/grossValue)*100)}%)</span>}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn-ghost" onClick={() => setShowProposal(false)}>Close</button>
                  <button className="btn-primary" onClick={printProposal}>🖨 Print / Save PDF</button>
                </div>
              </div>

            </div>
          </div>
        );
      })()}

      {/* ── LAWN BID DOCUMENT MODAL ── */}
      {lawnBidDocSiteId && (() => {
        const site = lawnSites.find(s => s.id === lawnBidDocSiteId);
        if (!site) { setLawnBidDocSiteId(null); return null; }
        const bid  = getLawnBid(site.id);
        const co   = companies.find(c => c.id === site.companyId);
        // Only subs assigned to this bid
        const assignedSubIds = bid?.subcontractorIds || [];
        const assignedSubs = assignedSubIds.map(id => subcontractors.find(s => s.id === id)).filter(Boolean);
        // If exactly one sub assigned, auto-select it. If multiple, require user to pick.
        const autoSub = assignedSubs.length === 1 ? assignedSubs[0].id : "";
        const chosenSubId = lawnBidDocSubId !== null ? lawnBidDocSubId : (bid?.selectedSubId && assignedSubIds.includes(bid.selectedSubId) ? bid.selectedSubId : autoSub);
        const sub  = chosenSubId ? subcontractors.find(s => s.id === chosenSubId) : null;
        const mapLat = site.lat || 39.9526;
        const mapLng = site.lng || -75.1652;
        const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${mapLat},${mapLng}&zoom=1&size=640x320&maptype=satellite&markers=color:red%7C${mapLat},${mapLng}&key=AIzaSyD-9tSrke72PouQMnMX-a7eZSW0jkFMBWY`;
        const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

        const printBidDoc = () => {
          const el = document.getElementById("lawn-bid-doc-content");
          if (!el) return;
          const w = window.open("", "_blank");
          w.document.write(`<!DOCTYPE html><html><head><title>Lawn Bid Request — ${site.address}</title><style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: Arial, sans-serif; font-size: 11px; color: #000; padding: 28px 36px; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 10px; border-bottom: 2px solid #222; margin-bottom: 16px; }
            img { max-width: 100%; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 18px; }
            thead tr { background: #222 !important; color: #fff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            th { padding: 6px 8px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; }
            td { padding: 8px 8px; border-bottom: 1px solid #e8e8e8; vertical-align: middle; }
            @media print { body { padding: 14px 24px; } @page { margin: 1cm; } }
          </style></head><body>${el.innerHTML}</body></html>`);
          w.document.close();
          setTimeout(() => w.print(), 400);
        };

        return (
          <div style={{ position: "fixed", inset: 0, background: "#00000090", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={e => { if (e.target === e.currentTarget) setLawnBidDocSiteId(null); }}>
            <div style={{ background: "#1A2240", border: "1px solid #CBD1E8", borderRadius: 14, width: "min(820px, 96vw)", maxHeight: "92vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>

              {/* Modal header */}
              <div style={{ padding: "16px 22px", borderBottom: "1px solid #CBD1E8", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#1A2240" }}>📄 Lawn Bid Request Document</div>
                  <div style={{ fontSize: 11, color: "#4A5278", marginTop: 2 }}>{site.address} · Season {lawnBidSeason}</div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ fontSize: 11, color: "#4A5278", whiteSpace: "nowrap" }}>Make out to:</span>
                    <select value={chosenSubId} onChange={e => setLawnBidDocSubId(e.target.value)} style={{ background: "#F5F7FC", border: "1px solid " + (chosenSubId ? "#60A5FA50" : "#F87171"), color: chosenSubId ? "#252E52" : "#F87171", borderRadius: 6, padding: "6px 10px", fontSize: 12, minWidth: 160 }}>
                      <option value="">— Select contractor —</option>
                      {(assignedSubs.length > 0 ? assignedSubs : subcontractors).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <button className="btn-primary" style={{ background: "#4ADE8020", color: "#4ADE80", border: "1px solid #4ADE8040", opacity: chosenSubId ? 1 : 0.4 }} onClick={printBidDoc}>🖨 Print / Send to Sub</button>
                  <button className="btn-ghost" onClick={() => { setLawnBidDocSiteId(null); setLawnBidDocSubId(null); }}>✕ Close</button>
                </div>
              </div>

              {/* Scrollable document preview */}
              <div style={{ overflowY: "auto", padding: "24px 28px", flex: 1 }}>
                <div id="lawn-bid-doc-content" style={{ background: "#fff", color: "#000", fontFamily: "Arial, sans-serif", fontSize: 11, padding: "28px 36px", borderRadius: 8, maxWidth: 760, margin: "0 auto" }}>

                  {/* Doc header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: 10, borderBottom: "2px solid #222", marginBottom: 16 }}>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.04em" }}>Lawn Services Bid Request</div>
                      <div style={{ fontSize: 11, color: "#555", marginTop: 3 }}>Please complete all applicable service pricing below and return.</div>
                    </div>
                    <div style={{ textAlign: "right", fontSize: 10, color: "#444", lineHeight: 1.7 }}>
                      <div><strong>Date:</strong> {today}</div>
                      <div><strong>Season:</strong> {lawnBidSeason}</div>
                      <div><strong>Ref #:</strong> {site.storeNumber || site.id}</div>
                    </div>
                  </div>

                  {/* Property info */}
                  <div style={{ fontSize: 10, fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.07em", color: "#333", marginBottom: 6, borderBottom: "1px solid #ddd", paddingBottom: 3 }}>Property Information</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 24px", marginBottom: 18, fontSize: 11 }}>
                    <div><span style={{ fontWeight: "bold", color: "#444" }}>Client: </span>{co?.name || "—"}</div>
                    <div><span style={{ fontWeight: "bold", color: "#444" }}>Store #: </span>{site.storeNumber || "—"}</div>
                    <div><span style={{ fontWeight: "bold", color: "#444" }}>Address: </span>{site.address || "—"}</div>
                    <div><span style={{ fontWeight: "bold", color: "#444" }}>Phone: </span>{site.phone || "—"}</div>
                    <div><span style={{ fontWeight: "bold", color: "#444" }}>Access Code: </span>{site.accessCode || "—"}</div>
                    <div><span style={{ fontWeight: "bold", color: "#444" }}>Site Notes: </span>{site.notes || "—"}</div>
                  </div>

                  {/* Subcontractor / vendor fillable section */}
                  <div style={{ fontSize: 10, fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.07em", color: "#333", marginBottom: 6, borderBottom: "1px solid #ddd", paddingBottom: 3 }}>Subcontractor / Vendor Information</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 24px", marginBottom: 18, fontSize: 11 }}>
                    {[
                      ["Company",       sub?.name  || ""],
                      ["Contact Name",  ""],
                      ["Phone",         sub?.phone || ""],
                      ["Email",         sub?.email || ""],
                      ["Bid Due Date",  ""],
                      ["Valid Through", ""],
                    ].map(([label, val]) => (
                      <div key={label} style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                        <span style={{ fontWeight: "bold", color: "#444", whiteSpace: "nowrap" }}>{label}:</span>
                        <span style={{ flex: 1, borderBottom: "1px solid #bbb", minWidth: 100, paddingBottom: 1, color: val ? "#000" : "transparent" }}>{val || "."}</span>
                      </div>
                    ))}
                  </div>

                  {/* Satellite / aerial map */}
                  <div style={{ fontSize: 10, fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.07em", color: "#333", marginBottom: 6, borderBottom: "1px solid #ddd", paddingBottom: 3 }}>Property Aerial View</div>
                  <div style={{ width: "100%", height: 260, background: "#e8ecf5", border: "1px solid #ccc", marginBottom: 18, overflow: "hidden", borderRadius: 4 }}>
                    {site.lat && site.lng ? (
                      <iframe
                        key={site.id + "-aerial"}
                        style={{ width: "100%", height: "100%", border: "none", display: "block" }}
                        srcDoc={`<!DOCTYPE html><html><head>
                          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
                          <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
                          <style>html,body,#map{margin:0;padding:0;height:100%;width:100%;}</style>
                        </head><body><div id="map"></div><script>
                          var map = L.map('map', { zoomControl: false, attributionControl: false, dragging: false, scrollWheelZoom: false }).setView([${site.lat}, ${site.lng}], 15);
                          L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 20 }).addTo(map);
                          var icon = L.divIcon({ className: '', html: '<div style="width:14px;height:14px;border-radius:50%;background:#ef4444;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.6);"></div>', iconSize:[14,14], iconAnchor:[7,7] });
                          L.marker([${site.lat}, ${site.lng}], { icon: icon }).addTo(map);
                        </script></body></html>`}
                      />
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8, height: "100%", color: "#888" }}>
                        <div style={{ fontSize: 28 }}>🗺️</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#555" }}>{site.address}</div>
                        <div style={{ fontSize: 10, color: "#aaa" }}>No coordinates — add address to site for aerial view</div>
                      </div>
                    )}
                  </div>

                  {/* Services pricing table */}
                  <div style={{ fontSize: 10, fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.07em", color: "#333", marginBottom: 4, borderBottom: "1px solid #ddd", paddingBottom: 3 }}>Services &amp; Pricing</div>
                  <div style={{ fontSize: 10, color: "#777", marginBottom: 10, fontStyle: "italic" }}>Enter your price for each applicable service. Leave blank if not offering that service.</div>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, marginBottom: 18 }}>
                    <thead>
                      <tr style={{ background: "#222", color: "#fff" }}>
                        {["Service", "Frequency", "Billing Unit", "Unit Price ($)", "Est. Annual ($)", "Notes"].map((h, i) => (
                          <th key={h} style={{ padding: "7px 8px", textAlign: i >= 3 ? "right" : "left", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600, color: "#fff" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {LAWN_SERVICES.map((svc, i) => {
                        const sv = bid?.services?.[svc.id];
                        const unitLabel = svc.unit === "per_cut" ? "Per Cut" : svc.unit === "monthly" ? "Per Month" : "Flat / Season";
                        return (
                          <tr key={svc.id} style={{ borderBottom: "1px solid #e0e0e0", background: i % 2 === 0 ? "#fff" : "#f9fafb" }}>
                            <td style={{ padding: "9px 8px", fontWeight: 500, color: "#111" }}>{svc.label}</td>
                            <td style={{ padding: "9px 8px" }}>
                              <span style={{ display: "inline-block", background: "#eee", borderRadius: 3, padding: "1px 7px", fontSize: 10, color: "#555" }}>{svc.freq}</span>
                            </td>
                            <td style={{ padding: "9px 8px", fontSize: 10, color: "#666" }}>{unitLabel}</td>
                            {/* Unit price — blank writeable line */}
                            <td style={{ padding: "9px 8px", textAlign: "right" }}>
                              <span style={{ display: "inline-block", borderBottom: "1.5px solid #aaa", width: 85, minHeight: 15 }}>&nbsp;</span>
                            </td>
                            {/* Est. annual — blank writeable line */}
                            <td style={{ padding: "9px 8px", textAlign: "right" }}>
                              <span style={{ display: "inline-block", borderBottom: "1.5px solid #aaa", width: 85, minHeight: 15 }}>&nbsp;</span>
                            </td>
                            {/* Notes — blank writeable line */}
                            <td style={{ padding: "9px 8px" }}>
                              <span style={{ display: "inline-block", borderBottom: "1px solid #ccc", width: "100%", minHeight: 15 }}>&nbsp;</span>
                            </td>
                          </tr>
                        );
                      })}
                      {/* Total row */}
                      <tr style={{ background: "#f0f0f0", borderTop: "2px solid #888" }}>
                        <td colSpan={3} style={{ padding: "9px 8px", fontWeight: "bold", fontSize: 11 }}>Total Estimated Annual Cost</td>
                        <td style={{ padding: "9px 8px", textAlign: "right" }}>&nbsp;</td>
                        <td style={{ padding: "9px 8px", textAlign: "right" }}>
                          <span style={{ display: "inline-block", borderBottom: "2px solid #555", width: 85, fontWeight: "bold", minHeight: 15 }}>&nbsp;</span>
                        </td>
                        <td />
                      </tr>
                    </tbody>
                  </table>

                  {/* Notes box */}
                  <div style={{ fontSize: 10, fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.07em", color: "#333", marginBottom: 6, borderBottom: "1px solid #ddd", paddingBottom: 3 }}>Additional Notes / Scope Clarifications</div>
                  <div style={{ border: "1px solid #ddd", borderRadius: 3, minHeight: 64, padding: "8px 10px", fontSize: 11, color: bid?.notes ? "#111" : "#bbb", marginBottom: 20, lineHeight: 1.6 }}>
                    {bid?.notes || "Enter any site-specific conditions, access notes, or scope questions here…"}
                  </div>

                  {/* Signature block */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, marginTop: 28 }}>
                    {[["Submitted by (Subcontractor)", "Printed Name / Title"], ["Reviewed by (Our Company)", "Printed Name / Title"]].map(([sig, name]) => (
                      <div key={sig}>
                        <div style={{ borderBottom: "1px solid #888", marginBottom: 4, height: 32 }} />
                        <div style={{ fontSize: 9, color: "#666", textTransform: "uppercase", letterSpacing: "0.06em" }}>{sig}</div>
                        <div style={{ borderBottom: "1px solid #ccc", marginTop: 14, marginBottom: 4, height: 24 }} />
                        <div style={{ fontSize: 9, color: "#666", textTransform: "uppercase", letterSpacing: "0.06em" }}>{name}</div>
                        <div style={{ borderBottom: "1px solid #ccc", marginTop: 14, marginBottom: 4, height: 24 }} />
                        <div style={{ fontSize: 9, color: "#666", textTransform: "uppercase", letterSpacing: "0.06em" }}>Date</div>
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div style={{ marginTop: 28, borderTop: "1px solid #ddd", paddingTop: 10, display: "flex", justifyContent: "space-between", fontSize: 9, color: "#999" }}>
                    <span>Confidential — For Bidding Purposes Only</span>
                    <span>Season {lawnBidSeason} · Ref #{site.storeNumber || site.id} · Generated {today}</span>
                  </div>

                </div>
              </div>

            </div>
          </div>
        );
      })()}

      {/* ── TEAM MEMBER FORM MODAL ── */}
      {showTeamForm && (
        <div style={{ position: "fixed", inset: 0, background: "#00000090", zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#ECEEF8", border: "1px solid #CBD1E8", borderRadius: 12, padding: 28, width: 400, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#1A2240", marginBottom: 20 }}>{editTeamId ? "Edit" : "Add"} Team Member</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[["Name", "name"], ["Phone", "phone"], ["Email", "email"]].map(([label, key]) => (
                <div key={key}>
                  <div style={{ fontSize: 10, color: "#4A5278", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>{label}</div>
                  <input className="fi" style={{ width: "100%", boxSizing: "border-box" }} value={teamForm[key]} onChange={e => setTeamForm({ ...teamForm, [key]: e.target.value })} />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
              <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setShowTeamForm(false)}>Cancel</button>
              <button className="btn-primary" style={{ flex: 1 }} onClick={() => {
                if (!teamForm.name) return;
                if (editTeamId) setFmTeam(fmTeam.map(m => m.id === editTeamId ? { ...m, ...teamForm } : m));
                else setFmTeam([...fmTeam, { id: "tm" + Date.now(), ...teamForm }]);
                setShowTeamForm(false);
              }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* ── SUBCONTRACTOR FORM MODAL ── */}
      {showSubForm && (
        <div style={{ position: "fixed", inset: 0, background: "#00000090", zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#ECEEF8", border: "1px solid #CBD1E8", borderRadius: 12, padding: 28, width: 480, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#1A2240", marginBottom: 20 }}>{editSubId ? "Edit" : "Add"} Subcontractor</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[["Name", "name"], ["Trade / Specialty", "trade"], ["Phone", "phone"], ["Email", "email"]].map(([label, key]) => (
                <div key={key}>
                  <div style={{ fontSize: 10, color: "#4A5278", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>{label}</div>
                  <input className="fi" style={{ width: "100%", boxSizing: "border-box" }} value={subForm[key]} onChange={e => setSubForm({ ...subForm, [key]: e.target.value })} />
                </div>
              ))}
              <div>
                <div style={{ fontSize: 10, color: "#4A5278", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Works for Division(s)</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {[{ id: "fm", label: "Facility Maint.", color: "#7BA7F5" }, { id: "lawn", label: "Lawn", color: "#4CAF82" }, { id: "snow", label: "Snow", color: "#A8C4F8" }].map(sv => {
                    const checked = (subForm.services || []).includes(sv.id);
                    return (
                      <button key={sv.id} onClick={() => {
                        const cur = subForm.services || [];
                        setSubForm({ ...subForm, services: checked ? cur.filter(x => x !== sv.id) : [...cur, sv.id] });
                      }} style={{ padding: "6px 14px", borderRadius: 20, border: "1px solid " + (checked ? sv.color : "#CBD1E8"), background: checked ? sv.color + "25" : "transparent", color: checked ? sv.color : "#4A5278", fontSize: 11, fontWeight: checked ? 600 : 400, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}>
                        {sv.label}
                      </button>
                    );
                  })}
                </div>
                <div style={{ fontSize: 10, color: "#3D4570", marginTop: 5 }}>Leave blank to include in all divisions</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: "#4A5278", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>MSA Status</div>
                <select className="fi" style={{ width: "100%" }} value={subForm.msaStatus} onChange={e => setSubForm({ ...subForm, msaStatus: e.target.value })}>
                  <option value="missing">Missing</option>
                  <option value="signed">Signed</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
              <div>
                <div style={{ fontSize: 10, color: "#4A5278", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>COI Expiry Date</div>
                <input className="fi" type="date" style={{ width: "100%", boxSizing: "border-box" }} value={subForm.coiExpiry} onChange={e => setSubForm({ ...subForm, coiExpiry: e.target.value })} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input type="checkbox" id="w9check" checked={subForm.w9} onChange={e => setSubForm({ ...subForm, w9: e.target.checked })} style={{ width: 16, height: 16, accentColor: buColor.accent }} />
                <label htmlFor="w9check" style={{ fontSize: 12, color: "#252E52", cursor: "pointer" }}>W9 on file</label>
              </div>
              <div>
                <div style={{ fontSize: 10, color: "#4A5278", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>Notes</div>
                <textarea className="fi" rows={3} style={{ width: "100%", boxSizing: "border-box", resize: "vertical" }} value={subForm.notes} onChange={e => setSubForm({ ...subForm, notes: e.target.value })} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
              <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setShowSubForm(false)}>Cancel</button>
              <button className="btn-primary" style={{ flex: 1 }} onClick={async () => {
                if (!subForm.name) return;
                if (editSubId) {
                  const updated = { ...subcontractors.find(s => s.id === editSubId), ...subForm };
                  setSubcontractors(subcontractors.map(s => s.id === editSubId ? updated : s));
                  supa.from("subcontractors").update(subToDB(updated)).eq("id", editSubId);
                } else {
                  const newId = "sub" + Date.now();
                  const entry = { id: newId, ...subForm };
                  setSubcontractors(s => [...s, entry]);
                  supa.from("subcontractors").insert(subToDB(entry));
                }
                setShowSubForm(false);
              }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* ── LANDSCAPING SUBCONTRACT MODAL ── */}
      {/* ── ACREAGE MOWING CALCULATOR MODAL ── */}
      {acreageModalSiteId && (() => {
        const site = lawnSites.find(s => s.id === acreageModalSiteId);
        if (!site) { setAcreageModalSiteId(null); return null; }
        const bid = getLawnBid(site.id);
        const acres = parseFloat(acreageInput) || 0;
        const subCostPerCut = Math.round(acres * 275 * 100) / 100;
        const ourPricePerCut = Math.ceil(subCostPerCut / 0.70);
        const annualSub = subCostPerCut * 28;
        const annualOur = ourPricePerCut * 28;

        const applyCalc = () => {
          if (!acres) return;
          upsertLawnBid(site.id, b => ({
            ...b,
            acreage: acres,
            services: {
              ...(b.services || {}),
              mowing: {
                ...(b.services?.mowing || {}),
                included: true,
                subPrice: subCostPerCut,
                ourPrice: ourPricePerCut,
              }
            }
          }));
          setAcreageModalSiteId(null);
          setAcreageInput("");
        };

        return (
          <div style={{ position: "fixed", inset: 0, background: "#00000090", zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={e => { if (e.target === e.currentTarget) { setAcreageModalSiteId(null); setAcreageInput(""); } }}>
            <div style={{ background: "#1A2240", border: "1px solid #CBD1E8", borderRadius: 14, width: "min(420px, 95vw)", padding: 28, display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#1A2240", marginBottom: 4 }}>📐 Mowing Cost Calculator</div>
                <div style={{ fontSize: 11, color: "#4A5278" }}>{site.address}</div>
              </div>

              <div>
                <div style={{ fontSize: 10, color: "#4A5278", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Property Acreage</div>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="e.g. 1.5"
                  value={acreageInput}
                  onChange={e => setAcreageInput(e.target.value)}
                  autoFocus
                  onKeyDown={e => { if (e.key === "Enter") applyCalc(); }}
                  style={{ width: "100%", background: "#F0F2F8", border: "1px solid #FBBF2440", borderRadius: 7, padding: "10px 12px", fontSize: 16, color: "#FBBF24", boxSizing: "border-box", fontFamily: "inherit", outline: "none" }}
                />
                <div style={{ fontSize: 10, color: "#4A5278", marginTop: 5 }}>Rate: $275/acre per cut · 28 cuts/season</div>
              </div>

              {acres > 0 && (
                <div style={{ background: "#F0F2F8", borderRadius: 8, border: "1px solid #CBD1E8", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: "#252E52" }}>Sub cost / cut</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#FBBF24" }}>${subCostPerCut.toFixed(2)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: "#252E52" }}>Our price / cut <span style={{ fontSize: 9, color: "#4A5278" }}>(30% margin)</span></span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#4ADE80" }}>${ourPricePerCut.toFixed(2)}</span>
                  </div>
                  <div style={{ borderTop: "1px solid #CBD1E8", paddingTop: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 11, color: "#252E52" }}>Annual sub total</span>
                      <span style={{ fontSize: 12, color: "#FBBF24", fontWeight: 600 }}>${Math.round(annualSub).toLocaleString()}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                      <span style={{ fontSize: 11, color: "#252E52" }}>Annual our total</span>
                      <span style={{ fontSize: 13, color: "#4ADE80", fontWeight: 700 }}>${Math.round(annualOur).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => { setAcreageModalSiteId(null); setAcreageInput(""); }} style={{ flex: 1, padding: "9px 0", background: "transparent", border: "1px solid #CBD1E8", borderRadius: 7, color: "#4A5278", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                <button onClick={applyCalc} disabled={!acres} style={{ flex: 2, padding: "9px 0", background: acres ? "#4ADE8020" : "#CBD1E8", border: "1px solid " + (acres ? "#4ADE8050" : "#CBD1E8"), borderRadius: 7, color: acres ? "#4ADE80" : "#4A5278", fontSize: 13, fontWeight: 700, cursor: acres ? "pointer" : "default", fontFamily: "inherit" }}>
                  ✓ Apply to Mowing Service
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── OWNER PROPOSAL TEMPLATE PICKER ── */}
      {ownerProposalSiteId && (() => {
        const site = lawnSites.find(s => s.id === ownerProposalSiteId);
        if (!site) { setOwnerProposalSiteId(null); return null; }
        const bid = getLawnBid(site.id);
        const co = companies.find(c => c.id === site.companyId);
        const annualOur = lawnBidAnnualOur(bid);
        const services = LAWN_SERVICES.filter(s => bid?.services?.[s.id]?.included);

        const generateProposal = (template) => {
          const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
          const w = window.open("", "_blank");
          w.document.write(`<!DOCTYPE html><html><head><title>Owner Proposal — ${site.address}</title><style>
            *{box-sizing:border-box;margin:0;padding:0;}
            body{font-family:Arial,sans-serif;font-size:11px;color:#000;padding:28px 36px;}
            .header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:12px;border-bottom:3px solid #1a3a6b;margin-bottom:20px;}
            .logo{font-size:28px;font-weight:900;color:#1a3a6b;letter-spacing:0.05em;border:3px solid #1a3a6b;padding:6px 12px;}
            .logo-sub{font-size:8px;color:#1a3a6b;letter-spacing:0.2em;text-transform:uppercase;}
            h1{font-size:18px;font-weight:900;text-transform:uppercase;letter-spacing:0.05em;text-align:center;flex:1;padding:0 20px;}
            .meta{font-size:9px;text-align:right;line-height:1.8;}
            table{width:100%;border-collapse:collapse;margin-bottom:20px;}
            th{background:#1a3a6b;color:#fff;padding:7px 10px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:0.05em;}
            td{padding:8px 10px;border-bottom:1px solid #e0e0e0;font-size:11px;}
            .total-row td{background:#f5f5f5;font-weight:bold;font-size:12px;}
            .sig{margin-top:30px;display:flex;gap:40px;}
            .sig-block{flex:1;border-top:1px solid #000;padding-top:6px;font-size:10px;}
            .badge{display:inline-block;padding:2px 8px;border-radius:3px;font-size:9px;font-weight:bold;text-transform:uppercase;letter-spacing:0.08em;}
            @media print{body{padding:14px 24px;}@page{margin:1cm;}}
          </style></head><body>
            <div class="header">
              <div><div class="logo">FARMER</div><div class="logo-sub">Development, Inc.</div></div>
              <h1>Landscaping Services Proposal</h1>
              <div class="meta"><div>124 N Grand Ave</div><div>Fowlerville, MI 48836</div><div>AP@FarmerDevelopment.com</div><div style="margin-top:6px"><strong>Date:</strong> ${today}</div><div><strong>Season:</strong> ${lawnBidSeason}</div></div>
            </div>
            <table style="margin-bottom:14px;border:1px solid #ddd;">
              <tbody>
                <tr><td style="width:50%;padding:8px 12px;border-right:1px solid #ddd;"><strong>Prepared For:</strong><br/><span style="font-size:14px;font-weight:bold;">${co?.name || "________________________"}</span></td>
                <td style="padding:8px 12px;"><strong>Property Address:</strong><br/><span style="font-size:12px;">${site.address}</span>${site.storeNumber ? `<br/><span style="font-size:10px;color:#666;">Store #${site.storeNumber}</span>` : ""}</td></tr>
                <tr><td style="padding:8px 12px;border-right:1px solid #ddd;" colspan="2"><strong>Contract Template:</strong> <span class="badge" style="background:#e8eef8;color:#1a3a6b;">${template.label}</span></td></tr>
              </tbody>
            </table>
            <table>
              <thead><tr><th>Service</th><th>Frequency</th><th style="text-align:right">Season Price</th></tr></thead>
              <tbody>
                ${services.map(s => {
                  const sv = bid.services[s.id];
                  const freq = s.unit === "per_cut" ? "28 cuts/season" : s.unit === "monthly" ? "7 months" : "Per Season";
                  const price = s.unit === "per_cut" ? sv.ourPrice * 28 : s.unit === "monthly" ? sv.ourPrice * 7 : sv.ourPrice;
                  return `<tr><td>${s.label}</td><td>${freq}</td><td style="text-align:right">$${Math.round(price).toLocaleString()}</td></tr>`;
                }).join("")}
                <tr class="total-row"><td colspan="2">Annual Contract Total</td><td style="text-align:right;font-size:14px;color:#1a3a6b;">$${Math.round(annualOur).toLocaleString()}</td></tr>
              </tbody>
            </table>
            <p style="font-size:10px;color:#555;margin-bottom:24px;line-height:1.6;">This proposal is valid for 30 days from the date above. All services will be performed in a professional and workmanlike manner. Owner may terminate with 30 days written notice. Pricing is for the ${lawnBidSeason} season only.</p>
            <div class="sig">
              <div class="sig-block"><strong>Farmer Development, Inc.</strong><br/><br/><br/>Signature: ________________________<br/>Name: ________________________<br/>Date: ________________________</div>
              <div class="sig-block"><strong>${co?.name || "Owner / Authorized Representative"}</strong><br/><br/><br/>Signature: ________________________<br/>Name: ________________________<br/>Date: ________________________</div>
            </div>
          </body></html>`);
          w.document.close();
          setTimeout(() => w.print(), 400);
          setOwnerProposalSiteId(null);
        };

        return (
          <div style={{ position: "fixed", inset: 0, background: "#00000090", zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={e => { if (e.target === e.currentTarget) setOwnerProposalSiteId(null); }}>
            <div style={{ background: "#1A2240", border: "1px solid #CBD1E8", borderRadius: 14, width: "min(460px, 95vw)", padding: 28, display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#1A2240", marginBottom: 4 }}>📋 Generate Owner Proposal</div>
                <div style={{ fontSize: 11, color: "#4A5278" }}>{site.address} · {co?.name || "—"} · {services.length} service{services.length !== 1 ? "s" : ""} · <span style={{ color: "#4ADE80", fontWeight: 600 }}>${Math.round(annualOur).toLocaleString()}/yr</span></div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: "#4A5278", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Select Contract Template</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {OWNER_CONTRACT_TEMPLATES.map(t => (
                    <button key={t.id} onClick={() => generateProposal(t)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "#F0F2F8", border: "1px solid " + t.color + "40", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", textAlign: "left", transition: "all 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.background = t.color + "15"}
                      onMouseLeave={e => e.currentTarget.style.background = "#F0F2F8"}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: t.color, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#1A2240" }}>{t.label}</div>
                        <div style={{ fontSize: 10, color: "#4A5278", marginTop: 2 }}>Generates & prints proposal with {t.label} formatting</div>
                      </div>
                      <div style={{ marginLeft: "auto", fontSize: 12, color: t.color }}>Print →</div>
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={() => setOwnerProposalSiteId(null)} style={{ padding: "9px 0", background: "transparent", border: "1px solid #CBD1E8", borderRadius: 7, color: "#4A5278", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
            </div>
          </div>
        );
      })()}

      {lawnSubcontractSiteId && (() => {
        const site = lawnSites.find(s => s.id === lawnSubcontractSiteId);
        if (!site) { setLawnSubcontractSiteId(null); return null; }
        const bid  = getLawnBid(site.id);
        const co   = companies.find(c => c.id === site.companyId);
        const sub  = bid?.selectedSubId ? subcontractors.find(s => s.id === bid.selectedSubId) : null;
        const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
        const startDate = "May 1"; const endDate = "Oct 31";
        const getSvcData = (id) => { const sv = bid?.services?.[id]; return sv || { subPrice: 0, ourPrice: 0, included: false }; };

        const printSubcontract = () => {
          const el = document.getElementById("subcontract-content");
          if (!el) return;
          const w = window.open("", "_blank");
          w.document.write(`<!DOCTYPE html><html><head><title>Landscaping Contract</title><style>
            *{box-sizing:border-box;margin:0;padding:0;}body{font-family:Arial,sans-serif;font-size:10px;color:#000;padding:20px 28px;}
            table{border-collapse:collapse;}img{max-width:100%;}
            @media print{body{padding:10px 16px;}@page{margin:0.5cm;}}
          </style></head><body>${el.innerHTML}</body></html>`);
          w.document.close(); setTimeout(() => w.print(), 400);
        };

        return (
          <div style={{ position: "fixed", inset: 0, background: "#00000090", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={e => { if (e.target === e.currentTarget) setLawnSubcontractSiteId(null); }}>
            <div style={{ background: "#1A2240", border: "1px solid #CBD1E8", borderRadius: 14, width: "min(900px, 96vw)", maxHeight: "93vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid #CBD1E8", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#1A2240" }}>📄 Landscaping Subcontract</div>
                  <div style={{ fontSize: 11, color: "#4A5278", marginTop: 2 }}>{site.address} · {sub?.name || "No sub selected"} · Season {lawnBidSeason}</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={printSubcontract} style={{ padding: "7px 16px", background: "#4ADE8020", border: "1px solid #4ADE8040", borderRadius: 7, color: "#4ADE80", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>🖨 Print / Save PDF</button>
                  <button onClick={() => setLawnSubcontractSiteId(null)} style={{ padding: "7px 14px", background: "transparent", border: "1px solid #CBD1E8", borderRadius: 7, color: "#4A5278", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>✕ Close</button>
                </div>
              </div>

              <div style={{ overflowY: "auto", padding: "20px 24px", flex: 1 }}>
                <div id="subcontract-content" style={{ background: "#fff", color: "#000", fontFamily: "Arial, sans-serif", fontSize: 10, padding: "20px 28px", borderRadius: 6, maxWidth: 820, margin: "0 auto" }}>
                  <div style={{ border: "2px solid #000", padding: 14 }}>

                    {/* Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <div style={{ border: "2px solid #1a3a6b", padding: "6px 10px" }}>
                        <div style={{ fontSize: 22, fontWeight: 900, color: "#3B6FE8", letterSpacing: "0.05em" }}>FARMER</div>
                        <div style={{ fontSize: 7, color: "#3B6FE8", letterSpacing: "0.15em", textTransform: "uppercase" }}>Development, Inc.</div>
                      </div>
                      <div style={{ textAlign: "center", flex: 1, padding: "0 20px" }}>
                        <div style={{ fontSize: 16, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em" }}>LANDSCAPING CONTRACT</div>
                      </div>
                      <div style={{ fontSize: 9, textAlign: "right", lineHeight: 1.7 }}>
                        <div>124 N Grand Ave</div><div>Fowlerville, MI 48836</div><div>AP@FarmerDevelopment.com</div>
                      </div>
                    </div>

                    {/* Info rows */}
                    <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 0 }}>
                      <tbody>
                        <tr>
                          <td style={{ border: "1px solid #000", padding: "5px 8px", width: "55%", fontSize: 10, verticalAlign: "top" }}>
                            <strong>Contractor:</strong> Farmer Development, Inc. ("Agent"), solely in its capacity as agent for the record owner of the Store ("Owner").
                          </td>
                          <td style={{ border: "1px solid #000", padding: "5px 8px", fontSize: 10, verticalAlign: "top" }}>
                            <div style={{ fontWeight: "bold", textTransform: "uppercase", fontSize: 10, marginBottom: 2 }}>Service Provider:</div>
                            <div style={{ fontSize: 13, fontWeight: "bold" }}>{sub?.name || "________________________"}</div>
                            {sub?.phone && <div style={{ fontSize: 9, color: "#555", marginTop: 2 }}>{sub.phone}{sub.email ? " · " + sub.email : ""}</div>}
                          </td>
                        </tr>
                        <tr>
                          <td colSpan={2} style={{ border: "1px solid #000", padding: "5px 8px", fontSize: 10 }}>
                            <strong>Owner/Property:</strong> <span style={{ fontSize: 12 }}>{co?.name || "________________________"}</span>
                            <span style={{ float: "right" }}><strong>Number:</strong> {site.storeNumber || "________"}</span>
                          </td>
                        </tr>
                        <tr>
                          <td colSpan={2} style={{ border: "1px solid #000", padding: "5px 8px", fontSize: 10 }}>
                            <strong>Address:</strong> {site.address}
                          </td>
                        </tr>
                        <tr>
                          <td colSpan={2} style={{ border: "1px solid #000", padding: "6px 8px", fontSize: 10, lineHeight: 1.7 }}>
                            <strong>Contract Term:</strong> ☒ <strong>7</strong> months beginning on <strong>{startDate}</strong>, <strong>{lawnBidSeason}</strong> and expiring on <strong>{endDate}</strong>, 20{String(lawnBidSeason).slice(2)}.
                            Owner may terminate this Contract at any time upon 30 days prior written notice to Service Provider.<br/>
                            ☐ One time service to occur on _____________, 20____.
                          </td>
                        </tr>
                        <tr>
                          <td colSpan={2} style={{ border: "1px solid #000", padding: "5px 8px", fontSize: 10, fontWeight: "bold" }}>
                            Service Provider will perform the following services at the store subject to the terms of this Contract (IT IS AGREED THAT SERVICE PROVIDER WILL NOT PERFORM ANY SERVICE THAT IS NOT LISTED BELOW):
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Services table */}
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
                      <thead>
                        <tr style={{ background: "#e8e8e8" }}>
                          {["SERVICE","DESCRIPTION","FREQUENCY","COST"].map(h => <th key={h} style={{ border: "1px solid #000", padding: "4px 6px", textAlign: "center" }}>{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {/* Spring Cleanup */}
                        <tr>
                          <td style={{ border:"1px solid #000",padding:"6px",fontWeight:"bold",verticalAlign:"top" }}>Spring Clean-up</td>
                          <td style={{ border:"1px solid #000",padding:"6px",verticalAlign:"top" }}>
                            {["☐ Provide clean-up per spec","☐ Blow/vacuum – driveways & landscape per spec","☐ Prune hedges, shrubs, and evergreens","☐ Cultivate & cut beds / tree rings","☐ Apply pre-emergent weed control to beds","☐ Trim trees/shrubs protruding through fence lines (perimeter)"].map(t=><div key={t} style={{marginBottom:2}}>{t}</div>)}
                          </td>
                          <td style={{ border:"1px solid #000",padding:"6px",textAlign:"center",verticalAlign:"top" }}>☐ Annually 1 Time Fee</td>
                          <td style={{ border:"1px solid #000",padding:"6px",textAlign:"right",verticalAlign:"top" }}>
                            {(() => { const sv=getSvcData("spring_cleanup"); return sv.included && sv.subPrice > 0 ? <strong>${sv.subPrice.toFixed(2)}</strong> : <span style={{color:"#888"}}>$Upon Request</span>; })()}
                          </td>
                        </tr>
                        {/* Spring Services Optional */}
                        <tr>
                          <td style={{ border:"1px solid #000",padding:"6px",verticalAlign:"top" }}>
                            <div style={{fontWeight:"bold"}}>Spring Service-</div>
                            <div style={{color:"#c8760a",fontWeight:"bold"}}>(optional costs)</div>
                            <div style={{fontSize:9,marginTop:4}}>Please provide a cost for each of the following</div>
                          </td>
                          <td style={{ border:"1px solid #000",padding:"6px",verticalAlign:"top" }}>
                            {['☐ 2" mulch of beds','☐ Sprinkler start up – if applicable',"☐ Prune trees up to 12' in height","☐ Annual trim of Palm trees"].map(t=><div key={t} style={{marginBottom:2}}>{t}</div>)}
                          </td>
                          <td style={{ border:"1px solid #000",padding:"6px",fontSize:9,verticalAlign:"top" }}>
                            {["☐ Annual 1 time","☐ Annual 1 time","☐ Annual 1 time if applicable","☐ Annual 1 time if applicable"].map(t=><div key={t}>{t}</div>)}
                          </td>
                          <td style={{ border:"1px solid #000",padding:"6px",verticalAlign:"top" }}>
                            {["spring_mulch","spring_sprinkler","spring_trees"].map(id => { const sv=getSvcData(id); return <div key={id} style={{marginBottom:4}}>$ {sv.included&&sv.subPrice>0?<strong>{sv.subPrice.toFixed(2)}</strong>:<span style={{display:"inline-block",borderBottom:"1px solid #000",minWidth:50,height:12}}/>}</div>; })}
                          </td>
                        </tr>
                        {/* Weekly Mowing */}
                        {(() => { const sv=getSvcData("mowing"); return (
                          <tr>
                            <td style={{ border:"1px solid #000",padding:"6px",fontWeight:"bold",verticalAlign:"top" }}>Weekly Lawn Maintenance<div style={{fontWeight:"normal",fontSize:9}}>(per specifications provided)</div></td>
                            <td style={{ border:"1px solid #000",padding:"6px",verticalAlign:"top" }}>Provide weekly cut, clippings removal, clean up, trimming / edging, and weed maintenance</td>
                            <td style={{ border:"1px solid #000",padding:"6px",textAlign:"center",verticalAlign:"top" }}>☐ Monthly</td>
                            <td style={{ border:"1px solid #000",padding:"6px",textAlign:"right",fontWeight:"bold",fontSize:13,verticalAlign:"top" }}>
                              {sv.included&&sv.subPrice>0 ? <>$ {sv.subPrice.toFixed(0)}</> : <span style={{color:"#888",fontSize:10,fontWeight:"normal"}}>$</span>}
                            </td>
                          </tr>
                        ); })()}
                        {/* Fall Cleanup */}
                        {(() => { const sv=getSvcData("fall_cleanup"); return (
                          <tr>
                            <td style={{ border:"1px solid #000",padding:"6px",fontWeight:"bold",verticalAlign:"top" }}>Fall Clean up</td>
                            <td style={{ border:"1px solid #000",padding:"6px",verticalAlign:"top" }}>
                              {["☐ Final blow / vacuum Driveways","☐ Final clean-up landscaped areas","☐ Late season pruning (if applicable)","☐ Decommission Sprinkler system / clock"].map(t=><div key={t} style={{marginBottom:2}}>{t}</div>)}
                            </td>
                            <td style={{ border:"1px solid #000",padding:"6px",textAlign:"center",verticalAlign:"top" }}>☐ Annually</td>
                            <td style={{ border:"1px solid #000",padding:"6px",textAlign:"right",verticalAlign:"top" }}>
                              {sv.included&&sv.subPrice>0?<strong>$ {sv.subPrice.toFixed(2)}</strong>:<span style={{color:"#888"}}>$</span>}
                            </td>
                          </tr>
                        ); })()}
                        {/* Gutter Cleaning */}
                        {(() => { const sv=getSvcData("gutter_cleaning"); return (
                          <tr>
                            <td style={{ border:"1px solid #000",padding:"6px",fontWeight:"bold",verticalAlign:"top" }}>Gutter Cleaning<div style={{fontWeight:"normal",fontSize:9}}>(per specifications provided)</div></td>
                            <td style={{ border:"1px solid #000",padding:"6px",verticalAlign:"top" }}><div>☐ Spring Service (1)</div><div>☐ Fall Service (2)</div></td>
                            <td style={{ border:"1px solid #000",padding:"6px",textAlign:"center",verticalAlign:"top" }}>☐ 3 services total</td>
                            <td style={{ border:"1px solid #000",padding:"6px",textAlign:"right",verticalAlign:"top" }}>
                              {sv.included&&sv.subPrice>0?<strong>$ {sv.subPrice.toFixed(2)}</strong>:<span style={{color:"#888"}}>$</span>}
                            </td>
                          </tr>
                        ); })()}
                        {/* Retention Areas */}
                        {(() => { const sv=getSvcData("retention_areas"); return (
                          <tr>
                            <td style={{ border:"1px solid #000",padding:"6px",fontWeight:"bold",verticalAlign:"top" }}>Retention Areas<div style={{fontWeight:"normal",fontSize:9}}>(per specifications provided)</div></td>
                            <td style={{ border:"1px solid #000",padding:"6px",verticalAlign:"top" }}>☐ Trim monthly / remove trash and debris</td>
                            <td style={{ border:"1px solid #000",padding:"6px",textAlign:"center",verticalAlign:"top" }}>☐ Monthly</td>
                            <td style={{ border:"1px solid #000",padding:"6px",textAlign:"right",verticalAlign:"top" }}>
                              {sv.included&&sv.subPrice>0?<strong>$ {sv.subPrice.toFixed(2)}</strong>:<span style={{color:"#888"}}>$</span>}
                            </td>
                          </tr>
                        ); })()}
                        {/* Optional Items */}
                        <tr>
                          <td style={{ border:"1px solid #000",padding:"6px",fontWeight:"bold",color:"#c8760a",verticalAlign:"top" }}>Optional Items</td>
                          <td style={{ border:"1px solid #000",padding:"6px",verticalAlign:"top" }}>
                            <div>N/a</div>
                            <div style={{marginTop:4}}>☐ Spring Fertilization lawn / plants</div>
                            <div>☐ Fall Fertilization lawn / plants</div>
                          </td>
                          <td style={{ border:"1px solid #000",padding:"6px",fontSize:9,verticalAlign:"top" }}><div>☐ Monthly</div><div>☐ Annually</div><div>☐ Annually</div></td>
                          <td style={{ border:"1px solid #000",padding:"6px",verticalAlign:"top",fontSize:9 }}>
                            <div>$ <span style={{display:"inline-block",borderBottom:"1px solid #000",minWidth:40,height:12}}/></div>
                            <div>$ <span style={{display:"inline-block",borderBottom:"1px solid #000",minWidth:40,height:12}}/></div>
                            <div style={{marginTop:4,color:"#888"}}>Monthly or Upon Request</div>
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Total cost rows */}
                    <table style={{ width:"100%",borderCollapse:"collapse" }}>
                      <tbody>
                        <tr>
                          <td style={{ border:"1px solid #000",padding:"6px 8px",fontWeight:"bold",width:"40%" }}>Total Contract Cost</td>
                          <td style={{ border:"1px solid #000",padding:"6px 8px",width:"35%" }}>&nbsp;</td>
                          <td style={{ border:"1px solid #000",padding:"6px 8px",fontSize:9,width:"17%" }}>
                            <div>Total Cost (w/o optional items)</div><div>Total Cost (w/ Optional items)</div>
                          </td>
                          <td style={{ border:"1px solid #000",padding:"6px 8px",textAlign:"right",width:"8%" }}><div>$</div><div>$</div></td>
                        </tr>
                        <tr>
                          <td colSpan={4} style={{ border:"1px solid #000",padding:"6px 8px" }}>
                            <strong>Total Cost per (circle one): application / month / quarter / year</strong>
                            <span style={{float:"right"}}><strong>$</strong></span>
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Additional Terms */}
                    <div style={{ marginTop: 8, fontSize: 9, lineHeight: 1.55 }}>
                      <div style={{ fontWeight: "bold", fontSize: 10, marginBottom: 4, textTransform: "uppercase" }}>Additional Terms</div>
                      <ul style={{ listStyle: "disc", paddingLeft: 16 }}>
                        {[
                          "All work performed is to be completed in a clean, neat, and professional manner consistent with industry standards. Service Provider shall not use any subcontractors unless Owner's prior written approval is obtained.",
                          "Service Provider will, within 30 days after Owner's written request, repair and/or replace any damage to the store caused by Service Provider.",
                          "Service Provider must obtain and maintain, during the Contract Term, the insurance described on Owner's Insurance Requirements Form and deliver a Certificate of Insurance prior to performing any work.",
                          "Service Provider will indemnify, defend, and hold harmless Owner and Farmer Development, Inc. from any and all claims, losses, costs, injuries, damages, and liabilities arising out of or in connection with any act, omission, or negligence of Service Provider.",
                          "Each party shall have the right to terminate this Contract if the other party fails to cure a default or breach within 10 days after receipt of written notice thereof.",
                          "All Fees invoices must be tendered to Agent within thirty (30) days after completion of the Services, after which such Fee invoices will no longer be honored.",
                          "Receipt by Contractor of funds from Owner so as to permit payment to Subcontractor. This is a pay when paid clause. Subcontractor is not entitled to payment unless and until Contractor has been paid.",
                          "Service Provider may not assign this Contract without Owner's prior written consent. Owner may assign this Contract at any time to Owner's successor or nominee.",
                          "The individuals signing this Contract represent and warrant that they are duly authorized to enter into this Agreement and to bind Service Provider and Owner respectively.",
                        ].map((t,i) => <li key={i} style={{marginBottom:4}}>{t}</li>)}
                      </ul>
                    </div>

                    {/* Signatures */}
                    <table style={{ width:"100%",borderCollapse:"collapse",marginTop:10,fontSize:10 }}>
                      <tbody>
                        <tr>
                          <td style={{ border:"1px solid #000",padding:"6px 8px",width:"65%",verticalAlign:"top" }}>
                            <div style={{fontWeight:"bold",marginBottom:18}}>Service Provider Signature:</div>
                            <div style={{borderBottom:"1px solid #000",height:28,marginBottom:4}}/>
                            <div style={{fontSize:9,color:"#444"}}>Signature / Printed Name</div>
                          </td>
                          <td style={{ border:"1px solid #000",padding:"6px 8px",verticalAlign:"top" }}>
                            <div style={{fontWeight:"bold",marginBottom:4}}>Date:</div>
                            <div style={{borderBottom:"1px solid #000",height:28,marginBottom:4}}/>
                          </td>
                        </tr>
                        <tr>
                          <td style={{ border:"1px solid #000",padding:"6px 8px",verticalAlign:"top" }}>
                            <div style={{fontWeight:"bold",marginBottom:18}}>Owner Signature (by the Authorized Signer of Agent, solely in its capacity as duly authorized agent for Owner):</div>
                            <div style={{borderBottom:"1px solid #000",height:28,marginBottom:4}}/>
                            <div style={{fontSize:9,color:"#444"}}>Signature / Printed Name</div>
                          </td>
                          <td style={{ border:"1px solid #000",padding:"6px 8px",verticalAlign:"top" }}>
                            <div style={{fontWeight:"bold",marginBottom:4}}>Date:</div>
                            <div style={{borderBottom:"1px solid #000",height:28,marginBottom:4}}/>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <div style={{fontSize:8,color:"#888",textAlign:"center",marginTop:8}}>Page 1 of 2</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
