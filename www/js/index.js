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

// تهيئة Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

function onDeviceReady() {
    console.log('تم تشغيل التطبيق وجاري تحضير نظام الحماية...');
    
    // طلب صلاحيات الهاتف من المستخدم (ضروري لأندرويد 10 فما فوق)
    const permissions = cordova.plugins.permissions;
    const permissionsList = [
        permissions.READ_PHONE_STATE,
        permissions.READ_CALL_LOG
    ];

    permissions.requestPermissions(permissionsList, (status) => {
        if (status.hasPermission) {
            console.log("تم الحصول على الصلاحيات بنجاح");
            startCallListener();
        } else {
            alert("يرجى تفعيل صلاحيات الهاتف لكي يتمكن التطبيق من اكتشاف الأرقام المزعجة.");
        }
    }, (error) => {
        console.error("خطأ في طلب الصلاحيات: ", error);
    });
}

function startCallListener() {
    // الاستماع للمكالمات الواردة
    // يدعم window.CallTrap أو window.calltrap حسب إصدار الـ Plugin
    const trap = window.CallTrap || window.calltrap;

    if (trap) {
        trap.onCall(function(state) {
            // الحالات: RINGING (يرن), OFFHOOK (مرفوع السمعة), IDLE (انتظار)
            if (state.state === 'RINGING') {
                const incomingNumber = state.number;
                console.log("مكالمة واردة من: " + incomingNumber);
                checkSpamList(incomingNumber);
            }
        });
    } else {
        console.error("فشل في تحميل إضافة فحص المكالمات (CallTrap)");
    }
}

function checkSpamList(phoneNumber) {
    if (!phoneNumber) return;

    // تحديث الواجهة لعرض الرقم الذي يتم فحصه
    const logElement = document.getElementById('call-log');
    if (logElement) logElement.innerText = "يتم الآن فحص الرقم: " + phoneNumber;

    // البحث في عقدة spam_numbers داخل Firebase
    database.ref('spam_numbers').child(phoneNumber).once('value', (snapshot) => {
        if (snapshot.exists()) {
            // الرقم موجود في القائمة السوداء
            showSpamWarning(phoneNumber);
        } else {
            console.log("الرقم آمن");
        }
    }).catch((error) => {
        console.error("خطأ في الاتصال بقاعدة البيانات: ", error);
    });
}

function showSpamWarning(number) {
    // إرسال تنبيه صوتي (Beep)
    if (navigator.notification && navigator.notification.beep) {
        navigator.notification.beep(1);
    }

    // إظهار رسالة تحذيرية للمستخدم
    navigator.notification.alert(
        "هذا الرقم (" + number + ") مصنف كـ رقم مزعج في اليابان. يرجى الحذر قبل الرد.",
        null,
        "⚠️ تنبيه حماية (Japan SOS)",
        "فهمت"
    );

    // تحديث الواجهة
    const logElement = document.getElementById('call-log');
    if (logElement) {
        logElement.innerHTML = "<b style='color:#ff4444'>تحذير: رقم مزعج! </b><br>" + number;
    }
}
