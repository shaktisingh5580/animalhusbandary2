// Import Firebase (replace with your actual Firebase configuration)
import { initializeApp } from "firebase/app"
import { getAuth, createUserWithEmailAndPassword, updateProfile } from "firebase/auth"
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore"

// Your web app's Firebase configuration
// Replace with your actual Firebase configuration object
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

  // Password strength checker
  if (registerPassword) {
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
  }

  // Function to update requirement check icons
  function updateRequirementCheck(element, isValid) {
    if (!element) return
    const icon = element.querySelector("i")
    if (isValid) {
      icon.className = "bi bi-check-circle"
    } else {
      icon.className = "bi bi-x-circle"
    }
  }

  // Confirm password validation
  if (registerConfirmPassword) {
    registerConfirmPassword.addEventListener("input", function () {
      if (registerPassword.value !== this.value) {
        this.setCustomValidity("Passwords do not match")
      } else {
        this.setCustomValidity("")
      }
    })
  }

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
  if (registerForm) {
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
        const userCredential = await createUserWithEmailAndPassword(auth, registerEmail.value, registerPassword.value)

        const user = userCredential.user

        // Add user details to Firestore
        await setDoc(doc(db, "users", user.uid), {
          name: registerName.value,
          email: registerEmail.value,
          role: registerRole.value,
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
        })

        // Update user profile
        await updateProfile(user, {
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
  }
})

