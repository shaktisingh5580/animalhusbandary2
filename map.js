// Load map module based on menu item and user role
function loadMapModule(menuItem, role) {
  if (menuItem === "find-vets" && role === "farmer") {
    loadFindVets()
  } else if (menuItem === "update-location" && role === "vet") {
    loadUpdateLocation()
  }
}

// Load find vets
function loadFindVets() {
  contentArea.innerHTML = `
        <div class="d-flex justify-content-between mb-4">
            <h3>Find Veterinary Services</h3>
        </div>
        <div class="card mb-4">
            <div class="card-body">
                <div id="map" class="mb-3"></div>
                <div class="d-flex justify-content-center">
                    <button class="btn btn-primary" id="find-my-location">
                        <i class="bi bi-geo-alt me-2"></i>Find My Location
                    </button>
                </div>
            </div>
        </div>
        <div class="card">
            <div class="card-header">
                <h5 class="mb-0">Nearby Veterinary Officers</h5>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Distance</th>
                                <th>Contact</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="nearby-vets-table">
                            <tr>
                                <td colspan="4" class="text-center">Use the map to find nearby veterinary officers.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `

  // Initialize map
  initializeMap("find-vets")
}

// Load update location
function loadUpdateLocation() {
  contentArea.innerHTML = `
        <div class="d-flex justify-content-between mb-4">
            <h3>Update Your Location</h3>
        </div>
        <div class="card mb-4">
            <div class="card-body">
                <p class="mb-3">Update your location to help farmers find you when they need veterinary services.</p>
                <div id="map" class="mb-3"></div>
                <div class="d-flex justify-content-center">
                    <button class="btn btn-primary me-2" id="find-my-location">
                        <i class="bi bi-geo-alt me-2"></i>Find My Location
                    </button>
                    <button class="btn btn-success" id="save-location">
                        <i class="bi bi-check-circle me-2"></i>Save Location
                    </button>
                </div>
            </div>
        </div>
        <div class="card">
            <div class="card-header">
                <h5 class="mb-0">Your Location History</h5>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Latitude</th>
                                <th>Longitude</th>
                            </tr>
                        </thead>
                        <tbody id="location-history-table">
                            <tr>
                                <td colspan="3" class="text-center">Loading...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `

  // Initialize map
  initializeMap("update-location")

  // Load location history
  loadLocationHistory()
}

// Initialize map
function initializeMap(mode) {
  // Load OpenStreetMap script
  const script = document.createElement("script")
  script.src = "https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"
  script.integrity = "sha512-XQoYMqMTK8LvdxXYG3nZ448hOEQiglfqkJs1NOQV44cWnUrBc8PkAOcXy20w0vlaXaVUearIOBhiXZ5V3ynxwA=="
  script.crossOrigin = ""
  document.head.appendChild(script)

  // Load OpenStreetMap CSS
  const link = document.createElement("link")
  link.rel = "stylesheet"
  link.href = "https://unpkg.com/leaflet@1.7.1/dist/leaflet.css"
  link.integrity = "sha512-xodZBNTC5n17Xt2atTPuE1HxjVMSvLVW9ocqUKLsCC5CXdbqCmblAshOMAS6/keqq/sMZMZ19scR4PsZChSR7A=="
  link.crossOrigin = ""
  document.head.appendChild(link)

  // Wait for script to load
  script.onload = () => {
    // Initialize map
    const map = L.map("map").setView([0, 0], 13)

    // Add tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map)

    // Add find my location button functionality
    document.getElementById("find-my-location").addEventListener("click", () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const lat = position.coords.latitude
            const lng = position.coords.longitude

            // Update map view
            map.setView([lat, lng], 13)

            // Add marker for current location
            const marker = L.marker([lat, lng]).addTo(map)
            marker.bindPopup("Your Location").openPopup()

            if (mode === "find-vets") {
              // Find nearby vets
              findNearbyVets(lat, lng)
            } else if (mode === "update-location") {
              // Store coordinates for saving
              window.currentLocation = { lat, lng }
            }
          },
          (error) => {
            alert("Error getting your location: " + error.message)
          },
        )
      } else {
        alert("Geolocation is not supported by your browser.")
      }
    })

    if (mode === "update-location") {
      // Add save location button functionality
      document.getElementById("save-location").addEventListener("click", async () => {
        if (!window.currentLocation) {
          alert("Please find your location first.")
          return
        }

        try {
          const user = auth.currentUser

          // Save location to Firestore
          await db.collection("vetLocations").add({
            vetId: user.uid,
            latitude: window.currentLocation.lat,
            longitude: window.currentLocation.lng,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          })

          // Update user's last known location
          await db
            .collection("users")
            .doc(user.uid)
            .update({
              lastLocation: new firebase.firestore.GeoPoint(window.currentLocation.lat, window.currentLocation.lng),
              lastLocationUpdate: firebase.firestore.FieldValue.serverTimestamp(),
            })

          alert("Location saved successfully.")

          // Reload location history
          await loadLocationHistory()
        } catch (error) {
          alert("Error saving location: " + error.message)
        }
      })

      // Load vet's last known location
      loadVetLocation(map)
    } else if (mode === "find-vets") {
      // Load all vet locations
      loadAllVetLocations(map)
    }
  }
}

