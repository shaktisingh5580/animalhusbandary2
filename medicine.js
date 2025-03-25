// Declare variables
const contentArea = document.getElementById("content-area") // Assuming you have an element with this ID
const auth = firebase.auth()
const db = firebase.firestore()
const modalContent = document.getElementById("itemModalContent") // Assuming you have an element with this ID
const itemModal = new bootstrap.Modal(document.getElementById("itemModal")) // Assuming you have a modal with this ID

// Load medicine module based on menu item and user role
function loadMedicineModule(menuItem, role) {
  if (menuItem === "medicine-requests" && role === "farmer") {
    loadFarmerMedicineRequests()
  } else if (menuItem === "medicine-approvals" && role === "vet") {
    loadVetMedicineApprovals()
  } else if (menuItem === "medicine-inventory" && role === "government") {
    loadGovernmentMedicineInventory()
  }
}

// Load farmer medicine requests
async function loadFarmerMedicineRequests() {
  contentArea.innerHTML = `
        <div class="d-flex justify-content-between mb-4">
            <h3>My Medicine Requests</h3>
            <button class="btn btn-primary" id="new-medicine-request-btn">
                <i class="bi bi-plus-circle me-2"></i>New Request
            </button>
        </div>
        <div class="card">
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>Medicine</th>
                                <th>Quantity</th>
                                <th>Request Date</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="medicine-requests-table">
                            <tr>
                                <td colspan="5" class="text-center">Loading...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `

  // Add event listener for new request button
  document.getElementById("new-medicine-request-btn").addEventListener("click", showNewMedicineRequestModal)

  // Load medicine requests
  await loadMedicineRequestsTable()
}

// Load medicine requests table
async function loadMedicineRequestsTable() {
  const tableBody = document.getElementById("medicine-requests-table")

  try {
    const user = auth.currentUser
    const requestsSnapshot = await db
      .collection("medicineRequests")
      .where("farmerId", "==", user.uid)
      .orderBy("createdAt", "desc")
      .get()

    if (requestsSnapshot.empty) {
      tableBody.innerHTML = '<tr><td colspan="5" class="text-center">No medicine requests found.</td></tr>'
      return
    }

    let tableHTML = ""

    requestsSnapshot.forEach((doc) => {
      const request = doc.data()
      const date = request.createdAt ? new Date(request.createdAt.toDate()).toLocaleDateString() : "Unknown"

      let statusClass = ""
      if (request.status === "pending") statusClass = "status-pending"
      else if (request.status === "approved") statusClass = "status-approved"
      else if (request.status === "rejected") statusClass = "status-rejected"

      let actionsHTML = ""
      if (request.status === "pending") {
        actionsHTML = `<button class="btn btn-sm btn-outline-danger cancel-request" data-id="${doc.id}">Cancel</button>`
      } else if (request.status === "approved") {
        actionsHTML = `<span class="badge bg-success">Approved on ${request.approvedAt ? new Date(request.approvedAt.toDate()).toLocaleDateString() : "Unknown"}</span>`
      } else if (request.status === "rejected") {
        actionsHTML = `<span class="badge bg-danger">Rejected</span>`
      }

      tableHTML += `
                <tr>
                    <td>${request.medicineName}</td>
                    <td>${request.quantity} units</td>
                    <td>${date}</td>
                    <td><span class="${statusClass}">${request.status.toUpperCase()}</span></td>
                    <td>${actionsHTML}</td>
                </tr>
            `
    })

    tableBody.innerHTML = tableHTML

    // Add event listeners for cancel buttons
    document.querySelectorAll(".cancel-request").forEach((button) => {
      button.addEventListener("click", async (e) => {
        const requestId = e.target.getAttribute("data-id")
        if (confirm("Are you sure you want to cancel this request?")) {
          try {
            await db.collection("medicineRequests").doc(requestId).delete()
            alert("Request cancelled successfully.")
            await loadMedicineRequestsTable()
          } catch (error) {
            alert("Error cancelling request: " + error.message)
          }
        }
      })
    })
  } catch (error) {
    tableBody.innerHTML = `<tr><td colspan="5" class="text-danger">Error loading requests: ${error.message}</td></tr>`
  }
}

