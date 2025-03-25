// Declare contentArea and db variables
const contentArea = document.getElementById("content") // Assuming 'content' is the ID of your content area
// Import the Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js"
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js"

// Firebase configuration
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
const db = getFirestore(app) // Assuming you are using Firebase

// Load reports module based on menu item and user role
function loadReportsModule(menuItem, role) {
  if (menuItem === "distribution-reports" && role === "government") {
    loadDistributionReports()
  } else if (menuItem === "user-management" && role === "government") {
    loadUserManagement()
  }
}

// Load distribution reports
function loadDistributionReports() {
  contentArea.innerHTML = `
        <div class="d-flex justify-content-between mb-4">
            <h3>Medicine Distribution Reports</h3>
        </div>
        <div class="row mb-4">
            <div class="col-md-4">
                <div class="card">
                    <div class="card-body">
                        <h5 class="card-title">Total Medicines Distributed</h5>
                        <h2 class="text-primary" id="total-medicines">Loading...</h2>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card">
                    <div class="card-body">
                        <h5 class="card-title">Farmers Served</h5>
                        <h2 class="text-success" id="farmers-served">Loading...</h2>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card">
                    <div class="card-body">
                        <h5 class="card-title">Pending Requests</h5>
                        <h2 class="text-warning" id="pending-requests">Loading...</h2>
                    </div>
                </div>
            </div>
        </div>
        <div class="card mb-4">
            <div class="card-header">
                <h5 class="mb-0">Distribution by Medicine Type</h5>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>Medicine</th>
                                <th>Total Distributed</th>
                                <th>Current Stock</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody id="distribution-by-medicine-table">
                            <tr>
                                <td colspan="4" class="text-center">Loading...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        <div class="card">
            <div class="card-header">
                <h5 class="mb-0">Recent Distribution Activity</h5>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Farmer</th>
                                <th>Medicine</th>
                                <th>Quantity</th>
                                <th>Approved By</th>
                            </tr>
                        </thead>
                        <tbody id="recent-distribution-table">
                            <tr>
                                <td colspan="5" class="text-center">Loading...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `

  // Load distribution statistics
  loadDistributionStatistics()

  // Load distribution by medicine table
  loadDistributionByMedicineTable()

  // Load recent distribution table
  loadRecentDistributionTable()
}

// Load distribution statistics
async function loadDistributionStatistics() {
  try {
    // Get total medicines distributed
    const distributionSnapshot = await db.collection("medicineRequests").where("status", "==", "approved").get()

    let totalMedicines = 0
    const farmerIds = new Set()

    distributionSnapshot.forEach((doc) => {
      const distribution = doc.data()
      totalMedicines += distribution.quantity
      farmerIds.add(distribution.farmerId)
    })

    document.getElementById("total-medicines").textContent = totalMedicines
    document.getElementById("farmers-served").textContent = farmerIds.size

    // Get pending requests
    const pendingSnapshot = await db.collection("medicineRequests").where("status", "==", "pending").get()

    document.getElementById("pending-requests").textContent = pendingSnapshot.size
  } catch (error) {
    document.getElementById("total-medicines").textContent = "Error"
    document.getElementById("farmers-served").textContent = "Error"
    document.getElementById("pending-requests").textContent = "Error"
    console.error("Error loading distribution statistics:", error)
  }
}

// Load distribution by medicine table
async function loadDistributionByMedicineTable() {
  const tableBody = document.getElementById("distribution-by-medicine-table")

  try {
    // Get all medicines
    const medicinesSnapshot = await db.collection("medicines").orderBy("name").get()

    if (medicinesSnapshot.empty) {
      tableBody.innerHTML = '<tr><td colspan="4" class="text-center">No medicines found.</td></tr>'
      return
    }

    // Get all approved medicine requests
    const requestsSnapshot = await db.collection("medicineRequests").where("status", "==", "approved").get()

    // Calculate distribution by medicine
    const distributionByMedicine = {}

    requestsSnapshot.forEach((doc) => {
      const request = doc.data()
      if (!distributionByMedicine[request.medicineId]) {
        distributionByMedicine[request.medicineId] = {
          name: request.medicineName,
          total: 0,
        }
      }
      distributionByMedicine[request.medicineId].total += request.quantity
    })

    let tableHTML = ""

    medicinesSnapshot.forEach((doc) => {
      const medicine = doc.data()
      const distribution = distributionByMedicine[doc.id] || { name: medicine.name, total: 0 }

      let stockStatus = ""
      let statusClass = ""

      if (medicine.quantity <= medicine.criticalLevel) {
        stockStatus = "Critical"
        statusClass = "status-critical"
      } else if (medicine.quantity <= medicine.warningLevel) {
        stockStatus = "Low"
        statusClass = "status-pending"
      } else {
        stockStatus = "Adequate"
        statusClass = "status-approved"
      }

      tableHTML += `
                <tr>
                    <td>${medicine.name}</td>
                    <td>${distribution.total} ${medicine.unit}</td>
                    <td>${medicine.quantity} ${medicine.unit}</td>
                    <td class="${statusClass}">${stockStatus}</td>
                </tr>
            `
    })

    tableBody.innerHTML = tableHTML
  } catch (error) {
    tableBody.innerHTML = `<tr><td colspan="4" class="text-danger">Error loading distribution data: ${error.message}</td></tr>`
  }
}

