console.log("Robotics Lab App Loading...");
gsap.registerPlugin(ScrollTrigger);

const scene = document.getElementById('scene');
const cards = document.querySelectorAll('.tunnel-card');
const overlay = document.getElementById('overlay');
const closeBtn = document.getElementById('close-overlay');
const contentBody = document.getElementById('content-body');
const restartBtn = document.getElementById('restart-btn');
const restartContainer = document.getElementById('restart-container');

const totalDepth = 8000; 
const zStep = 2500;
const cardsCount = cards.length;
const sceneMaxZ = (cardsCount - 1) * zStep;
const startZ = -1000; 

// --- Authentication & Persistence Logic ---
let currentUser = null;
let editingId = null; 

function initAuth() {
    const loginScreen = document.getElementById('login-screen');
    const navLoginBtn = document.getElementById('nav-login-btn');
    const closeLoginBtn = document.getElementById('close-login');
    const loginBtn = document.getElementById('login-btn');
    const signupLink = document.getElementById('signup-link');
    const userIdInput = document.getElementById('user-id');
    const userPwInput = document.getElementById('user-pw');
    const logoutBtn = document.getElementById('logout-btn');

    // Sidebar Navigation
    document.querySelectorAll('.nav-link').forEach((link, idx) => {
        link.onclick = (e) => {
            e.preventDefault();
            // 해당 섹션으로 스크롤 이동 후 열기
            const targetProgress = (idx * zStep) / (sceneMaxZ + 1000);
            const scrollMax = document.documentElement.scrollHeight - window.innerHeight;
            window.scrollTo({ top: targetProgress * scrollMax, behavior: 'smooth' });
            setTimeout(() => showContent(idx), 300);
        };
    });

    navLoginBtn.addEventListener('click', () => loginScreen.classList.remove('hidden'));
    closeLoginBtn.addEventListener('click', () => loginScreen.classList.add('hidden'));

    logoutBtn.addEventListener('click', (e) => { e.preventDefault(); logout(); });

    // Profile Dropdown Links
    const goMyPage = document.getElementById('go-mypage');
    const goSettings = document.getElementById('go-settings');
    if (goMyPage) goMyPage.onclick = (e) => { e.preventDefault(); showContent('mypage'); };
    if (goSettings) goSettings.onclick = (e) => { e.preventDefault(); showContent('settings'); };

    const savedSession = localStorage.getItem('current_user_session');
    if (savedSession) login(savedSession);

    loginBtn.addEventListener('click', () => {
        const id = userIdInput.value.trim();
        const pw = userPwInput.value.trim();
        if (!id || !pw) return alert("ID/PW를 입력해주세요.");
        const users = JSON.parse(localStorage.getItem('campus_users') || '{}');
        if (users[id] && users[id].pw === pw) login(id);
        else alert("정보가 일치하지 않습니다.");
    });

    signupLink.addEventListener('click', (e) => {
        e.preventDefault();
        const id = userIdInput.value.trim();
        const pw = userPwInput.value.trim();
        const users = JSON.parse(localStorage.getItem('campus_users') || '{}');
        if (users[id]) return alert("이미 존재합니다.");
        users[id] = { pw: pw, tasks: [], timetable: [], grade: "1" };
        localStorage.setItem('campus_users', JSON.stringify(users));
        alert("가입 완료!");
    });

    // Subject Modal Setup
    const subModal = document.getElementById('subject-modal');
    if (subModal) {
        document.getElementById('close-subject-modal').onclick = () => { subModal.classList.add('hidden'); editingId = null; };
        document.getElementById('add-sub-confirm').onclick = saveSubject;
        document.getElementById('del-sub-btn').onclick = deleteSubject;
    }
}

function login(id) {
    currentUser = id;
    localStorage.setItem('current_user_session', id);
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('nav-login-btn').classList.add('hidden');
    document.getElementById('user-profile').classList.remove('hidden');
    document.getElementById('user-display-name').innerText = id;
    document.getElementById('dropdown-user-id').innerText = `@${id}`;
    updateTicker();
}

