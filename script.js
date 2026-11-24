
// ==========================================
// RIDO TAXI - TAXI BOOKING MANAGEMENT SYSTEM
// ==========================================

// Vehicle rates (sample project rates in INR)
const rates = {
    Mini: 12,
    Sedan: 15,
    SUV: 20,
    Luxury: 30
};

// Data storage
let drivers = JSON.parse(localStorage.getItem("ridoDrivers")) || [];
let vehicles = JSON.parse(localStorage.getItem("ridoVehicles")) || [];
let bookings = JSON.parse(localStorage.getItem("ridoBookings")) || [];

// Save data
function saveData() {
    localStorage.setItem("ridoDrivers", JSON.stringify(drivers));
    localStorage.setItem("ridoVehicles", JSON.stringify(vehicles));
    localStorage.setItem("ridoBookings", JSON.stringify(bookings));
}

// Generate unique IDs
function generateId(prefix) {
    return prefix + Date.now().toString().slice(-7);
}

// Currency formatting
function money(amount) {
    return "₹" + Number(amount).toFixed(2);
}

// HTML safety helper
function safe(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

// ==========================================
// PAGE NAVIGATION
// ==========================================

function showPage(pageId) {
    document.querySelectorAll(".page").forEach(page => {
        page.classList.remove("active");
    });

    document.getElementById(pageId).classList.add("active");

    document.querySelectorAll(".nav-link").forEach(link => {
        link.classList.toggle(
            "active",
            link.dataset.page === pageId
        );
    });

    const titles = {
        dashboard: "Dashboard",
        drivers: "Driver Registration",
        vehicles: "Vehicle Management",
        bookings: "Customer Booking",
        allocation: "Driver & Vehicle Allocation",
        history: "Trip History & Reports"
    };

    document.getElementById("page-title").textContent =
        titles[pageId] || "RIDO TAXI";

    renderAll();
}

document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", () => {
        showPage(link.dataset.page);
    });
});

// ==========================================
// DRIVER REGISTRATION
// ==========================================

document.getElementById("driver-form").addEventListener(
    "submit", function(event) {

    event.preventDefault();

    const name = document.getElementById("driver-name").value.trim();
    const phone = document.getElementById("driver-phone").value.trim();
    const license = document.getElementById("driver-license").value.trim();
    const experience = Number(
        document.getElementById("driver-experience").value
    );

    if (!name || !/^\d{10}$/.test(phone) || !license ||
        !Number.isInteger(experience) || experience < 0) {
        alert("Please enter valid driver details.");
        return;
    }

    if (drivers.some(d => d.phone === phone ||
        d.license.toLowerCase() === license.toLowerCase())) {
        alert("Phone number or licence already registered.");
        return;
    }

    drivers.push({
        id: generateId("D"),
        name,
        phone,
        license,
        experience,
        status: "Available"
    });

    saveData();
    this.reset();
    renderAll();

    alert("Driver registered successfully!");
});

// Display drivers
function renderDrivers() {

    const table = document.getElementById("driver-table");

    if (drivers.length === 0) {
        table.innerHTML = emptyRow(7, "No drivers registered yet.");
        return;
    }

    table.innerHTML = drivers.map(driver => `
        <tr>
            <td>${safe(driver.id)}</td>
            <td>${safe(driver.name)}</td>
            <td>${safe(driver.phone)}</td>
            <td>${safe(driver.license)}</td>
            <td>${driver.experience} Years</td>
            <td>
                <span class="status ${driver.status === "Available" ? "available" : "booked"}">
                    ${safe(driver.status)}
                </span>
            </td>
            <td>
                <button class="action-btn danger"
                    onclick="deleteDriver('${safe(driver.id)}')">
                    Delete
                </button>
            </td>
        </tr>
    `).join("");
}

function deleteDriver(id) {

    const driver = drivers.find(d => d.id === id);

    if (!driver) return;

    if (driver.status !== "Available") {
        alert("This driver is currently allocated.");
        return;
    }

    if (!confirm("Delete this driver?")) return;

    drivers = drivers.filter(d => d.id !== id);

    saveData();
    renderAll();
}

// ==========================================
// VEHICLE MANAGEMENT
// ==========================================

document.getElementById("vehicle-form").addEventListener(
    "submit", function(event) {

    event.preventDefault();

    const number = document.getElementById("vehicle-number")
        .value.trim().toUpperCase();

    const model = document.getElementById("vehicle-model")
        .value.trim();

    const category = document.getElementById("vehicle-category").value;

    if (!number || !model || !rates[category]) {
        alert("Please enter valid vehicle details.");
        return;
    }

    if (vehicles.some(v => v.number === number)) {
        alert("This vehicle is already registered.");
        return;
    }

    vehicles.push({
        id: generateId("V"),
        number,
        model,
        category,
        rate: rates[category],
        status: "Available"
    });

    saveData();
    this.reset();
    renderAll();

    alert("Vehicle added successfully!");
});

