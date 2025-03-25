// Import Firebase modules (replace with your actual Firebase configuration)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js"
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js"
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  FieldValue,
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js"

// Import Bootstrap for Toast
import * as bootstrap from "bootstrap"

// Firebase configuration (replace with your actual configuration)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)
const firebase = {
  firestore: {
    FieldValue: {
      serverTimestamp: FieldValue.serverTimestamp,
    },
  },
}

// DOM Elements
const authContainer = document.getElementById("auth-container")
const registerContainer = document.getElementById("register-container")
const dashboardContainer = document.getElementById("dashboard-container")
const showRegisterLink = document.getElementById("show-register")
const showLoginLink = document.getElementById("show-login")
const loginForm = document.getElementById("login-form")
const logoutBtn = document.getElementById("logout-btn")
const userName = document.getElementById("user-name")
const userRole = document.getElementById("user-role")
const navMenu = document.getElementById("nav-menu")
const loadingOverlay = document.getElementById("loading-overlay")
const loginError = document.getElementById("login-error")
const registerError = document.getElementById("register-error")
const passwordStrength = document.getElementById("password-strength")
const strengthBar = document.querySelector("#password-strength .progress-bar")
const strengthText = document.getElementById("strength-text")

// Show register form
showRegisterLink.addEventListener("click", (e) => {
  e.preventDefault()
  authContainer.classList.add("d-none")
  registerContainer.classList.remove("d-none")
})

// Show login form
showLoginLink.addEventListener("click", (e) => {
  e.preventDefault()
  registerContainer.classList.add("d-none")
  authContainer.classList.remove("d-none")
})

// Toggle password visibility
document.querySelectorAll(".toggle-password").forEach((button) => {
  button.addEventListener("click", (e) => {
    const passwordField = e.target.closest(".input-group").querySelector("input")
    const icon = e.target.closest(".toggle-password").querySelector("i")

    if (passwordField.type === "password") {
      passwordField.type = "text"
      icon.classList.remove("bi-eye")
      icon.classList.add("bi-eye-slash")
    } else {
      passwordField.type = "password"
      icon.classList.remove("bi-eye-slash")
      icon.classList.add("bi-eye")
    }
  })
})

