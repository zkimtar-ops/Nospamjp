document.addEventListener('deviceready', onDeviceReady, false);

// إعدادات Firebase الخاصة بك
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
    const statusLabel = document.getElementById('status-text');
    if (statusLabel) statusLabel.innerText = "جاري تهيئة النظام...";

    // 1. تهيئة Firebase
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    window.database = firebase.database();

    // 2. طلب الأذونات
    const permissions = cordova.plugins.permissions;
    const list = [
        permissions.READ_PHONE_STATE,
        permissions.READ_CALL_LOG,
        "android.permission.POST_NOTIFICATIONS"
    ];

    permissions.requestPermissions(list, (status) => {
        if (status.hasPermission) {
            if (statusLabel) {
                statusLabel.innerText = "✅ النظام نشط ومراقب";
                statusLabel.style.color = "green";
            }
            startCallMonitor();
            loadNumbersList();
        } else {
            if (statusLabel) statusLabel.innerText = "❌ الأذونات مرفوضة";
        }
    }, (err) => console.error(err));
}

// مراقبة المكالمات الواردة
function startCallMonitor() {
    if (window.PhoneCallTrap) {
        window.PhoneCallTrap.onCall(function(state) {
            if (state === 'RINGING') {
                // ملاحظة: قد يحتاج جلب الرقم لإضافة أخرى، لكننا سنعتمد على حالة الرنين
                checkIncomingNumber("000"); // تجريبي
            }
        });
    }
}

function loadNumbersList() {
    const container = document.getElementById('list-content');
    window.database.ref('spam_numbers').on('value', (snapshot) => {
        if (container) {
            container.innerHTML = "";
            if (snapshot.exists()) {
                snapshot.forEach((child) => {
                    container.innerHTML += `<div class="spam-item"><span>📞 ${child.key}</span> <span class="badge">Spam</span></div>`;
                });
            } else {
                container.innerHTML = "القائمة فارغة حالياً";
            }
        }
    });
}

function checkIncomingNumber(number) {
    window.database.ref('spam_numbers/' + number).once('value', (snapshot) => {
        if (snapshot.exists()) {
            // 1. الاهتزاز (يعمل حالياً)
            navigator.vibrate(2000);

            // 2. إرسال إشعار Push Notification (إضافة جديدة)
            // هذا الإشعار سيظهر في أعلى الشاشة حتى لو كان التطبيق في الخلفية
            if (window.cordova && cordova.plugins.notification.local) {
                cordova.plugins.notification.local.schedule({
                    title: '⚠️ تحذير من SOS Japan',
                    text: 'رقم مزعج يتصل بك الآن: ' + number,
                    foreground: true, 
                    priority: 2, // لضمان الظهور في أعلى الشاشة (Heads-up)
                    vibrate: true
                });
            }

            // 3. التنبيه التقليدي
            alert("⚠️ تحذير أمني: الرقم " + number + " مسجل كـ Spam!");
        }
    });
}
