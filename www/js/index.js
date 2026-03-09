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
    // 1. التأكد من تهيئة الفيرباس والاتصال بالـ Realtime Database
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    const db = firebase.database();

    // فحص الاتصال لإظهاره لك على الشاشة (للتأكد من أنه متصل بحسابك)
    db.ref(".info/connected").on("value", (snap) => {
        const statusLabel = document.getElementById('status-text');
        if (snap.val() === true) {
            statusLabel.innerText = "✅ متصل الآن بـ nospam-9a4af";
            statusLabel.style.color = "green";
            loadSpamNumbers(db); // جلب الأرقام فور الاتصال
        } else {
            statusLabel.innerText = "❌ جاري محاولة الربط بالفيرباس...";
            statusLabel.style.color = "red";
        }
    });

    // 2. طلب الأذونات (بما فيها إذن التنبيهات لأندرويد 13+)
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

// 3. دالة جلب الأرقام وعرضها (تأكد أن الاسم في الفيرباس هو spam_numbers)
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

// 4. حل مشكلة "الإعدادات لا تفتح" (استخدام الـ Intent المباشر)
function showSetupAlert() {
    if (window.plugins && window.plugins.intentShim) {
        window.plugins.intentShim.startActivity({
            action: "android.settings.MANAGE_DEFAULT_APPS_SETTINGS"
        }, () => {}, () => {
            // حل بديل إذا فشل الأول
            window.cordova.plugins.settings.open("application_details");
        });
    } else {
        alert("يرجى الذهاب لإعدادات الهاتف > التطبيقات الافتراضية واختيار SOS Japan Pro");
    }
}

// 5. إرسال التنبيه والحظر عند الاتصال
function startMonitoring(db) {
    if (window.PhoneCallTrap) {
        window.PhoneCallTrap.onCall((state) => {
            if (state === 'RINGING') {
                // ملاحظة: الرقم "000" كمثال، يجب جلبه برمجياً
                checkAndNotify(db, "000");
            }
        });
    }
}

function checkAndNotify(db, incomingNumber) {
    db.ref('spam_numbers/' + incomingNumber).once('value', (snapshot) => {
        if (snapshot.exists()) {
            // إنهاء المكالمة
            if (window.PhoneCallTrap.endCall) window.PhoneCallTrap.endCall();
            
            // إرسال التنبيه المرئي (Notification)
            cordova.plugins.notification.local.schedule({
                title: '🚫 SOS Japan: تم حظر مزعج',
                text: 'الرقم ' + incomingNumber + ' محظور تلقائياً',
                foreground: true,
                priority: 2,
                vibrate: true
            });
            
            navigator.vibrate(1000); // اهتزاز ثانية واحدة
        }
    });
}
