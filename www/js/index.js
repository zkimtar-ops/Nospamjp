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
    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    const db = firebase.database();

    // 1. فحص الحالة فور فتح التطبيق
    checkRealRoleStatus();

    // 2. إعادة الفحص فور عودة المستخدم من شاشة الإعدادات (أهم خطوة)
    document.addEventListener("resume", () => {
        console.log("عاد المستخدم للتطبيق، جاري فحص الحالة الحقيقية...");
        checkRealRoleStatus();
    }, false);

    // ربط البيانات
    syncFirebase(db);
}

// هذه الدالة لا تعتمد على الضغط، بل تسأل نظام أندرويد عن حالته
function checkRealRoleStatus() {
    if (window.plugins && window.plugins.intentShim) {
        /* نحاول فتح طلب "الدور" (Role Request)؛ 
           في أندرويد، إذا كان التطبيق مفعلاً مسبقاً، النظام لن يفتح النافذة 
           وسيعيد نتيجة فورية تخبرنا أن التطبيق "لديه الدور" بالفعل.
        */
        window.plugins.intentShim.startActivityForResult({
            action: "android.app.role.action.REQUEST_ROLE",
            extras: {
                "android.app.role.extra.ROLE_NAME": "android.app.role.CALL_SCREENING"
            }
        }, 
        function(result) {
            // result.resultCode سيكون -1 إذا وافق المستخدم الآن أو كان مفعلاً مسبقاً
            if (result.resultCode === -1) {
                console.log("تأكيد: التطبيق هو الافتراضي حالياً.");
                showProtectedUI(); // إخفاء الزر وإظهار التنبيهات
            } else {
                console.log("تنبيه: المستخدم لم يختار التطبيق كافتراضي.");
                showActivationUI(); // إبقاء الزر ظاهراً
            }
        }, 
        function(err) {
            console.error("فشل فحص الحالة", err);
        });
    }
}

function goToSettings() {
    if (window.plugins && window.plugins.intentShim) {
        // نفتح الإعدادات ولا نغير أي شيء في الواجهة هنا
        window.plugins.intentShim.startActivity({
            action: "android.settings.MANAGE_DEFAULT_APPS_SETTINGS"
        }, 
        () => { console.log("تم فتح الإعدادات بنجاح"); }, 
        (err) => { alert("خطأ في فتح الإعدادات"); }
        );
    }
}

function showProtectedUI() {
    document.getElementById('activate-btn').classList.add('hidden');
    document.getElementById('guide-slider').classList.add('hidden');
    document.getElementById('notif-page').style.display = 'block';
}

function showActivationUI() {
    document.getElementById('activate-btn').classList.remove('hidden');
    document.getElementById('guide-slider').classList.remove('hidden');
    document.getElementById('notif-page').style.display = 'none';
}

function syncFirebase(db) {
    db.ref('spam_numbers').on('value', (snap) => {
        const container = document.getElementById('list-content');
        container.innerHTML = "";
        snap.forEach((child) => {
            container.innerHTML += `<div class="notif-card">📞 محظور: ${child.key}</div>`;
        });
    });
}
