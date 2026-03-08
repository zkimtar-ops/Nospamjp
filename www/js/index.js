document.addEventListener('deviceready', onDeviceReady, false);

// إعدادات Firebase
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
    // تحديث الحالة في الواجهة
    document.getElementById('status-indicator').innerText = "النظام يعمل - بانتظار الأذونات";

    // 1. طلب الأذونات فوراً
    const permissions = cordova.plugins.permissions;
    const list = [
        permissions.READ_PHONE_STATE,
        permissions.READ_CALL_LOG,
        "android.permission.POST_NOTIFICATIONS"
    ];

    permissions.requestPermissions(list, (status) => {
        if (status.hasPermission) {
            document.getElementById('status-indicator').innerText = "✅ متصل ونشط";
            document.getElementById('status-indicator').style.color = "green";
            initializeFirebase();
        } else {
            document.getElementById('status-indicator').innerText = "❌ الأذونات مرفوضة";
            document.getElementById('status-indicator').style.color = "red";
        }
    }, (err) => {
        console.error(err);
    });
}

function initializeFirebase() {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    // جعل المتغير متاحاً عالمياً
    window.database = firebase.database();
}

// كود الزر لعرض القائمة
document.getElementById('toggleSpamBtn').addEventListener('click', function() {
    const listDiv = document.getElementById('spamList');
    const container = document.getElementById('listContainer');
    
    if (listDiv.style.display === 'none' || listDiv.style.display === '') {
        listDiv.style.display = 'block';
        
        if (!window.database) {
            container.innerHTML = "يرجى منح الأذونات أولاً";
            return;
        }

        window.database.ref('spam_numbers').once('value', (snapshot) => {
            container.innerHTML = '';
            if (snapshot.exists()) {
                snapshot.forEach((child) => {
                    container.innerHTML += `<div class="spam-item">📞 ${child.key}</div>`;
                });
            } else {
                container.innerHTML = "القائمة فارغة";
            }
        }).catch(e => container.innerHTML = "خطأ: " + e.message);
    } else {
        listDiv.style.display = 'none';
    }
});
