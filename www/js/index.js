document.addEventListener('deviceready', onDeviceReady, false);

// إعدادات الفيرباس الخاصة بك
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
    // 1. تهيئة الفيرباس والاتصال بقاعدة البيانات
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    const db = firebase.database();

    // فحص حالة الاتصال بالفيرباس
    db.ref(".info/connected").on("value", (snap) => {
        const statusLabel = document.getElementById('status-text');
        if (snap.val() === true) {
            statusLabel.innerText = "✅ متصل الآن بـ nospam-9a4af";
            statusLabel.style.color = "green";
            loadSpamNumbers(db); 
        } else {
            statusLabel.innerText = "❌ جاري محاولة الربط بالفيرباس...";
            statusLabel.style.color = "red";
        }
    });

    // 2. طلب كافة الأذونات المطلوبة (المكالمات، السجلات، التنبيهات)
    const permissions = cordova.plugins.permissions;
    permissions.requestPermissions([
        permissions.READ_PHONE_STATE,
        permissions.ANSWER_PHONE_CALLS,
        permissions.READ_CALL_LOG,
        "android.permission.POST_NOTIFICATIONS"
    ], (status) => {
        if (status.hasPermission) startMonitoring(db);
    });
}

// 3. جلب أرقام السبام من الفيرباس
function loadSpamNumbers(db) {
    const listDiv = document.getElementById('list-content');
    db.ref('spam_numbers').on('value', (snapshot) => {
        if (listDiv) {
            listDiv.innerHTML = "";
            if (snapshot.exists()) {
                snapshot.forEach((child) => {
                    listDiv.innerHTML += `<div class="spam-item"><span>📞 ${child.key}</span> <span class="badge">محظور</span></div>`;
                });
            } else {
                listDiv.innerHTML = "<p>لا توجد أرقام في قاعدة البيانات حالياً</p>";
            }
        }
    });
}

// 4. الفتح المباشر لشاشة Default caller ID & spam app
function showSetupAlert() {
    if (window.plugins && window.plugins.intentShim) {
        // استخدام نظام الأدوار (Role Manager) لفتح النافذة مباشرة
        window.plugins.intentShim.startActivity({
            action: "android.app.role.action.REQUEST_ROLE",
            extras: {
                "android.app.role.extra.ROLE_NAME": "android.app.role.CALL_SCREENING"
            }
        }, 
        () => { console.log("Success"); }, 
        (err) => {
            // حل بديل في حال فشل الطلب المباشر لفتح الإعدادات العامة
            window.plugins.intentShim.startActivity({
                action: "android.settings.MANAGE_DEFAULT_APPS_SETTINGS"
            });
        });
    } else {
        alert("يرجى اختيار SOS Japan Pro من إعدادات الهاتف");
    }
}

// 5. مراقبة المكالمات والحظر التلقائي
function startMonitoring(db) {
    if (window.PhoneCallTrap) {
        window.PhoneCallTrap.onCall((state) => {
            if (state === 'RINGING') {
                // ملاحظة: يجب جلب الرقم الفعلي برمجياً هنا
                checkAndNotify(db, "000"); 
            }
        });
    }
}

function checkAndNotify(db, incomingNumber) {
    db.ref('spam_numbers/' + incomingNumber).once('value', (snapshot) => {
        if (snapshot.exists()) {
            if (window.PhoneCallTrap.endCall) window.PhoneCallTrap.endCall();
            
            // إرسال تنبيه محلي
            cordova.plugins.notification.local.schedule({
                title: '🚫 SOS Japan: تم حظر مزعج',
                text: 'الرقم ' + incomingNumber + ' محظور تلقائياً',
                foreground: true,
                priority: 2,
                vibrate: true
            });
            
            navigator.vibrate(1000); 
        }
    });
}
