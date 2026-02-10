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

document.addEventListener('contextmenu', e => e.preventDefault());

// Hides YouTube branding and controls sharing
function formatYoutubeLink(url) {
    if (!url) return "";
    let vidId = "";
    if (url.includes("v=")) vidId = url.split("v=")[1].split("&")[0];
    else if (url.includes("youtu.be/")) vidId = url.split("youtu.be/")[1].split("?")[0];
    
    return `https://www.youtube.com/embed/${vidId}?modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&disablekb=1`;
}

// ADMIN LOGIC
function checkAdminPass() {
    if (document.getElementById('masterPass').value === SKILLBEE_MASTER_KEY) {
        document.getElementById('adminLock').style.display = 'none';
        document.getElementById('adminContent').style.display = 'block';
        viewStudents(); viewUploadedClasses();
    } else { alert("Access Denied"); }
}

function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
    document.getElementById(tabId).style.display = 'block';
}

async function addStudent() {
    const email = document.getElementById('sEmail').value;
    const pass = document.getElementById('sPass').value;
    const course = document.getElementById('sCourse');
    if(!email || pass.length < 6) { alert("Email and 6+ char password required"); return; }
    try {
        const cred = await auth.createUserWithEmailAndPassword(email, pass);
        await db.collection("students").doc(cred.user.uid).set({
            email, courseName: course.options[course.selectedIndex].text, courseId: course.value, uid: cred.user.uid
        });
        alert("Student Registered!"); viewStudents();
    } catch (e) { alert(e.message); }
}

function viewStudents() {
    const body = document.getElementById('studentListTable');
    db.collection("students").get().then(snap => {
        body.innerHTML = "";
        snap.forEach(doc => {
            const d = doc.data();
            body.innerHTML += `<tr><td>${d.email}</td><td><button onclick="deleteStudent('${doc.id}')" style="color:red">Delete</button></td></tr>`;
        });
    });
}

function deleteStudent(id) { if(confirm("Delete?")) db.collection("students").doc(id).delete().then(viewStudents); }

async function uploadClass() {
    const data = {
        courseId: document.getElementById('uploadCourseSelect').value,
        title: document.getElementById('classTitle').value,
        video: formatYoutubeLink(document.getElementById('vLink').value),
        notes: document.getElementById('classNotes').value,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };
    if(!data.title || !data.video) return alert("Fill required fields");
    await db.collection("course_content").add(data);
    alert("Class Added!"); viewUploadedClasses();
}

function viewUploadedClasses() {
    const body = document.getElementById('classListTable');
    db.collection("course_content").get().then(snap => {
        body.innerHTML = "";
        snap.forEach(doc => {
            body.innerHTML += `<tr><td>${doc.data().title}</td><td><button onclick="deleteClass('${doc.id}')">Delete</button></td></tr>`;
        });
    });
}

function deleteClass(id) { if(confirm("Delete?")) db.collection("course_content").doc(id).delete().then(viewUploadedClasses); }

// STUDENT LOGIC
function login() {
    const email = document.getElementById('lEmail').value;
    const pass = document.getElementById('lPass').value;
    auth.signInWithEmailAndPassword(email, pass).then(cred => {
        document.getElementById('loginView').style.display = 'none';
        document.getElementById('dashView').style.display = 'block';
        loadDashboard(cred.user.uid);
    }).catch(e => alert(e.message));
}

function loadDashboard(uid) {
    db.collection("students").doc(uid).get().then(doc => {
        const s = doc.data();
        document.getElementById('userName').innerText = "Hello, " + s.email;
        document.getElementById('assignedCourseName').innerText = s.courseName;
        db.collection("course_content").where("courseId", "==", s.courseId).get().then(snap => {
            const list = document.getElementById('lessonList'); list.innerHTML = "";
            snap.forEach(cDoc => {
                const lesson = cDoc.data();
                const btn = document.createElement('button');
                btn.className = "btn btn-enroll"; btn.innerText = lesson.title;
                btn.onclick = () => {
                    document.getElementById('mainVideo').src = lesson.video;
                    document.getElementById('currTitle').innerText = lesson.title;
                    document.getElementById('currNotes').innerText = lesson.notes;
                };
                list.appendChild(btn);
            });
        });
    });
}

function logout() { auth.signOut().then(() => location.reload()); }