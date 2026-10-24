
"use strict";

/* ==========================================
   DROPLY 2.0
   Interactive logistics dashboard prototype
   No real bookings, payments or GPS.
========================================== */

const STORAGE_KEY = "droplyBookings";
const LEGACY_KEY = "droplyBookings";

const VEHICLES = {
  ute: {
    name: "Ute / Small Truck",
    capacity: "Up to 1 pallet",
    base: 35,
    perKm: 2,
    icon: "🛻"
  },
  medium: {
    name: "Medium Truck",
    capacity: "Up to 8 pallets",
    base: 65,
    perKm: 3.5,
    icon: "🚚"
  },
  large: {
    name: "Large Truck",
    capacity: "Heavy freight",
    base: 110,
    perKm: 5,
    icon: "🚛"
  }
};

const STATUS_STEPS = [
  "Requested",
  "Driver Assigned",
  "Picked Up",
  "Delivered"
];

let bookings = [];
let selectedVehicle = "ute";
let selectedBookingId = null;
let dashboardFilter = "all";
let toastTimeout = null;

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function money(amount) {
  const value = Number(amount);

  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 2
  }).format(Number.isFinite(value) ? value : 0);
}

function generateId() {
  if (window.crypto && crypto.randomUUID) {
    return "DRP-" + crypto.randomUUID().slice(0, 8).toUpperCase();
  }

  return "DRP-" + Date.now() +
    "-" + Math.random().toString(36).slice(2, 6);
}

function safeStatus(status, progress) {
  const step = Math.max(0, Math.min(3, Number(progress) || 0));

  if (STATUS_STEPS.includes(status)) {
    return status;
  }

  return STATUS_STEPS[step];
}

function normalizeBooking(raw) {
  if (!raw || typeof raw !== "object") return null;

  const progress = Math.max(
    0,
    Math.min(3, Number(raw.progress) || 0)
  );

  const vehicle = VEHICLES[raw.vehicle]
    ? raw.vehicle
    : "ute";

  return {
    id: String(raw.id || generateId()),
    pickup: String(raw.pickup || "Unknown pickup"),
    dropoff: String(raw.dropoff || "Unknown destination"),
    type: String(raw.type || raw.cargoType || "Freight"),
    cargoNotes: String(raw.cargoNotes || ""),
    distance: Number(raw.distance) || 0,
    vehicle,
    price: Number(raw.price) || 0,
    timing: String(raw.timing || "ASAP"),
    progress,
    status: safeStatus(raw.status, progress),
    created: String(raw.created || new Date().toLocaleString("en-AU"))
  };
}

function loadBookings() {
  try {
    const stored = JSON.parse(localStorage.getItem(LEGACY_KEY));

    if (!Array.isArray(stored)) {
      bookings = [];
      return;
    }

    bookings = stored
      .map(normalizeBooking)
      .filter(Boolean);

  } catch (error) {
    bookings = [];
    console.warn("Could not load saved bookings:", error);
  }
}

function saveBookings() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
    return true;
  } catch (error) {
    showToast("Could not save bookings on this device.");
    return false;
  }
}

/* ==========================================
   NAVIGATION
========================================== */

const PAGE_NAMES = {
  dashboard: "Dashboard",
  deliveries: "Deliveries",
  tracking: "Tracking",
  book: "New Delivery",
  drivers: "Drivers",
  messages: "Messages",
  payments: "Payments",
  settings: "Settings"
};

function showPage(pageName) {
  const target = document.getElementById(pageName);

  if (!target || !target.classList.contains("page")) {
    return;
  }

  $$(".page").forEach(page => {
    page.classList.toggle("active", page.id === pageName);
  });

  $$("[data-page]").forEach(button => {
    const active = button.dataset.page === pageName;

    if (
      button.classList.contains("nav-link") ||
      button.classList.contains("mobile-nav-link")
    ) {
      button.classList.toggle("active", active);

      if (active) {
        button.setAttribute("aria-current", "page");
      } else {
        button.removeAttribute("aria-current");
      }
    }
  });

  const breadcrumb = $("#breadcrumb");

  if (breadcrumb) {
    breadcrumb.textContent = PAGE_NAMES[pageName] || "Dashboard";
  }

  refreshPage(pageName);

  window.scrollTo({
    top: 0,
    behavior: "instant"
  });
}