function logout() {
    currentUser = null;
    localStorage.removeItem('current_user_session');
    document.getElementById('nav-login-btn').classList.remove('hidden');
    document.getElementById('user-profile').classList.add('hidden');
    updateTicker();
}

// --- MY PAGE & SETTINGS ---
function initMyPage() {
    if (!currentUser) return;
    const users = JSON.parse(localStorage.getItem('campus_users') || '{}');
    const userData = users[currentUser];

    const gradeSelect = document.getElementById('my-grade');
    const saveBtn = document.getElementById('save-profile-btn');
    const displayId = document.getElementById('display-id');
    const displayPw = document.getElementById('display-pw');
    const togglePw = document.getElementById('toggle-pw-view');

    if (displayId) displayId.innerText = currentUser;
    if (gradeSelect) gradeSelect.value = userData.grade || "1";
    
    if (saveBtn) {
        saveBtn.onclick = () => {
            users[currentUser].grade = gradeSelect.value;
            localStorage.setItem('campus_users', JSON.stringify(users));
            alert("프로필 정보가 저장되었습니다.");
        };
    }

    if (togglePw && displayPw) {
        togglePw.onclick = () => {
            if (displayPw.type === 'password') {
                displayPw.type = 'text';
                displayPw.value = userData.pw;
                togglePw.innerText = "숨기기";
            } else {
                displayPw.type = 'password';
                displayPw.value = "********";
                togglePw.innerText = "보이기";
            }
        };
    }
}

function initSettings() {
    const themeBtns = document.querySelectorAll('.theme-btn');
    themeBtns.forEach(btn => {
        btn.onclick = () => {
            themeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const theme = btn.dataset.theme;
            if (theme === 'light') document.body.classList.add('light-mode');
            else document.body.classList.remove('light-mode');
            localStorage.setItem('app_theme', theme);
        };
    });
}

// --- TIMETABLE ENGINE ---
function getTimetable() {
    if (!currentUser) return [];
    const users = JSON.parse(localStorage.getItem('campus_users') || '{}');
    return users[currentUser]?.timetable || [];
}

function renderTimetable() {
    const dayGrid = document.getElementById('dynamic-day-grid');
    const weeklyGrid = document.querySelector('.timetable-grid');
    if (!dayGrid || !weeklyGrid) return;
    const data = getTimetable();
    document.querySelectorAll('.grid-slot').forEach(el => el.remove());
    document.querySelectorAll('.subject-list').forEach(el => el.innerHTML = '');

    data.forEach(sub => {
        const dayCol = weeklyGrid.querySelector(`.day-column[data-day="${sub.day}"]`);
        if (dayCol) {
            const slot = document.createElement('div');
            slot.className = `grid-slot ${sub.color}`;
            slot.style.gridRow = `${sub.start} / ${sub.end}`;
            slot.innerText = sub.name;
            slot.onclick = () => openEditModal(sub);
            dayCol.appendChild(slot);
        }
        const dayCardList = dayGrid.querySelector(`.day-card[data-day="${sub.day}"] .subject-list`);
        if (dayCardList) {
            const li = document.createElement('li');
            li.innerText = `${sub.name} (${(sub.start + 7).toString().padStart(2, '0')}:00~${(sub.end + 7).toString().padStart(2, '0')}:00)`;
            li.onclick = () => openEditModal(sub);
            dayCardList.appendChild(li);
        }
    });
}

function openEditModal(sub) {
    editingId = sub.id;
    document.getElementById('sub-name').value = sub.name;
    document.getElementById('sub-day').value = sub.day;
    document.getElementById('sub-color').value = sub.color;
    document.getElementById('sub-start').value = sub.start;
    document.getElementById('sub-end').value = sub.end;
    document.getElementById('add-sub-confirm').innerText = "UPDATE";
    document.getElementById('del-sub-btn').classList.remove('hidden');
    document.getElementById('subject-modal').classList.remove('hidden');
}

