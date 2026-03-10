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
    // 1. تهيئة السلايدر
    new Swiper('.swiper', { pagination: { el: '.swiper-pagination' } });

    // 2. تهيئة Firebase
    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    const db = firebase.database();

    // 3. فحص هل التطبيق هو الافتراضي حالياً لإخفاء الزر
    checkAppStatus();

    // 4. إعادة الفحص عند العودة من الإعدادات
    document.addEventListener("resume", checkAppStatus, false);

    // 5. ربط البيانات (أرقام وتنبيهات)
    syncData(db);
}

function checkAppStatus() {
    // نستخدم IntentShim لمحاولة طلب الدور؛ إذا لم تظهر نافذة، فالتطبيق مفعل
    // في شاومي، الأفضل هو فحص الاستجابة بعد العودة
    // سنقوم بإظهار صفحة التنبيهات إذا كان المستخدم قد ضغط الزر مسبقاً بنجاح
    if(localStorage.getItem('activated') === 'true') {
        document.getElementById('activate-btn').classList.add('hidden');
        document.getElementById('guide-slider').classList.add('hidden');
        document.getElementById('notif-page').style.display = 'block';
    }
}

function goToSettings() {
    if (window.plugins && window.plugins.intentShim) {
        window.plugins.intentShim.startActivity({
            action: "android.settings.MANAGE_DEFAULT_APPS_SETTINGS"
        }, () => {
            localStorage.setItem('activated', 'true');
        }, (err) => { alert("خطأ في فتح الإعدادات"); });
    }
}

function syncData(db) {
    // جلب الأرقام المحظورة
    db.ref('spam_numbers').on('value', (snap) => {
        const numbers = snap.val();
        localStorage.setItem('blocked_list', JSON.stringify(numbers));
    });

    // جلب التنبيهات الجديدة وإرسال Push Notification
    db.ref('alerts').on('child_added', (snap) => {
        const alertData = snap.val();
        renderAlert(alertData);
        sendPush(alertData.title, alertData.message);
    });
}

function renderAlert(data) {
    const container = document.getElementById('list-content');
    const html = `<div class="notif-card"><b>${data.title}</b><br><small>${data.message}</small></div>`;
    container.innerHTML = html + container.innerHTML;
}

function sendPush(title, msg) {
    if (window.cordova && cordova.plugins.notification) {
        cordova.plugins.notification.local.schedule({
            id: 1,
            title: title,
            text: msg,
            foreground: true,
            priority: 2
        });
    }
}