// Password strength checker
document.getElementById("register-password").addEventListener("input", (e) => {
  const password = e.target.value

  if (password.length > 0) {
    passwordStrength.classList.remove("d-none")

    // Calculate strength
    let strength = 0

    // Length check
    if (password.length >= 8) strength += 25

    // Uppercase check
    if (/[A-Z]/.test(password)) strength += 25

    // Lowercase check
    if (/[a-z]/.test(password)) strength += 25

    // Number/special char check
    if (/[0-9!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 25

    // Update UI
    strengthBar.style.width = `${strength}%`

    if (strength < 50) {
      strengthBar.className = "progress-bar bg-danger"
      strengthText.textContent = "Weak"
    } else if (strength < 75) {
      strengthBar.className = "progress-bar bg-warning"
      strengthText.textContent = "Medium"
    } else {
      strengthBar.className = "progress-bar bg-success"
      strengthText.textContent = "Strong"
    }
  } else {
    passwordStrength.classList.add("d-none")
  }
})

// Registration functionality
document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const registerForm = document.getElementById("register-form")
  const registerName = document.getElementById("register-name")
  const registerEmail = document.getElementById("register-email")
  const registerRole = document.getElementById("register-role")
  const registerPassword = document.getElementById("register-password")
  const registerConfirmPassword = document.getElementById("register-confirm-password")
  const registerTerms = document.getElementById("register-terms")
  const registerError = document.getElementById("register-error")
  const registerSuccess = document.getElementById("register-success")
  const registerSpinner = document.getElementById("register-spinner")
  const registerSubmitBtn = document.getElementById("register-submit-btn")
  const passwordStrength = document.getElementById("password-strength")
  const strengthBar = document.querySelector("#password-strength .progress-bar")
  const strengthText = document.getElementById("strength-text")

  // Password requirement checks
  const lengthCheck = document.getElementById("length-check")
  const uppercaseCheck = document.getElementById("uppercase-check")
  const lowercaseCheck = document.getElementById("lowercase-check")
  const numberCheck = document.getElementById("number-check")

  // Firebase configuration - Update with your actual Firebase config
  const firebaseConfig = {
    apiKey: "AIzaSyDKgWv-kzql8lGLjSuknrzc8R5KDsteg6I",
    authDomain: "newhealthcare-66661.firebaseapp.com",
    databaseURL: "https://newhealthcare-66661-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "newhealthcare-66661",
    storageBucket: "newhealthcare-66661.firebasestorage.app",
    messagingSenderId: "707204021039",
    appId: "1:707204021039:web:3b7b831a1f9fa2b5497fda",
    measurementId: "G-1D3F39JGV2",
  }

  // Initialize Firebase if not already initialized
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig)
  }

  // Get Firebase services
  const auth = firebase.auth()
  const db = firebase.firestore()

  // Password strength checker
  registerPassword.addEventListener("input", function () {
    const password = this.value

    // Show password strength meter
    passwordStrength.style.display = password.length > 0 ? "block" : "none"

    // Check requirements
    const hasLength = password.length >= 8
    const hasUppercase = /[A-Z]/.test(password)
    const hasLowercase = /[a-z]/.test(password)
    const hasNumber = /[0-9]/.test(password)

    // Update requirement indicators
    updateRequirementCheck(lengthCheck, hasLength)
    updateRequirementCheck(uppercaseCheck, hasUppercase)
    updateRequirementCheck(lowercaseCheck, hasLowercase)
    updateRequirementCheck(numberCheck, hasNumber)

    // Calculate strength
    let strength = 0
    if (hasLength) strength += 25
    if (hasUppercase) strength += 25
    if (hasLowercase) strength += 25
    if (hasNumber) strength += 25

    // Update strength bar
    strengthBar.style.width = `${strength}%`

    // Update strength text and color
    if (strength < 50) {
      strengthBar.className = "progress-bar bg-danger"
      strengthText.textContent = "Weak"
    } else if (strength < 75) {
      strengthBar.className = "progress-bar bg-warning"
      strengthText.textContent = "Medium"
    } else {
      strengthBar.className = "progress-bar bg-success"
      strengthText.textContent = "Strong"
    }
  })

  // Function to update requirement check icons
  function updateRequirementCheck(element, isValid) {
    const icon = element.querySelector("i")
    if (isValid) {
      icon.className = "bi bi-check-circle"
    } else {
      icon.className = "bi bi-x-circle"
    }
  }

  // Confirm password validation
  registerConfirmPassword.addEventListener("input", function () {
    if (registerPassword.value !== this.value) {
      this.setCustomValidity("Passwords do not match")
    } else {
      this.setCustomValidity("")
    }
  })

  // Toggle password visibility
  document.querySelectorAll(".toggle-password").forEach((button) => {
    button.addEventListener("click", function () {
      const passwordField = this.closest(".input-group").querySelector("input")
      const icon = this.querySelector("i")

      if (passwordField.type === "password") {
        passwordField.type = "text"
        icon.className = "bi bi-eye-slash"
      } else {
        passwordField.type = "password"
        icon.className = "bi bi-eye"
      }
    })
  })

  // Form validation
  registerForm.addEventListener("submit", async function (e) {
    e.preventDefault()

    // Clear previous error messages
    registerError.classList.add("d-none")
    registerSuccess.classList.add("d-none")

    // Check form validity
    if (!this.checkValidity()) {
      e.stopPropagation()
      this.classList.add("was-validated")
      return
    }

    // Check if passwords match
    if (registerPassword.value !== registerConfirmPassword.value) {
      registerError.textContent = "Passwords do not match."
      registerError.classList.remove("d-none")
      return
    }

    // Show loading state
    registerSpinner.classList.remove("d-none")
    registerSubmitBtn.disabled = true

    try {
      // Create user with email and password
      const userCredential = await auth.createUserWithEmailAndPassword(registerEmail.value, registerPassword.value)

      const user = userCredential.user

      // Add user details to Firestore
      await db.collection("users").doc(user.uid).set({
        name: registerName.value,
        email: registerEmail.value,
        role: registerRole.value,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
      })

      // Update user profile
      await user.updateProfile({
        displayName: registerName.value,
      })

      // Reset form
      registerForm.reset()
      registerForm.classList.remove("was-validated")

      // Show success message
      registerSuccess.textContent = "Registration successful! You can now log in."
      registerSuccess.classList.remove("d-none")

      // Redirect to login after 3 seconds
      setTimeout(() => {
        document.getElementById("show-login").click()
      }, 3000)
    } catch (error) {
      // Handle specific Firebase Auth errors
      let errorMessage = "An error occurred during registration."

      switch (error.code) {
        case "auth/email-already-in-use":
          errorMessage = "This email is already registered. Please use a different email or try logging in."
          break
        case "auth/invalid-email":
          errorMessage = "The email address is not valid."
          break
        case "auth/weak-password":
          errorMessage = "The password is too weak. Please choose a stronger password."
          break
        case "auth/network-request-failed":
          errorMessage = "Network error. Please check your internet connection and try again."
          break
        default:
          errorMessage = `Error: ${error.message}`
      }

      registerError.textContent = errorMessage
      registerError.classList.remove("d-none")

      console.error("Registration error:", error)
    } finally {
      // Hide loading state
      registerSpinner.classList.add("d-none")
      registerSubmitBtn.disabled = false
    }
  })
})