function setupNavigation() {
  $$("[data-page]").forEach(element => {
    element.addEventListener("click", event => {
      event.preventDefault();
      showPage(element.dataset.page);
    });
  });
}

/* ==========================================
   TOAST NOTIFICATIONS
========================================== */

function showToast(message) {
  const toast = $("#toast");

  if (!toast) {
    console.log(message);
    return;
  }

  clearTimeout(toastTimeout);

  toast.textContent = message;
  toast.classList.add("show");

  toastTimeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 3500);
}

function setupNotifications() {
  const button = $("#notificationBtn");

  if (button) {
    button.addEventListener("click", () => {
      showToast("You're all caught up. No new demo notifications.");
    });
  }
}

/* ==========================================
   DELIVERY PRICING
========================================== */

function calculatePrice() {
  const distance = Number($("#distance")?.value || 0);
  const vehicle = VEHICLES[selectedVehicle];

  if (
    !vehicle ||
    !Number.isFinite(distance) ||
    distance <= 0 ||
    distance > 2000
  ) {
    if ($("#estimatePrice")) {
      $("#estimatePrice").textContent = money(0);
    }
    return 0;
  }

  const total = vehicle.base + distance * vehicle.perKm;

  if ($("#estimatePrice")) {
    $("#estimatePrice").textContent = money(total);
  }

  return total;
}

function selectVehicle(vehicleId) {
  if (!VEHICLES[vehicleId]) return;

  selectedVehicle = vehicleId;

  $$(".vehicle-option").forEach(option => {
    const selected = option.dataset.vehicle === vehicleId;

    option.classList.toggle("selected", selected);
    option.setAttribute("aria-pressed", String(selected));
  });

  calculatePrice();
}

function setupBookingForm() {
  $$(".vehicle-option").forEach(option => {
    option.addEventListener("click", () => {
      selectVehicle(option.dataset.vehicle);
    });
  });

  $("#distance")?.addEventListener("input", calculatePrice);

  $("#bookingForm")?.addEventListener("submit", event => {
    event.preventDefault();
    createBooking();
  });

  selectVehicle("ute");
}

/* ==========================================
   CREATE DELIVERY
========================================== */

function createBooking() {
  const pickup = $("#pickup").value.trim();
  const dropoff = $("#dropoff").value.trim();
  const distance = Number($("#distance").value);
  const cargoType = $("#cargoType").value;
  const cargoNotes = $("#cargoNotes").value.trim();
  const timing = $("#deliveryTime").value;

  if (!pickup || !dropoff) {
    showToast("Enter both pickup and delivery addresses.");
    return;
  }

  if (
    !Number.isFinite(distance) ||
    distance < 1 ||
    distance > 2000
  ) {
    showToast("Enter a distance between 1 and 2000 km.");
    return;
  }

  const price = calculatePrice();

  const booking = {
    id: generateId(),
    pickup,
    dropoff,
    type: cargoType,
    cargoNotes,
    distance,
    vehicle: selectedVehicle,
    price,
    timing,
    progress: 0,
    status: "Requested",
    created: new Date().toLocaleString("en-AU")
  };

  bookings.unshift(booking);
  selectedBookingId = booking.id;

  saveBookings();

  $("#bookingForm").reset();
  selectVehicle("ute");

  showToast("Demo delivery request created successfully.");
  showPage("deliveries");
}

/* ==========================================
   DASHBOARD STATISTICS
========================================== */

