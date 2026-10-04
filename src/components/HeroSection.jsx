import { useEffect, useState } from 'react';
import { ArrowUpRight, BadgeCheck, CheckCircle2, Clock3, FileSearch, FileText, MapPinned, MapPin, Route, Wrench } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../services/api';
import { readLocalComplaints, normalizeStatus } from '../utils/complaints';
import './HeroSection.css';

const copy = {
  en: {
    eyebrow: 'City operations / Chennai', titleStart: 'A better city starts with', titleAccent: 'one good report.', subtitle: "Spot something that needs attention? Put it on the city's radar in under a minute. Civora routes every report to the right people and keeps you in the loop.", report: 'Report an issue', explore: 'Explore the live map', neighbors: '15,200+ neighbors taking part', proof: 'Every report creates a clearer city', pulse: 'Civic pulse', focus: 'Chennai in focus', live: 'Live data', near: '4 reports near you', updated: 'Updated just now', open: 'Open issues', fixed: 'Fixed this month', rate: 'Resolution rate', verified: 'Community verified', today: '+24 new reports today', light: 'Streetlight fixed', lightMeta: 'In Besant Nagar · 8m ago', scroll: 'Scroll to explore your city'
  },
  ta: {
    eyebrow: 'நகர செயல்பாடுகள் / சென்னை', titleStart: 'ஒரு சிறந்த நகரம் தொடங்குவது', titleAccent: 'ஒரு நல்ல புகாரிலிருந்து.', subtitle: 'கவனம் தேவைப்படும் ஒன்றைக் கண்டீர்களா? ஒரு நிமிடத்திற்குள் நகரத்தின் கவனத்திற்கு கொண்டு வாருங்கள். சிவோரா ஒவ்வொரு புகாரையும் சரியான குழுவிடம் கொண்டு சேர்த்து, நிலையை உங்களுக்குத் தெரிவிக்கிறது.', report: 'புகாரளிக்க', explore: 'நேரடி வரைபடத்தைப் பார்க்க', neighbors: '15,200+ மக்கள் பங்கேற்கிறார்கள்', proof: 'ஒவ்வொரு புகாரும் நகரத்தை மேம்படுத்துகிறது', pulse: 'நகரத் துடிப்பு', focus: 'சென்னை நிலவரம்', live: 'நேரடி தகவல்', near: 'உங்களுக்கு அருகில் 4 புகார்கள்', updated: 'இப்போது புதுப்பிக்கப்பட்டது', open: 'திறந்த புகார்கள்', fixed: 'இந்த மாதம் தீர்க்கப்பட்டவை', rate: 'தீர்வு விகிதம்', verified: 'சமூகம் உறுதிசெய்தது', today: 'இன்று +24 புதிய புகார்கள்', light: 'தெருவிளக்கு சரிசெய்யப்பட்டது', lightMeta: 'பெசன்ட் நகரில் · 8 நிமிடம் முன்பு', scroll: 'உங்கள் நகரத்தை அறிய கீழே செல்லவும்'
  },
};

const workflowCopy = {
  en: {
    label: 'Transparent from start to finish',
    title: 'See exactly where your report stands.',
    badge: 'Tracked end-to-end',
    sample: 'Sample report · CV-2048',
    issue: 'Streetlight outage',
    location: 'Besant Nagar',
    status: 'Work scheduled',
    action: 'Track a report',
    steps: [
      { title: 'Report received', detail: 'Photo and location confirmed' },
      { title: 'Sent to the right team', detail: 'Routed to Street Lighting' },
      { title: 'Work scheduled', detail: 'Crew visit planned for today' },
      { title: 'Resolution proof', detail: 'You receive the final update' },
    ],
  },
  ta: {
    label: 'தொடக்கம் முதல் முடிவு வரை வெளிப்படை',
    title: 'உங்கள் புகாரின் நிலையைத் தெளிவாகப் பாருங்கள்.',
    badge: 'முழுமையாகக் கண்காணிக்கப்படும்',
    sample: 'மாதிரி புகார் · CV-2048',
    issue: 'தெருவிளக்கு செயலிழப்பு',
    location: 'பெசன்ட் நகர்',
    status: 'பணி திட்டமிடப்பட்டது',
    action: 'புகாரைக் கண்காணிக்க',
    steps: [
      { title: 'புகார் பெறப்பட்டது', detail: 'படமும் இடமும் உறுதிசெய்யப்பட்டது' },
      { title: 'சரியான குழுவுக்கு அனுப்பப்பட்டது', detail: 'தெருவிளக்கு பிரிவுக்கு ஒதுக்கப்பட்டது' },
      { title: 'பணி திட்டமிடப்பட்டது', detail: 'இன்று குழு வர திட்டமிடப்பட்டுள்ளது' },
      { title: 'தீர்வு ஆதாரம்', detail: 'இறுதி தகவல் உங்களுக்கு அனுப்பப்படும்' },
    ],
  },
};

const workflowIcons = [FileText, Route, Wrench, BadgeCheck];

