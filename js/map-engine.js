class MapEngine{
  constructor(containerId){
    this.containerId=containerId;this.map=null;this.baseLayer=null;this.theme='night';
    this.routeLayer=L.layerGroup();this.hazardLayer=L.layerGroup();this.userMarker=null;this.destinationMarker=null;this.originMarker=null;this.currentUser=null;
  }
  init(){
    this.map=L.map(this.containerId,{
      center:[33.3152,44.3661],zoom:13,zoomControl:false,attributionControl:true,preferCanvas:true,
      zoomAnimation:true,fadeAnimation:true,markerZoomAnimation:true,inertia:true,inertiaDeceleration:2600,
      zoomSnap:.25,zoomDelta:.5,minZoom:2,
      maxBounds:[[-85,-Infinity],[85,Infinity]],maxBoundsViscosity:1
    });
    this.routeLayer.addTo(this.map);this.hazardLayer.addTo(this.map);this.setTheme('night');
    return this.map;
  }
  setTheme(theme){
    this.theme=theme;
    if(this.baseLayer){this.map.removeLayer(this.baseLayer);this.baseLayer=null}

    // OpenFreeMap + MapLibre: خدمة خرائط بدون API Key.
    // نخفي طبقات الكتابة من النمط نفسه حتى تبقى الخريطة نظيفة بدون أسماء مطبوعة.
    const styleUrl=theme==='night'
      ? 'https://tiles.openfreemap.org/styles/dark'
      : 'https://tiles.openfreemap.org/styles/positron';

    if(window.L && typeof L.maplibreGL==='function' && window.maplibregl){
      this.baseLayer=L.maplibreGL({
        style:styleUrl,
        interactive:false,
        attributionControl:true
      }).addTo(this.map);

      const gl=this.baseLayer.getMaplibreMap();
      gl.once('load',()=>this._hideBaseLabels(gl));
      gl.on('error',e=>{
        // لا نعرض رسائل المزود فوق الخريطة للمستخدم؛ نكتفي بالسجل ونبقي الواجهة تعمل.
        if(e?.error)console.warn('OpenFreeMap:',e.error.message||e.error);
      });
    }else{
      // احتياط إذا تعذر تحميل MapLibre: طبقة Esri أساسية بلا طبقة أسماء منفصلة.
      const fallback=theme==='night'
        ? 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'
        : 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}';
      this.baseLayer=L.tileLayer(fallback,{maxNativeZoom:16,maxZoom:20,crossOrigin:true,updateWhenIdle:false,keepBuffer:6}).addTo(this.map);
    }
    document.body.dataset.theme=theme;
  }
  _hideBaseLabels(gl){
    try{
      const style=gl.getStyle();
      if(!style?.layers)return;
      style.layers.forEach(layer=>{
        const textField=layer?.layout?.['text-field'];
        if(textField!==undefined){
          try{gl.setLayoutProperty(layer.id,'text-field','')}catch(_e){}
        }
      });
    }catch(e){console.warn('تعذر إخفاء بعض تسميات الخريطة',e)}
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
