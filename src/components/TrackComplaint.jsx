import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AlertCircle, Calendar, Check, MapPin, RotateCcw, Search, ShieldCheck, ThumbsUp } from "lucide-react";
import { API_BASE, API_ORIGIN } from "../services/api";
import { formatRelativeTime, normalizeStatus, readLocalComplaints } from "../utils/complaints";
import "./TrackComplaint.css";

const JOURNEY = [
  ["Submitted", "Your report is registered with its photo and location."],
  ["Verified", "Civic staff reviewed the report and confirmed the issue."],
  ["Department assigned", "The responsible government department received it."],
  ["Officer assigned", "An accountable officer now owns the next action."],
  ["Work started", "Field work is underway and updates are being recorded."],
  ["Resolved", "Resolution evidence has been uploaded for your review."],
  ["Citizen verified", "The reporting citizen confirmed the outcome."],
];

const journeyIndex = (status, verified) => {
  if (verified) return 6;
  if (status === "Resolved") return 5;
  if (status === "In Progress") return 4;
  if (status === "Assigned") return 3;
  if (status === "Pending") return 1;
  return 0;
};

export default function TrackComplaint() {
  const [params] = useSearchParams();
  const [complaintId, setComplaintId] = useState(params.get("id") || "");
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [verification, setVerification] = useState("");

  const findComplaint = async (rawId) => {
    const id = rawId.trim().toUpperCase();
    if (!id) return setError("Enter your complaint ID to continue.");
    setLoading(true); setError(""); setComplaint(null);
    try {
      const response = await fetch(`${API_BASE}/complaints/${encodeURIComponent(id)}`);
      const data = await response.json();
      if (response.ok && data.data) { setComplaint(data.data); setVerification(localStorage.getItem(`civora_verification_${data.data.complaint_id}`) || ""); }
      else throw new Error();
    } catch {
      const local = readLocalComplaints().find((item) => String(item.complaint_id).toUpperCase() === id);
      if (local) { setComplaint(local); setVerification(localStorage.getItem(`civora_verification_${local.complaint_id}`) || ""); } else setError("We could not find that complaint. Check the ID and try again.");
    } finally { setLoading(false); }
  };

  useEffect(() => { const id = params.get("id"); if (id) findComplaint(id); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const status = normalizeStatus(complaint?.status);
  const current = journeyIndex(status, verification === "yes");
  const verifyResolution = (answer) => {
    setVerification(answer);
    localStorage.setItem(`civora_verification_${complaint.complaint_id}`, answer);
  };

  return <main className="track-complaint"><div className="track-complaint__container">
    <header className="track-complaint__header"><span className="dashboard-kicker">END-TO-END VISIBILITY</span><h1>Track my complaint</h1><p>Enter your Civora complaint ID to see assignment, progress and resolution updates.</p></header>
    <form className="track-complaint__search" onSubmit={(e) => { e.preventDefault(); findComplaint(complaintId); }}><div className="search-input-wrapper"><Search className="search-icon"/><input className="search-input" value={complaintId} onChange={(e) => setComplaintId(e.target.value)} placeholder="CIV-2026-004821" aria-label="Complaint ID"/></div><button className="search-button" disabled={loading}>{loading ? "Checking…" : "Track complaint"}</button></form>
    {error && <div className="track-complaint__error"><AlertCircle/><p>{error}</p></div>}
    {complaint && <div className="track-complaint__result">
      <article className="result-card"><header className="result-header"><div className="complaint-id"><span className="label">COMPLAINT ID</span><span className="value">{complaint.complaint_id}</span></div><div className={`status-badge ${status.toLowerCase().replace(" ", "-")}`}><span>{status}</span></div></header><div className="result-body">
        <section className="info-section"><h3>Issue details</h3><div className="info-grid"><div className="info-item"><span className="label">Issue</span><span className="value">{complaint.issue_type}</span></div><div className="info-item"><span className="label">Priority</span><span className="value">{complaint.severity || "Medium"}</span></div><div className="info-item"><span className="label">Responsible team</span><span className="value">{complaint.department || "Awaiting triage"}</span></div></div></section>
        {complaint.image_url && <section className="info-section"><h3>Evidence</h3><img src={`${API_ORIGIN}${complaint.image_url}`} alt="Reported issue" className="track-evidence"/></section>}
        <section className="info-section"><h3>Description</h3><p className="description">{complaint.description}</p></section>
        <section className="info-section"><h3>Location</h3><div className="location-info"><MapPin className="location-icon"/><span>{complaint.area}, {complaint.city}</span></div></section>
        {complaint.remarks && <section className="info-section"><h3>Authority update</h3><p className="description">{complaint.remarks}</p></section>}
        {complaint.resolution_proof_url && <section className="info-section resolution-proof"><h3>Resolution proof</h3><img src={`${API_ORIGIN}${complaint.resolution_proof_url}`} alt="Proof that the civic issue was resolved"/><p>The responsible team uploaded this completion photo.</p></section>}
        {status === "Resolved" && <section className="citizen-verification"><ShieldCheck/><div><h3>Citizen verification</h3><p>Has this issue actually been resolved?</p>{verification && <strong>{verification === "yes" ? "Thank you — resolution confirmed." : "Reopen requested. The authority can see that follow-up is needed."}</strong>}</div><div><button className="verify-yes" onClick={() => verifyResolution("yes")}><ThumbsUp/> Yes, resolved</button><button onClick={() => verifyResolution("no")}><RotateCcw/> No, reopen</button></div></section>}
        <footer className="result-footer"><div className="timestamp"><Calendar/><span>Reported {new Date(complaint.created_at).toLocaleDateString("en-IN", { day:"numeric", month:"long", year:"numeric" })}</span></div><div className="last-updated">Updated {formatRelativeTime(complaint.updated_at || complaint.created_at)}</div></footer>
      </div></article>
      <section className="status-timeline"><div className="timeline-heading"><div><span>PUBLIC ACCOUNTABILITY TRAIL</span><h3>Complaint journey</h3></div><strong>{current + 1} of {JOURNEY.length} stages</strong></div><div className="timeline">{JOURNEY.map(([name, detail], index) => { const state = index < current ? "complete" : index === current ? "current" : "upcoming"; return <div className={`timeline-item ${state}`} key={name}><div className="timeline-dot">{index < current ? <Check size={11}/> : index + 1}</div><div className="timeline-content"><h4>{name}</h4><p>{detail}</p></div></div>; })}</div></section>
    </div>}
  </div></main>;
}
