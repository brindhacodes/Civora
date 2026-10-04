import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle, BarChart3, Building2, Calendar, CheckCircle2, ChevronDown, ChevronUp,
  ClipboardList, Clock3, FileBarChart, Gauge, LayoutDashboard, Mail, Map as MapIcon,
  MapPin, Phone, RefreshCw, Search, Send, ShieldCheck, Upload,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { API_BASE, API_ORIGIN } from "../services/api";
import { normalizeStatus, readLocalComplaints } from "../utils/complaints";
import LiveMap from "./LiveMap";
import "./AdminDashboard.css";

const DEPARTMENTS = ["Roads Department", "Sanitation", "Water Department", "Electrical Department", "General Administration"];
const STATUSES = ["Submitted", "Assigned", "In Progress", "Resolved"];
const CATEGORIES = ["Pothole", "Garbage", "Water", "Streetlight", "Other"];

function TabIcon({ component }) {
  const Component = component;
  return <Component />;
}

const categoryOf = (item) => {
  const value = String(item.issue_type || "").toLowerCase();
  if (value.includes("pothole") || value.includes("road")) return "Pothole";
  if (value.includes("garbage") || value.includes("waste")) return "Garbage";
  if (value.includes("water") || value.includes("leak")) return "Water";
  if (value.includes("light") || value.includes("electric")) return "Streetlight";
  return "Other";
};

const mergeRecords = (remote, local) => [...remote, ...local]
  .filter((item, index, all) => index === all.findIndex((other) => other.complaint_id === item.complaint_id))
  .map((item) => ({ ...item, id: item.id || item.complaint_id, status: normalizeStatus(item.status), issue_type: item.issue_type || item.issueType }));

const saveLocalChange = (id, changes) => {
  const records = readLocalComplaints();
  const updated = records.map((item) => String(item.id || item.complaint_id) === String(id) ? { ...item, ...changes, updated_at: new Date().toISOString() } : item);
  localStorage.setItem("civora_issues", JSON.stringify(updated));
  localStorage.setItem("reports", JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent("civora:complaint"));
};