// Show new medicine request modal
async function showNewMedicineRequestModal() {
  try {
    // Get available medicines
    const medicinesSnapshot = await db
      .collection("medicines")
      .where("quantity", ">", 0)
      .orderBy("quantity", "desc")
      .get()

    let medicineOptions = ""

    if (medicinesSnapshot.empty) {
      medicineOptions = '<option value="">No medicines available</option>'
    } else {
      medicinesSnapshot.forEach((doc) => {
        const medicine = doc.data()
        medicineOptions += `<option value="${doc.id}">${medicine.name} (${medicine.quantity} ${medicine.unit} available)</option>`
      })
    }

    // Set modal title and content
    document.getElementById("itemModalLabel").textContent = "New Medicine Request"

    modalContent.innerHTML = `
            <form id="new-medicine-request-form">
                <div class="mb-3">
                    <label for="medicine" class="form-label">Medicine</label>
                    <select class="form-select" id="medicine" required>
                        <option value="">Select medicine</option>
                        ${medicineOptions}
                    </select>
                </div>
                <div class="mb-3">
                    <label for="quantity" class="form-label">Quantity</label>
                    <input type="number" class="form-control" id="quantity" min="1" required>
                </div>
                <div class="mb-3">
                    <label for="reason" class="form-label">Reason for Request</label>
                    <textarea class="form-control" id="reason" rows="3" required></textarea>
                </div>
                <div class="d-flex justify-content-end">
                    <button type="button" class="btn btn-secondary me-2" data-bs-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-primary">Submit Request</button>
                </div>
            </form>
        `

    // Show modal
    itemModal.show()

    // Add event listener for form submission
    document.getElementById("new-medicine-request-form").addEventListener("submit", async (e) => {
      e.preventDefault()

      const medicineId = document.getElementById("medicine").value
      const quantity = Number.parseInt(document.getElementById("quantity").value)
      const reason = document.getElementById("reason").value

      try {
        // Get medicine details
        const medicineDoc = await db.collection("medicines").doc(medicineId).get()
        const medicine = medicineDoc.data()

        // Check if quantity is available
        if (quantity > medicine.quantity) {
          alert(`Only ${medicine.quantity} ${medicine.unit} available. Please reduce the quantity.`)
          return
        }

        // Create new request
        const user = auth.currentUser
        await db.collection("medicineRequests").add({
          medicineId: medicineId,
          medicineName: medicine.name,
          quantity: quantity,
          reason: reason,
          status: "pending",
          farmerId: user.uid,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        })

        // Close modal
        itemModal.hide()

        // Show success message
        alert("Medicine request submitted successfully.")

        // Reload table
        await loadMedicineRequestsTable()
      } catch (error) {
        alert("Error submitting request: " + error.message)
      }
    })
  } catch (error) {
    alert("Error loading medicines: " + error.message)
  }
}

// Load vet medicine approvals
async function loadVetMedicineApprovals() {
  contentArea.innerHTML = `
        <div class="d-flex justify-content-between mb-4">
            <h3>Medicine Approval Requests</h3>
        </div>
        <div class="card">
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>Farmer</th>
                                <th>Medicine</th>
                                <th>Quantity</th>
                                <th>Request Date</th>
                                <th>Reason</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="medicine-approvals-table">
                            <tr>
                                <td colspan="6" class="text-center">Loading...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `

  // Load medicine approvals
  await loadMedicineApprovalsTable()
}

