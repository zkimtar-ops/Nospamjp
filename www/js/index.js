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
    console.log("Cordova is ready");
    const statusLabel = document.getElementById('status-indicator');
    if(statusLabel) statusLabel.innerText = "جاري طلب الأذونات...";

    const permissions = cordova.plugins.permissions;
    const list = [
        permissions.READ_PHONE_STATE,
        permissions.READ_CALL_LOG,
        "android.permission.POST_NOTIFICATIONS"
    ];

    permissions.requestPermissions(list, (status) => {
        if (status.hasPermission) {
            if(statusLabel) {
                statusLabel.innerText = "✅ النظام نشط ومراقب";
                statusLabel.style.color = "green";
            }
            initializeFirebase();
            startCallMonitor(); // هذا هو الجزء الذي كان ناقصاً
        } else {
            if(statusLabel) statusLabel.innerText = "❌ الأذونات مرفوضة";
        }
    }, (err) => console.error(err));
}

function initializeFirebase() {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    window.database = firebase.database();
}

// --- الجزء الناقص: مراقبة المكالمات ---
function startCallMonitor() {
    if (window.CallTrap) {
        window.CallTrap.onCall(function(state) {
            // state تعيد حالة الهاتف (RINGING, OFFHOOK, IDLE) والرقم
            if (state.state === 'RINGING') {
                let incomingNumber = state.number;
                checkNumberInFirebase(incomingNumber);
            }
        });
    }
}

function checkNumberInFirebase(number) {
    if (!window.database) return;
    
    window.database.ref('spam_numbers/' + number).once('value', (snapshot) => {
        if (snapshot.exists()) {
            triggerWarning(number);
        }
    });
}

function triggerWarning(number) {
    // 1. اهتزاز الهاتف
    navigator.vibrate(2000); 

    // 2. إشعار محلي يظهر فوق المكالمة
    cordova.plugins.notification.local.schedule({
        title: '⚠️ تحذير: رقم مزعج!',
        text: 'الرقم ' + number + ' مسجل كـ Spam في اليابان',
        foreground: true,
        priority: 2
    });

    // 3. تنبيه صوتي بسيط
    alert("⚠️ تحذير أمني: رقم مزعج يتصل بك الآن!");
}

// --- كود الزر لعرض القائمة ---
document.getElementById('toggleSpamBtn').addEventListener('click', function() {
    const listDiv = document.getElementById('spamList');
    const container = document.getElementById('listContainer');
    
    if (listDiv.style.display === 'none' || listDiv.style.display === '') {
        listDiv.style.display = 'block';
        if (!window.database) {
            container.innerHTML = "يرجى منح الأذونات أولاً";
            return;
        }
        container.innerHTML = "جاري جلب البيانات...";
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