function updateStats() {
  const total = bookings.length;

  const completed = bookings.filter(
    booking => booking.progress === 3
  ).length;

  const active = bookings.filter(
    booking => booking.progress > 0 && booking.progress < 3
  ).length;

  const spend = bookings.reduce(
    (sum, booking) => sum + booking.price,
    0
  );

  $("#statTotal").textContent = total;
  $("#statActive").textContent = active;
  $("#statCompleted").textContent = completed;
  $("#statSpend").textContent = money(spend);

  if ($("#availableJobsCount")) {
    $("#availableJobsCount").textContent =
      bookings.filter(b => b.progress === 0).length;
  }

  if ($("#assignedJobsCount")) {
    $("#assignedJobsCount").textContent =
      bookings.filter(b => b.progress === 1).length;
  }
}

/* ==========================================
   DELIVERY STATUS
========================================== */

function statusClass(booking) {
  if (booking.progress === 3) return "completed";
  if (booking.progress > 0) return "active";
  return "";
}

function getSelectedBooking() {
  return bookings.find(b => b.id === selectedBookingId)
    || bookings[0]
    || null;
}

function selectBooking(id) {
  if (!bookings.some(b => b.id === id)) return;

  selectedBookingId = id;

  renderDashboard();
  showPage("tracking");
}

function deliveryCard(booking) {
  const safeId = escapeHTML(booking.id);
  const vehicle = VEHICLES[booking.vehicle];

  return `
    <article class="delivery-card ${
      booking.id === selectedBookingId ? "selected" : ""
    }">
      <div class="delivery-card-top">
        <h3>${escapeHTML(booking.type)} Delivery</h3>
        <span class="status ${statusClass(booking)}">
          ${escapeHTML(booking.status)}
        </span>
      </div>

      <p>
        <strong>Pickup:</strong> ${escapeHTML(booking.pickup)}
        <br>
        <strong>Drop-off:</strong> ${escapeHTML(booking.dropoff)}
      </p>

      <p>
        ${escapeHTML(vehicle.name)}
        · ${escapeHTML(String(booking.distance))} km
      </p>

      <div class="delivery-card-footer">
        <strong>${money(booking.price)}</strong>
        <button type="button"
          data-track-id="${safeId}">
          View Details →
        </button>
      </div>
    </article>
  `;
}

function emptyState(title, description, buttonText) {
  return `
    <div class="empty-state">
      <div class="empty-icon">▤</div>
      <h2>${escapeHTML(title)}</h2>
      <p>${escapeHTML(description)}</p>
      ${buttonText ? `
        <button class="primary-button" data-page="book">
          ${escapeHTML(buttonText)}
        </button>
      ` : ""}
    </div>
  `;
}

function bindDynamicActions(container) {
  if (!container) return;

  container.querySelectorAll("[data-track-id]").forEach(button => {
    button.addEventListener("click", () => {
      selectBooking(button.dataset.trackId);
    });
  });

  container.querySelectorAll("[data-page]").forEach(button => {
    button.addEventListener("click", () => {
      showPage(button.dataset.page);
    });
  });
}

/* ==========================================
   DASHBOARD FILTERS
========================================== */

function filteredBookings() {
  if (dashboardFilter === "completed") {
    return bookings.filter(b => b.progress === 3);
  }

  if (dashboardFilter === "active") {
    return bookings.filter(b => b.progress > 0 && b.progress < 3);
  }

  return bookings;
}

function setupFilters() {
  $$("#dashboardFilters .filter").forEach(button => {
    button.addEventListener("click", () => {
      dashboardFilter = button.dataset.filter;

      $$("#dashboardFilters .filter").forEach(filter => {
        filter.classList.toggle(
          "active",
          filter.dataset.filter === dashboardFilter
        );
      });

      renderDashboard();
    });
  });
}

/* ==========================================
   DASHBOARD
========================================== */

function renderDashboard() {
  updateStats();

  const container = $("#recentDeliveries");

  if (container) {
    const visible = filteredBookings().slice(0, 5);

    container.innerHTML = visible.length
      ? visible.map(deliveryCard).join("")
      : emptyState(
          "No deliveries to display",
          dashboardFilter === "all"
            ? "Create your first demo delivery request."
            : "No deliveries match this filter.",
          dashboardFilter === "all" ? "Book a Delivery" : ""
        );

    bindDynamicActions(container);
  }

  renderOverview();
}

