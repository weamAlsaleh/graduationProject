// إظهار/إخفاء القائمة الجانبية
function toggleMenu() {
    const sideMenu = document.getElementById("sideMenu");
    sideMenu.classList.toggle("open");
  }
  
  // تسجيل الخروج
  function logout() {
    sessionStorage.clear(); // أو sessionStorage.removeItem("loggedInUserId");
    window.location.href = "login.html";
  }
  
  document.addEventListener("DOMContentLoaded", function() {
    const loginForm = document.getElementById("loginForm");
    
    // إذا لم تكن هذه الصفحة تحوي فورم تسجيل الدخول، لا تفعل شيئًا
    if (!loginForm) return;
    
    // عند الضغط على زر دخول في صفحة login.html
    loginForm.addEventListener("submit", function(event) {
      event.preventDefault();
      
      const enteredUserId = document.getElementById("userId").value.trim();
      const enteredPassword = document.getElementById("password").value.trim();
  
      // جلب ملف JSON
      fetch("db.json")
        .then(response => response.json())
        .then(data => {
          const users = data.users;
          
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
  });

// دالة لتعديل درجة مادة موجودة لطالبة
async function updateGradeIfExists(studentId, subject, newGradeValue) {
  try {
    // اجلب جميع الدرجات من السيرفر
    const response = await fetch("http://localhost:3000/grades");
    if (!response.ok) {
      throw new Error("خطأ في جلب البيانات من السيرفر! الحالة: " + response.status);
    }

    const allGrades = await response.json();

    // ابحث عن الدرجة التي تخص هذه الطالبة والمادة
    const existingGrade = allGrades.find(
      grade => grade.userId === studentId && grade.subject === subject
    );

    if (!existingGrade) {
      // لم يتم العثور على سجل للمادة المطلوبة
      alert("لا توجد مادة بهذا الاسم للطالبة. لا يمكن التعديل!");
      return;
    }

    // إذا كانت المادة موجودة، نفّذ عملية التعديل (PATCH أو PUT)
    const patchResponse = await fetch(`http://localhost:3000/grades/${existingGrade.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ grade: Number(newGradeValue) })
    });

    if (!patchResponse.ok) {
      throw new Error("حدث خطأ أثناء تعديل الدرجة! الحالة: " + patchResponse.status);
    }

    alert("تم تعديل الدرجة بنجاح!");

  } catch (error) {
    console.error(error);
    alert("فشل في عملية التعديل: " + error.message);
  }
}

// دالة لمعالجة إرسال نموذج المعلمة
function handleTeacherGradeForm(event) {
  event.preventDefault();

  const studentIdInput = document.getElementById("studentIdInput");
  const subjectInput = document.getElementById("subjectInput");
  const gradeInput = document.getElementById("gradeInput");

  const studentId = studentIdInput.value.trim();
  const subject = subjectInput.value.trim();
  const gradeValue = gradeInput.value.trim();

  if (!studentId || !subject || !gradeValue) {
    alert("الرجاء تعبئة جميع الحقول!");
    return;
  }

  // استدعاء الدالة التي تجرّي عملية التعديل فقط عند وجود المادة
  updateGradeIfExists(studentId, subject, gradeValue);
}

// تفعيل الدالة عند تحميل الصفحة في حال توفر نموذج teacherGradeForm
document.addEventListener("DOMContentLoaded", function() {
  const teacherGradeForm = document.getElementById("teacherGradeForm");
  if (teacherGradeForm) {
    teacherGradeForm.addEventListener("submit", handleTeacherGradeForm);
  }
});

// دالة لتحديث الغياب لطالبة في مادة محددة (إذا كان السجل موجودًا)
async function updateAttendanceIfExists(studentId, subject, newAbsencesValue) {
  try {
    // اجلب كل سجلات الحضور/الغياب
    const response = await fetch("http://localhost:3000/attendance");
    if (!response.ok) {
      throw new Error("خطأ في جلب بيانات الغياب من السيرفر! الحالة: " + response.status);
    }

    const allAttendance = await response.json();

    // ابحث عن سجل الغياب الذي يطابق الطالبة والمادة
    const existingAttendance = allAttendance.find(
      a => a.userId === studentId && a.subject === subject
    );

    if (!existingAttendance) {
      // لا يوجد سجل غياب لهذه المادة للطالبة
      alert("لا توجد مادة بهذا الاسم للطالبة. لا يمكن تعديل الغياب!");
      return;
    }

    // إذا وجدنا السجل، نستخدم PATCH لتحديث عدد الغيابات
    const patchResponse = await fetch(`http://localhost:3000/attendance/${existingAttendance.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ absences: Number(newAbsencesValue) })
    });

    if (!patchResponse.ok) {
      throw new Error("حدث خطأ أثناء تعديل الغياب! الحالة: " + patchResponse.status);
    }

    alert("تم تعديل الغياب بنجاح!");
  } catch (error) {
    console.error(error);
    alert("فشل في عملية تحديث الحضور/الغياب: " + error.message);
  }
}

// هذه الدالة تُنادى عند إرسال الفورم الخاص بتسجيل/تعديل الحضور
function handleTeacherAttendanceForm(event) {
  event.preventDefault();

  const studentIdInput = document.getElementById("attStudentIdInput");
  const subjectInput = document.getElementById("attSubjectInput");
  const absencesInput = document.getElementById("absencesInput");

  const studentId = studentIdInput.value.trim();
  const subject = subjectInput.value.trim();
  const absencesValue = absencesInput.value.trim();

  if (!studentId || !subject || !absencesValue) {
    alert("الرجاء تعبئة جميع الحقول!");
    return;
  }

  // استدعاء الدالة التي تحدّث الغياب إن كان السجل موجودًا
  updateAttendanceIfExists(studentId, subject, absencesValue);
}

// عند تحميل الصفحة، نشبك الدالة مع نموذج المعلمة في teacherAttendance.html (مثلاً)
document.addEventListener("DOMContentLoaded", function() {
  const teacherAttendanceForm = document.getElementById("teacherAttendanceForm");
  if (teacherAttendanceForm) {
    teacherAttendanceForm.addEventListener("submit", handleTeacherAttendanceForm);
  }
});

// عند تحميل الصفحة
document.addEventListener("DOMContentLoaded", function() {
  const subjectSelect = document.getElementById("subjectSelect");
  const loadStudentsBtn = document.getElementById("loadStudentsBtn");
  const markAttendanceForm = document.getElementById("markAttendanceForm");
  const studentsTbody = document.getElementById("studentsTbody");

  if (!subjectSelect || !loadStudentsBtn || !markAttendanceForm) return;

  // عند الضغط على زر "عرض الطالبات"
  loadStudentsBtn.addEventListener("click", loadStudentsForSubject);

  // عند الضغط على زر "حفظ الغياب"
  markAttendanceForm.addEventListener("submit", handleMarkAttendanceForm);

  // 1) جلب جميع الطالبات المسجلات في المادة المختارة
  async function loadStudentsForSubject() {
    const selectedSubject = subjectSelect.value;
    if (!selectedSubject) {
      alert("الرجاء اختيار مادة أولًا!");
      return;
    }

    try {
      // 1. جلب بيانات db.json
      const response = await fetch("db.json");
      if (!response.ok) {
        throw new Error("خطأ في جلب البيانات من db.json، الحالة: " + response.status);
      }
      const data = await response.json();

      // 2. ابحث في schedules عن كل من لديه subject = selectedSubject
      //    ثم نستخرج userId ونطابقه مع كائن المستخدم في users (role=student).
      const schedules = data.schedules || [];
      const users = data.users || [];

      // ابحث عن userId لكل طالبة لديها المادة المختارة
      const filteredSchedules = schedules.filter(sch => sch.subject === selectedSubject);

      // نظف الجدول قبل التعبئة
      studentsTbody.innerHTML = "";

      // أنشئ صفًا لكل طالبة
      filteredSchedules.forEach(sch => {
        // ابحث عن بيانات الطالبة في users
        const student = users.find(u => u.userId === sch.userId && u.role === "student");
        if (student) {
          const tr = document.createElement("tr");

          // خلية اسم الطالبة
          const tdName = document.createElement("td");
          tdName.textContent = student.name;

          // خلية الرقم الأكاديمي
          const tdAcademicId = document.createElement("td");
          tdAcademicId.textContent = student.academicId || "غير متوفر";

          // خلية Checkbox
          const tdCheckbox = document.createElement("td");
          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.value = student.userId; 
          // ملاحظة: يمكن أيضًا حفظ اسم المادة أو أي بيانات مطلوبة 
          // في خصائص الـcheckbox لتسهيل التحديث لاحقًا
          checkbox.dataset.subject = sch.subject;
          
          tdCheckbox.appendChild(checkbox);

          tr.appendChild(tdName);
          tr.appendChild(tdAcademicId);
          tr.appendChild(tdCheckbox);

          studentsTbody.appendChild(tr);
        }
      });

      if (filteredSchedules.length === 0) {
        alert("لا توجد طالبات مسجلات في هذه المادة.");
      }

    } catch (error) {
      console.error(error);
      alert("حدث خطأ أثناء عرض الطالبات: " + error.message);
    }
  }

  // 2) معالجة زر "حفظ الغياب"
  async function handleMarkAttendanceForm(event) {
    event.preventDefault();

    // احصل على كل الـCheckbox في الجدول
    const checkboxes = studentsTbody.querySelectorAll("input[type='checkbox']");
    if (!checkboxes.length) {
      alert("لا توجد طالبات لعرضهن، يرجى اختيار مادة ثم عرض الطالبات أولاً.");
      return;
    }

    try {
      // جلب attendance لتحديث الغيابات
      const response = await fetch("http://localhost:3000/attendance");
      if (!response.ok) {
        throw new Error("خطأ في جلب بيانات attendance! الحالة: " + response.status);
      }
      const allAttendance = await response.json();

      // أنشئ مصفوفة بالعمليات (Promises) المطلوبة من أجل التحديث
      const updatePromises = [];

      // مرّ على جميع الـcheckbox
      checkboxes.forEach(chk => {
        if (chk.checked) {
          // إذا كانت الطالبة “غائبة” (معلّمة بـ صح)، 
          // زِد الغياب بمقدار 1
            
          const userId = chk.value;
          const subject = chk.dataset.subject;

          // ابحث عن السجل الموجود (الطالبة + المادة)
          const existingAtt = allAttendance.find(a => a.userId === userId && a.subject === subject);

          if (existingAtt) {
            // إذا كان موجودًا، نستخدم PATCH لزيادة absences
            const newAbsences = (existingAtt.absences || 0) + 1;

            const patchPromise = fetch(`http://localhost:3000/attendance/${existingAtt.id}`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({ absences: newAbsences })
            });
            updatePromises.push(patchPromise);

          } else {
            // إذا لم يكن هناك سجل، يمكن إنشاؤه إذا أردت (POST)
            // أو يمكنك فقط تجاهل الأمر وعرض رسالة 
            // هنا سننشئ سجل جديد بالسجل absences=1
            const postPromise = fetch("http://localhost:3000/attendance", {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                userId: userId,
                subject: subject,
                absences: 1
              })
            });
            updatePromises.push(postPromise);
          }
        }
      });

      // نفذ جميع طلبات التحديث/الإضافة
      await Promise.all(updatePromises);

      alert("تم حفظ الغياب بنجاح!");
      // يمكنك إعادة تحميل الصفحة أو إلغاء تحديد الـ checkboxes
      // أو إعادة جلب البيانات للتحقق ...
      checkboxes.forEach(chk => chk.checked = false);

    } catch (error) {
      console.error(error);
      alert("حدث خطأ أثناء حفظ الغياب: " + error.message);
    }
  }
});

