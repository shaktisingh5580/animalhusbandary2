// Import necessary Firebase modules
import { getAuth } from "https://www.gstatic.com/firebasejs/9.6.11/firebase-auth.js"
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.6.11/firebase-firestore.js"
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.11/firebase-app.js"
import { firebaseConfig } from "./config.js"

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

// DOM Elements
const contentArea = document.getElementById("content-area")
const pageTitle = document.getElementById("page-title")
const modalContent = document.getElementById("modal-content")
const itemModal = new bootstrap.Modal(document.getElementById("itemModal"))

// Load dashboard content based on user role
function loadDashboard(role) {
  pageTitle.textContent = "Dashboard"

  let dashboardContent = ""

  if (role === "farmer") {
    dashboardContent = `
            <div class="row">
                <div class="col-md-4 mb-4">
                    <div class="card dashboard-card h-100">
                        <div class="card-body text-center">
                            <i class="bi bi-capsule fs-1 text-primary mb-3"></i>
                            <h5 class="card-title">Medicine Requests</h5>
                            <p class="card-text">Request medicines for your livestock</p>
                            <button class="btn btn-primary" id="goto-medicine-requests">Manage Requests</button>
                        </div>
                    </div>
                </div>
                <div class="col-md-4 mb-4">
                    <div class="card dashboard-card h-100">
                        <div class="card-body text-center">
                            <i class="bi bi-heart-pulse fs-1 text-danger mb-3"></i>
                            <h5 class="card-title">Livestock Health</h5>
                            <p class="card-text">Monitor and report livestock health issues</p>
                            <button class="btn btn-primary" id="goto-livestock-health">Track Health</button>
                        </div>
                    </div>
                </div>
                <div class="col-md-4 mb-4">
                    <div class="card dashboard-card h-100">
                        <div class="card-body text-center">
                            <i class="bi bi-geo-alt fs-1 text-success mb-3"></i>
                            <h5 class="card-title">Find Veterinarians</h5>
                            <p class="card-text">Locate nearby veterinary services</p>
                            <button class="btn btn-primary" id="goto-find-vets">Find Vets</button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="row mt-4">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">Recent Medicine Requests</h5>
                        </div>
                        <div class="card-body">
                            <div id="recent-medicine-requests">Loading...</div>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">Livestock Health Status</h5>
                        </div>
                        <div class="card-body">
                            <div id="livestock-health-status">Loading...</div>
                        </div>
                    </div>
                </div>
            </div>
        `
  } else if (role === "vet") {
    dashboardContent = `
            <div class="row">
                <div class="col-md-4 mb-4">
                    <div class="card dashboard-card h-100">
                        <div class="card-body text-center">
                            <i class="bi bi-check-circle fs-1 text-primary mb-3"></i>
                            <h5 class="card-title">Medicine Approvals</h5>
                            <p class="card-text">Review and approve medicine requests</p>
                            <button class="btn btn-primary" id="goto-medicine-approvals">Review Requests</button>
                        </div>
                    </div>
                </div>
                <div class="col-md-4 mb-4">
                    <div class="card dashboard-card h-100">
                        <div class="card-body text-center">
                            <i class="bi bi-clipboard-pulse fs-1 text-danger mb-3"></i>
                            <h5 class="card-title">Health Reports</h5>
                            <p class="card-text">Review and update livestock health reports</p>
                            <button class="btn btn-primary" id="goto-health-reports">View Reports</button>
                        </div>
                    </div>
                </div>
                <div class="col-md-4 mb-4">
                    <div class="card dashboard-card h-100">
                        <div class="card-body text-center">
                            <i class="bi bi-geo-alt fs-1 text-success mb-3"></i>
                            <h5 class="card-title">Update Location</h5>
                            <p class="card-text">Update your service location for farmers</p>
                            <button class="btn btn-primary" id="goto-update-location">Update Location</button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="row mt-4">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">Pending Medicine Requests</h5>
                        </div>
                        <div class="card-body">
                            <div id="pending-medicine-requests">Loading...</div>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">Recent Health Reports</h5>
                        </div>
                        <div class="card-body">
                            <div id="recent-health-reports">Loading...</div>
                        </div>
                    </div>
                </div>
            </div>
        `
  } else if (role === "government") {
    dashboardContent = `
            <div class="row">
                <div class="col-md-4 mb-4">
                    <div class="card dashboard-card h-100">
                        <div class="card-body text-center">
                            <i class="bi bi-box-seam fs-1 text-primary mb-3"></i>
                            <h5 class="card-title">Medicine Inventory</h5>
                            <p class="card-text">Manage government medicine inventory</p>
                            <button class="btn btn-primary" id="goto-medicine-inventory">Manage Inventory</button>
                        </div>
                    </div>
                </div>
                <div class="col-md-4 mb-4">
                    <div class="card dashboard-card h-100">
                        <div class="card-body text-center">
                            <i class="bi bi-graph-up fs-1 text-success mb-3"></i>
                            <h5 class="card-title">Distribution Reports</h5>
                            <p class="card-text">View medicine distribution analytics</p>
                            <button class="btn btn-primary" id="goto-distribution-reports">View Reports</button>
                        </div>
                    </div>
                </div>
                <div class="col-md-4 mb-4">
                    <div class="card dashboard-card h-100">
                        <div class="card-body text-center">
                            <i class="bi bi-people fs-1 text-danger mb-3"></i>
                            <h5 class="card-title">User Management</h5>
                            <p class="card-text">Manage farmers and veterinary officers</p>
                            <button class="btn btn-primary" id="goto-user-management">Manage Users</button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="row mt-4">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">Medicine Stock Status</h5>
                        </div>
                        <div class="card-body">
                            <div id="medicine-stock-status">Loading...</div>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">Recent Distribution Activity</h5>
                        </div>
                        <div class="card-body">
                            <div id="recent-distribution-activity">Loading...</div>
                        </div>
                    </div>
                </div>
            </div>
        `
  }

  contentArea.innerHTML = dashboardContent

  // Add event listeners for dashboard buttons
  if (role === "farmer") {
    document.getElementById("goto-medicine-requests").addEventListener("click", () => {
      document.getElementById("medicine-requests-link").click()
    })
    document.getElementById("goto-livestock-health").addEventListener("click", () => {
      document.getElementById("livestock-health-link").click()
    })
    document.getElementById("goto-find-vets").addEventListener("click", () => {
      document.getElementById("find-vets-link").click()
    })

    // Load recent medicine requests
    loadRecentMedicineRequests()

    // Load livestock health status
    loadLivestockHealthStatus()
  } else if (role === "vet") {
    document.getElementById("goto-medicine-approvals").addEventListener("click", () => {
      document.getElementById("medicine-approvals-link").click()
    })
    document.getElementById("goto-health-reports").addEventListener("click", () => {
      document.getElementById("health-reports-link").click()
    })
    document.getElementById("goto-update-location").addEventListener("click", () => {
      document.getElementById("update-location-link").click()
    })

    // Load pending medicine requests
    loadPendingMedicineRequests()

    // Load recent health reports
    loadRecentHealthReports()
  } else if (role === "government") {
    document.getElementById("goto-medicine-inventory").addEventListener("click", () => {
      document.getElementById("medicine-inventory-link").click()
    })
    document.getElementById("goto-distribution-reports").addEventListener("click", () => {
      document.getElementById("distribution-reports-link").click()
    })
    document.getElementById("goto-user-management").addEventListener("click", () => {
      document.getElementById("user-management-link").click()
    })

    // Load medicine stock status
    loadMedicineStockStatus()

    // Load recent distribution activity
    loadRecentDistributionActivity()
  }
}

