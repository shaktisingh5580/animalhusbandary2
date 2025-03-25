// Declare variables
const contentArea = document.getElementById("content") // Assuming 'content' is the ID of your content area
const auth = firebase.auth()
const db = firebase.firestore()
const modalContent = document.getElementById("itemModalBody") // Assuming 'itemModalBody' is the ID of your modal body
const itemModal = new bootstrap.Modal(document.getElementById("itemModal")) // Assuming 'itemModal' is the ID of your modal

// Load livestock module based on menu item and user role
function loadLivestockModule(menuItem, role) {
  if (menuItem === "livestock-health" && role === "farmer") {
    loadFarmerLivestockHealth()
  } else if (menuItem === "health-reports" && role === "vet") {
    loadVetHealthReports()
  }
}

// Load farmer livestock health
async function loadFarmerLivestockHealth() {
  contentArea.innerHTML = `
        <div class="d-flex justify-content-between mb-4">
            <h3>My Livestock</h3>
            <div>
                <button class="btn btn-success me-2" id="add-health-report-btn">
                    <i class="bi bi-clipboard-plus me-2"></i>New Health Report
                </button>
                <button class="btn btn-primary" id="add-livestock-btn">
                    <i class="bi bi-plus-circle me-2"></i>Add Livestock
                </button>
            </div>
        </div>
        <div class="card mb-4">
            <div class="card-header">
                <h5 class="mb-0">Livestock Inventory</h5>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>Tag ID</th>
                                <th>Type</th>
                                <th>Breed</th>
                                <th>Age</th>
                                <th>Health Status</th>
                                <th>Last Checkup</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="livestock-table">
                            <tr>
                                <td colspan="7" class="text-center">Loading...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        <div class="card">
            <div class="card-header">
                <h5 class="mb-0">Recent Health Reports</h5>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>Livestock</th>
                                <th>Report Date</th>
                                <th>Symptoms</th>
                                <th>Severity</th>
                                <th>Status</th>
                                <th>Vet Response</th>
                            </tr>
                        </thead>
                        <tbody id="health-reports-table">
                            <tr>
                                <td colspan="6" class="text-center">Loading...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `

  // Add event listeners for buttons
  document.getElementById("add-livestock-btn").addEventListener("click", showAddLivestockModal)
  document.getElementById("add-health-report-btn").addEventListener("click", showAddHealthReportModal)

  // Load livestock table
  await loadLivestockTable()

  // Load health reports table
  await loadFarmerHealthReportsTable()
}

// Load livestock table
async function loadLivestockTable() {
  const tableBody = document.getElementById("livestock-table")

  try {
    const user = auth.currentUser
    const livestockSnapshot = await db.collection("livestock").where("farmerId", "==", user.uid).orderBy("tagId").get()

    if (livestockSnapshot.empty) {
      tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No livestock records found.</td></tr>'
      return
    }

    let tableHTML = ""

    livestockSnapshot.forEach((doc) => {
      const livestock = doc.data()
      const checkupDate = livestock.lastCheckup
        ? new Date(livestock.lastCheckup.toDate()).toLocaleDateString()
        : "No checkup"

      let healthClass = ""
      if (livestock.healthStatus === "healthy") healthClass = "status-approved"
      else if (livestock.healthStatus === "sick") healthClass = "status-pending"
      else if (livestock.healthStatus === "critical") healthClass = "status-critical"

      tableHTML += `
                <tr>
                    <td>${livestock.tagId}</td>
                    <td>${livestock.type}</td>
                    <td>${livestock.breed}</td>
                    <td>${livestock.age} ${livestock.ageUnit}</td>
                    <td class="${healthClass}">${livestock.healthStatus.toUpperCase()}</td>
                    <td>${checkupDate}</td>
                    <td>
                        <button class="btn btn-sm btn-primary edit-livestock me-1" data-id="${doc.id}">Edit</button>
                        <button class="btn btn-sm btn-danger delete-livestock" data-id="${doc.id}">Delete</button>
                    </td>
                </tr>
            `
    })

    tableBody.innerHTML = tableHTML

    // Add event listeners for edit buttons
    document.querySelectorAll(".edit-livestock").forEach((button) => {
      button.addEventListener("click", async (e) => {
        const livestockId = e.target.getAttribute("data-id")
        await showEditLivestockModal(livestockId)
      })
    })

    // Add event listeners for delete buttons
    document.querySelectorAll(".delete-livestock").forEach((button) => {
      button.addEventListener("click", async (e) => {
        const livestockId = e.target.getAttribute("data-id")
        if (confirm("Are you sure you want to delete this livestock record? This action cannot be undone.")) {
          try {
            await db.collection("livestock").doc(livestockId).delete()
            alert("Livestock record deleted successfully.")
            await loadLivestockTable()
          } catch (error) {
            alert("Error deleting livestock record: " + error.message)
          }
        }
      })
    })
  } catch (error) {
    tableBody.innerHTML = `<tr><td colspan="7" class="text-danger">Error loading livestock data: ${error.message}</td></tr>`
  }
}

