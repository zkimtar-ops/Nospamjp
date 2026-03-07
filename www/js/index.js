document.addEventListener('deviceready', onDeviceReady, false);

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

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

function onDeviceReady() {
    // مصفوفة الصلاحيات المطلوبة للعمل التلقائي
    const permissions = cordova.plugins.permissions;
    const permissionsList = [
        permissions.READ_PHONE_STATE,
        permissions.READ_CALL_LOG,
        permissions.SYSTEM_ALERT_WINDOW
    ];

    // طلب الصلاحيات تلقائياً عند بدء التشغيل
    permissions.requestPermissions(permissionsList, (status) => {
        if (status.hasPermission) {
            console.log("تم تفعيل كافة الصلاحيات تلقائياً");
            startCallMonitor();
        } else {
            alert("يرجى الموافقة على الصلاحيات لضمان عمل نظام الحماية.");
        }
    }, (err) => console.error("Permission error:", err));
}

function startCallMonitor() {
    // إضافة CallTrap لمراقبة المكالمات الواردة
    if (window.CallTrap) {
        window.CallTrap.onCall(function(state) {
            let callState = (typeof state === 'string') ? state : state.state;
            let incomingNumber = state.number || "";

            if (callState === 'RINGING' && incomingNumber !== "") {
                checkFirebase(incomingNumber);
            }
        });
    }
}

function checkFirebase(number) {
    db.ref('spam_numbers').child(number).once('value', (snapshot) => {
        if (snapshot.exists()) {
            // إظهار تنبيه فوراً فوق شاشة الاتصال
            navigator.notification.alert(
                "تحذير: الرقم " + number + " مسجل كـ SPAM!",
                null,
                "⚠️ حماية SOS Japan",
                "موافق"
            );
            navigator.notification.beep(1);
        }
    });
}
