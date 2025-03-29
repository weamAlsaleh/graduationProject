// إظهار/إخفاء القائمة الجانبية
function toggleMenu() {
  const sideMenu = document.getElementById("sideMenu");
  if (sideMenu) {
    sideMenu.classList.toggle("open");
  }
}

// تسجيل الخروج
function logout() {
  sessionStorage.clear(); // أو sessionStorage.removeItem("loggedInUserId");
  window.location.href = "login.html";
}

// Server URL
const SERVER_URL = "http://localhost:3000";

// Function to load teacher's subjects for the dropdowns
async function loadTeacherSubjects() {
  try {
    // Get the logged-in teacher ID
    const teacherId = sessionStorage.getItem("loggedInUserId");
    if (!teacherId) {
      // Redirect to login if not logged in
      window.location.href = "login.html";
      return;
    }
    
    // Fetch this teacher's schedule to get their subjects
    const scheduleResponse = await fetch(`${SERVER_URL}/schedules?userId=${teacherId}&role=teacher`);
    if (!scheduleResponse.ok) {
      throw new Error(`خطأ في الاتصال بالسيرفر: ${scheduleResponse.status}`);
    }
    
    const schedules = await scheduleResponse.json();
    if (schedules.length === 0) {
      alert("لا توجد مواد في جدولك الدراسي!");
      return [];
    }
    
    // Extract unique subjects from the teacher's schedule
    const teacherSubjects = [...new Set(schedules.map(s => s.subject))];
    
    // Populate dropdowns if they exist
    const subjectSelect = document.getElementById("subjectSelect");
    if (subjectSelect) {
      // Clear existing options except the first default one
      while (subjectSelect.options.length > 1) {
        subjectSelect.remove(1);
      }
      
      // Add the teacher's subjects as options
      teacherSubjects.forEach(subject => {
        const option = document.createElement("option");
        option.value = subject;
        option.textContent = subject;
        subjectSelect.appendChild(option);
      });
    }
    
    const gradeSubjectInput = document.getElementById("subjectInput");
    if (gradeSubjectInput && gradeSubjectInput.tagName === "SELECT") {
      // Clear existing options except the first default one
      while (gradeSubjectInput.options.length > 1) {
        gradeSubjectInput.remove(1);
      }
      
      // Add the teacher's subjects as options
      teacherSubjects.forEach(subject => {
        const option = document.createElement("option");
        option.value = subject;
        option.textContent = subject;
        gradeSubjectInput.appendChild(option);
      });
    }
    
    return teacherSubjects;
  } catch (error) {
    console.error("خطأ في تحميل مواد المعلمة:", error);
    alert("حدث خطأ في تحميل المواد الخاصة بك: " + error.message);
    return [];
  }
}

