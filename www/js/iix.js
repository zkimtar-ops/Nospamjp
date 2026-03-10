document.addEventListener('deviceready', function() {
    var permissions = cordova.plugins.permissions;
    var list = [
        permissions.READ_PHONE_STATE,
        permissions.READ_CALL_LOG,
        permissions.ANSWER_PHONE_CALLS,
        permissions.READ_PHONE_NUMBERS,
        permissions.CALL_PHONE,
        permissions.SYSTEM_ALERT_WINDOW // طلب إذن الرسم فوق التطبيقات
    ];

    // طلب كل الصلاحيات دفعة واحدة عند التشغيل
    permissions.requestPermissions(list, function(status) {
        if(!status.hasPermission) {
            console.warn("لم يتم منح كافة الصلاحيات!");
        }
    }, function() {
        console.error("خطأ في طلب الصلاحيات");
    });
}, false);

function startActivation() {
    // محاكاة ضغطة المستخدم لفتح شاشة تروكولر
    if (window.plugins && window.plugins.intentShim) {
        window.plugins.intentShim.startActivity({
            action: "android.app.role.action.REQUEST_ROLE",
            extras: {
                "android.app.role.extra.ROLE_NAME": "android.app.role.CALL_SCREENING"
            }
        }, 
        () => { alert("نجح فتح نافذة الاختيار!"); }, 
        (err) => {
            // إذا فشل (وهذا وارد في شاومي)، نفتح الإعدادات يدوياً
            alert("سيتم نقلك للإعدادات الافتراضية، اختر تطبيقنا هناك");
            window.plugins.intentShim.startActivity({
                action: "android.settings.MANAGE_DEFAULT_APPS_SETTINGS"
            });
        });
    }
}
