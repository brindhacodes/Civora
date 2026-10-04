import { ArrowUpRight, Camera, CheckCircle2, ListChecks, Sparkles } from 'lucide-react';
import './ExplainerSection.css';

const steps = {
en: [
  {
    number: '01',
    icon: <Camera size={21} />,
    title: 'Spot & report',
    description: 'Take a photo, add a location, and tell us what needs attention.',
    color: 'mint',
  },
  {
    number: '02',
    icon: <Sparkles size={21} />,
    title: 'We route it',
    description: 'Smart categorization sends your report to the right city team.',
    color: 'lime',
  },
  {
    number: '03',
    icon: <CheckCircle2 size={21} />,
    title: 'See progress',
    description: 'Follow every update, join your neighbors, and celebrate the fix.',
    color: 'coral',
  },
],
ta: [
  { number: '01', icon: <Camera size={21} />, title: 'கண்டு புகாரளிக்கவும்', description: 'புகைப்படம் எடுத்து, இருப்பிடத்தைச் சேர்த்து, கவனம் தேவைப்படுவதைத் தெரிவிக்கவும்.', color: 'mint' },
  { number: '02', icon: <Sparkles size={21} />, title: 'சரியான குழுவுக்கு', description: 'அறிவார்ந்த வகைப்படுத்தல் உங்கள் புகாரை சரியான நகர குழுவிற்கு அனுப்புகிறது.', color: 'lime' },
  { number: '03', icon: <CheckCircle2 size={21} />, title: 'முன்னேற்றத்தை காண்க', description: 'ஒவ்வொரு புதுப்பிப்பையும் பின்தொடர்ந்து, அண்டை மக்களுடன் இணைந்து தீர்வைக் காணுங்கள்.', color: 'coral' },
]};

const copy = {
  en: { kicker: 'Small action. Visible change.', title: 'From noticing to', accent: 'neighborhood impact.', subtitle: 'Civora makes it easy to turn everyday observations into a shared to-do list for a healthier, safer city.' },
  ta: { kicker: 'சிறிய செயல். கண்கூடும் மாற்றம்.', title: 'கவனிப்பிலிருந்து', accent: 'சுற்றுப்புற மாற்றம் வரை.', subtitle: 'ஆரோக்கியமான, பாதுகாப்பான நகரத்திற்காக அன்றாடக் கவனிப்புகளை அனைவரும் பகிரும் செயல்பட்டியலாக மாற்ற சிவோரா உதவுகிறது.' },
};

const ExplainerSection = ({ language = 'en' }) => {
  const text = copy[language] || copy.en;
  const localizedSteps = steps[language] || steps.en;
  return (
    <section className="explainer-modern section">
      <div className="container">
        <div className="explainer-modern__header">
          <div>
            <span className="section-kicker">{text.kicker}</span>
            <h2 className="section-title">{text.title} <em>{text.accent}</em></h2>
          </div>
          <p className="section-subtitle">{text.subtitle}</p>
        </div>

        <div className="steps-modern">
          {localizedSteps.map((step, index) => (
            <div className="step-modern" key={step.number}>
              <div className={`step-modern__icon step-modern__icon--${step.color}`}>
                {step.icon}
              </div>
              <div className="step-modern__content">
                <div className="step-modern__number">{step.number}</div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
              {index < localizedSteps.length - 1 && <div className="step-modern__connector" aria-hidden="true"><ArrowUpRight size={17} /></div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ExplainerSection;
