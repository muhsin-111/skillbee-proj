// ==========================================
// 1. FIREBASE CONFIGURATION
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyAWbCvCn8ldukhV8a0t5J75gqzVdwbj_GE",
  authDomain: "skillbee-5ee9e.firebaseapp.com",
  projectId: "skillbee-5ee9e",
  storageBucket: "skillbee-5ee9e.firebasestorage.app",
  messagingSenderId: "956829082860",
  appId: "1:956829082860:web:af0646329ca3969de431c9",
  measurementId: "G-7LQ6MYTSVR"
};

if (!firebase.apps.length) { firebase.initializeApp(firebaseConfig); }
const db = firebase.firestore();
const auth = firebase.auth();
const SKILLBEE_MASTER_KEY = "SkillBee@2026";

// Security
document.addEventListener('contextmenu', event => event.preventDefault());

function formatYoutubeLink(url) {
    if (!url) return "";
    if (url.includes("watch?v=")) return url.replace("watch?v=", "embed/").split('&')[0];
    if (url.includes("youtu.be/")) return url.replace("youtu.be/", "youtube.com/embed/").split('?')[0];
    return url;
}

// ==========================================
// 2. ADMIN FUNCTIONS
// ==========================================
function checkAdminPass() {
    if (document.getElementById('masterPass').value === SKILLBEE_MASTER_KEY) {
        document.getElementById('adminLock').style.display = 'none';
        document.getElementById('adminContent').style.display = 'block';
        viewStudents();
        viewUploadedClasses();
    } else { alert("Incorrect Password"); }
}

function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
    document.getElementById(tabId).style.display = 'block';
}

async function addStudent() {
    const email = document.getElementById('sEmail').value;
    const pass = document.getElementById('sPass').value;
    const courseSelect = document.getElementById('sCourse');
    const courseName = courseSelect.options[courseSelect.selectedIndex].text;
    const courseId = courseSelect.value;

    if(!email || !pass) { alert("Fill all fields"); return; }

    try {
        const cred = await auth.createUserWithEmailAndPassword(email, pass);
        await db.collection("students").doc(cred.user.uid).set({
            email, courseName, courseId, uid: cred.user.uid
        });
        alert("Student Added!");
        viewStudents();
    } catch (e) { alert(e.message); }
}

function viewStudents() {
    const table = document.getElementById('studentListTable');
    if(!table) return;
    db.collection("students").get().then((snap) => {
        table.innerHTML = "";
        snap.forEach((doc) => {
            const d = doc.data();
            table.innerHTML += `<tr style="border-bottom: 1px solid #ddd;"><td style="padding:10px;">${d.email}</td><td style="padding:10px;">${d.courseName}</td><td><button onclick="deleteStudent('${doc.id}')" style="color:red; border:none; background:none; cursor:pointer;">Delete</button></td></tr>`;
        });
    });
}

function deleteStudent(id) {
    if(confirm("Remove Student?")) { db.collection("students").doc(id).delete().then(() => viewStudents()); }
}

async function uploadClass() {
    const courseId = document.getElementById('uploadCourseSelect').value;
    const title = document.getElementById('classTitle').value;
    const video = formatYoutubeLink(document.getElementById('vLink').value);
    const notes = document.getElementById('classNotes').value;
    const pdf = document.getElementById('pdfLink').value;

    if(!title || !video) { alert("Title and Link required"); return; }

    try {
        await db.collection("course_content").add({
            courseId, title, video, notes, pdf, timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        alert("Class Uploaded!");
        viewUploadedClasses();
    } catch (e) { alert(e.message); }
}

function viewUploadedClasses() {
    const table = document.getElementById('classListTable');
    if(!table) return;
    db.collection("course_content").get().then((snap) => {
        table.innerHTML = "";
        snap.forEach((doc) => {
            const d = doc.data();
            table.innerHTML += `<tr style="border-bottom: 1px solid #ddd;"><td style="padding:10px;">${d.title}</td><td style="padding:10px;">${d.courseId}</td><td><button onclick="deleteClass('${doc.id}')" style="color:red; border:none; background:none; cursor:pointer;">Delete</button></td></tr>`;
        });
    });
}

function deleteClass(id) {
    if(confirm("Delete this class?")) { db.collection("course_content").doc(id).delete().then(() => viewUploadedClasses()); }
}

// ==========================================
// 3. STUDENT FUNCTIONS
// ==========================================
function login() {
    const email = document.getElementById('lEmail').value;
    const pass = document.getElementById('lPass').value;
    auth.signInWithEmailAndPassword(email, pass).then((cred) => {
        document.getElementById('loginView').style.display = 'none';
        document.getElementById('dashView').style.display = 'block';
        loadDashboard(cred.user.uid);
    }).catch(e => alert(e.message));
}

function loadDashboard(uid) {
    db.collection("students").doc(uid).get().then(doc => {
        const student = doc.data();
        document.getElementById('userName').innerText = "Welcome, " + student.email;
        document.getElementById('assignedCourseName').innerText = student.courseName;
        
        db.collection("course_content").where("courseId", "==", student.courseId).get().then(snap => {
            const list = document.getElementById('lessonList');
            list.innerHTML = "";
            snap.forEach(classDoc => {
                const lesson = classDoc.data();
                const btn = document.createElement('button');
                btn.className = "btn btn-enroll";
                btn.style.width = "100%"; btn.style.marginBottom = "8px";
                btn.innerText = lesson.title;
                btn.onclick = () => {
                    document.getElementById('mainVideo').src = lesson.video;
                    document.getElementById('currentLessonTitle').innerText = lesson.title;
                    document.getElementById('currentLessonNotes').innerText = lesson.notes;
                    document.getElementById('pdfArea').innerHTML = lesson.pdf ? `<a href="${lesson.pdf}" target="_blank" class="btn btn-access">Download PDF</a>` : "";
                };
                list.appendChild(btn);
            });
        });
    });
}

function logout() { auth.signOut().then(() => location.reload()); }