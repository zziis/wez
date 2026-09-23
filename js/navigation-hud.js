/**
 * WASIL - واجهة الملاحة والـ HUD ومحاكي القيادة بالذكاء الاصطناعي
 */

class NavigationHUD {
    constructor() {
        this.isNavigating = false;
        this.currentRoute = null;
        this.currentStepIndex = 0;
        this.simInterval = null;
        this.simSpeedFactor = 1.0;
        this.currentSpeed = 0;
        this.currentHeading = 0;
        this.totalDistanceKm = 0;
        this.traveledDistanceKm = 0;
        this.triggeredHazards = new Set();
        this.listeners = [];
    }

    startNavigation(routeData) {
        if (!routeData || !routeData.waypoints || routeData.waypoints.length < 2) return;

        this.isNavigating = true;
        this.currentRoute = routeData;
        this.currentStepIndex = 0;
        this.totalDistanceKm = routeData.totalDistanceKm || 5.0;
        this.traveledDistanceKm = 0;
        this.triggeredHazards.clear();

        // إشعار صوتي أولي
        const firstStep = routeData.waypoints[0];
        if (window.WasilApp && window.WasilApp.voiceAssistant) {
            window.WasilApp.voiceAssistant.speak(`بدأت الملاحة نحو ${routeData.name}. ${firstStep.instruction}`, true);
        }

        // تشغيل عداد التكسي إذا كان النمط تكسي
        if (window.WasilApp && window.WasilApp.vehicleManager) {
            window.WasilApp.vehicleManager.startTaxiMeter();
        }

        this.notifyListeners({
            isNavigating: true,
            step: firstStep,
            stepIndex: 0,
            totalSteps: routeData.waypoints.length,
            speed: 0,
            remainingKm: this.totalDistanceKm,
            remainingMin: routeData.estimatedTimeMin
        });

        this.runSimulation();
    }

    runSimulation() {
        if (this.simInterval) clearInterval(this.simInterval);

        const waypoints = this.currentRoute.waypoints;
        let subIndex = 0;
        const subStepsCount = 20; // 20 نقطة فرعية بين كل مرحلتين لحركة ناعمة جداً

        this.simInterval = setInterval(() => {
            if (!this.isNavigating) {
                clearInterval(this.simInterval);
                return;
            }

            if (this.currentStepIndex >= waypoints.length - 1) {
                this.completeNavigation();
                return;
            }

            const currentWp = waypoints[this.currentStepIndex];
            const nextWp = waypoints[this.currentStepIndex + 1];

            // استيفاء خطي سلس بين النقطتين
            const lat = currentWp.lat + (nextWp.lat - currentWp.lat) * (subIndex / subStepsCount);
            const lng = currentWp.lng + (nextWp.lng - currentWp.lng) * (subIndex / subStepsCount);

            // حساب زاوية الاتجاه
            this.currentHeading = this.calculateBearing(currentWp.lat, currentWp.lng, nextWp.lat, nextWp.lng);

            // حساب السرعة الحالية
            const targetSpeed = nextWp.speed || 50;
            this.currentSpeed = Math.round(targetSpeed + (Math.sin(subIndex) * 4));

            // تحديث المسافة
            const stepKm = (this.totalDistanceKm / waypoints.length);
            this.traveledDistanceKm = (this.currentStepIndex * stepKm) + (stepKm * (subIndex / subStepsCount));
            const remainingKm = Math.max(0, (this.totalDistanceKm - this.traveledDistanceKm)).toFixed(1);
            const remainingMin = Math.max(1, Math.round((remainingKm / (this.currentSpeed || 40)) * 60));

            // تحديث موقع المركبة على الخريطة
            const vehicleIcon = window.WasilApp ? window.WasilApp.vehicleManager.getModeInfo().icon : "🚗";
            window.WasilApp.mapEngine.createOrUpdateVehicleMarker(lat, lng, this.currentHeading, vehicleIcon);

            // تحديث عداد التكسي
            if (window.WasilApp && window.WasilApp.vehicleManager) {
                window.WasilApp.vehicleManager.updateTaxiDistance(this.traveledDistanceKm);
            }

            // فحص المخاطر القريبة وتنبيه السائق صوتياً
            this.checkAndAlertProximity(lat, lng);

            subIndex++;
            if (subIndex >= subStepsCount) {
                subIndex = 0;
                this.currentStepIndex++;
                this.onReachWaypoint(this.currentStepIndex);
            }

            this.notifyListeners({
                isNavigating: true,
                currentCoords: [lat, lng],
                step: waypoints[this.currentStepIndex] || currentWp,
                stepIndex: this.currentStepIndex,
                totalSteps: waypoints.length,
                speed: this.currentSpeed,
                heading: this.currentHeading,
                remainingKm: remainingKm,
                remainingMin: remainingMin
            });

        }, 400);
    }

