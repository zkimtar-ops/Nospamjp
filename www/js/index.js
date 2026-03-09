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
    // 1. تهيئة الفيرباس أولاً (لضمان الاتصال كما في الكود القديم)
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    window.database = firebase.database();

    // 2. طلب الأذونات الشاملة
    const permissions = cordova.plugins.permissions;
    const list = [
        permissions.READ_PHONE_STATE,
        permissions.READ_CALL_LOG,
        permissions.ANSWER_PHONE_CALLS,
        "android.permission.POST_NOTIFICATIONS"
    ];

    permissions.requestPermissions(list, (status) => {
        if (status.hasPermission) {
            // 3. تفعيل ميزة "Set as default" (مثل تروكولر)
            requestTruecallerRole();
            
            // 4. تشغيل المراقبة وتحميل القائمة
            startCallMonitor();
            loadNumbersList();
        }
    }, (err) => console.error(err));
}

// الوظيفة التي تظهر نافذة تروكولر (Set as default)
function requestTruecallerRole() {
    if (window.cordova && cordova.plugins.RoleManager) {
        // طلب دور حاجب المكالمات (مثل تروكولر تماماً)
        cordova.plugins.RoleManager.requestRole("android.app.role.CALL_SCREENING", function() {
            console.log("تم التفعيل كافتراضي بنجاح");
        }, function(err) {
            console.error("رفض المستخدم أو حدث خطأ: " + err);
        });
    }
}

function startCallMonitor() {
    if (window.PhoneCallTrap) {
        window.PhoneCallTrap.onCall(function(state) {
            if (state === 'RINGING') {
                // ملاحظة: رقم المتصل الفعلي يتم فحصها هنا
                checkIncomingNumber("000"); 
            }
        });
    }
}

function checkIncomingNumber(number) {
    window.database.ref('spam_numbers/' + number).once('value', (snapshot) => {
        if (snapshot.exists()) {
            // تنفيذ الحظر التلقائي (Reject Call)
            if (window.PhoneCallTrap && window.PhoneCallTrap.endCall) {
                window.PhoneCallTrap.endCall();
            }
            
            navigator.vibrate(1000);
            
            // إشعار Push للمستخدم
            cordova.plugins.notification.local.schedule({
                title: '🚫 تم حظر رقم مزعج',
                text: 'الرقم ' + number + ' محظور تلقائياً بواسطة SOS Japan',
                foreground: true,
                priority: 2
            });
        }
    });
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
            }
        }
    });
}
