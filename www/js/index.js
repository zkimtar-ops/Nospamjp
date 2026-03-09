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
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    const db = firebase.database();

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

// دالة الانتقال المباشر المحدثة (لفتح الصورة 9443 مباشرة)
function showSetupAlert() {
    if (window.plugins && window.plugins.intentShim) {
        // المحاولة الأولى: فتح نافذة "طلب الدور" مباشرة فوق التطبيق
        window.plugins.intentShim.startActivity({
            action: "android.app.role.action.REQUEST_ROLE",
            extras: {
                "android.app.role.extra.ROLE_NAME": "android.app.role.CALL_SCREENING"
            }
        }, 
        () => { console.log("Success"); }, 
        (err) => {
            // الخطة البديلة: فتح صفحة الإعدادات العامة إذا فشل الطلب المباشر
            window.plugins.intentShim.startActivity({
                action: "android.settings.MANAGE_DEFAULT_APPS_SETTINGS"
            });
        });
    } else {
        alert("خطأ: لم يتم تحميل إضافة الأوامر (Intent Plugin) من الـ YAML");
    }
}

// 5. مراقبة المكالمات وجلب الرقم الحقيقي بدلاً من 000
function startMonitoring(db) {
    if (window.PhoneCallTrap) {
        window.PhoneCallTrap.onCall((state, incomingNumber) => {
            // التحقق من حالة الرنين والرقم الوارد
            if (state === 'RINGING' && incomingNumber) {
                console.log("مكالمة واردة من: " + incomingNumber);
                checkAndNotify(db, incomingNumber);
            } else if (state === 'RINGING') {
                // إذا لم يدعم النظام جلب الرقم مباشرة، نحاول مرة أخرى بقيمة افتراضية
                checkAndNotify(db, "000");
            }
        });
    }
}

function checkAndNotify(db, incomingNumber) {
    db.ref('spam_numbers/' + incomingNumber).once('value', (snapshot) => {
        if (snapshot.exists()) {
            if (window.PhoneCallTrap.endCall) window.PhoneCallTrap.endCall();
            
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