// Load recent medicine requests for farmer dashboard
async function loadRecentMedicineRequests() {
  const recentRequestsElement = document.getElementById("recent-medicine-requests")

  try {
    const user = auth.currentUser
    const requestsSnapshot = await db
      .collection("medicineRequests")
      .where("farmerId", "==", user.uid)
      .orderBy("createdAt", "desc")
      .limit(5)
      .get()

    if (requestsSnapshot.empty) {
      recentRequestsElement.innerHTML = '<p class="text-muted">No recent medicine requests.</p>'
      return
    }

    let requestsHTML = '<div class="list-group">'

    requestsSnapshot.forEach((doc) => {
      const request = doc.data()
      const date = request.createdAt ? new Date(request.createdAt.toDate()).toLocaleDateString() : "Unknown date"

      let statusClass = ""
      if (request.status === "pending") statusClass = "status-pending"
      else if (request.status === "approved") statusClass = "status-approved"
      else if (request.status === "rejected") statusClass = "status-rejected"

      requestsHTML += `
                <div class="list-group-item">
                    <div class="d-flex w-100 justify-content-between">
                        <h6 class="mb-1">${request.medicineName}</h6>
                        <small class="${statusClass}">${request.status.toUpperCase()}</small>
                    </div>
                    <p class="mb-1">Quantity: ${request.quantity} units</p>
                    <small>Requested on: ${date}</small>
                </div>
            `
    })

    requestsHTML += "</div>"
    recentRequestsElement.innerHTML = requestsHTML
  } catch (error) {
    recentRequestsElement.innerHTML = `<p class="text-danger">Error loading requests: ${error.message}</p>`
  }
}