// Load medicine approvals table
async function loadMedicineApprovalsTable() {
  const tableBody = document.getElementById("medicine-approvals-table")

  try {
    const requestsSnapshot = await db
      .collection("medicineRequests")
      .where("status", "==", "pending")
      .orderBy("createdAt", "asc")
      .get()

    if (requestsSnapshot.empty) {
      tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No pending medicine requests found.</td></tr>'
      return
    }

    // Get all farmer IDs
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

    let tableHTML = ""

    requestsSnapshot.forEach((doc) => {
      const request = doc.data()
      const date = request.createdAt ? new Date(request.createdAt.toDate()).toLocaleDateString() : "Unknown"
      const farmerName = farmerNames[request.farmerId]

      tableHTML += `
                <tr>
                    <td>${farmerName}</td>
                    <td>${request.medicineName}</td>
                    <td>${request.quantity} units</td>
                    <td>${date}</td>
                    <td>${request.reason}</td>
                    <td>
                        <button class="btn btn-sm btn-success approve-request me-1" data-id="${doc.id}">Approve</button>
                        <button class="btn btn-sm btn-danger reject-request" data-id="${doc.id}">Reject</button>
                    </td>
                </tr>
            `
    })

    tableBody.innerHTML = tableHTML

    // Add event listeners for approve buttons
    document.querySelectorAll(".approve-request").forEach((button) => {
      button.addEventListener("click", async (e) => {
        const requestId = e.target.getAttribute("data-id")
        if (confirm("Are you sure you want to approve this request?")) {
          try {
            // Get request details
            const requestDoc = await db.collection("medicineRequests").doc(requestId).get()
            const request = requestDoc.data()

            // Get medicine details
            const medicineDoc = await db.collection("medicines").doc(request.medicineId).get()
            const medicine = medicineDoc.data()

            // Check if quantity is still available
            if (request.quantity > medicine.quantity) {
              alert(`Only ${medicine.quantity} ${medicine.unit} available. Cannot approve this request.`)
              return
            }

            // Update medicine quantity
            await db
              .collection("medicines")
              .doc(request.medicineId)
              .update({
                quantity: firebase.firestore.FieldValue.increment(-request.quantity),
              })

            // Update request status
            const user = auth.currentUser
            await db.collection("medicineRequests").doc(requestId).update({
              status: "approved",
              approvedBy: user.uid,
              approvedAt: firebase.firestore.FieldValue.serverTimestamp(),
            })

            // Add to distribution log
            await db.collection("medicineDistribution").add({
              requestId: requestId,
              medicineId: request.medicineId,
              medicineName: request.medicineName,
              quantity: request.quantity,
              farmerId: request.farmerId,
              approvedBy: user.uid,
              distributedAt: firebase.firestore.FieldValue.serverTimestamp(),
            })

            alert("Request approved successfully.")
            await loadMedicineApprovalsTable()
          } catch (error) {
            alert("Error approving request: " + error.message)
          }
        }
      })
    })

    // Add event listeners for reject buttons
    document.querySelectorAll(".reject-request").forEach((button) => {
      button.addEventListener("click", async (e) => {
        const requestId = e.target.getAttribute("data-id")
        if (confirm("Are you sure you want to reject this request?")) {
          try {
            const user = auth.currentUser
            await db.collection("medicineRequests").doc(requestId).update({
              status: "rejected",
              rejectedBy: user.uid,
              rejectedAt: firebase.firestore.FieldValue.serverTimestamp(),
            })

            alert("Request rejected successfully.")
            await loadMedicineApprovalsTable()
          } catch (error) {
            alert("Error rejecting request: " + error.message)
          }
        }
      })
    })
  } catch (error) {
    tableBody.innerHTML = `<tr><td colspan="6" class="text-danger">Error loading requests: ${error.message}</td></tr>`
  }
}

// Load government medicine inventory
async function loadGovernmentMedicineInventory() {
  contentArea.innerHTML = `
        <div class="d-flex justify-content-between mb-4">
            <h3>Medicine Inventory</h3>
            <button class="btn btn-primary" id="new-medicine-btn">
                <i class="bi bi-plus-circle me-2"></i>Add Medicine
            </button>
        </div>
        <div class="card">
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>Medicine</th>
                                <th>Category</th>
                                <th>Quantity</th>
                                <th>Warning Level</th>
                                <th>Critical Level</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="medicine-inventory-table">
                            <tr>
                                <td colspan="6" class="text-center">Loading...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `

  // Add event listener for new medicine button
  document.getElementById("new-medicine-btn").addEventListener("click", showNewMedicineModal)

  // Load medicine inventory
  await loadMedicineInventoryTable()
}

