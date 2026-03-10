function toggleBtn() {
    const isChecked = document.getElementById('terms-check').checked;
    document.getElementById('activate-btn').disabled = !isChecked;
}

function startActivation() {
    // إشعار تنبيهي سريع لتهيئة المستخدم والنظام
    alert("يرجى اختيار SOS Japan Pro من القائمة القادمة لضمان عمل الحظر");
    
    setTimeout(function() {
        if (window.plugins && window.plugins.intentShim) {
            window.plugins.intentShim.startActivity({
                action: "android.app.role.action.REQUEST_ROLE",
                extras: {
                    "android.app.role.extra.ROLE_NAME": "android.app.role.CALL_SCREENING"
                }
            }, 
            () => { console.log("Success Role Request"); }, 
            (err) => {
                // حل بديل في حال رفض شاومي للفتح المباشر
                window.plugins.intentShim.startActivity({
                    action: "android.settings.MANAGE_DEFAULT_APPS_SETTINGS"
                });
            });
        }
    }, 500);
}

// باقي كود الفيرباس ومراقبة المكالمات يتبع هنا...
