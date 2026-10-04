import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, BrainCircuit, Check, MapPinned, MessageCircle, Radio, Send, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_BASE, API_ORIGIN } from '../services/api';
import { formatRelativeTime, normalizeStatus, readLocalComplaints } from '../utils/complaints';
import './LiveFeed.css';

const JOURNEY = ['Citizen report', 'Verified', 'Authority assigned', 'Work underway', 'Resolved'];
const journeyIndex = (status) => ({ Resolved: 4, 'In Progress': 3, Assigned: 2, Pending: 1 }[normalizeStatus(status)] || 0);

const insightFor = (item) => {
  const text = `${item.issue_type || ''} ${item.description || ''}`.toLowerCase();
  let classification = item.issue_type || 'General civic issue';
  let department = item.department || 'General Administration';
  if (/pothole|road|footpath/.test(text)) { classification = 'Road damage'; department = 'Roads Department'; }
  else if (/garbage|waste|dump/.test(text)) { classification = 'Solid waste'; department = 'Sanitation Department'; }
  else if (/water|leak|flood/.test(text)) { classification = 'Water infrastructure'; department = 'Water Department'; }
  else if (/light|electric|power/.test(text)) { classification = 'Public lighting'; department = 'Electrical Department'; }
  const severity = String(item.severity || 'medium').toLowerCase();
  const suggested = severity === 'high' || /danger|accident|sewage|flood/.test(text) ? 'Urgent' : severity === 'low' ? 'Routine' : 'Standard';
  return { classification, department, severity, suggested };
};

const mergeItems = (remote, local) => [...remote, ...local]
  .filter((item, index, all) => index === all.findIndex((other) => String(other.complaint_id) === String(item.complaint_id)))
  .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