// Modify the existing teacherGrades.html page to use a dropdown instead of text input
function updateGradeSubjectToDropdown() {
  const subjectInput = document.getElementById("subjectInput");
  if (subjectInput && subjectInput.tagName === "INPUT") {
    // Replace the input with a select
    const select = document.createElement("select");
    select.id = "subjectInput";
    select.name = "subject";
    select.required = true;
    
    // Add default option
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "--اختر المادة--";
    select.appendChild(defaultOption);
    
    // Replace the input with our new select
    subjectInput.parentNode.replaceChild(select, subjectInput);
  }
}
// تسجيل الدخول ووظائف إضافية
document.addEventListener("DOMContentLoaded", function() {
  // Check for logged in user and role
  const userId = sessionStorage.getItem("loggedInUserId");
  const userRole = sessionStorage.getItem("loggedInUserRole");
  
  // If on a teacher page and logged in as teacher, load their subjects
  if (userRole === "teacher") {
    // If on the attendance or grades pages, load the teacher's subjects
    if (document.getElementById("subjectSelect") || 
        document.getElementById("subjectInput")) {
      loadTeacherSubjects();
    }
    
    // On grades page, ensure subject input is a dropdown
    if (document.getElementById("subjectInput") && 
        document.querySelector(".grades-form")) {
      updateGradeSubjectToDropdown();
      setTimeout(loadTeacherSubjects, 100); // Ensure DOM updates first
    }
  }

  // معالجة نموذج تسجيل الدخول
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", function(event) {
      event.preventDefault();
      
      const enteredUserId = document.getElementById("userId").value.trim();
      const enteredPassword = document.getElementById("password").value.trim();

      // جلب ملف JSON
      fetch(`${SERVER_URL}/users`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`خطأ في الاتصال بالسيرفر: ${response.status}`);
          }
          return response.json();
        })
        .then(users => {
          // ابحث عن المستخدم المطابق للـ userId والـ password
          const foundUser = users.find(u => 
            u.userId === enteredUserId && u.password === enteredPassword
          );
          
          if (foundUser) {
            // نحتفظ بـ userId في sessionStorage
            sessionStorage.setItem("loggedInUserId", foundUser.userId);
            sessionStorage.setItem("loggedInUserRole", foundUser.role);
            
            // توجيه حسب الدور
            if (foundUser.role === "student") {
              window.location.href = "student.html";
            } else if (foundUser.role === "teacher") {
              window.location.href = "teacher.html";
            } else if (foundUser.role === "admin") {
              window.location.href = "admin.html";
            } else {
              alert("دور المستخدم غير معروف!");
            }
          } else {
            alert("اسم المستخدم أو كلمة المرور غير صحيحة!");
          }
        })
        .catch(error => {
          console.error("خطأ في جلب ملف JSON:", error);
          alert("حدث خطأ في الاتصال بقاعدة البيانات!");
        });
    });
  }

  // ===== وظائف teacherRegister.html =====
  const registerTeacherForm = document.getElementById("registerTeacherForm");
  if (registerTeacherForm) {
    registerTeacherForm.addEventListener("submit", function(event) {
      event.preventDefault();
      
      const name = document.getElementById("teacherName").value.trim();
      const teacherId = document.getElementById("teacherId").value.trim();
      const specialty = document.getElementById("specialty").value.trim();
      const phone = document.getElementById("phone").value.trim();
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value.trim();
      
      if (!name || !teacherId || !specialty || !password) {
        alert("الرجاء تعبئة جميع الحقول الأساسية!");
        return;
      }
      
      // التحقق من عدم تكرار رقم المعلمة
      fetch(`${SERVER_URL}/users`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`خطأ في الاتصال بالسيرفر: ${response.status}`);
          }
          return response.json();
        })
        .then(users => {
          const existingTeacher = users.find(u => u.userId === teacherId);
          
          if (existingTeacher) {
            alert("رقم المعلمة موجود مسبقًا!");
            return;
          }
          
          // إضافة المعلمة إلى قاعدة البيانات
          return fetch(`${SERVER_URL}/users`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              role: "teacher",
              userId: teacherId,
              name: name,
              specialty: specialty,
              phone: phone,
              email: email,
              password: password
            })
          });
        })
        .then(response => {
          if (!response || !response.ok) {
            throw new Error("فشل في إضافة المعلمة!");
          }
          return response.json();
        })
        .then(data => {
          alert(`تم تسجيل المعلمة بنجاح!
          الاسم: ${name}
          رقم المعلمة: ${teacherId}
          التخصص: ${specialty}`);
          
          registerTeacherForm.reset();
        })
        .catch(error => {
          console.error("خطأ:", error);
          alert("حدث خطأ في عملية التسجيل: " + error.message);
        });
    });
  }

  // ===== وظائف teacherUpdate.html =====
  const loadTeacherDataBtn = document.getElementById("loadTeacherDataBtn");
  if (loadTeacherDataBtn) {
    loadTeacherDataBtn.addEventListener("click", loadTeacherData);
  }
  
  const updateTeacherForm = document.getElementById("updateTeacherForm");
  if (updateTeacherForm) {
    updateTeacherForm.addEventListener("submit", function(event) {
      event.preventDefault();
      
      const teacherId = document.getElementById("updTeacherId").value;
      const name = document.getElementById("updTeacherName").value;
      const specialty = document.getElementById("updSpecialty").value;
      const phone = document.getElementById("updPhone").value;
      const email = document.getElementById("updEmail").value;
      const password = document.getElementById("updPassword").value;
      
      // البحث عن المعلمة
      fetch(`${SERVER_URL}/users?userId=${teacherId}&role=teacher`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`خطأ في الاتصال بالسيرفر: ${response.status}`);
          }
          return response.json();
        })
        .then(teachers => {
          if (!teachers.length) {
            throw new Error("لم يتم العثور على المعلمة!");
          }
          
          const teacher = teachers[0];
          
          // تحديث بيانات المعلمة
          return fetch(`${SERVER_URL}/users/${teacher.id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              name: name,
              specialty: specialty,
              phone: phone,
              email: email,
              password: password
            })
          });
        })
        .then(response => {
          if (!response.ok) {
            throw new Error("فشل في تحديث بيانات المعلمة!");
          }
          return response.json();
        })
        .then(data => {
          alert(`تم تحديث بيانات المعلمة بنجاح!
          رقم المعلمة: ${teacherId}
          الاسم: ${name}
          التخصص: ${specialty}`);
        })
        .catch(error => {
          console.error("خطأ:", error);
          alert("حدث خطأ في عملية التحديث: " + error.message);
        });
    });
  }

  // ===== وظائف adminSubjects.html =====
  const addSubjectForm = document.getElementById("addSubjectForm");
  if (addSubjectForm) {
    addSubjectForm.addEventListener("submit", function(event) {
      event.preventDefault();
      
      const code = document.getElementById("subjectCodeInput").value.trim();
      const name = document.getElementById("subjectNameInput").value.trim();
      
      if (!code || !name) {
        alert("الرجاء تعبئة جميع الحقول!");
        return;
      }
      
      // إضافة المادة إلى قاعدة البيانات
      fetch(`${SERVER_URL}/subjects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          code: code,
          name: name
        })
      })
      .then(response => {
        if (!response.ok) {
          throw new Error("فشل في إضافة المادة!");
        }
        return response.json();
      })
      .then(data => {
        alert(`تمت إضافة المادة بنجاح!
        رمز المادة: ${code}
        اسم المادة: ${name}`);
        
        addSubjectForm.reset();
        
        // إعادة تحميل قائمة المواد
        loadSubjects();
      })
      .catch(error => {
        console.error("خطأ:", error);
        alert("حدث خطأ في عملية الإضافة: " + error.message);
      });
    });
  }
  
  // عرض المواد إذا كنا في صفحة إدارة المواد
  const subjectsTable = document.getElementById("subjectsTable");
  if (subjectsTable) {
    loadSubjects();
  }

  // ===== وظائف adminSchedule.html =====
  const addScheduleForm = document.getElementById("addScheduleForm");
  if (addScheduleForm) {
    addScheduleForm.addEventListener("submit", handleAddScheduleForm);
  }
  
  // عرض الجداول إذا كنا في صفحة إدارة الجداول
  const scheduleTable = document.getElementById("scheduleTable");
  if (scheduleTable) {
    loadSchedules();
  }

  // ===== وظائف teacherGrades.html =====
  const teacherGradeForm = document.getElementById("teacherGradeForm");
  if (teacherGradeForm) {
    teacherGradeForm.addEventListener("submit", handleTeacherGradeForm);
  }

  // ===== وظائف teacherAttendance.html =====
  const loadStudentsBtn = document.getElementById("loadStudentsBtn");
  if (loadStudentsBtn) {
    loadStudentsBtn.addEventListener("click", loadStudentsForSubject);
  }
  
  const markAttendanceForm = document.getElementById("markAttendanceForm");
  if (markAttendanceForm) {
    markAttendanceForm.addEventListener("submit", handleMarkAttendanceForm);
  }

  // ===== وظائف adminRegister.html و adminUpdate.html =====
  const registerStudentForm = document.getElementById("registerStudentForm");
  if (registerStudentForm) {
    registerStudentForm.addEventListener("submit", function(event) {
      event.preventDefault();
      
      const name = document.getElementById("newStudentName").value.trim();
      const academicId = document.getElementById("newStudentAcademicId").value.trim();
      const major = document.getElementById("major").value.trim();
      const phone = document.getElementById("phone") ? document.getElementById("phone").value.trim() : "";
      const email = document.getElementById("email") ? document.getElementById("email").value.trim() : "";
      const password = document.getElementById("password").value.trim();
      
      if (!name || !academicId || !major || !password) {
        alert("الرجاء تعبئة جميع الحقول المطلوبة!");
        return;
      }
      
      // التحقق من عدم تكرار الرقم الأكاديمي
      fetch(`${SERVER_URL}/users?academicId=${academicId}`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`خطأ في الاتصال بالسيرفر: ${response.status}`);
          }
          return response.json();
        })
        .then(students => {
          if (students.length > 0) {
            alert("الرقم الأكاديمي مستخدم مسبقًا!");
            return;
          }
          
          // إضافة الطالبة إلى قاعدة البيانات
          return fetch(`${SERVER_URL}/users`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              role: "student",
              userId: academicId, // استخدام نفس الرقم الأكاديمي كمعرف للمستخدم
              academicId: academicId,
              name: name,
              major: major,
              phone: phone,
              email: email,
              password: password
            })
          });
        })
        .then(response => {
          if (!response || !response.ok) {
            throw new Error("فشل في تسجيل الطالبة!");
          }
          return response.json();
        })
        .then(data => {
          alert(`تم تسجيل الطالبة بنجاح!
          الاسم: ${name}
          الرقم الأكاديمي: ${academicId}
          التخصص: ${major}`);
          
          registerStudentForm.reset();
        })
        .catch(error => {
          console.error("خطأ:", error);
          alert("حدث خطأ في عملية التسجيل: " + error.message);
        });
    });
  }
  
  const loadStudentDataBtn = document.getElementById("loadStudentDataBtn");
  if (loadStudentDataBtn) {
    loadStudentDataBtn.addEventListener("click", loadStudentData);
  }
  
  const updateStudentForm = document.getElementById("updateStudentForm");
  if (updateStudentForm) {
    updateStudentForm.addEventListener("submit", function(event) {
      event.preventDefault();
      
      const userId = document.getElementById("updUserId").value;
      const academicId = document.getElementById("updAcademicId").value;
      const name = document.getElementById("updName").value;
      const major = document.getElementById("updMajor").value;
      const phone = document.getElementById("updPhone").value;
      const email = document.getElementById("updEmail").value;
      const password = document.getElementById("updPassword").value;
      
      // البحث عن الطالبة
      fetch(`${SERVER_URL}/users?userId=${userId}&role=student`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`خطأ في الاتصال بالسيرفر: ${response.status}`);
          }
          return response.json();
        })
        .then(students => {
          if (!students.length) {
            throw new Error("لم يتم العثور على الطالبة!");
          }
          
          const student = students[0];
          
          // تحديث بيانات الطالبة
          return fetch(`${SERVER_URL}/users/${student.id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              name: name,
              major: major,
              phone: phone,
              email: email,
              password: password
            })
          });
        })
        .then(response => {
          if (!response.ok) {
            throw new Error("فشل في تحديث بيانات الطالبة!");
          }
          return response.json();
        })
        .then(data => {
          alert(`تم تحديث بيانات الطالبة بنجاح!
          الرقم الأكاديمي: ${academicId}
          الاسم: ${name}
          التخصص: ${major}`);
        })
        .catch(error => {
          console.error("خطأ:", error);
          alert("حدث خطأ في عملية التحديث: " + error.message);
        });
    });
  }
});

// ==== دوال لتحميل وعرض البيانات ====

// دالة لجلب بيانات معلمة بالـ userId
async function loadTeacherData() {
  const searchTeacherId = document.getElementById("searchTeacherId");
  if (!searchTeacherId) {
    console.error("لم يتم العثور على حقل البحث عن المعلمة!");
    return;
  }
  
  const teacherId = searchTeacherId.value.trim();
  if (!teacherId) {
    alert("الرجاء إدخال رقم المعلمة أولاً!");
    return;
  }

  try {
    const response = await fetch(`${SERVER_URL}/users?userId=${teacherId}&role=teacher`);
    if (!response.ok) {
      throw new Error(`خطأ في الاتصال بالسيرفر: ${response.status}`);
    }
    
    const teachers = await response.json();
    if (!teachers.length) {
      alert("لم يتم العثور على معلمة بهذا الرقم!");
      const updateForm = document.getElementById("updateTeacherForm");
      if (updateForm) {
        updateForm.style.display = "none";
      }
      return;
    }
    
    const teacher = teachers[0];

    // أعرض النموذج واملئي حقوله
    const updateForm = document.getElementById("updateTeacherForm");
    if (updateForm) {
      updateForm.style.display = "block";
    }
    
    const idField = document.getElementById("updTeacherId");
    const nameField = document.getElementById("updTeacherName");
    const specialtyField = document.getElementById("updSpecialty");
    const phoneField = document.getElementById("updPhone");
    const emailField = document.getElementById("updEmail");
    const passwordField = document.getElementById("updPassword");

    if (idField) idField.value = teacher.userId || "";
    if (nameField) nameField.value = teacher.name || "";
    if (specialtyField) specialtyField.value = teacher.specialty || "";
    if (phoneField) phoneField.value = teacher.phone || "";
    if (emailField) emailField.value = teacher.email || "";
    if (passwordField) passwordField.value = teacher.password || "";

  } catch (err) {
    console.error(err);
    alert("حدث خطأ: " + err.message);
  }
}

// دالة للبحث عن الطالبة وجلب بياناتها
async function loadStudentData() {
  const searchAcademicIdInput = document.getElementById("searchAcademicId");
  if (!searchAcademicIdInput) {
    console.error("لم يتم العثور على حقل البحث عن الطالبة!");
    return;
  }
  
  const academicIdValue = searchAcademicIdInput.value.trim();
  if (!academicIdValue) {
    alert("الرجاء إدخال الرقم الأكاديمي أولاً!");
    return;
  }

  try {
    const response = await fetch(`${SERVER_URL}/users?academicId=${academicIdValue}&role=student`);
    if (!response.ok) {
      throw new Error(`خطأ في الاتصال بالسيرفر: ${response.status}`);
    }
    
    const students = await response.json();
    if (!students.length) {
      alert("لم يتم العثور على طالبة بهذا الرقم الأكاديمي!");
      // إخفاء النموذج إن كان ظاهرًا سابقًا
      const updateForm = document.getElementById("updateStudentForm");
      if (updateForm) {
        updateForm.style.display = "none";
      }
      return;
    }
    
    const student = students[0];

    // عرض النموذج وملء البيانات
    const updateForm = document.getElementById("updateStudentForm");
    if (updateForm) {
      updateForm.style.display = "block";
    }

    // تعبئة الحقول
    const userIdField = document.getElementById("updUserId");
    const academicIdField = document.getElementById("updAcademicId");
    const nameField = document.getElementById("updName");
    const majorField = document.getElementById("updMajor");
    const phoneField = document.getElementById("updPhone");
    const emailField = document.getElementById("updEmail");
    const passwordField = document.getElementById("updPassword");

    if (userIdField) userIdField.value = student.userId || "";
    if (academicIdField) academicIdField.value = student.academicId || "";
    if (nameField) nameField.value = student.name || "";
    if (majorField) majorField.value = student.major || "";
    if (phoneField) phoneField.value = student.phone || "";
    if (emailField) emailField.value = student.email || "";
    if (passwordField) passwordField.value = student.password || "";

  } catch (error) {
    console.error(error);
    alert("حدث خطأ أثناء جلب بيانات الطالبة: " + error.message);
  }
}

// معالجة نموذج درجات المعلمة
async function handleTeacherGradeForm(event) {
  event.preventDefault();
  
  const teacherId = sessionStorage.getItem("loggedInUserId");
  if (!teacherId) {
    alert("يجب تسجيل الدخول أولاً!");
    window.location.href = "login.html";
    return;
  }
  
  const studentId = document.getElementById("studentIdInput").value.trim();
  const subject = document.getElementById("subjectInput").value.trim();
  const grade = document.getElementById("gradeInput").value.trim();
  
  if (!studentId || !subject || !grade) {
    alert("الرجاء تعبئة جميع الحقول!");
    return;
  }
  
  try {
    // Verify this teacher teaches this subject
    const scheduleResponse = await fetch(`${SERVER_URL}/schedules?userId=${teacherId}&role=teacher&subject=${subject}`);
    if (!scheduleResponse.ok) {
      throw new Error(`خطأ في الاتصال بالسيرفر: ${scheduleResponse.status}`);
    }
    
    const schedules = await scheduleResponse.json();
    if (schedules.length === 0) {
      alert("لا يمكنك إدخال درجات لمادة لا تقوم بتدريسها!");
      return;
    }
    
    // Verify the student is enrolled in this subject
    const studentScheduleResponse = await fetch(`${SERVER_URL}/schedules?userId=${studentId}&role=student&subject=${subject}`);
    if (!studentScheduleResponse.ok) {
      throw new Error(`خطأ في الاتصال بالسيرفر: ${studentScheduleResponse.status}`);
    }
    
    const studentSchedules = await studentScheduleResponse.json();
    if (studentSchedules.length === 0) {
      alert("هذه الطالبة غير مسجلة في هذه المادة!");
      return;
    }
    
    // Proceed with grade entry as before
    const gradesResponse = await fetch(`${SERVER_URL}/grades?userId=${studentId}&subject=${subject}`);
    if (!gradesResponse.ok) {
      throw new Error(`خطأ في الاتصال بالسيرفر: ${gradesResponse.status}`);
    }
    
    const grades = await gradesResponse.json();
    
    if (grades.length > 0) {
      // Update existing grade
      const existingGrade = grades[0];
      const updateResponse = await fetch(`${SERVER_URL}/grades/${existingGrade.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          grade: parseFloat(grade)
        })
      });
      
      if (!updateResponse.ok) {
        throw new Error(`خطأ في تحديث الدرجة: ${updateResponse.status}`);
      }
      
      alert("تم تحديث الدرجة بنجاح!");
    } else {
      // Create new grade
      const createResponse = await fetch(`${SERVER_URL}/grades`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId: studentId,
          subject: subject,
          grade: parseFloat(grade)
        })
      });
      
      if (!createResponse.ok) {
        throw new Error(`خطأ في إضافة الدرجة: ${createResponse.status}`);
      }
      
      alert("تم إضافة الدرجة بنجاح!");
    }
    
    document.getElementById("teacherGradeForm").reset();
  } catch (error) {
    console.error("خطأ:", error);
    alert("حدث خطأ أثناء حفظ الدرجة: " + error.message);
  }
}