// Login user
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault()

  // Hide any previous errors
  loginError.classList.add("d-none")

  const email = document.getElementById("login-email").value
  const password = document.getElementById("login-password").value

  // Show loading overlay
  loadingOverlay.classList.remove("d-none")

  try {
    await signInWithEmailAndPassword(auth, email, password)
    loginForm.reset()

    // Hide loading overlay
    loadingOverlay.classList.add("d-none")
  } catch (error) {
    // Hide loading overlay
    loadingOverlay.classList.add("d-none")

    // Show error message
    loginError.textContent = `Error: ${error.message}`
    loginError.classList.remove("d-none")
  }
})

// Logout user
logoutBtn.addEventListener("click", async () => {
  try {
    // Show loading overlay
    loadingOverlay.classList.remove("d-none")

    await signOut(auth)

    // Hide loading overlay
    loadingOverlay.classList.add("d-none")

    // Show success toast
    showToast("Logout Successful", "You have been logged out successfully.", "info")
  } catch (error) {
    // Hide loading overlay
    loadingOverlay.classList.add("d-none")

    // Show error toast
    showToast("Logout Error", `Error: ${error.message}`, "danger")
  }
})

// Auth state change listener
onAuthStateChanged(auth, async (user) => {
  if (user) {
    // User is signed in
    logoutBtn.classList.remove("d-none")

    // Show  {
    // User is signed in
    logoutBtn.classList.remove("d-none")

    // Show loading overlay while fetching user data
    loadingOverlay.classList.remove("d-none")

    // Get user data from Firestore
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid))

      if (userDoc.exists) {
        const userData = userDoc.data()

        // Update UI
        userName.textContent = userData.name
        userRole.textContent = userData.role.charAt(0).toUpperCase() + userData.role.slice(1)

        // Show dashboard
        authContainer.classList.add("d-none")
        registerContainer.classList.add("d-none")
        dashboardContainer.classList.remove("d-none")

        // Load menu based on user role
        loadMenu(userData.role)

        // Load dashboard content
        loadDashboard(userData.role)

        // Update last login timestamp
        await setDoc(doc(db, "users", user.uid), {
          lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
        })

        // Show welcome toast
        showToast("Welcome", `Welcome back, ${userData.name}!`, "success")
      } else {
        // User document doesn't exist
        console.error("User document not found")
        await signOut(auth)
        showToast("Error", "User data not found. Please contact support.", "danger")
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
      showToast("Error", "Failed to load user data. Please try again.", "danger")
    }

    // Hide loading overlay
    loadingOverlay.classList.add("d-none")
  } else {
    // User is signed out
    logoutBtn.classList.add("d-none")
    userName.textContent = "Not logged in"
    userRole.textContent = ""

    // Show login form
    dashboardContainer.classList.add("d-none")
    registerContainer.classList.add("d-none")
    authContainer.classList.remove("d-none")

    // Clear menu
    navMenu.innerHTML = ""
  }
})