// Load livestock health status for farmer dashboard
async function loadLivestockHealthStatus() {
  const healthStatusElement = document.getElementById("livestock-health-status")

  try {
    const user = auth.currentUser
    const livestockSnapshot = await db
      .collection("livestock")
      .where("farmerId", "==", user.uid)
      .orderBy("lastCheckup", "desc")
      .limit(5)
      .get()

    if (livestockSnapshot.empty) {
      healthStatusElement.innerHTML = '<p class="text-muted">No livestock records found.</p>'
      return
    }

    let livestockHTML = '<div class="list-group">'

    livestockSnapshot.forEach((doc) => {
      const livestock = doc.data()
      const checkupDate = livestock.lastCheckup
        ? new Date(livestock.lastCheckup.toDate()).toLocaleDateString()
        : "No checkup"

      let healthClass = ""
      if (livestock.healthStatus === "healthy") healthClass = "status-approved"
      else if (livestock.healthStatus === "sick") healthClass = "status-pending"
      else if (livestock.healthStatus === "critical") healthClass = "status-critical"

      livestockHTML += `
                <div class="list-group-item">
                    <div class="d-flex w-100 justify-content-between">
                        <h6 class="mb-1">${livestock.type} #${livestock.tagId}</h6>
                        <small class="${healthClass}">${livestock.healthStatus.toUpperCase()}</small>
                    </div>
                    <p class="mb-1">${livestock.breed}</p>
                    <small>Last checkup: ${checkupDate}</small>
                </div>
            `
    })

    livestockHTML += "</div>"
    healthStatusElement.innerHTML = livestockHTML
  } catch (error) {
    healthStatusElement.innerHTML = `<p class="text-danger">Error loading livestock data: ${error.message}</p>`
  }
}

// Load pending medicine requests for vet dashboard
async function loadPendingMedicineRequests() {
  const pendingRequestsElement = document.getElementById("pending-medicine-requests")

  try {
    const requestsSnapshot = await db
      .collection("medicineRequests")
      .where("status", "==", "pending")
      .orderBy("createdAt", "desc")
      .limit(5)
      .get()

    if (requestsSnapshot.empty) {
      pendingRequestsElement.innerHTML = '<p class="text-muted">No pending medicine requests.</p>'
      return
    }

    let requestsHTML = '<div class="list-group">'

    // Get all farmer IDs from the requests
    const farmerIds = new Set()
    requestsSnapshot.forEach((doc) => {
      const request = doc.data()
      farmerIds.add(request.farmerId)
    })

    // Get farmer names
    const farmerNames = {}
    for (const farmerId of farmerIds) {
      const farmerDoc = await db.collection("users").doc(farmerId).get()
      if (farmerDoc.exists) {
        farmerNames[farmerId] = farmerDoc.data().name
      } else {
        farmerNames[farmerId] = "Unknown Farmer"
      }
    }

    requestsSnapshot.forEach((doc) => {
      const request = doc.data()
      const date = request.createdAt ? new Date(request.createdAt.toDate()).toLocaleDateString() : "Unknown date"
      const farmerName = farmerNames[request.farmerId]

      requestsHTML += `
                <div class="list-group-item">
                    <div class="d-flex w-100 justify-content-between">
                        <h6 class="mb-1">${request.medicineName}</h6>
                        <small class="status-pending">PENDING</small>
                    </div>
                    <p class="mb-1">Quantity: ${request.quantity} units</p>
                    <p class="mb-1">Farmer: ${farmerName}</p>
                    <small>Requested on: ${date}</small>
                </div>
            `
    })

    requestsHTML += "</div>"
    pendingRequestsElement.innerHTML = requestsHTML
  } catch (error) {
    pendingRequestsElement.innerHTML = `<p class="text-danger">Error loading requests: ${error.message}</p>`
  }
}

