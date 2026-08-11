import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';

// Fix default marker icon paths in Leaflet bundlers
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function LocationMapPicker({
  address = '',
  gps = '',
  onChangeAddress,
  onChangeGranularAddress,
  onChangeGps,
  readOnly = false,
  height = '240px'
}) {
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const markerRef = useRef(null);
  const [geocoding, setGeocoding] = useState(false);

  // Parse default coordinates (Fallback: Maasin City, Southern Leyte: 10.1333, 124.8667)
  const parseCoords = (gpsStr) => {
    if (!gpsStr) return [10.1333, 124.8667];
    const match = gpsStr.match(/(-?\d+\.\d+).*?(-?\d+\.\d+)/);
    if (match) {
      return [parseFloat(match[1]), parseFloat(match[2])];
    }
    return [10.1333, 124.8667];
  };

  const initialCoords = parseCoords(gps);

  // Initialize Map
  useEffect(() => {
    if (!containerRef.current) return;

    if (!mapRef.current) {
      const map = L.map(containerRef.current, {
        center: initialCoords,
        zoom: 13,
        zoomControl: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      const marker = L.marker(initialCoords, {
        icon: defaultIcon,
        draggable: !readOnly
      }).addTo(map);

      markerRef.current = marker;
      mapRef.current = map;

      // Ensure map tiles render properly after DOM container sizing
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
        }
      }, 100);
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
        }
      }, 500);

      // Handle map click
      if (!readOnly) {
        map.on('click', async (e) => {
          const { lat, lng } = e.latlng;
          const latFormatted = lat.toFixed(4);
          const lngFormatted = lng.toFixed(4);
          const newGps = `${latFormatted}° N, ${lngFormatted}° E`;

          marker.setLatLng([lat, lng]);
          map.panTo([lat, lng]);

          if (onChangeGps) onChangeGps(newGps);

          // Reverse Geocode
          try {
            setGeocoding(true);
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const data = await res.json();
            if (data && data.display_name) {
              const formatted = data.display_name.split(',').slice(0, 3).join(',').trim();
              if (onChangeAddress) onChangeAddress(formatted);

              if (onChangeGranularAddress && data.address) {
                const addr = data.address;
                const street = addr.road || addr.house_number || addr.building || '';
                const barangay = addr.suburb || addr.village || addr.quarter || addr.neighbourhood || '';
                const city = addr.city || addr.town || addr.municipality || addr.county || '';
                const province = addr.state || addr.region || addr.province || '';
                const country = addr.country || 'Philippines';
                onChangeGranularAddress({ street, barangay, city, province, country, fullAddress: formatted });
              }
            }
          } catch (err) {
            console.warn('Reverse geocoding warning:', err);
          } finally {
            setGeocoding(false);
          }
        });

        marker.on('dragend', async (e) => {
          const { lat, lng } = e.target.getLatLng();
          const latFormatted = lat.toFixed(4);
          const lngFormatted = lng.toFixed(4);
          const newGps = `${latFormatted}° N, ${lngFormatted}° E`;

          if (onChangeGps) onChangeGps(newGps);

          try {
            setGeocoding(true);
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const data = await res.json();
            if (data && data.display_name) {
              const formatted = data.display_name.split(',').slice(0, 3).join(',').trim();
              if (onChangeAddress) onChangeAddress(formatted);

              if (onChangeGranularAddress && data.address) {
                const addr = data.address;
                const street = addr.road || addr.house_number || addr.building || '';
                const barangay = addr.suburb || addr.village || addr.quarter || addr.neighbourhood || '';
                const city = addr.city || addr.town || addr.municipality || addr.county || '';
                const province = addr.state || addr.region || addr.province || '';
                const country = addr.country || 'Philippines';
                onChangeGranularAddress({ street, barangay, city, province, country, fullAddress: formatted });
              }
            }
          } catch (err) {
            console.warn('Reverse geocoding warning:', err);
          } finally {
            setGeocoding(false);
          }
        });
      }
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update map when GPS prop changes externally
  useEffect(() => {
    if (mapRef.current && markerRef.current && gps) {
      const coords = parseCoords(gps);
      markerRef.current.setLatLng(coords);
      mapRef.current.panTo(coords);
    }
  }, [gps]);

  // Geocode address when user searches
  const handleAddressSearch = async () => {
    if (!address.trim() || readOnly) return;
    try {
      setGeocoding(true);
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const top = data[0];
        const lat = parseFloat(top.lat);
        const lon = parseFloat(top.lon);
        const latFormatted = lat.toFixed(4);
        const lngFormatted = lon.toFixed(4);
        const newGps = `${latFormatted}° N, ${lngFormatted}° E`;

        if (mapRef.current && markerRef.current) {
          markerRef.current.setLatLng([lat, lon]);
          mapRef.current.setView([lat, lon], 14);
        }

        if (onChangeGps) onChangeGps(newGps);
      }
    } catch (err) {
      console.warn('Geocoding error:', err);
    } finally {
      setGeocoding(false);
    }
  };

  return (
    <div style={{ width: '100%' }}>
      {!readOnly && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              type="text"
              className="input"
              placeholder="Search specific address or click anywhere on map below..."
              value={address}
              onChange={(e) => onChangeAddress && onChangeAddress(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddressSearch())}
              style={{ width: '100%', paddingRight: '36px', fontSize: '0.88rem' }}
            />
            {geocoding && (
              <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)' }}>
                <div className="spinner spinner-light" style={{ width: '16px', height: '16px' }} />
              </div>
            )}
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleAddressSearch}
            disabled={geocoding}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>search</span> Find Location
          </button>
        </div>
      )}

      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: height && height !== '100%' ? height : '300px',
          minHeight: '300px',
          borderRadius: '12px',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          overflow: 'hidden',
          zIndex: 1
        }}
      />
      {!readOnly && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '0.75rem', color: '#94a3b8' }}>
          <span>💡 <strong>Tip:</strong> Click anywhere on the map or drag the pin to set exact location.</span>
          <span style={{ color: '#38bdf8', fontWeight: 600 }}>GPS: {gps || 'Not selected'}</span>
        </div>
      )}
    </div>
  );
}
