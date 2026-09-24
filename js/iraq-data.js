/**
 * WASIL - بيانات خرائط العراق والمحافظات الـ 18 ومعالمها وشبكة الرادارات والمخاطر 2026
 */

const IRAQ_DATA = {
    appName: "وصل - خرائط العراق الذكية",
    version: "2026.9.24",
    center: [33.3152, 44.3661], // بغداد
    defaultZoom: 13,

    // محافظات العراق الـ 18
    governorates: [
        {
            id: "baghdad",
            name: "بغداد",
            nameEn: "Baghdad",
            center: [33.3152, 44.3661],
            zoom: 13,
            packageSize: "68 MB",
            sizeBytes: 71303168,
            status: "ready", // ready, downloaded, downloading
            landmarksCount: 145,
            camerasCount: 84,
            checkpointsCount: 38,
            description: "العاصمة - مركز العراق التجاري والثقافي والسياسي",
            keyPlaces: [
                { name: "ساحة التحرير وشارع السعدون", coords: [33.3275, 44.4089], type: "landmark" },
                { name: "شارع المنصور وساحة النسور", coords: [33.3121, 44.3546], type: "landmark" },
                { name: "شارع الكرادة داخل وساحة كهرمانة", coords: [33.3082, 44.4285], type: "landmark" },
                { name: "نصب الشهيد - شارع فلسطين", coords: [33.3429, 44.4441], type: "monument" },
                { name: "مطار بغداد الدولي", coords: [33.2625, 44.2344], type: "airport" },
                { name: "مول بغداد الحارثية", coords: [33.3168, 44.3639], type: "mall" },
                { name: "شارع 14 رمضان", coords: [33.3289, 44.3582], type: "avenue" },
                { name: "جامعة بغداد - الجادرية", coords: [33.2735, 44.3789], type: "university" }
            ]
        },
        {
            id: "basra",
            name: "البصرة",
            nameEn: "Basra",
            center: [30.5081, 47.7835],
            zoom: 13,
            packageSize: "56 MB",
            sizeBytes: 58720256,
            status: "ready",
            landmarksCount: 98,
            camerasCount: 46,
            checkpointsCount: 22,
            description: "ثغر العراق الباسم وعاصمة الاقتصاد والنفط والموانئ",
            keyPlaces: [
                { name: "كورنيش شط العرب", coords: [30.5186, 47.8441], type: "landmark" },
                { name: "بصرة تايمز سكوير", coords: [30.5239, 47.8188], type: "mall" },
                { name: "ميناء أم قصر", coords: [30.0401, 47.9312], type: "port" },
                { name: "مدينة البصرة الرياضية", coords: [30.4352, 47.7811], type: "stadium" }
            ]
        },
        {
            id: "erbil",
            name: "أربيل",
            nameEn: "Erbil",
            center: [36.1911, 44.0092],
            zoom: 13,
            packageSize: "52 MB",
            sizeBytes: 54525952,
            status: "ready",
            landmarksCount: 110,
            camerasCount: 52,
            checkpointsCount: 18,
            description: "عاصمة إقليم كوردستان العراق ومدينة القلعة التاريخية",
            keyPlaces: [
                { name: "قلعة أربيل وشارع البازار", coords: [36.1912, 44.0093], type: "landmark" },
                { name: "فاميلي مول أربيل", coords: [36.2081, 43.9854], type: "mall" },
                { name: "شارع 100 متري", coords: [36.1823, 44.0289], type: "highway" },
                { name: "مطار أربيل الدولي", coords: [36.2376, 43.9632], type: "airport" }
            ]
        },
        {
            id: "nineveh",
            name: "نينوى (الموصل)",
            nameEn: "Nineveh (Mosul)",
            center: [36.3489, 43.1378],
            zoom: 13,
            packageSize: "48 MB",
            sizeBytes: 50331648,
            status: "ready",
            landmarksCount: 88,
            camerasCount: 38,
            checkpointsCount: 25,
            description: "أم الربيعين ومهد الحضارة الآشورية العريقة",
            keyPlaces: [
                { name: "المنارة الحدباء والجامع النوري", coords: [36.3431, 43.1287], type: "landmark" },
                { name: "غابات الموصل وكورنيش دجلة", coords: [36.3752, 43.1422], type: "park" },
                { name: "جامعة الموصل", coords: [36.3812, 43.1498], type: "university" }
            ]
        },
        {
            id: "karbala",
            name: "كربلاء المقدسة",
            nameEn: "Karbala",
            center: [32.6160, 44.0249],
            zoom: 14,
            packageSize: "44 MB",
            sizeBytes: 46137344,
            status: "ready",
            landmarksCount: 82,
            camerasCount: 32,
            checkpointsCount: 20,
            description: "مدينة الإمام الحسين عليه السلام ووجهة ملايين الزائرين",
            keyPlaces: [
                { name: "منطقة بين الحرمين الشريفين", coords: [32.6164, 44.0324], type: "landmark" },
                { name: "شارع السدرة وشارع العباس", coords: [32.6201, 44.0315], type: "avenue" },
                { name: "بحيرة الرزازة", coords: [32.6841, 43.7892], type: "nature" }
            ]
        },
        {
            id: "najaf",
            name: "النجف الأشرف",
            nameEn: "Najaf",
            center: [32.0008, 44.3328],
            zoom: 13,
            packageSize: "42 MB",
            sizeBytes: 44040192,
            status: "ready",
            landmarksCount: 76,
            camerasCount: 28,
            checkpointsCount: 16,
            description: "حاضرة العلم والعلماء ومرقد الإمام علي عليه السلام",
            keyPlaces: [
                { name: "الصحن الحيدري الشريف", coords: [32.0003, 44.3142], type: "landmark" },
                { name: "طريق نجف - كوفة", coords: [32.0298, 44.3689], type: "avenue" },
                { name: "مطار النجف الدولي", coords: [31.9892, 44.4041], type: "airport" }
            ]
        },
        {
            id: "sulaymaniyah",
            name: "السليمانية",
            nameEn: "Sulaymaniyah",
            center: [35.5669, 45.4167],
            zoom: 13,
            packageSize: "46 MB",
            sizeBytes: 48234496,
            status: "ready",
            landmarksCount: 79,
            camerasCount: 34,
            checkpointsCount: 15,
            description: "عاصمة الثقافة والفن في كوردستان وجبال أزمر الخلابة",
            keyPlaces: [
                { name: "شارع سالم وحديقة آزادي", coords: [35.5612, 45.4211], type: "landmark" },
                { name: "جبل أزمر الترفيهي", coords: [35.6128, 45.4789], type: "nature" },
                { name: "ماجدي لاند السليمانية", coords: [35.5489, 45.3891], type: "mall" }
            ]
        },
        {
            id: "kirkuk",
            name: "كركوك",
            nameEn: "Kirkuk",
            center: [35.4681, 44.3922],
            zoom: 13,
            packageSize: "39 MB",
            sizeBytes: 40894464,
            status: "ready",
            landmarksCount: 65,
            camerasCount: 26,
            checkpointsCount: 17,
            description: "مدينة التآخي وقبة النفط التاريخية في وادي النفط",
            keyPlaces: [
                { name: "قلعة كركوك الأثرية", coords: [35.4712, 44.3941], type: "landmark" },
                { name: "شارع بغداد - كركوك", coords: [35.4411, 44.3689], type: "highway" }
            ]
        },
        {
            id: "babylon",
            name: "بابل (الحلة)",
            nameEn: "Babylon (Hillah)",
            center: [32.4847, 44.4311],
            zoom: 13,
            packageSize: "38 MB",
            sizeBytes: 39845888,
            status: "ready",
            landmarksCount: 70,
            camerasCount: 22,
            checkpointsCount: 14,
            description: "مهد الحدائق المعلقة ومسلة حمورابي وشريعة القوانين",
            keyPlaces: [
                { name: "مدينة بابل الأثرية والأسد البابلي", coords: [32.5422, 44.4221], type: "landmark" },
                { name: "شارع 60 والشارع العام الحلة", coords: [32.4789, 44.4298], type: "avenue" }
            ]
        },
        {
            id: "anbar",
            name: "الأنبار (الرمادي)",
            nameEn: "Anbar (Ramadi)",
            center: [33.4233, 43.2974],
            zoom: 12,
            packageSize: "45 MB",
            sizeBytes: 47185920,
            status: "ready",
            landmarksCount: 60,
            camerasCount: 24,
            checkpointsCount: 28,
            description: "أكبر محافظات العراق مساحة وكرم الفرات والأصالة",
            keyPlaces: [
                { name: "سد الرمادي وبحيرة الحبانية", coords: [33.3789, 43.5122], type: "nature" },
                { name: "شارع 100 والشارع العام بالرمادي", coords: [33.4289, 43.2912], type: "avenue" }
            ]
        },
        {
            id: "diyala",
            name: "ديالى (بعقوبة)",
            nameEn: "Diyala (Baqubah)",
            center: [33.7489, 44.6441],
            zoom: 13,
            packageSize: "36 MB",
            sizeBytes: 37748736,
            status: "ready",
            landmarksCount: 52,
            camerasCount: 19,
            checkpointsCount: 16,
            description: "مدينة البرتقال وبساتين النخيل وسد حمرين",
            keyPlaces: [
                { name: "كورنيش بعقوبة ونهر ديالى", coords: [33.7456, 44.6412], type: "landmark" }
            ]
        },
        {
            id: "dhiqar",
            name: "ذي قار (الناصرية)",
            nameEn: "Dhi Qar (Nasiriyah)",
            center: [31.0583, 46.2575],
            zoom: 13,
            packageSize: "37 MB",
            sizeBytes: 38797312,
            status: "ready",
            landmarksCount: 58,
            camerasCount: 20,
            checkpointsCount: 15,
            description: "أرض أور السومرية وزقورة أور وموطن أهوار الجبايش",
            keyPlaces: [
                { name: "زقورة أور الأثرية", coords: [30.9622, 46.1039], type: "landmark" },
                { name: "أهوار الجبايش السياحية", coords: [30.9521, 46.9982], type: "nature" }
            ]
        },
        {
            id: "maysan",
            name: "ميسان (العمارة)",
            nameEn: "Maysan (Amarah)",
            center: [31.8441, 47.1447],
            zoom: 13,
            packageSize: "34 MB",
            sizeBytes: 35651584,
            status: "ready",
            landmarksCount: 48,
            camerasCount: 16,
            checkpointsCount: 12,
            description: "عاصمة القصب والبردي وأهوار ميسان والشعر الشعبي",
            keyPlaces: [
                { name: "كورنيش العمارة وشارع التربية", coords: [31.8412, 47.1489], type: "landmark" }
            ]
        },
        {
            id: "wasit",
            name: "واسط (الكوت)",
            nameEn: "Wasit (Kut)",
            center: [32.5089, 45.8189],
            zoom: 13,
            packageSize: "33 MB",
            sizeBytes: 34603008,
            status: "ready",
            landmarksCount: 45,
            camerasCount: 15,
            checkpointsCount: 11,
            description: "مدينة سدة الكوت التاريخية وخيرات زراعة وادي الرافدين",
            keyPlaces: [
                { name: "سدة الكوت ونهر دجلة", coords: [32.5022, 45.8234], type: "landmark" }
            ]
        },
        {
            id: "qadisiyyah",
            name: "الديوانية (القادسية)",
            nameEn: "Al-Qadisiyyah",
            center: [31.9892, 44.9256],
            zoom: 13,
            packageSize: "32 MB",
            sizeBytes: 33554432,
            status: "ready",
            landmarksCount: 42,
            camerasCount: 14,
            checkpointsCount: 10,
            description: "مدينة العنبر الأصيل وموقع نفر الأثري",
            keyPlaces: [
                { name: "مدينة نفر الأثرية", coords: [32.1245, 45.2312], type: "landmark" }
            ]
        },
        {
            id: "muthanna",
            name: "المثنى (السماوة)",
            nameEn: "Muthanna (Samawah)",
            center: [31.3122, 45.2811],
            zoom: 13,
            packageSize: "31 MB",
            sizeBytes: 32505856,
            status: "ready",
            landmarksCount: 40,
            camerasCount: 12,
            checkpointsCount: 10,
            description: "مهد مدينة الوركاء وبحيرة ساوة الغامضة",
            keyPlaces: [
                { name: "بحيرة ساوة والوركاء", coords: [31.3129, 45.0089], type: "nature" }
            ]
        },
        {
            id: "salahaldin",
            name: "صلاح الدين (تكريت)",
            nameEn: "Salah al-Din",
            center: [34.6089, 43.6789],
            zoom: 12,
            packageSize: "39 MB",
            sizeBytes: 40894464,
            status: "ready",
            landmarksCount: 54,
            camerasCount: 22,
            checkpointsCount: 19,
            description: "ملوية سامراء العباسية التاريخية وقلعة تكريت",
            keyPlaces: [
                { name: "جامع الملوية في سامراء", coords: [34.2072, 43.8804], type: "landmark" }
            ]
        },
        {
            id: "duhok",
            name: "دهوك",
            nameEn: "Duhok",
            center: [36.8622, 42.9889],
            zoom: 13,
            packageSize: "35 MB",
            sizeBytes: 36700160,
            status: "ready",
            landmarksCount: 62,
            camerasCount: 24,
            checkpointsCount: 14,
            description: "عروس الجبال الشمالية وسد دهوك وشلالات زاويتة والعمادية",
            keyPlaces: [
                { name: "سد دهوك ووادي دهوك", coords: [36.8791, 43.0012], type: "nature" },
                { name: "مدينة العمادية المعلقة", coords: [37.0911, 43.4889], type: "landmark" }
            ]
        }
    ],

    // رادارات ومخاطر العراق 2026 (عينة حية في بغداد والمحاور الرئيسية)
    liveHazards: [
        // كاميرات مراقبة ورادار
        {
            id: "cam-1",
            type: "camera",
            title: "كاميرا رادار سرعة AI",
            details: "الحد الأقصى للسرعة 80 كم/ساعة - رصد الحزام والهاتف",
            coords: [33.3185, 44.3610], // المنصور - تقاطع دمشق
            speedLimit: 80,
            governorate: "baghdad",
            icon: "camera"
        },
        {
            id: "cam-2",
            type: "camera",
            title: "كاميرا رادار طريق المطار",
            details: "الحد الأقصى 100 كم/ساعة - تصوير ليلي متطور",
            coords: [33.2921, 44.3012],
            speedLimit: 100,
            governorate: "baghdad",
            icon: "camera"
        },
        {
            id: "cam-3",
            type: "camera",
            title: "كاميرا رادار سريع الدورة",
            details: "الحد الأقصى 100 كم/ساعة - كاميرا ذكية ذاتية الرصد",
            coords: [33.2689, 44.3912],
            speedLimit: 100,
            governorate: "baghdad",
            icon: "camera"
        },
        {
            id: "cam-4",
            type: "camera",
            title: "رادار شارع فلسطين - ساحة الموال",
            details: "الحد الأقصى 60 كم/ساعة - رصد الإشارة الضوئية",
            coords: [33.3512, 44.4289],
            speedLimit: 60,
            governorate: "baghdad",
            icon: "camera"
        },
        {
            id: "cam-5",
            type: "camera",
            title: "كاميرا رادار شارع 100 متري أربيل",
            details: "الحد الأقصى 80 كم/ساعة",
            coords: [36.1950, 44.0210],
            speedLimit: 80,
            governorate: "erbil",
            icon: "camera"
        },
        {
            id: "cam-6",
            type: "camera",
            title: "رادار طريق الكورنيش البصرة",
            details: "الحد الأقصى 60 كم/ساعة",
            coords: [30.5120, 47.8390],
            speedLimit: 60,
            governorate: "basra",
            icon: "camera"
        },

        // مفارز وسيطرات أمنية
        {
            id: "chk-1",
            type: "checkpoint",
            title: "سيطرة أمنية - مدخل الجادرية",
            details: "مفرزة تفتيش وتدقيق أمني - حركة المرور سالكة ببطء (وقت الانتظار 3 دقائق)",
            coords: [33.2842, 44.3721],
            waitTimeMinutes: 3,
            governorate: "baghdad",
            icon: "shield"
        },
        {
            id: "chk-2",
            type: "checkpoint",
            title: "مفرزة مرورية - ساحة النسور",
            details: "فحص أوراق المركبات والإجازات ورصد التظليل",
            coords: [33.3089, 44.3512],
            waitTimeMinutes: 1,
            governorate: "baghdad",
            icon: "shield"
        },
        {
            id: "chk-3",
            type: "checkpoint",
            title: "سيطرة الصقور - مدخل بغداد الأنبار",
            details: "سيطرة رئيسية - تدقيق الهويات والتفتيش السريع",
            coords: [33.3211, 44.0891],
            waitTimeMinutes: 6,
            governorate: "baghdad",
            icon: "shield"
        },

        // حوادث سير
        {
            id: "acc-1",
            type: "accident",
            title: "حادث سير - جسر السنك",
            details: "اصطدام مركبتين في المسار الأيمن - يرجى الالتزام بالمسار الأيسر",
            coords: [33.3325, 44.4011],
            governorate: "baghdad",
            severity: "medium",
            icon: "car-crash"
        },

        // مطبات وحفر
        {
            id: "bmp-1",
            type: "bump",
            title: "مطب سرعة اصطناعي عالي",
            details: "أمام مجمع المدارس - خفف السرعة إلى 20 كم/س",
            coords: [33.3241, 44.3645], // المنصور
            recommendedSpeed: 20,
            governorate: "baghdad",
            icon: "alert-triangle"
        },
        {
            id: "bmp-2",
            type: "bump",
            title: "سلسلة مطبات شوارع الكرادة",
            details: "مطبات متتالية قرب تقاطع المسبح",
            coords: [33.3015, 44.4312],
            recommendedSpeed: 25,
            governorate: "baghdad",
            icon: "alert-triangle"
        },

        // ازدحامات مرورية
        {
            id: "trf-1",
            type: "traffic",
            title: "ازدحام خانق - ساحة كهرمانة",
            details: "تكدس مروري بسبب أعمال صيانة - ينصح بسلوك طريق الكرادة خارج",
            coords: [33.3142, 44.4215],
            delayMinutes: 14,
            governorate: "baghdad",
            icon: "traffic-cone"
        },
        {
            id: "trf-2",
            type: "traffic",
            title: "ازدحام جسر الجمهورية باتجاه الكرخ",
            details: "حركة بطيئة جداً - السرعة المتوسطة 12 كم/س",
            coords: [33.3298, 44.4082],
            delayMinutes: 10,
            governorate: "baghdad",
            icon: "traffic-cone"
        }
    ],


    baghdadDistricts: [
        { name: "حميدية", coords: [33.3908, 44.5345], priority: true },
        { name: "حي طارق", coords: [33.3815, 44.5488], priority: true },
        { name: "الشعب", coords: [33.3952, 44.4976], priority: true },
        { name: "سبع قصور", coords: [33.3878, 44.5178], priority: true },
        { name: "مدينة الصدر", coords: [33.3591, 44.5005], priority: false },
        { name: "جميلة", coords: [33.3711, 44.5284], priority: false },
        { name: "بغداد الجديدة", coords: [33.3099, 44.4701], priority: false },
        { name: "الأمين", coords: [33.3198, 44.5095], priority: false },
        { name: "الرشاد", coords: [33.3205, 44.5667], priority: false },
        { name: "البلديات", coords: [33.3362, 44.5338], priority: false },
        { name: "الكمالية", coords: [33.3055, 44.5792], priority: false },
        { name: "حي أور", coords: [33.4020, 44.4650], priority: false },
        { name: "الطالبية", coords: [33.3780, 44.4710], priority: false },
        { name: "حي البنوك", coords: [33.4070, 44.4490], priority: false },
        { name: "القاهرة", coords: [33.3860, 44.4370], priority: false },
        { name: "الحبيبية", coords: [33.3490, 44.5250], priority: false },
        { name: "العبيدي", coords: [33.3290, 44.5750], priority: false },
        { name: "المعامل", coords: [33.3140, 44.6190], priority: false },
        { name: "الحسينية", coords: [33.4440, 44.5520], priority: false },
        { name: "زيونة", coords: [33.3230, 44.4650], priority: false },
        { name: "الغدير", coords: [33.2970, 44.4760], priority: false },
        { name: "الكرادة", coords: [33.3020, 44.4290], priority: false },
        { name: "الجادرية", coords: [33.2760, 44.3810], priority: false },
        { name: "الدورة", coords: [33.2470, 44.3920], priority: false },
        { name: "المنصور", coords: [33.3150, 44.3600], priority: false },
        { name: "العامرية", coords: [33.2980, 44.2980], priority: false },
        { name: "الغزالية", coords: [33.3370, 44.2880], priority: false },
        { name: "الشعلة", coords: [33.3900, 44.3190], priority: false }
    ],

    trafficSegments: [
        {
            id: "bagh-trf-1",
            title: "ازدحام عالي - شارع صفي الدين الحلي",
            severity: "heavy",
            coords: [[33.3679,44.4868],[33.3698,44.4979],[33.3728,44.5088],[33.3768,44.5194]]
        },
        {
            id: "bagh-trf-2",
            title: "ازدحام خفيف - مداخل سبع قصور",
            severity: "light",
            coords: [[33.3820,44.5188],[33.3852,44.5232],[33.3889,44.5284]]
        },
        {
            id: "bagh-trf-3",
            title: "ازدحام عالي - حي طارق باتجاه الرشاد",
            severity: "heavy",
            coords: [[33.3768,44.5447],[33.3809,44.5538],[33.3850,44.5637]]
        },
        {
            id: "bagh-trf-4",
            title: "ازدحام خفيف - حميدية",
            severity: "light",
            coords: [[33.3896,44.5299],[33.3938,44.5365],[33.3976,44.5417]]
        }
    ],

    // مسارات تجريبية واقعية للمحاكاة والملاحة الحية
    demoRoutes: {
        mansour_to_jadiriya: {
            name: "من المنصور إلى جامعة بغداد (الجادرية)",
            governorate: "baghdad",
            totalDistanceKm: 6.8,
            estimatedTimeMin: 12,
            waypoints: [
                { lat: 33.3168, lng: 44.3639, instruction: "انطلق جنوباً من مول الحارثية عبر شارع دمشق", speed: 45, distanceNext: 600 },
                { lat: 33.3121, lng: 44.3546, instruction: "انعطف يساراً عند ساحة النسور باتجاه نفق الشرطة", speed: 50, distanceNext: 800 },
                { lat: 33.3050, lng: 44.3580, instruction: "الزم المسار الأوسط، انتبه لكاميرا رادار بعد 300 متر (80 كم/س)", speed: 65, distanceNext: 1100, hazardId: "cam-1" },
                { lat: 33.2950, lng: 44.3640, instruction: "استمر باتجاه تقاطع أم الطبول، مفرزة مرورية محتملة", speed: 60, distanceNext: 950 },
                { lat: 33.2870, lng: 44.3695, instruction: "انعطف يميناً باتجاه جسر الجادرية المعلق", speed: 70, distanceNext: 1200 },
                { lat: 33.2842, lng: 44.3721, instruction: "احذر! سيطرة أمنية مدخل الجادرية، خفف السرعة", speed: 30, distanceNext: 600, hazardId: "chk-1" },
                { lat: 33.2790, lng: 44.3750, instruction: "ادخل طريق جامعة بغداد الرئيسي، مطب تخفيف سرعة", speed: 35, distanceNext: 750, hazardId: "bmp-1" },
                { lat: 33.2735, lng: 44.3789, instruction: "وصلت إلى وجهتك: جامعة بغداد - الجادرية! حمداً لله على السلامة", speed: 0, distanceNext: 0 }
            ]
        },
        tahrir_to_karrada: {
            name: "من ساحة التحرير إلى ساحة كهرمانة والكرادة",
            governorate: "baghdad",
            totalDistanceKm: 4.2,
            estimatedTimeMin: 9,
            waypoints: [
                { lat: 33.3275, lng: 44.4089, instruction: "انطلق من ساحة التحرير باتجاه شارع السعدون", speed: 40, distanceNext: 700 },
                { lat: 33.3210, lng: 44.4140, instruction: "استمر إلى ساحة الفردوس، الزم المسار الأيمن", speed: 50, distanceNext: 900 },
                { lat: 33.3142, lng: 44.4215, instruction: "تنبيه: ازدحام خانق عند ساحة كهرمانة، وقت التأخير 14 دقيقة", speed: 20, distanceNext: 800, hazardId: "trf-1" },
                { lat: 33.3082, lng: 44.4285, instruction: "انعطف يميناً إلى شارع الكرادة داخل، مطبات متتالية", speed: 30, distanceNext: 600, hazardId: "bmp-2" },
                { lat: 33.3030, lng: 44.4330, instruction: "وصلت إلى شارع الكرادة - مجمع الهواتف والمطاعم", speed: 0, distanceNext: 0 }
            ]
        },
        basra_corniche: {
            name: "جولة كورنيش شط العرب - البصرة",
            governorate: "basra",
            totalDistanceKm: 5.5,
            estimatedTimeMin: 10,
            waypoints: [
                { lat: 30.5081, lng: 47.7835, instruction: "انطلق من مركز البصرة نحو شط العرب", speed: 50, distanceNext: 1200 },
                { lat: 30.5120, lng: 47.8390, instruction: "رادار سرعة الكورنيش (السرعة 60 كم/س)", speed: 55, distanceNext: 1500, hazardId: "cam-6" },
                { lat: 30.5186, lng: 47.8441, instruction: "استمتع بمشاهدة شط العرب وقوارب العشار", speed: 40, distanceNext: 1000 },
                { lat: 30.5239, lng: 47.8188, instruction: "وصلت إلى بصرة تايمز سكوير", speed: 0, distanceNext: 0 }
            ]
        },
        erbil_citadel_tour: {
            name: "من قلعة أربيل إلى شارع 100 متري",
            governorate: "erbil",
            totalDistanceKm: 5.1,
            estimatedTimeMin: 8,
            waypoints: [
                { lat: 36.1912, lng: 44.0093, instruction: "انطلق من محيط قلعة أربيل التاريخية", speed: 35, distanceNext: 800 },
                { lat: 36.1950, lng: 44.0210, instruction: "انتبه: كاميرا رادار شارع 100 متري (80 كم/س)", speed: 70, distanceNext: 2000, hazardId: "cam-5" },
                { lat: 36.2081, lng: 43.9854, instruction: "وصلت إلى فاميلي مول أربيل", speed: 0, distanceNext: 0 }
            ]
        }
    }
};

window.IRAQ_DATA = IRAQ_DATA;