// Load menu based on user role
function loadMenu(role) {
  navMenu.innerHTML = ""

  // Common menu items
  const menuItems = [{ id: "dashboard", text: "Dashboard", icon: "bi-speedometer2" }]

  // Role-specific menu items
  if (role === "farmer") {
    menuItems.push(
      { id: "medicine-requests", text: "Medicine Requests", icon: "bi-capsule" },
      { id: "livestock-health", text: "Livestock Health", icon: "bi-heart-pulse" },
      { id: "find-vets", text: "Find Vets", icon: "bi-geo-alt" },
    )
  } else if (role === "vet") {
    menuItems.push(
      { id: "medicine-approvals", text: "Medicine Approvals", icon: "bi-check-circle" },
      { id: "health-reports", text: "Health Reports", icon: "bi-clipboard-pulse" },
      { id: "update-location", text: "Update Location", icon: "bi-geo-alt" },
    )
  } else if (role === "government") {
    menuItems.push(
      { id: "medicine-inventory", text: "Medicine Inventory", icon: "bi-box-seam" },
      { id: "distribution-reports", text: "Distribution Reports", icon: "bi-graph-up" },
      { id: "user-management", text: "User Management", icon: "bi-people" },
    )
  }

  // Add menu items to DOM
  menuItems.forEach((item) => {
    const li = document.createElement("li")
    li.className = "nav-item"
    li.innerHTML = `
            <a class="nav-link" href="#" id="${item.id}-link">
                <i class="bi ${item.icon} me-2"></i>
                ${item.text}
            </a>
        `
    navMenu.appendChild(li)

    // Add event listener
    document.getElementById(`${item.id}-link`).addEventListener("click", () => {
      // Remove active class from all links
      document.querySelectorAll(".nav-link").forEach((link) => {
        link.classList.remove("active")
      })

      // Add active class to clicked link
      document.getElementById(`${item.id}-link`).classList.add("active")

      // Update page title
      document.getElementById("page-title").textContent = item.text

      // Load content based on menu item
      if (item.id === "dashboard") {
        loadDashboard(role)
      } else if (
        item.id === "medicine-requests" ||
        item.id === "medicine-approvals" ||
        item.id === "medicine-inventory"
      ) {
        loadMedicineModule(item.id, role)
      } else if (item.id === "livestock-health" || item.id === "health-reports") {
        loadLivestockModule(item.id, role)
      } else if (item.id === "find-vets" || item.id === "update-location") {
        loadMapModule(item.id, role)
      } else if (item.id === "distribution-reports" || item.id === "user-management") {
        loadReportsModule(item.id, role)
      }
    })
  })

  // Set dashboard as active by default
  document.getElementById("dashboard-link").classList.add("active")
}

// Show toast notification
function showToast(title, message, type = "primary") {
  const toast = document.getElementById("toast")
  const toastTitle = document.getElementById("toast-title")
  const toastMessage = document.getElementById("toast-message")
  const toastTime = document.getElementById("toast-time")

  // Set toast content
  toastTitle.textContent = title
  toastMessage.textContent = message
  toastTime.textContent = new Date().toLocaleTimeString()

  // Set toast type
  toast.className = "toast"
  toast.classList.add(`text-bg-${type}`)

  // Show toast
  const bsToast = new bootstrap.Toast(toast)
  bsToast.show()
}

// Refresh button functionality
document.getElementById("refresh-btn").addEventListener("click", () => {
  const activeLink = document.querySelector(".nav-link.active")
  if (activeLink) {
    activeLink.click()
  }
})

// Print button functionality
document.getElementById("print-btn").addEventListener("click", () => {
  window.print()
})

// Dummy functions for modules (replace with your actual module loading logic)
function loadDashboard(role) {
  console.log("Loading dashboard for role:", role)
  // Add your dashboard loading logic here
}

function loadMedicineModule(moduleId, role) {
  console.log("Loading medicine module:", moduleId, "for role:", role)
  // Add your medicine module loading logic here
}

function loadLivestockModule(moduleId, role) {
  console.log("Loading livestock module:", moduleId, "for role:", role)
  // Add your livestock module loading logic here
}

function loadMapModule(moduleId, role) {
  console.log("Loading map module:", moduleId, "for role:", role)
  // Add your map module loading logic here
}

function loadReportsModule(moduleId, role) {
  console.log("Loading reports module:", role)
  // Add your reports module loading logic here
}