// Load recent health reports for vet dashboard
async function loadRecentHealthReports() {
  const recentReportsElement = document.getElementById("recent-health-reports")

  try {
    const reportsSnapshot = await db.collection("healthReports").orderBy("reportDate", "desc").limit(5).get()

    if (reportsSnapshot.empty) {
      recentReportsElement.innerHTML = '<p class="text-muted">No recent health reports.</p>'
      return
    }

    let reportsHTML = '<div class="list-group">'

    // Get all farmer IDs from the reports
    const farmerIds = new Set()
    reportsSnapshot.forEach((doc) => {
      const report = doc.data()
      farmerIds.add(report.farmerId)
    })

    // Get farmer names
    const farmerNames = {}
    for (const farmerId of farmerIds) {
      const farmerDoc = await db.collection("users").doc(farmerId).get()
      if (farmerDoc.exists) {
        farmerNames[farmerId] = farmerDoc.data().name
      } else {
        farmerNames[farmerId] = "Unknown Farmer"
      }
    }

    reportsSnapshot.forEach((doc) => {
      const report = doc.data()
      const date = report.reportDate ? new Date(report.reportDate.toDate()).toLocaleDateString() : "Unknown date"
      const farmerName = farmerNames[report.farmerId]

      let severityClass = ""
      if (report.severity === "low") severityClass = "status-approved"
      else if (report.severity === "medium") severityClass = "status-pending"
      else if (report.severity === "high") severityClass = "status-critical"

      reportsHTML += `
                <div class="list-group-item">
                    <div class="d-flex w-100 justify-content-between">
                        <h6 class="mb-1">${report.livestockType} #${report.tagId}</h6>
                        <small class="${severityClass}">${report.severity.toUpperCase()}</small>
                    </div>
                    <p class="mb-1">${report.symptoms}</p>
                    <p class="mb-1">Farmer: ${farmerName}</p>
                    <small>Reported on: ${date}</small>
                </div>
            `
    })

    reportsHTML += "</div>"
    recentReportsElement.innerHTML = reportsHTML
  } catch (error) {
    recentReportsElement.innerHTML = `<p class="text-danger">Error loading reports: ${error.message}</p>`
  }
}

// Load medicine stock status for government dashboard
async function loadMedicineStockStatus() {
  const stockStatusElement = document.getElementById("medicine-stock-status")

  try {
    const medicinesSnapshot = await db.collection("medicines").orderBy("name").get()

    if (medicinesSnapshot.empty) {
      stockStatusElement.innerHTML = '<p class="text-muted">No medicines in inventory.</p>'
      return
    }

    let stockHTML =
      '<div class="table-responsive"><table class="table table-hover"><thead><tr><th>Medicine</th><th>Stock</th><th>Status</th></tr></thead><tbody>'

    medicinesSnapshot.forEach((doc) => {
      const medicine = doc.data()

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

      stockHTML += `
                <tr>
                    <td>${medicine.name}</td>
                    <td>${medicine.quantity} ${medicine.unit}</td>
                    <td class="${statusClass}">${stockStatus}</td>
                </tr>
            `
    })

    stockHTML += "</tbody></table></div>"
    stockStatusElement.innerHTML = stockHTML
  } catch (error) {
    stockStatusElement.innerHTML = `<p class="text-danger">Error loading inventory: ${error.message}</p>`
  }
}

// Load recent distribution activity for government dashboard
async function loadRecentDistributionActivity() {
  const distributionElement = document.getElementById("recent-distribution-activity")

  try {
    const distributionSnapshot = await db
      .collection("medicineRequests")
      .where("status", "==", "approved")
      .orderBy("approvedAt", "desc")
      .limit(5)
      .get()

    if (distributionSnapshot.empty) {
      distributionElement.innerHTML = '<p class="text-muted">No recent distribution activity.</p>'
      return
    }

    let distributionHTML = '<div class="list-group">'

    // Get all farmer and vet IDs
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

    distributionSnapshot.forEach((doc) => {
      const distribution = doc.data()
      const date = distribution.approvedAt
        ? new Date(distribution.approvedAt.toDate()).toLocaleDateString()
        : "Unknown date"
      const farmerName = userNames[distribution.farmerId]
      const vetName = distribution.approvedBy ? userNames[distribution.approvedBy] : "Unknown Vet"

      distributionHTML += `
                <div class="list-group-item">
                    <div class="d-flex w-100 justify-content-between">
                        <h6 class="mb-1">${distribution.medicineName}</h6>
                        <small>${date}</small>
                    </div>
                    <p class="mb-1">Quantity: ${distribution.quantity} units</p>
                    <p class="mb-1">Farmer: ${farmerName}</p>
                    <small>Approved by: ${vetName}</small>
                </div>
            `
    })

    distributionHTML += "</div>"
    distributionElement.innerHTML = distributionHTML
  } catch (error) {
    distributionElement.innerHTML = `<p class="text-danger">Error loading distribution data: ${error.message}</p>`
  }
}

