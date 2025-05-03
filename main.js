// ===== شاشة الانتظار =====
function showLoader(msg) {
  document.getElementById("loader").style.display = "flex";
  document.querySelector("#loader .loader-text").textContent = msg || "الرجاء الانتظار قليلاً...";
}
function hideLoader() { document.getElementById("loader").style.display = "none"; }

// ===== إصلاح ظهور كل المودالات =====
window.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.modal').forEach(modal => {
    modal.style.display = "none";
  });
});

// ===== Toast Notification =====
const successSound = new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQgAAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI");
const errorSound = new Audio("data:audio/wav;base64,UklGRjQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAAAAgAAAAAAAgAAAAAAAgAAAAAAAgAAAAAAAgAAAAAAAgAAAAAAAgAA");
function showToast(msg, type="success") {
  const toast = document.getElementById("toast");
  toast.className = "toast toast-" + (type === "success" ? "success" : (type === "error" ? "error" : "warning"));
  toast.textContent = msg;
  toast.classList.add("show");
  if (type === "success") successSound.play();
  else if (type === "error") errorSound.play();
  setTimeout(()=>{ toast.classList.remove("show"); }, 2900);
}

// نافذة منبثقة موحدة للإغلاق
window.closeModal = function(modalId) {
  document.getElementById(modalId).style.display = "none";
};
// إغلاق بالنقر بالخارج
window.addEventListener('mousedown', function(e){
  document.querySelectorAll('.modal').forEach(modal => {
    if (modal.style.display === "flex" && !modal.querySelector('.modal-content').contains(e.target)) {
      modal.style.display = "none";
    }
  });
});

// ====== Firebase ======
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, updateDoc, doc, query, where, orderBy, serverTimestamp, deleteDoc, limit, setDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, createUserWithEmailAndPassword, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDwWMM-R4v02BfIcviIPxz5Q9qu-OIQXTQ",
  authDomain: "alsaria-net.firebaseapp.com",
  projectId: "alsaria-net",
  storageBucket: "alsaria-net.appspot.com",
  messagingSenderId: "115940202511",
  appId: "1:115940202511:web:f7a620c222a1204dbcab7a",
  measurementId: "G-NWLYRWSQBH"
};
const OWNER_EMAIL = "alsaria-net";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ========== إعدادات التطبيق ==========
let categories = [];
let prices = {};
const colors = {
  "100": "f100", "200": "f200", "250": "f250", "500": "f500", "1000": "f1000",
  "1500": "f1500", "2000": "f2000", "3000": "f3000", "4000": "f4000"
};
let allCategoriesDocId = "";
let isOwner = false;
let userData = {};
let allUsers = [];
let usersMap = {};
let cardsData = {};
let saleCounters = {};
let showAllLogs = false;
let soldContent = "";
let soldCategory = "";

// ========== إحصائيات الكروت ==========
async function updateStats() {
  cardsData = {};
  for (let cat of categories) cardsData[cat] = [];
  const q = query(collection(db, "cards"), where("sold", "==", false));
  const snapshot = await getDocs(q);
  snapshot.forEach(docx => {
    const d = docx.data();
    if (categories.includes(d.category)) cardsData[d.category].push({ id: docx.id, code: d.code });
  });
  const stats = document.getElementById("card-stats");
  stats.innerHTML = "";
  categories.forEach(cat => {
    const count = cardsData[cat].length;
    stats.innerHTML += `<div class="stat-circle ${colors[cat]||'f100'}">${cat}<br><span>${count}</span></div>`;
  });
}

// ========== مصادقة ودوال مستخدم ==========
window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('login-btn').onclick = async () => {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    document.getElementById("auth-error").textContent = "";
    showLoader("جاري تسجيل الدخول...");
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e) {
      showToast("بيانات الدخول غير صحيحة!", "error");
      document.getElementById("auth-error").textContent = "بيانات الدخول غير صحيحة!";
      hideLoader();
    }
  };
  document.getElementById('google-btn').onclick = async () => {
    const provider = new GoogleAuthProvider();
    showLoader("جاري الدخول عبر جوجل...");
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      showToast("فشل الدخول عبر جوجل!", "error");
      document.getElementById("auth-error").textContent = "فشل الدخول عبر جوجل!";
      hideLoader();
    }
  };
  document.getElementById('logout-btn').onclick = async () => {
    showLoader("جاري تسجيل الخروج...");
    try {
      await signOut(auth);
      hideLoader();
    } catch {
      hideLoader();
    }
  };
});

