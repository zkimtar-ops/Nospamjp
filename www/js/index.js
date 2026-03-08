document.addEventListener('deviceready', onDeviceReady, false);

// إعدادات Firebase الخاصة بمشروعك (Nospam-9a4af)
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
    console.log('التطبيق يعمل... جاري إعداد الحماية...');
    
    // 1. طلب الصلاحيات الأساسية أولاً
    requestBasePermissions();
}

function requestBasePermissions() {
    const permissions = cordova.plugins.permissions;
    const list = [
        permissions.READ_PHONE_STATE,
        permissions.READ_CALL_LOG,
        permissions.READ_PHONE_NUMBERS
    ];

    permissions.requestPermissions(list, (status) => {
        if (status.hasPermission) {
            // 2. بعد قبول الصلاحيات، نطلب جعله التطبيق الافتراضي
            askToSetAsDefaultSpamApp();
        } else {
            alert("الصلاحيات مرفوضة. لن يتمكن التطبيق من حمايتك.");
        }
    }, (err) => console.error(err));
}

function askToSetAsDefaultSpamApp() {
    // محاولة فتح شاشة إعداد التطبيق الافتراضي لهوية المتصل
    // ملاحظة: في أندرويد 10+ هذا هو الإجراء الصحيح لضمان قراءة الرقم فوراً
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.intentShim) {
        window.cordova.plugins.intentShim.startActivity(
            {
                action: "android.telecom.action.CHANGE_DEFAULT_DIALER",
                extras: {
                    "android.telecom.extra.CHANGE_DEFAULT_DIALER_PACKAGE_NAME": "com.nospam.japan"
                }
            },
            function() { console.log("تم فتح شاشة الإعدادات"); },
            function() { 
                // إذا فشل الطلب المباشر، نفتح شاشة الإعدادات العامة للمستخدم
                console.log("فشل فتح الطلب المباشر، نفتح الإعدادات العامة");
                openDefaultAppsSettings();
            }
        );
    } else {
        // إذا لم تتوفر الإضافة، نكتفي بالتنبيه والبدء في مراقبة المكالمات
        startCallTrap();
    }
}

function openDefaultAppsSettings() {
    navigator.notification.confirm(
        "لتعمل ميزة كشف الأرقام المزعجة في اليابان، يجب ضبط التطبيق كافتراضي لـ (Caller ID & Spam).",
        function(index) {
            if (index === 1) {
                // محاولة فتح إعدادات التطبيقات الافتراضية
                if (window.cordova.plugins.settings) {
                    window.cordova.plugins.settings.open("manage_default_apps");
                }
            }
            startCallTrap(); // نبدأ المراقبة بكل الأحوال
        },
        "إعداد هام",
        ["افتح الإعدادات", "لاحقاً"]
    );
}

function startCallTrap() {
    if (window.CallTrap) {
        window.CallTrap.onCall(function(state) {
            // الحالة RINGING تعني أن هناك اتصالاً وارداً الآن
            let callState = (typeof state === 'string') ? state : state.state;
            let incomingNumber = state.number || "";

            if (callState === 'RINGING') {
                if (incomingNumber) {
                    checkSpam(incomingNumber);
                } else {
                    console.log("الرقم مخفي أو الصلاحيات غير مكتملة (اجعل التطبيق افتراضياً)");
                }
            }
        });
    }
}

function checkSpam(number) {
    database.ref('spam_numbers').child(number).once('value', (snapshot) => {
        if (snapshot.exists()) {
            // الرقم موجود في القائمة السوداء
            triggerAlert(number);
        }
    });
}

function triggerAlert(number) {
    // تنبيه بالاهتزاز والصوت
    if (navigator.notification) {
        navigator.notification.beep(1);
        navigator.notification.vibrate(1000);
        
        navigator.notification.alert(
            "تحذير! الرقم " + number + " مصنف كمزعج في اليابان.",
            null,
            "⚠️ SOS Japan",
            "إغلاق"
        );
    }
}