function openAddModal() {
    editingId = null;
    document.getElementById('sub-name').value = '';
    document.getElementById('add-sub-confirm').innerText = "ADD";
    document.getElementById('del-sub-btn').classList.add('hidden');
    document.getElementById('subject-modal').classList.remove('hidden');
}

function saveSubject() {
    if (!currentUser) return alert("로그인 필요");
    const name = document.getElementById('sub-name').value.trim();
    const day = document.getElementById('sub-day').value;
    const color = document.getElementById('sub-color').value;
    const start = parseInt(document.getElementById('sub-start').value);
    const end = parseInt(document.getElementById('sub-end').value);
    if (!name) return alert("과목명 입력");
    const users = JSON.parse(localStorage.getItem('campus_users'));
    if (editingId) {
        const idx = users[currentUser].timetable.findIndex(s => s.id === editingId);
        users[currentUser].timetable[idx] = { id: editingId, name, day, color, start, end };
    } else {
        users[currentUser].timetable.push({ id: Date.now(), name, day, color, start, end });
    }
    localStorage.setItem('campus_users', JSON.stringify(users));
    document.getElementById('subject-modal').classList.add('hidden');
    renderTimetable();
}

function deleteSubject() {
    const users = JSON.parse(localStorage.getItem('campus_users'));
    users[currentUser].timetable = users[currentUser].timetable.filter(s => s.id !== editingId);
    localStorage.setItem('campus_users', JSON.stringify(users));
    document.getElementById('subject-modal').classList.add('hidden');
    renderTimetable();
}

// --- NOTICE ENGINE ---
const mockNotices = {
    univ: [
        { id: 1, title: "[RISE사업] 2026년 RISE사업 기업 기술지원 프로그램 참여 산업체 모집", date: "2026.05.12", badge: "univ", url: "https://www.dongyang.ac.kr/bbs/dmu/677/250950/artclView.do" },
        { id: 2, title: "[교수학습] 2026학년도 1학기 재학생 학습법 특강 안내", date: "2026.05.12", badge: "univ", url: "https://www.dongyang.ac.kr/bbs/dmu/677/250942/artclView.do" },
        { id: 3, title: "2026년 미래여성경제인육성사업 창업아이디어 멘토링 권리화 ·IP 프로그램 참여학생 모집", date: "2026.05.08", badge: "univ", url: "https://www.dongyang.ac.kr/bbs/dmu/677/250917/artclView.do" },
        { id: 4, title: "수도권 전문대학 SCOUT사업단 「아이템 투 마켓: 미니멀 셀러」 프로그램 참여 학생 모집", date: "2026.05.08", badge: "univ", url: "https://www.dongyang.ac.kr/bbs/dmu/677/250916/artclView.do" },
        { id: 5, title: "[필독] 2026년도 학생 법정의무교육(eClass 원격수업) 시행 안내", date: "2026.05.08", badge: "univ", url: "https://www.dongyang.ac.kr/bbs/dmu/677/250911/artclView.do" }
    ],
    dept: [
        { id: 101, title: "[취업지원센터] 2026-1 이력서 사진 촬영 지원 프로그램 신청 안내", date: "2026.05.12", badge: "dept", url: "https://www.dongyang.ac.kr/bbs/dmu/100/250948/artclView.do" },
        { id: 102, title: "[필수] 2026년도 법정의무교육 시행 안내", date: "2026.05.11", badge: "dept", url: "https://www.dongyang.ac.kr/bbs/dmu/100/250924/artclView.do" },
        { id: 103, title: "Lam Research Korea FST 지원자 모집", date: "2026.05.07", badge: "dept", url: "https://www.dongyang.ac.kr/bbs/dmu/100/250902/artclView.do" },
        { id: 104, title: "CAD 실무 (C4강좌) 휴보강 공지", date: "2026.05.04", badge: "dept", url: "https://www.dongyang.ac.kr/bbs/dmu/100/250883/artclView.do" },
        { id: 105, title: "[반도체협회] 부트캠프 전문대학 대상 ASM 코리아 3차 채용 공고", date: "2026.04.28", badge: "dept", url: "https://www.dongyang.ac.kr/bbs/dmu/100/250858/artclView.do" }
    ]
};
function renderNotices(category = 'univ') {
    const list = document.getElementById('dynamic-notice-list');
    if (!list) return; list.innerHTML = '';
    mockNotices[category].forEach(item => {
        const div = document.createElement('div');
        div.className = 'notice-item';
        div.innerHTML = `<span class="notice-badge badge-${item.badge}">${item.badge === 'univ' ? '학교' : '학과'}</span><span class="notice-title">${item.title}</span><span class="notice-date">${item.date}</span>`;
        div.onclick = () => window.open(item.url, '_blank');
        list.appendChild(div);
    });
}

