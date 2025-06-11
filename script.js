// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase, ref, child, get, push, update, remove, onValue } from "firebase/database";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD8fLaWZvNiC58YxlN2CyHKt0MUgWyM-zc",
  authDomain: "student-ms-532c9.firebaseapp.com",
  databaseURL: "https://student-ms-532c9-default-rtdb.firebaseio.com",
  projectId: "student-ms-532c9",
  storageBucket: "student-ms-532c9.firebasestorage.app",
  messagingSenderId: "826040686479",
  appId: "1:826040686479:web:0a18acff49f7a44fa99dfa",
  measurementId: "G-C5QHLSPGSV" // Note: If you're not using Analytics, you might not need this or the import
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// Get Realtime Database service instance
const database = getDatabase(app); // Pass the initialized app to getDatabase
// Create a reference to the 'students' node
const studentsRef = ref(database, 'students');

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
    // Use get(studentsRef) to fetch the data once
    const snapshot = await get(studentsRef);
    const students = snapshot.val() || {};
    return !Object.keys(students).some(id => students[id].studentId === studentId && id !== excludeId);
}

function displayStudents(data = []) {
    studentBody.innerHTML = '';
    data.forEach(({ id, student }) => {
        const row = document.createElement('tr');
        // Using `id` (the Firebase key) here, make sure your HTML handles this,
        // the original code was using student.studentId for display which is fine.
        // Let's stick to using the actual data for display.
         row.innerHTML = `
            <td>${student.studentId}</td>
            <td>${student.fullName}</td>
            <td>${student.department}</td>
            <td>${student.level}</td>
            <td>${student.email}</td>
            <td>
                <a href="#" onclick="editStudent('${id}'); return false;">Edit</a>
                <a href="#" onclick="deleteStudent('${id}'); return false;" class="ml-2">Delete</a>
            </td>
        `;
        // Added href="#" and return false to links to prevent page reload
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

    const student = { studentId, fullName, department, level, email };

    try {
        if (editId) {
            // Use update() with child() to update a specific student
            await update(child(studentsRef, editId), student);
            alert('Student updated');
            editId = null;
            addBtn.textContent = 'Add Student';
        } else {
            // Use push() to add a new student with an auto-generated key
            await push(studentsRef, student);
            alert('Student added');
        }
        studentForm.reset();
    } catch (error) {
        alert('Error saving student: ' + error.message);
    }
}

async function editStudent(id) {
    try {
        // Use get() with child() to fetch a single student's data once
        const snapshot = await get(child(studentsRef, id));
        const student = snapshot.val();
        if (!student) {
            return alert('Student not found');
        }
        studentIdInput.value = student.studentId;
        fullNameInput.value = student.fullName;
        departmentInput.value = student.department;
        levelInput.value = student.level;
        emailInput.value = student.email;
        editId = id; // Store the Firebase key
        addBtn.textContent = 'Update Student';
    } catch (error) {
        alert('Error loading student: ' + error.message);
    }
}

async function deleteStudent(id) {
    if (confirm('Are you sure you want to delete this student?')) {
        try {
            // Use remove() with child() to delete a specific student
            await remove(child(studentsRef, id));
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
        // Use get() to fetch all student data once
        const snapshot = await get(studentsRef);
        const students = snapshot.val() || {};
        const data = Object.values(students); // Export just the student objects, not the Firebase keys
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
                // Basic validation for imported data format
                if (Array.isArray(imported) && imported.every(s => s && typeof s === 'object' && s.studentId && s.fullName && s.department && s.level && s.email)) {
                     const uniqueIds = new Set(imported.map(s => s.studentId));
                    if (uniqueIds.size === imported.length) {
                        // Optionally clear existing data before importing
                        // await remove(studentsRef); // uncomment this line if you want to replace existing data

                        // Import each student by pushing them
                        for (const student of imported) {
                            await push(studentsRef, student);
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
            } finally {
                // Reset the file input to allow importing the same file again if needed
                importFile.value = '';
            }
        };
        reader.readAsText(file);
    }
}

// Real-time listener using onValue()
onValue(studentsRef, (snapshot) => {
    // snapshot contains all the data at the 'students' node
    const studentsData = snapshot.val() || {}; // Get the data as a JavaScript object
    // Convert the object into an array where each item is { id: firebaseKey, student: studentObject }
    const studentsArray = Object.entries(studentsData).map(([id, student]) => ({ id, student }));

    // Display and search (search will filter the data received by the listener)
    searchStudents(studentsArray); // Apply search filter to the data received
});

studentForm.addEventListener('submit', addStudent);

// Updated search listener to filter the currently displayed data
// (Assuming the onValue listener has populated the displayStudents/searchStudents)
// If you want search to trigger a *new* fetch each time, revert this part to using get()
searchInput.addEventListener('input', () => {
    // The onValue listener already fetches the data and calls searchStudents
    // So we don't need to fetch it again here.
    // We just need to re-apply the search filter to the current data.
    // However, the current searchStudents function is called with a potentially filtered array,
    // so we need access to the full, unfiltered array from the listener.
    // Let's modify the listener to store the full array globally or pass it around.

    // A simpler approach for now, if the real-time list is small, is to refetch:
     get(studentsRef).then(snapshot => {
        const studentsData = snapshot.val() || {};
        const studentsArray = Object.entries(studentsData).map(([id, student]) => ({ id, student }));
        searchStudents(studentsArray); // Apply search filter to the newly fetched data
    }).catch(error => {
        console.error("Error fetching students for search:", error);
    });
});

exportBtn.addEventListener('click', exportData);
importBtn.addEventListener('click', () => importFile.click());
importFile.addEventListener('change', importData);
