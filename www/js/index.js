document.addEventListener('deviceready', onDeviceReady, false);

// 1. إعدادات Firebase الخاصة بك
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
    console.log("النظام جاهز...");

    // 2. تهيئة Firebase فوراً لضمان الاتصال
    try {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        window.database = firebase.database();
        
        // فحص حالة الاتصال وتحديث الواجهة
        const connectedRef = firebase.database().ref(".info/connected");
        connectedRef.on("value", (snap) => {
            const statusLabel = document.getElementById('status-text');
            if (snap.val() === true) {
                if (statusLabel) statusLabel.innerText = "✅ متصل بقاعدة البيانات";
            } else {
                if (statusLabel) statusLabel.innerText = "❌ جاري محاولة الاتصال...";
            }
        });
    } catch (e) {
        console.error("Firebase Error: " + e.message);
    }

    // 3. طلب الأذونات الشاملة (الموجودة في الـ YAML)
    const permissions = cordova.plugins.permissions;
    const list = [
        permissions.READ_PHONE_STATE,   // لمراقبة حالة الهاتف
        permissions.READ_CALL_LOG,     // لقراءة رقم المتصل
        permissions.ANSWER_PHONE_CALLS, // لإنهاء المكالمات المزعجة
        "android.permission.POST_NOTIFICATIONS" // للتنبيهات
    ];

    permissions.requestPermissions(list, (status) => {
        if (status.hasPermission) {
            startCallProtection();
            loadSpamList();
            
            // فتح نافذة "Set as default" يدوياً لمرة واحدة
            setTimeout(showSetupAlert, 2000);
        }
    }, (err) => console.error("Permission error", err));
}

// 4. وظيفة التوجيه للإعدادات (بديلة لـ Role Manager لتجنب أخطاء البناء)
function showSetupAlert() {
    if (window.cordova && cordova.plugins.settings) {
        navigator.notification.confirm(
            "لجعل التطبيق يعمل مثل Truecaller ويحظر تلقائياً، يجب اختياره كـ 'تطبيق الهاتف الافتراضي' من الإعدادات.",
            function(buttonIndex) {
                if (buttonIndex === 1) {
                    // فتح صفحة التطبيقات الافتراضية مباشرة
                    cordova.plugins.settings.open("default_apps");
                }
            },
            "خطوة هامة",
            ["افتح الإعدادات", "لاحقاً"]
        );
    }
}

// 5. مراقبة المكالمات الواردة باستخدام PhoneCallTrap
function startCallProtection() {
    if (window.PhoneCallTrap) {
        window.PhoneCallTrap.onCall(function(state) {
            if (state === 'RINGING') {
                // ملاحظة: هنا يجب تمرير الرقم القادم للفحص
                // في بعض نسخ أندرويد الحديثة يتم جلب الرقم من سجل المكالمات
                checkAndBlock("000"); 
            }
        });
    }
}

// 6. الفحص والحظر (Reject Call)
function checkAndBlock(incomingNumber) {
    window.database.ref('spam_numbers/' + incomingNumber).once('value', (snapshot) => {
        if (snapshot.exists()) {
            // أ- قطع المكالمة فوراً
            if (window.PhoneCallTrap && window.PhoneCallTrap.endCall) {
                window.PhoneCallTrap.endCall();
            }

            // ب- اهتزاز الهاتف
            navigator.vibrate(1000);

            // ج- إرسال إشعار محلي
            if (window.cordova && cordova.plugins.notification.local) {
                cordova.plugins.notification.local.schedule({
                    title: '🚫 حظر تلقائي',
                    text: 'تم إنهاء مكالمة من رقم مزعج: ' + incomingNumber,
                    foreground: true,
                    priority: 2
                });
            }
        }
    });
}

// 7. تحميل قائمة الأرقام لعرضها في التطبيق
function loadSpamList() {
    const listDiv = document.getElementById('list-content');
    window.database.ref('spam_numbers').on('value', (snapshot) => {
        if (listDiv) {
            listDiv.innerHTML = "";
            snapshot.forEach((child) => {
                listDiv.innerHTML += `
                    <div style="padding:10px; border-bottom:1px solid #ddd;">
                        <strong>📞 ${child.key}</strong>
                        <span style="color:red; float:left;">محظور</span>
                    </div>`;
            });
        }
    });
}
