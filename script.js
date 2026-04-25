// ================= 1. TOAST (แจ้งเตือน) =================
let toastTimer;
function showToast(msg) {
    const toast = document.getElementById('toast');
    document.getElementById('toast-text').innerText = msg;
    toast.classList.remove('hidden');
    void toast.offsetWidth; // Reflow
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}

// ================= 2. NAVIGATION =================
function navTo(pageId) {
    document.querySelectorAll('.page-section').forEach(sec => {
        sec.classList.remove('active'); sec.classList.add('hidden');
    });
    const target = document.getElementById(pageId);
    target.classList.remove('hidden');
    void target.offsetWidth; 
    target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ================= 3. DATABASE =================
let db = {};
const defaultDB = {
    web: [ { title: 'เว็บโอนเงิน 69.-', link: 'https://example.com', img: 'https://placehold.co/400x250/fff0f5/ff8da1?text=Web+Design' } ],
    id: [ { title: 'ป้ายสไตล์น่ารัก', img: 'https://placehold.co/400x400/fff0f5/ff8da1?text=ID+Banner' } ],
    decor: [], rov: [], idv: [], forms: [], course: []
};

function initData() {
    const saved = localStorage.getItem('studio_v3');
    if (saved) { db = JSON.parse(saved); } 
    else { db = defaultDB; saveDB(); }
    
    Object.keys(db).forEach(cat => renderGal(cat));
    renderHomeRecent(); // โหลดโชว์หน้าแรก
    loadStaticData();
}

function saveDB() { localStorage.setItem('studio_v3', JSON.stringify(db)); }

// ================= 4. RENDER =================
function renderGal(cat) {
    const cont = document.getElementById(`gal-${cat}`);
    if (!cont) return;
    cont.innerHTML = ''; 

    if (db[cat].length === 0) {
        cont.innerHTML = `<p style="text-align:center; color:#ccc; font-size:13px; grid-column:1/-1;">ยังไม่มีผลงานค่ะ 🌸</p>`;
        return;
    }

    db[cat].forEach((item, idx) => {
        const card = document.createElement('div');
        card.className = 'work-item';

        const isZoom = cat === 'id';
        const imgAct = isZoom ? `onclick="openZoom('${item.img}')"` : '';
        const zClass = isZoom ? 'zoomable' : '';
        
        const btnDel = `<button class="admin-ui btn-del-gal" onclick="delItem('${cat}', ${idx})"><i class="fa-solid fa-xmark"></i></button>`;
        const btnEditImg = `<button class="admin-ui btn-edit-gal" onclick="event.stopPropagation(); triggerImgUpload('${cat}', ${idx})"><i class="fa-solid fa-camera"></i></button>`;

        let html = `
            ${btnDel}
            <div class="img-box ${zClass}" ${imgAct}>
                <img src="${item.img}" alt="work">
                ${btnEditImg}
            </div>
            <h4 class="edit-text" id="txt-${cat}-${idx}">${item.title}</h4>
        `;

        if (!isZoom) {
            html += `<button class="btn-sm" onclick="openLink('${item.title}', '${item.link || '#'}')">ดูตัวอย่าง</button>`;
        }

        card.innerHTML = html;
        cont.appendChild(card);
    });

    if (document.body.classList.contains('admin-mode')) bindEditableText();
}

// โชว์ผลงานล่าสุด 5 ชิ้นในหน้าแรก (ดึงมาจากทุกหมวด)
function renderHomeRecent() {
    const cont = document.getElementById('home-recent-works');
    cont.innerHTML = '';
    let allWorks = [];
    Object.keys(db).forEach(cat => {
        db[cat].forEach(item => { allWorks.push({...item, cat}); });
    });
    
    // เอา 5 ชิ้นล่าสุด (จำลองโดยกลับด้าน array)
    allWorks.reverse().slice(0, 5).forEach(item => {
        const card = document.createElement('div');
        card.className = 'recent-card';
        card.innerHTML = `
            <img src="${item.img}" alt="${item.title}">
            <h4>${item.title}</h4>
        `;
        cont.appendChild(card);
    });
    
    if(allWorks.length === 0) cont.innerHTML = '<p style="font-size:12px; color:#aaa; padding:10px;">ยังไม่มีผลงานอัปเดตค่ะ</p>';
}

// ================= 5. ADD & DELETE (แก้บั๊กบันทึกไม่ได้) =================
let activeCat = '';
let tempImgBase64 = null; // ตัวแปรเก็บรูปที่อัปโหลดเตรียมเซฟ

function openAddModal(cat) {
    activeCat = cat;
    tempImgBase64 = null; // เคลียร์รูปเก่า
    document.getElementById('add-title').value = '';
    document.getElementById('add-link').value = '';
    document.getElementById('add-preview').src = 'https://placehold.co/400x250/fff0f5/ff8da1?text=Tap+to+Upload';
    document.getElementById('add-link').style.display = (cat === 'id') ? 'none' : 'block';
    document.getElementById('modal-add').classList.remove('hidden');
}

function previewAddImg(e) {
    if(e.target.files[0]){
        const r = new FileReader();
        r.onload = ev => {
            tempImgBase64 = ev.target.result; // เก็บรูปลงตัวแปร
            document.getElementById('add-preview').src = tempImgBase64;
        };
        r.readAsDataURL(e.target.files[0]);
    }
}

function saveNewItem() {
    const t = document.getElementById('add-title').value;
    const l = document.getElementById('add-link').value;

    // เช็คว่ากรอกชื่อและมีรูปที่อัปโหลดจริงๆ หรือยัง
    if (!t || !tempImgBase64) {
        alert('เอยจ๋า ใส่ชื่อผลงานและแตะเพื่ออัปโหลดรูปด้วยนะคะ 🥰'); 
        return;
    }

    db[activeCat].push({ title: t, link: l, img: tempImgBase64 });
    saveDB();
    renderGal(activeCat);
    renderHomeRecent(); // อัปเดตหน้าแรกด้วย
    closeModal('modal-add');
    showToast('เพิ่มผลงานเรียบร้อย! 🎉');
}

function delItem(cat, idx) {
    if (confirm('ลบงานนี้ทิ้งเลยนะคะ? 🗑️')) {
        db[cat].splice(idx, 1);
        saveDB();
        renderGal(cat);
        renderHomeRecent();
        showToast('ลบผลงานแล้วค่ะ');
    }
}

// ================= 6. UPLOAD IMAGES =================
let uploadTarget = {};

// ตัวนี้รองรับทั้งรูปโปรไฟล์ มาสคอต และรูปในแกลลอรี่
function triggerImgUpload(targetId, index = null) {
    if (index !== null) {
        uploadTarget = { type: 'gal', cat: targetId, idx: index };
    } else {
        uploadTarget = { type: 'static', id: targetId };
    }
    document.getElementById('global-uploader').click();
}

function handleGlobalUpload(e) {
    if(e.target.files[0]) {
        const r = new FileReader();
        r.onload = ev => {
            if (uploadTarget.type === 'static') {
                document.getElementById(uploadTarget.id).src = ev.target.result;
                localStorage.setItem(uploadTarget.id, ev.target.result);
            } else if (uploadTarget.type === 'gal') {
                db[uploadTarget.cat][uploadTarget.idx].img = ev.target.result;
                saveDB();
                renderGal(uploadTarget.cat);
                renderHomeRecent();
            }
            showToast('เปลี่ยนรูปภาพสำเร็จ! 📸');
        };
        r.readAsDataURL(e.target.files[0]);
    }
}

// ================= 7. ADMIN SYSTEM =================
function toggleAdmin() {
    if (document.body.classList.contains('admin-mode')) {
        if(confirm('ปิดโหมดแอดมินนะคะ? 🌸')) {
            document.body.classList.remove('admin-mode');
            document.querySelectorAll('[contenteditable="true"]').forEach(el => el.setAttribute('contenteditable', 'false'));
            showToast('ออกจากระบบจัดการร้าน');
        }
    } else {
        document.getElementById('login-pass').value = '';
        document.getElementById('login-err').classList.add('hidden');
        document.getElementById('modal-login').classList.remove('hidden');
    }
}

function verifyAdmin() {
    const p = document.getElementById('login-pass').value.trim().toLowerCase();
    if (p === "ss11") {
        closeModal('modal-login');
        document.body.classList.add('admin-mode');
        bindEditableText();
        showToast('เข้าสู่โหมดแอดมินเรียบร้อยค่ะ! 🔓');
    } else {
        document.getElementById('login-err').classList.remove('hidden');
    }
}

function bindEditableText() {
    document.querySelectorAll('.edit-text').forEach(el => {
        el.setAttribute('contenteditable', 'true');
        el.onblur = function() {
            if(!this.id) this.id = 'txt-' + Math.random().toString(36).substr(2, 9);
            if(this.id.startsWith('txt-') && this.id.split('-').length === 3) {
                const parts = this.id.split('-');
                if(db[parts[1]] && db[parts[1]][parts[2]]) {
                    db[parts[1]][parts[2]].title = this.innerText;
                    saveDB();
                }
            } else {
                localStorage.setItem(this.id, this.innerText);
            }
            showToast('บันทึกข้อความแล้ว 📝');
        };
    });
}

function loadStaticData() {
    ['img-profile', 'img-mascot'].forEach(id => {
        const saved = localStorage.getItem(id);
        if(saved) document.getElementById(id).src = saved;
    });

    document.querySelectorAll('.edit-text').forEach(el => {
        if (el.id && el.id.split('-').length !== 3) {
            const txt = localStorage.getItem(el.id);
            if(txt) el.innerText = txt;
        }
    });
}

// ================= 8. MODALS & UTILS =================
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }
function openZoom(src) { document.getElementById('zoom-img').src = src; document.getElementById('modal-img').classList.remove('hidden'); }
function openLink(t, u) { document.getElementById('link-title').innerText = t; document.getElementById('link-url').href = u || '#'; document.getElementById('modal-link').classList.remove('hidden'); }

window.onload = initData;