// Display vehicles
function renderVehicles() {

    const table = document.getElementById("vehicle-table");

    if (vehicles.length === 0) {
        table.innerHTML = emptyRow(6, "No vehicles registered yet.");
        return;
    }

    table.innerHTML = vehicles.map(vehicle => `
        <tr>
            <td>${safe(vehicle.number)}</td>
            <td>${safe(vehicle.model)}</td>
            <td>${safe(vehicle.category)}</td>
            <td>${money(vehicle.rate)}</td>
            <td>
                <span class="status ${vehicle.status === "Available" ? "available" : "booked"}">
                    ${safe(vehicle.status)}
                </span>
            </td>
            <td>
                <button class="action-btn danger"
                    onclick="deleteVehicle('${safe(vehicle.id)}')">
                    Delete
                </button>
            </td>
        </tr>
    `).join("");
}

function deleteVehicle(id) {

    const vehicle = vehicles.find(v => v.id === id);

    if (!vehicle) return;

    if (vehicle.status !== "Available") {
        alert("This vehicle is currently allocated.");
        return;
    }

    if (!confirm("Delete this vehicle?")) return;

    vehicles = vehicles.filter(v => v.id !== id);

    saveData();
    renderAll();
}

// ==========================================
// FARE CALCULATION
// ==========================================

function calculateFare(distance, category, extra) {

    const rate = rates[category];

    if (!rate) return 0;

    return (distance * rate) + extra;
}

function updateFare() {

    const distance = Number(
        document.getElementById("distance").value
    );

    const category = document.getElementById("booking-category").value;

    const extra = Number(
        document.getElementById("extra-charge").value
    );

    let fare = 0;

    if (distance > 0 && rates[category] &&
        extra >= 0 && Number.isFinite(extra)) {

        fare = calculateFare(distance, category, extra);
    }

    document.getElementById("estimated-fare").textContent =
        money(fare);
}

["distance", "booking-category", "extra-charge"].forEach(id => {
    document.getElementById(id).addEventListener("input", updateFare);
});

// ==========================================
// AUTOMATIC DRIVER & VEHICLE ALLOCATION
// ==========================================

function allocateResources(category) {

    const driver = drivers.find(d => d.status === "Available");

    const vehicle = vehicles.find(v =>
        v.status === "Available" &&
        v.category === category
    );

    if (!driver || !vehicle) {
        return null;
    }

    driver.status = "Booked";
    vehicle.status = "Booked";

    return { driver, vehicle };
}

// ==========================================
// CUSTOMER BOOKING
// ==========================================

document.getElementById("booking-form").addEventListener(
    "submit", function(event) {

    event.preventDefault();

    const customer = document.getElementById("customer-name")
        .value.trim();

    const phone = document.getElementById("customer-phone")
        .value.trim();

    const pickup = document.getElementById("pickup").value.trim();

    const drop = document.getElementById("drop").value.trim();

    const distance = Number(
        document.getElementById("distance").value
    );

    const category = document.getElementById("booking-category").value;

    const extra = Number(
        document.getElementById("extra-charge").value
    );

    if (!customer || !/^\d{10}$/.test(phone) ||
        !pickup || !drop || pickup.toLowerCase() === drop.toLowerCase() ||
        !Number.isFinite(distance) || distance <= 0 ||
        !rates[category] || !Number.isFinite(extra) || extra < 0) {

        alert("Please enter valid booking details.");
        return;
    }

    const allocation = allocateResources(category);

    if (!allocation) {
        alert("No available driver or matching vehicle. Please register or free up resources first.");
        return;
    }

    const fare = calculateFare(distance, category, extra);

    const booking = {
        id: generateId("B"),
        customer,
        phone,
        pickup,
        drop,
        distance,
        category,
        extra,
        fare,
        rate: rates[category],
        driverId: allocation.driver.id,
        driverName: allocation.driver.name,
        vehicleId: allocation.vehicle.id,
        vehicleNumber: allocation.vehicle.number,
        date: new Date().toLocaleString("en-IN"),
        status: "Booked"
    };

    bookings.unshift(booking);

    saveData();
    this.reset();
    document.getElementById("estimated-fare").textContent = "₹0.00";

    renderAll();

    alert(
        "Booking confirmed!\n" +
        "Booking ID: " + booking.id +
        "\nDriver: " + booking.driverName +
        "\nVehicle: " + booking.vehicleNumber +
        "\nEstimated Fare: " + money(booking.fare)
    );
});

// ==========================================
// TRIP COMPLETION AND CANCELLATION
// ==========================================

function updateTrip(id, action) {

    const booking = bookings.find(b => b.id === id);

    if (!booking || booking.status !== "Booked") return;

    if (!["Completed", "Cancelled"].includes(action)) return;

    const message = action === "Completed"
        ? "Mark this trip as completed?"
        : "Cancel this booking?";

    if (!confirm(message)) return;

    booking.status = action;

    const driver = drivers.find(d => d.id === booking.driverId);
    const vehicle = vehicles.find(v => v.id === booking.vehicleId);

    if (driver) driver.status = "Available";
    if (vehicle) vehicle.status = "Available";

    saveData();
    renderAll();
}

// ==========================================
// DASHBOARD
// ==========================================

