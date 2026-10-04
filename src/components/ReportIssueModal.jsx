import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, CircleMarker, useMapEvents } from "react-leaflet";
import {
  X, ArrowLeft, ArrowRight, Check, Camera, MapPin, FileText,
  AlertTriangle, Bot, Building2, Construction, Trash2, Droplets, Lightbulb,
  Shapes, LocateFixed, Loader2, Users,
} from "lucide-react";
import "leaflet/dist/leaflet.css";
import "./ReportIssueModal.css";
import { useAuth } from "../context/AuthContext";
import { API_BASE } from "../services/api";
import { createComplaintId, saveLocalComplaint } from "../utils/complaints";

const categories = [
  { id: "Pothole", icon: Construction, label: "Pothole", hint: "Damaged road or open pit" },
  { id: "Garbage", icon: Trash2, label: "Garbage", hint: "Waste or illegal dumping" },
  { id: "Water Leakage", icon: Droplets, label: "Water leak", hint: "Pipe leak or flooding" },
  { id: "Broken Streetlight", icon: Lightbulb, label: "Streetlight", hint: "Dark or damaged light" },
  { id: "Other", icon: Shapes, label: "Other", hint: "Another civic problem" },
];

const steps = ["Issue", "Media", "Location", "Details", "Review"];
const departmentFor = {
  Pothole: "Roads Department", Garbage: "Sanitation Department",
  "Water Leakage": "Water Department", "Broken Streetlight": "Electrical Department",
  Other: "General Administration",
};
const normalize = (value) => String(value || "").trim().toLowerCase().replace(/broken\s+|not working\s*/g, "");

function PinSelector({ position, onChange }) {
  useMapEvents({ click: (event) => onChange([event.latlng.lat, event.latlng.lng]) });
  return position ? <CircleMarker center={position} radius={10} pathOptions={{ color: "#fff", weight: 4, fillColor: "#d6ff55", fillOpacity: 1 }} /> : null;
}

function CategoryIcon({ category }) {
  const Component = category.icon;
  return <Component />;
}