// Load farmer health reports table
async function loadFarmerHealthReportsTable() {
  const tableBody = document.getElementById("health-reports-table")

  try {
    const user = auth.currentUser
    const reportsSnapshot = await db
      .collection("healthReports")
      .where("farmerId", "==", user.uid)
      .orderBy("reportDate", "desc")
      .limit(10)
      .get()

    if (reportsSnapshot.empty) {
      tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No health reports found.</td></tr>'
      return
    }

    let tableHTML = ""

    reportsSnapshot.forEach((doc) => {
      const report = doc.data()
      const reportDate = report.reportDate ? new Date(report.reportDate.toDate()).toLocaleDateString() : "Unknown"

      let severityClass = ""
      if (report.severity === "low") severityClass = "status-approved"
      else if (report.severity === "medium") severityClass = "status-pending"
      else if (report.severity === "high") severityClass = "status-critical"

      let statusClass = ""
      if (report.status === "pending") statusClass = "status-pending"
      else if (report.status === "reviewed") statusClass = "status-approved"

      tableHTML += `
                <tr>
                    <td>${report.livestockType} #${report.tagId}</td>
                    <td>${reportDate}</td>
                    <td>${report.symptoms}</td>
                    <td class="${severityClass}">${report.severity.toUpperCase()}</td>
                    <td class="${statusClass}">${report.status.toUpperCase()}</td>
                    <td>${report.vetResponse || "No response yet"}</td>
                </tr>
            `
    })

    tableBody.innerHTML = tableHTML
  } catch (error) {
    tableBody.innerHTML = `<tr><td colspan="6" class="text-danger">Error loading health reports: ${error.message}</td></tr>`
  }
}