// ========== إنشاء حساب ==========
function generateAccountNumber() {
  return Math.floor(100 + Math.random() * 900);
}
async function uniqueAccountNumber() {
  let accNum, exists;
  do {
    accNum = generateAccountNumber();
    const q = query(collection(db, "users"), where("accountNumber", "==", accNum));
    const snap = await getDocs(q);
    exists = !snap.empty;
  } while (exists);
  return accNum;
}
document.getElementById('register-btn').onclick = () => {
  document.getElementById("register-modal").style.display = "flex";
  document.getElementById('reg-error').textContent = "";
};
document.getElementById("close-reg-modal").onclick = () => {
  document.getElementById("register-modal").style.display = "none";
};
document.getElementById("create-account-btn").onclick = async () => {
  const name = document.getElementById("reg-name").value.trim();
  const email = document.getElementById("reg-email").value.trim();
  const password = document.getElementById("reg-password").value.trim();
  const phone = document.getElementById("reg-phone").value.trim();
  if (!email || !password) {
    document.getElementById("reg-error").textContent = "يرجى تعبئة البريد وكلمة السر";
    return;
  }
  showLoader("جاري إنشاء الحساب...");
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const accNum = await uniqueAccountNumber();
    await addDoc(collection(db, "users"), {
      uid: userCredential.user.uid,
      email,
      name,
      phone,
      balance: 0,
      role: "user",
      permissions: {
        addCards: false,
        sellCards: true,
        seeAllLogs: false,
        transfer: false,
        managePermissions: false
      },
      accountNumber: accNum
    });
    document.getElementById("register-modal").style.display = "none";
    showToast("تم إنشاء الحساب بنجاح! يمكنك تسجيل الدخول.", "success");
    hideLoader();
  } catch (e) {
    document.getElementById("reg-error").textContent = "فشل إنشاء الحساب: " + (e.code?.includes("email-already-in-use") ? "البريد مستخدم من قبل" : e.message);
    showToast("فشل إنشاء الحساب!", "error");
    hideLoader();
  }
};

// ========== استعادة كلمة المرور ==========
document.getElementById('forgot-btn').onclick = () => {
  document.getElementById("forgot-modal").style.display = "flex";
  document.getElementById("forgot-error").textContent = "";
};
document.getElementById("close-forgot-modal").onclick = () => {
  document.getElementById("forgot-modal").style.display = "none";
};
document.getElementById("send-reset-btn").onclick = async () => {
  const email = document.getElementById("forgot-email").value.trim();
  if (!email) {
    document.getElementById("forgot-error").textContent = "يرجى إدخال البريد الإلكتروني";
    return;
  }
  showLoader("جاري إرسال رابط الاستعادة...");
  try {
    await sendPasswordResetEmail(auth, email);
    document.getElementById("forgot-modal").style.display = "none";
    showToast("تم إرسال رابط استعادة كلمة المرور إلى بريدك.", "success");
    hideLoader();
  } catch (e) {
    document.getElementById("forgot-error").textContent = "تعذر الإرسال: " + e.message;
    showToast("تعذر إرسال رابط الاستعادة!", "error");
    hideLoader();
  }
};

// ========== تحميل الفئات من قاعدة البيانات ==========
async function fetchCategories() {
  const snap = await getDocs(collection(db, "categories"));
  let found = false;
  snap.forEach(docx => {
    found = true;
    categories = docx.data().list;
    prices = docx.data().prices;
    allCategoriesDocId = docx.id;
  });
  if (!found) {
    categories = ["100", "200", "250", "500", "1000", "1500", "2000", "3000", "4000"];
    prices = {};
    categories.forEach(cat=>prices[cat]=parseInt(cat));
    const ref = await addDoc(collection(db, "categories"), {list: categories, prices});
    allCategoriesDocId = ref.id;
  }
}

