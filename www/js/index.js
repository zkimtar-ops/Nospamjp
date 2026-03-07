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
    console.log('التطبيق جاهز، جاري طلب الصلاحيات...');
    
    const permissions = cordova.plugins.permissions;
    const list = [
        permissions.READ_PHONE_STATE,
        permissions.READ_CALL_LOG
    ];

    permissions.requestPermissions(list, (status) => {
        if (status.hasPermission) {
            setupCallListener();
        } else {
            alert("صلاحيات الهاتف مطلوبة لاكتشاف الأرقام المزعجة.");
        }
    }, (error) => {
        console.error("خطأ في الصلاحيات:", error);
    });
}

function setupCallListener() {
    // التحقق من وجود الإضافة
    if (window.CallTrap) {
        window.CallTrap.onCall(function(state) {
            // التعامل مع الحالة سواء كانت كائن (Object) أو نص (String)
            let callState = (typeof state === 'string') ? state : state.state;
            let incomingNumber = state.number || "";

            console.log("حالة الاتصال الحالية: " + callState);

            if (callState === 'RINGING') {
                if (incomingNumber) {
                    checkSpam(incomingNumber);
                } else {
                    console.log("تعذر قراءة رقم المتصل (قد يكون رقم خاص)");
                }
            }
        });
    } else {
        console.error("إضافة CallTrap غير مثبتة بشكل صحيح.");
    }
}

function checkSpam(phoneNumber) {
    console.log("جاري فحص الرقم في قاعدة البيانات: " + phoneNumber);
    
    // تحديث الواجهة للعلم
    const logDiv = document.getElementById('call-log');
    if (logDiv) logDiv.innerText = "فحص الرقم: " + phoneNumber;

    // البحث في Firebase داخل عقدة spam_numbers
    // يجب أن تكون الأرقام مخزنة في Firebase كمفاتيح (Keys)
    database.ref('spam_numbers').child(phoneNumber).once('value', (snapshot) => {
        if (snapshot.exists()) {
            triggerWarning(phoneNumber);
        } else {
            console.log("الرقم آمن.");
        }
    }).catch((err) => {
        console.error("خطأ في Firebase:", err);
    });
}

function triggerWarning(number) {
    // تنبيه صوتي
    if (navigator.notification && navigator.notification.beep) {
        navigator.notification.beep(1);
    }

    // رسالة تنبيه تظهر للمستخدم
    navigator.notification.alert(
        "تنبيه: الرقم " + number + " مدرج ضمن الأرقام المزعجة في اليابان!",
        null,
        "⚠️ رقم مزعج (Japan SOS)",
        "موافق"
    );

    // تحديث النص في الصفحة
    const logDiv = document.getElementById('call-log');
    if (logDiv) {
        logDiv.innerHTML = "<b style='color:red'>تحذير! متصل مزعج: </b>" + number;
    }
}
