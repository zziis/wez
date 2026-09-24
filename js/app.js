class WasilAppV2{
  constructor(){
    this.mapEngine=null;this.offlineManager=null;this.voiceAssistant=null;this.hazardsManager=null;
    this.currentPosition=null;this.watchId=null;this.selectedDestination=null;this.activeRoute=null;this.routeAlternatives=[];
    this.isNavigating=false;this.currentStepIndex=1;this.routeSteps=[];this.routeMetrics=null;this.alertedHazards=new Set();
    this.currentMode='car';this.currentModeLabel='سيارة';this.selectedHazardType='camera';this.selectedMarkerShape=localStorage.getItem('wasil_marker_shape')||'triangle';this.toastTimer=null;this.safetyTimer=null;this.lastRoadHazardLoad=null;
  }

  async init(){
    this.offlineManager=new OfflineManager();
    this.voiceAssistant=new VoiceAssistant();
    this.hazardsManager=new HazardsManager();
    this.mapEngine=new MapEngine('map-container');
    this.mapEngine.init();
    this.mapEngine.setMarkerShape(this.selectedMarkerShape);
    this.mapEngine.renderHazards(this.hazardsManager.getFilteredHazards());
    this.mapEngine.renderTrafficSegments(window.IRAQ_DATA?.trafficSegments||[]);
    this.mapEngine.renderDistrictLabels(window.IRAQ_DATA?.baghdadDistricts||[]);
    this.setupEvents();
    this.offlineManager.subscribe(online=>this.updateNetworkUI(online));
    this.hazardsManager.subscribe(()=>this.mapEngine.renderHazards(this.hazardsManager.getFilteredHazards()));
    this.offlineManager.registerServiceWorker();
    this.updateSavedCount();
    document.getElementById('voice-persona').value=this.voiceAssistant.voicePersona;
    setTimeout(()=>document.getElementById('splash-screen')?.classList.add('hide'),850);
    setTimeout(()=>document.getElementById('splash-screen')?.remove(),1400);
    await this.tryAutoLocation();
  }

  setupEvents(){
    const $=id=>document.getElementById(id);
    $('btn-enable-location').addEventListener('click',()=>this.requestLocation());
    $('btn-location-retry').addEventListener('click',()=>this.requestLocation());
    $('btn-recenter').addEventListener('click',()=>this.currentPosition?this.mapEngine.centerOnUser(this.isNavigating?18.25:16,this.isNavigating):this.requestLocation());
    $('search-launch').addEventListener('click',()=>this.openSearch());
    $('btn-close-search').addEventListener('click',()=>this.closeSearch());
    $('btn-search-submit').addEventListener('click',()=>this.performSearch($('search-input').value));
    $('search-input').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();this.performSearch(e.currentTarget.value)}});
    $('search-input').addEventListener('focus',()=>this.maybeWarnDriving());
    $('btn-nav-search').addEventListener('click',()=>{this.maybeWarnDriving();this.openSearch()});

    document.querySelectorAll('[data-category]').forEach(btn=>btn.addEventListener('click',()=>this.handleShortcut(btn.dataset.category)));
    document.querySelectorAll('[data-search]').forEach(btn=>btn.addEventListener('click',()=>this.handleShortcut(btn.dataset.search)));

    $('btn-route-overview').addEventListener('click',()=>this.mapEngine.routeOverview());
    $('btn-nav-overview').addEventListener('click',()=>this.mapEngine.routeOverview());
    $('btn-nav-orientation')?.addEventListener('click',()=>{const enabled=this.mapEngine.setHeadingUp(!this.mapEngine.headingUp);this.updateOrientationButton();this.toast(enabled?'اتجاه السير أصبح للأعلى':'تم تثبيت الشمال للأعلى')});
    $('btn-cancel-route').addEventListener('click',()=>this.cancelRoute());
    $('btn-start-nav').addEventListener('click',()=>this.startNavigation());
    $('btn-stop-nav').addEventListener('click',()=>this.stopNavigation());
    $('btn-save-trip').addEventListener('click',()=>this.saveCurrentTrip());

    $('btn-menu').addEventListener('click',()=>this.toggleMenu(true));
    $('btn-close-menu').addEventListener('click',()=>this.toggleMenu(false));
    $('menu-backdrop').addEventListener('click',()=>this.toggleMenu(false));
    $('menu-theme').addEventListener('click',()=>{const next=this.mapEngine.theme==='night'?'day':'night';this.mapEngine.setTheme(next);this.toast(next==='night'?'تم تفعيل النمط الليلي':'تم تفعيل النمط النهاري')});
    $('menu-saved').addEventListener('click',()=>{this.toggleMenu(false);this.openSearch();this.renderSavedResults()});
    $('voice-persona').addEventListener('change',e=>this.voiceAssistant.setPersona(e.target.value));
    $('btn-voice').addEventListener('click',()=>{const muted=this.voiceAssistant.toggleMute();$('btn-voice').textContent=muted?'🔇':'🔊';this.toast(muted?'تم كتم المساعد':'تم تشغيل المساعد الصوتي')});

    $('vehicle-pill').addEventListener('click',()=>this.toggleVehicleSheet(true));
    $('vehicle-backdrop').addEventListener('click',()=>this.toggleVehicleSheet(false));
    document.querySelectorAll('#vehicle-sheet [data-mode]').forEach(btn=>btn.addEventListener('click',()=>{
      this.currentMode=btn.dataset.mode;this.currentModeLabel=btn.dataset.label;$('vehicle-pill').innerHTML=`${this.modeEmoji(this.currentMode)} <span>${this.currentModeLabel}</span> <span class="chev">⌄</span>`;this.toggleVehicleSheet(false);
      if(this.activeRoute&&this.selectedDestination&&this.offlineManager.isOnline())this.buildRoute(this.selectedDestination);
    }));

    document.querySelectorAll('#vehicle-sheet [data-marker-shape]').forEach(btn=>{
      if(btn.dataset.markerShape===this.selectedMarkerShape)btn.classList.add('selected');
      btn.addEventListener('click',()=>{
        document.querySelectorAll('#vehicle-sheet [data-marker-shape]').forEach(b=>b.classList.remove('selected'));
        btn.classList.add('selected');
        this.selectedMarkerShape=btn.dataset.markerShape;
        this.mapEngine.setMarkerShape(this.selectedMarkerShape);
        this.toast('تم تغيير شكل مؤشر الملاحة');
      });
    });

    $('btn-report').addEventListener('click',()=>this.toggleReportSheet(true));
    $('report-backdrop').addEventListener('click',()=>this.toggleReportSheet(false));
    document.querySelectorAll('#report-sheet [data-hazard]').forEach(btn=>btn.addEventListener('click',()=>{
      document.querySelectorAll('#report-sheet [data-hazard]').forEach(b=>b.classList.remove('selected'));btn.classList.add('selected');this.selectedHazardType=btn.dataset.hazard;
    }));
    document.querySelector('#report-sheet [data-hazard="camera"]')?.classList.add('selected');
    $('btn-submit-report').addEventListener('click',()=>this.submitHazardReport());

    window.addEventListener('orientationchange',()=>setTimeout(()=>this.mapEngine.map.invalidateSize(),250));
  }

  async tryAutoLocation(){
    if(!navigator.geolocation)return;
    try{
      if(navigator.permissions?.query){
        const p=await navigator.permissions.query({name:'geolocation'});
        if(p.state==='granted')this.requestLocation(true);
      }
    }catch{}
  }

  requestLocation(silent=false){
    const errorEl=document.getElementById('location-error');const retry=document.getElementById('btn-location-retry');
    if(!navigator.geolocation){errorEl.textContent='هذا الجهاز لا يدعم تحديد الموقع.';retry.classList.remove('hidden');return}
    if(!silent){errorEl.textContent='جارٍ تحديد موقعك…';retry.classList.add('hidden')}
    navigator.geolocation.getCurrentPosition(
      pos=>{
        this.applyPosition(pos,true);document.getElementById('location-gate').classList.add('hidden');this.startLocationWatch();this.reverseGeocodeOrigin();
      },
      err=>{
        const msg=err.code===1?'لم يتم السماح بالوصول إلى الموقع. فعّل الإذن من إعدادات المتصفح أو التطبيق.':err.code===2?'تعذر تحديد موقعك حالياً. تأكد من تشغيل GPS.':'انتهت مهلة تحديد الموقع. حاول مرة أخرى.';
        errorEl.textContent=msg;retry.classList.remove('hidden');document.getElementById('location-gate').classList.remove('hidden');
      },
      {enableHighAccuracy:true,timeout:15000,maximumAge:4000}
    );
  }

  startLocationWatch(){
    if(this.watchId!==null||!navigator.geolocation)return;
    this.watchId=navigator.geolocation.watchPosition(pos=>this.applyPosition(pos,false),()=>{}, {enableHighAccuracy:true,maximumAge:1000,timeout:12000});
  }

  applyPosition(pos,first=false){
    const c=pos.coords;this.currentPosition={lat:c.latitude,lng:c.longitude,accuracy:c.accuracy,heading:Number.isFinite(c.heading)?c.heading:null,speed:Number.isFinite(c.speed)?Math.max(0,c.speed*3.6):0,timestamp:pos.timestamp};
    this.mapEngine.updateUserPosition(this.currentPosition,this.isNavigating);
    if(first){this.mapEngine.centerOnUser(16,false);}
    this.loadMappedRoadHazards();
    if(this.isNavigating){this.updateNavigationFromPosition();}
    document.getElementById('nav-speed').textContent=Math.round(this.currentPosition.speed||0);
    this.checkNearbyHazards();
  }

  async loadMappedRoadHazards(){
    if(!this.currentPosition||!this.offlineManager.isOnline())return;
    if(this.lastRoadHazardLoad && this.haversine(this.currentPosition.lat,this.currentPosition.lng,this.lastRoadHazardLoad.lat,this.lastRoadHazardLoad.lng)<6000)return;
    const {lat,lng}=this.currentPosition;this.lastRoadHazardLoad={lat,lng};
    const q=`[out:json][timeout:18];(
      node(around:22000,${lat},${lng})[highway=speed_camera];
      nwr(around:18000,${lat},${lng})[enforcement~"^(maxspeed|traffic_signals|average_speed)$"];
      nwr(around:14000,${lat},${lng})["camera:type"~"traffic|speed|red_light",i];
      node(around:10000,${lat},${lng})[traffic_calming];
    );out center tags 240;`;
    const endpoints=[
      'https://overpass-api.de/api/interpreter?data=',
      'https://overpass.kumi.systems/api/interpreter?data='
    ];
    try{
      let data=null,lastError=null;
      for(const endpoint of endpoints){
        try{
          const res=await fetch(endpoint+encodeURIComponent(q),{headers:{'Accept':'application/json'}});
          if(!res.ok)throw new Error(`overpass ${res.status}`);
          data=await res.json();break;
        }catch(e){lastError=e;}
      }
      if(!data)throw lastError||new Error('overpass unavailable');
      const seen=new Set();
      const mapped=[];
      for(const e of (data.elements||[])){
        const latv=Number(e.lat??e.center?.lat),lonv=Number(e.lon??e.center?.lon);if(!Number.isFinite(latv)||!Number.isFinite(lonv))continue;
        const tags=e.tags||{};const enforcement=String(tags.enforcement||'').toLowerCase();const cameraType=String(tags['camera:type']||'').toLowerCase();const calming=tags.traffic_calming;
        const isCam=tags.highway==='speed_camera'||!!enforcement||/traffic|speed|red_light/.test(cameraType);
        const kind=!isCam?'bump':enforcement==='traffic_signals'||/red.?light/.test(cameraType)?'red_light':enforcement==='average_speed'?'average_speed':/traffic/.test(cameraType)?'traffic':'speed';
        const key=`${e.type}-${e.id}-${isCam?'cam':'bump'}`;if(seen.has(key))continue;seen.add(key);
        let title,details,speedLimit=null;
        if(isCam){
          if(kind==='red_light')title='كاميرا إشارة ضوئية';
          else if(kind==='average_speed')title='قياس سرعة متوسطة';
          else if(kind==='traffic')title='كاميرا مراقبة مرورية';
          else title='كاميرا سرعة';
          speedLimit=tags.maxspeed||tags['maxspeed:forward']||tags['maxspeed:backward']||null;
          const bits=[];if(speedLimit)bits.push(`السرعة ${speedLimit}`);if(tags.direction)bits.push(`الاتجاه ${tags.direction}`);if(tags.ref)bits.push(`رقم ${tags.ref}`);bits.push('مسجلة على OpenStreetMap');details=bits.join(' · ');
        }else{
          title='مهدئ سرعة / مطب';details=calming?`النوع: ${calming} · OpenStreetMap`:'مسجل على OpenStreetMap';
        }
        mapped.push({id:`osm-${e.type}-${e.id}`,type:isCam?'camera':'bump',cameraKind:kind,title,details,coords:[latv,lonv],source:'openstreetmap',speedLimit});
      }
      this.hazardsManager.setNetworkHazards(mapped);
      this.updateRoadDataStats(mapped);
    }catch(e){console.warn('Road hazards unavailable',e);this.updateRoadDataStats([],'غير متاح')}
  }

  updateRoadDataStats(list=[],label=''){
    const cams=(list||[]).filter(x=>x.type==='camera').length;
    const el=document.getElementById('camera-count');if(el)el.textContent=String(cams);
    const wrap=document.getElementById('camera-count-wrap');if(wrap)wrap.title=label||`${cams} كاميرا/نقطة رقابة مسجلة قربك`;
  }

  async reverseGeocodeOrigin(){
    if(!this.currentPosition||!this.offlineManager.isOnline()){document.getElementById('origin-label').textContent='موقع GPS الحالي';return}
    try{
      const {lat,lng}=this.currentPosition;const url=`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=16&accept-language=ar`;
      const r=await fetch(url,{headers:{'Accept':'application/json'}});if(!r.ok)throw new Error();const d=await r.json();document.getElementById('origin-label').textContent=this.shortenAddress(d.display_name)||'موقعك الحالي';
    }catch{document.getElementById('origin-label').textContent='موقع GPS الحالي'}
  }

  updateNetworkUI(online){
    const pill=document.getElementById('connection-pill');const banner=document.getElementById('network-banner');pill.classList.toggle('offline',!online);pill.classList.toggle('online',online);pill.querySelector('b').textContent=online?'متصل':'أوفلاين';banner.classList.toggle('hidden',online);
    if(!online)this.toast('أنت الآن بدون إنترنت. البحث والمسارات الجديدة متوقفة، ويمكنك استخدام المحفوظات.');
    else if(this.currentPosition)this.loadMappedRoadHazards();
  }

  openSearch(){
    const sheet=document.getElementById('search-sheet');sheet.classList.remove('hidden');sheet.setAttribute('aria-hidden','false');document.getElementById('home-controls').classList.add('hidden');
    if(!this.isNavigating)setTimeout(()=>document.getElementById('search-input').focus(),120);
    this.maybeWarnDriving();
  }
  closeSearch(){
    document.getElementById('search-sheet').classList.add('hidden');document.getElementById('search-sheet').setAttribute('aria-hidden','true');
    if(!this.isNavigating&&!this.activeRoute)document.getElementById('home-controls').classList.remove('hidden');
  }
  maybeWarnDriving(){
    if(this.isNavigating||(this.currentPosition?.speed||0)>5){const el=document.getElementById('safety-warning');el.classList.remove('hidden');clearTimeout(this.safetyTimer);this.safetyTimer=setTimeout(()=>el.classList.add('hidden'),3500)}
  }

  async handleShortcut(type){
    if(type==='saved'){this.openSearch();this.renderSavedResults();return}
    const labels={fuel:'محطة وقود',food:'مطعم',parking:'موقف سيارات'};this.openSearch();document.getElementById('search-input').value=labels[type]||'';await this.performSearch(labels[type]||'');
  }

  async performSearch(rawQuery){
    const q=(rawQuery||'').trim();if(!q){this.toast('اكتب اسم المكان أولاً');return}
    const state=document.getElementById('search-state'),results=document.getElementById('search-results');results.innerHTML='';
    if(!this.offlineManager.isOnline()){this.renderSavedResults(q);return}
    state.textContent='جارٍ البحث عن الأماكن…';
    try{
      let url=`https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=8&countrycodes=iq&accept-language=ar&q=${encodeURIComponent(q)}`;
      if(this.currentPosition && ['محطة وقود','مطعم','موقف سيارات'].includes(q)){
        const {lat,lng}=this.currentPosition;const box=[lng-.18,lat+.14,lng+.18,lat-.14].join(',');url+=`&viewbox=${box}&bounded=1`;
      }
      const res=await fetch(url,{headers:{'Accept':'application/json'}});if(!res.ok)throw new Error('search');const data=await res.json();
      const places=data.map(x=>({id:`osm-${x.place_id}`,name:x.name||x.display_name?.split(',')[0]||'مكان',address:x.display_name||'',lat:+x.lat,lng:+x.lon,kind:'place'}));
      if(!places.length){const local=this.localDataSearch(q);this.renderSearchResults(local);state.textContent=local.length?'نتائج من دليل وصل المحلي':'لم يتم العثور على نتائج.'}
      else{this.renderSearchResults(places);state.textContent=`تم العثور على ${places.length} نتيجة`}
    }catch{
      const local=this.localDataSearch(q);this.renderSearchResults(local);state.textContent=local.length?'تعذر البحث الشبكي، تظهر نتائج دليل وصل المحلي.':'تعذر الاتصال بخدمة البحث. حاول لاحقاً.';
    }
  }

  localDataSearch(q){
    const s=q.toLowerCase();const out=[];
    (IRAQ_DATA.governorates||[]).forEach(g=>{
      if((g.name||'').toLowerCase().includes(s)||(g.nameEn||'').toLowerCase().includes(s))out.push({id:`gov-${g.id}`,name:g.name,address:`محافظة ${g.name}`,lat:g.center[0],lng:g.center[1],kind:'place'});
      (g.keyPlaces||[]).forEach((p,i)=>{if((p.name||'').toLowerCase().includes(s))out.push({id:`local-${g.id}-${i}`,name:p.name,address:g.name,lat:p.coords[0],lng:p.coords[1],kind:'place'})})
    });
    (IRAQ_DATA.baghdadDistricts||[]).forEach((d,i)=>{if((d.name||'').toLowerCase().includes(s))out.push({id:`district-${i}`,name:d.name,address:'بغداد',lat:d.coords[0],lng:d.coords[1],kind:'place'})});
    return out.slice(0,10);
  }

  renderSearchResults(items){
    const box=document.getElementById('search-results');box.innerHTML='';
    items.forEach(item=>{
      const el=document.createElement('div');el.className='result-item';el.innerHTML=`<div class="result-icon">${item.kind==='trip'?'🛣️':'📍'}</div><div class="result-copy"><b>${this.escapeHtml(item.name)}</b><small>${this.escapeHtml(item.address||item.subtitle||'')}</small></div><button class="result-save" title="حفظ">${item.kind==='trip'?'✓':'☆'}</button>`;
      el.querySelector('.result-copy').addEventListener('click',()=>this.selectSearchResult(item));el.querySelector('.result-icon').addEventListener('click',()=>this.selectSearchResult(item));
      el.querySelector('.result-save').addEventListener('click',e=>{e.stopPropagation();if(item.kind==='trip'){this.toast('هذه الرحلة محفوظة مسبقاً')}else{this.offlineManager.savePlace(item);this.updateSavedCount();e.currentTarget.textContent='★';this.toast('تم حفظ المكان')}});
      box.appendChild(el);
    });
  }

  renderSavedResults(filter=''){
    const f=filter.trim().toLowerCase();const trips=this.offlineManager.getSavedTrips().map(t=>({kind:'trip',trip:t,name:t.destination?.name||'رحلة محفوظة',address:`مسار محفوظ • ${this.formatDistance(t.route?.distance||0)} • ${this.formatDuration(t.route?.duration||0)}`,lat:t.destination?.lat,lng:t.destination?.lng}));
    const places=this.offlineManager.getSavedPlaces().map(p=>({...p,kind:'place'}));let all=[...trips,...places];if(f)all=all.filter(x=>(x.name||'').toLowerCase().includes(f)||(x.address||'').toLowerCase().includes(f));
    document.getElementById('search-state').textContent=all.length?'المحفوظات المتاحة على هذا الجهاز':'لا توجد أماكن أو رحلات محفوظة بعد.';this.renderSearchResults(all);
  }

  async selectSearchResult(item){
    if(item.kind==='trip'&&item.trip){this.loadSavedTrip(item.trip);return}
    this.selectedDestination={id:item.id,name:item.name,address:item.address,lat:+item.lat,lng:+item.lng};
    this.closeSearch();await this.buildRoute(this.selectedDestination);
  }

  async buildRoute(destination){
    if(!this.currentPosition){this.toast('فعّل موقعك أولاً');document.getElementById('location-gate').classList.remove('hidden');return}
    if(!this.offlineManager.isOnline()){
      const saved=this.offlineManager.findSavedTrip(destination);if(saved){this.loadSavedTrip(saved)}else{this.toast('لا يوجد مسار محفوظ لهذه الوجهة. احفظ الرحلة مسبقاً أثناء الاتصال بالإنترنت.')}return;
    }
    this.toast('جارٍ حساب أفضل طريق…');
    try{
      const {lat,lng}=this.currentPosition;const profile='driving';
      const url=`https://router.project-osrm.org/route/v1/${profile}/${lng},${lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson&steps=true&alternatives=true`;
      const res=await fetch(url);if(!res.ok)throw new Error('route');const data=await res.json();if(data.code!=='Ok'||!data.routes?.length)throw new Error('route');
      const [main,...alts]=data.routes;this.activeRoute=this.normalizeRoute(main);this.routeAlternatives=alts.map(r=>this.normalizeRoute(r));this.selectedDestination=destination;
      this.mapEngine.setNavigationMode(false);this.mapEngine.drawRoute(this.activeRoute,this.routeAlternatives);this.renderRouteSheet();
      if(this.currentMode!=='car'&&this.currentMode!=='taxi')this.toast('ملاحظة: خدمة المسار الحالية تعتمد شبكة طرق السيارات لهذا الإصدار.');
    }catch{this.toast('تعذر إنشاء المسار عبر الإنترنت. تحقق من الشبكة وحاول مجدداً.')}
  }

  normalizeRoute(route){return {geometry:route.geometry,distance:route.distance,duration:route.duration,legs:route.legs||[],weight:route.weight||0,source:'osrm'}}

  renderRouteSheet(){
    const sheet=document.getElementById('route-sheet');sheet.classList.remove('hidden');sheet.setAttribute('aria-hidden','false');document.getElementById('home-controls').classList.add('hidden');
    document.getElementById('route-duration').textContent=this.formatDuration(this.activeRoute.duration);document.getElementById('route-distance').textContent=this.formatDistance(this.activeRoute.distance);
    document.getElementById('route-destination').textContent=this.selectedDestination?.name||'الوجهة';document.getElementById('route-description').textContent=this.offlineManager.isOnline()?'مسار محسوب عبر شبكة الطرق الحالية.':'هذا مسار محفوظ مسبقاً للعمل بدون إنترنت.';
  }

  cancelRoute(){this.activeRoute=null;this.selectedDestination=null;this.mapEngine.setNavigationMode(false);this.mapEngine.clearRoute();this.mapEngine.renderTrafficSegments(window.IRAQ_DATA?.trafficSegments||[]);document.getElementById('route-sheet').classList.add('hidden');if(!this.isNavigating)document.getElementById('home-controls').classList.remove('hidden');if(this.currentPosition)this.mapEngine.centerOnUser(16,false)}

  saveCurrentTrip(){
    if(!this.activeRoute||!this.selectedDestination)return;
    const compact={...this.activeRoute,geometry:{...this.activeRoute.geometry,coordinates:this.compactCoordinates(this.activeRoute.geometry.coordinates)}};
    this.offlineManager.savePlace(this.selectedDestination);
    this.offlineManager.saveTrip({destination:this.selectedDestination,origin:{lat:this.currentPosition.lat,lng:this.currentPosition.lng},route:compact,mode:this.currentMode,label:this.currentModeLabel});this.updateSavedCount();this.toast('تم حفظ الوجهة والمسار للأوفلاين. ستبقى بلاطات الخريطة التي سبق عرضها متاحة عند تخزينها في الجهاز.');
  }

  loadSavedTrip(saved){
    if(!saved?.route?.geometry){this.toast('بيانات الرحلة المحفوظة غير مكتملة');return}
    this.selectedDestination=saved.destination;this.activeRoute=saved.route;this.currentMode=saved.mode||'car';this.currentModeLabel=saved.label||'سيارة';this.closeSearch();this.mapEngine.drawRoute(this.activeRoute,[]);this.mapEngine.setNavigationMode(false);this.renderRouteSheet();this.toast('تم فتح المسار المحفوظ بدون الحاجة لحساب مسار جديد.');
  }

  startNavigation(){
    if(!this.activeRoute||!this.currentPosition)return;
    this.isNavigating=true;this.alertedHazards.clear();this.routeSteps=(this.activeRoute.legs||[]).flatMap(l=>l.steps||[]);this.currentStepIndex=this.routeSteps.length>1?1:0;this.prepareRouteMetrics();
    document.getElementById('route-sheet').classList.add('hidden');document.getElementById('home-controls').classList.add('hidden');document.getElementById('navigation-ui').classList.remove('hidden');document.getElementById('navigation-ui').setAttribute('aria-hidden','false');
    this.mapEngine.setNavigationMode(true);this.updateOrientationButton();this.mapEngine.updateUserPosition(this.currentPosition,true);this.mapEngine.centerOnUser(18.35,true);this.updateNavigationFromPosition(true);
    const text=this.getCurrentInstruction();this.voiceAssistant.speak(`بدأت الملاحة. ${text}`,true);
  }

  stopNavigation(){
    this.isNavigating=false;document.getElementById('navigation-ui').classList.add('hidden');document.getElementById('navigation-ui').setAttribute('aria-hidden','true');this.mapEngine.setNavigationMode(false);this.mapEngine.updateUserPosition(this.currentPosition,false);this.cancelRoute();this.voiceAssistant.speak('تم إنهاء الملاحة.');
  }

  prepareRouteMetrics(){
    const coords=this.activeRoute?.geometry?.coordinates||[];const cum=[0];for(let i=1;i<coords.length;i++){cum[i]=cum[i-1]+this.haversine(coords[i-1][1],coords[i-1][0],coords[i][1],coords[i][0])}this.routeMetrics={cum,total:cum[cum.length-1]||this.activeRoute.distance||0};
  }

  updateNavigationFromPosition(forceSpeak=false){
    if(!this.isNavigating||!this.currentPosition||!this.activeRoute)return;
    const steps=this.routeSteps;let nextDistance=0,current=null;
    if(steps.length){
      const step=steps[Math.min(this.currentStepIndex,steps.length-1)];const loc=step?.maneuver?.location;
      if(loc){const d=this.haversine(this.currentPosition.lat,this.currentPosition.lng,loc[1],loc[0]);nextDistance=d;
        if(d<38&&this.currentStepIndex<steps.length-1){this.currentStepIndex++;const nextText=this.getCurrentInstruction();this.voiceAssistant.speak(nextText,true)}
        document.getElementById('nav-next-distance').textContent=this.formatMeters(d);
      }
      current=steps[Math.min(this.currentStepIndex,steps.length-1)];document.getElementById('nav-instruction-text').textContent=this.translateStep(current);document.getElementById('nav-arrow').textContent=this.stepArrow(current);
      if(forceSpeak&&current)this.voiceAssistant.speak(this.translateStep(current),true);
    }

    const progress=this.getRouteProgress();
    const navHeading=this.navigationHeading(progress.index);
    this.currentPosition.navHeading=navHeading;
    this.mapEngine.updateUserPosition(this.currentPosition,true);
    this.mapEngine.adjustNavigationView(this.currentPosition,nextDistance,navHeading);
    this.mapEngine.updateRouteProgress(progress.index);
    this.mapEngine.showTurnMarker(current,nextDistance);

    document.getElementById('nav-distance-left').textContent=this.formatDistance(progress.remaining);
    const duration=(this.activeRoute.duration||0)*(progress.remaining/Math.max(this.activeRoute.distance||1,1));
    document.getElementById('nav-time-left').textContent=this.formatDuration(duration);
    document.getElementById('nav-speed').textContent=Math.round(this.currentPosition.speed||0);

    const dest=this.selectedDestination;if(dest){const arriveD=this.haversine(this.currentPosition.lat,this.currentPosition.lng,dest.lat,dest.lng);if(arriveD<45){document.getElementById('nav-arrow').textContent='🏁';document.getElementById('nav-next-distance').textContent='وصلت';document.getElementById('nav-instruction-text').textContent=`وصلت إلى ${dest.name||'وجهتك'}`;this.mapEngine.hideTurnMarker();if(!this._arrivalAnnounced){this._arrivalAnnounced=true;this.voiceAssistant.playArrivalSuccess();this.voiceAssistant.speak('وصلت إلى وجهتك. حمداً لله على السلامة.',true)}}}
  }

  navigationHeading(routeIndex=0){
    const gpsHeading=this.currentPosition?.heading;
    if(Number.isFinite(gpsHeading)&&(this.currentPosition?.speed||0)>3)return gpsHeading;
    const coords=this.activeRoute?.geometry?.coordinates||[];
    if(coords.length<2)return 0;
    const i=Math.max(0,Math.min(coords.length-2,Number(routeIndex)||0));
    const j=Math.min(coords.length-1,i+Math.max(2,Math.min(8,coords.length-i-1)));
    return this.bearing(coords[i][1],coords[i][0],coords[j][1],coords[j][0]);
  }

  bearing(lat1,lon1,lat2,lon2){
    const toRad=x=>x*Math.PI/180;
    const y=Math.sin(toRad(lon2-lon1))*Math.cos(toRad(lat2));
    const x=Math.cos(toRad(lat1))*Math.sin(toRad(lat2))-Math.sin(toRad(lat1))*Math.cos(toRad(lat2))*Math.cos(toRad(lon2-lon1));
    return (Math.atan2(y,x)*180/Math.PI+360)%360;
  }

  updateOrientationButton(){
    const btn=document.getElementById('btn-nav-orientation');if(!btn)return;
    btn.textContent=this.mapEngine?.headingUp?'🧭':'N';
    btn.title=this.mapEngine?.headingUp?'اتجاه السير للأعلى':'الشمال للأعلى';
    btn.classList.toggle('active',!!this.mapEngine?.headingUp);
  }

  getRouteProgress(){
    const coords=this.activeRoute?.geometry?.coordinates||[];if(!coords.length||!this.routeMetrics)return{remaining:this.activeRoute?.distance||0};
    const step=Math.max(1,Math.ceil(coords.length/700));let best=0,bestD=Infinity;for(let i=0;i<coords.length;i+=step){const d=this.haversine(this.currentPosition.lat,this.currentPosition.lng,coords[i][1],coords[i][0]);if(d<bestD){bestD=d;best=i}}
    const from=Math.max(0,best-step),to=Math.min(coords.length-1,best+step);for(let i=from;i<=to;i++){const d=this.haversine(this.currentPosition.lat,this.currentPosition.lng,coords[i][1],coords[i][0]);if(d<bestD){bestD=d;best=i}}
    const geoRemain=Math.max(0,this.routeMetrics.total-this.routeMetrics.cum[best]);const scale=(this.activeRoute.distance||this.routeMetrics.total)/Math.max(this.routeMetrics.total,1);return{remaining:geoRemain*scale,index:best};
  }

  getCurrentInstruction(){return this.translateStep(this.routeSteps[Math.min(this.currentStepIndex,this.routeSteps.length-1)])}
  translateStep(step){
    if(!step)return'استمر في الطريق';const m=step.maneuver||{},name=step.name?` إلى ${step.name}`:'';const mod=m.modifier||'';
    if(m.type==='arrive')return'ستصل إلى وجهتك';if(m.type==='depart')return`انطلق${name||' في الطريق'}`;if(m.type==='roundabout'||m.type==='rotary')return`ادخل الدوار${name}`;
    if(m.type==='merge')return`اندمج مع الطريق${name}`;if(m.type==='fork')return mod.includes('right')?`الزم اليمين${name}`:`الزم اليسار${name}`;
    if(m.type==='turn'||m.type==='end of road'){
      if(mod.includes('right'))return`انعطف يميناً${name}`;if(mod.includes('left'))return`انعطف يساراً${name}`;if(mod.includes('uturn'))return'قم بالدوران للخلف';return`استمر${name}`
    }
    if(mod.includes('right'))return`اتجه يميناً${name}`;if(mod.includes('left'))return`اتجه يساراً${name}`;return`استمر${name||' في الطريق'}`;
  }
  stepArrow(step){const m=step?.maneuver||{},mod=m.modifier||'';if(m.type==='arrive')return'🏁';if(m.type==='roundabout'||m.type==='rotary')return'⟳';if(mod.includes('uturn'))return'↶';if(mod.includes('slight right'))return'↗';if(mod.includes('sharp right')||mod==='right')return'↱';if(mod.includes('slight left'))return'↖';if(mod.includes('sharp left')||mod==='left')return'↰';return'↑'}

  checkNearbyHazards(){
    if(!this.currentPosition||!this.hazardsManager)return;const nearby=this.hazardsManager.checkNearbyHazards(this.currentPosition.lat,this.currentPosition.lng,260);
    nearby.forEach(({hazard,distanceMeters})=>{if(this.alertedHazards.has(hazard.id))return;this.alertedHazards.add(hazard.id);const names={camera:'كاميرا طريق',accident:'حادث',bump:'مطب',traffic:'ازدحام',checkpoint:'تنبيه طريق'};this.toast(`${names[hazard.type]||'تنبيه'} بعد نحو ${distanceMeters} م`);if(this.isNavigating)this.voiceAssistant.speak(`تنبيه، ${names[hazard.type]||'خطر على الطريق'} قريب.`,true)})
  }

  submitHazardReport(){
    if(!this.currentPosition){this.toast('لا يمكن التبليغ قبل تحديد موقعك');return}
    const details=document.getElementById('report-details').value.trim();this.hazardsManager.addReport({type:this.selectedHazardType,details,coords:[this.currentPosition.lat,this.currentPosition.lng]});document.getElementById('report-details').value='';this.toggleReportSheet(false);this.toast('تم حفظ التبليغ على هذا الجهاز. ربط التبليغات بين المستخدمين يحتاج قاعدة بيانات مشتركة.');
  }

  toggleMenu(show){document.getElementById('side-menu').classList.toggle('hidden',!show);document.getElementById('menu-backdrop').classList.toggle('hidden',!show);if(show)this.updateSavedCount()}
  toggleVehicleSheet(show){document.getElementById('vehicle-sheet').classList.toggle('hidden',!show);document.getElementById('vehicle-backdrop').classList.toggle('hidden',!show)}
  toggleReportSheet(show){document.getElementById('report-sheet').classList.toggle('hidden',!show);document.getElementById('report-backdrop').classList.toggle('hidden',!show)}
  updateSavedCount(){document.getElementById('saved-count').textContent=this.offlineManager.getSavedCount()}

  modeEmoji(mode){return({car:'🚗',taxi:'🚕',bicycle:'🚲',escooter:'🛴'})[mode]||'🚗'}
  formatDuration(seconds){const m=Math.max(1,Math.round((seconds||0)/60));return`${m} دقيقة`}
  formatDistance(meters){const m=meters||0;return m<1000?`${Math.round(m)} م`:`${(m/1000).toFixed(m<10000?1:0)} كم`}
  formatMeters(meters){return meters<1000?`${Math.max(10,Math.round(meters/10)*10)} م`:`${(meters/1000).toFixed(1)} كم`}
  shortenAddress(s){if(!s)return'';return s.split(',').slice(0,3).join('، ')}
  compactCoordinates(coords){if(!Array.isArray(coords)||coords.length<800)return coords;const every=Math.ceil(coords.length/700);const out=coords.filter((_,i)=>i%every===0);if(out[out.length-1]!==coords[coords.length-1])out.push(coords[coords.length-1]);return out}
  haversine(lat1,lon1,lat2,lon2){const R=6371000,toRad=x=>x*Math.PI/180,dLat=toRad(lat2-lat1),dLon=toRad(lon2-lon1);const a=Math.sin(dLat/2)**2+Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;return 2*R*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))}
  escapeHtml(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
  toast(msg){const el=document.getElementById('toast');el.textContent=msg;el.classList.remove('hidden');clearTimeout(this.toastTimer);this.toastTimer=setTimeout(()=>el.classList.add('hidden'),3600)}
}

document.addEventListener('DOMContentLoaded',()=>{window.WasilApp=new WasilAppV2();window.WasilApp.init()});