// Show add livestock modal
function showAddLivestockModal() {
  // Set modal title and content
  document.getElementById("itemModalLabel").textContent = "Add Livestock"

  modalContent.innerHTML = `
        <form id="add-livestock-form">
            <div class="mb-3">
                <label for="tagId" class="form-label">Tag ID</label>
                <input type="text" class="form-control" id="tagId" required>
            </div>
            <div class="mb-3">
                <label for="type" class="form-label">Type</label>
                <select class="form-select" id="type" required>
                    <option value="">Select type</option>
                    <option value="Cattle">Cattle</option>
                    <option value="Sheep">Sheep</option>
                    <option value="Goat">Goat</option>
                    <option value="Pig">Pig</option>
                    <option value="Poultry">Poultry</option>
                    <option value="Other">Other</option>
                </select>
            </div>
            <div class="mb-3">
                <label for="breed" class="form-label">Breed</label>
                <input type="text" class="form-control" id="breed" required>
            </div>
            <div class="row mb-3">
                <div class="col-md-6">
                    <label for="age" class="form-label">Age</label>
                    <input type="number" class="form-control" id="age" min="0" required>
                </div>
                <div class="col-md-6">
                    <label for="ageUnit" class="form-label">Age Unit</label>
                    <select class="form-select" id="ageUnit" required>
                        <option value="days">Days</option>
                        <option value="months">Months</option>
                        <option value="years" selected>Years</option>
                    </select>
                </div>
            </div>
            <div class="mb-3">
                <label for="gender" class="form-label">Gender</label>
                <select class="form-select" id="gender" required>
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                </select>
            </div>
            <div class="mb-3">
                <label for="healthStatus" class="form-label">Health Status</label>
                <select class="form-select" id="healthStatus" required>
                    <option value="healthy">Healthy</option>
                    <option value="sick">Sick</option>
                    <option value="critical">Critical</option>
                </select>
            </div>
            <div class="mb-3">
                <label for="notes" class="form-label">Notes</label>
                <textarea class="form-control" id="notes" rows="3"></textarea>
            </div>
            <div class="d-flex justify-content-end">
                <button type="button" class="btn btn-secondary me-2" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" class="btn btn-primary">Add Livestock</button>
            </div>
        </form>
    `

  // Show modal
  itemModal.show()

  // Add event listener for form submission
  document.getElementById("add-livestock-form").addEventListener("submit", async (e) => {
    e.preventDefault()

    const tagId = document.getElementById("tagId").value
    const type = document.getElementById("type").value
    const breed = document.getElementById("breed").value
    const age = Number.parseInt(document.getElementById("age").value)
    const ageUnit = document.getElementById("ageUnit").value
    const gender = document.getElementById("gender").value
    const healthStatus = document.getElementById("healthStatus").value
    const notes = document.getElementById("notes").value

    try {
      const user = auth.currentUser

      // Check if tag ID already exists
      const existingLivestock = await db
        .collection("livestock")
        .where("farmerId", "==", user.uid)
        .where("tagId", "==", tagId)
        .get()

      if (!existingLivestock.empty) {
        alert("A livestock with this Tag ID already exists. Please use a different Tag ID.")
        return
      }

      // Add livestock to Firestore
      await db.collection("livestock").add({
        tagId: tagId,
        type: type,
        breed: breed,
        age: age,
        ageUnit: ageUnit,
        gender: gender,
        healthStatus: healthStatus,
        notes: notes,
        farmerId: user.uid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastCheckup: null,
      })

      // Close modal
      itemModal.hide()

      // Show success message
      alert("Livestock added successfully.")

      // Reload table
      await loadLivestockTable()
    } catch (error) {
      alert("Error adding livestock: " + error.message)
    }
  })
}

