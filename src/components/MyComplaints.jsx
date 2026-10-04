import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, Check, ClipboardList, Clock3, MapPin, Plus } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { API_BASE } from "../services/api";
import { STATUS_STEPS, formatRelativeTime, normalizeStatus, readLocalComplaints, statusIndex } from "../utils/complaints";
import "./MyComplaints.css";

const filters = ["All", "Submitted", "In Progress", "Resolved"];

export default function MyComplaints({ onOpenReport }) {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const local = readLocalComplaints();
      let remote = [];
      if (token) {
        try {
          const response = await fetch(`${API_BASE}/complaints/user`, { headers: { Authorization: `Bearer ${token}` } });
          const data = await response.json();
          if (response.ok) remote = data.data || [];
        } catch { /* Local reports remain available offline. */ }
      }
      const merged = [...remote, ...local].filter((item, index, all) => index === all.findIndex((other) => other.complaint_id === item.complaint_id));
      if (active) { setComplaints(merged); setLoading(false); }
    };
    load();
    const refresh = () => load();
    window.addEventListener("civora:complaint", refresh);
    window.addEventListener("focus", refresh);
    return () => { active = false; window.removeEventListener("civora:complaint", refresh); window.removeEventListener("focus", refresh); };
  }, [token]);

  const visible = useMemo(() => complaints.filter((item) => {
    const status = normalizeStatus(item.status);
    if (filter === "All") return true;
    if (filter === "In Progress") return status === "Assigned" || status === "In Progress";
    return status === filter;
  }), [complaints, filter]);

  return <main className="citizen-dashboard">
    <div className="container">
      <header className="dashboard-heading">
        <div><span className="dashboard-kicker">CITIZEN DASHBOARD</span><h1>My complaints</h1><p>Track every report from submission to verified resolution.</p></div>
        <button className="dashboard-report" onClick={onOpenReport || (() => navigate("/?report=true"))}><Plus size={18}/> Report an issue</button>
      </header>
      <section className="dashboard-summary">
        <div><ClipboardList/><span><strong>{complaints.length}</strong><small>Total reports</small></span></div>
        <div><Clock3/><span><strong>{complaints.filter((c) => normalizeStatus(c.status) !== "Resolved").length}</strong><small>Active</small></span></div>
        <div><Check/><span><strong>{complaints.filter((c) => normalizeStatus(c.status) === "Resolved").length}</strong><small>Resolved</small></span></div>
      </section>
      <nav className="complaint-filters" aria-label="Filter complaints">{filters.map((name) => <button key={name} className={filter === name ? "active" : ""} onClick={() => setFilter(name)}>{name}<span>{name === "All" ? complaints.length : complaints.filter((c) => name === "In Progress" ? ["Assigned", "In Progress"].includes(normalizeStatus(c.status)) : normalizeStatus(c.status) === name).length}</span></button>)}</nav>
      {loading ? <div className="dashboard-state">Loading your complaints…</div> : visible.length === 0 ? <div className="dashboard-state empty"><ClipboardList size={38}/><h2>{complaints.length ? "No complaints in this status" : "Your reports will appear here"}</h2><p>Submit an issue and Civora will create a trackable complaint ID.</p></div> : <div className="dashboard-list">{visible.map((item) => {
        const status = normalizeStatus(item.status); const current = statusIndex(status);
        return <article className="dashboard-complaint" key={item.complaint_id}>
          <div className="complaint-card-head"><div><span>{item.complaint_id}</span><h2>{item.issue_type || item.category}</h2><p><MapPin size={15}/>{item.area}, {item.city}</p></div><div className={`lifecycle-status status-${status.toLowerCase().replace(" ", "-")}`}><i/>{status}</div></div>
          <p className="dashboard-description">{item.description}</p>
          <ol className="mini-timeline">{STATUS_STEPS.map((name, index) => <li className={index <= current ? "complete" : ""} key={name}><span>{index < current ? <Check size={13}/> : index + 1}</span><small>{name}</small></li>)}</ol>
          <footer><span>Last updated {formatRelativeTime(item.updated_at || item.created_at)}</span><button onClick={() => navigate(`/track?id=${item.complaint_id}`)}>View details <ArrowUpRight size={15}/></button></footer>
        </article>;
      })}</div>}
    </div>
  </main>;
}