// هذه الدالة تُستدعى عند إرسال نموذج تسجيل طالبة جديدة
async function handleRegisterStudent(event) {
  event.preventDefault();

  // اجلب القيم من الحقول
  const nameInput = document.getElementById("newStudentName");
  const academicIdInput = document.getElementById("newStudentAcademicId");
  const majorInput = document.getElementById("major");
  const phoneInput = document.getElementById("phone");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  const name = nameInput.value.trim();
  const academicId = academicIdInput.value.trim();
  const major = majorInput.value.trim();
  const phone = phoneInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  // التحقق من القيم الأساسية
  if (!name || !academicId || !major || !password) {
    alert("الرجاء تعبئة الحقول المطلوبة!");
    return;
  }

  try {
    // 1) جلب بيانات المستخدمين من db.json
    const response = await fetch("db.json");
    if (!response.ok) {
      throw new Error("خطأ في جلب بيانات المستخدمين! الحالة: " + response.status);
    }
    const data = await response.json();
    const users = data.users || [];

    // 2) التحقق هل الطالبة موجودة مسبقًا (بناءً على الرقم الأكاديمي)
    const existingStudent = users.find(u => u.academicId === academicId);
    if (existingStudent) {
      alert("طالبة بهذا الرقم الأكاديمي مسجلة مسبقًا!");
      return;
    }

    // 3) انشاء سجل مستخدم جديد (طالبة)
    //    نفترض استخدام JSON Server، فنرسل POST إلى /users
    //    إذا كنتِ تريدين تحديث نفس db.json مباشرةً، استخدمي JSON Server.
    const postResponse = await fetch("http://localhost:3000/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        // الحقول التي تحتاجينها (ومطابقة لبنية user في db.json)
        role: "student",
        userId: academicId,    // يمكن جعله يطابق الرقم الأكاديمي
        password: password,    // كلمة المرور التي أدخلتها المشرفة
        name: name,
        academicId: academicId,
        major: major,
        phone: phone,
        email: email
      })
    });

    if (!postResponse.ok) {
      throw new Error("فشل في إضافة الطالبة الجديدة! الحالة: " + postResponse.status);
    }

    alert("تم تسجيل الطالبة بنجاح!");

    // تفريغ الحقول بعد الإضافة
    nameInput.value = "";
    academicIdInput.value = "";
    majorInput.value = "";
    phoneInput.value = "";
    emailInput.value = "";
    passwordInput.value = "";

  } catch (error) {
    console.error(error);
    alert("حدث خطأ أثناء تسجيل الطالبة: " + error.message);
  }
}

