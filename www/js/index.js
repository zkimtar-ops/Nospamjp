document.addEventListener('deviceready', onDeviceReady, false);

// بيانات مشروعك Nospam-9a4af
const firebaseConfig = {
  apiKey: "AIzaSyC8ABk0QLlocOBaUF7a_HeiQoMyOw9eDZc",
  authDomain: "nospam-9a4af.firebaseapp.com",
  databaseURL: "https://nospam-9a4af-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "nospam-9a4af",
  storageBucket: "nospam-9a4af.firebasestorage.app",
  messagingSenderId: "1000207356900",
  appId: "1:1000207356900:web:d1797e103304ce82aa2df1",
  measurementId: "G-TXMW4XPQPN"
};

// تهيئة Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

function onDeviceReady() {
    const permissions = cordova.plugins.permissions;
    const list = [permissions.READ_PHONE_STATE, permissions.READ_CALL_LOG];

    permissions.requestPermissions(list, (status) => {
        if(status.hasPermission) {
            setupListener();
        } else {
            document.getElementById('status').innerText = "خطأ: لم يتم تفعيل الصلاحيات";
            document.getElementById('status').className = "";
        }
    }, () => console.error("Permission error"));
}

function setupListener() {
    window.CallTrap.onCall(function(state) {
        // state.state تعيد RINGING عند ورود اتصال
        if (state.state === 'RINGING') {
            checkNumber(state.number);
        }
    });
}

function checkNumber(phoneNumber) {
    if (!phoneNumber) return;
    
    document.getElementById('call-log').innerText = "فحص: " + phoneNumber;

    // فحص الرقم في قاعدة البيانات (فرع spam_numbers)
    db.ref('spam_numbers').child(phoneNumber).once('value', (snapshot) => {
        if (snapshot.exists()) {
            // تنبيه بوجود رقم مزعج
            navigator.notification.alert(
                "تحذير! الرقم (" + phoneNumber + ") مصنف كمزعج.",
                null,
                "Japan SOS",
                "موافق"
            );
            document.getElementById('call-log').innerHTML = "<b style='color:red'>رقم مزعج: " + phoneNumber + "</b>";
        }
    });
}