// ========== متابعة حالة تسجيل الدخول ==========
onAuthStateChanged(auth, async (user) => {
  if (user) {
    showLoader("جاري تحميل البيانات...");
    await fetchCategories();
    await loadUsers();
    let q = query(collection(db, "users"), where("uid", "==", user.uid));
    let snap = await getDocs(q);
    if (!snap.empty) {
      userData = snap.docs[0].data();
      userData._docid = snap.docs[0].id;
    } else {
      userData = {
        uid: user.uid, email: user.email, role: "owner", balance: 0, accountNumber: 100, name: "مالك الشبكة",
        permissions: { addCards: true, sellCards: true, seeAllLogs: true, transfer: true, managePermissions:true }
      };
      await addDoc(collection(db, "users"), userData);
    }
    isOwner = userData.role === "owner" || (userData.email && userData.email.includes(OWNER_EMAIL));
    await postLoginUI();
    await initApp();
    hideLoader();
  } else {
    document.getElementById('main-section').style.display = "none";
    document.getElementById('auth-section').style.display = "";
    hideLoader();
  }
});

// ========== تحميل المستخدمين ==========
async function loadUsers() {
  usersMap = {};
  allUsers = [];
  const snap = await getDocs(collection(db, "users"));
  snap.forEach(docx => {
    const d = docx.data();
    d.id = docx.id;
    usersMap[d.uid] = d;
    if (d.accountNumber) usersMap[d.accountNumber] = d;
    allUsers.push(d);
  });
}

// ========== واجهة ما بعد الدخول ==========
async function postLoginUI() {
  document.getElementById('auth-section').style.display = "none";
  document.getElementById('main-section').style.display = "";
  document.getElementById("user-balance").textContent = `رصيدك الحالي: ${userData.balance ?? 0} ريال`;
  document.getElementById("user-account-number").textContent = `رقم حسابك: ${userData.accountNumber ?? "-"}`
  document.getElementById("user-name").textContent = userData.name ? `مرحباً ${userData.name}` : "";
  document.getElementById("add-cards-icon").style.display = (isOwner || userData.permissions?.addCards) ? "inline-block" : "none";
  document.getElementById("categories-btn").style.display = isOwner ? "" : "none";
  updateProfitIcon();
}

// ========== نافذة الأرباح للمستخدم العادي ==========
async function updateProfitIcon() {
  const profitDiv = document.getElementById("user-profit-icon");
  if (!isOwner && userData.role === "user") {
    let total = 0;
    const q = query(collection(db, "salesLog"), where("user", "==", userData.uid));
    const snap = await getDocs(q);
    snap.forEach(docx => {
      const d = docx.data();
      if(prices[d.category]) total += prices[d.category];
    });
    let profit = Math.round(total * 0.2);
    document.getElementById("user-profit").textContent = profit + " ر.س";
    profitDiv.style.display = "flex";
  } else {
    profitDiv.style.display = "none";
  }
}

// ========== نافذة صلاحيات المستخدمين الجديدة ==========
const ALL_PERMS = [
  {key: 'addCards', label: 'إدخال كروت', icon: '📝'},
  {key: 'sellCards', label: 'بيع كروت', icon: '💳'},
  {key: 'seeAllLogs', label: 'سجلات العمليات', icon: '📜'},
  {key: 'transfer', label: 'تحويل رصيد', icon: '💸'},
  {key: 'managePermissions', label: 'إدارة الصلاحيات', icon: '🛠️'}
];

document.getElementById("permissions-btn").onclick = async () => {
  if (isOwner || userData.permissions?.managePermissions) {
    const usersSel = document.getElementById('users-select');
    usersSel.innerHTML = '<option value="">اختر المستخدم</option>';
    allUsers.filter(u => u.role !== "owner").forEach(u=>{
      usersSel.innerHTML += `<option value="${u.id}">${u.name || u.email || u.accountNumber}</option>`;
    });
    document.getElementById('perms-section').style.display = "none";
    document.getElementById('perm-result').textContent = "";
    document.getElementById("permissions-modal").style.display = "flex";
  }
};