// Load medicine inventory table
async function loadMedicineInventoryTable() {
  const tableBody = document.getElementById("medicine-inventory-table")

  try {
    const medicinesSnapshot = await db.collection("medicines").orderBy("name").get()

    if (medicinesSnapshot.empty) {
      tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No medicines found in inventory.</td></tr>'
      return
    }

    let tableHTML = ""

    medicinesSnapshot.forEach((doc) => {
      const medicine = doc.data()

      let quantityClass = ""
      if (medicine.quantity <= medicine.criticalLevel) {
        quantityClass = "status-critical"
      } else if (medicine.quantity <= medicine.warningLevel) {
        quantityClass = "status-pending"
      } else {
        quantityClass = "status-approved"
      }

      tableHTML += `
                <tr>
                    <td>${medicine.name}</td>
                    <td>${medicine.category}</td>
                    <td class="${quantityClass}">${medicine.quantity} ${medicine.unit}</td>
                    <td>${medicine.warningLevel} ${medicine.unit}</td>
                    <td>${medicine.criticalLevel} ${medicine.unit}</td>
                    <td>
                        <button class="btn btn-sm btn-primary update-stock me-1" data-id="${doc.id}">Update Stock</button>
                        <button class="btn btn-sm btn-secondary edit-medicine" data-id="${doc.id}">Edit</button>
                    </td>
                </tr>
            `
    })

    tableBody.innerHTML = tableHTML

    // Add event listeners for update stock buttons
    document.querySelectorAll(".update-stock").forEach((button) => {
      button.addEventListener("click", async (e) => {
        const medicineId = e.target.getAttribute("data-id")
        await showUpdateStockModal(medicineId)
      })
    })

    // Add event listeners for edit medicine buttons
    document.querySelectorAll(".edit-medicine").forEach((button) => {
      button.addEventListener("click", async (e) => {
        const medicineId = e.target.getAttribute("data-id")
        await showEditMedicineModal(medicineId)
      })
    })
  } catch (error) {
    tableBody.innerHTML = `<tr><td colspan="6" class="text-danger">Error loading inventory: ${error.message}</td></tr>`
  }
}

// Show new medicine modal
function showNewMedicineModal() {
  // Set modal title and content
  document.getElementById("itemModalLabel").textContent = "Add New Medicine"

  modalContent.innerHTML = `
        <form id="new-medicine-form">
            <div class="mb-3">
                <label for="name" class="form-label">Medicine Name</label>
                <input type="text" class="form-control" id="name" required>
            </div>
            <div class="mb-3">
                <label for="category" class="form-label">Category</label>
                <select class="form-select" id="category" required>
                    <option value="">Select category</option>
                    <option value="Antibiotics">Antibiotics</option>
                    <option value="Vaccines">Vaccines</option>
                    <option value="Parasiticides">Parasiticides</option>
                    <option value="Anti-inflammatory">Anti-inflammatory</option>
                    <option value="Vitamins">Vitamins</option>
                    <option value="Other">Other</option>
                </select>
            </div>
            <div class="mb-3">
                <label for="quantity" class="form-label">Initial Quantity</label>
                <input type="number" class="form-control" id="quantity" min="0" required>
            </div>
            <div class="mb-3">
                <label for="unit" class="form-label">Unit of Measurement</label>
                <select class="form-select" id="unit" required>
                    <option value="">Select unit</option>
                    <option value="units">Units</option>
                    <option value="bottles">Bottles</option>
                    <option value="vials">Vials</option>
                    <option value="doses">Doses</option>
                    <option value="kg">Kilograms</option>
                    <option value="g">Grams</option>
                    <option value="ml">Milliliters</option>
                </select>
            </div>
            <div class="mb-3">
                <label for="warningLevel" class="form-label">Warning Level</label>
                <input type="number" class="form-control" id="warningLevel" min="0" required>
                <small class="text-muted">Stock level at which to display a warning</small>
            </div>
            <div class="mb-3">
                <label for="criticalLevel" class="form-label">Critical Level</label>
                <input type="number" class="form-control" id="criticalLevel" min="0" required>
                <small class="text-muted">Stock level at which to display a critical warning</small>
            </div>
            <div class="d-flex justify-content-end">
                <button type="button" class="btn btn-secondary me-2" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" class="btn btn-primary">Add Medicine</button>
            </div>
        </form>
    `

  // Show modal
  itemModal.show()

  // Add event listener for form submission
  document.getElementById("new-medicine-form").addEventListener("submit", async (e) => {
    e.preventDefault()

    const name = document.getElementById("name").value
    const category = document.getElementById("category").value
    const quantity = Number.parseInt(document.getElementById("quantity").value)
    const unit = document.getElementById("unit").value
    const warningLevel = Number.parseInt(document.getElementById("warningLevel").value)
    const criticalLevel = Number.parseInt(document.getElementById("criticalLevel").value)

    try {
      // Add new medicine to Firestore
      await db.collection("medicines").add({
        name: name,
        category: category,
        quantity: quantity,
        unit: unit,
        warningLevel: warningLevel,
        criticalLevel: criticalLevel,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      })

      // Close modal
      itemModal.hide()

      // Show success message
      alert("Medicine added successfully.")

      // Reload table
      await loadMedicineInventoryTable()
    } catch (error) {
      alert("Error adding medicine: " + error.message)
    }
  })
}

