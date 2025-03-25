// Import Firebase modules
import firebase from "firebase/app"
import "firebase/auth"
import "firebase/firestore"
import "firebase/analytics"

// Firebase configuration
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

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig)
}

// Initialize services
const auth = firebase.auth()
const db = firebase.firestore()
const analytics = firebase.analytics()

// Set persistence to local
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)

// Export Firebase services
window.firebaseServices = {
  auth,
  db,
  analytics,
  firestore: firebase.firestore,
}

