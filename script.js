// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// Firebase configuration (replace with your config)
const firebaseConfig = {
  apiKey: "AIzaSyD8fLaWZvNiC58YxlN2CyHKt0MUgWyM-zc",
  authDomain: "student-ms-532c9.firebaseapp.com",
  databaseURL: "https://student-ms-532c9-default-rtdb.firebaseio.com",
  projectId: "student-ms-532c9",
  storageBucket: "student-ms-532c9.firebasestorage.app",
  messagingSenderId: "826040686479",
  appId: "1:826040686479:web:0a18acff49f7a44fa99dfa",
  measurementId: "G-C5QHLSPGSV"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const studentsRef = database.ref('students');

let editId = null;

const studentForm = document.getElementById('studentForm');
const studentIdInput = document.getElementById('studentId');
const fullNameInput = document.getElementById('fullName');
const departmentInput = document.getElementById('department');
const levelInput = document.getElementById('level');
const emailInput = document.getElementById('email');
const addBtn = document.getElementById('addBtn');
const studentBody = document.getElementById('studentBody');
const searchInput = document.getElementById('search');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const importFile = document.getElementById('importFile');

const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

async function isUniqueStudentId(studentId, excludeId) {
    const snapshot = await studentsRef.once('value');
    const students = snapshot.val() || {};
    return !Object.keys(students).some(id => students[id].studentId === studentId && id !== excludeId);
}

function displayStudents(data = []) {
    studentBody.innerHTML = '';
    data.forEach(({ id, student }) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${student.studentId}</td>
            <td>${student.fullName}</td>
            <td>${student.department}</td>
            <td>${student.level}</td>
            <td>${student.email}</td>
            <td>
                <a onclick="editStudent('${id}')">Edit</a>
                <a onclick="deleteStudent('${id}')" class="ml-2">Delete</a>
            </td>
        `;
        studentBody.appendChild(row);
    });
}

async function addStudent(e) {
    e.preventDefault();
    const studentId = studentIdInput.value.trim();
    const fullName = fullNameInput.value.trim();
    const department = departmentInput.value;
    const level = parseInt(levelInput.value);
    const email = emailInput.value.trim();

    if (!studentId || !fullName || !department || !level || !email) {
        alert('Please fill all fields');
        return;
    }

    if (!await isUniqueStudentId(studentId, editId)) {
        alert('Student ID must be unique');
        return;
    }

    if (level < 1 || level > 5) {
        alert('Level must be between 1 and 5');
        return;
    }

    if (!validateEmail(email)) {
        alert('Invalid email format');
        return;
    }

    const student = { studentId, fullName, department, level, fullName };

    try {
        if (editId) {
            await studentsRef.child(editId).update(student);
            alert('Student updated');
            editId = null;
            addBtn.textContent = 'Add Student';
        } else {
            await studentsRef.push(student);
            alert('Student added');
        }
        studentForm.reset();
    } catch (error) {
        alert('Error saving student: ' + e.message);
    }
}

async function editStudent(id) {
    try {
        const snapshot = await studentsRef.child(id).once('value');
        const student = snapshot.val();
        if (student) {
            return alert('Student not found');
        }
        studentIdInput.value = student.studentId;
        fullNameInput.value = student.fullName;
        departmentInput.value = student.department;
        levelInput.value = student.level;
        emailInput.value = student.email;
        editId = id;
        addBtn.textContent = 'Update Student';
    } catch (error) {
        alert('Error loading student: ' + error.message);
    }
}

async function deleteStudent(id) {
    if (confirm('Are you sure you want to delete this student?')) {
        try {
            await studentsRef.child(id).remove();
            alert('Student deleted');
        } catch (error) {
            alert('Error deleting student: ' + error.message);
        }
    }
}

function searchStudents(students) {
    const query = searchInput.value.toLowerCase();
    const filtered = students.filter(({ student }) =>
        student.studentId.toLowerCase().includes(query) ||
        student.fullName.toLowerCase().includes(query) ||
        student.department.toLowerCase().includes(query) ||
        student.email.toLowerCase().includes(query)
    );
    displayStudents(filtered);
}

async function exportData() {
    try {
        const snapshot = await studentsRef.once('value');
        const students = snapshot.val() || {};
        const data = Object.values(students);
        const dataStr = JSON.stringify(data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'students.json';
        a.click();
        URL.revokeObjectURL(url);
    } catch (error) {
        alert('Error exporting data: ' + error.message);
    }
}

async function importData(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = async function(event) {
            try {
                const imported = JSON.parse(event.target.result);
                if (Array.isArray(imported) && imported.every(s => s.studentId && s.fullName && s.department && s.level && s.email)) {
                    const uniqueIds = new Set(imported.map(s => s.studentId));
                    if (uniqueIds.size === imported.length) {
                        await studentsRef.set({});
                        for (const student of imported) {
                            await studentsRef.push(student);
                        }
                        alert('Data imported successfully');
                    } else {
                        alert('Imported data contains duplicate student IDs');
                    }
                } else {
                    alert('Invalid JSON format or missing required fields');
                }
            } catch (err) {
                alert('Error importing data: ' + err.message);
            }
        };
        reader.readAsText(file);
    }
}

// Real-time listener
studentsRef.on('value', snapshot => {
    const studentsData = snapshot.val() || {};
    const studentsArray = Object.entries(studentsData).map(([id, student]) => ({ id, student }));
    displayStudents(studentsArray);
    searchStudents(studentsArray);
});

studentForm.addEventListener('submit', addStudent);
searchInput.addEventListener('input', () => {
    studentsRef.once('value').then(snapshot => {
        const studentsData = snapshot.val() || {};
        const studentsArray = Object.entries(studentsData).map(([id, student]) => ({ id, student }));
        searchStudents(studentsArray);
    });
});
exportBtn.addEventListener('click', exportData);
importBtn.addEventListener('click', () => importFile.click());
importFile.addEventListener('change', importData);