const HeroSection = ({ onOpenReport, language = 'en' }) => {
  const navigate = useNavigate();
  const text = copy[language] || copy.en;
  const workflow = workflowCopy[language] || workflowCopy.en;
  const [metrics, setMetrics] = useState({ total: 0, resolved: 0, active: 0, average: '—' });

  useEffect(() => {
    const loadMetrics = async () => {
      let records = readLocalComplaints();
      try {
        const response = await fetch(`${API_BASE}/complaints`);
        const data = await response.json();
        if (response.ok) records = data.data || data.complaints || records;
      } catch { /* Local activity remains visible while offline. */ }
      const resolved = records.filter((item) => normalizeStatus(item.status) === 'Resolved');
      const hours = resolved.map((item) => (new Date(item.updated_at) - new Date(item.created_at)) / 3600000).filter((value) => value >= 0 && Number.isFinite(value));
      setMetrics({ total: records.length, resolved: resolved.length, active: records.length - resolved.length, average: hours.length ? `${Math.max(1, Math.round(hours.reduce((a, b) => a + b, 0) / hours.length))}h` : '—' });
    };
    loadMetrics();
    window.addEventListener('civora:complaint', loadMetrics);
    return () => window.removeEventListener('civora:complaint', loadMetrics);
  }, []);

  return (
    <section className="hero-modern">
      <div className="hero-grid-glow hero-grid-glow--left" />
      <div className="hero-grid-glow hero-grid-glow--right" />
      <div className="container hero-modern__container">
        <div className="hero-modern__content animate-fade-in">
          <div className="hero-eyebrow">
            <span className="live-dot" />
            <span>{text.eyebrow}</span>
          </div>

          <h1 className="hero-modern__title">{language === 'ta' ? <>சிக்கலைக் காணுங்கள். புகாரளியுங்கள். <em>கண்காணித்து தீர்வு பெறுங்கள்.</em></> : <>See a problem. Report it. <em>Track it. Get it resolved.</em></>}</h1>

          <p className="hero-modern__subtitle">
            {text.subtitle}
          </p>

          <div className="hero-service-actions" aria-label="Civic services">
            <button className="hero-service-action hero-service-action--primary" onClick={onOpenReport} data-guide-id="report-button">
              <span><FileText size={20} /></span><strong>{text.report}</strong><small>Photo, location and details</small><ArrowUpRight size={17} />
            </button>
            <button className="hero-service-action" onClick={() => navigate('/track')}>
              <span><FileSearch size={20} /></span><strong>{language === 'ta' ? 'புகாரைக் கண்காணிக்க' : 'Track complaint'}</strong><small>Follow every official update</small><ArrowUpRight size={17} />
            </button>
            <button className="hero-service-action" onClick={() => navigate('/map')}>
              <span><MapPinned size={20} /></span><strong>{language === 'ta' ? 'நகர வரைபடம்' : 'View civic map'}</strong><small>See issues near you</small><ArrowUpRight size={17} />
            </button>
          </div>

          <div className="hero-kpis" aria-label="Live civic statistics">
            <div><strong>{metrics.total}</strong><span>Issues reported</span></div>
            <div><strong>{metrics.resolved}</strong><span>Issues resolved</span></div>
            <div><strong>{metrics.average}</strong><span>Avg. resolution</span></div>
            <div><strong>{metrics.active}</strong><span>Active issues</span></div>
          </div>
        </div>

        <div className="hero-modern__visual animate-fade-in-delay-1">
          <div className="resolution-board">
            <div className="resolution-board__header">
              <div>
                <span className="resolution-board__label">{workflow.label}</span>
                <h2>{workflow.title}</h2>
              </div>
              <span className="resolution-board__badge"><CheckCircle2 size={14} /> {workflow.badge}</span>
            </div>

            <div className="report-ticket">
              <span className="report-ticket__pin"><MapPin size={19} /></span>
              <div className="report-ticket__copy">
                <span>{workflow.sample}</span>
                <strong>{workflow.issue}</strong>
                <small>{workflow.location}</small>
              </div>
              <span className="report-ticket__status"><Clock3 size={14} /> {workflow.status}</span>
            </div>

            <ol className="resolution-steps">
              {workflow.steps.map((step, index) => {
                const StepIcon = workflowIcons[index];
                const state = index < 2 ? 'complete' : index === 2 ? 'active' : 'upcoming';
                return (
                  <li className={`resolution-step resolution-step--${state}`} key={step.title}>
                    <span className="resolution-step__icon"><StepIcon size={17} /></span>
                    <span className="resolution-step__copy">
                      <strong>{step.title}</strong>
                      <small>{step.detail}</small>
                    </span>
                    {state === 'complete' && <CheckCircle2 className="resolution-step__check" size={17} aria-label="Complete" />}
                    {state === 'active' && <span className="resolution-step__current">3 / 4</span>}
                  </li>
                );
              })}
            </ol>

            <button className="resolution-board__action" type="button" onClick={() => navigate('/track')}>
              {workflow.action} <ArrowUpRight size={17} />
            </button>
          </div>
        </div>
      </div>
      <div className="hero-scroll-note"><span /> {text.scroll}</div>
    </section>
  );
};

export default HeroSection;