// Show edit livestock modal
async function showEditLivestockModal(livestockId) {
  try {
    // Get livestock details
    const livestockDoc = await db.collection("livestock").doc(livestockId).get()
    const livestock = livestockDoc.data()

    // Set modal title and content
    document.getElementById("itemModalLabel").textContent = "Edit Livestock"

    modalContent.innerHTML = `
            <form id="edit-livestock-form">
                <div class="mb-3">
                    <label for="tagId" class="form-label">Tag ID</label>
                    <input type="text" class="form-control" id="tagId" value="${livestock.tagId}" required>
                </div>
                <div class="mb-3">
                    <label for="type" class="form-label">Type</label>
                    <select class="form-select" id="type" required>
                        <option value="">Select type</option>
                        <option value="Cattle" ${livestock.type === "Cattle" ? "selected" : ""}>Cattle</option>
                        <option value="Sheep" ${livestock.type === "Sheep" ? "selected" : ""}>Sheep</option>
                        <option value="Goat" ${livestock.type === "Goat" ? "selected" : ""}>Goat</option>
                        <option value="Pig" ${livestock.type === "Pig" ? "selected" : ""}>Pig</option>
                        <option value="Poultry" ${livestock.type === "Poultry" ? "selected" : ""}>Poultry</option>
                        <option value="Other" ${livestock.type === "Other" ? "selected" : ""}>Other</option>
                    </select>
                </div>
                <div class="mb-3">
                    <label for="breed" class="form-label">Breed</label>
                    <input type="text" class="form-control" id="breed" value="${livestock.breed}" required>
                </div>
                <div class="row mb-3">
                    <div class="col-md-6">
                        <label for="age" class="form-label">Age</label>
                        <input type="number" class="form-control" id="age" value="${livestock.age}" min="0" required>
                    </div>
                    <div class="col-md-6">
                        <label for="ageUnit" class="form-label">Age Unit</label>
                        <select class="form-select" id="ageUnit" required>
                            <option value="days" ${livestock.ageUnit === "days" ? "selected" : ""}>Days</option>
                            <option value="months" ${livestock.ageUnit === "months" ? "selected" : ""}>Months</option>
                            <option value="years" ${livestock.ageUnit === "years" ? "selected" : ""}>Years</option>
                        </select>
                    </div>
                </div>
                <div class="mb-3">
                    <label for="gender" class="form-label">Gender</label>
                    <select class="form-select" id="gender" required>
                        <option value="">Select gender</option>
                        <option value="Male" ${livestock.gender === "Male" ? "selected" : ""}>Male</option>
                        <option value="Female" ${livestock.gender === "Female" ? "selected" : ""}>Female</option>
                    </select>
                </div>
                <div class="mb-3">
                    <label for="healthStatus" class="form-label">Health Status</label>
                    <select class="form-select" id="healthStatus" required>
                        <option value="healthy" ${livestock.healthStatus === "healthy" ? "selected" : ""}>Healthy</option>
                        <option value="sick" ${livestock.healthStatus === "sick" ? "selected" : ""}>Sick</option>
                        <option value="critical" ${livestock.healthStatus === "critical" ? "selected" : ""}>Critical</option>
                    </select>
                </div>
                <div class="mb-3">
                    <label for="notes" class="form-label">Notes</label>
                    <textarea class="form-control" id="notes" rows="3">${livestock.notes || ""}</textarea>
                </div>
                <div class="d-flex justify-content-end">
                    <button type="button" class="btn btn-secondary me-2" data-bs-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-primary">Save Changes</button>
                </div>
            </form>
        `

    // Show modal
    itemModal.show()

    // Add event listener for form submission
    document.getElementById("edit-livestock-form").addEventListener("submit", async (e) => {
      e.preventDefault()

      const tagId = document.getElementById("tagId").value
      const type = document.getElementById("type").value
      const breed = document.getElementById("breed").value
      const age = Number.parseInt(document.getElementById("age").value)
      const ageUnit = document.getElementById("ageUnit").value
      const gender = document.getElementById("gender").value
      const healthStatus = document.getElementById("healthStatus").value
      const notes = document.getElementById("notes").value

      try {
        const user = auth.currentUser

        // Check if tag ID already exists (but exclude current livestock)
        const existingLivestock = await db
          .collection("livestock")
          .where("farmerId", "==", user.uid)
          .where("tagId", "==", tagId)
          .get()

        let tagExists = false
        existingLivestock.forEach((doc) => {
          if (doc.id !== livestockId) {
            tagExists = true
          }
        })

        if (tagExists) {
          alert("Another livestock with this Tag ID already exists. Please use a different Tag ID.")
          return
        }

        // Update livestock in Firestore
        await db.collection("livestock").doc(livestockId).update({
          tagId: tagId,
          type: type,
          breed: breed,
          age: age,
          ageUnit: ageUnit,
          gender: gender,
          healthStatus: healthStatus,
          notes: notes,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        })

        // Close modal
        itemModal.hide()

        // Show success message
        alert("Livestock updated successfully.")

        // Reload table
        await loadLivestockTable()
      } catch (error) {
        alert("Error updating livestock: " + error.message)
      }
    })
  } catch (error) {
    alert("Error loading livestock details: " + error.message)
  }
}

