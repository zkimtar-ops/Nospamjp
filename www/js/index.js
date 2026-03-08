document.addEventListener('deviceready', onDeviceReady, false);

// إعدادات Firebase الخاصة بمشروعك Nospam-9a4af
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
const database = firebase.database();

function onDeviceReady() {
    console.log("نظام SOS Japan جاهز للعمل على واجهة شاومي");

    const permissions = cordova.plugins.permissions;
    const list = [
        permissions.READ_PHONE_STATE,
        permissions.READ_CALL_LOG,
        permissions.READ_PHONE_NUMBERS
    ];

    permissions.requestPermissions(list, (status) => {
        if (status.hasPermission) {
            startCallTrap();
        }
    }, (err) => console.error(err));
}

function startCallTrap() {
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

function checkSpamList(phoneNumber) {
    // فحص الرقم في قاعدة بيانات Firebase
    database.ref('spam_numbers').child(phoneNumber).once('value', (snapshot) => {
        if (snapshot.exists()) {
            sendDualWarning(phoneNumber);
        }
    });
}

function sendDualWarning(number) {
    // 1. تنبيه عبر نافذة منبثقة (يعتمد على إعداد Display pop-up windows في صورتك)
    navigator.notification.alert(
        "⚠️ رقم مزعج: " + number,
        null,
        "تنبيه SOS Japan",
        "موافق"
    );

    // 2. تنبيه عبر الاهتزاز (Vibration)
    if (navigator.vibrate) {
        navigator.vibrate([500, 200, 500]); // اهتزاز متقطع للتنبيه القوي
    }

    // 3. صوت تنبيه (Beep)
    if (navigator.notification.beep) {
        navigator.notification.beep(1);
    }
}