// 1) جلب جميع الطالبات المسجلات في المادة المختارة
async function loadStudentsForSubject() {
  const teacherId = sessionStorage.getItem("loggedInUserId");
  if (!teacherId) {
    alert("يجب تسجيل الدخول أولاً!");
    window.location.href = "login.html";
    return;
  }
  
  const subjectSelect = document.getElementById("subjectSelect");
  const studentsTbody = document.getElementById("studentsTbody");
  
  if (!subjectSelect || !studentsTbody) {
    console.error("لم يتم العثور على عناصر واجهة المستخدم اللازمة!");
    return;
  }
  
  const selectedSubject = subjectSelect.value;
  if (!selectedSubject) {
    alert("الرجاء اختيار مادة أولاً!");
    return;
  }

  try {
    // Verify this teacher teaches this subject
    const teacherScheduleResponse = await fetch(`${SERVER_URL}/schedules?userId=${teacherId}&role=teacher&subject=${selectedSubject}`);
    if (!teacherScheduleResponse.ok) {
      throw new Error(`خطأ في الاتصال بالسيرفر: ${teacherScheduleResponse.status}`);
    }
    
    const teacherSchedules = await teacherScheduleResponse.json();
    if (teacherSchedules.length === 0) {
      alert("أنت لا تقوم بتدريس هذه المادة!");
      return;
    }
    
    // 1. Get all students enrolled in this subject
    const studentSchedulesResponse = await fetch(`${SERVER_URL}/schedules?subject=${selectedSubject}&role=student`);
    if (!studentSchedulesResponse.ok) {
      throw new Error(`خطأ في الاتصال بالسيرفر: ${studentSchedulesResponse.status}`);
    }
    
    const studentSchedules = await studentSchedulesResponse.json();
    
    // 2. Get all users who are students
    const usersResponse = await fetch(`${SERVER_URL}/users?role=student`);
    if (!usersResponse.ok) {
      throw new Error(`خطأ في الاتصال بالسيرفر: ${usersResponse.status}`);
    }
    
    const students = await usersResponse.json();

    // Clear the table
    studentsTbody.innerHTML = "";

    // Create a row for each student
    let studentsFound = 0;
    studentSchedules.forEach(schedule => {
      const student = students.find(s => s.userId === schedule.userId);
      if (student) {
        studentsFound++;
        const tr = document.createElement("tr");

        // Name cell
        const tdName = document.createElement("td");
        tdName.textContent = student.name;

        // Academic ID cell
        const tdAcademicId = document.createElement("td");
        tdAcademicId.textContent = student.academicId || "غير متوفر";

        // Checkbox cell
        const tdCheckbox = document.createElement("td");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = student.userId; 
        checkbox.dataset.subject = selectedSubject;
        
        tdCheckbox.appendChild(checkbox);

        tr.appendChild(tdName);
        tr.appendChild(tdAcademicId);
        tr.appendChild(tdCheckbox);

        studentsTbody.appendChild(tr);
      }
    });

    if (studentsFound === 0) {
      alert("لا توجد طالبات مسجلات في هذه المادة.");
    }

  } catch (error) {
    console.error(error);
    alert("حدث خطأ أثناء عرض الطالبات: " + error.message);
  }
}

