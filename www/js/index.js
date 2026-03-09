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
    // 1. تفعيل وضع العمل في الخلفية لضمان بقاء الفيرباس متصلاً
    if (cordova.plugins.backgroundMode) {
        cordova.plugins.backgroundMode.enable();
        cordova.plugins.backgroundMode.overrideBackButton();
    }

    // 2. تهيئة Firebase والتأكد من الاتصال
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    
    // اختبار الاتصال بالفيرباس
    const connectedRef = firebase.database().ref(".info/connected");
    connectedRef.on("value", (snap) => {
        if (snap.val() === true) {
            document.getElementById('status-text').innerText = "✅ متصل بالفيرباس وقيد المراقبة";
            document.getElementById('status-text').style.color = "green";
        } else {
            document.getElementById('status-text').innerText = "❌ انقطع الاتصال بالفيرباس";
            document.getElementById('status-text').style.color = "red";
        }
    });

    // 3. طلب الأذونات وفتح صفحة الـ Pop-up (لحل مشكلة صورة 9408)
    const permissions = cordova.plugins.permissions;
    permissions.requestPermissions([
        permissions.READ_PHONE_STATE,
        permissions.READ_CALL_LOG,
        permissions.ANSWER_PHONE_CALLS
    ], (status) => {
        if (status.hasPermission) {
            startCallMonitor();
            // توجيه المستخدم لحل مشكلة الإذن في صورتك (9408)
            requestPopUpPermission(); 
        }
    });
}

function startCallMonitor() {
    if (window.PhoneCallTrap) {
        window.PhoneCallTrap.onCall(function(state) {
            if (state === 'RINGING') {
                // جلب الرقم واختباره (يجب استخدام إضافة جلب الرقم الفعلية هنا)
                checkAndBlock("000"); 
            }
        });
    }
}

function checkAndBlock(incomingNumber) {
    firebase.database().ref('spam_numbers/' + incomingNumber).once('value', (snapshot) => {
        if (snapshot.exists()) {
            // تنفيذ الحظر وإرسال الإشعار
            if (window.PhoneCallTrap.endCall) window.PhoneCallTrap.endCall();
            
            cordova.plugins.notification.local.schedule({
                title: '🚫 تم حظر رقم مزعج',
                text: 'الرقم ' + incomingNumber + ' محظور آلياً',
                foreground: true,
                priority: 2
            });
        }
    });
}
