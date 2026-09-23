/**
 * WASIL - المساعد الصوتي للاتجاهات بالذكاء الاصطناعي (بنت: نور / ولد: علي) ونظام النغمات التفاعلية
 */

class VoiceAssistant {
    constructor() {
        this.voicePersona = localStorage.getItem("wasil_voice_persona") || "female"; // 'female' (نور) or 'male' (علي)
        this.isMuted = localStorage.getItem("wasil_voice_muted") === "true";
        this.audioCtx = null;
        this.synth = window.speechSynthesis;
        this.voices = [];
        this.initAudioContext();
        this.initSpeech();
    }

    initAudioContext() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.audioCtx = new AudioContext();
            }
        } catch (e) {
            console.warn("AudioContext not supported", e);
        }
    }

    ensureAudioContext() {
        if (this.audioCtx && this.audioCtx.state === "suspended") {
            this.audioCtx.resume();
        }
    }

    initSpeech() {
        if (!this.synth) return;
        const loadVoices = () => {
            this.voices = this.synth.getVoices();
        };
        loadVoices();
        if (this.synth.onvoiceschanged !== undefined) {
            this.synth.onvoiceschanged = loadVoices;
        }
    }

    setPersona(persona) {
        this.voicePersona = persona; // 'female' or 'male'
        localStorage.setItem("wasil_voice_persona", persona);
        const name = persona === "female" ? "نور" : "علي";
        this.speak(`مرحباً بك، أنا ${name}، مساعدتك الذكية للاتجاهات على طرقات العراق.`);
    }

    getPersonaName() {
        return this.voicePersona === "female" ? "نور (صوت أنثوي)" : "علي (صوت ذكوري)";
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        localStorage.setItem("wasil_voice_muted", this.isMuted);
        if (!this.isMuted) {
            this.speak("تم تفعيل المساعد الصوتي.");
        }
        return this.isMuted;
    }

    speak(text, priority = false) {
        if (this.isMuted || !text) return;
        if (!this.synth) {
            console.log("[WASIL Voice Mock]:", text);
            return;
        }

        if (priority) {
            this.synth.cancel();
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "ar-SA"; // أو ar-IQ إن وجد
        utterance.rate = 1.0;

        // تعديل طبقة الصوت بحسب اختيار السائق (بنت أو ولد)
        if (this.voicePersona === "female") {
            utterance.pitch = 1.25; // صوت أنثوي رقيق وواضح
        } else {
            utterance.pitch = 0.85; // صوت ذكوري وقور وعميق
        }

        // محاولة اختيار صوت عربي ملائم
        const arabicVoices = this.voices.filter(v => v.lang.includes("ar"));
        if (arabicVoices.length > 0) {
            if (this.voicePersona === "female") {
                const femaleVoice = arabicVoices.find(v => v.name.toLowerCase().includes("female") || v.name.toLowerCase().includes("zira") || v.name.toLowerCase().includes("salma") || v.name.toLowerCase().includes("hoda"));
                utterance.voice = femaleVoice || arabicVoices[0];
            } else {
                const maleVoice = arabicVoices.find(v => v.name.toLowerCase().includes("male") || v.name.toLowerCase().includes("naayf") || v.name.toLowerCase().includes("shakir") || v.name.toLowerCase().includes("tariq"));
                utterance.voice = maleVoice || arabicVoices[0];
            }
        }

        this.synth.speak(utterance);
    }

    // --- نغمات التنبيه التفاعلية عبر Web Audio API ---

    playBeep(freq = 440, duration = 0.15, type = "sine", delay = 0) {
        if (this.isMuted || !this.audioCtx) return;
        this.ensureAudioContext();

        setTimeout(() => {
            try {
                const osc = this.audioCtx.createOscillator();
                const gain = this.audioCtx.createGain();
                osc.type = type;
                osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

                gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + duration);

                osc.connect(gain);
                gain.connect(this.audioCtx.destination);

                osc.start();
                osc.stop(this.audioCtx.currentTime + duration);
            } catch (e) {
                console.error("Beep error", e);
            }
        }, delay * 1000);
    }

    // تنبيه كاميرا رادار (نبضات سريعة مميزة)
    playRadarAlert() {
        this.playBeep(880, 0.1, "triangle", 0);
        this.playBeep(1100, 0.1, "triangle", 0.12);
        this.playBeep(1320, 0.18, "square", 0.24);
    }

    // تنبيه مفرزة أمنية / سيطرة
    playCheckpointAlert() {
        this.playBeep(520, 0.2, "sine", 0);
        this.playBeep(650, 0.25, "sine", 0.22);
    }

    // تنبيه مطب
    playBumpAlert() {
        this.playBeep(260, 0.2, "sawtooth", 0);
        this.playBeep(180, 0.3, "sine", 0.18);
    }

    // تنبيه تجاوز السرعة القانونية
    playSpeedWarning() {
        this.playBeep(950, 0.12, "square", 0);
        this.playBeep(950, 0.12, "square", 0.15);
        this.playBeep(950, 0.15, "square", 0.30);
    }

    // نغمة الوصول إلى الوجهة
    playArrivalSuccess() {
        this.playBeep(523.25, 0.2, "sine", 0);
        this.playBeep(659.25, 0.2, "sine", 0.2);
        this.playBeep(783.99, 0.35, "triangle", 0.4);
    }
}

window.VoiceAssistant = VoiceAssistant;