export default function AdminDashboard() {
  const { token } = useAuth();
  const [now] = useState(() => Date.now());
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("dashboard");
  const [statusFilter, setStatusFilter] = useState("All");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [busy, setBusy] = useState({});
  const [remarks, setRemarks] = useState({});
  const [proofs, setProofs] = useState({});
  const [notice, setNotice] = useState("");

  const loadComplaints = useCallback(async () => {
    setLoading(true);
    let remote = [];
    try {
      const response = await fetch(`${API_BASE}/complaints`);
      const data = await response.json();
      if (response.ok) remote = data.data || [];
    } catch { /* Local reports keep the authority portal usable offline. */ }
    setComplaints(mergeRecords(remote, readLocalComplaints()));
    setLoading(false);
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(loadComplaints);
    window.addEventListener("civora:complaint", loadComplaints);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("civora:complaint", loadComplaints); };
  }, [loadComplaints]);

  const filtered = useMemo(() => complaints.filter((item) => {
    const haystack = `${item.complaint_id} ${item.issue_type} ${item.area} ${item.city} ${item.name}`.toLowerCase();
    return (statusFilter === "All" || item.status === statusFilter)
      && (departmentFilter === "All" || item.department === departmentFilter)
      && haystack.includes(query.toLowerCase());
  }), [complaints, statusFilter, departmentFilter, query]);

  const categoryCounts = useMemo(() => Object.fromEntries(CATEGORIES.map((name) => [name, complaints.filter((item) => categoryOf(item) === name).length])), [complaints]);
  const maxCategory = Math.max(1, ...Object.values(categoryCounts));
  const resolved = complaints.filter((item) => item.status === "Resolved").length;
  const critical = complaints.filter((item) => String(item.severity).toLowerCase() === "high" && item.status !== "Resolved");
  const slaBreached = complaints.filter((item) => item.status !== "Resolved" && now - new Date(item.created_at).getTime() > 7 * 86400000);

  const assignDepartment = async (item, department) => {
    setBusy((old) => ({ ...old, [item.id]: true }));
    let updated = { ...item, department, status: ["Submitted", "Pending"].includes(item.status) ? "Assigned" : item.status };
    try {
      const response = await fetch(`${API_BASE}/assign`, { method: "POST", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ complaintId: String(item.complaint_id || item.id), department }) });
      const data = await response.json();
      if (response.ok) updated = { ...updated, ...(data.data || {}) };
    } catch { /* Persist local authority action below. */ }
    saveLocalChange(item.id, { department: updated.department, status: updated.status });
    setComplaints((old) => old.map((entry) => entry.id === item.id ? updated : entry));
    setBusy((old) => ({ ...old, [item.id]: false }));
    setNotice(`${item.complaint_id} assigned to ${department}.`);
  };

  const saveUpdate = async (item) => {
    const status = item.status;
    const remark = remarks[item.id] ?? item.remarks ?? "";
    const proof = proofs[item.id];
    setBusy((old) => ({ ...old, [item.id]: true }));
    let updated = { ...item, status, remarks: remark, updated_at: new Date().toISOString() };
    try {
      const body = new FormData(); body.append("status", status); body.append("remarks", remark); if (proof) body.append("resolutionProof", proof);
      const response = await fetch(`${API_BASE}/complaints/${item.id}`, { method: "PUT", headers: token ? { Authorization: `Bearer ${token}` } : {}, body });
      const data = await response.json();
      if (response.ok) updated = { ...updated, ...(data.data || {}) };
    } catch { /* Persist local authority action below. */ }
    saveLocalChange(item.id, { status, remarks: remark });
    setComplaints((old) => old.map((entry) => entry.id === item.id ? updated : entry));
    setBusy((old) => ({ ...old, [item.id]: false }));
    setNotice(`${item.complaint_id} updated. The citizen can now see this change.`);
  };

  const setComplaintStatus = (id, status) => setComplaints((old) => old.map((item) => item.id === id ? { ...item, status } : item));
  const whatsappHref = (item) => `https://wa.me/${String(item.phone || "").replace(/\D/g, "")}?text=${encodeURIComponent(`Civora update for ${item.complaint_id}: ${item.status}. ${item.remarks || "Open Civora to view the latest details."}`)}`;

  return <main className="authority-dashboard">
    <div className="authority-shell">
      <header className="authority-header"><div><span className="portal-kicker">CIVORA · GOVERNMENT OPERATIONS</span><h1>Government Officer Portal</h1><p>Assign, resolve and communicate every civic complaint from one accountable operational view.</p></div><button onClick={loadComplaints} disabled={loading}><RefreshCw className={loading ? "spin" : ""}/> Refresh live data</button></header>

      <section className="authority-stats">
        <div><span>Pending</span><strong>{complaints.filter((item) => ["Submitted", "Pending", "Assigned"].includes(item.status)).length}</strong></div>
        <div><span>Critical</span><strong>{critical.length}</strong></div>
        <div><span>In progress</span><strong>{complaints.filter((item) => item.status === "In Progress").length}</strong></div>
        <div><span>Resolved</span><strong>{resolved}</strong></div>
        <div><span>SLA breached</span><strong>{slaBreached.length}</strong></div>
      </section>

      <div className="authority-workspace">
      <nav className="authority-tabs" aria-label="Officer portal sections">
        {[{ id:"dashboard", label:"Dashboard", icon:LayoutDashboard }, { id:"complaints", label:"Complaints", icon:ClipboardList }, { id:"map", label:"Civic map", icon:MapIcon }, { id:"departments", label:"Departments", icon:Building2 }, { id:"sla", label:"SLA monitor", icon:Gauge }, { id:"analytics", label:"Analytics", icon:BarChart3 }, { id:"reports", label:"Reports", icon:FileBarChart }].map(({ id, label, icon }) => <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}><TabIcon component={icon}/>{label}</button>)}
      </nav>
      <div className="authority-content">

      {notice && <div className="authority-notice" role="status"><CheckCircle2/>{notice}<button onClick={() => setNotice("")}>Dismiss</button></div>}

      {tab === "dashboard" && <section className="officer-overview"><div className="officer-overview__main"><header><div><span>LIVE OPERATIONS</span><h2>Cases requiring attention</h2></div><button onClick={() => setTab("complaints")}>Open complaint queue</button></header>{[...critical, ...slaBreached].filter((item,index,all) => index === all.findIndex((other) => other.id === item.id)).slice(0,5).map((item) => <article key={item.id}><span className="attention-icon"><AlertTriangle/></span><div><strong>{item.issue_type}</strong><small>{item.complaint_id} · {item.area}, {item.city}</small></div><em>{slaBreached.includes(item) ? "SLA breached" : "High priority"}</em></article>)}{critical.length + slaBreached.length === 0 && <div className="authority-empty"><CheckCircle2/><h2>No urgent cases</h2><p>The live queue has no critical or overdue complaints.</p></div>}</div><aside><h2>Service snapshot</h2><div><span>Resolution rate</span><strong>{complaints.length ? Math.round(resolved / complaints.length * 100) : 0}%</strong></div><div><span>Open workload</span><strong>{complaints.length - resolved}</strong></div><div><span>Departments active</span><strong>{new Set(complaints.map((item) => item.department).filter(Boolean)).size}</strong></div><p>Calculated from the current Civora complaint dataset.</p></aside></section>}

      {tab === "complaints" && <section className="authority-panel">
        <div className="authority-tools"><label><Search/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search ID, issue, area or citizen"/></label><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option>All</option>{STATUSES.map((value) => <option key={value}>{value}</option>)}</select><select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}><option>All</option>{DEPARTMENTS.map((value) => <option key={value}>{value}</option>)}</select></div>
        {loading ? <div className="authority-empty">Loading complaints…</div> : filtered.length === 0 ? <div className="authority-empty"><ClipboardList/><h2>No complaints match this view</h2><p>New citizen reports will appear here automatically.</p></div> : <div className="authority-list">{filtered.map((item) => <article className="authority-case" key={item.id}>
          <button className="case-summary" onClick={() => setExpanded(expanded === item.id ? null : item.id)} aria-expanded={expanded === item.id}><div><span>{item.complaint_id}</span><h2>{item.issue_type}</h2><p><MapPin/>{item.area}, {item.city}</p></div><div className="case-summary-meta"><span className={`case-status ${item.status.toLowerCase().replace(" ", "-")}`}>{item.status}</span><span>{item.department || "Unassigned"}</span>{expanded === item.id ? <ChevronUp/> : <ChevronDown/>}</div></button>
          {expanded === item.id && <div className="case-workspace">
            <div className="case-evidence">{item.image_url ? <img src={`${API_ORIGIN}${item.image_url}`} alt="Citizen evidence"/> : <div className="no-evidence"><Upload/><span>No evidence uploaded</span></div>}<div><h3>Issue details</h3><p>{item.description}</p><span><Calendar/> Reported {new Date(item.created_at).toLocaleDateString("en-IN")}</span></div></div>
            <div className="case-controls">
              <label>Responsible department<select value={item.department || "General Administration"} disabled={busy[item.id]} onChange={(e) => assignDepartment(item, e.target.value)}>{DEPARTMENTS.map((value) => <option key={value}>{value}</option>)}</select></label>
              <label>Complaint status<select value={item.status} onChange={(e) => setComplaintStatus(item.id, e.target.value)}>{STATUSES.map((value) => <option key={value}>{value}</option>)}</select></label>
              <label className="remarks-field">Authority remarks<textarea rows="4" value={remarks[item.id] ?? item.remarks ?? ""} onChange={(e) => setRemarks((old) => ({ ...old, [item.id]: e.target.value }))} placeholder="Explain the inspection, work completed, or next action."/></label>
              <label className="proof-field"><Upload/> Resolution proof<input type="file" accept="image/*" onChange={(e) => setProofs((old) => ({ ...old, [item.id]: e.target.files?.[0] }))}/><span>{proofs[item.id]?.name || (item.resolution_proof_url ? "Proof already uploaded" : "Choose a completion photo")}</span></label>
              <button className="save-case" disabled={busy[item.id]} onClick={() => saveUpdate(item)}>{busy[item.id] ? "Saving…" : "Save update"}</button>
            </div>
            <div className="citizen-contact"><div><UserRound/><span><strong>{item.name || item.reporter_name || "Citizen"}</strong><small>{item.phone || item.email || "No contact details"}</small></span></div><div>{item.phone && <a href={`tel:${item.phone}`}><Phone/> Call</a>}{item.phone && <a href={whatsappHref(item)} target="_blank" rel="noreferrer"><Send/> Notify</a>}{item.email && <a href={`mailto:${item.email}?subject=${encodeURIComponent(`Civora update: ${item.complaint_id}`)}`}><Mail/> Email</a>}</div></div>
          </div>}
        </article>)}</div>}
      </section>}

      {tab === "map" && <section className="authority-map"><LiveMap/></section>}

      {tab === "departments" && <section className="authority-panel department-grid">{DEPARTMENTS.map((department) => { const cases = complaints.filter((item) => item.department === department); const complete = cases.filter((item) => item.status === "Resolved").length; return <article key={department}><Building2/><div><h2>{department}</h2><p>{cases.length} assigned · {complete} resolved</p></div><strong>{cases.length ? Math.round(complete / cases.length * 100) : 0}%</strong></article>; })}</section>}

      {tab === "sla" && <section className="authority-panel"><div className="analytics-heading"><h2>SLA monitoring</h2><p>Open complaints older than seven days are flagged automatically.</p></div><div className="sla-list">{slaBreached.map((item) => <article key={item.id}><Clock3/><div><strong>{item.complaint_id} · {item.issue_type}</strong><span>{item.department} · {item.area}</span></div><em>{Math.floor((now - new Date(item.created_at).getTime()) / 86400000)} days open</em></article>)}{slaBreached.length === 0 && <div className="authority-empty"><ShieldCheck/><h2>All cases within SLA</h2></div>}</div></section>}

      {tab === "analytics" && <section className="authority-analytics"><div className="analytics-heading"><h2>Issues by category</h2><p>Live distribution across all reported complaints.</p></div><div className="analytics-bars">{CATEGORIES.map((name) => <div key={name}><span>{name}<b>{categoryCounts[name]}</b></span><i><em style={{ width:`${(categoryCounts[name] / maxCategory) * 100}%` }}/></i></div>)}</div><div className="resolution-summary"><ShieldCheck/><div><strong>{complaints.length ? Math.round((resolved / complaints.length) * 100) : 0}%</strong><span>Resolution rate</span></div><p>{resolved} of {complaints.length} complaints have reached verified resolution.</p></div></section>}

      {tab === "reports" && <section className="authority-panel"><div className="analytics-heading"><h2>Operational reports</h2><p>Live summary for review meetings and public accountability.</p></div><div className="report-summary-grid"><div><span>Total received</span><strong>{complaints.length}</strong></div><div><span>Resolved</span><strong>{resolved}</strong></div><div><span>Critical open</span><strong>{critical.length}</strong></div><div><span>SLA compliance</span><strong>{complaints.length ? Math.round(((complaints.length - slaBreached.length) / complaints.length) * 100) : 100}%</strong></div></div></section>}
      </div></div>
    </div>
  </main>;
}
