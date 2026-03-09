document.addEventListener('deviceready', onDeviceReady, false);

// 1. إعدادات Firebase الخاصة بك (لا تقم بتغييرها)
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
    if (statusLabel) statusLabel.innerText = "جاري تهيئة SOS Japan Pro...";

    // 2. تهيئة Firebase
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    window.database = firebase.database();

    // 3. طلب "جميع الأذونات" (القديمة + الجديدة للحظر)
    const permissions = cordova.plugins.permissions;
    const list = [
        permissions.READ_PHONE_STATE,   // لقراءة حالة الاتصال
        permissions.READ_CALL_LOG,     // لجلب رقم المتصل في أندرويد الحديث
        permissions.ANSWER_PHONE_CALLS, // للسماح للتطبيق بإنهاء المكالمة
        "android.permission.POST_NOTIFICATIONS" // لإرسال تنبيهات Push
    ];

    permissions.requestPermissions(list, (status) => {
        if (status.hasPermission) {
            if (statusLabel) {
                statusLabel.innerText = "✅ النظام نشط ومراقب (مثل تروكولر)";
                statusLabel.style.color = "green";
            }
            // تشغيل مراقب المكالمات وتحميل القائمة
            startCallMonitor();
            loadNumbersList();
            
            // طلب جعل التطبيق افتراضياً لمرة واحدة فقط
            requestTruecallerMode();
        } else {
            if (statusLabel) statusLabel.innerText = "❌ يرجى تفعيل الأذونات للعمل";
        }
    }, (err) => console.error(err));
}

// 4. طلب جعل التطبيق "افتراضي" (ليتمكن من الحظر التلقائي)
function requestTruecallerMode() {
    // نستخدم التنبيه لتوجيه المستخدم لصفحة الإعدادات
    // بما أن إضافات الـ Role Manager تعطي 404، نستخدم الـ Intent المباشر
    if (window.cordova && cordova.plugins.settings) {
        setTimeout(() => {
            if (confirm("لتفعيل الحظر التلقائي مثل Truecaller، يجب اختيار SOS Japan Pro كـ 'تطبيق الهاتف الافتراضي'. هل تريد الانتقال للإعدادات الآن؟")) {
                cordova.plugins.settings.open("default_apps");
            }
        }, 3000); // تظهر بعد 3 ثوانٍ من تشغيل التطبيق
    }
}

// 5. مراقبة المكالمات الواردة
function startCallMonitor() {
    if (window.PhoneCallTrap) {
        window.PhoneCallTrap.onCall(function(state) {
            // ملاحظة: الرقم "000" تجريبي، في النسخة الفعلية يتم جلبه من إذن READ_CALL_LOG
            if (state === 'RINGING') {
                checkAndBlock("000"); 
            }
        });
    }
}

// 6. وظيفة الفحص والحظر التلقائي (الذكاء الاصطناعي للتطبيق)
function checkAndBlock(incomingNumber) {
    window.database.ref('spam_numbers/' + incomingNumber).once('value', (snapshot) => {
        if (snapshot.exists()) {
            // أ- تنفيذ الحظر (إنهاء المكالمة فوراً)
            if (window.PhoneCallTrap && window.PhoneCallTrap.endCall) {
                window.PhoneCallTrap.endCall();
            }

            // ب- اهتزاز الهاتف لتنبيهك
            navigator.vibrate(1000);

            // ج- إرسال إشعار Push يظهر في أعلى الشاشة (مثل تروكولر)
            if (window.cordova && cordova.plugins.notification.local) {
                cordova.plugins.notification.local.schedule({
                    title: '🚫 تم حظر مكالمة مزعجة',
                    text: 'الرقم ' + incomingNumber + ' مسجل كـ Spam في اليابان',
                    foreground: true,
                    priority: 2, // لجعل الإشعار يظهر في الأعلى (Heads-up)
                    vibrate: true
                });
            }
            
            // د- تنبيه داخلي (اختياري)
            console.log("تم الحظر بنجاح للرقم: " + incomingNumber);
        }
    });
}

// 7. عرض قائمة الأرقام المزعجة من فيرباس
function loadNumbersList() {
    const container = document.getElementById('list-content');
    window.database.ref('spam_numbers').on('value', (snapshot) => {
        if (container) {
            container.innerHTML = "";
            if (snapshot.exists()) {
                snapshot.forEach((child) => {
                    container.innerHTML += `
                        <div class="spam-item" style="border-bottom:1px solid #eee; padding:10px;">
                            <span>📞 ${child.key}</span> 
                            <span class="badge" style="background:red; color:white; padding:2px 5px; border-radius:5px; font-size:12px; float:left;">Spam</span>
                        </div>`;
                });
            } else {
                container.innerHTML = "قائمة الحظر فارغة حالياً";
            }
        }
    });
}
