document.addEventListener("DOMContentLoaded", () => {
  const isLoggedIn = localStorage.getItem("isLoggedIn");

  if (!isLoggedIn) {
    alert("Anda harus login terlebih dahulu.");
    window.location.href = "login.html";
    return;
  }

  const profileInfo = JSON.parse(localStorage.getItem("profileInfo"));

  if (!profileInfo) {
    alert("Informasi profil tidak ditemukan.");
    window.location.href = "login.html";
    return;
  }

  document.getElementById("profile-picture").src = profileInfo.picture;
  document.getElementById("profile-name").textContent = profileInfo.name;
  document.getElementById("profile-email").textContent = profileInfo.email;

  // Logout functionality
  document.getElementById("logout-button").addEventListener("click", () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("profileInfo");
    window.location.href = "login.html";
  });
});

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
