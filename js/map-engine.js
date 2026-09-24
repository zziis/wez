class MapEngine {
  constructor(containerId) {
    this.containerId = containerId;
    this.map = null;
    this.baseLayer = null;
    this.theme = localStorage.getItem('wasil_map_theme') || 'day';

    this.routeLayer = L.layerGroup();
    this.hazardLayer = L.layerGroup();
    this.trafficLayer = L.layerGroup();
    this.districtLayer = L.layerGroup();

    this.userMarker = null;
    this.destinationMarker = null;
    this.originMarker = null;
    this.previewMarker = null;
    this.routeLabelMarkers = [];
    this.turnMarker = null;
    this.currentUser = null;

    this.currentRoute = null;
    this.currentAlternatives = [];
    this.routePts = [];
    this.progressPassedLine = null;
    this.progressRemainingOuter = null;
    this.progressRemainingInner = null;

    this.navMode = false;
    this.headingUp = localStorage.getItem('wasil_heading_up') !== '0';
    this.currentBearing = 0;
    this.markerShape = localStorage.getItem('wasil_marker_shape') || 'triangle';
    this.districtMarkers = [];
  }

  init() {
    this.map = L.map(this.containerId, {
      center: [33.3152, 44.3661],
      zoom: 13,
      zoomControl: false,
      attributionControl: true,
      preferCanvas: true,
      zoomAnimation: true,
      fadeAnimation: true,
      markerZoomAnimation: true,
      inertia: true,
      inertiaDeceleration: 2800,
      zoomSnap: 0.25,
      zoomDelta: 0.5,
      minZoom: 2,
      maxBounds: [[-85, -Infinity], [85, Infinity]],
      maxBoundsViscosity: 1
    });

    this.routeLayer.addTo(this.map);
    this.trafficLayer.addTo(this.map);
    this.hazardLayer.addTo(this.map);
    this.districtLayer.addTo(this.map);

    this.map.on('zoomend moveend', () => this._refreshDistrictVisibility());
    this.setTheme(this.theme);
    this.renderDistrictLabels(window.IRAQ_DATA?.baghdadDistricts || []);
    this.renderTrafficSegments(window.IRAQ_DATA?.trafficSegments || []);
    return this.map;
  }

  setTheme(theme) {
    this.theme = theme;
    if (this.baseLayer) {
      this.map.removeLayer(this.baseLayer);
      this.baseLayer = null;
    }

    const styleUrl = theme === 'night'
      ? 'https://tiles.openfreemap.org/styles/dark'
      : 'https://tiles.openfreemap.org/styles/positron';

    if (window.L && typeof L.maplibreGL === 'function' && window.maplibregl) {
      this.baseLayer = L.maplibreGL({
        style: styleUrl,
        interactive: false,
        attributionControl: true
      }).addTo(this.map);

      const gl = this.baseLayer.getMaplibreMap();
      gl.once('load', () => {
        this._styleBaseLabels(gl);
        this._restyleBaseFeatures(gl);
      });
      gl.on('error', e => {
        if (e?.error) console.warn('OpenFreeMap:', e.error.message || e.error);
      });
    } else {
      const fallback = theme === 'night'
        ? 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'
        : 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}';
      this.baseLayer = L.tileLayer(fallback, {
        maxNativeZoom: 16,
        maxZoom: 20,
        crossOrigin: true,
        updateWhenIdle: false,
        keepBuffer: 6
      }).addTo(this.map);
    }
    document.body.dataset.theme = theme;
    try { localStorage.setItem('wasil_map_theme', theme); } catch {}
  }

  _styleBaseLabels(gl) {
    try {
      const style = gl.getStyle();
      if (!style?.layers) return;
      const night = this.theme === 'night';
      const labelColor = night ? '#d8e4e8' : '#596168';
      const strongColor = night ? '#eef5f7' : '#39434a';
      const waterColor = night ? '#8cc7ff' : '#155f9d';
      const greenColor = night ? '#8ed0a8' : '#1f7e49';
      const haloColor = night ? '#15202d' : '#ffffff';

      style.layers.forEach(layer => {
        const id = String(layer.id || '').toLowerCase();
        const hasText = layer?.layout?.['text-field'] !== undefined;
        if (!hasText) return;

        // Keep useful road/place/water labels, remove noisy POIs and building numbers.
        const useful = /(place|settlement|city|town|village|suburb|neigh|district|locality|road|street|transport|motorway|trunk|primary|secondary|water|river|lake|sea|canal)/.test(id);
        const noisy = /(poi|amenity|shop|housenumber|building-number|transit-stop|bus-stop|railway-station|airport-label)/.test(id);
        if (noisy && !useful) {
          try { gl.setLayoutProperty(layer.id, 'visibility', 'none'); } catch (_e) {}
          return;
        }

        try { gl.setPaintProperty(layer.id, 'text-halo-color', haloColor); } catch (_e) {}
        try { gl.setPaintProperty(layer.id, 'text-halo-width', /(road|street|transport)/.test(id) ? 1.5 : 2); } catch (_e) {}
        try { gl.setPaintProperty(layer.id, 'text-halo-blur', 0.35); } catch (_e) {}
        try {
          const c = /(water|river|lake|sea|canal)/.test(id) ? waterColor : /(park|green|forest|wood)/.test(id) ? greenColor : /(place|city|town|district|suburb)/.test(id) ? strongColor : labelColor;
          gl.setPaintProperty(layer.id, 'text-color', c);
        } catch (_e) {}
      });
    } catch (e) {
      console.warn('تعذر ترتيب تسميات الخريطة', e);
    }
  }

  _restyleBaseFeatures(gl) {
    try {
      const style = gl.getStyle();
      if (!style?.layers) return;
      const night = this.theme === 'night';
      const palette = night ? {
        background: '#272e3a', city: '#2b3a4d', building: '#313f50',
        water: '#24467a', waterLine: '#315a8c', park: '#256950', parkLine: '#2f8b68',
        motorway: '#799aba', primary: '#54718c', secondary: '#3f5871', street: '#3f5871', rail: '#455b70'
      } : {
        background: '#fafcfa', city: '#f9f8f4', building: '#eef0ef',
        water: '#1d4e89', waterLine: '#2d69a7', park: '#bef2c9', parkLine: '#8fd7a4',
        motorway: '#8d949b', primary: '#a6adb3', secondary: '#c6cbcf', street: '#d2d7db', rail: '#d2cecc'
      };
      const setPaint = (id, prop, value) => {
        try {
          const existing = gl.getPaintProperty(id, prop);
          if (existing !== undefined) gl.setPaintProperty(id, prop, value);
        } catch (_e) {}
      };

      style.layers.forEach(layer => {
        const id = String(layer.id || '').toLowerCase();
        if (layer.type === 'background') setPaint(layer.id, 'background-color', palette.background);

        if (/(water|river|lake|canal|reservoir|stream|sea)/.test(id)) {
          if (layer.type === 'fill') { setPaint(layer.id, 'fill-color', palette.water); setPaint(layer.id, 'fill-opacity', night ? 0.95 : 0.93); }
          if (layer.type === 'line') setPaint(layer.id, 'line-color', palette.waterLine);
        }
        if (/(park|garden|grass|green|forest|wood|nature|pitch)/.test(id)) {
          if (layer.type === 'fill') { setPaint(layer.id, 'fill-color', palette.park); setPaint(layer.id, 'fill-opacity', night ? 0.86 : 0.92); }
          if (layer.type === 'line') setPaint(layer.id, 'line-color', palette.parkLine);
        }
        if (/(landcover|landuse|residential|city|urban)/.test(id) && layer.type === 'fill' && !/(park|green|water)/.test(id)) {
          setPaint(layer.id, 'fill-color', palette.city);
        }
        if (/building/.test(id) && layer.type === 'fill') setPaint(layer.id, 'fill-color', palette.building);
        if (layer.type === 'line') {
          if (/(motorway|freeway|trunk)/.test(id)) setPaint(layer.id, 'line-color', palette.motorway);
          else if (/primary/.test(id)) setPaint(layer.id, 'line-color', palette.primary);
          else if (/(secondary|tertiary)/.test(id)) setPaint(layer.id, 'line-color', palette.secondary);
          else if (/(street|residential|minor|service|road)/.test(id)) setPaint(layer.id, 'line-color', palette.street);
          else if (/rail/.test(id)) setPaint(layer.id, 'line-color', palette.rail);
        }
      });
    } catch (e) {
      console.warn('تعذر ضبط شكل الخريطة', e);
    }
  }

  setMarkerShape(shape) {
    this.markerShape = shape || 'triangle';
    try { localStorage.setItem('wasil_marker_shape', this.markerShape); } catch {}
    if (this.currentUser) this.updateUserPosition(this.currentUser, this.navMode);
  }

  setHeadingUp(enabled) {
    this.headingUp = !!enabled;
    try { localStorage.setItem('wasil_heading_up', this.headingUp ? '1' : '0'); } catch {}
    if (!this.headingUp) {
      this.currentBearing = 0;
      this._applyCameraTransform(0);
    } else if (this.navMode && this.currentUser) {
      this.setNavigationBearing(this.currentUser.navHeading ?? this.currentUser.heading ?? 0, true);
    }
    return this.headingUp;
  }

  _getUserIcon(heading, navigating) {
    if (!navigating) {
      return L.divIcon({
        html: '<div class="user-location-marker"><div class="halo"></div><div class="dot"></div></div>',
        className: '',
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });
    }

    const shape = this.markerShape || 'triangle';
    const baseClass = `nav-marker nav-marker-${shape}`;
    let html = '';
    if (shape === 'car') {
      html = `<div class="${baseClass}" style="transform:rotate(${heading}deg)"><div class="car-badge">🚗</div></div>`;
    } else if (shape === 'bicycle') {
      html = `<div class="${baseClass}" style="transform:rotate(${heading}deg)"><div class="bike-badge">🚲</div></div>`;
    } else if (shape === 'arrow') {
      html = `<div class="${baseClass}" style="transform:rotate(${heading}deg)"><div class="arrow-shaft"></div><div class="arrow-head"></div></div>`;
    } else {
      html = `<div class="${baseClass}" style="transform:rotate(${heading}deg)"><div class="triangle-body"></div></div>`;
    }

    return L.divIcon({
      html,
      className: '',
      iconSize: [52, 52],
      iconAnchor: [26, 30]
    });
  }

  updateUserPosition(position, navigating = false) {
    this.currentUser = position;
    const heading = Number.isFinite(position.navHeading) ? position.navHeading : (Number.isFinite(position.heading) ? position.heading : 0);
    const icon = this._getUserIcon(heading, navigating || this.navMode);
    if (!this.userMarker) {
      this.userMarker = L.marker([position.lat, position.lng], { icon, zIndexOffset: 1600 }).addTo(this.map);
    } else {
      this.userMarker.setLatLng([position.lat, position.lng]);
      this.userMarker.setIcon(icon);
    }
  }

  _offsetTarget(lat, lng, zoom, offsetY = 0) {
    const point = this.map.project([lat, lng], zoom);
    return this.map.unproject(L.point(point.x, point.y - offsetY), zoom);
  }

  _aheadTarget(lat, lng, zoom, heading = 0, offset = 180) {
    const point = this.map.project([lat, lng], zoom);
    const r = (Number(heading) || 0) * Math.PI / 180;
    const dx = Math.sin(r) * offset;
    const dy = -Math.cos(r) * offset;
    return this.map.unproject(L.point(point.x + dx, point.y + dy), zoom);
  }

  centerOnUser(zoom = 17, navigation = this.navMode) {
    if (!this.currentUser) return;
    const h = this.currentUser.navHeading ?? this.currentUser.heading ?? 0;
    const target = navigation
      ? this._aheadTarget(this.currentUser.lat, this.currentUser.lng, zoom, h, 180)
      : [this.currentUser.lat, this.currentUser.lng];
    this.map.flyTo(target, zoom, { duration: 0.62 });
  }

  followUser(position, options = {}) {
    if (!position) return;
    const nextDistance = Number(options.nextDistance || 0);
    const heading = Number(options.heading ?? position.navHeading ?? position.heading ?? 0);
    const speed = Number(position.speed || 0);
    let zoom = 17.85;
    if (nextDistance > 0 && nextDistance < 55) zoom = 19.05;
    else if (nextDistance > 0 && nextDistance < 140) zoom = 18.55;
    else if (nextDistance > 0 && nextDistance < 320) zoom = 18.15;
    else if (speed > 75) zoom = 17.35;

    const offset = nextDistance > 0 && nextDistance < 120 ? 155 : 235;
    const target = this._aheadTarget(position.lat, position.lng, zoom, heading, offset);
    if (Math.abs(this.map.getZoom() - zoom) > 0.22) {
      this.map.flyTo(target, zoom, { animate: true, duration: 0.38 });
    } else {
      this.map.panTo(target, { animate: true, duration: 0.28 });
    }
  }

  adjustNavigationView(position, nextDistance = 0, heading = 0) {
    if (!position) return;
    this.setNavigationBearing(heading);
    this.followUser(position, { nextDistance, heading });
  }

  _applyCameraTransform(rotationDeg = 0) {
    const el = document.getElementById(this.containerId);
    if (!el) return;
    el.style.setProperty('--wasil-map-rotation', `${rotationDeg}deg`);
    el.style.setProperty('--wasil-counter-rotation', `${-rotationDeg}deg`);
  }

  setNavigationBearing(heading, immediate = false) {
    if (!this.navMode || !this.headingUp || !Number.isFinite(heading)) {
      if (!this.headingUp) this._applyCameraTransform(0);
      return;
    }
    const target = ((heading % 360) + 360) % 360;
    let diff = ((target - this.currentBearing + 540) % 360) - 180;
    this.currentBearing = (this.currentBearing + diff * (immediate ? 1 : 0.28) + 360) % 360;
    this._applyCameraTransform(-this.currentBearing);
  }

  setNavigationMode(active) {
    this.navMode = !!active;
    const mapEl = document.getElementById(this.containerId);
    mapEl?.classList.toggle('navigation-camera', this.navMode);
    document.body.classList.toggle('wasil-navigating', this.navMode);

    if (!this.navMode) {
      this.currentBearing = 0;
      this._applyCameraTransform(0);
      this.hideTurnMarker();
    }

    if (this.currentRoute) this.drawRoute(this.currentRoute, this.currentAlternatives);
    if (this.currentUser) this.updateUserPosition(this.currentUser, this.navMode);
  }

  clearRoute() {
    this.routeLayer.clearLayers();
    this.destinationMarker = null;
    this.originMarker = null;
    this.previewMarker = null;
    this.turnMarker = null;
    this.routeLabelMarkers = [];
    this.currentRoute = null;
    this.currentAlternatives = [];
    this.routePts = [];
    this.progressPassedLine = null;
    this.progressRemainingOuter = null;
    this.progressRemainingInner = null;
  }

  _sourcePinIcon(type = 'destination') {
    const file = type === 'origin' ? 'departure-pin.png' : 'destination-pin.png';
    const cls = type === 'origin' ? 'waze-origin-img' : 'waze-destination-img';
    const size = type === 'origin' ? [42, 50] : [44, 53];
    return L.divIcon({
      html: `<div class="waze-source-pin"><img class="${cls}" src="assets/waze-import/${file}?v=2.9.0" alt=""></div>`,
      className: '', iconSize: size, iconAnchor: [size[0] / 2, size[1] - 4]
    });
  }

  showDestinationPreview(destination, origin = null) {
    this.routeLayer.clearLayers();
    this.currentRoute = null;this.currentAlternatives = [];this.routePts = [];
    this.destinationMarker = L.marker([destination.lat, destination.lng], {icon:this._sourcePinIcon('destination'),zIndexOffset:1300}).addTo(this.routeLayer);
    this.previewMarker = this.destinationMarker;
    if (origin && Number.isFinite(+origin.lat) && Number.isFinite(+origin.lng)) {
      const bounds = L.latLngBounds([[origin.lat,origin.lng],[destination.lat,destination.lng]]);
      if (bounds.isValid()) this.map.fitBounds(bounds,{paddingTopLeft:[36,120],paddingBottomRight:[36,260],maxZoom:16.8,animate:true,duration:.55});
    } else {
      this.map.flyTo([destination.lat,destination.lng],16.2,{duration:.5});
    }
  }

  _routeMidpoint(pts) {
    if (!pts?.length) return null;
    return pts[Math.max(0,Math.min(pts.length-1,Math.floor(pts.length*0.53)))];
  }

  _addRouteTimeBadge(pts, route, selected = false, order = 0) {
    if (this.navMode || !pts?.length || !route) return;
    const p=this._routeMidpoint(pts);if(!p)return;
    const mins=Math.max(1,Math.round((route.duration||0)/60));
    const icon=L.divIcon({html:`<div class="route-time-badge ${selected?'selected':''}"><span>${mins} د</span><small>${order+1}</small></div>`,className:'',iconSize:[64,34],iconAnchor:[32,17]});
    const m=L.marker(p,{icon,zIndexOffset:selected?1250:900,interactive:false}).addTo(this.routeLayer);this.routeLabelMarkers.push(m);
  }

  drawRoute(route, alternatives = []) {
    this.routeLayer.clearLayers();
    this.currentRoute = route;
    this.currentAlternatives = alternatives || [];
    this.turnMarker = null;this.routeLabelMarkers=[];this.previewMarker=null;

    const visibleAlternatives=this.navMode?[]:(alternatives||[]).slice(0,2);
    visibleAlternatives.forEach((alt,idx) => {
      if (!alt.geometry?.coordinates) return;
      const altPts = alt.geometry.coordinates.map(c => [c[1], c[0]]);
      L.polyline(altPts,{color:'#27343d',weight:13,opacity:.58,lineCap:'round',lineJoin:'round'}).addTo(this.routeLayer);
      L.polyline(altPts,{color:'#7c8790',weight:8,opacity:.82,lineCap:'round',lineJoin:'round'}).addTo(this.routeLayer);
      this._addRouteTimeBadge(altPts,alt,false,idx+1);
    });

    const pts = route.geometry.coordinates.map(c => [c[1], c[0]]);
    this.routePts = pts;

    // Wide shadow/casing inspired by the route hierarchy in the provided source.
    L.polyline(pts, {
      color: this.navMode ? '#0b6f82' : '#173c48',
      weight: this.navMode ? 24 : 20,
      opacity: this.navMode ? 0.22 : 0.48,
      lineCap: 'round', lineJoin: 'round'
    }).addTo(this.routeLayer);

    const mainWeight = this.navMode ? 11 : 10;
    let mainLine;

    if (this.navMode) {
      this.progressPassedLine = L.polyline([], {color:'#46616a',weight:mainWeight,opacity:.82,lineCap:'round',lineJoin:'round'}).addTo(this.routeLayer);
      this.progressRemainingOuter = L.polyline(pts, {color:'#ffffff',weight:mainWeight+6,opacity:.98,lineCap:'round',lineJoin:'round'}).addTo(this.routeLayer);
      this.progressRemainingInner = L.polyline(pts, {color:'#2fc9ea',weight:mainWeight,opacity:1,lineCap:'round',lineJoin:'round'}).addTo(this.routeLayer);
      mainLine = this.progressRemainingInner;
    } else {
      L.polyline(pts, {color:'#ffffff',weight:mainWeight+6,opacity:.96,lineCap:'round',lineJoin:'round'}).addTo(this.routeLayer);
      mainLine = L.polyline(pts, {color:'#26bfe4',weight:mainWeight,opacity:1,lineCap:'round',lineJoin:'round'}).addTo(this.routeLayer);
      this._addRouteTimeBadge(pts,route,true,0);
    }

    const first = pts[0], last = pts[pts.length - 1];
    this.originMarker = L.marker(first,{icon:this._sourcePinIcon('origin'),zIndexOffset:1150}).addTo(this.routeLayer);
    this.destinationMarker = L.marker(last,{icon:this._sourcePinIcon('destination'),zIndexOffset:1250}).addTo(this.routeLayer);

    this.renderTrafficSegments(this._trafficNearRoute(route));

    this.map.fitBounds(mainLine.getBounds(), {
      paddingTopLeft: this.navMode ? [24, 185] : [32, 118],
      paddingBottomRight: this.navMode ? [24, 245] : [32, 315],
      maxZoom: this.navMode ? 18.3 : 16.9,
      animate: true, duration: 0.62
    });
  }

  updateRouteProgress(index = 0) {
    if (!this.navMode || !this.routePts.length || !this.progressRemainingInner) return;
    const i = Math.max(0, Math.min(this.routePts.length - 1, Number(index) || 0));
    const passed = this.routePts.slice(0, i + 1);
    const remain = this.routePts.slice(i);
    this.progressPassedLine?.setLatLngs(passed);
    this.progressRemainingOuter?.setLatLngs(remain);
    this.progressRemainingInner?.setLatLngs(remain);
  }

  showTurnMarker(step, distanceMeters = 0) {
    const loc = step?.maneuver?.location;
    if (!this.navMode || !loc || distanceMeters > 650 || step?.maneuver?.type === 'arrive') {
      this.hideTurnMarker();
      return;
    }
    const symbol = this._turnSymbol(step);
    const icon = L.divIcon({
      html: `<div class="map-turn-arrow">${symbol}</div>`,
      className: '',
      iconSize: [54, 54],
      iconAnchor: [27, 27]
    });
    const latlng = [loc[1], loc[0]];
    if (!this.turnMarker) {
      this.turnMarker = L.marker(latlng, { icon, zIndexOffset: 1450, interactive: false }).addTo(this.routeLayer);
    } else {
      this.turnMarker.setLatLng(latlng);
      this.turnMarker.setIcon(icon);
    }
  }

  hideTurnMarker() {
    if (this.turnMarker) {
      this.routeLayer.removeLayer(this.turnMarker);
      this.turnMarker = null;
    }
  }

  _turnSymbol(step) {
    const m = step?.maneuver || {};
    const mod = m.modifier || '';
    if (m.type === 'roundabout' || m.type === 'rotary') return '⟳';
    if (mod.includes('uturn')) return '↶';
    if (mod.includes('right')) return '↱';
    if (mod.includes('left')) return '↰';
    return '↑';
  }

  _trafficNearRoute(route) {
    const all = window.IRAQ_DATA?.trafficSegments || [];
    const coords = route?.geometry?.coordinates || [];
    if (!coords.length) return all;
    const latlngs = coords.map(c => L.latLng(c[1], c[0]));
    const bounds = L.latLngBounds(latlngs).pad(0.12);
    return all.filter(seg => (seg.coords || []).some(pt => bounds.contains(pt)));
  }

  routeOverview() {
    const layers = [];
    this.routeLayer.eachLayer(l => { if (l.getBounds) layers.push(l); });
    if (layers.length) {
      let b = layers[0].getBounds();
      layers.slice(1).forEach(l => b.extend(l.getBounds()));
      this._applyCameraTransform(0);
      this.map.fitBounds(b, { paddingTopLeft: [30, 120], paddingBottomRight: [30, 240], animate: true });
    }
  }

  renderHazards(hazards = []) {
    this.hazardLayer.clearLayers();
    const emoji = { camera: '📷', accident: '💥', bump: '⚠️', traffic: '🚦', checkpoint: '🛡️' };
    hazards.forEach(h => {
      if (!Array.isArray(h.coords)) return;
      let glyph = emoji[h.type] || '!';
      if (h.type === 'camera') {
        if (h.cameraKind === 'red_light') glyph = '🚦';
        else if (h.cameraKind === 'average_speed') glyph = '⏱';
        else if (h.cameraKind === 'traffic') glyph = '🎥';
      }
      const limit = h.type === 'camera' && h.speedLimit ? `<span class="camera-speed-badge">${String(h.speedLimit).replace(/[^0-9]/g,'')}</span>` : '';
      const icon = L.divIcon({
        html: `<div class="hazard-marker hazard-${h.type} hazard-kind-${h.cameraKind || 'default'}"><span class="hazard-glyph">${glyph}</span>${limit}</div>`,
        className: '',
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });
      const m = L.marker(h.coords, { icon, zIndexOffset: h.type === 'camera' ? 520 : 420 }).addTo(this.hazardLayer);
      const source = h.source === 'openstreetmap' ? '<small class="hazard-source">المصدر: OpenStreetMap</small>' : '';
      m.bindPopup(`<div class="hazard-popup"><b>${h.title || 'تنبيه طريق'}</b><small>${h.details || ''}</small>${source}</div>`);
    });
  }

  renderTrafficSegments(segments = []) {
    this.trafficLayer.clearLayers();
    (segments || []).forEach(seg => {
      if (!Array.isArray(seg.coords) || seg.coords.length < 2) return;
      const heavy = seg.severity === 'heavy';
      const color = heavy ? '#d14242' : '#e08b2d';
      const glow = heavy ? 'rgba(209,66,66,.32)' : 'rgba(224,139,45,.28)';
      L.polyline(seg.coords, {
        color: glow,
        weight: heavy ? 15 : 13,
        opacity: 0.72,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(this.trafficLayer);
      const line = L.polyline(seg.coords, {
        color,
        weight: heavy ? 8 : 7,
        opacity: 0.94,
        lineCap: 'round',
        lineJoin: 'round',
        dashArray: heavy ? null : '12 10'
      }).addTo(this.trafficLayer);
      if (seg.title) line.bindTooltip(seg.title, { direction: 'top', className: 'traffic-tooltip' });
    });
  }

  renderDistrictLabels(districts = []) {
    this.districtLayer.clearLayers();
    this.districtMarkers = [];
    (districts || []).forEach(item => {
      if (!Array.isArray(item.coords)) return;
      const icon = L.divIcon({
        html: `<div class="district-label ${item.priority ? 'priority' : ''}">${item.name}</div>`,
        className: '',
        iconSize: [128, 28],
        iconAnchor: [64, 14]
      });
      const marker = L.marker(item.coords, { icon, interactive: false, keyboard: false, zIndexOffset: 250 }).addTo(this.districtLayer);
      this.districtMarkers.push({ marker, item });
    });
    this._refreshDistrictVisibility();
  }

  _refreshDistrictVisibility() {
    if (!this.map || !this.districtMarkers.length) return;
    const zoom = this.map.getZoom();
    const bounds = this.map.getBounds().pad(0.12);
    this.districtMarkers.forEach(({ marker, item }) => {
      const minZoom = item.priority ? 12.7 : 14.25;
      const show = zoom >= minZoom && bounds.contains(item.coords);
      marker.setOpacity(show ? 1 : 0);
    });
  }
}

window.MapEngine = MapEngine;