// ربط النموذج بالدالة عند تحميل الصفحة
document.addEventListener("DOMContentLoaded", () => {
  const registerForm = document.getElementById("registerStudentForm");
  if (registerForm) {
    registerForm.addEventListener("submit", handleRegisterStudent);
  }
});

// دالة للبحث عن الطالبة وجلب بياناتها
async function loadStudentData() {
  const searchAcademicIdInput = document.getElementById("searchAcademicId");
  const academicIdValue = searchAcademicIdInput.value.trim();

  if (!academicIdValue) {
    alert("الرجاء إدخال الرقم الأكاديمي أولاً!");
    return;
  }

  try {
    // جلب بيانات جميع المستخدمين
    const response = await fetch("db.json");
    if (!response.ok) {
      throw new Error("خطأ في جلب بيانات db.json! الحالة: " + response.status);
    }
    const data = await response.json();
    const users = data.users || [];

    // البحث عن الطالبة المطلوبة
    const student = users.find(u => 
      u.role === "student" &&
      u.academicId === academicIdValue
    );

    if (!student) {
      alert("لم يتم العثور على طالبة بهذا الرقم الأكاديمي!");
      // إخفاء النموذج إن كان ظاهرًا سابقًا
      document.getElementById("updateStudentForm").style.display = "none";
      return;
    }

    // عرض النموذج وملء البيانات
    document.getElementById("updateStudentForm").style.display = "block";

    // تعبئة الحقول (User ID, AcademicId, ...), بعضها للقراءة فقط
    document.getElementById("updUserId").value = student.userId || "";
    document.getElementById("updAcademicId").value = student.academicId || "";
    document.getElementById("updName").value = student.name || "";
    document.getElementById("updMajor").value = student.major || "";
    document.getElementById("updPhone").value = student.phone || "";
    document.getElementById("updEmail").value = student.email || "";
    document.getElementById("updPassword").value = student.password || "";

  } catch (error) {
    console.error(error);
    alert("حدث خطأ أثناء جلب بيانات الطالبة: " + error.message);
  }
}

