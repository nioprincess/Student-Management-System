let students = JSON.parse(localStorage.getItem('students')) || [];
let editIndex = -1;

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

function to validate email format
const validateEmail = function(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

function isUniqueStudentId(studentId, excludeIndex) {
    return !students.some((student, index) => student.studentId === studentId && index !== excludeIndex);
}

function displayStudents(data = students) {
    studentBody.innerHTML = '';
    data.forEach((student, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="border-r border-purple-300">${student.studentId}</td>
            <td class="border-r border-purple-300">${student.fullName}</td>
            <td class="border-r border-purple-300">${student.department}</td>
            <td class="border-r border-purple-300">${student.level}</td>
            <td class="border-r border-purple-300">${student.email}</td>
            <td>
                <button onclick="editStudent(${index})" class="text-blue-500 hover:underline">Edit</button>
                <button onclick="deleteStudent(${index})" class="text-red-500 hover:underline ml-2">Delete</button>
            </td>
        `;
        studentBody.appendChild(row);
    });
}

function addStudent(e) {
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

    if (!isUniqueStudentId(studentId, editIndex)) {
        alert('Student ID must be unique');
        return;
    }

    if (level < 1 || level > 5) {
        alert('Level must be between 1 and 5');
        return;
    }

    if (!validateEmail(email)) {
        alert('Please enter a valid email');
        return;
    }

    const student = { studentId, fullName, department, level, email };

    if (editIndex === -1) {
        students.push(student);
    } else {
        students[editIndex] = student;
        editIndex = -1;
        addBtn.textContent = 'Add Student';
    }

    localStorage.setItem('students', JSON.stringify(students));
    displayStudents();
    studentForm.reset();
}

function editStudent(index) {
    studentIdInput.value = students[index].studentId;
    fullNameInput.value = students[index].fullName;
    departmentInput.value = students[index].department;
    levelInput.value = students[index].level;
    emailInput.value = students[index].email;
    editIndex = index;
    addBtn.textContent = 'Update Student';
}

function deleteStudent(index) {
    if (confirm('Are you sure you want to delete this student?')) {
        students.splice(index, 1);
        localStorage.setItem('students', JSON.stringify(students));
        displayStudents();
    }
}

function searchStudents() {
    const query = searchInput.value.toLowerCase();
    const filtered = students.filter(student =>
        student.studentId.toLowerCase().includes(query) ||
        student.fullName.toLowerCase().includes(query) ||
        student.department.toLowerCase().includes(query) ||
        student.email.toLowerCase().includes(query)
    );
    displayStudents(filtered);
}

function exportData() {
    const dataStr = JSON.stringify(students, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'students.json';
    a.click();
    URL.revokeObjectURL(url);
}

function importData(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const imported = JSON.parse(event.target.result);
                if (Array.isArray(imported) && imported.every(s => s.studentId && s.fullName && s.department && s.level && s.email)) {
                    const uniqueIds = new Set(imported.map(s => s.studentId));
                    if (uniqueIds.size === imported.length) {
                        students = imported;
                        localStorage.setItem('students', JSON.stringify(students));
                        displayStudents();
                        alert('Data imported successfully');
                    } else {
                        alert('Imported data contains duplicate student IDs');
                    }
                } else {
                    alert('Invalid JSON format or missing required fields');
                }
            } catch (err) {
                alert('Error importing data');
            }
        };
        reader.readAsText(file);
    }
}

studentForm.addEventListener('submit', addStudent);
searchInput.addEventListener('input', searchStudents);
exportBtn.addEventListener('click', exportData);
importBtn.addEventListener('click', () => importFile.click());
importFile.addEventListener('change', importData);

displayStudents();