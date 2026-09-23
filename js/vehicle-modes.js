/**
 * WASIL - وسائط التنقل الـ 3 (دراجة هوائية، دراجة كهربائية، سيارة: خصوصي / تكسي)
 */

class VehicleModeManager {
    constructor() {
        this.currentMode = "car"; // 'bicycle', 'escooter', 'car'
        this.carSubtype = "private"; // 'private', 'taxi'
        
        // إعدادات عداد التكسي بالدينار العراقي (IQD)
        this.taxiMeter = {
            baseFare: 2000,      // فتح العداد بالدينار
            perKmRate: 750,      // سعر الكيلومتر
            perMinuteWait: 250,  // سعر دقيقة الانتظار
            active: false,
            currentFare: 2000,
            elapsedSeconds: 0,
            distanceTraveledKm: 0,
            timer: null
        };

        this.listeners = [];
    }

    setMode(mode, subtype = "private") {
        this.currentMode = mode;
        if (mode === "car") {
            this.carSubtype = subtype;
        }
        this.notifyListeners();
        
        if (window.WasilApp && window.WasilApp.voiceAssistant) {
            let label = "";
            if (mode === "bicycle") label = "تم اختيار نمط الدراجة الهوائية. تم تفعيل حساب السعرات الحرارية والمسارات الآمنة.";
            else if (mode === "escooter") label = "تم اختيار نمط الدراجة الكهربائية. تم تفعيل مؤشر طاقة البطارية ومحطات الشحن.";
            else if (subtype === "taxi") label = "تم اختيار نمط سيارة الأجرة (تكسي). تم تجهيز عداد الأجرة ومسارات تجنب السيطرات.";
            else label = "تم اختيار نمط السيارة الخصوصي. تم تفعيل كاشف الرادار وتنبيهات السرعة القصوى.";
            window.WasilApp.voiceAssistant.speak(label);
        }
    }

    getModeInfo() {
        switch (this.currentMode) {
            case "bicycle":
                return {
                    id: "bicycle",
                    title: "دراجة هوائية",
                    icon: "🚲",
                    avgSpeedKmH: 18,
                    maxSpeedKmH: 25,
                    allowHighways: false,
                    speedCameraAlert: false,
                    features: ["حساب حرق السعرات الحرارية", "تجنب الجسور السريعة والأنفاق", "مسارات آمنة خالية من السيارات"],
                    calorieBurnPerKm: 32 // سعرة حرارية لكل كيلومتر
                };
            case "escooter":
                return {
                    id: "escooter",
                    title: "دراجة كهربائية / سكوتر",
                    icon: "⚡",
                    avgSpeedKmH: 30,
                    maxSpeedKmH: 45,
                    allowHighways: false,
                    speedCameraAlert: true,
                    features: ["مؤشر استهلاك البطارية الذكي", "عرض نقاط ومحطات الشحن", "تفضيل الشوارع المعبدة الخالية من الحفر"],
                    batteryDrainPerKm: 2.4 // نسبة مئوية لكل كيلومتر
                };
            case "car":
            default:
                if (this.carSubtype === "taxi") {
                    return {
                        id: "car_taxi",
                        mainMode: "car",
                        subMode: "taxi",
                        title: "سيارة أجرة (تكسي)",
                        icon: "🚕",
                        avgSpeedKmH: 55,
                        maxSpeedKmH: 100,
                        allowHighways: true,
                        speedCameraAlert: true,
                        features: ["عداد الأجرة المباشر (دينار عراقي IQD)", "تجنب السيطرات المزدحمة لتوفير الوقود", "مسار ذكي لزيادة كفاءة الرحلة"]
                    };
                }
                return {
                    id: "car_private",
                    mainMode: "car",
                    subMode: "private",
                    title: "سيارة خصوصي",
                    icon: "🚗",
                    avgSpeedKmH: 65,
                    maxSpeedKmH: 120,
                    allowHighways: true,
                    speedCameraAlert: true,
                    features: ["كاشف كاميرات رادار المرور 2026", "تنبيهات السرعة الزائدة الفورية", "أسرع الطرق السريعة والمجسرات"]
                };
        }
    }

    calculateTripStats(distanceKm, durationMin) {
        const info = this.getModeInfo();
        const stats = {
            distanceKm: distanceKm,
            durationMin: durationMin,
            modeInfo: info
        };

        if (this.currentMode === "bicycle") {
            stats.calories = Math.round(distanceKm * info.calorieBurnPerKm);
            stats.carbonSavedKg = (distanceKm * 0.15).toFixed(1);
        } else if (this.currentMode === "escooter") {
            stats.batteryEstimate = Math.min(100, Math.round(distanceKm * info.batteryDrainPerKm));
            stats.estimatedChargingCost = `${Math.round(distanceKm * 50)} د.ع`;
        } else if (this.carSubtype === "taxi") {
            const calculatedFare = this.taxiMeter.baseFare + Math.round(distanceKm * this.taxiMeter.perKmRate);
            stats.estimatedFare = `${calculatedFare.toLocaleString()} د.ع`;
        } else {
            stats.fuelEstimatedLiters = (distanceKm * 0.09).toFixed(1);
            stats.radarsOnPath = 2;
        }

        return stats;
    }

    startTaxiMeter() {
        if (this.carSubtype !== "taxi") return;
        this.taxiMeter.active = true;
        this.taxiMeter.currentFare = this.taxiMeter.baseFare;
        this.taxiMeter.elapsedSeconds = 0;
        this.taxiMeter.distanceTraveledKm = 0;

        if (this.taxiMeter.timer) clearInterval(this.taxiMeter.timer);
        this.taxiMeter.timer = setInterval(() => {
            if (!this.taxiMeter.active) return;
            this.taxiMeter.elapsedSeconds += 1;
            // احتساب كل دقيقة انتظار
            if (this.taxiMeter.elapsedSeconds % 60 === 0) {
                this.taxiMeter.currentFare += this.taxiMeter.perMinuteWait;
                this.notifyListeners();
            }
        }, 1000);
        this.notifyListeners();
    }

    updateTaxiDistance(newKm) {
        if (!this.taxiMeter.active) return;
        const delta = newKm - this.taxiMeter.distanceTraveledKm;
        if (delta > 0) {
            this.taxiMeter.distanceTraveledKm = newKm;
            this.taxiMeter.currentFare += Math.round(delta * this.taxiMeter.perKmRate);
            this.notifyListeners();
        }
    }

    stopTaxiMeter() {
        this.taxiMeter.active = false;
        if (this.taxiMeter.timer) {
            clearInterval(this.taxiMeter.timer);
            this.taxiMeter.timer = null;
        }
        this.notifyListeners();
    }

    subscribe(listener) {
        this.listeners.push(listener);
    }

    notifyListeners() {
        this.listeners.forEach(fn => fn({
            mode: this.currentMode,
            subtype: this.carSubtype,
            info: this.getModeInfo(),
            taxiMeter: this.taxiMeter
        }));
    }
}

window.VehicleModeManager = VehicleModeManager;