document.getElementById('users-select').onchange = function() {
  const userId = this.value;
  if (!userId) {
    document.getElementById('perms-section').style.display = "none";
    return;
  }
  const user = allUsers.find(u=>u.id===userId);
  if (!user) return;
  const userPerms = Object.assign({}, user.permissions);
  const permsList = document.getElementById('perms-list');
  permsList.innerHTML = "";
  ALL_PERMS.forEach(perm => {
    let state = userPerms[perm.key] === true ? 'active' : (userPerms[perm.key] === false ? 'inactive' : '');
    let icon = state === 'active' ? '✓' : (state==='inactive' ? '✗' : '');
    permsList.innerHTML += `<li data-key="${perm.key}" class="${state}">
      <span class="perm-label"><span class="perm-ico">${perm.icon}</span> ${perm.label}</span>
      <span class="perm-state">${icon}</span>
    </li>`;
  });
  document.getElementById('perms-section').style.display = "";

  Array.from(permsList.children).forEach(li=>{
    li.onclick = function() {
      if(this.classList.contains('active')) {
        this.classList.remove('active');
        this.classList.add('inactive');
        this.querySelector('.perm-state').textContent = '✗';
      } else {
        this.classList.remove('inactive');
        this.classList.add('active');
        this.querySelector('.perm-state').textContent = '✓';
      }
    };
  });
};

document.getElementById('save-perms-btn').onclick = async function() {
  const userId = document.getElementById('users-select').value;
  if (!userId) return;
  const user = allUsers.find(u=>u.id===userId);
  if (!user) return;
  let newPerms = {};
  Array.from(document.getElementById('perms-list').children).forEach(li=>{
    const key = li.getAttribute('data-key');
    if (li.classList.contains('active')) newPerms[key] = true;
    else if (li.classList.contains('inactive')) newPerms[key] = false;
  });
  try {
    await updateDoc(doc(db, "users", userId), {permissions: newPerms});
    showToast("تم حفظ الصلاحيات بنجاح","success");
    document.getElementById('perm-result').textContent = "";
    await loadUsers();
  } catch(e) {
    document.getElementById('perm-result').textContent = "حدث خطأ أثناء الحفظ";
  }
};

// ========== إدارة الفئات ==========
document.getElementById("categories-btn").onclick = async () => {
  await showCategoriesManager();
};
async function showCategoriesManager() {
  let html = `<table style="width:100%;font-size:16px;"><tr><th>الفئة</th><th>السعر</th><th>حذف</th></tr>`;
  categories.forEach(cat=>{
    html += `<tr>
      <td><input value="${cat}" id="cat-name-${cat}" style="width:60px;text-align:center"></td>
      <td><input value="${prices[cat]||cat}" id="cat-price-${cat}" style="width:65px;text-align:center"></td>
      <td>${cat !== '100' ? `<button onclick="deleteCategory('${cat}')">حذف</button>`:""}</td>
    </tr>`;
  });
  html += `</table>
    <input type="text" id="new-category" placeholder="إضافة فئة جديدة (رقم فقط)">
    <button id="add-category-btn">إضافة فئة</button>
    <button id="save-categories-btn" style="background:#43a047;">حفظ التغييرات</button>
    <div id="categories-error" class="error"></div>
  `;
  document.getElementById("categories-list").innerHTML = html;
  document.getElementById("categories-modal").style.display = "flex";
  document.getElementById("add-category-btn").onclick = ()=>{
    let val = document.getElementById("new-category").value.trim();
    if(!val || isNaN(val)) return showToast("أدخل قيمة رقمية للفئة!","error");
    if(categories.includes(val)) return showToast("الفئة موجودة بالفعل!","error");
    categories.push(val);
    prices[val]=parseInt(val);
    showCategoriesManager();
  };
  document.getElementById("save-categories-btn").onclick = async ()=>{
    let newList = [];
    let newPrices = {};
    const rows = categories.map(cat=>{
      let name = document.getElementById(`cat-name-${cat}`).value.trim();
      let price = document.getElementById(`cat-price-${cat}`).value.trim();
      if(!name || isNaN(name) || !price || isNaN(price)) return null;
      newList.push(name);
      newPrices[name]=parseInt(price);
      return true;
    }).filter(Boolean);
    if(newList.length===0) return showToast("لا يوجد فئات صحيحة","error");
    await updateDoc(doc(db, "categories", allCategoriesDocId), {list:newList, prices:newPrices});
    showToast("تم حفظ الفئات بنجاح","success");
    await fetchCategories();
    await renderSalesButtons();
    await updateStats();
    document.getElementById("categories-modal").style.display = "none";
  };
}
window.deleteCategory = function(cat) {
  categories = categories.filter(c=>c!==cat);
  delete prices[cat];
  showCategoriesManager();
};

