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
    console.log("Device is ready");
    
    // تشغيل الفيرباس
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    const db = firebase.database();

    // مراقبة حالة الاتصال
    checkFirebaseConnection(db);

    // تحميل قائمة الأرقام المحظورة للعرض
    loadSpamNumbers(db);

    // طلب الأذونات الأساسية عند التشغيل
    requestPermissions();

    // بدء مراقبة المكالمات
    startMonitoring(db);
}

// دالة التحكم في زر التفعيل (بناءً على الشروط)
function toggleBtn() {
    const isChecked = document.getElementById('terms-check').checked;
    const btn = document.getElementById('activate-btn');
    if (btn) btn.disabled = !isChecked;
}

// دالة تفعيل الحظر المباشر (طريقة تروكولر المضمونة)
function startActivation() {
    // 1. تنبيه المستخدم لتهيئة النظام
    alert("سيفتح النظام الآن قائمة؛ اختر SOS Japan Pro ثم اضغط 'Set as default'");
    
    // 2. استخدام تأخير بسيط لضمان استجابة معالج شاومي
    setTimeout(function() {
        if (window.plugins && window.plugins.intentShim) {
            window.plugins.intentShim.startActivity({
                action: "android.app.role.action.REQUEST_ROLE",
                extras: {
                    "android.app.role.extra.ROLE_NAME": "android.app.role.CALL_SCREENING"
                }
            }, 
            function() { console.log("Role Request Opened Successfully"); }, 
            function(err) { 
                console.warn("Direct role request failed, opening general settings...");
                // الحل البديل إذا رفض النظام الطلب المباشر
                window.plugins.intentShim.startActivity({
                    action: "android.settings.MANAGE_DEFAULT_APPS_SETTINGS"
                });
            });
        } else {
            alert("خطأ: إضافة Intent غير محملة!");
        }
    }, 800);
}

function checkFirebaseConnection(db) {
    db.ref(".info/connected").on("value", (snap) => {
        const statusLabel = document.getElementById('status-text');
        if (snap.val() === true) {
            statusLabel.innerText = "✅ متصل بقاعدة البيانات";
            statusLabel.style.color = "green";
        } else {
            statusLabel.innerText = "❌ جاري محاولة الاتصال...";
            statusLabel.style.color = "red";
        }
    });
}

function loadSpamNumbers(db) {
    const listDiv = document.getElementById('list-content');
    db.ref('spam_numbers').on('value', (snapshot) => {
        if (listDiv) {
            listDiv.innerHTML = "";
            if (snapshot.exists()) {
                snapshot.forEach((child) => {
                    listDiv.innerHTML += `
                        <div class="spam-item" style="border-bottom:1px solid #eee; padding:10px;">
                            <span>📞 ${child.key}</span>
                            <span style="color:red; font-size:12px;">محظور</span>
                        </div>`;
                });
            } else {
                listDiv.innerHTML = "<p>القائمة فارغة حالياً</p>";
            }
        }
    });
}

function requestPermissions() {
    const permissions = cordova.plugins.permissions;
    const list = [
        permissions.READ_PHONE_STATE,
        permissions.READ_CALL_LOG,
        permissions.ANSWER_PHONE_CALLS,
        permissions.READ_PHONE_NUMBERS
    ];

    permissions.requestPermissions(list, (status) => {
        if (!status.hasPermission) console.warn("Permissions not granted");
    }, () => console.error("Permission error"));
}

function startMonitoring(db) {
    if (window.PhoneCallTrap) {
        window.PhoneCallTrap.onCall((state, incomingNumber) => {
            // التحقق من الرقم عند الرنين
            if (state === 'RINGING' && incomingNumber) {
                checkAndBlock(db, incomingNumber);
            }
        });
    }
}

function checkAndBlock(db, incomingNumber) {
    db.ref('spam_numbers/' + incomingNumber).once('value', (snapshot) => {
        if (snapshot.exists()) {
            // إذا كان الرقم موجود في القائمة، نقوم بإنهاء المكالمة
            if (window.PhoneCallTrap.endCall) {
                window.PhoneCallTrap.endCall();
                showNotification(incomingNumber);
            }
        }
    });
}

function showNotification(num) {
    cordova.plugins.notification.local.schedule({
        title: '🚫 تم حظر مكالمة مزعجة',
        text: 'تم حظر الرقم: ' + num,
        foreground: true,
        priority: 2
    });
    if (navigator.vibrate) navigator.vibrate(1000);
}