// Load recent distribution table
async function loadRecentDistributionTable() {
  const tableBody = document.getElementById("recent-distribution-table")

  try {
    const distributionSnapshot = await db
      .collection("medicineRequests")
      .where("status", "==", "approved")
      .orderBy("approvedAt", "desc")
      .limit(10)
      .get()

    if (distributionSnapshot.empty) {
      tableBody.innerHTML = '<tr><td colspan="5" class="text-center">No distribution activity found.</td></tr>'
      return
    }

    // Get all user IDs
    const userIds = new Set()
    distributionSnapshot.forEach((doc) => {
      const distribution = doc.data()
      userIds.add(distribution.farmerId)
      if (distribution.approvedBy) userIds.add(distribution.approvedBy)
    })

    // Get user names
    const userNames = {}
    for (const userId of userIds) {
      const userDoc = await db.collection("users").doc(userId).get()
      if (userDoc.exists) {
        userNames[userId] = userDoc.data().name
      } else {
        userNames[userId] = "Unknown User"
      }
    }

    let tableHTML = ""

    distributionSnapshot.forEach((doc) => {
      const distribution = doc.data()
      const date = distribution.approvedAt ? new Date(distribution.approvedAt.toDate()).toLocaleDateString() : "Unknown"
      const farmerName = userNames[distribution.farmerId]
      const vetName = distribution.approvedBy ? userNames[distribution.approvedBy] : "Unknown"

      tableHTML += `
                <tr>
                    <td>${date}</td>
                    <td>${farmerName}</td>
                    <td>${distribution.medicineName}</td>
                    <td>${distribution.quantity} units</td>
                    <td>${vetName}</td>
                </tr>
            `
    })

    tableBody.innerHTML = tableHTML
  } catch (error) {
    tableBody.innerHTML = `<tr><td colspan="5" class="text-danger">Error loading distribution data: ${error.message}</td></tr>`
  }
}

// Load user management
async function loadUserManagement() {
  contentArea.innerHTML = `
        <div class="d-flex justify-content-between mb-4">
            <h3>User Management</h3>
        </div>
        <div class="card">
            <div class="card-body">
                <ul class="nav nav-tabs" id="userManagementTabs" role="tablist">
                    <li class="nav-item" role="presentation">
                        <button class="nav-link active" id="farmers-tab" data-bs-toggle="tab" data-bs-target="#farmers" type="button" role="tab" aria-controls="farmers" aria-selected="true">Farmers</button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link" id="vets-tab" data-bs-toggle="tab" data-bs-target="#vets" type="button" role="tab" aria-controls="vets" aria-selected="false">Veterinary Officers</button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link" id="officials-tab" data-bs-toggle="tab" data-bs-target="#officials" type="button" role="tab" aria-controls="officials" aria-selected="false">Government Officials</button>
                    </li>
                </ul>
                <div class="tab-content mt-3" id="userManagementTabContent">
                    <div class="tab-pane fade show active" id="farmers" role="tabpanel" aria-labelledby="farmers-tab">
                        <div class="table-responsive">
                            <table class="table table-hover">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Registered On</th>
                                        <th>Livestock Count</th>
                                        <th>Medicine Requests</th>
                                    </tr>
                                </thead>
                                <tbody id="farmers-table">
                                    <tr>
                                        <td colspan="5" class="text-center">Loading...</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="tab-pane fade" id="vets" role="tabpanel" aria-labelledby="vets-tab">
                        <div class="table-responsive">
                            <table class="table table-hover">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Registered On</th>
                                        <th>Reports Reviewed</th>
                                        <th>Approvals</th>
                                    </tr>
                                </thead>
                                <tbody id="vets-table">
                                    <tr>
                                        <td colspan="5" class="text-center">Loading...</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="tab-pane fade" id="officials" role="tabpanel" aria-labelledby="officials-tab">
                        <div class="table-responsive">
                            <table class="table table-hover">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Registered On</th>
                                        <th>Last Active</th>
                                    </tr>
                                </thead>
                                <tbody id="officials-table">
                                    <tr>
                                        <td colspan="4" class="text-center">Loading...</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `

  // Load farmers table
  await loadFarmersTable()

  // Load vets table
  await loadVetsTable()

  // Load officials table
  await loadOfficialsTable()
}