// Show update stock modal
async function showUpdateStockModal(medicineId) {
  try {
    // Get medicine details
    const medicineDoc = await db.collection("medicines").doc(medicineId).get()
    const medicine = medicineDoc.data()

    // Set modal title and content
    document.getElementById("itemModalLabel").textContent = "Update Stock"

    modalContent.innerHTML = `
            <form id="update-stock-form">
                <div class="mb-3">
                    <label class="form-label">Medicine</label>
                    <input type="text" class="form-control" value="${medicine.name}" readonly>
                </div>
                <div class="mb-3">
                    <label class="form-label">Current Stock</label>
                    <input type="text" class="form-control" value="${medicine.quantity} ${medicine.unit}" readonly>
                </div>
                <div class="mb-3">
                    <label for="action" class="form-label">Action</label>
                    <select class="form-select" id="action" required>
                        <option value="add">Add to Stock</option>
                        <option value="remove">Remove from Stock</option>
                    </select>
                </div>
                <div class="mb-3">
                    <label for="amount" class="form-label">Amount</label>
                    <input type="number" class="form-control" id="amount" min="1" required>
                </div>
                <div class="mb-3">
                    <label for="reason" class="form-label">Reason</label>
                    <textarea class="form-control" id="reason" rows="3" required></textarea>
                </div>
                <div class="d-flex justify-content-end">
                    <button type="button" class="btn btn-secondary me-2" data-bs-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-primary">Update Stock</button>
                </div>
            </form>
        `

    // Show modal
    itemModal.show()

    // Add event listener for form submission
    document.getElementById("update-stock-form").addEventListener("submit", async (e) => {
      e.preventDefault()

      const action = document.getElementById("action").value
      const amount = Number.parseInt(document.getElementById("amount").value)
      const reason = document.getElementById("reason").value

      try {
        // Calculate new quantity
        let newQuantity
        if (action === "add") {
          newQuantity = medicine.quantity + amount
        } else {
          newQuantity = medicine.quantity - amount
          if (newQuantity < 0) {
            alert("Cannot remove more than current stock.")
            return
          }
        }

        // Update medicine quantity
        await db.collection("medicines").doc(medicineId).update({
          quantity: newQuantity,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        })

        // Add stock transaction log
        const user = auth.currentUser
        await db.collection("stockTransactions").add({
          medicineId: medicineId,
          medicineName: medicine.name,
          action: action,
          amount: amount,
          reason: reason,
          previousQuantity: medicine.quantity,
          newQuantity: newQuantity,
          userId: user.uid,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        })

        // Close modal
        itemModal.hide()

        // Show success message
        alert("Stock updated successfully.")

        // Reload table
        await loadMedicineInventoryTable()
      } catch (error) {
        alert("Error updating stock: " + error.message)
      }
    })
  } catch (error) {
    alert("Error loading medicine details: " + error.message)
  }
}

