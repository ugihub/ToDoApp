document.addEventListener("DOMContentLoaded", () => {
  // Select elements
  const menuToggle = document.getElementById("menu-toggle");
  const closeSidebar = document.getElementById("close-sidebar");
  const sidebar = document.getElementById("sidebar");

  // Add event listener for menu toggle button
  menuToggle.addEventListener("click", function () {
    sidebar.classList.add("active"); // Show sidebar
    menuToggle.classList.add("hidden"); // Hide toggle button
  });

  // Add event listener for close button
  closeSidebar.addEventListener("click", function () {
    sidebar.classList.remove("active"); // Hide sidebar
    menuToggle.classList.remove("hidden"); // Show toggle button
  });


  const todoForm = document.getElementById("todo-form");
  const taskNameInput = document.getElementById("task-name");
  const taskDescriptionInput = document.getElementById("task-description");
  const taskDeadlineDateInput = document.getElementById("task-deadline-date");
  const taskDeadlineTimeInput = document.getElementById("task-deadline-time");
  const todoList = document.getElementById("todo-list");
  const deadlineCountdown = document.getElementById("deadline-countdown");

  let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

  // Fungsi untuk menyimpan tugas ke localStorage
  function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }

  // Fungsi untuk menampilkan daftar tugas
  function renderTasks() {
    todoList.innerHTML = "";
    deadlineCountdown.innerHTML = "";

    tasks.forEach((task, index) => {
      // Render daftar acara dengan nama, deskripsi, dan deadline
      const li = document.createElement("li");
      li.innerHTML = `
      <div class="taxs">
        <strong>${task.name}</strong>
        <span>${task.description || "Tidak ada deskripsi"}</span>
        <small>Deadline: ${new Date(task.deadline).toLocaleString()}</small>
      </div>
        
      <div class="actions">
        <button onclick="editTask(${index})">Edit</button>
        <button onclick="deleteTask(${index})">Hapus</button>
      </div>
      `;
      todoList.appendChild(li);

      // Render countdown timer (tanpa detik)
      const countdownLi = document.createElement("li");
      const timeLeft = calculateTimeLeft(task.deadline);
      countdownLi.setAttribute("data-task-index", index); // Simpan indeks tugas

      if (timeLeft.total <= 0) {
        countdownLi.classList.add("deadline-near");
        countdownLi.innerHTML = `${task.name}: Deadline telah berakhir!`;
        showNotification(task.name);
      } else {
        countdownLi.innerHTML = `
          ${task.name}: 
          ${timeLeft.days} hari ${timeLeft.hours} jam ${timeLeft.minutes} menit
        `;
      }
      deadlineCountdown.appendChild(countdownLi);
    });

    // Mulai interval untuk memperbarui countdown setiap detik
    startCountdownInterval();
  }

  // Fungsi untuk menghitung waktu tersisa (tanpa detik)
  function calculateTimeLeft(deadline) {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diff = deadlineDate - now;

    if (diff <= 0) return { total: 0 };

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return { total: diff, days, hours, minutes };
  }

  // Fungsi untuk menampilkan notifikasi
  function showNotification(taskName) {
    if (Notification.permission === "granted") {
      new Notification(`Deadline "${taskName}" telah berakhir!`);
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          new Notification(`Deadline "${taskName}" telah berakhir!`);
        }
      });
    }
  }

  // Fungsi untuk menambahkan/memperbarui acara di Google Calendar
  async function updateGoogleCalendar(task, action = "add") {
    const deadlineDate = new Date(task.deadline);
    const startDate = deadlineDate.toISOString();
    const endDate = new Date(deadlineDate.getTime() + 1 * 60 * 60 * 1000).toISOString(); // 1 jam setelah deadline

    console.log("Sending update request with data:", {
      eventId: task.eventId,
      summary: task.name,
      description: task.description,
      startDate,
      endDate,
    });

    try {
      const response = await fetch(`http://localhost:3000/${action}-event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: task.eventId, // Pastikan event ID dikirim
          summary: task.name,
          description: task.description,
          startDate,
          endDate,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        alert(
          `Gagal ${action === "add" ? "menambahkan" : "memperbarui"} acara di Google Calendar.`
        );
      } else {
        if (action === "add") {
          task.eventId = result.eventId; // Simpan event ID dari respons backend
          saveTasks(); // Simpan kembali ke localStorage
        }
      }
    } catch (error) {
      console.error("Error:", error);
      alert(
        `Terjadi kesalahan saat ${action === "add" ? "menambahkan" : "memperbarui"} acara di Google Calendar.`
      );
    }
  }

  // Event listener untuk form tambah tugas
  todoForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const task = {
      name: taskNameInput.value,
      description: taskDescriptionInput.value,
      deadline: `${taskDeadlineDateInput.value}T${taskDeadlineTimeInput.value}`,
    };

    tasks.push(task);
    saveTasks();
    renderTasks();

    // Tambahkan tugas ke Google Calendar
    await updateGoogleCalendar(task);

    // Reset form
    taskNameInput.value = "";
    taskDescriptionInput.value = "";
    taskDeadlineDateInput.value = "";
    taskDeadlineTimeInput.value = "";
  });

  // Fungsi untuk menghapus tugas
  window.deleteTask = async (index) => {
    const task = tasks[index];
    tasks.splice(index, 1);
    saveTasks();
    renderTasks();

    // Hapus acara dari Google Calendar
    await updateGoogleCalendar(task, "delete");
  };

  // Variabel global untuk menyimpan indeks tugas yang sedang diedit
  let editTaskIndex = null;

  // Fungsi untuk menampilkan modal edit
  function openEditModal(index) {
    const task = tasks[index];
    editTaskIndex = index; // Simpan indeks tugas yang sedang diedit

    // Isi form modal dengan data tugas
    document.getElementById("edit-task-name").value = task.name;
    document.getElementById("edit-task-description").value = task.description;

    const [date, time] = task.deadline.split("T");
    document.getElementById("edit-task-deadline-date").value = date;
    document.getElementById("edit-task-deadline-time").value = time;

    // Tampilkan modal
    const modal = document.getElementById("edit-modal");
    modal.style.display = "block";
  }

  // Fungsi untuk menyembunyikan modal edit
  function closeEditModal() {
    const modal = document.getElementById("edit-modal");
    modal.style.display = "none";
  }

  // Event listener untuk tombol close modal
  document.querySelector(".close-modal").addEventListener("click", closeEditModal);

  // Tutup modal jika pengguna mengklik di luar modal
  window.addEventListener("click", (event) => {
    const modal = document.getElementById("edit-modal");
    if (event.target === modal) {
      closeEditModal();
    }
  });

  // Event listener untuk form edit
  document.getElementById("edit-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    // Ambil data dari form modal
    const updatedTask = {
      name: document.getElementById("edit-task-name").value,
      description: document.getElementById("edit-task-description").value,
      deadline: `${document.getElementById("edit-task-deadline-date").value}T${document.getElementById("edit-task-deadline-time").value
        }`,
    };

    // Dapatkan tugas lama dari array
    const oldTask = tasks[editTaskIndex];

    // Hapus acara lama dari Google Calendar
    await updateGoogleCalendar(oldTask, "delete");

    // Tambahkan acara baru ke Google Calendar
    tasks[editTaskIndex] = updatedTask;
    saveTasks();
    renderTasks();

    await updateGoogleCalendar(updatedTask, "add");

    // Sembunyikan modal
    closeEditModal();
  });

  // Fungsi untuk mengedit tugas
  window.editTask = (index) => {
    openEditModal(index);
  };

  // Fungsi untuk memulai interval countdown
  function startCountdownInterval() {
    setInterval(() => {
      const countdownItems = document.querySelectorAll("#deadline-countdown li");
      countdownItems.forEach((item) => {
        const taskIndex = item.getAttribute("data-task-index");
        const task = tasks[taskIndex];

        if (task) {
          const timeLeft = calculateTimeLeft(task.deadline);

          if (timeLeft.total <= 0) {
            item.classList.add("deadline-near");
            item.innerHTML = `${task.name}: Deadline telah berakhir!`;
            showNotification(task.name);
          } else {
            item.innerHTML = `
              ${task.name}: 
              ${timeLeft.days} hari ${timeLeft.hours} jam ${timeLeft.minutes} menit
            `;
          }
        }
      });
    }, 1000); // Perbarui setiap detik
  }

  // Render tugas saat halaman dimuat
  renderTasks();

  // Logout functionality
  document.getElementById("logout-button").addEventListener("click", () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("profileInfo");
    window.location.href = "login.html";
  });

  // Redirect to login page if not logged in
  const isLoggedIn = localStorage.getItem("isLoggedIn");
  if (!isLoggedIn) {
    window.location.href = "login.html";
  }
});