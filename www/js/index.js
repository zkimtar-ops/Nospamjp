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

// الكود الجديد لفتح نافذة Default caller ID & spam app مباشرة
function showSetupAlert() {
    if (window.plugins && window.plugins.intentShim) {
        // هذا الأمر يفتح نافذة الاختيار التي ظهرت في صورتك الأخيرة
        window.plugins.intentShim.startActivity({
            action: "android.app.role.action.REQUEST_ROLE",
            extras: {
                "android.app.role.extra.ROLE_NAME": "android.app.role.CALL_SCREENING"
            }
        }, 
        () => { console.log("فتح النافذة بنجاح"); }, 
        (err) => {
            // في حال فشل الأمر المباشر، يفتح القائمة العامة كبديل
            window.plugins.intentShim.startActivity({
                action: "android.settings.MANAGE_DEFAULT_APPS_SETTINGS"
            });
        });
    } else {
        alert("يرجى التأكد من إضافة cordova-plugin-intent في الـ YAML");
    }
}

function startMonitoring(db) {
    if (window.PhoneCallTrap) {
        window.PhoneCallTrap.onCall((state) => {
            if (state === 'RINGING') {
                // ملاحظة: يجب تعديل الحصول على الرقم الوارد برمجياً هنا
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
