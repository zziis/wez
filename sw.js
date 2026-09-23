const STATIC_CACHE='wasil-static-v2.2';
const MAP_CACHE='wasil-map-v2.2';
const STATIC_FILES=['./','./index.html','./manifest.json','./css/style.css','./css/responsive.css','./js/iraq-data.js','./js/voice-assistant.js','./js/hazards-manager.js','./js/offline-manager.js','./js/map-engine.js','./js/app.js','./assets/images/logo.jpg','./assets/images/splash.jpg'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(STATIC_CACHE).then(c=>c.addAll(STATIC_FILES)).catch(()=>{}));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>![STATIC_CACHE,MAP_CACHE].includes(k)).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener('fetch',e=>{
  const req=e.request;if(req.method!=='GET')return;const url=new URL(req.url);
  const isMapAsset=url.hostname==='tiles.openfreemap.org'||url.hostname.includes('server.arcgisonline.com')||url.hostname==='unpkg.com';
  if(isMapAsset){
    e.respondWith(caches.open(MAP_CACHE).then(async c=>{
      const hit=await c.match(req);
      try{
        const res=await fetch(req);
        if((res&&res.ok)||res.type==='opaque')c.put(req,res.clone());
        return res;
      }catch{return hit||Response.error()}
    }));
    return;
  }
  if(url.origin===location.origin){e.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(res=>{const copy=res.clone();caches.open(STATIC_CACHE).then(c=>c.put(req,copy));return res}).catch(()=>caches.match('./index.html'))))}
});