// Show add health report modal
async function showAddHealthReportModal() {
  try {
    const user = auth.currentUser

    // Get farmer's livestock
    const livestockSnapshot = await db.collection("livestock").where("farmerId", "==", user.uid).orderBy("tagId").get()

    if (livestockSnapshot.empty) {
      alert("You need to add livestock before creating a health report.")
      return
    }

    let livestockOptions = ""

    livestockSnapshot.forEach((doc) => {
      const livestock = doc.data()
      livestockOptions += `<option value="${doc.id}">${livestock.type} #${livestock.tagId}</option>`
    })

    // Set modal title and content
    document.getElementById("itemModalLabel").textContent = "New Health Report"

    modalContent.innerHTML = `
            <form id="add-health-report-form">
                <div class="mb-3">
                    <label for="livestock" class="form-label">Livestock</label>
                    <select class="form-select" id="livestock" required>
                        <option value="">Select livestock</option>
                        ${livestockOptions}
                    </select>
                </div>
                <div class="mb-3">
                    <label for="symptoms" class="form-label">Symptoms</label>
                    <textarea class="form-control" id="symptoms" rows="3" required></textarea>
                </div>
                <div class="mb-3">
                    <label for="severity" class="form-label">Severity</label>
                    <select class="form-select" id="severity" required>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                    </select>
                </div>
                <div class="mb-3">
                    <label for="details" class="form-label">Additional Details</label>
                    <textarea class="form-control" id="details" rows="3"></textarea>
                </div>
                <div class="d-flex justify-content-end">
                    <button type="button" class="btn btn-secondary me-2" data-bs-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-primary">Submit Report</button>
                </div>
            </form>
        `

    // Show modal
    itemModal.show()

    // Add event listener for form submission
    document.getElementById("add-health-report-form").addEventListener("submit", async (e) => {
      e.preventDefault()

      const livestockId = document.getElementById("livestock").value
      const symptoms = document.getElementById("symptoms").value
      const severity = document.getElementById("severity").value
      const details = document.getElementById("details").value

      try {
        // Get livestock details
        const livestockDoc = await db.collection("livestock").doc(livestockId).get()
        const livestock = livestockDoc.data()

        // Create health report
        const user = auth.currentUser
        await db.collection("healthReports").add({
          livestockId: livestockId,
          livestockType: livestock.type,
          tagId: livestock.tagId,
          symptoms: symptoms,
          severity: severity,
          details: details,
          status: "pending",
          farmerId: user.uid,
          reportDate: firebase.firestore.FieldValue.serverTimestamp(),
          vetResponse: null,
          reviewedBy: null,
          reviewedAt: null,
        })

        // Update livestock health status based on severity
        let healthStatus = "healthy"
        if (severity === "medium") {
          healthStatus = "sick"
        } else if (severity === "high") {
          healthStatus = "critical"
        }

        await db.collection("livestock").doc(livestockId).update({
          healthStatus: healthStatus,
          lastCheckup: firebase.firestore.FieldValue.serverTimestamp(),
        })

        // Close modal
        itemModal.hide()

        // Show success message
        alert("Health report submitted successfully.")

        // Reload tables
        await loadLivestockTable()
        await loadFarmerHealthReportsTable()
      } catch (error) {
        alert("Error submitting health report: " + error.message)
      }
    })
  } catch (error) {
    alert("Error loading livestock data: " + error.message)
  }
}

// Load vet health reports
async function loadVetHealthReports() {
  contentArea.innerHTML = `
        <div class="d-flex justify-content-between mb-4">
            <h3>Livestock Health Reports</h3>
        </div>
        <div class="card">
            <div class="card-body">
                <ul class="nav nav-tabs" id="healthReportsTabs" role="tablist">
                    <li class="nav-item" role="presentation">
                        <button class="nav-link active" id="pending-tab" data-bs-toggle="tab" data-bs-target="#pending" type="button" role="tab" aria-controls="pending" aria-selected="true">Pending Reports</button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link" id="reviewed-tab" data-bs-toggle="tab" data-bs-target="#reviewed" type="button" role="tab" aria-controls="reviewed" aria-selected="false">Reviewed Reports</button>
                    </li>
                </ul>
                <div class="tab-content mt-3" id="healthReportsTabContent">
                    <div class="tab-pane fade show active" id="pending" role="tabpanel" aria-labelledby="pending-tab">
                        <div class="table-responsive">
                            <table class="table table-hover">
                                <thead>
                                    <tr>
                                        <th>Farmer</th>
                                        <th>Livestock</th>
                                        <th>Report Date</th>
                                        <th>Symptoms</th>
                                        <th>Severity</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody id="pending-reports-table">
                                    <tr>
                                        <td colspan="6" class="text-center">Loading...</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="tab-pane fade" id="reviewed" role="tabpanel" aria-labelledby="reviewed-tab">
                        <div class="table-responsive">
                            <table class="table table-hover">
                                <thead>
                                    <tr>
                                        <th>Farmer</th>
                                        <th>Livestock</th>
                                        <th>Report Date</th>
                                        <th>Severity</th>
                                        <th>Review Date</th>
                                        <th>Response</th>
                                    </tr>
                                </thead>
                                <tbody id="reviewed-reports-table">
                                    <tr>
                                        <td colspan="6" class="text-center">Loading...</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `

  // Load pending reports table
  await loadPendingReportsTable()

  // Load reviewed reports table
  await loadReviewedReportsTable()
}

