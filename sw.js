const VERSION='2.6.0';
const STATIC_CACHE=`wasil-static-${VERSION}`;
const MAP_CACHE=`wasil-map-${VERSION}`;
const STATIC_FILES=[
  './','./index.html','./manifest.json?v=2.6.0',
  './css/style.css?v=2.6.0','./css/responsive.css?v=2.6.0',
  './js/iraq-data.js?v=2.6.0','./js/voice-assistant.js?v=2.6.0',
  './js/hazards-manager.js?v=2.6.0','./js/offline-manager.js?v=2.6.0',
  './js/map-engine.js?v=2.6.0','./js/app.js?v=2.6.0',
  './assets/images/logo.jpg?v=2.6.0','./assets/images/splash.jpg'
];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(STATIC_CACHE).then(c=>c.addAll(STATIC_FILES)).catch(()=>{}));
  self.skipWaiting();
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('wasil-')&&!([STATIC_CACHE,MAP_CACHE].includes(k))).map(k=>caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET') return;
  const url=new URL(req.url);
  const isMapAsset=url.hostname==='tiles.openfreemap.org'||url.hostname.includes('server.arcgisonline.com')||url.hostname==='unpkg.com';
  if(isMapAsset){
    e.respondWith(caches.open(MAP_CACHE).then(async c=>{
      try{
        const res=await fetch(req);
        if((res&&res.ok)||res.type==='opaque') c.put(req,res.clone());
        return res;
      }catch{
        return (await c.match(req))||Response.error();
      }
    }));
    return;
  }
  if(url.origin===location.origin){
    // Always prefer the newest deployed HTML/JS/CSS. Cache is only the offline fallback.
    e.respondWith((async()=>{
      const c=await caches.open(STATIC_CACHE);
      try{
        const res=await fetch(req,{cache:'no-store'});
        if(res&&res.ok) c.put(req,res.clone());
        return res;
      }catch{
        return (await c.match(req)) || (req.mode==='navigate' ? await c.match('./index.html') : Response.error());
      }
    })());
  }
});