export default function ReportIssueModal({ isOpen, onClose, prefillData, initialData }) {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const supplied = useMemo(() => prefillData || initialData || {}, [prefillData, initialData]);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [possibleDuplicate, setPossibleDuplicate] = useState(null);
  const [duplicateJoined, setDuplicateJoined] = useState(false);
  const [form, setForm] = useState({
    category: "", description: "", area: "", city: "Chennai", priority: "Medium",
    latitude: 13.0827, longitude: 80.2707, name: user?.name || "",
    phone: user?.phone || "", email: user?.email || "", notifications: true,
  });

  useEffect(() => {
    if (!isOpen) return;
    const frame = requestAnimationFrame(() => {
      setStep(0); setCreated(null); setError(""); setFile(null); setPreview(""); setPossibleDuplicate(null); setDuplicateJoined(false);
      setForm((old) => ({ ...old, ...supplied, category: supplied.category || supplied.issue_type || old.category }));
    });
    return () => cancelAnimationFrame(frame);
  }, [isOpen, supplied]);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  const selectedCategory = categories.find((item) => item.id === form.category);
  const SelectedIcon = selectedCategory?.icon;
  const position = useMemo(() => [Number(form.latitude), Number(form.longitude)], [form.latitude, form.longitude]);
  const routingPreview = useMemo(() => ({
    category: form.category || "Awaiting description",
    department: departmentFor[form.category] || "General Administration",
    ward: form.area ? `Service area · ${form.area}` : "Ward detected after location",
    priority: form.priority,
  }), [form.area, form.category, form.priority]);

  useEffect(() => {
    if (!isOpen || step !== 4 || !form.category || !form.area) return;
    let active = true;
    fetch(`${API_BASE}/complaints`).then((response) => response.json()).then((data) => {
      if (!active) return;
      const match = (data.data || []).find((item) =>
        normalize(item.issue_type) === normalize(form.category)
        && normalize(item.area) === normalize(form.area)
        && String(item.status).toLowerCase() !== "resolved");
      setPossibleDuplicate(match || null);
    }).catch(() => {});
    return () => { active = false; };
  }, [form.area, form.category, isOpen, step]);

  if (!isOpen) return null;

  const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const canContinue = [Boolean(form.category), true, Boolean(form.area && form.city), form.description.trim().length >= 12 && Boolean(form.name.trim()) && /^[\d\s+()-]{10,}$/.test(form.phone), true][step];
  const close = () => { if (!busy) onClose(); };
  const next = () => {
    if (!canContinue) {
      setError(step === 2 ? "Add an area and city before continuing." : "Please complete this step before continuing.");
      return;
    }
    setError(""); setStep((value) => Math.min(4, value + 1));
  };
  const selectFile = (event) => {
    const nextFile = event.target.files?.[0];
    if (!nextFile) return;
    if (nextFile.size > 15 * 1024 * 1024) return setError("Choose a photo or video smaller than 15 MB.");
    if (preview) URL.revokeObjectURL(preview);
    setFile(nextFile); setPreview(URL.createObjectURL(nextFile)); setError("");
  };
  const locate = () => {
    if (!navigator.geolocation) return setError("Location is not available in this browser.");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setForm((old) => ({ ...old, latitude: coords.latitude, longitude: coords.longitude })),
      () => setError("We could not access your location. You can place the pin manually."),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };
  const joinExisting = async () => {
    if (!possibleDuplicate?.id) return;
    setBusy(true); setError("");
    try {
      const response = await fetch(`${API_BASE}/complaints/${possibleDuplicate.id}/join`, { method: "POST" });
      if (!response.ok) throw new Error("Unable to join this report");
      setDuplicateJoined(true);
    } catch {
      setError("We could not add your support right now. You can still submit a new report.");
    } finally { setBusy(false); }
  };
  const submit = async () => {
    setBusy(true); setError("");
    const fallback = {
      complaint_id: createComplaintId(), issue_type: form.category, description: form.description,
      area: form.area, city: form.city, latitude: form.latitude, longitude: form.longitude,
      severity: form.priority, status: "Submitted", department: "Awaiting triage",
      citizen_name: form.name, citizen_phone: form.phone, citizen_email: form.email,
      media_preview: preview, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
    let result = fallback;
    try {
      const body = new FormData();
      Object.entries({ issueType: form.category, description: form.description, area: form.area, city: form.city, latitude: form.latitude, longitude: form.longitude, severity: form.priority.toLowerCase(), name: form.name, phone: form.phone, email: form.email, wantUpdates: form.notifications ? "yes" : "no" }).forEach(([key, value]) => body.append(key, value ?? ""));
      if (file) body.append("image", file);
      const response = await fetch(`${API_BASE}/complaints`, { method: "POST", headers: token ? { Authorization: `Bearer ${token}` } : {}, body });
      if (response.ok) {
        const data = await response.json();
        const payload = data.data || data.complaint || data;
        result = { ...fallback, ...payload, complaint_id: payload.complaint_id || payload.complaintId || fallback.complaint_id, issue_type: payload.issue_type || payload.issueType || fallback.issue_type, created_at: payload.created_at || payload.createdAt || fallback.created_at };
      }
    } catch { /* Offline-first: preserve the report locally. */ }
    result = saveLocalComplaint(result);
    setCreated(result); setBusy(false);
  };

  return (
    <div className="report-shell" role="dialog" aria-modal="true" aria-labelledby="report-title" onMouseDown={(event) => event.target === event.currentTarget && close()}>
      <section className="report-wizard">
        <header className="report-head">
          <div><span className="eyebrow">CIVORA REPORTING</span><h2 id="report-title">{created ? "Report received" : "Report a civic issue"}</h2></div>
          <button className="icon-button" onClick={close} aria-label="Close report form"><X /></button>
        </header>

        {created ? (
          <div className="report-success">
            <div className="success-mark"><Check /></div>
            <span className="eyebrow">COMPLAINT CREATED</span>
            <h3>{created.complaint_id}</h3>
            <p>Your report is safely recorded. Civora will show every update from assignment through resolution.</p>
            <div className="success-summary"><strong>{created.issue_type}</strong><span>{created.area}, {created.city}</span><em>Submitted</em></div>
            <div className="report-actions">
              <button className="secondary-action" onClick={() => { close(); navigate(`/track?id=${created.complaint_id}`); }}>Track complaint</button>
              <button className="primary-action" onClick={() => { close(); navigate("/dashboard"); }}>Open my dashboard</button>
            </div>
          </div>
        ) : (
          <>
            <nav className="wizard-progress" aria-label="Report progress">
              {steps.map((label, index) => <div className={`progress-step ${index === step ? "active" : ""} ${index < step ? "done" : ""}`} key={label}><span>{index < step ? <Check size={14} /> : index + 1}</span><small>{label}</small></div>)}
            </nav>
            <div className="wizard-body">
              {step === 0 && <div className="step-panel"><div className="step-title"><span>01</span><div><h3>What needs attention?</h3><p>Choose the closest category. This helps route your report correctly.</p></div></div><div className="category-grid">{categories.map((category) => <button key={category.id} className={form.category === category.id ? "selected" : ""} onClick={() => setField("category", category.id)}><CategoryIcon category={category} /><strong>{category.label}</strong><small>{category.hint}</small>{form.category === category.id && <Check className="category-check" />}</button>)}</div></div>}
              {step === 1 && <div className="step-panel"><div className="step-title"><span>02</span><div><h3>Add evidence</h3><p>A clear photo or short video helps authorities verify the issue faster.</p></div></div><label className={`media-drop ${preview ? "has-preview" : ""}`}>{preview ? (file?.type.startsWith("video") ? <video src={preview} controls /> : <img src={preview} alt="Issue preview" />) : <><Camera size={42} /><strong>Choose photo or video</strong><span>JPG, PNG or MP4 · up to 15 MB</span></>}<input type="file" accept="image/*,video/*" onChange={selectFile} /></label><button className="text-action" onClick={next}>Skip for now</button></div>}
              {step === 2 && <div className="step-panel"><div className="step-title"><span>03</span><div><h3>Pin the exact location</h3><p>Click the map or use your current location.</p></div></div><div className="location-fields"><label>Area<input value={form.area} onChange={(e) => setField("area", e.target.value)} placeholder="e.g. Anna Nagar" /></label><label>City<input value={form.city} onChange={(e) => setField("city", e.target.value)} /></label><button className="locate-button" onClick={locate}><LocateFixed size={18} /> Use my location</button></div><div className="report-map"><MapContainer center={position} zoom={13} scrollWheelZoom><TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/><PinSelector position={position} onChange={([latitude, longitude]) => setForm((old) => ({ ...old, latitude, longitude }))}/></MapContainer></div><small className="coordinates"><MapPin size={14}/> {position[0].toFixed(5)}, {position[1].toFixed(5)}</small></div>}
              {step === 3 && <div className="step-panel"><div className="step-title"><span>04</span><div><h3>Tell us what happened</h3><p>Include landmarks, safety risks and how long the problem has existed.</p></div></div><label className="full-field">Description<textarea rows="5" value={form.description} onChange={(e) => setField("description", e.target.value)} placeholder="Describe the issue clearly (at least 12 characters)"/><small>{form.description.length}/500</small></label>{form.description.length >= 12 && <div className="ai-routing-card" aria-live="polite"><span><Bot /></span><div><small>AI ROUTING PREVIEW</small><strong>Detected: {routingPreview.category}</strong><p><Building2 size={15}/> {routingPreview.department} <i/> {routingPreview.ward} <i/> Priority: {routingPreview.priority}</p></div></div>}<div className="detail-grid"><label>Priority<select value={form.priority} onChange={(e) => setField("priority", e.target.value)}><option>Low</option><option>Medium</option><option>High</option></select></label><label>Your name *<input required value={form.name} onChange={(e) => setField("name", e.target.value)} placeholder="Full name"/></label><label>Phone *<input required value={form.phone} onChange={(e) => setField("phone", e.target.value)} placeholder="10-digit phone number"/></label><label>Email<input type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} placeholder="Optional"/></label></div><label className="notification-check"><input type="checkbox" checked={form.notifications} onChange={(e) => setField("notifications", e.target.checked)}/><span><strong>Keep me informed</strong><small>Receive important status and resolution updates.</small></span></label></div>}
              {step === 4 && <div className="step-panel"><div className="step-title"><span>05</span><div><h3>Review and submit</h3><p>Confirm the details before sending your report.</p></div></div>{possibleDuplicate && <div className={`duplicate-alert${duplicateJoined ? " is-joined" : ""}`}><AlertTriangle/><div><strong>{duplicateJoined ? "You are now marked as affected" : "This issue may already be reported"}</strong><p>{possibleDuplicate.supporter_count || 1} citizen(s) reported a similar {possibleDuplicate.issue_type} in {possibleDuplicate.area}. Complaint {possibleDuplicate.complaint_id}.</p></div>{!duplicateJoined && <button type="button" disabled={busy} onClick={joinExisting}><Users/> I’m also affected</button>}</div>}<div className="review-card"><div className="review-icon">{SelectedIcon && <SelectedIcon />}</div><div><span className="eyebrow">AI CLASSIFICATION</span><h4>{selectedCategory?.label}</h4><p>{routingPreview.department} · {routingPreview.ward} · {routingPreview.priority} priority</p><p>{form.description}</p></div><button onClick={() => setStep(0)}>Edit</button></div><div className="review-grid"><div><MapPin/><span><small>Location</small><strong>{form.area}, {form.city}</strong></span></div><div><FileText/><span><small>Priority</small><strong>{form.priority}</strong></span></div><div><Camera/><span><small>Evidence</small><strong>{file ? file.name : "Not added"}</strong></span></div></div><p className="consent-note">By submitting, you confirm this report is accurate and may be shared with the responsible civic authority.</p></div>}
              {error && <p className="report-error" role="alert">{error}</p>}
            </div>
            <footer className="wizard-footer"><button className="secondary-action" disabled={step === 0 || busy} onClick={() => { setError(""); setStep((value) => value - 1); }}><ArrowLeft/> Back</button><span>Step {step + 1} of 5</span>{step < 4 ? <button className="primary-action" onClick={next}>Continue <ArrowRight/></button> : duplicateJoined ? <button className="primary-action" onClick={close}>Done <Check/></button> : <button className="primary-action" disabled={busy} onClick={submit}>{busy ? <><Loader2 className="spin"/> Submitting</> : <>Confirm & submit <Check/></>}</button>}</footer>
          </>
        )}
      </section>
    </div>
  );
}
