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

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();
const auth = firebase.auth();

// Master Admin Password
const SKILLBEE_MASTER_KEY = "SkillBee@2026";

// ==========================================
// 2. SECURITY & UTILS
// ==========================================
document.addEventListener('contextmenu', event => event.preventDefault());

function formatYoutubeLink(url) {
    if (!url) return "";
    if (url.includes("youtube.com/watch?v=")) {
        return url.replace("watch?v=", "embed/");
    } else if (url.includes("youtu.be/")) {
        return url.replace("youtu.be/", "youtube.com/embed/");
    }
    return url;
}

// ==========================================
// 3. ADMIN: FUNCTIONS
// ==========================================
function checkAdminPass() {
    const input = document.getElementById('masterPass').value;
    if (input === SKILLBEE_MASTER_KEY) {
        document.getElementById('adminLock').style.display = 'none';
        document.getElementById('adminContent').style.display = 'block';
        viewStudents();
    } else {
        alert("Incorrect Master Password.");
    }
}

function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
    document.getElementById(tabId).style.display = 'block';
}

async function addStudent() {
    // THIS LINE NOW WORKS BECAUSE WE FIXED ADMIN.HTML
    const email = document.getElementById('sEmail').value; 
    const pass = document.getElementById('sPass').value;
    const courseSelect = document.getElementById('sCourse');
    const courseName = courseSelect.options[courseSelect.selectedIndex].text;
    const courseId = courseSelect.value;

    if(!email || !pass) {
        alert("Please fill in email and password.");
        return;
    }

    try {
        const cred = await auth.createUserWithEmailAndPassword(email, pass);
        await db.collection("students").doc(cred.user.uid).set({
            email: email,
            courseName: courseName,
            courseId: courseId,
            uid: cred.user.uid
        });
        alert("Student Added Successfully!");
        // Clear fields
        document.getElementById('sEmail').value = "";
        document.getElementById('sPass').value = "";
        viewStudents();
    } catch (e) { alert("Error: " + e.message); }
}

function viewStudents() {
    const tableBody = document.getElementById('studentListTable');
    if(!tableBody) return;
    tableBody.innerHTML = "Loading...";

    db.collection("students").get().then((querySnapshot) => {
        tableBody.innerHTML = "";
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const row = `
                <tr style="border-bottom: 1px solid #ddd;">
                    <td style="padding: 10px;">${data.email}</td>
                    <td style="padding: 10px;">${data.courseName}</td>
                    <td style="padding: 10px;">
                        <button onclick="deleteStudent('${doc.id}')" style="color: red; border:none; background:none; cursor:pointer;">Delete</button>
                    </td>
                </tr>`;
            tableBody.innerHTML += row;
        });
    });
}

function deleteStudent(id) {
    if(confirm("Are you sure you want to remove this student?")) {
        db.collection("students").doc(id).delete().then(() => {
            alert("Student removed.");
            viewStudents();
        });
    }
}

async function uploadClass() {
    const course = document.getElementById('uploadCourseSelect').value;
    const title = document.getElementById('classTitle').value;
    const link = formatYoutubeLink(document.getElementById('vLink').value);
    const notes = document.getElementById('classNotes').value;
    const pdf = document.getElementById('pdfLink').value;

    if(!title || !link) {
        alert("Please provide at least a title and a video link.");
        return;
    }

    try {
        await db.collection("course_content").add({
            courseId: course,
            title: title,
            video: link,
            notes: notes,
            pdf: pdf,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        alert("Class Uploaded Successfully!");
        document.getElementById('classTitle').value = "";
        document.getElementById('vLink').value = "";
        document.getElementById('classNotes').value = "";
    } catch (e) { alert(e.message); }
}

// ==========================================
// 4. STUDENT: FUNCTIONS
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
        if (doc.exists) {
            const studentData = doc.data();
            document.getElementById('userName').innerText = "Welcome, " + studentData.email;
            document.getElementById('assignedCourseName').innerText = studentData.courseName;
            
            db.collection("course_content")
              .where("courseId", "==", studentData.courseId)
              .orderBy("timestamp", "asc")
              .get().then(querySnapshot => {
                const listDiv = document.getElementById('lessonList');
                listDiv.innerHTML = "";
                querySnapshot.forEach(classDoc => {
                    const lesson = classDoc.data();
                    const btn = document.createElement('button');
                    btn.className = "btn btn-enroll";
                    btn.style.width = "100%";
                    btn.style.marginBottom = "8px";
                    btn.innerText = lesson.title;
                    btn.onclick = () => playLesson(lesson);
                    listDiv.appendChild(btn);
                });
            });
        }
    });
}

function playLesson(lesson) {
    document.getElementById('mainVideo').src = lesson.video + "?rel=0&modestbranding=1";
    document.getElementById('currentLessonTitle').innerText = lesson.title;
    document.getElementById('currentLessonNotes').innerText = lesson.notes;
    
    const pdfArea = document.getElementById('pdfArea');
    if(lesson.pdf) {
        pdfArea.innerHTML = `<a href="${lesson.pdf}" target="_blank" class="btn btn-access">Download PDF Notes</a>`;
    } else {
        pdfArea.innerHTML = "";
    }
}

function logout() {
    auth.signOut().then(() => location.reload());
}