// Updated attendance recording function
async function handleMarkAttendanceForm(event) {
  event.preventDefault();
  
  const teacherId = sessionStorage.getItem("loggedInUserId");
  if (!teacherId) {
    alert("يجب تسجيل الدخول أولاً!");
    window.location.href = "login.html";
    return;
  }
  
  const subjectSelect = document.getElementById("subjectSelect");
  if (!subjectSelect || !subjectSelect.value) {
    alert("الرجاء اختيار مادة أولاً!");
    return;
  }
  
  const selectedSubject = subjectSelect.value;
  
  // Verify this teacher teaches this subject
  try {
    const teacherScheduleResponse = await fetch(`${SERVER_URL}/schedules?userId=${teacherId}&role=teacher&subject=${selectedSubject}`);
    if (!teacherScheduleResponse.ok) {
      throw new Error(`خطأ في الاتصال بالسيرفر: ${teacherScheduleResponse.status}`);
    }
    
    const teacherSchedules = await teacherScheduleResponse.json();
    if (teacherSchedules.length === 0) {
      alert("أنت لا تقوم بتدريس هذه المادة!");
      return;
    }
    
    const checkboxes = document.querySelectorAll("#studentsTbody input[type='checkbox']:checked");
    if (checkboxes.length === 0) {
      alert("لم يتم تحديد أي طالبة!");
      return;
    }
    
    // Record attendance for checked students
    const updatePromises = Array.from(checkboxes).map(checkbox => {
      const studentId = checkbox.value;
      const subject = checkbox.dataset.subject;
      
      return fetch(`${SERVER_URL}/attendance?userId=${studentId}&subject=${subject}`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`خطأ في الاتصال بالسيرفر: ${response.status}`);
          }
          return response.json();
        })
        .then(attendance => {
          if (attendance.length > 0) {
            // Update existing record
            const record = attendance[0];
            const newAbsences = (record.absences || 0) + 1;
            
            return fetch(`${SERVER_URL}/attendance/${record.id}`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                absences: newAbsences
              })
            });
          } else {
            // Create new record
            return fetch(`${SERVER_URL}/attendance`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                userId: studentId,
                subject: subject,
                absences: 1
              })
            });
          }
        });
    });
    
    // Execute all update operations
    Promise.all(updatePromises)
      .then(results => {
        alert(`تم تسجيل الغياب لـ ${checkboxes.length} طالبة بنجاح!`);
        
        // Reset checkboxes
        checkboxes.forEach(cb => cb.checked = false);
      })
      .catch(error => {
        console.error("خطأ:", error);
        alert("حدث خطأ في عملية تسجيل الغياب: " + error.message);
      });
    
  } catch (error) {
    console.error("خطأ:", error);
    alert("حدث خطأ: " + error.message);
  }
}