    onReachWaypoint(index) {
        const waypoints = this.currentRoute.waypoints;
        if (index < waypoints.length) {
            const wp = waypoints[index];
            if (window.WasilApp && window.WasilApp.voiceAssistant) {
                window.WasilApp.voiceAssistant.speak(wp.instruction);
            }
        }
    }

    checkAndAlertProximity(lat, lng) {
        if (!window.WasilApp || !window.WasilApp.hazardsManager) return;
        const nearby = window.WasilApp.hazardsManager.checkNearbyHazards(lat, lng, 400);

        nearby.forEach(item => {
            const hazard = item.hazard;
            if (!this.triggeredHazards.has(hazard.id)) {
                this.triggeredHazards.add(hazard.id);
                this.triggerHazardVoiceAlert(hazard, item.distanceMeters);
            }
        });
    }

    triggerHazardVoiceAlert(hazard, distanceMeters) {
        const va = window.WasilApp.voiceAssistant;
        if (!va) return;

        switch (hazard.type) {
            case "camera":
                va.playRadarAlert();
                va.speak(`انتبه! أمامك كاميرا رادار سرعة بعد ${distanceMeters} متر، السرعة المحددة ${hazard.speedLimit || 80} كم/ساعة.`);
                break;
            case "checkpoint":
                va.playCheckpointAlert();
                va.speak(`تنبيه: مفرزة أمنية وسيطرة تفتيش أمامك بعد ${distanceMeters} متر، يرجى تخفيف السرعة.`);
                break;
            case "bump":
                va.playBumpAlert();
                va.speak(`احذر! مطب اصطناعي أمامك بعد ${distanceMeters} متر، خفف السرعة.`);
                break;
            case "accident":
                va.playRadarAlert();
                va.speak(`تنبيه حذر: حادث سير مروري في المسار بعد ${distanceMeters} متر.`);
                break;
            case "traffic":
                va.speak(`ازدحام مروري وتكدس أمامك بعد ${distanceMeters} متر، ينصح بتخفيف السرعة واليقظة.`);
                break;
        }
    }

    calculateBearing(lat1, lon1, lat2, lon2) {
        const y = Math.sin((lon2 - lon1) * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180);
        const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
                  Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos((lon2 - lon1) * Math.PI / 180);
        const θ = Math.atan2(y, x);
        const brng = (θ * 180 / Math.PI + 360) % 360;
        return Math.round(brng);
    }

    completeNavigation() {
        this.isNavigating = false;
        if (this.simInterval) clearInterval(this.simInterval);

        if (window.WasilApp && window.WasilApp.voiceAssistant) {
            window.WasilApp.voiceAssistant.playArrivalSuccess();
            window.WasilApp.voiceAssistant.speak("وصلت إلى وجهتك بحمد الله وسلامته! تطبيق وصل يتمنى لك يوماً سعيداً.");
        }

        if (window.WasilApp && window.WasilApp.vehicleManager) {
            window.WasilApp.vehicleManager.stopTaxiMeter();
        }

        this.notifyListeners({
            isNavigating: false,
            completed: true,
            remainingKm: 0,
            remainingMin: 0,
            speed: 0
        });
    }

    stopNavigation() {
        this.isNavigating = false;
        if (this.simInterval) clearInterval(this.simInterval);

        if (window.WasilApp) {
            if (window.WasilApp.vehicleManager) {
                window.WasilApp.vehicleManager.stopTaxiMeter();
            }
            if (window.WasilApp.mapEngine) {
                window.WasilApp.mapEngine.removeVehicleMarker();
            }
        }

        this.notifyListeners({
            isNavigating: false,
            cancelled: true,
            speed: 0
        });
    }

    subscribe(listener) {
        this.listeners.push(listener);
    }

    notifyListeners(data) {
        this.listeners.forEach(fn => fn(data));
    }
}

window.NavigationHUD = NavigationHUD;
