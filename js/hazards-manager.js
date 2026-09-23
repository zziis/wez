/**
 * WASIL - إدارة المخاطر والكاميرات والمفارز والحوادث والمطبات والازدحامات 2026
 */

class HazardsManager {
    constructor() {
        this.storageKey = "wasil_user_reported_hazards";
        this.networkHazards = [];
        this.hazards = [...this.loadUserReports()];
        this.activeFilters = {
            camera: true,
            checkpoint: true,
            accident: true,
            bump: true,
            traffic: true
        };
        this.listeners = [];
    }

    loadUserReports() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error("Failed to load user hazards", e);
            return [];
        }
    }

    saveUserReports(list) {
        const userOnly = list.filter(h => h.isUserReport);
        localStorage.setItem(this.storageKey, JSON.stringify(userOnly));
    }

    addReport(reportData) {
        const newHazard = {
            id: `usr-${Date.now()}`,
            type: reportData.type, // 'camera', 'checkpoint', 'accident', 'bump', 'traffic'
            title: reportData.title || this.getDefaultTitle(reportData.type),
            details: reportData.details || "تم التبليغ بواسطة سائق في شبكة وصل الآن",
            coords: reportData.coords,
            governorate: reportData.governorate || "baghdad",
            createdAt: new Date().toLocaleTimeString("ar-IQ", { hour: "2-digit", minute: "2-digit" }),
            isUserReport: true,
            speedLimit: reportData.speedLimit || null,
            waitTimeMinutes: reportData.waitTimeMinutes || null
        };

        this.hazards.unshift(newHazard);
        this.saveUserReports(this.hazards);
        this.notifyListeners();

        // إشعار صوتي فوري
        if (window.WasilApp && window.WasilApp.voiceAssistant) {
            window.WasilApp.voiceAssistant.speak(`شكراً لمشاركتك! تم حفظ التبليغ عن ${newHazard.title} على جهازك.`);
        }

        return newHazard;
    }


    setNetworkHazards(list) {
        this.networkHazards = Array.isArray(list) ? list : [];
        const userReports = this.loadUserReports();
        this.hazards = [...this.networkHazards, ...userReports];
        this.notifyListeners();
    }

    getDefaultTitle(type) {
        switch (type) {
            case "camera": return "كاميرا رادار ومراقبة جديدة";
            case "checkpoint": return "مفرزة أمنية وسيطرة مستحدثة";
            case "accident": return "حادث سير معرقل لحركة السير";
            case "bump": return "مطب اصطناعي أو حفرة خطرة";
            case "traffic": return "ازدحام مروري وتوقف بالسير";
            default: return "تنبيه طريق عام";
        }
    }

    getHazardIconHtml(hazard) {
        let iconSvg = "";
        let colorClass = "";

        switch (hazard.type) {
            case "camera":
                colorClass = "hazard-camera";
                iconSvg = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>`;
                break;
            case "checkpoint":
                colorClass = "hazard-checkpoint";
                iconSvg = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`;
                break;
            case "accident":
                colorClass = "hazard-accident";
                iconSvg = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
                break;
            case "bump":
                colorClass = "hazard-bump";
                iconSvg = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
                break;
            case "traffic":
                colorClass = "hazard-traffic";
                iconSvg = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 22 22 22 12 2"></polygon><line x1="12" y1="11" x2="12" y2="17"></line></svg>`;
                break;
        }

        return `<div class="custom-neon-marker ${colorClass}">
            <div class="marker-pulse"></div>
            <div class="marker-core">${iconSvg}</div>
        </div>`;
    }

    toggleFilter(type) {
        if (this.activeFilters[type] !== undefined) {
            this.activeFilters[type] = !this.activeFilters[type];
            this.notifyListeners();
        }
        return this.activeFilters[type];
    }

    getFilteredHazards() {
        return this.hazards.filter(h => this.activeFilters[h.type]);
    }

    // حساب المسافة بين نقطتين بالمتر
    getDistanceMeters(lat1, lon1, lat2, lon2) {
        const R = 6371e3; // نصف قطر الأرض بالمتر
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    checkNearbyHazards(currentLat, currentLng, radiusMeters = 350) {
        const nearby = [];
        this.hazards.forEach(hazard => {
            const dist = this.getDistanceMeters(currentLat, currentLng, hazard.coords[0], hazard.coords[1]);
            if (dist <= radiusMeters) {
                nearby.push({
                    hazard: hazard,
                    distanceMeters: Math.round(dist)
                });
            }
        });
        return nearby;
    }

    subscribe(listener) {
        this.listeners.push(listener);
    }

    notifyListeners() {
        this.listeners.forEach(fn => fn(this.hazards, this.activeFilters));
    }
}

window.HazardsManager = HazardsManager;