// Load pending reports table
async function loadPendingReportsTable() {
  const tableBody = document.getElementById("pending-reports-table")

  try {
    const reportsSnapshot = await db
      .collection("healthReports")
      .where("status", "==", "pending")
      .orderBy("reportDate", "asc")
      .get()

    if (reportsSnapshot.empty) {
      tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No pending health reports found.</td></tr>'
      return
    }

    // Get all farmer IDs
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

    let tableHTML = ""

    reportsSnapshot.forEach((doc) => {
      const report = doc.data()
      const reportDate = report.reportDate ? new Date(report.reportDate.toDate()).toLocaleDateString() : "Unknown"
      const farmerName = farmerNames[report.farmerId]

      let severityClass = ""
      if (report.severity === "low") severityClass = "status-approved"
      else if (report.severity === "medium") severityClass = "status-pending"
      else if (report.severity === "high") severityClass = "status-critical"

      tableHTML += `
                <tr>
                    <td>${farmerName}</td>
                    <td>${report.livestockType} #${report.tagId}</td>
                    <td>${reportDate}</td>
                    <td>${report.symptoms}</td>
                    <td class="${severityClass}">${report.severity.toUpperCase()}</td>
                    <td>
                        <button class="btn btn-sm btn-primary review-report" data-id="${doc.id}">Review</button>
                    </td>
                </tr>
            `
    })

    tableBody.innerHTML = tableHTML

    // Add event listeners for review buttons
    document.querySelectorAll(".review-report").forEach((button) => {
      button.addEventListener("click", async (e) => {
        const reportId = e.target.getAttribute("data-id")
        await showReviewReportModal(reportId)
      })
    })
  } catch (error) {
    tableBody.innerHTML = `<tr><td colspan="6" class="text-danger">Error loading reports: ${error.message}</td></tr>`
  }
}

// Load reviewed reports table
async function loadReviewedReportsTable() {
  const tableBody = document.getElementById("reviewed-reports-table")

  try {
    const reportsSnapshot = await db
      .collection("healthReports")
      .where("status", "==", "reviewed")
      .orderBy("reviewedAt", "desc")
      .limit(20)
      .get()

    if (reportsSnapshot.empty) {
      tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No reviewed health reports found.</td></tr>'
      return
    }

    // Get all farmer IDs
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

    let tableHTML = ""

    reportsSnapshot.forEach((doc) => {
      const report = doc.data()
      const reportDate = report.reportDate ? new Date(report.reportDate.toDate()).toLocaleDateString() : "Unknown"
      const reviewDate = report.reviewedAt ? new Date(report.reviewedAt.toDate()).toLocaleDateString() : "Unknown"
      const farmerName = farmerNames[report.farmerId]

      let severityClass = ""
      if (report.severity === "low") severityClass = "status-approved"
      else if (report.severity === "medium") severityClass = "status-pending"
      else if (report.severity === "high") severityClass = "status-critical"

      tableHTML += `
                <tr>
                    <td>${farmerName}</td>
                    <td>${report.livestockType} #${report.tagId}</td>
                    <td>${reportDate}</td>
                    <td class="${severityClass}">${report.severity.toUpperCase()}</td>
                    <td>${reviewDate}</td>
                    <td>${report.vetResponse}</td>
                </tr>
            `
    })

    tableBody.innerHTML = tableHTML
  } catch (error) {
    tableBody.innerHTML = `<tr><td colspan="6" class="text-danger">Error loading reports: ${error.message}</td></tr>`
  }
}

