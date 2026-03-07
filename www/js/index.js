document.addEventListener('deviceready', onDeviceReady, false);

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

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

function onDeviceReady() {
    console.log("تطبيق SOS Japan يعمل بنجاح");
    
    // طلب الصلاحيات
    const permissions = cordova.plugins.permissions;
    permissions.requestPermissions([
        permissions.READ_PHONE_STATE,
        permissions.READ_CALL_LOG
    ], (status) => {
        if(status.hasPermission) {
            console.log("الصلاحيات مفعلة");
        }
    });
}
