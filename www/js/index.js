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
    console.log('جاري إعداد نظام الحماية وطلب تصاريح التنبيهات...');
    
    const permissions = cordova.plugins.permissions;
    
    // إضافة POST_NOTIFICATIONS لطلب الوصول إلى التنبيهات برمجياً
    const permissionsList = [
        permissions.READ_PHONE_STATE,
        permissions.READ_CALL_LOG,
        permissions.READ_PHONE_NUMBERS,
        permissions.POST_NOTIFICATIONS // ضروري جداً لأندرويد 13+ لظهور التنبيهات
    ];

    permissions.requestPermissions(permissionsList, (status) => {
        if (status.hasPermission) {
            console.log("تم تفعيل كافة الصلاحيات بما فيها التنبيهات");
            startCallMonitor();
        } else {
            alert("بدون إذن التنبيهات، لن يظهر التحذير عند اتصال رقم مزعج.");
        }
    }, (error) => {
        console.error("خطأ في طلب الصلاحيات: ", error);
    });
}

function startCallMonitor() {
    if (window.CallTrap) {
        window.CallTrap.onCall(function(state) {
            let callState = (typeof state === 'string') ? state : state.state;
            let incomingNumber = state.number || "";

            if (callState === 'RINGING' && incomingNumber !== "") {
                checkSpamList(incomingNumber);
            }
        });
    }
}

function checkSpamList(number) {
    database.ref('spam_numbers').child(number).once('value', (snapshot) => {
        if (snapshot.exists()) {
            triggerSpamWarning(number);
        }
    });
}

function triggerSpamWarning(number) {
    // 1. الاهتزاز (الذي أضفناه في الـ YAML)
    if (navigator.vibrate) {
        navigator.vibrate([500, 200, 500]); 
    }

    // 2. إظهار التنبيه المرئي (Alert)
    // ملاحظة لشاومي: سيعمل فقط إذا فعلت Display pop-up windows يدوياً
    navigator.notification.alert(
        "⚠️ تحذير: الرقم " + number + " مدرج كـ Spam في اليابان!",
        null,
        "SOS Japan Pro",
        "موافق"
    );

    // 3. صوت التنبيه
    if (navigator.notification.beep) {
        navigator.notification.beep(1);
    }
}
