import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Coordinate } from '../../types/navigation';
import { BarrierReport } from '../../types/community';
import { RescueProvider } from '../../types/rescue';

// Fix default leaflet marker icon assets in bundler
const createCustomIcon = (color: string, label: string, iconHtml: string) => {
  return L.divIcon({
    className: 'custom-leaflet-icon',
    html: `
      <div style="
        background-color: ${color};
        width: 34px;
        height: 34px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid #ffffff;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
      ">
        <div style="transform: rotate(45deg); color: white; font-size: 14px; display: flex; align-items: center; justify-content: center;">
          ${iconHtml}
        </div>
      </div>
      <div style="
        margin-top: 2px;
        background: rgba(15, 23, 42, 0.85);
        color: #ffffff;
        font-size: 10px;
        font-weight: 700;
        padding: 2px 6px;
        border-radius: 4px;
        white-space: nowrap;
        text-align: center;
        width: max-content;
        transform: translateX(-25%);
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      ">${label}</div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -34]
  });
};

interface LeafletMapProps {
  center?: Coordinate;
  zoom?: number;
  origin?: Coordinate;
  originLabel?: string;
  destination?: Coordinate;
  destinationLabel?: string;
  routeCoordinates?: Coordinate[];
  alternativeCoordinates?: Coordinate[];
  blockedCoordinates?: Coordinate[];
  barriers?: BarrierReport[];
  providers?: RescueProvider[];
  selectedProviderId?: string;
  onMapClick?: (coord: Coordinate) => void;
  className?: string;
  interactive?: boolean;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  center = { lat: 26.4650, lng: 80.2750 },
  zoom = 12,
  origin,
  originLabel = 'Origin',
  destination,
  destinationLabel = 'Destination',
  routeCoordinates = [],
  alternativeCoordinates = [],
  blockedCoordinates = [],
  barriers = [],
  providers = [],
  selectedProviderId,
  onMapClick,
  className = 'h-96 w-full rounded-2xl',
  interactive = true
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Clear any prior leaflet identifier on the DOM element to avoid "Map container is already initialized"
      if ((mapContainerRef.current as any)._leaflet_id) {
        delete (mapContainerRef.current as any)._leaflet_id;
      }

      try {
        const map = L.map(mapContainerRef.current, {
          center: [center.lat, center.lng],
          zoom: zoom,
          zoomControl: interactive,
          dragging: interactive,
          scrollWheelZoom: interactive ? 'center' : false,
          attributionControl: false
        });

        // Accessible high-contrast clean OSM tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        L.control.attribution({ position: 'bottomright', prefix: false })
          .addAttribution('OpenStreetMap • AccessResQ Demo Spatial Graph')
          .addTo(map);

        const layerGroup = L.layerGroup().addTo(map);
        layerGroupRef.current = layerGroup;
        mapInstanceRef.current = map;

        if (onMapClick) {
          map.on('click', (e: L.LeafletMouseEvent) => {
            onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
          });
        }

        // Force layout calculation after DOM has stabilized
        setTimeout(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize();
          }
        }, 150);
      } catch (err) {
        console.warn('Leaflet map initialization skipped or re-initialized:', err);
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {
          console.warn('Leaflet cleanup warning:', e);
        }
        mapInstanceRef.current = null;
      }
      if (mapContainerRef.current && (mapContainerRef.current as any)._leaflet_id) {
        delete (mapContainerRef.current as any)._leaflet_id;
      }
    };
  }, []);

  // Update layers and geometries whenever props change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layers = layerGroupRef.current;
    if (!map || !layers) return;

    layers.clearLayers();
    const boundsPoints: L.LatLngExpression[] = [];

    // 1. Alternative Route (Amber Dashed)
    if (alternativeCoordinates && alternativeCoordinates.length > 1) {
      const altPoints = alternativeCoordinates.map(c => [c.lat, c.lng] as [number, number]);
      const altLine = L.polyline(altPoints, {
        color: '#f59e0b',
        weight: 4,
        dashArray: '8, 8',
        opacity: 0.85
      });
      altLine.bindTooltip('Direct Standard Route (Simulated Shortest)', { sticky: true });
      layers.addLayer(altLine);
      boundsPoints.push(...altPoints);
    }

    // 2. Blocked Route (Red warning)
    if (blockedCoordinates && blockedCoordinates.length > 1) {
      const blockedPoints = blockedCoordinates.map(c => [c.lat, c.lng] as [number, number]);
      const blockedLine = L.polyline(blockedPoints, {
        color: '#ef4444',
        weight: 6,
        dashArray: '5, 8',
        opacity: 0.95
      });
      blockedLine.bindTooltip('Blocked Corridor — Rerouted By AccessResQ', { sticky: true });
      layers.addLayer(blockedLine);
      boundsPoints.push(...blockedPoints);
    }

    // 3. Recommended Accessible Route (Emerald Green Solid)
    if (routeCoordinates && routeCoordinates.length > 1) {
      const bgGlow = L.polyline(routeCoordinates.map(c => [c.lat, c.lng] as [number, number]), {
        color: '#064e3b',
        weight: 8,
        opacity: 0.25
      });
      layers.addLayer(bgGlow);

      const recPoints = routeCoordinates.map(c => [c.lat, c.lng] as [number, number]);
      const recLine = L.polyline(recPoints, {
        color: '#059669',
        weight: 5,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round'
      });
      recLine.bindTooltip('Recommended Step-Free Accessible Route', { sticky: true });
      layers.addLayer(recLine);
      boundsPoints.push(...recPoints);
    }

    // 4. Origin Marker
    if (origin && typeof origin.lat === 'number' && typeof origin.lng === 'number' && !isNaN(origin.lat) && !isNaN(origin.lng)) {
      const originIcon = createCustomIcon(
        '#059669',
        originLabel,
        `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="m10 15 5-3-5-3v6Z"/></svg>`
      );
      const marker = L.marker([origin.lat, origin.lng], { icon: originIcon });
      marker.bindPopup(`<b>Starting Point</b><br/>${originLabel}`);
      layers.addLayer(marker);
      boundsPoints.push([origin.lat, origin.lng]);
    }

    // 5. Destination Marker
    if (destination && typeof destination.lat === 'number' && typeof destination.lng === 'number' && !isNaN(destination.lat) && !isNaN(destination.lng)) {
      const destIcon = createCustomIcon(
        '#2563eb',
        destinationLabel,
        `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`
      );
      const marker = L.marker([destination.lat, destination.lng], { icon: destIcon });
      marker.bindPopup(`<b>Destination</b><br/>${destinationLabel}`);
      layers.addLayer(marker);
      boundsPoints.push([destination.lat, destination.lng]);
    }

    // 6. Community Barriers
    if (Array.isArray(barriers)) {
      barriers.forEach(barrier => {
        if (!barrier || !barrier.coordinate || typeof barrier.coordinate.lat !== 'number' || typeof barrier.coordinate.lng !== 'number' || isNaN(barrier.coordinate.lat) || isNaN(barrier.coordinate.lng)) {
          return;
        }

        let iconColor = '#f59e0b';
        if (barrier.severity === 'impassable') iconColor = '#ef4444';
        if (barrier.status === 'resolved') iconColor = '#10b981';

        const barrierIcon = createCustomIcon(
          iconColor,
          (barrier.title || 'Barrier').slice(0, 18) + '..',
          `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`
        );
        const marker = L.marker([barrier.coordinate.lat, barrier.coordinate.lng], { icon: barrierIcon });
        
        const popupHtml = `
          <div style="font-family: inherit; max-width: 240px;">
            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: ${iconColor};">
              ${(barrier.category || 'barrier').replace('_', ' ')} • ${(barrier.status || 'pending').replace('_', ' ')}
            </div>
            <div style="font-weight: 700; font-size: 13px; margin: 4px 0;">${barrier.title}</div>
            <div style="font-size: 11px; color: #475569; margin-bottom: 6px;">${barrier.description}</div>
            <div style="font-size: 10px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 4px;">
              Confirmed by ${barrier.confirmationsCount || 0} community members
            </div>
          </div>
        `;
        marker.bindPopup(popupHtml);
        layers.addLayer(marker);
        boundsPoints.push([barrier.coordinate.lat, barrier.coordinate.lng]);
      });
    }

    // 7. Roadside Rescue Providers
    if (Array.isArray(providers)) {
      providers.forEach(prov => {
        if (!prov || !prov.coordinate || typeof prov.coordinate.lat !== 'number' || typeof prov.coordinate.lng !== 'number' || isNaN(prov.coordinate.lat) || isNaN(prov.coordinate.lng)) {
          return;
        }

        const isSelected = prov.id === selectedProviderId;
        const provColor = isSelected ? '#7c3aed' : '#0284c7';
        const provIcon = createCustomIcon(
          provColor,
          `${prov.name.slice(0, 14)} (${prov.distanceKm}km)`,
          `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 12h10"/><path d="M12 7v10"/></svg>`
        );

        const marker = L.marker([prov.coordinate.lat, prov.coordinate.lng], { icon: provIcon });
        marker.bindPopup(`
          <div style="font-family: inherit; max-width: 220px;">
            <div style="font-size: 11px; font-weight: 700; color: #0284c7;">Sample Roadside Unit</div>
            <div style="font-weight: 700; font-size: 13px;">${prov.name}</div>
            <div style="font-size: 11px; color: #334155; margin-top: 2px;">
              ⭐ ${prov.rating} (${prov.reviewCount} reviews) • ETA ~${prov.estimatedArrivalMinutes}m
            </div>
            <div style="font-size: 11px; color: #059669; font-weight: 600; margin-top: 4px;">
              ${prov.hasWheelchairHoistLift ? '✓ Equipped with Wheelchair Lift' : '• Standard Tow Unit'}
            </div>
          </div>
        `);
        layers.addLayer(marker);
        boundsPoints.push([prov.coordinate.lat, prov.coordinate.lng]);
      });
    }

    // Adjust view
    if (boundsPoints.length > 1) {
      map.fitBounds(L.latLngBounds(boundsPoints), {
        padding: [45, 45],
        maxZoom: 15
      });
    } else if (boundsPoints.length === 1) {
      map.setView(boundsPoints[0], 14);
    } else {
      map.setView([center.lat, center.lng], zoom);
    }

    // Invalidate size to ensure fresh tiles render
    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 100);
  }, [
    origin,
    originLabel,
    destination,
    destinationLabel,
    routeCoordinates,
    alternativeCoordinates,
    blockedCoordinates,
    barriers,
    providers,
    selectedProviderId
  ]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className={`${className} z-0 shadow-subtle border border-slate-200/80 overflow-hidden`} />
      
      {/* Legend pill */}
      <div className="absolute bottom-3 left-3 z-[400] bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3 text-xs font-medium text-slate-700 pointer-events-none">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-1.5 rounded-full bg-brand-600"></span>
          <span>Accessible Route</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-1.5 rounded-full bg-amber-500 border border-dashed border-amber-600"></span>
          <span>Alternative</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
          <span>Active Barrier</span>
        </div>
      </div>
    </div>
  );
};