// إضافة سجل جدول جديد
async function handleAddScheduleForm(e) {
  e.preventDefault();
  
  const roleSelect = document.getElementById("scheduleRole");
  const userIdInput = document.getElementById("userIdInput");
  const subjectInput = document.getElementById("subjectInput");
  const dayInput = document.getElementById("dayInput");
  const timeInput = document.getElementById("timeInput");
  const roomInput = document.getElementById("roomInput");
  
  if (!roleSelect || !userIdInput || !subjectInput || !dayInput || !timeInput || !roomInput) {
    alert("لم يتم العثور على حقول النموذج!");
    return;
  }

  const role = roleSelect.value.trim();
  const userId = userIdInput.value.trim();
  const subject = subjectInput.value.trim();
  const day = dayInput.value.trim();
  const time = timeInput.value.trim();
  const room = roomInput.value.trim();

  if (!role || !userId || !subject || !day || !time || !room) {
    alert("الرجاء تعبئة جميع الحقول!");
    return;
  }

  try {
    // التحقق من وجود المستخدم
    const userResponse = await fetch(`${SERVER_URL}/users?userId=${userId}&role=${role}`);
    if (!userResponse.ok) {
      throw new Error(`خطأ في الاتصال بالسيرفر: ${userResponse.status}`);
    }
    
    const users = await userResponse.json();
    if (users.length === 0) {
      alert(`لم يتم العثور على ${role === 'student' ? 'طالبة' : 'معلمة'} بهذا الرقم!`);
      return;
    }
    
    // التحقق من وجود المادة
    const subjectResponse = await fetch(`${SERVER_URL}/subjects?name=${subject}`);
    if (!subjectResponse.ok) {
      throw new Error(`خطأ في الاتصال بالسيرفر: ${subjectResponse.status}`);
    }
    
    const subjects = await subjectResponse.json();
    if (subjects.length === 0) {
      alert("لم يتم العثور على المادة! يجب إضافتها أولاً.");
      return;
    }
    
    // إضافة الجدول
    const scheduleResponse = await fetch(`${SERVER_URL}/schedules`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        role: role,
        userId: userId,
        subject: subject,
        day: day,
        time: time,
        room: room
      })
    });
    
    if (!scheduleResponse.ok) {
      throw new Error("فشل في إضافة الجدول!");
    }
    
    const scheduleData = await scheduleResponse.json();
    
    alert(`تمت إضافة مادة جديدة للجدول بنجاح:
    النوع: ${role}
    المستخدم: ${userId}
    المادة: ${subject}
    اليوم: ${day}
    الوقت: ${time}
    القاعة: ${room}`);
    
    // تفريغ النموذج
    const form = document.getElementById("addScheduleForm");
    if (form) {
      form.reset();
    }
    
    // إعادة تحميل الجداول
    loadSchedules();
    
  } catch (err) {
    console.error(err);
    alert("خطأ في الإضافة: " + err.message);
  }
}