function renderOverview() {
  const booking = getSelectedBooking();
  const details = $("#overviewDetails");

  if (!details) return;

  if (!booking) {
    $("#overviewVehicle").textContent = "No vehicle selected";
    $("#overviewCapacity").textContent = "—";

    details.innerHTML = `
      <p>No deliveries yet. Create a demo booking to view details.</p>
    `;

    return;
  }

  const vehicle = VEHICLES[booking.vehicle];

  $("#overviewVehicle").textContent = vehicle.name;
  $("#overviewCapacity").textContent = vehicle.capacity;

  details.innerHTML = `
    <div class="detail-row">
      <span>Reference</span>
      <strong>${escapeHTML(booking.id)}</strong>
    </div>
    <div class="detail-row">
      <span>Status</span>
      <strong>${escapeHTML(booking.status)}</strong>
    </div>
    <div class="detail-row">
      <span>Distance</span>
      <strong>${escapeHTML(String(booking.distance))} km</strong>
    </div>
    <div class="detail-row">
      <span>Estimated Price</span>
      <strong>${money(booking.price)}</strong>
    </div>
  `;
}

/* ==========================================
   ALL DELIVERIES
========================================== */

function renderDeliveries() {
  const container = $("#allDeliveries");

  if (!container) return;

  $("#deliveryCount").textContent =
    bookings.length + (bookings.length === 1 ? " request" : " requests");

  container.innerHTML = bookings.length
    ? bookings.map(deliveryCard).join("")
    : emptyState(
        "No deliveries yet",
        "Your delivery requests will appear here.",
        "Book Your First Delivery"
      );

  bindDynamicActions(container);
}

/* ==========================================
   TRACKING SIMULATION
========================================== */

function renderTracking() {
  const container = $("#trackingDetails");

  if (!container) return;

  const booking = getSelectedBooking();

  if (!booking) {
    container.innerHTML = emptyState(
      "No delivery selected",
      "Create a delivery to try the tracking demonstration.",
      "Book a Delivery"
    );

    bindDynamicActions(container);
    return;
  }

  const vehicle = VEHICLES[booking.vehicle];

  container.innerHTML = `
    <div class="detail-row">
      <span>Delivery ID</span>
      <strong>${escapeHTML(booking.id)}</strong>
    </div>

    <div class="detail-row">
      <span>Pickup</span>
      <strong>${escapeHTML(booking.pickup)}</strong>
    </div>

    <div class="detail-row">
      <span>Destination</span>
      <strong>${escapeHTML(booking.dropoff)}</strong>
    </div>

    <div class="detail-row">
      <span>Vehicle</span>
      <strong>${escapeHTML(vehicle.name)}</strong>
    </div>

    <div class="detail-row">
      <span>Price Estimate</span>
      <strong>${money(booking.price)}</strong>
    </div>

    <h3 style="margin-top:25px">Delivery Progress</h3>

    <div class="progress-steps">
      ${STATUS_STEPS.map((step, index) => `
        <div class="progress-step ${
          index <= booking.progress ? "done" : ""
        }">
          <span class="step-dot"></span>
          <span>${escapeHTML(step)}</span>
        </div>
      `).join("")}
    </div>

    <p>
      This is simulated tracking. No GPS or real truck is connected.
    </p>

    ${booking.progress < 3 ? `
      <button class="primary-button full-width"
        id="advanceDemoBtn">
        Simulate Next Delivery Step →
      </button>
    ` : `
      <div class="status completed">
        ✓ Demo delivery completed
      </div>
    `}
  `;

  $("#advanceDemoBtn")?.addEventListener("click", advanceDelivery);
}