// ========== وظائف التطبيق ==========
async function initApp() {
  renderSalesButtons();
  await updateStats();
  await updateTotal();
  await updateLog();
  await updateProfitIcon();
}

// ========== أزرار البيع ==========
function renderSalesButtons() {
  const container = document.getElementById("sales-buttons");
  container.innerHTML = "";
  categories.forEach(cat => {
    saleCounters[cat] = 0;
    container.innerHTML += `
      <div class="sales-card">
        <h3>فئة ${cat}</h3>
        <div class="counter">
          <button onclick="window.adjustCount('${cat}', -1)">-</button>
          <span id="count-${cat}">0</span>
          <button onclick="window.adjustCount('${cat}', 1)">+</button>
        </div>
        <button class="sell-btn" id="sell-${cat}" onclick="window.sellCards('${cat}')" disabled>بيع الكروت</button>
      </div>`;
  });
  let sel = document.getElementById("card-category");
  if(!sel) return;
  sel.innerHTML = "";
  categories.forEach(cat=>{
    sel.innerHTML += `<option value="${cat}">${cat}</option>`;
  });
}
window.adjustCount = function(cat, delta) {
  saleCounters[cat] = Math.max(0, saleCounters[cat] + delta);
  document.getElementById(`count-${cat}`).textContent = saleCounters[cat];
  document.getElementById(`sell-${cat}`).disabled = saleCounters[cat] === 0;
};
window.sellCards = async function(cat) {
  if (!isOwner && !userData.permissions?.sellCards) {
    showToast("ليست لديك صلاحية بيع الكروت.", "error");
    return;
  }
  const count = saleCounters[cat];
  if (!cardsData[cat] || cardsData[cat].length < count) {
    showToast("عدد الكروت غير كافٍ في هذه الفئة.", "error");
    return;
  }
  let price = prices[cat] * 0.8 * count;
  if (!isOwner && (userData.balance ?? 0) < price) {
    showToast("رصيدك غير كافٍ لإتمام هذه العملية.", "error");
    return;
  }
  showLoader("جاري بيع الكروت...");
  try {
    const sold = cardsData[cat].slice(0, count);
    const now = new Date();
    const time = now.toLocaleTimeString();
    const date = now.toLocaleDateString();
    for (let card of sold) {
      await updateDoc(doc(db, "cards", card.id), { sold: true, soldAt: serverTimestamp(), soldTo: userData.uid });
      await addDoc(collection(db, "salesLog"), {
        code: card.code,
        category: cat,
        date, time,
        soldAt: serverTimestamp(),
        user: userData.uid,
        userEmail: userData.email,
        userName: userData.name || ""
      });
    }
    if (!isOwner) {
      userData.balance = (userData.balance ?? 0) - price;
      await updateDoc(doc(db, "users", userData._docid), { balance: userData.balance });
      document.getElementById("user-balance").textContent = `رصيدك الحالي: ${userData.balance} ريال`;
      updateProfitIcon();
    }
    await updateStats();
    await updateTotal();
    saleCounters[cat] = 0;
    document.getElementById(`count-${cat}`).textContent = 0;
    document.getElementById(`sell-${cat}`).disabled = true;
    showModal(cat, sold.map(e => e.code));
    showToast("تم بيع الكروت بنجاح!", "success");
    hideLoader();
  } catch (e) {
    hideLoader();
    showToast("حدث خطأ أثناء البيع", "error");
  }
};
// ========== إدخال الكروت ==========
document.getElementById("add-cards-btn") && (document.getElementById("add-cards-btn").onclick = async () => {
  if (!isOwner && !userData.permissions?.addCards) {
    showToast("ليست لديك صلاحية إدخال الكروت.", "error");
    return;
  }
  const cat = document.getElementById("card-category").value;
  const lines = document.getElementById("cards-input").value.trim().split("\n").filter(Boolean);
  if (!lines.length) return showToast("لم يتم إدخال أي كروت.", "error");
  showLoader("جاري حفظ الكروت...");
  try {
    for (let code of lines) {
      await addDoc(collection(db, "cards"), { code, category: cat, sold: false });
    }
    document.getElementById("cards-input").value = "";
    await updateStats();
    document.getElementById("add-cards-modal").style.display = "none";
    showToast("تم حفظ الكروت بنجاح.", "success");
    hideLoader();
  } catch(e) {
    hideLoader();
    showToast("حدث خطأ أثناء حفظ الكروت", "error");
  }
});

