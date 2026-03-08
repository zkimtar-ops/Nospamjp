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

// تهيئة الفايربيس
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

function onDeviceReady() {
    console.log('جاري تشغيل نظام Japan Safety SOS...');
    
    // طلب الصلاحيات الأساسية فور تشغيل التطبيق
    const permissions = cordova.plugins.permissions;
    const list = [
        permissions.READ_PHONE_STATE,
        permissions.READ_CALL_LOG,
        permissions.READ_PHONE_NUMBERS // ضرورية جداً لأندرويد 10 فما فوق
    ];

    permissions.requestPermissions(list, (status) => {
        if (status.hasPermission) {
            console.log("تم تفعيل الصلاحيات. نظام المراقبة نشط.");
            startCallListener();
        } else {
            alert("بدون صلاحيات الهاتف، لن يتمكن التطبيق من حمايتك في اليابان.");
        }
    }, (error) => {
        console.error("خطأ في طلب الصلاحيات: ", error);
    });
}

function startCallListener() {
    // استخدام CallTrap للاستماع للمكالمات الحية
    if (window.CallTrap) {
        window.CallTrap.onCall(function(state) {
            // التحقق من حالة الرنين (RINGING)
            let callState = (typeof state === 'string') ? state : state.state;
            let incomingNumber = state.number || "";

            if (callState === 'RINGING') {
                if (incomingNumber) {
                    checkSpamDatabase(incomingNumber);
                } else {
                    // في أندرويد 16، إذا كان الرقم فارغاً، فهذا يعني أنك بحاجة لمنح صلاحية
                    // "الظهور فوق التطبيقات الأخرى" يدوياً من إعدادات الهاتف.
                    console.log("الرقم لم يظهر. تأكد من تفعيل 'Display over other apps'");
                }
            }
        });
    }
}

function checkSpamDatabase(phoneNumber) {
    // البحث في الفايربيس داخل عقدة spam_numbers
    database.ref('spam_numbers').child(phoneNumber).once('value', (snapshot) => {
        if (snapshot.exists()) {
            // الرقم موجود في القائمة السوداء لليابان
            notifyUser(phoneNumber);
        }
    }).catch((err) => {
        console.error("خطأ في الاتصال بالفايربيس: ", err);
    });
}

function notifyUser(number) {
    // إطلاق تنبيه صوتي واهتزاز
    if (navigator.notification) {
        navigator.notification.beep(1);
        navigator.notification.vibrate(1000); // اهتزاز لمده ثانية واحدة

        navigator.notification.alert(
            "تحذير: الرقم " + number + " مدرج كـ رقم مزعج في اليابان.",
            null,
            "⚠️ تنبيه أمني (SOS Japan)",
            "موافق"
        );
    }
}