// Find nearby vets
async function findNearbyVets(lat, lng) {
  const tableBody = document.getElementById("nearby-vets-table")

  try {
    // Get all vets
    const vetsSnapshot = await db.collection("users").where("role", "==", "vet").get()

    if (vetsSnapshot.empty) {
      tableBody.innerHTML = '<tr><td colspan="4" class="text-center">No veterinary officers found.</td></tr>'
      return
    }

    // Get vet locations
    const vetLocations = []

    for (const doc of vetsSnapshot.docs) {
      const vet = doc.data()

      if (vet.lastLocation) {
        const distance = calculateDistance(lat, lng, vet.lastLocation.latitude, vet.lastLocation.longitude)

        vetLocations.push({
          id: doc.id,
          name: vet.name,
          email: vet.email,
          latitude: vet.lastLocation.latitude,
          longitude: vet.lastLocation.longitude,
          distance: distance,
        })
      }
    }

    // Sort by distance
    vetLocations.sort((a, b) => a.distance - b.distance)

    if (vetLocations.length === 0) {
      tableBody.innerHTML =
        '<tr><td colspan="4" class="text-center">No veterinary officers with location data found.</td></tr>'
      return
    }

    let tableHTML = ""

    vetLocations.forEach((vet) => {
      tableHTML += `
                <tr>
                    <td>${vet.name}</td>
                    <td>${vet.distance.toFixed(2)} km</td>
                    <td>${vet.email}</td>
                    <td>
                        <button class="btn btn-sm btn-primary contact-vet" data-id="${vet.id}">Contact</button>
                    </td>
                </tr>
            `
    })

    tableBody.innerHTML = tableHTML

    // Add event listeners for contact buttons
    document.querySelectorAll(".contact-vet").forEach((button) => {
      button.addEventListener("click", (e) => {
        const vetId = e.target.getAttribute("data-id")
        const vet = vetLocations.find((v) => v.id === vetId)

        if (vet) {
          // Open email client
          window.location.href = `mailto:${vet.email}?subject=Request for Veterinary Services`
        }
      })
    })
  } catch (error) {
    tableBody.innerHTML = `<tr><td colspan="4" class="text-danger">Error finding nearby vets: ${error.message}</td></tr>`
  }
}

// Calculate distance between two coordinates in kilometers (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371 // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1)
  const dLon = deg2rad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c // Distance in km
  return distance
}

function deg2rad(deg) {
  return deg * (Math.PI / 180)
}

// Load vet's last known location
async function loadVetLocation(map) {
  try {
    const user = auth.currentUser
    const userDoc = await db.collection("users").doc(user.uid).get()

    if (userDoc.exists && userDoc.data().lastLocation) {
      const location = userDoc.data().lastLocation

      // Update map view
      map.setView([location.latitude, location.longitude], 13)

      // Add marker for current location
      const marker = L.marker([location.latitude, location.longitude]).addTo(map)
      marker.bindPopup("Your Last Saved Location").openPopup()

      // Store coordinates for saving
      window.currentLocation = { lat: location.latitude, lng: location.longitude }
    }
  } catch (error) {
    console.error("Error loading vet location:", error)
  }
}

// Load all vet locations
async function loadAllVetLocations(map) {
  try {
    // Get all vets
    const vetsSnapshot = await db.collection("users").where("role", "==", "vet").get()

    if (vetsSnapshot.empty) {
      return
    }

    const markers = []

    for (const doc of vetsSnapshot.docs) {
      const vet = doc.data()

      if (vet.lastLocation) {
        // Add marker for vet location
        const marker = L.marker([vet.lastLocation.latitude, vet.lastLocation.longitude]).addTo(map)
        marker.bindPopup(`<strong>${vet.name}</strong><br>Veterinary Officer`)
        markers.push(marker)
      }
    }

    // If there are markers, fit the map to show all of them
    if (markers.length > 0) {
      const group = new L.featureGroup(markers)
      map.fitBounds(group.getBounds().pad(0.1))
    }
  } catch (error) {
    console.error("Error loading vet locations:", error)
  }
}

// Load location history
async function loadLocationHistory() {
  const tableBody = document.getElementById("location-history-table")

  try {
    const user = auth.currentUser
    const locationsSnapshot = await db
      .collection("vetLocations")
      .where("vetId", "==", user.uid)
      .orderBy("timestamp", "desc")
      .limit(10)
      .get()

    if (locationsSnapshot.empty) {
      tableBody.innerHTML = '<tr><td colspan="3" class="text-center">No location history found.</td></tr>'
      return
    }

    let tableHTML = ""

    locationsSnapshot.forEach((doc) => {
      const location = doc.data()
      const date = location.timestamp ? new Date(location.timestamp.toDate()).toLocaleString() : "Unknown"

      tableHTML += `
                <tr>
                    <td>${date}</td>
                    <td>${location.latitude.toFixed(6)}</td>
                    <td>${location.longitude.toFixed(6)}</td>
                </tr>
            `
    })

    tableBody.innerHTML = tableHTML
  } catch (error) {
    tableBody.innerHTML = `<tr><td colspan="3" class="text-danger">Error loading location history: ${error.message}</td></tr>`
  }
}

