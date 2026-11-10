import { importLibrary, setOptions } from '@googlemaps/js-api-loader';

let mapsPromise;

export function loadGoogleMaps() {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!key) return Promise.reject(new Error('Google Maps is not configured.'));
  if (!mapsPromise) {
    setOptions({ key, v: 'quarterly', region: 'IN' });
    mapsPromise = importLibrary('maps');
  }
  return mapsPromise;
}

export async function locateArea(area, city, pincode = '') {
  await loadGoogleMaps();
  const { Geocoder } = await importLibrary('geocoding');
  const { results } = await new Geocoder().geocode({
    address: [area.trim(), city.trim(), pincode.trim(), 'India'].filter(Boolean).join(', '),
    region: 'IN',
    // Some Google locality results have no postal component. A strict postal
    // filter rejects valid area names; include the PIN in the address instead.
    componentRestrictions: { country: 'IN' },
  });
  if (!results.length) throw new Error('Area not found');
  return results[0].geometry.location.toJSON();
}