// Show review report modal
async function showReviewReportModal(reportId) {
  try {
    // Get report details
    const reportDoc = await db.collection("healthReports").doc(reportId).get()
    const report = reportDoc.data()

    // Get farmer details
    const farmerDoc = await db.collection("users").doc(report.farmerId).get()
    const farmerName = farmerDoc.exists ? farmerDoc.data().name : "Unknown Farmer"

    // Get livestock details
    const livestockDoc = await db.collection("livestock").doc(report.livestockId).get()
    const livestock = livestockDoc.exists ? livestockDoc.data() : null

    const reportDate = report.reportDate ? new Date(report.reportDate.toDate()).toLocaleDateString() : "Unknown"

    // Set modal title and content
    document.getElementById("itemModalLabel").textContent = "Review Health Report"

    modalContent.innerHTML = `
            <div class="mb-4">
                <h5>Report Details</h5>
                <div class="row">
                    <div class="col-md-6">
                        <p><strong>Farmer:</strong> ${farmerName}</p>
                        <p><strong>Livestock:</strong> ${report.livestockType} #${report.tagId}</p>
                        <p><strong>Report Date:</strong> ${reportDate}</p>
                    </div>
                    <div class="col-md-6">
                        <p><strong>Severity:</strong> <span class="status-${report.severity === "low" ? "approved" : report.severity === "medium" ? "pending" : "critical"}">${report.severity.toUpperCase()}</span></p>
                        <p><strong>Current Health Status:</strong> ${livestock ? livestock.healthStatus.toUpperCase() : "Unknown"}</p>
                    </div>
                </div>
                <div class="mb-3">
                    <p><strong>Symptoms:</strong></p>
                    <p>${report.symptoms}</p>
                </div>
                ${
                  report.details
                    ? `
                <div class="mb-3">
                    <p><strong>Additional Details:</strong></p>
                    <p>${report.details}</p>
                </div>
                `
                    : ""
                }
            </div>
            <form id="review-report-form">
                <div class="mb-3">
                    <label for="response" class="form-label">Your Response</label>
                    <textarea class="form-control" id="response" rows="4" required></textarea>
                </div>
                <div class="mb-3">
                    <label for="recommendedStatus" class="form-label">Recommended Health Status</label>
                    <select class="form-select" id="recommendedStatus" required>
                        <option value="healthy">Healthy</option>
                        <option value="sick" selected>Sick</option>
                        <option value="critical">Critical</option>
                    </select>
                </div>
                <div class="d-flex justify-content-end">
                    <button type="button" class="btn btn-secondary me-2" data-bs-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-primary">Submit Review</button>
                </div>
            </form>
        `

    // Show modal
    itemModal.show()

    // Add event listener for form submission
    document.getElementById("review-report-form").addEventListener("submit", async (e) => {
      e.preventDefault()

      const response = document.getElementById("response").value
      const recommendedStatus = document.getElementById("recommendedStatus").value

      try {
        const user = auth.currentUser

        // Update health report
        await db.collection("healthReports").doc(reportId).update({
          status: "reviewed",
          vetResponse: response,
          reviewedBy: user.uid,
          reviewedAt: firebase.firestore.FieldValue.serverTimestamp(),
        })

        // Update livestock health status
        if (livestock) {
          await db.collection("livestock").doc(report.livestockId).update({
            healthStatus: recommendedStatus,
            lastCheckup: firebase.firestore.FieldValue.serverTimestamp(),
          })
        }

        // Close modal
        itemModal.hide()

        // Show success message
        alert("Report reviewed successfully.")

        // Reload tables
        await loadPendingReportsTable()
        await loadReviewedReportsTable()
      } catch (error) {
        alert("Error reviewing report: " + error.message)
      }
    })
  } catch (error) {
    alert("Error loading report details: " + error.message)
  }
}

