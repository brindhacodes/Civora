import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { API_BASE, API_ORIGIN } from '../services/api';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Check,
  Crosshair,
  Flame,
  Layers3,
  LocateFixed,
  Map as MapIcon,
  MapPinned,
  Mountain,
  RefreshCw,
  Satellite,
  X,
} from 'lucide-react';
import './LiveMap.css';

const BASE_LAYERS = {
  street: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri',
    maxZoom: 19,
  },
  terrain: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: 'Map data &copy; OpenStreetMap contributors, map style &copy; OpenTopoMap',
    maxZoom: 17,
  },
};

const SATELLITE_LABELS = {
  url: 'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
  attribution: 'Labels &copy; Esri',
};

const getCategoryColor = (issueType) => {
  const value = String(issueType || '').toLowerCase();
  if (/pothole|road/.test(value)) return '#df554f';
  if (/garbage|waste/.test(value)) return '#e6ad24';
  if (/water|leak/.test(value)) return '#3d7edb';
  if (/light|electric/.test(value)) return '#4b9c63';
  return '#7959bd';
};

const getServiceGroup = (report) => {
  const value = `${report.issueType || ''} ${report.department || ''}`.toLowerCase();
  if (/road|pothole|traffic|street|bridge|footpath/.test(value)) return 'roads';
  if (/garbage|waste|sanitation|drain|sewage|clean/.test(value)) return 'sanitation';
  if (/water|light|electric|power|utility/.test(value)) return 'utilities';
  return 'other';
};

const isResolved = (report) => String(report.status || '').toLowerCase() === 'resolved';

const MapViewport = ({ coords, focusRequest }) => {
  const map = useMap();

  useEffect(() => {
    window.setTimeout(() => map.invalidateSize(), 0);
  }, [map]);

  useEffect(() => {
    if (coords) map.flyTo([coords.lat, coords.lng], 15, { duration: 0.8 });
  }, [coords, focusRequest, map]);

  return null;
};

const copy = {
  en: {
    kicker: 'One shared view', title: 'See what your city is working on.', live: 'Live map', reports: 'active reports across Chennai',
    locating: 'Finding your location…', near: 'Showing issues near you', city: 'Chennai city view', high: 'High', medium: 'Medium', low: 'Low',
    yourLocation: 'Your location', tap: 'Tap a marker to see what is happening nearby', settings: 'Map layers', mapType: 'Map type',
    street: 'Street', satellite: 'Satellite', terrain: 'Terrain', details: 'Civic details', reportPins: 'Reported issues', placeLabels: 'Place labels',
    service: 'Service type', allIssues: 'All issues', roads: 'Roads', sanitation: 'Sanitation', utilities: 'Utilities',
    status: 'Status', allStatuses: 'All', open: 'Open', resolved: 'Resolved', refresh: 'Refresh reports', center: 'Go to my location',
    close: 'Close map layers', shown: 'shown', updated: 'Updated just now', refreshing: 'Updating…', locationUnavailable: 'Location unavailable',
  },
  ta: {
    kicker: 'அனைவருக்கும் ஒரே பார்வை', title: 'உங்கள் நகரத்தில் நடைபெறும் பணிகளைப் பாருங்கள்.', live: 'நேரடி வரைபடம்', reports: 'சென்னையில் செயலில் உள்ள புகார்கள்',
    locating: 'உங்கள் இருப்பிடம் கண்டறியப்படுகிறது…', near: 'உங்களுக்கு அருகிலுள்ள புகார்கள்', city: 'சென்னை நகரப் பார்வை', high: 'அதிகம்', medium: 'நடுத்தரம்', low: 'குறைவு',
    yourLocation: 'உங்கள் இருப்பிடம்', tap: 'அருகில் நடப்பதை அறிய குறியீட்டைத் தொடவும்', settings: 'வரைபட அடுக்குகள்', mapType: 'வரைபட வகை',
    street: 'தெரு', satellite: 'செயற்கைக்கோள்', terrain: 'நில அமைப்பு', details: 'நகர விவரங்கள்', reportPins: 'புகார் குறியீடுகள்', placeLabels: 'இடப் பெயர்கள்',
    service: 'சேவை வகை', allIssues: 'அனைத்து புகார்கள்', roads: 'சாலைகள்', sanitation: 'தூய்மை', utilities: 'அடிப்படை சேவைகள்',
    status: 'நிலை', allStatuses: 'அனைத்தும்', open: 'செயலில்', resolved: 'தீர்க்கப்பட்டது', refresh: 'புகார்களைப் புதுப்பிக்கவும்', center: 'என் இருப்பிடத்துக்குச் செல்லவும்',
    close: 'வரைபட அடுக்குகளை மூடு', shown: 'காட்டப்படுகிறது', updated: 'இப்போது புதுப்பிக்கப்பட்டது', refreshing: 'புதுப்பிக்கப்படுகிறது…', locationUnavailable: 'இருப்பிடம் கிடைக்கவில்லை',
  },
};