// جلب وعرض جميع سجلات الجداول
async function loadSchedules() {
  try {
    const response = await fetch(`${SERVER_URL}/schedules`);
    if (!response.ok) {
      throw new Error(`خطأ في الاتصال بالسيرفر: ${response.status}`);
    }
    
    const schedules = await response.json();
    
    const tableBody = document.querySelector("#scheduleTable tbody");
    if (!tableBody) {
      console.error("لم يتم العثور على جدول الجداول!");
      return;
    }
    
    tableBody.innerHTML = "";

    schedules.forEach(item => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${item.role || ''}</td>
        <td>${item.userId || ''}</td>
        <td>${item.subject || ''}</td>
        <td>${item.day || ''}</td>
        <td>${item.time || ''}</td>
        <td>${item.room || ''}</td>
        <td><button onclick="editSchedule(${item.id})">تحرير</button></td>
        <td><button onclick="deleteSchedule(${item.id})">حذف</button></td>
      `;
      tableBody.appendChild(tr);
    });
  } catch (err) {
    console.error(err);
    alert("خطأ في جلب سجلات الجداول: " + err.message);
  }
}

// حذف سجل جدول
async function deleteSchedule(id) {
  if (!confirm("هل أنت متأكد من الحذف؟")) return;
  
  try {
    const response = await fetch(`${SERVER_URL}/schedules/${id}`, { method: "DELETE" });
    if (!response.ok) {
      throw new Error(`خطأ في الاتصال بالسيرفر: ${response.status}`);
    }
    
    alert("تم حذف السجل بنجاح!");
    loadSchedules();
  } catch (err) {
    console.error(err);
    alert("خطأ في حذف السجل: " + err.message);
  }
}

// تعديل سجل
async function editSchedule(id) {
  try {
    // جلب السجل الحالي
    const response = await fetch(`${SERVER_URL}/schedules/${id}`);
    if (!response.ok) {
      throw new Error(`خطأ في الاتصال بالسيرفر: ${response.status}`);
    }
    
    const schedule = await response.json();
    
    // عرض نموذج تعديل بسيط
    const newDay = prompt("أدخل اليوم الجديد:", schedule.day);
    if (!newDay) return; // إلغاء التعديل
    
    const newTime = prompt("أدخل الوقت الجديد:", schedule.time);
    if (!newTime) return;
    
    const newRoom = prompt("أدخل القاعة الجديدة:", schedule.room);
    if (!newRoom) return;
    
    // تحديث السجل
    const updateResponse = await fetch(`${SERVER_URL}/schedules/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        day: newDay,
        time: newTime,
        room: newRoom
      })
    });
    
    if (!updateResponse.ok) {
      throw new Error(`خطأ في الاتصال بالسيرفر: ${updateResponse.status}`);
    }
    
    alert("تم تعديل السجل بنجاح!");
    loadSchedules();
  } catch (err) {
    console.error(err);
    alert("خطأ في تعديل السجل: " + err.message);
  }
}