function renderDashboard() {

    document.getElementById("total-drivers").textContent =
        drivers.length;

    document.getElementById("total-vehicles").textContent =
        vehicles.length;

    document.getElementById("total-bookings").textContent =
        bookings.length;

    document.getElementById("completed-trips").textContent =
        bookings.filter(b => b.status === "Completed").length;

    const table = document.getElementById("dashboard-bookings");

    if (bookings.length === 0) {
        table.innerHTML = emptyRow(5, "No bookings available.");
        return;
    }

    table.innerHTML = bookings.slice(0, 5).map(b => `
        <tr>
            <td>${safe(b.customer)}</td>
            <td>${safe(b.drop)}</td>
            <td>${safe(b.category)}</td>
            <td>${money(b.fare)}</td>
            <td>
                <span class="status ${b.status.toLowerCase()}">
                    ${safe(b.status)}
                </span>
            </td>
        </tr>
    `).join("");
}

// ==========================================
// DRIVER AND VEHICLE ALLOCATION TABLE
// ==========================================

function renderAllocation() {

    const table = document.getElementById("allocation-table");

    if (bookings.length === 0) {
        table.innerHTML = emptyRow(6, "No allocated trips yet.");
        return;
    }

    table.innerHTML = bookings.map(b => `
        <tr>
            <td>${safe(b.id)}</td>
            <td>${safe(b.customer)}</td>
            <td>${safe(b.driverName)}</td>
            <td>${safe(b.vehicleNumber)}</td>
            <td>${b.distance} KM</td>
            <td>
                <span class="status ${b.status.toLowerCase()}">
                    ${safe(b.status)}
                </span>
            </td>
        </tr>
    `).join("");
}

// ==========================================
// TRIP HISTORY AND REPORTS
// ==========================================

function renderHistory() {

    const table = document.getElementById("history-table");

    if (bookings.length === 0) {
        table.innerHTML = emptyRow(8, "No trip history available.");
    } else {
        table.innerHTML = bookings.map(b => `
            <tr>
                <td>${safe(b.id)}</td>
                <td>${safe(b.customer)}</td>
                <td>${safe(b.driverName)}</td>
                <td>${safe(b.pickup)} → ${safe(b.drop)}</td>
                <td>${b.distance} KM</td>
                <td>${money(b.fare)}</td>
                <td>
                    <span class="status ${b.status.toLowerCase()}">
                        ${safe(b.status)}
                    </span>
                </td>
                <td>
                    ${b.status === "Booked" ? `
                        <button class="action-btn"
                            onclick="updateTrip('${safe(b.id)}','Completed')">
                            Complete
                        </button>
                        <button class="action-btn danger"
                            onclick="updateTrip('${safe(b.id)}','Cancelled')">
                            Cancel
                        </button>
                    ` : "—"}
                </td>
            </tr>
        `).join("");
    }

    renderDriverSummary();
}

// Driver-wise summary
function renderDriverSummary() {

    const table = document.getElementById("driver-summary");

    if (drivers.length === 0) {
        table.innerHTML = emptyRow(4, "No driver records.");
        return;
    }

    table.innerHTML = drivers.map(driver => {

        const trips = bookings.filter(b =>
            b.driverId === driver.id
        );

        const completed = trips.filter(b =>
            b.status === "Completed"
        );

        const earnings = completed.reduce(
            (total, b) => total + b.fare, 0
        );

        return `
            <tr>
                <td>${safe(driver.name)}</td>
                <td>${trips.length}</td>
                <td>${completed.length}</td>
                <td>${money(earnings)}</td>
            </tr>
        `;
    }).join("");
}

// ==========================================
// EXPORT TRIP REPORT AS CSV
// ==========================================

function exportReport() {

    if (bookings.length === 0) {
        alert("No trip records to export.");
        return;
    }

    const headers = [
        "Booking ID",
        "Customer",
        "Phone",
        "Driver",
        "Vehicle",
        "Pickup",
        "Drop",
        "Distance KM",
        "Category",
        "Rate Per KM",
        "Extra Charges",
        "Fare",
        "Date",
        "Status"
    ];

    const rows = bookings.map(b => [
        b.id,
        b.customer,
        b.phone,
        b.driverName,
        b.vehicleNumber,
        b.pickup,
        b.drop,
        b.distance,
        b.category,
        b.rate,
        b.extra,
        b.fare,
        b.date,
        b.status
    ]);

    function csvValue(value) {
        return '"' + String(value ?? "").replace(/"/g, '""') + '"';
    }

    const csv = [headers, ...rows]
        .map(row => row.map(csvValue).join(","))
        .join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "RIDO_TAXI_Trip_Report.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
}

// ==========================================
// COMMON FUNCTIONS
// ==========================================

function emptyRow(columns, message) {
    return `
        <tr>
            <td colspan="${columns}" class="empty-row">
                ${safe(message)}
            </td>
        </tr>
    `;
}

function renderAll() {
    renderDrivers();
    renderVehicles();
    renderDashboard();
    renderAllocation();
    renderHistory();
}

// ==========================================
// INITIALIZE WEBSITE
// ==========================================

renderAll();
updateFare();