// --- CORE ENGINE ---
function updateScene() {
    const scrollPos = window.scrollY;
    const scrollMax = document.documentElement.scrollHeight - window.innerHeight;
    const progress = Math.min(1, Math.max(0, scrollPos / scrollMax));
    if (restartContainer) {
        if (progress > 0.95) gsap.to(restartContainer, { opacity: 1, y: 0, duration: 0.5, pointerEvents: 'all' });
        else gsap.to(restartContainer, { opacity: 0, y: 20, duration: 0.3, pointerEvents: 'none' });
    }
    const currentZ = (progress * (sceneMaxZ + 1000)) + startZ;
    gsap.to(scene, { z: currentZ, duration: 0.5, ease: "power2.out" });
    cards.forEach((card, index) => {
        const cardZ = -index * zStep;
        const globalZ = currentZ + cardZ;
        let opacity = 1;
        if (globalZ > 0) opacity = Math.max(0, 1 - globalZ / 1000);
        else if (Math.abs(globalZ) > 3500) opacity = Math.max(0, 1 - (Math.abs(globalZ) - 3500) / 1000);
        gsap.to(card, { opacity: opacity, duration: 0.3 });
    });
}

function showContent(idOrIndex, immediate = false) {
    let template;
    let index = -1;
    if (typeof idOrIndex === 'string') {
        template = document.getElementById(`tpl-${idOrIndex}`);
    } else {
        index = idOrIndex;
        template = document.getElementById(`tpl-section${index + 1}`) || document.getElementById('tpl-section1');
        location.hash = `section${index + 1}`;
    }
    if (!template) return;
    contentBody.innerHTML = '';
    contentBody.appendChild(template.content.cloneNode(true));
    
    if (index === 0) { renderTimetable(); document.querySelectorAll('#open-add-sub-1, #open-add-sub-2').forEach(b => b.onclick = openAddModal); }
    if (index === 1) { 
        renderNotices('univ'); 
        document.querySelectorAll('.notice-tab').forEach(t => t.onclick = () => {
            document.querySelectorAll('.notice-tab').forEach(x => x.classList.remove('active'));
            t.classList.add('active'); renderNotices(t.dataset.category);
        });
    }
    if (index === 2) setTimeout(initPlanner, 10);
    if (index === 3) setTimeout(initGPA, 10);
    if (idOrIndex === 'mypage') initMyPage();
    if (idOrIndex === 'settings') initSettings();

    if (immediate) {
        gsap.set(overlay, { display: 'block', opacity: 1 });
        document.body.classList.add('overlay-active');
    } else {
        gsap.set(overlay, { display: 'block', opacity: 0 });
        gsap.to(overlay, { opacity: 1, duration: 0.5, onStart: () => document.body.classList.add('overlay-active') });
    }
    document.body.style.overflow = 'hidden';
}

window.addEventListener('scroll', updateScene);
window.addEventListener('load', () => {
    updateScene();
    const initHash = location.hash;
    if (initHash && initHash.startsWith('#section')) {
        const index = parseInt(initHash.replace('#section', '')) - 1;
        if (!isNaN(index) && index >= 0 && index < cards.length) {
            // 해당 섹션 즉시 열기 (애니메이션 없이)
            showContent(index, true);
        }
    }
});
if (restartBtn) restartBtn.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });

