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
    new Swiper('.swiper', { pagination: { el: '.swiper-pagination' } });

    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    const db = firebase.database();

    // فحص الأذونات عند التشغيل
    requestPermissions();

    // فحص حالة التفعيل لإخفاء الزر
    checkAppStatus();
    document.addEventListener("resume", checkAppStatus, false);

    // جلب الأرقام والتنبيهات
    syncFirebase(db);
}

function requestPermissions() {
    const permissions = cordova.plugins.permissions;
    const list = [
        permissions.READ_PHONE_STATE,
        permissions.READ_CALL_LOG,
        permissions.ANSWER_PHONE_CALLS,
        permissions.SYSTEM_ALERT_WINDOW,
        permissions.POST_NOTIFICATIONS
    ];
    permissions.requestPermissions(list, (s) => console.log("OK"), (e) => console.error(e));
}

function checkAppStatus() {
    // إذا ضغط المستخدم على الزر سابقاً، نظهر صفحة التنبيهات
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
            checkAppStatus();
        }, (err) => alert("خطأ في فتح الإعدادات"));
    }
}

function syncFirebase(db) {
    // 1. جلب الأرقام المحظورة للعرض
    db.ref('spam_numbers').on('value', (snap) => {
        const container = document.getElementById('list-content');
        container.innerHTML = "";
        snap.forEach((child) => {
            container.innerHTML += `<div class="notif-card">📞 رقم محظور: ${child.key}</div>`;
        });
    });

    // 2. جلب التنبيهات وإرسال Push Notification
    db.ref('alerts').on('child_added', (snap) => {
        const data = snap.val();
        sendPush(data.title, data.message);
    });
}

function sendPush(title, msg) {
    if (window.cordova && cordova.plugins.notification) {
        cordova.plugins.notification.local.schedule({
            title: title,
            text: msg,
            foreground: true,
            priority: 2
        });
    }
}