// ========== سجل العمليات ==========
async function updateLog() {
  const table = document.getElementById("sales-log");
  table.innerHTML = "";
  let q;
  if (isOwner || userData.permissions?.seeAllLogs) {
    q = query(collection(db, "salesLog"), orderBy("soldAt", "desc")); // كل العمليات
    document.getElementById("log-title-suffix").textContent = "كل العمليات (من أول عملية حتى الآن)";
  } else {
    q = query(collection(db, "salesLog"), where("user", "==", userData.uid), orderBy("soldAt", "desc"), limit(500));
    document.getElementById("log-title-suffix").textContent = "سجلات عملياتك (آخر 500)";
  }
  const snapshot = await getDocs(q);
  snapshot.forEach(docx => {
    const d = docx.data();
    let uname = d.userName || (usersMap[d.user]?.name ?? "");
    let uemail = d.userEmail || (usersMap[d.user]?.email ?? "");
    let userDisplay = uname ? uname : (uemail ? uemail.split("@")[0] : "-");
    table.innerHTML += `<tr><td>${d.code}</td><td>${d.category}</td><td>${d.date}</td><td>${d.time}</td><td>${userDisplay}</td></tr>`;
  });
}
document.getElementById("toggle-log-btn") && (document.getElementById("toggle-log-btn").onclick = async () => {
  showAllLogs = !showAllLogs;
  await updateLog();
  document.getElementById("toggle-log-btn").textContent = showAllLogs ? "عرض أقل" : "عرض المزيد";
});
document.getElementById("search-box") && (document.getElementById("search-box").onkeyup = async function() {
  const val = this.value.trim();
  const table = document.getElementById("sales-log");
  table.innerHTML = "";
  let q = query(collection(db, "salesLog"), orderBy("soldAt", "desc"));
  const snapshot = await getDocs(q);
  snapshot.forEach(docx => {
    const d = docx.data();
    if (d.code.includes(val))
      table.innerHTML += `<tr><td>${d.code}</td><td>${d.category}</td><td>${d.date}</td><td>${d.time}</td><td>${d.userName || d.userEmail || "-"}</td></tr>`;
  });
});

// ========== نافذة الكروت المباعة ==========
function showModal(cat, codes) {
  document.getElementById("modal-title").textContent = `تم بيع ${codes.length} كروت من فئة ${cat}`;
  soldContent = codes.join("\n");
  soldCategory = cat;
  document.getElementById("modal-cards-list").textContent = soldContent;
  document.getElementById("result-modal").style.display = "flex";
}
document.getElementById("close-modal") && (document.getElementById("close-modal").onclick = () => {
  document.getElementById("result-modal").style.display = "none";
});
document.getElementById("copy-sold") && (document.getElementById("copy-sold").onclick = () => {
  navigator.clipboard.writeText(soldContent).then(() => showToast("تم نسخ الكروت.", "success"));
});
document.getElementById("whatsapp-sold") && (document.getElementById("whatsapp-sold").onclick = () => {
  let msg = `كروت ${soldCategory}:\n` + soldContent;
  let url = "https://wa.me/?text=" + encodeURIComponent(msg);
  window.open(url, '_blank');
});