cards.forEach((card, index) => {
    card.addEventListener('click', () => {
        const cardZ = -index * zStep;
        const targetProgress = (index * zStep) / (sceneMaxZ + 1000);
        const scrollMax = document.documentElement.scrollHeight - window.innerHeight;
        window.scrollTo({ top: targetProgress * scrollMax, behavior: 'auto' });
        const tx = parseFloat(getComputedStyle(card).getPropertyValue('--tx')) || 0;
        const tl = gsap.timeline();
        tl.to(scene, { z: -cardZ + 800, x: -tx, duration: 0.8, ease: "power2.inOut" });
        tl.to(card, { scale: 2, opacity: 0, duration: 0.8 }, "-=0.8");
        tl.call(() => showContent(index));
    });
});

closeBtn.addEventListener('click', () => {
    gsap.to(overlay, {
        opacity: 0, duration: 0.4, ease: "power2.out",
        onComplete: () => {
            overlay.style.display = 'none';
            document.body.style.overflow = '';
            document.body.classList.remove('overlay-active');
            
            // 해시값 제거 (새로고침 시 다시 열리지 않도록)
            location.hash = "";
            history.replaceState(null, null, ' '); 

            gsap.to(scene, { x: 0, duration: 0.6, ease: "power2.inOut" });
            const allCards = document.querySelectorAll('.tunnel-card');
            allCards.forEach(c => gsap.to(c, { scale: 1, opacity: 1, duration: 0.6 }));
            updateScene();
        }
    });
});

// --- PLANNER LOGIC ---
let currentMonth = new Date();
let selectedDate = new Date();
let todos = [];
function initPlanner() {
    const userKey = currentUser || 'guest';
    todos = JSON.parse(localStorage.getItem(`todos_${userKey}`) || '[]');
    document.getElementById('prev-month').onclick = () => { currentMonth.setMonth(currentMonth.getMonth() - 1); renderCalendar(); };
    document.getElementById('next-month').onclick = () => { currentMonth.setMonth(currentMonth.getMonth() + 1); renderCalendar(); };
    document.getElementById('add-todo-btn').onclick = addTodo;
    const input = document.getElementById('todo-input');
    if (input) input.onkeypress = (e) => { if (e.key === 'Enter') addTodo(); };
    renderCalendar(); renderTodos();
}
function formatDate(date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    const monthYearText = document.getElementById('calendar-month-year');
    if (!grid) return; grid.innerHTML = '';
    const year = currentMonth.getFullYear(), month = currentMonth.getMonth();
    const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
    monthYearText.innerText = `${monthNames[month]} ${year}`;
    const firstDay = new Date(year, month, 1).getDay(), lastDate = new Date(year, month + 1, 0).getDate();
    for (let i = 0; i < firstDay; i++) { const empty = document.createElement('div'); empty.className = 'calendar-day other-month'; grid.appendChild(empty); }
    for (let i = 1; i <= lastDate; i++) {
        const dayDate = new Date(year, month, i), dayStr = formatDate(dayDate), day = document.createElement('div');
        day.className = 'calendar-day'; if (dayStr === formatDate(new Date())) day.classList.add('today'); if (dayStr === formatDate(selectedDate)) day.classList.add('selected');
        day.innerHTML = `${i}`; if (todos.some(t => t.date === dayStr)) { const dot = document.createElement('div'); dot.className = 'todo-dot'; day.appendChild(dot); }
        day.onclick = () => { selectedDate = dayDate; renderCalendar(); renderTodos(); }; grid.appendChild(day);
    }
}
function addTodo() {
    const input = document.getElementById('todo-input'); if (!input || !input.value.trim()) return;
    todos.push({ id: Date.now(), name: input.value.trim(), date: formatDate(selectedDate), completed: false });
    saveTodos(); renderTodos(); renderCalendar(); updateTicker(); input.value = '';
}
function renderTodos() {
    const list = document.getElementById('dynamic-todo-list');
    const dateDisplay = document.getElementById('selected-date-display');
    if (!list) return;
    list.innerHTML = '';
    const dayStr = formatDate(selectedDate);
    
    // MMDD 형식으로 날짜 표시 업데이트
    if (dateDisplay) {
        const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const dd = String(selectedDate.getDate()).padStart(2, '0');
        dateDisplay.innerText = mm + dd;
    }

    const dayTodos = todos.filter(t => t.date === dayStr);
    if (dayTodos.length === 0) { list.innerHTML = `<li style="opacity: 0.3; padding: 2rem; text-align: center;">${dayStr} 일정이 없습니다.</li>`; return; }
    dayTodos.forEach(todo => {
        const li = document.createElement('li'); li.className = 'todo-item';
        li.innerHTML = `<div class="todo-item-content"><div class="todo-checkbox ${todo.completed ? 'checked' : ''}" onclick="toggleTodo(${todo.id})"></div><span class="todo-text ${todo.completed ? 'completed' : ''}">${todo.name}</span></div><button class="delete-todo" onclick="deleteTodo(${todo.id})">×</button>`;
        list.appendChild(li);
    });
}
function toggleTodo(id) { todos = todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t); saveTodos(); renderTodos(); renderCalendar(); updateTicker(); }
function deleteTodo(id) { todos = todos.filter(t => t.id !== id); saveTodos(); renderTodos(); renderCalendar(); updateTicker(); }
function saveTodos() { localStorage.setItem(`todos_${currentUser || 'guest'}`, JSON.stringify(todos)); }

