document.addEventListener('deviceready', onDeviceReady, false);

// إعدادات Firebase الخاصة بمشروعك (Nospam-9a4af) في اليابان
const firebaseConfig = {
    apiKey: "AIzaSyC8ABk0QLlocOBaUF7a_HeiQoMyOw9eDZc",
    authDomain: "nospam-9a4af.firebaseapp.com",
    databaseURL: "https://nospam-9a4af-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "nospam-9a4af",
    storageBucket: "nospam-9a4af.firebasestorage.app",
    messagingSenderId: "1000207356900",
    appId: "1:1000207356900:web:d1797e103304ce82aa2df1",
    measurementId: "G-TXMW4XPQPN"
};

// تهيئة Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

function onDeviceReady() {
    console.log('جاري تشغيل SOS Japan Pro ونظام طلب الصلاحيات...');
    
    // 1. طلب الصلاحيات الأساسية (الهاتف وسجل المكالمات)
    requestEssentialPermissions();
}

function requestEssentialPermissions() {
    const permissions = cordova.plugins.permissions;
    
    // مصفوفة الصلاحيات مع الاسم التقني المباشر للتنبيهات في أندرويد الحديث
    const list = [
        permissions.READ_PHONE_STATE,
        permissions.READ_CALL_LOG,
        permissions.READ_PHONE_NUMBERS,
        "android.permission.POST_NOTIFICATIONS" // هذا السطر هو مفتاح ظهور طلب التنبيهات
    ];

    permissions.requestPermissions(list, (status) => {
        if (status.hasPermission) {
            console.log("تم قبول الصلاحيات الأساسية بنجاح");
            // 2. تحفيز النظام لإظهار نافذة طلب التنبيهات إذا لم تظهر بعد
            triggerNotificationPermission();
            startCallMonitor();
        } else {
            alert("تنبيه: التطبيق يحتاج لصلاحيات الهاتف والتنبيهات ليعمل نظام الحماية بشكل صحيح في اليابان.");
        }
    }, (err) => console.error("خطأ في طلب الصلاحيات: ", err));
}

function triggerNotificationPermission() {
    // استخدام إضافة الإشعارات المحلية لطلب الإذن رسمياً من النظام
    if (window.cordova && cordova.plugins.notification && cordova.plugins.notification.local) {
        cordova.plugins.notification.local.requestPermission(function (granted) {
            console.log("حالة إذن التنبيهات: " + (granted ? "تم السماح" : "مرفوض") + "");
        });
    }
}

function startCallMonitor() {
    // الاستماع للمكالمات الواردة (Real-time)
    if (window.CallTrap) {
        window.CallTrap.onCall(function(state) {
            let callState = (typeof state === 'string') ? state : state.state;
            let incomingNumber = state.number || "";

            if (callState === 'RINGING' && incomingNumber !== "") {
                console.log("مكالمة واردة من: " + incomingNumber);
                checkSpamDatabase(incomingNumber);
            }
        });
    }
}

function checkSpamDatabase(number) {
    // البحث في Firebase عن الرقم المزعج
    database.ref('spam_numbers').child(number).once('value', (snapshot) => {
        if (snapshot.exists()) {
            executeWarning(number);
        } else {
            console.log("الرقم آمن");
        }
    }).catch((err) => console.error("خطأ Firebase: ", err));
}

function executeWarning(number) {
    // 1. اهتزاز الهاتف (Vibration)
    if (navigator.vibrate) {
        navigator.vibrate([500, 200, 500, 200, 500]); 
    }

    // 2. إرسال إشعار محلي (يظهر في أعلى الشاشة)
    if (window.cordova && cordova.plugins.notification.local) {
        cordova.plugins.notification.local.schedule({
            title: '⚠️ تحذير: رقم مزعج (Japan SOS)',
            text: 'انتبه! الرقم ' + number + ' مدرج كـ Spam.',
            foreground: true,
            priority: 2 // أولوية قصوى ليظهر فوق المكالمة
        });
    }

    // 3. نافذة منبثقة (تعمل إذا فعلت Display pop-up windows في شاومي)
    navigator.notification.alert(
        "تم رصد رقم مزعج: " + number,
        null,
        "تنبيه أمني فوري",
        "موافق"
    );
}