// ========== تحويل الرصيد ==========
document.getElementById("transfer-btn-modal") && (document.getElementById("transfer-btn-modal").onclick = async () => {
  if (!isOwner && !userData.permissions?.transfer) {
    showToast("ليست لديك صلاحية تحويل الرصيد.", "error");
    return;
  }
  const accNum = document.getElementById('transfer-acc').value.trim();
  const amount = parseInt(document.getElementById('transfer-amount').value.trim());
  document.getElementById('transfer-result').textContent = "";
  if (!accNum || isNaN(amount) || amount <= 0) {
    document.getElementById('transfer-result').textContent = "يرجى إدخال رقم حساب صحيح ومبلغ أكبر من صفر";
    showToast("يرجى إدخال بيانات صحيحة.", "error");
    return;
  }
  showLoader("جاري تحويل الرصيد...");
  const q = query(collection(db, "users"), where("accountNumber", "==", parseInt(accNum)));
  const snap = await getDocs(q);
  if (snap.empty) {
    document.getElementById('transfer-result').textContent = "لم يتم العثور على مستخدم بهذا الرقم";
    showToast("لم يتم العثور على المستخدم.", "error");
    hideLoader();
    return;
  }
  const userDoc = snap.docs[0];
  const userRef = doc(db, "users", userDoc.id);
  const balanceNow = userDoc.data().balance || 0;
  await updateDoc(userRef, { balance: balanceNow + amount });
  await addDoc(collection(db, "transfers"), {
    from: userData.uid,
    to: userDoc.data().uid,
    toAccount: userDoc.data().accountNumber,
    toEmail: userDoc.data().email,
    toName: userDoc.data().name || "",
    amount,
    date: (new Date()).toLocaleDateString(),
    time: (new Date()).toLocaleTimeString(),
    at: serverTimestamp()
  });
  document.getElementById('transfer-result').textContent = "تم تحويل الرصيد بنجاح";
  showToast("تم تحويل الرصيد بنجاح", "success");
  await loadUsers();
  hideLoader();
});

// ========== تقرير التحويلات ==========
document.getElementById("show-transfer-report") && (document.getElementById("show-transfer-report").onclick = async () => {
  await renderTransferReport();
  document.getElementById("transfer-report-modal").style.display = "flex";
});
async function renderTransferReport() {
  const usersSnap = await getDocs(collection(db, "users"));
  const transfersSnap = await getDocs(collection(db, "transfers"));
  let report = {};
  transfersSnap.forEach(doc => {
    const tr = doc.data();
    if (!report[tr.toAccount]) report[tr.toAccount] = { count: 0, total: 0, details: [] };
    report[tr.toAccount].count += 1;
    report[tr.toAccount].total += tr.amount;
    report[tr.toAccount].details.push(tr);
  });
  let html = `<table style="font-size:15px;"><tr><th>رقم الحساب</th><th>الإسم</th><th>البريد</th><th>عدد العمليات</th><th>إجمالي الرصيد المحول</th><th>تفاصيل</th></tr>`;
  usersSnap.forEach(doc => {
    const u = doc.data();
    const acc = u.accountNumber;
    html += `<tr>
      <td>${acc}</td>
      <td>${u.name ?? "-"}</td>
      <td>${u.email}</td>
      <td>${report[acc]?.count || 0}</td>
      <td>${report[acc]?.total || 0}</td>
      <td>${report[acc]?.details ? `<button onclick="window.showTransferDetails(${acc})">عرض</button>` : "-"}</td>
    </tr>`;
  });
  html += "</table><div id='transfer-details-view'></div>";
  document.getElementById("transfer-report-table").innerHTML = html;
  window.showTransferDetails = function(acc) {
    if (!report[acc] || !report[acc].details) return;
    let dhtml = `<table style="font-size:14px;margin-top:8px;"><tr><th>التاريخ</th><th>الوقت</th><th>المبلغ</th></tr>`;
    for (let t of report[acc].details) {
      dhtml += `<tr><td>${t.date}</td><td>${t.time}</td><td>${t.amount}</td></tr>`;
    }
    dhtml += "</table>";
    document.getElementById('transfer-details-view').innerHTML = dhtml;
  };
};

// ===== حماية إضافية: أي لودر يبقى أكثر من 10 ثواني يتم إخفاؤه تلقائيًا =====
setInterval(()=>hideLoader(), 10000);

// ====== أزرار النوافذ ======
document.getElementById("transfer-btn-head") && (document.getElementById("transfer-btn-head").onclick = () => {
  document.getElementById("transfer-modal").style.display = "flex";
});
document.getElementById("add-cards-icon") && (document.getElementById("add-cards-icon").onclick = () => {
  document.getElementById("add-cards-modal").style.display = "flex";
});
document.getElementById("close-add-cards") && (document.getElementById("close-add-cards").onclick = () => {
  document.getElementById("add-cards-modal").style.display = "none";
});