// Load farmers table
async function loadFarmersTable() {
  const tableBody = document.getElementById("farmers-table")

  try {
    const farmersSnapshot = await db.collection("users").where("role", "==", "farmer").orderBy("name").get()

    if (farmersSnapshot.empty) {
      tableBody.innerHTML = '<tr><td colspan="5" class="text-center">No farmers found.</td></tr>'
      return
    }

    let tableHTML = ""

    for (const doc of farmersSnapshot.docs) {
      const farmer = doc.data()
      const registeredDate = farmer.createdAt ? new Date(farmer.createdAt.toDate()).toLocaleDateString() : "Unknown"

      // Get livestock count
      const livestockSnapshot = await db.collection("livestock").where("farmerId", "==", doc.id).get()

      // Get medicine requests count
      const requestsSnapshot = await db.collection("medicineRequests").where("farmerId", "==", doc.id).get()

      tableHTML += `
                <tr>
                    <td>${farmer.name}</td>
                    <td>${farmer.email}</td>
                    <td>${registeredDate}</td>
                    <td>${livestockSnapshot.size}</td>
                    <td>${requestsSnapshot.size}</td>
                </tr>
            `
    }

    tableBody.innerHTML = tableHTML
  } catch (error) {
    tableBody.innerHTML = `<tr><td colspan="5" class="text-danger">Error loading farmers: ${error.message}</td></tr>`
  }
}

// Load vets table
async function loadVetsTable() {
  const tableBody = document.getElementById("vets-table")

  try {
    const vetsSnapshot = await db.collection("users").where("role", "==", "vet").orderBy("name").get()

    if (vetsSnapshot.empty) {
      tableBody.innerHTML = '<tr><td colspan="5" class="text-center">No veterinary officers found.</td></tr>'
      return
    }

    let tableHTML = ""

    for (const doc of vetsSnapshot.docs) {
      const vet = doc.data()
      const registeredDate = vet.createdAt ? new Date(vet.createdAt.toDate()).toLocaleDateString() : "Unknown"

      // Get reports reviewed count
      const reportsSnapshot = await db.collection("healthReports").where("reviewedBy", "==", doc.id).get()

      // Get approvals count
      const approvalsSnapshot = await db.collection("medicineRequests").where("approvedBy", "==", doc.id).get()

      tableHTML += `
                <tr>
                    <td>${vet.name}</td>
                    <td>${vet.email}</td>
                    <td>${registeredDate}</td>
                    <td>${reportsSnapshot.size}</td>
                    <td>${approvalsSnapshot.size}</td>
                </tr>
            `
    }

    tableBody.innerHTML = tableHTML
  } catch (error) {
    tableBody.innerHTML = `<tr><td colspan="5" class="text-danger">Error loading veterinary officers: ${error.message}</td></tr>`
  }
}

// Load officials table
async function loadOfficialsTable() {
  const tableBody = document.getElementById("officials-table")

  try {
    const officialsSnapshot = await db.collection("users").where("role", "==", "government").orderBy("name").get()

    if (officialsSnapshot.empty) {
      tableBody.innerHTML = '<tr><td colspan="4" class="text-center">No government officials found.</td></tr>'
      return
    }

    let tableHTML = ""

    officialsSnapshot.forEach((doc) => {
      const official = doc.data()
      const registeredDate = official.createdAt ? new Date(official.createdAt.toDate()).toLocaleDateString() : "Unknown"
      const lastActive = official.lastActive ? new Date(official.lastActive.toDate()).toLocaleDateString() : "Unknown"

      tableHTML += `
                <tr>
                    <td>${official.name}</td>
                    <td>${official.email}</td>
                    <td>${registeredDate}</td>
                    <td>${lastActive}</td>
                </tr>
            `
    })

    tableBody.innerHTML = tableHTML
  } catch (error) {
    tableBody.innerHTML = `<tr><td colspan="4" class="text-danger">Error loading government officials: ${error.message}</td></tr>`
  }
}