export default function LiveFeed({ language = 'en' }) {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState({});
  const [confirmed, setConfirmed] = useState(() => new Set(JSON.parse(localStorage.getItem('civora_confirmed') || '[]')));
  const [openComments, setOpenComments] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [comments, setComments] = useState({});
  const [drafts, setDrafts] = useState({});

  const text = language === 'ta'
    ? { kicker: 'நேரடி குடிமக்கள் தகவல்', title: 'நகரத்தின் நேரடி நிலவரம்', subtitle: 'ஒவ்வொரு புகாரும், சமூக உறுதிப்படுத்தலும், அரசு நடவடிக்கையும் ஒரே இடத்தில்.', confirm: 'நானும் இதைப் பார்க்கிறேன்', confirmed: 'உறுதிப்படுத்தப்பட்டது', comments: 'கருத்துகள்' }
    : { kicker: 'LIVE CIVIC INTELLIGENCE', title: 'Your city, reporting in real time.', subtitle: 'Every report, community confirmation and authority action in one responsive civic feed.', confirm: 'I see this too', confirmed: 'Confirmed by you', comments: 'Community notes' };

  const loadFeed = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/complaints`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Unable to load reports');
      setItems(mergeItems(data.data || [], readLocalComplaints()));
      setError('');
    } catch (requestError) {
      const local = readLocalComplaints();
      setItems(local);
      setError(local.length ? 'Showing saved reports while live updates reconnect.' : requestError.message);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    loadFeed();
    const interval = window.setInterval(loadFeed, 15000);
    window.addEventListener('civora:complaint', loadFeed);
    return () => { window.clearInterval(interval); window.removeEventListener('civora:complaint', loadFeed); };
  }, [loadFeed]);

  useEffect(() => {
    const selectReport = (event) => {
      const id = String(event.detail?.id || event.detail?.complaintId || '');
      setSelectedCard(id);
      window.setTimeout(() => document.querySelector(`[data-report-id="${CSS.escape(id)}"]`)?.scrollIntoView({ behavior:'smooth', block:'center' }), 0);
    };
    window.addEventListener('civora:select-report', selectReport);
    return () => window.removeEventListener('civora:select-report', selectReport);
  }, []);

  const totals = useMemo(() => ({
    open: items.filter((item) => normalizeStatus(item.status) !== 'Resolved').length,
    confirmations: items.reduce((sum, item) => sum + Number(item.supporter_count || 1), 0),
  }), [items]);

  const focusOnMap = (item) => {
    const detail = { id: item.id, complaintId: item.complaint_id, lat: Number(item.latitude), lng: Number(item.longitude) };
    sessionStorage.setItem('civora_map_focus', JSON.stringify(detail));
    window.dispatchEvent(new CustomEvent('civora:focus-report', { detail }));
    const map = document.querySelector('.map-section');
    if (map) map.scrollIntoView({ behavior: 'smooth', block: 'center' });
    else navigate('/map');
  };

  const confirmIssue = async (item) => {
    const key = String(item.complaint_id || item.id);
    if (confirmed.has(key) || !item.id) return;
    setConfirming((state) => ({ ...state, [key]: true }));
    try {
      const response = await fetch(`${API_BASE}/complaints/${item.id}/join`, { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Confirmation failed');
      setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, supporter_count: data.data?.supporter_count ?? Number(entry.supporter_count || 1) + 1 } : entry));
      const next = new Set(confirmed); next.add(key); setConfirmed(next);
      localStorage.setItem('civora_confirmed', JSON.stringify([...next]));
    } catch (requestError) { setError(requestError.message); }
    finally { setConfirming((state) => ({ ...state, [key]: false })); }
  };

  const toggleComments = async (complaintId) => {
    setOpenComments((current) => current === complaintId ? null : complaintId);
    if (comments[complaintId]) return;
    try {
      const response = await fetch(`${API_BASE}/comments/${encodeURIComponent(complaintId)}`);
      const data = await response.json();
      setComments((current) => ({ ...current, [complaintId]: data.data || [] }));
    } catch { setComments((current) => ({ ...current, [complaintId]: [] })); }
  };

  const postComment = async (complaintId) => {
    const message = String(drafts[complaintId] || '').trim();
    if (!message) return;
    const response = await fetch(`${API_BASE}/comments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ complaintId, message }) });
    const data = await response.json();
    if (response.ok) {
      setComments((current) => ({ ...current, [complaintId]: [...(current[complaintId] || []), data.data] }));
      setDrafts((current) => ({ ...current, [complaintId]: '' }));
    }
  };

  return <section className="section civic-feed-section"><div className="container live-feed">
    <header className="feed-header"><div><span className="feed-kicker"><Radio/> {text.kicker}</span><h2>{text.title}</h2><p>{text.subtitle}</p></div><div className="feed-pulse"><strong>{items.length}</strong><span>live reports</span><i/><strong>{totals.confirmations}</strong><span>community confirmations</span></div></header>
    {error && <div className="error-banner" role="status">{error}</div>}
    {loading ? <div className="issue-card-grid" aria-label="Loading reports">{[0,1,2].map((key) => <div className="issue-card issue-card--skeleton" key={key}/>)}</div>
      : items.length === 0 ? <div className="feed-empty"><Radio/><h3>No live reports yet</h3><p>The first verified civic report will appear here.</p></div>
      : <div className="issue-card-grid">{items.map((item, index) => {
        const key = String(item.complaint_id || item.id);
        const insight = insightFor(item);
        const stage = journeyIndex(item.status);
        const isConfirmed = confirmed.has(key);
        return <article className={`issue-card${selectedCard === String(item.id) || selectedCard === key ? ' is-map-selected' : ''}`} data-report-id={String(item.id || key)} style={{ '--card-order': index }} key={key}>
          {item.image_url && <img className="issue-card__image" src={`${API_ORIGIN}${item.image_url}`} alt="Citizen evidence"/>}
          <div className="issue-card__content">
            <div className="issue-card__top"><span>{item.complaint_id}</span><b className={`status-badge ${String(normalizeStatus(item.status)).toLowerCase().replace(' ','-')}`}>{normalizeStatus(item.status)}</b></div>
            <h3>{item.issue_type}</h3><p className="issue-card__description">{item.description}</p>
            <button className="issue-location" type="button" onClick={() => focusOnMap(item)} disabled={!item.latitude || !item.longitude}><MapPinned/>{item.area}, {item.city}<ArrowUpRight/></button>
            <div className="ai-insight"><BrainCircuit/><div><span>AI INSIGHT</span><strong>{insight.classification} · {insight.severity} severity</strong><small>{insight.department} · Suggested priority: {insight.suggested}</small></div></div>
            <div className="mini-journey" aria-label={`Resolution journey: ${JOURNEY[stage]}`}><div>{JOURNEY.map((name, step) => <span className={step < stage ? 'done' : step === stage ? 'current' : ''} key={name} title={name}>{step < stage ? <Check/> : step + 1}</span>)}</div><small>{JOURNEY[stage]} · Step {stage + 1} of {JOURNEY.length}</small></div>
            <div className="issue-card__actions"><button className={isConfirmed ? 'is-confirmed' : ''} disabled={isConfirmed || confirming[key]} onClick={() => confirmIssue(item)}><Users/>{isConfirmed ? text.confirmed : text.confirm}<strong>{item.supporter_count || 1}</strong></button><button onClick={() => toggleComments(item.complaint_id)}><MessageCircle/>{text.comments}<strong>{comments[item.complaint_id]?.length || 0}</strong></button></div>
            {openComments === item.complaint_id && <div className="community-notes">{(comments[item.complaint_id] || []).map((comment) => <p key={comment.id}><strong>{comment.author_name}</strong>{comment.message}</p>)}{(comments[item.complaint_id] || []).length === 0 && <p>No community notes yet.</p>}<div><input value={drafts[item.complaint_id] || ''} onChange={(event) => setDrafts((current) => ({ ...current, [item.complaint_id]:event.target.value }))} placeholder="Add a useful local update"/><button onClick={() => postComment(item.complaint_id)} aria-label="Post note"><Send/></button></div></div>}
            <footer><span>{item.reporter_name || item.name || 'Citizen report'}</span><time>{formatRelativeTime(item.created_at)}</time></footer>
          </div>
        </article>;
      })}</div>}
    {!loading && <p className="feed-data-note">Showing {totals.open} open issues. Live data refreshes every 15 seconds.</p>}
  </div></section>;
}
