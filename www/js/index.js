document.addEventListener('deviceready', onDeviceReady, false);

// بيانات الفيرباس الخاصة بك يا زكي
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
    console.log("التطبيق جاهز للعمل...");

    // 1. تهيئة السلايدر (الشرح)
    if (typeof Swiper !== 'undefined') {
        new Swiper('.swiper', { pagination: { el: '.swiper-pagination' } });
    }

    // 2. تهيئة Firebase
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    const db = firebase.database();

    // 3. طلب الأذونات الأساسية فور التشغيل
    requestInitialPermissions();

    // 4. الفحص الحقيقي لحالة التطبيق (هل هو الافتراضي؟)
    checkRealAppStatus();

    // 5. إعادة الفحص تلقائياً عندما يعود المستخدم من الإعدادات إلى التطبيق
    document.addEventListener("resume", checkRealAppStatus, false);

    // 6. مزامنة البيانات من الفيرباس (أرقام وتنبيهات)
    syncFirebaseData(db);
}

// دالة طلب الأذونات (لضمان ظهور النوافذ في أندرويد 14)
function requestInitialPermissions() {
    const permissions = cordova.plugins.permissions;
    const list = [
        permissions.READ_PHONE_STATE,
        permissions.READ_CALL_LOG,
        permissions.ANSWER_PHONE_CALLS,
        permissions.POST_NOTIFICATIONS,
        permissions.SYSTEM_ALERT_WINDOW
    ];
    permissions.requestPermissions(list, (status) => {
        console.log("تمت معالجة طلب الأذونات");
    }, (err) => {
        console.error("خطأ في طلب الأذونات", err);
    });
}

// دالة الفحص الحقيقي (تمنع اختفاء الزر بالخطأ)
function checkRealAppStatus() {
    if (window.plugins && window.plugins.intentShim) {
        // نحاول طلب "الدور" (Role)؛ إذا كان التطبيق مفعل مسبقاً، النظام لن يظهر شيئاً أو سيعطي نتيجة OK
        window.plugins.intentShim.startActivityForResult({
            action: "android.app.role.action.REQUEST_ROLE",
            extras: {
                "android.app.role.extra.ROLE_NAME": "android.app.role.CALL_SCREENING"
            }
        }, 
        function(result) {
            // resultCode: -1 يعني أن المستخدم اختار التطبيق كافتراضي الآن
            if (result.resultCode === -1) {
                activateAppUI();
            } else {
                // إذا كانت النتيجة 0، نتحقق من الذاكرة (ربما تم التفعيل سابقاً)
                if(localStorage.getItem('is_permanently_activated') === 'true') {
                    activateAppUI();
                } else {
                    deactivateAppUI();
                }
            }
        }, 
        function(err) {
            console.error("فشل فحص الحالة الحقيقية", err);
        });
    }
}

// دالة الانتقال للإعدادات
function goToSettings() {
    if (window.plugins && window.plugins.intentShim) {
        // نفتح صفحة "التطبيقات الافتراضية" مباشرة
        window.plugins.intentShim.startActivity({
            action: "android.settings.MANAGE_DEFAULT_APPS_SETTINGS"
        }, 
        function() {
            console.log("تم فتح الإعدادات");
            // لا نخفي الزر هنا؛ ننتظر عودة المستخدم وفحص الحالة في resume
        }, 
        function(err) {
            alert("لا يمكن فتح الإعدادات حالياً");
        });
    }
}

function activateAppUI() {
    localStorage.setItem('is_permanently_activated', 'true');
    document.getElementById('activate-btn').classList.add('hidden');
    document.getElementById('guide-slider').classList.add('hidden');
    document.getElementById('notif-page').style.display = 'block';
}

function deactivateAppUI() {
    document.getElementById('activate-btn').classList.remove('hidden');
    document.getElementById('guide-slider').classList.remove('hidden');
    document.getElementById('notif-page').style.display = 'none';
}

function syncFirebaseData(db) {
    // جلب قائمة الأرقام المحظورة من الفيرباس وعرضها
    db.ref('spam_numbers').on('value', (snapshot) => {
        const container = document.getElementById('list-content');
        container.innerHTML = "";
        if (snapshot.exists()) {
            snapshot.forEach((child) => {
                container.innerHTML += `<div class="notif-card">🚫 رقم محظور: ${child.key}</div>`;
            });
        } else {
            container.innerHTML = "<p>لا توجد أرقام محظورة حالياً.</p>";
        }
    });

    // جلب التنبيهات الجديدة (Push Notifications)
    db.ref('alerts').on('child_added', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            sendSystemNotification(data.title, data.message);
        }
    });
}

function sendSystemNotification(title, msg) {
    if (window.cordova && cordova.plugins.notification) {
        cordova.plugins.notification.local.schedule({
            title: title,
            text: msg,
            foreground: true,
            priority: 2,
            vibrate: true
        });
    }
}