// --- GPA LOGIC ---
let gpaData = [];
function initGPA() {
    const userKey = currentUser || 'guest';
    gpaData = JSON.parse(localStorage.getItem(`gpa_${userKey}`) || '[]');
    document.getElementById('add-gpa-btn').onclick = addGPASubject;
    renderGPA();
}
function addGPASubject() {
    const subIn = document.getElementById('gpa-subject'), creditIn = document.getElementById('gpa-credit'), gradeIn = document.getElementById('gpa-grade');
    if (!subIn || !subIn.value.trim()) return alert("과목명 입력");
    gpaData.push({ id: Date.now(), name: subIn.value.trim(), credit: parseInt(creditIn.value), grade: parseFloat(gradeIn.value), gradeText: gradeIn.options[gradeIn.selectedIndex].text });
    saveGPA(); renderGPA(); subIn.value = '';
}
function deleteGPASubject(id) { gpaData = gpaData.filter(i => i.id !== id); saveGPA(); renderGPA(); }
function saveGPA() { localStorage.setItem(`gpa_${currentUser || 'guest'}`, JSON.stringify(gpaData)); }
function renderGPA() {
    const list = document.getElementById('dynamic-gpa-list'), avgText = document.getElementById('average-gpa'), totalText = document.getElementById('total-credits');
    if (!list) return; list.innerHTML = ''; let tc = 0, ws = 0;
    gpaData.forEach(item => {
        tc += item.credit; ws += (item.credit * item.grade);
        const li = document.createElement('li'); li.className = 'gpa-item';
        li.innerHTML = `<span class="gpa-sub-name">${item.name}</span><span>${item.credit}학점</span><span class="gpa-sub-grade">${item.gradeText}</span><button class="del-gpa" onclick="deleteGPASubject(${item.id})">×</button>`;
        list.appendChild(li);
    });
    avgText.innerText = (tc === 0 ? 0 : ws / tc).toFixed(2); totalText.innerText = tc;
}
function updateTicker() {
    const ticker = document.getElementById('assignment-ticker') || document.querySelector('.ticker-text span:last-child');
    if (!ticker) return;
    const userKey = currentUser || 'guest';
    const savedPlannerTodos = JSON.parse(localStorage.getItem(`todos_${userKey}`) || '[]');
    const count = savedPlannerTodos.filter(t => !t.completed).length;
    ticker.innerText = `과제가 ${count}개 있습니다`;
}

initAuth();
updateTicker();