// دالة لحفظ التعديلات
async function handleUpdateStudentForm(event) {
  event.preventDefault();

  // الحصول على الحقول
  const userIdField = document.getElementById("updUserId");
  const academicIdField = document.getElementById("updAcademicId");
  const nameField = document.getElementById("updName");
  const majorField = document.getElementById("updMajor");
  const phoneField = document.getElementById("updPhone");
  const emailField = document.getElementById("updEmail");
  const passwordField = document.getElementById("updPassword");

  // القيم الحالية في الصفحة
  const userIdVal = userIdField.value.trim();
  const academicIdVal = academicIdField.value.trim();
  const nameVal = nameField.value.trim();
  const majorVal = majorField.value.trim();
  const phoneVal = phoneField.value.trim();
  const emailVal = emailField.value.trim();
  const passwordVal = passwordField.value.trim();

  // تحقق أن الحقول الأساسية موجودة
  if (!userIdVal || !academicIdVal) {
    alert("User ID أو الرقم الأكاديمي غير متوفرين!");
    return;
  }

  try {
    // جلب users من السيرفر للعثور على السجل (بحاجة إلى id)
    const response = await fetch("db.json");
    if (!response.ok) {
      throw new Error("خطأ في جلب بيانات المستخدمين! الحالة: " + response.status);
    }
    const data = await response.json();
    const users = data.users || [];

    // العثور على مستخدم role=student وله userId أو academicId مطابق
    // الأفضل الاعتماد على 'id' الذي أنشأه JSON Server
    // لكن إن لم يكن لديك 'id' واضح، يمكنك إنشاء منطقك الخاص
    const student = users.find(u => 
      u.role === "student" &&
      u.academicId === academicIdVal
    );

    if (!student) {
      alert("حدث خطأ: لم يتم العثور على الطالبة في قاعدة البيانات!");
      return;
    }

    if (!student.id) {
      // التأكد من وجود حقل id للسجل 
      alert("لا يوجد حقل (id) لهذه الطالبة في db.json! لا يمكن التعديل عبر JSON Server.");
      return;
    }

    // جهزي الجسم المراد إرساله لـ PATCH
    // سنرسل فقط الحقول القابلة للتعديل
    const patchBody = {};
    // نقارن القيمة الجديدة بالقيمة القديمة، فإن اختلفت نضيفها (اختياريًا)
    if (nameVal !== student.name) patchBody.name = nameVal;
    if (majorVal !== student.major) patchBody.major = majorVal;
    if (phoneVal !== student.phone) patchBody.phone = phoneVal;
    if (emailVal !== student.email) patchBody.email = emailVal;
    if (passwordVal !== student.password) patchBody.password = passwordVal;

    // إذا لم يغيّر شيء، يمكن التنبيه أو إتمام العملية
    if (Object.keys(patchBody).length === 0) {
      alert("لم يتم تغيير أي بيانات، لا حاجة للتحديث!");
      return;
    }

    // طلب PATCH إلى JSON Server
    const patchResponse = await fetch(`http://localhost:3000/users/${student.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patchBody)
    });

    if (!patchResponse.ok) {
      throw new Error("فشل في تحديث بيانات الطالبة! الحالة: " + patchResponse.status);
    }

    alert("تم حفظ التعديلات بنجاح!");

  } catch (error) {
    console.error(error);
    alert("حدث خطأ أثناء حفظ التعديلات: " + error.message);
  }
}

// ربط الأزرار والأحداث عند تحميل الصفحة
document.addEventListener("DOMContentLoaded", () => {
  // زر عرض البيانات
  const loadBtn = document.getElementById("loadStudentDataBtn");
  if (loadBtn) {
    loadBtn.addEventListener("click", loadStudentData);
  }

  // قد يكون المعرف مختلفًا في الكود المكتوب أعلاه (loadStudentDataBtn)
  const realLoadBtn = document.getElementById("loadStudentDataBtn");
  if (realLoadBtn) {
    realLoadBtn.addEventListener("click", loadStudentData);
  }

  // نموذج حفظ التعديلات
  const updateForm = document.getElementById("updateStudentForm");
  if (updateForm) {
    updateForm.addEventListener("submit", handleUpdateStudentForm);
  }
});
// دالة معالجة نموذج تسجيل معلمة جديدة
async function handleRegisterTeacher(event) {
  event.preventDefault();

  const name = document.getElementById("teacherName").value.trim();
  const userId = document.getElementById("teacherId").value.trim();
  const specialty = document.getElementById("specialty").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!name || !userId || !specialty || !phone || !email || !password) {
    alert("الرجاء تعبئة جميع الحقول!");
    return;
  }

  try {
    // تأكد أولاً أنها غير موجودة بالفعل
    const getRes = await fetch("http://localhost:3000/users");
    const allUsers = await getRes.json();
    const found = allUsers.find(u => u.userId === userId);
    if (found) {
      alert("رقم المعلمة موجود مسبقًا!");
      return;
    }

    // إذا لم تكن موجودة، أضفها
    const postRes = await fetch("http://localhost:3000/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role: "teacher",
        userId: userId,
        name: name,
        specialty: specialty,
        phone: phone,
        email: email,
        password: password
      })
    });

    if (!postRes.ok) {
      throw new Error("فشل في إضافة المعلمة! الحالة: " + postRes.status);
    }

    alert("تم تسجيل المعلمة بنجاح!");
    // تفريغ الحقول
    document.getElementById("registerTeacherForm").reset();

  } catch (err) {
    console.error(err);
    alert("حدث خطأ: " + err.message);
  }
}
// دالة لجلب بيانات معلمة بالـ userId
async function loadTeacherData() {
  const steacherId = document.getElementById("searchTeacherId");
  const teacherId = steacherId.value.trim();
  if (!teacherId) {
    alert("الرجاء إدخال رقم المعلمة أولاً!");
    return;
  }

  try {
    const res = await fetch("db.json");
    if(!res.ok){
      throw new Error("hhhhhh" + response.status);
    }
    const allUsers = await res.json();
    const userst = data.allUsers || [];
    // ابحث عن المعلمة
    const teacher = userst.find(u => u.role === "teacher" && u.userId === teacherId);
    if (!teacher) {
      alert("لم يتم العثور على معلمة بهذا الرقم!");
      document.getElementById("updateTeacherForm").style.display = "none";
      return;
    }

    // أعرض النموذج واملئي حقوله
    document.getElementById("updateTeacherForm").style.display = "block";
    document.getElementById("updTeacherId").value = teacher.userId || "";
    document.getElementById("updTeacherName").value = teacher.name || "";
    document.getElementById("updSpecialty").value = teacher.specialty || "";
    document.getElementById("updPhone").value = teacher.phone || "";
    document.getElementById("updEmail").value = teacher.email || "";
    document.getElementById("updPassword").value = teacher.password || "";

  } catch (err) {
    console.error(err);
    alert("حدث خطأ: " + err.message);
  }
}

// دالة لتحديث بيانات المعلمة
async function handleUpdateTeacherForm(e) {
  e.preventDefault();

  const userId = document.getElementById("updTeacherId").value.trim();
  const name = document.getElementById("updTeacherName").value.trim();
  const specialty = document.getElementById("updSpecialty").value.trim();
  const phone = document.getElementById("updPhone").value.trim();
  const email = document.getElementById("updEmail").value.trim();
  const password = document.getElementById("updPassword").value.trim();

  if (!userId) {
    alert("رقم المعلمة مفقود!");
    return;
  }

  try {
    // ابحث عن سجل المعلمة في db.json للحصول على id
    const res = await fetch("http://localhost:3000/users");
    const allUsers = await res.json();
    const teacher = allUsers.find(u => u.role === "teacher" && u.userId === userId);
    if (!teacher) {
      alert("لم يتم العثور على هذه المعلمة في قاعدة البيانات!");
      return;
    }
    if (!teacher.id) {
      alert("لا يوجد حقل id لهذا السجل! لا يمكن التعديل عبر JSON Server.");
      return;
    }

    // نبني كائن PATCH
    const patchBody = {};
    if (name !== teacher.name) patchBody.name = name;
    if (specialty !== teacher.specialty) patchBody.specialty = specialty;
    if (phone !== teacher.phone) patchBody.phone = phone;
    if (email !== teacher.email) patchBody.email = email;
    if (password !== teacher.password) patchBody.password = password;

    if (Object.keys(patchBody).length === 0) {
      alert("لم يتم تغيير أي بيانات!");
      return;
    }

    // إرسال PATCH
    const patchRes = await fetch(`http://localhost:3000/users/${teacher.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patchBody)
    });

    if (!patchRes.ok) {
      throw new Error("فشل في التعديل! الحالة: " + patchRes.status);
    }

    alert("تم حفظ التعديلات بنجاح!");
  } catch (err) {
    console.error(err);
    alert("خطأ أثناء الحفظ: " + err.message);
  }
}

