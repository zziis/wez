class OfflineManager {
  constructor(){
    this.savedPlacesKey='wasil_saved_places_v2';
    this.savedTripsKey='wasil_saved_trips_v2';
    this.savedPlaces=this._load(this.savedPlacesKey,[]);
    this.savedTrips=this._load(this.savedTripsKey,[]);
    this.listeners=[];
    this.online=navigator.onLine;
    window.addEventListener('online',()=>this._setOnline(true));
    window.addEventListener('offline',()=>this._setOnline(false));
  }
  _load(key,fallback){try{return JSON.parse(localStorage.getItem(key))||fallback}catch{return fallback}}
  _save(key,value){localStorage.setItem(key,JSON.stringify(value))}
  _setOnline(value){this.online=value;this.listeners.forEach(fn=>fn(value))}
  isOnline(){return this.online}
  subscribe(fn){this.listeners.push(fn);fn(this.online)}
  savePlace(place){
    const normalized={id:place.id||`place-${Date.now()}`,name:place.name||'مكان محفوظ',address:place.address||'',lat:+place.lat,lng:+place.lng,savedAt:Date.now()};
    this.savedPlaces=this.savedPlaces.filter(p=>Math.abs(p.lat-normalized.lat)>.00001||Math.abs(p.lng-normalized.lng)>.00001);
    this.savedPlaces.unshift(normalized);this.savedPlaces=this.savedPlaces.slice(0,60);this._save(this.savedPlacesKey,this.savedPlaces);return normalized;
  }
  saveTrip(trip){
    const data={...trip,id:trip.id||`trip-${Date.now()}`,savedAt:Date.now()};
    this.savedTrips=this.savedTrips.filter(t=>t.destination && (Math.abs(t.destination.lat-data.destination.lat)>.00001||Math.abs(t.destination.lng-data.destination.lng)>.00001));
    this.savedTrips.unshift(data);this.savedTrips=this.savedTrips.slice(0,10);this._save(this.savedTripsKey,this.savedTrips);return data;
  }
  getSavedPlaces(){return [...this.savedPlaces]}
  getSavedTrips(){return [...this.savedTrips]}
  getSavedCount(){return this.savedPlaces.length+this.savedTrips.length}
  findSavedTrip(destination){
    if(!destination)return null;
    return this.savedTrips.find(t=>t.destination && Math.abs(t.destination.lat-destination.lat)<.0008 && Math.abs(t.destination.lng-destination.lng)<.0008) || null;
  }
  deletePlace(id){this.savedPlaces=this.savedPlaces.filter(p=>p.id!==id);this._save(this.savedPlacesKey,this.savedPlaces)}
  deleteTrip(id){this.savedTrips=this.savedTrips.filter(p=>p.id!==id);this._save(this.savedTripsKey,this.savedTrips)}
  async registerServiceWorker(){
    if('serviceWorker' in navigator && location.protocol!=='file:'){
      try{await navigator.serviceWorker.register('./sw.js')}catch(e){console.warn('SW registration failed',e)}
    }
  }
}
window.OfflineManager=OfflineManager;
