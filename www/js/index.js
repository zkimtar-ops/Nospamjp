// أضف هذا الكود في نهاية ملف index.js الحالي الخاص بك

document.getElementById('toggleSpamBtn').addEventListener('click', function() {
    const listDiv = document.getElementById('spamList');
    
    if (listDiv.style.display === 'none' || listDiv.style.display === '') {
        listDiv.style.display = 'block';
        loadSpamNumbers();
        this.innerText = 'إخفاء القائمة السوداء';
    } else {
        listDiv.style.display = 'none';
        this.innerText = 'عرض قائمة الأرقام المزعجة';
    }
});

function loadSpamNumbers() {
    const container = document.getElementById('listContainer');
    container.innerHTML = 'جاري الاتصال بقاعدة البيانات...';

    database.ref('spam_numbers').once('value', (snapshot) => {
        container.innerHTML = ''; // مسح رسالة التحميل
        
        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                const number = childSnapshot.key;
                const item = document.createElement('div');
                item.className = 'spam-item';
                item.innerHTML = `<span>📞 ${number}</span> <span style="color:red;">مشمول في الحظر</span>`;
                container.appendChild(item);
            });
        } else {
            container.innerHTML = '<p style="text-align:center;">لا توجد أرقام مضافة حالياً.</p>';
        }
    }).catch((err) => {
        container.innerHTML = '<p style="color:red;">خطأ في التحميل: ' + err.message + '</p>';
    });
}