const LiveMap = ({ language = 'en' }) => {
  const [now] = useState(() => Date.now());
  const [reports, setReports] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [locating, setLocating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [baseLayer, setBaseLayer] = useState('street');
  const [layersOpen, setLayersOpen] = useState(false);
  const [showReports, setShowReports] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [serviceFilter, setServiceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [areaFilter, setAreaFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [focusedReport, setFocusedReport] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('civora_map_focus') || 'null'); } catch { return null; }
  });
  const [focusRequest, setFocusRequest] = useState(0);
  const text = copy[language] || copy.en;

  const loadReports = useCallback(async () => {
    setRefreshing(true);
    let apiReports = [];
    try {
      const res = await fetch(`${API_BASE}/complaints`);
      const data = await res.json();
      if (res.ok) apiReports = data.data || [];
    } catch (err) {
      console.error('Failed to fetch reports from API:', err);
    }

    let localReports = JSON.parse(localStorage.getItem('reports') || '[]');
    const merged = [...apiReports];
    const apiIds = new Set(apiReports.map((report) => report.complaint_id || report.id));
    localReports.forEach((report) => {
      const id = report.complaint_id || report.id;
      if (id && !apiIds.has(id)) merged.push(report);
    });

    const normalized = merged.map((report) => ({
      ...report,
      lat: report.latitude || report.lat,
      lng: report.longitude || report.lng,
      issueType: report.issue_type || report.issueType || 'Unknown',
      place: report.area ? `${report.area}, ${report.city}` : (report.place || 'Unknown'),
      severity: report.severity || 'Low',
      status: report.status || 'Pending',
      date: report.created_at ? new Date(report.created_at).toLocaleDateString() : (report.date || 'Today'),
    })).filter((report) => report.lat && report.lng);

    setReports(normalized);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(loadReports, 0);
    window.addEventListener('civora:complaint-created', loadReports);
    window.addEventListener('civora:complaint', loadReports);
    const interval = setInterval(loadReports, 10000);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('civora:complaint-created', loadReports);
      window.removeEventListener('civora:complaint', loadReports);
      clearInterval(interval);
    };
  }, [loadReports]);

  useEffect(() => {
    const focusReport = (event) => setFocusedReport(event.detail || null);
    window.addEventListener('civora:focus-report', focusReport);
    return () => window.removeEventListener('civora:focus-report', focusReport);
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setTimeout(() => setLocationError('Geolocation is not supported by your browser.'), 0);
      return;
    }

    const locatingTimer = setTimeout(() => setLocating(true), 0);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
        setUserLocation(coords);
        setLocating(false);
        localStorage.setItem('userLocation', JSON.stringify(coords));
      },
      (error) => {
        setLocating(false);
        setLocationError(error.code === error.PERMISSION_DENIED ? 'Location access denied. Showing the city view.' : 'Location unavailable. Showing the city view.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );

    return () => clearTimeout(locatingTimer);
  }, []);

  const filteredReports = useMemo(() => reports.filter((report) => {
    const serviceMatches = serviceFilter === 'all' || getServiceGroup(report) === serviceFilter;
    const statusMatches = statusFilter === 'all' || (statusFilter === 'resolved' ? isResolved(report) : !isResolved(report));
    const areaMatches = areaFilter === 'all' || report.area === areaFilter;
    const age = report.created_at ? now - new Date(report.created_at).getTime() : 0;
    const dateMatches = dateFilter === 'all' || (dateFilter === '7' ? age <= 7 * 86400000 : age <= 30 * 86400000);
    return serviceMatches && statusMatches && areaMatches && dateMatches;
  }), [areaFilter, dateFilter, now, reports, serviceFilter, statusFilter]);
  const areas = useMemo(() => [...new Set(reports.map((report) => report.area).filter(Boolean))].sort(), [reports]);

  const grouped = useMemo(() => {
    const groups = {};
    filteredReports.forEach((report) => {
      const key = `${parseFloat(report.lat).toFixed(4)}-${parseFloat(report.lng).toFixed(4)}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(report);
    });
    return groups;
  }, [filteredReports]);

  const defaultCenter = [13.0827, 80.2707];
  const selectedLayer = BASE_LAYERS[baseLayer];
  const mapTypes = [
    { id: 'street', label: text.street, icon: <MapIcon size={22} /> },
    { id: 'satellite', label: text.satellite, icon: <Satellite size={22} /> },
    { id: 'terrain', label: text.terrain, icon: <Mountain size={22} /> },
  ];
  const serviceOptions = [
    { id: 'all', label: text.allIssues },
    { id: 'roads', label: text.roads },
    { id: 'sanitation', label: text.sanitation },
    { id: 'utilities', label: text.utilities },
  ];
  const statusOptions = [
    { id: 'all', label: text.allStatuses },
    { id: 'open', label: text.open },
    { id: 'resolved', label: text.resolved },
  ];

  return (
    <section className="map-section section">
      <div className="container">
        <div className="map-section__header">
          <div>
            <span className="section-kicker">{text.kicker}</span>
            <h2 className="map-section__title">{text.title}</h2>
          </div>
          <div className="map-section__summary">
            <span className="map-section__live"><span className="live-dot" /> {text.live}</span>
            <p>{reports.length} {text.reports}</p>
          </div>
        </div>

        <div className="map-shell">
          <div className="map-shell__toolbar">
            <div className="map-shell__location"><MapPinned size={16} /><span>{locating ? text.locating : userLocation ? text.near : text.city}</span></div>
            <div className="map-shell__toolbar-actions">
              <span className="map-shell__updated"><span className={refreshing ? 'live-dot live-dot--working' : 'live-dot'} /> {refreshing ? text.refreshing : text.updated}</span>
              <button type="button" className="map-tool-button" onClick={loadReports} aria-label={text.refresh} title={text.refresh}>
                <RefreshCw size={17} className={refreshing ? 'is-spinning' : ''} />
              </button>
              <button type="button" className={`map-tool-button${layersOpen ? ' is-active' : ''}`} onClick={() => setLayersOpen((open) => !open)} aria-expanded={layersOpen} aria-controls="map-layer-panel">
                <Layers3 size={17} /><span>{text.settings}</span>
              </button>
            </div>
          </div>
          <div className="civic-map-filters" aria-label="Civic map filters">
            <label><span>Ward / area</span><select value={areaFilter} onChange={(event) => setAreaFilter(event.target.value)}><option value="all">All areas</option>{areas.map((area) => <option value={area} key={area}>{area}</option>)}</select></label>
            <label><span>Category</span><select value={serviceFilter} onChange={(event) => setServiceFilter(event.target.value)}>{serviceOptions.map((option) => <option value={option.id} key={option.id}>{option.label}</option>)}</select></label>
            <label><span>Status</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>{statusOptions.map((option) => <option value={option.id} key={option.id}>{option.label}</option>)}</select></label>
            <label><span>Date reported</span><select value={dateFilter} onChange={(event) => setDateFilter(event.target.value)}><option value="all">Any date</option><option value="7">Last 7 days</option><option value="30">Last 30 days</option></select></label>
            <button type="button" className={showHeatmap ? 'is-active' : ''} onClick={() => setShowHeatmap((value) => !value)} aria-pressed={showHeatmap}><Flame/> Density view</button>
          </div>

          <div className="map-canvas">
            <MapContainer center={userLocation ? [userLocation.lat, userLocation.lng] : defaultCenter} zoom={13} zoomControl>
              <TileLayer key={baseLayer} url={selectedLayer.url} attribution={selectedLayer.attribution} maxZoom={selectedLayer.maxZoom} />
              {baseLayer === 'satellite' && showLabels && <TileLayer url={SATELLITE_LABELS.url} attribution={SATELLITE_LABELS.attribution} maxZoom={19} />}
              <MapViewport coords={focusedReport || userLocation} focusRequest={focusRequest} />
              {userLocation && (
                <CircleMarker center={[userLocation.lat, userLocation.lng]} radius={10} pathOptions={{ color: '#155c49', fillColor: '#d7f36b', fillOpacity: 0.95 }}>
                  <Popup><strong>{text.yourLocation}</strong></Popup>
                </CircleMarker>
              )}
              {showReports && showHeatmap && filteredReports.map((report, index) => <CircleMarker key={`heat-${report.id || index}`} center={[parseFloat(report.lat), parseFloat(report.lng)]} radius={26} pathOptions={{ stroke:false, fillColor:getCategoryColor(report.issueType), fillOpacity:.18 }} />)}
              {showReports && Object.values(grouped).map((group, groupIndex) => group.map((report, index) => {
                const angle = (index / group.length) * 2 * Math.PI;
                const offset = group.length > 1 ? 0.0003 : 0;
                const lat = parseFloat(report.lat) + offset * Math.cos(angle);
                const lng = parseFloat(report.lng) + offset * Math.sin(angle);
                return (
                  <CircleMarker key={`${groupIndex}-${index}`} center={[lat, lng]} radius={String(focusedReport?.id) === String(report.id) ? 13 : 8} pathOptions={{ color: String(focusedReport?.id) === String(report.id) ? '#10231d' : getCategoryColor(report.issueType), fillColor: getCategoryColor(report.issueType), fillOpacity: 0.9, weight: String(focusedReport?.id) === String(report.id) ? 5 : 3 }} eventHandlers={{ click: () => window.dispatchEvent(new CustomEvent('civora:select-report', { detail:{ id:report.id, complaintId:report.complaint_id } })) }}>
                    <Popup>
                      <div className="map-popup">
                        {report.image_url && <img src={`${API_ORIGIN}${report.image_url}`} alt="Reported issue" />}
                        <small>{report.complaint_id || report.id}</small>
                        <strong>{report.issueType}</strong>
                        <span>{report.place || 'Location not specified'}</span>
                        {report.description && <p>{report.description}</p>}
                        <span>{report.severity} priority · {report.status}</span>
                        <span>{report.department || 'City services'} · {report.date}</span>
                        {group.length > 1 && <b>{group.length} reports at this location</b>}
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              }))}
            </MapContainer>

            <div className="map-canvas__actions">
              <button type="button" className="map-float-button" onClick={() => { if (userLocation) { setFocusedReport(null); sessionStorage.removeItem('civora_map_focus'); setFocusRequest((request) => request + 1); } }} disabled={!userLocation} aria-label={userLocation ? text.center : text.locationUnavailable} title={userLocation ? text.center : text.locationUnavailable}>
                <Crosshair size={19} />
              </button>
              <button type="button" className={`map-float-button${layersOpen ? ' is-active' : ''}`} onClick={() => setLayersOpen((open) => !open)} aria-label={text.settings} title={text.settings}>
                <Layers3 size={19} />
              </button>
            </div>

            {layersOpen && (
              <aside id="map-layer-panel" className="map-layer-panel" aria-label={text.settings}>
                <div className="map-layer-panel__header">
                  <div><Layers3 size={19} /><strong>{text.settings}</strong></div>
                  <button type="button" onClick={() => setLayersOpen(false)} aria-label={text.close}><X size={19} /></button>
                </div>

                <div className="map-layer-panel__section">
                  <span className="map-layer-panel__label">{text.mapType}</span>
                  <div className="map-type-grid">
                    {mapTypes.map(({ id, label, icon }) => (
                      <button key={id} type="button" className={`map-type-option map-type-option--${id}${baseLayer === id ? ' is-selected' : ''}`} onClick={() => setBaseLayer(id)} aria-pressed={baseLayer === id}>
                        <span className="map-type-option__preview">{icon}{baseLayer === id && <Check size={14} />}</span>
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="map-layer-panel__section">
                  <span className="map-layer-panel__label">{text.details}</span>
                  <label className="map-toggle-row">
                    <span>{text.reportPins}<small>{filteredReports.length} {text.shown}</small></span>
                    <input type="checkbox" checked={showReports} onChange={(event) => setShowReports(event.target.checked)} />
                  </label>
                  {baseLayer === 'satellite' && (
                    <label className="map-toggle-row">
                      <span>{text.placeLabels}</span>
                      <input type="checkbox" checked={showLabels} onChange={(event) => setShowLabels(event.target.checked)} />
                    </label>
                  )}
                </div>

                <div className="map-layer-panel__section">
                  <span className="map-layer-panel__label">{text.service}</span>
                  <div className="map-filter-grid">
                    {serviceOptions.map((option) => (
                      <button key={option.id} type="button" className={serviceFilter === option.id ? 'is-selected' : ''} onClick={() => setServiceFilter(option.id)} aria-pressed={serviceFilter === option.id}>{option.label}</button>
                    ))}
                  </div>
                </div>

                <div className="map-layer-panel__section">
                  <span className="map-layer-panel__label">{text.status}</span>
                  <div className="map-filter-grid map-filter-grid--status">
                    {statusOptions.map((option) => (
                      <button key={option.id} type="button" className={statusFilter === option.id ? 'is-selected' : ''} onClick={() => setStatusFilter(option.id)} aria-pressed={statusFilter === option.id}>{option.label}</button>
                    ))}
                  </div>
                </div>
              </aside>
            )}

            <div className="map-canvas__badge"><LocateFixed size={15} /> {focusedReport ? `Focused on ${focusedReport.complaintId}` : locationError || `${showReports ? filteredReports.length : 0} ${text.shown} · ${text.tap}`}</div>
          </div>

          <div className="map-shell__footer">
            <div className="map-legend">
              <span><i className="legend-dot legend-dot--pothole" /> Pothole</span>
              <span><i className="legend-dot legend-dot--garbage" /> Garbage</span>
              <span><i className="legend-dot legend-dot--water" /> Water leak</span>
              <span><i className="legend-dot legend-dot--streetlight" /> Streetlight</span>
              <span><i className="legend-dot legend-dot--other" /> Other</span>
            </div>
            <span>{showReports ? filteredReports.length : 0} {text.shown}</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LiveMap;
