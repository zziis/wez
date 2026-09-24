WASIL V2.9 — Merge from the user-provided map project

Integrated/adapted:
- destination/start/search pin assets from the provided source
- Waze-style search structure: top search field + quick shortcuts + bottom results sheet
- local instant suggestions while typing; online search only when user submits
- destination preview before calculating a route
- up to 3 route alternatives with selectable cards, ETA, distance, via-road and extra-time note
- route line hierarchy: dark casing + white border + cyan active line; gray alternatives
- route ETA badges on the map
- route header showing origin -> destination

Compatibility note:
The source project's native Android/Godot map engine (.pck/native code) cannot be dropped directly into WASIL's web/Leaflet runtime. The portable presentation assets and interaction/layout ideas were adapted, while WASIL keeps OpenFreeMap/Leaflet + OSRM/Nominatim for web compatibility.
