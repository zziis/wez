class MapEngine{
  constructor(containerId){
    this.containerId=containerId;this.map=null;this.tileLayer=null;this.theme='night';
    this.routeLayer=L.layerGroup();this.hazardLayer=L.layerGroup();this.userMarker=null;this.destinationMarker=null;this.originMarker=null;this.currentUser=null;
  }
  init(){
    this.map=L.map(this.containerId,{center:[33.3152,44.3661],zoom:13,zoomControl:false,attributionControl:false,preferCanvas:true,zoomAnimation:true,fadeAnimation:true,markerZoomAnimation:true,inertia:true,inertiaDeceleration:2600,zoomSnap:.25,zoomDelta:.5});
    this.routeLayer.addTo(this.map);this.hazardLayer.addTo(this.map);this.setTheme('night');
    return this.map;
  }
  setTheme(theme){
    this.theme=theme;if(this.tileLayer)this.map.removeLayer(this.tileLayer);
    const url=theme==='day'?'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png':'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    this.tileLayer=L.tileLayer(url,{maxZoom:20,subdomains:'abcd',crossOrigin:true,updateWhenIdle:false,keepBuffer:5}).addTo(this.map);
    document.body.dataset.theme=theme;
  }
  updateUserPosition(position,navigating=false){
    this.currentUser=position;const heading=Number.isFinite(position.heading)?position.heading:0;
    const html=navigating?`<div class="nav-user-arrow" style="transform:rotate(${heading}deg)"><div class="arrow-body"></div></div>`:`<div class="user-location-marker"><div class="halo"></div><div class="dot"></div></div>`;
    const icon=L.divIcon({html,className:'',iconSize:navigating?[42,42]:[34,34],iconAnchor:navigating?[21,24]:[17,17]});
    if(!this.userMarker){this.userMarker=L.marker([position.lat,position.lng],{icon,zIndexOffset:1200}).addTo(this.map)}
    else{this.userMarker.setLatLng([position.lat,position.lng]);this.userMarker.setIcon(icon)}
  }
  centerOnUser(zoom=17){if(this.currentUser)this.map.flyTo([this.currentUser.lat,this.currentUser.lng],zoom,{duration:.7})}
  followUser(position){this.map.panTo([position.lat,position.lng],{animate:true,duration:.35})}
  clearRoute(){this.routeLayer.clearLayers();this.destinationMarker=null;this.originMarker=null}
  drawRoute(route,alternatives=[]){
    this.clearRoute();
    alternatives.slice(0,2).forEach(alt=>{if(!alt.geometry?.coordinates)return;const pts=alt.geometry.coordinates.map(c=>[c[1],c[0]]);L.polyline(pts,{color:'#c4c7cb',weight:7,opacity:.55,lineCap:'round',lineJoin:'round'}).addTo(this.routeLayer)});
    const pts=route.geometry.coordinates.map(c=>[c[1],c[0]]);
    const glow=L.polyline(pts,{color:'#25c7ee',weight:13,opacity:.25,lineCap:'round',lineJoin:'round'}).addTo(this.routeLayer);
    L.polyline(pts,{color:'#27d2f4',weight:7,opacity:1,lineCap:'round',lineJoin:'round'}).addTo(this.routeLayer);
    const first=pts[0],last=pts[pts.length-1];
    this.originMarker=L.marker(first,{icon:L.divIcon({html:'<div class="origin-pin"></div>',className:'',iconSize:[24,24],iconAnchor:[12,12]})}).addTo(this.routeLayer);
    this.destinationMarker=L.marker(last,{icon:L.divIcon({html:'<div class="destination-pin"><div class="flag">🏁</div><div class="stem"></div></div>',className:'',iconSize:[42,48],iconAnchor:[12,44]})}).addTo(this.routeLayer);
    this.map.fitBounds(glow.getBounds(),{paddingTopLeft:[35,115],paddingBottomRight:[35,260],animate:true,duration:.7});
  }
  routeOverview(){const layers=[];this.routeLayer.eachLayer(l=>{if(l.getBounds)layers.push(l)});if(layers.length){let b=layers[0].getBounds();layers.slice(1).forEach(l=>b.extend(l.getBounds()));this.map.fitBounds(b,{paddingTopLeft:[30,120],paddingBottomRight:[30,240],animate:true})}}
  renderHazards(hazards=[]){
    this.hazardLayer.clearLayers();
    const emoji={camera:'📷',accident:'💥',bump:'⚠️',traffic:'🚦',checkpoint:'🛡️'};
    hazards.forEach(h=>{
      if(!Array.isArray(h.coords))return;
      const icon=L.divIcon({html:`<div class="hazard-marker hazard-${h.type}">${emoji[h.type]||'!'}</div>`,className:'',iconSize:[34,34],iconAnchor:[17,17]});
      const m=L.marker(h.coords,{icon}).addTo(this.hazardLayer);m.bindPopup(`<div class="hazard-popup"><b>${h.title||'تنبيه طريق'}</b><small>${h.details||''}</small></div>`);
    })
  }
}
window.MapEngine=MapEngine;