// جلب وعرض قائمة المواد
async function loadSubjects() {
  try {
    const response = await fetch(`${SERVER_URL}/subjects`);
    if (!response.ok) {
      throw new Error(`خطأ في الاتصال بالسيرفر: ${response.status}`);
    }
    
    const subjects = await response.json();
    
    const tbody = document.querySelector("#subjectsTable tbody");
    if (!tbody) {
      console.error("لم يتم العثور على جدول المواد!");
      return;
    }
    
    tbody.innerHTML = "";

    subjects.forEach(subj => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${subj.code || ''}</td>
        <td>${subj.name || ''}</td>
        <td><button onclick="editSubject(${subj.id})">تحرير</button></td>
        <td><button onclick="deleteSubject(${subj.id})">حذف</button></td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error(err);
    alert("خطأ في جلب المواد: " + err.message);
  }
}

// حذف مادة
async function deleteSubject(id) {
  if (!confirm("هل أنت متأكد من الحذف؟")) return;
  
  try {
    // تحقق من استخدام المادة في الجداول أولاً
    const subjectResponse = await fetch(`${SERVER_URL}/subjects/${id}`);
    if (!subjectResponse.ok) {
      throw new Error(`خطأ في الاتصال بالسيرفر: ${subjectResponse.status}`);
    }
    
    const subject = await subjectResponse.json();
    
    const schedulesResponse = await fetch(`${SERVER_URL}/schedules?subject=${subject.name}`);
    if (!schedulesResponse.ok) {
      throw new Error(`خطأ في الاتصال بالسيرفر: ${schedulesResponse.status}`);
    }
    
    const schedules = await schedulesResponse.json();
    
    if (schedules.length > 0) {
      alert("لا يمكن حذف هذه المادة لأنها مستخدمة في الجداول الدراسية!");
      return;
    }
    
    // حذف المادة
    const deleteResponse = await fetch(`${SERVER_URL}/subjects/${id}`, { method: "DELETE" });
    if (!deleteResponse.ok) {
      throw new Error(`خطأ في الاتصال بالسيرفر: ${deleteResponse.status}`);
    }
    
    alert("تم حذف المادة بنجاح!");
    loadSubjects();
  } catch (err) {
    console.error(err);
    alert("خطأ في حذف المادة: " + err.message);
  }
}

// تحرير مادة
async function editSubject(id) {
  try {
    // جلب بيانات المادة
    const response = await fetch(`${SERVER_URL}/subjects/${id}`);
    if (!response.ok) {
      throw new Error(`خطأ في الاتصال بالسيرفر: ${response.status}`);
    }
    
    const subject = await response.json();
    
    // عرض نموذج تعديل بسيط
    const newName = prompt("أدخل الاسم الجديد للمادة:", subject.name);
    if (!newName) return; // إلغاء التعديل
    
    const newCode = prompt("أدخل الرمز الجديد للمادة:", subject.code);
    if (!newCode) return;
    
    // تحديث المادة
    const updateResponse = await fetch(`${SERVER_URL}/subjects/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: newName,
        code: newCode
      })
    });
    
    if (!updateResponse.ok) {
      throw new Error(`خطأ في الاتصال بالسيرفر: ${updateResponse.status}`);
    }
    
    alert("تم تعديل المادة بنجاح!");
    loadSubjects();
  } catch (err) {
    console.error(err);
    alert("خطأ في تعديل المادة: " + err.message);
  }
}