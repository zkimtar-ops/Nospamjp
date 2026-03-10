document.addEventListener('deviceready', onDeviceReady, false);

const firebaseConfig = {
    apiKey: "AIzaSyC8ABk0QLlocOBaUF7a_HeiQoMyOw9eDZc",
    authDomain: "nospam-9a4af.firebaseapp.com",
    databaseURL: "https://nospam-9a4af-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "nospam-9a4af",
    storageBucket: "nospam-9a4af.firebasestorage.app",
    messagingSenderId: "1000207356900",
    appId: "1:1000207356900:web:d1797e103304ce82aa2df1"
};

function onDeviceReady() {
    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    const db = firebase.database();

    // 1. فحص الاتصال
    db.ref(".info/connected").on("value", (snap) => {
        document.getElementById('status-db').innerText = snap.val() ? "✅ قاعدة البيانات متصلة" : "❌ فشل الاتصال";
    });

    // 2. طلب "كل" الأذونات دفعة واحدة عند التشغيل
    requestAllPermissions();
}

function requestAllPermissions() {
    const permissions = cordova.plugins.permissions;
    const list = [
        permissions.READ_PHONE_STATE,
        permissions.READ_CALL_LOG,
        permissions.READ_PHONE_NUMBERS,
        permissions.ANSWER_PHONE_CALLS,
        permissions.POST_NOTIFICATIONS,
        permissions.SYSTEM_ALERT_WINDOW
    ];

    permissions.requestPermissions(list, (status) => {
        console.log("Permissions status:", status);
    }, (err) => {
        console.error("Error requesting permissions", err);
    });
}

// الدالة التي طلبتها: تفتح صفحة الإعدادات لكل التطبيقات مباشرة
function openDefaultApps() {
    if (window.plugins && window.plugins.intentShim) {
        // نستخدم الأكشن MANAGE_DEFAULT_APPS_SETTINGS لفتح القائمة العامة
        window.plugins.intentShim.startActivity({
            action: "android.settings.MANAGE_DEFAULT_APPS_SETTINGS"
        }, 
        () => { console.log("Success: Opened Default Apps Settings"); }, 
        (err) => { alert("خطأ في فتح الإعدادات: " + JSON.stringify(err)); }
        );
    } else {
        alert("إضافة IntentShim غير مثبتة!");
    }
}