// Show edit medicine modal
async function showEditMedicineModal(medicineId) {
  try {
    // Get medicine details
    const medicineDoc = await db.collection("medicines").doc(medicineId).get()
    const medicine = medicineDoc.data()

    // Set modal title and content
    document.getElementById("itemModalLabel").textContent = "Edit Medicine"

    modalContent.innerHTML = `
            <form id="edit-medicine-form">
                <div class="mb-3">
                    <label for="name" class="form-label">Medicine Name</label>
                    <input type="text" class="form-control" id="name" value="${medicine.name}" required>
                </div>
                <div class="mb-3">
                    <label for="category" class="form-label">Category</label>
                    <select class="form-select" id="category" required>
                        <option value="">Select category</option>
                        <option value="Antibiotics" ${medicine.category === "Antibiotics" ? "selected" : ""}>Antibiotics</option>
                        <option value="Vaccines" ${medicine.category === "Vaccines" ? "selected" : ""}>Vaccines</option>
                        <option value="Parasiticides" ${medicine.category === "Parasiticides" ? "selected" : ""}>Parasiticides</option>
                        <option value="Anti-inflammatory" ${medicine.category === "Anti-inflammatory" ? "selected" : ""}>Anti-inflammatory</option>
                        <option value="Vitamins" ${medicine.category === "Vitamins" ? "selected" : ""}>Vitamins</option>
                        <option value="Other" ${medicine.category === "Other" ? "selected" : ""}>Other</option>
                    </select>
                </div>
                <div class="mb-3">
                    <label for="unit" class="form-label">Unit of Measurement</label>
                    <select class="form-select" id="unit" required>
                        <option value="">Select unit</option>
                        <option value="units" ${medicine.unit === "units" ? "selected" : ""}>Units</option>
                        <option value="bottles" ${medicine.unit === "bottles" ? "selected" : ""}>Bottles</option>
                        <option value="vials" ${medicine.unit === "vials" ? "selected" : ""}>Vials</option>
                        <option value="doses" ${medicine.unit === "doses" ? "selected" : ""}>Doses</option>
                        <option value="kg" ${medicine.unit === "kg" ? "selected" : ""}>Kilograms</option>
                        <option value="g" ${medicine.unit === "g" ? "selected" : ""}>Grams</option>
                        <option value="ml" ${medicine.unit === "ml" ? "selected" : ""}>Milliliters</option>
                    </select>
                </div>
                <div class="mb-3">
                    <label for="warningLevel" class="form-label">Warning Level</label>
                    <input type="number" class="form-control" id="warningLevel" value="${medicine.warningLevel}" min="0" required>
                    <small class="text-muted">Stock level at which to display a warning</small>
                </div>
                <div class="mb-3">
                    <label for="criticalLevel" class="form-label">Critical Level</label>
                    <input type="number" class="form-control" id="criticalLevel" value="${medicine.criticalLevel}" min="0" required>
                    <small class="text-muted">Stock level at which to display a critical warning</small>
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
    document.getElementById("edit-medicine-form").addEventListener("submit", async (e) => {
      e.preventDefault()

      const name = document.getElementById("name").value
      const category = document.getElementById("category").value
      const unit = document.getElementById("unit").value
      const warningLevel = Number.parseInt(document.getElementById("warningLevel").value)
      const criticalLevel = Number.parseInt(document.getElementById("criticalLevel").value)

      try {
        // Update medicine in Firestore
        await db.collection("medicines").doc(medicineId).update({
          name: name,
          category: category,
          unit: unit,
          warningLevel: warningLevel,
          criticalLevel: criticalLevel,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        })

        // Close modal
        itemModal.hide()

        // Show success message
        alert("Medicine updated successfully.")

        // Reload table
        await loadMedicineInventoryTable()
      } catch (error) {
        alert("Error updating medicine: " + error.message)
      }
    })
  } catch (error) {
    alert("Error loading medicine details: " + error.message)
  }
}