function advanceDelivery() {
  const booking = getSelectedBooking();

  if (!booking || booking.progress >= 3) return;

  booking.progress += 1;
  booking.status = STATUS_STEPS[booking.progress];

  saveBookings();
  renderTracking();
  updateStats();

  showToast("Demo status updated: " + booking.status);
}

/* ==========================================
   DRIVER DASHBOARD
========================================== */

function renderDriverJobs() {
  updateStats();

  const container = $("#driverJobs");
  if (!container) return;

  const available = bookings.filter(b => b.progress === 0);

  if (!available.length) {
    container.innerHTML = emptyState(
      "No available jobs",
      "Create a demo delivery request to test the driver portal.",
      "Create Demo Request"
    );

    bindDynamicActions(container);
    return;
  }

  container.innerHTML = available.map(booking => {
    const vehicle = VEHICLES[booking.vehicle];

    return `
      <article class="job-card">
        <h3>${escapeHTML(booking.type)} Delivery</h3>

        <p>
          <strong>Pickup:</strong> ${escapeHTML(booking.pickup)}
          <br>
          <strong>Drop-off:</strong> ${escapeHTML(booking.dropoff)}
        </p>

        <p>
          ${escapeHTML(vehicle.name)}
          · ${escapeHTML(String(booking.distance))} km
        </p>

        <div class="job-card-footer">
          <strong>${money(booking.price)}</strong>

          <button type="button"
            data-accept-id="${escapeHTML(booking.id)}">
            Accept Demo Job
          </button>
        </div>
      </article>
    `;
  }).join("");

  container.querySelectorAll("[data-accept-id]").forEach(button => {
    button.addEventListener("click", () => {
      acceptJob(button.dataset.acceptId);
    });
  });
}

function acceptJob(id) {
  const booking = bookings.find(b => b.id === id);

  if (!booking || booking.progress !== 0) return;

  booking.progress = 1;
  booking.status = "Driver Assigned";
  selectedBookingId = id;

  saveBookings();

  showToast("Demo job accepted.");
  showPage("tracking");
}

/* ==========================================
   PAYMENT ESTIMATE HISTORY
========================================== */

function renderPayments() {
  const container = $("#paymentHistory");

  if (!container) return;

  if (!bookings.length) {
    container.innerHTML = emptyState(
      "No payment estimates",
      "Your estimated delivery costs will appear here.",
      ""
    );
    return;
  }

  container.innerHTML = bookings.map(booking => `
    <div class="detail-row">
      <span>
        ${escapeHTML(booking.type)} Delivery
        <br>
        <small>${escapeHTML(booking.id)}</small>
      </span>
      <strong>${money(booking.price)}</strong>
    </div>
  `).join("");
}

/* ==========================================
   RESET DEMO DATA
========================================== */

function setupReset() {
  $("#resetDemoBtn")?.addEventListener("click", () => {
    const confirmed = confirm(
      "Delete all demo bookings saved in this browser?"
    );

    if (!confirmed) return;

    bookings = [];
    selectedBookingId = null;

    saveBookings();
    showPage("dashboard");

    showToast("Demo bookings cleared.");
  });
}

/* ==========================================
   REFRESH PAGE CONTENT
========================================== */

function refreshPage(pageName) {
  switch (pageName) {
    case "dashboard":
      renderDashboard();
      break;

    case "deliveries":
      renderDeliveries();
      break;

    case "tracking":
      renderTracking();
      break;

    case "drivers":
      renderDriverJobs();
      break;

    case "payments":
      renderPayments();
      break;

    case "book":
      calculatePrice();
      break;
  }
}

/* ==========================================
   INITIALIZE APPLICATION
========================================== */

function initializeDroply() {
  loadBookings();

  if (bookings.length) {
    selectedBookingId = bookings[0].id;
  }

  setupNavigation();
  setupNotifications();
  setupBookingForm();
  setupFilters();
  setupReset();

  renderDashboard();

  console.log("Droply 2.0 prototype initialized.");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeDroply);
} else {
  initializeDroply();
}