// جلب وعرض جميع سجلات الجداول
async function loadSchedules() {
  try {
    const res = await fetch("http://localhost:3000/schedules");
    const data = await res.json();
    const tableBody = document.querySelector("#scheduleTable tbody");
    tableBody.innerHTML = "";

    data.forEach(item => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${item.role}</td>
        <td>${item.userId}</td>
        <td>${item.subject}</td>
        <td>${item.day}</td>
        <td>${item.time}</td>
        <td>${item.room}</td>
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

// إضافة سجل جدول جديد
async function handleAddScheduleForm(e) {
  e.preventDefault();
  const role = document.getElementById("scheduleRole").value.trim();
  const userId = document.getElementById("scheduleUserId").value.trim();
  const subject = document.getElementById("scheduleSubject").value.trim();
  const day = document.getElementById("scheduleDay").value.trim();
  const time = document.getElementById("scheduleTime").value.trim();
  const room = document.getElementById("scheduleRoom").value.trim();

  if (!role || !userId || !subject || !day || !time || !room) {
    alert("الرجاء تعبئة جميع الحقول!");
    return;
  }

  try {
    const res = await fetch("http://localhost:3000/schedules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, userId, subject, day, time, room })
    });
    if (!res.ok) throw new Error("فشل في إضافة السجل! الحالة: " + res.status);

    alert("تمت الإضافة بنجاح!");
    document.getElementById("addScheduleForm").reset();
    loadSchedules(); // إعادة تحميل القائمة
  } catch (err) {
    console.error(err);
    alert("خطأ في الإضافة: " + err.message);
  }
}

// حذف سجل جدول
async function deleteSchedule(id) {
  if (!confirm("هل أنت متأكد من الحذف؟")) return;
  try {
    const res = await fetch(`http://localhost:3000/schedules/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("فشل في الحذف! الحالة: " + res.status);
    alert("تم حذف السجل بنجاح!");
    loadSchedules();
  } catch (err) {
    console.error(err);
    alert("خطأ في الحذف: " + err.message);
  }
}

// تعديل سجل (بشكل مبسط) - يمكنك فعل نافذة أو نموذج منبثق:
function editSchedule(id) {
  const newDay = prompt("أدخل اليوم الجديد؟");
  if (!newDay) return;
  patchSchedule(id, { day: newDay });
}
async function patchSchedule(id, patchData) {
  try {
    const res = await fetch(`http://localhost:3000/schedules/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patchData)
    });
    if (!res.ok) throw new Error("فشل في التعديل! الحالة: " + res.status);
    alert("تم تعديل السجل بنجاح!");
    loadSchedules();
  } catch (err) {
    console.error(err);
    alert("خطأ في التعديل: " + err.message);
  }
}

// جلب وعرض قائمة المواد
async function loadSubjects() {
  try {
    const res = await fetch("http://localhost:3000/subjects");
    const subjects = await res.json();
    const tbody = document.querySelector("#subjectsTable tbody");
    tbody.innerHTML = "";

    subjects.forEach(subj => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${subj.code}</td>
        <td>${subj.name}</td>
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

// إضافة مادة
async function handleAddSubjectForm(e) {
  e.preventDefault();
  const code = document.getElementById("subjectCodeInput").value.trim();
  const name = document.getElementById("subjectNameInput").value.trim();
  if (!code || !name) {
    alert("الرجاء تعبئة جميع الحقول!");
    return;
  }
  try {
    const res = await fetch("http://localhost:3000/subjects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, name })
    });
    if (!res.ok) throw new Error("فشل في إضافة المادة! الحالة: " + res.status);

    alert("تمت إضافة المادة بنجاح!");
    document.getElementById("addSubjectForm").reset();
    loadSubjects();
  } catch (err) {
    console.error(err);
    alert("خطأ: " + err.message);
  }
}

// حذف مادة
async function deleteSubject(id) {
  if (!confirm("هل أنت متأكد من الحذف؟")) return;
  try {
    const res = await fetch(`http://localhost:3000/subjects/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("فشل في الحذف! الحالة: " + res.status);
    alert("تم الحذف بنجاح!");
    loadSubjects();
  } catch (err) {
    console.error(err);
    alert("خطأ: " + err.message);
  }
}

// تحرير مادة (بشكل بسيط باستخدام prompt)
function editSubject(id) {
  const newName = prompt("أدخل الاسم الجديد للمادة:");
  if (!newName) return;
  patchSubject(id, { name: newName });
}
async function patchSubject(id, patchData) {
  try {
    const res = await fetch(`http://localhost:3000/subjects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patchData)
    });
    if (!res.ok) throw new Error("فشل في التعديل! الحالة: " + res.status);
    alert("تم تعديل المادة بنجاح!");
    loadSubjects();
  } catch (err) {
    console.error(err);
    alert("خطأ في التعديل: " + err.message);
  }
}