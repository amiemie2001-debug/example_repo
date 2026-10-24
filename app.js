(function () {
  "use strict";
  const { ROOMS, daysBetween, makeReservation, cancelReservation } = window.RoomBooking;
  const STORAGE_KEY = "stayease-reservations-v1";
  const $ = (id) => document.getElementById(id);
  const form = $("reservation-form");
  const roomList = $("room-list");
  const roomSelect = $("room-select");
  const checkInInput = $("check-in");
  const checkOutInput = $("check-out");
  const message = $("form-message");
  let reservations = loadReservations();

  function loadReservations() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(value) ? value : [];
    } catch (error) {
      return [];
    }
  }

  function saveReservations() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reservations));
      return true;
    } catch (error) {
      showMessage("Could not save to browser storage. Check your browser settings and try again.", "error");
      return false;
    }
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[character]);
  }

  function money(value) {
    return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 2 }).format(value);
  }

  function displayDate(value) {
    if (!value) return "";
    const parts = value.split("-").map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2]).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
  }

  function showMessage(text, type) {
    message.textContent = text;
    message.className = "message " + type;
    message.hidden = false;
  }

  function clearMessage() {
    message.hidden = true;
    message.textContent = "";
  }

  function renderRooms() {
    roomList.innerHTML = ROOMS.map((room) => `
      <article class="room-card">
        <div class="room-visual"><span class="room-symbol" aria-hidden="true">${room.symbol}</span><span class="room-number">ROOM ${room.id}</span></div>
        <div class="room-info"><h3>${room.name}</h3><p class="room-description">${room.type}</p>
          <div class="room-bottom"><span class="price">${money(room.price)} <small>/ night</small></span><button class="button button-secondary" type="button" data-select-room="${room.id}">Select room</button></div>
        </div>
      </article>`).join("");

    roomSelect.innerHTML = '<option value="">Choose a room</option>' + ROOMS.map((room) =>
      `<option value="${room.id}">Room ${room.id} — ${room.name} (${money(room.price)}/night)</option>`
    ).join("");
  }

  function renderReservations() {
    const activeCount = reservations.filter((item) => item.status !== "cancelled").length;
    $("reservation-count").textContent = String(reservations.length);
    if (reservations.length === 0) {
      $("reservation-list").innerHTML = '<div class="empty-state">No reservations yet.<br>Choose a room and book your first stay.</div>';
      return;
    }
    const sorted = [...reservations].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    $("reservation-list").innerHTML = sorted.map((booking) => {
      const cancelled = booking.status === "cancelled";
      return `<article class="booking-card">
        <div class="booking-top"><div><h3 class="booking-name">${escapeHtml(booking.guestName)}</h3><p class="booking-meta">Ref: ${escapeHtml(booking.id)}<br>Room ${escapeHtml(booking.roomId)} · ${escapeHtml(booking.roomName)}</p></div><span class="status-pill" style="${cancelled ? 'background:#f0f0f0;color:#6b7470' : ''}">${cancelled ? "Cancelled" : "Confirmed"}</span></div>
        <div class="booking-bottom"><div class="booking-dates">${displayDate(booking.checkIn)} → ${displayDate(booking.checkOut)}<br>${booking.nights} night(s)</div><strong class="booking-price">${money(booking.total)}</strong></div>
        ${cancelled ? "" : `<div class="booking-actions"><button class="button button-danger" type="button" data-cancel-booking="${escapeHtml(booking.id)}">Cancel reservation</button></div>`}
      </article>`;
    }).join("");
  }

  function updateEstimate() {
    const room = ROOMS.find((item) => item.id === roomSelect.value);
    const nights = daysBetween(checkInInput.value, checkOutInput.value);
    if (!room || nights <= 0) {
      $("total-cost").textContent = money(0);
      $("night-count").textContent = "Choose your dates";
      return;
    }
    $("total-cost").textContent = money(room.price * nights);
    $("night-count").textContent = nights + (nights === 1 ? " night" : " nights");
  }

  function setDateMinimums() {
    const today = new Date();
    const localToday = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, "0") + "-" + String(today.getDate()).padStart(2, "0");
    checkInInput.min = localToday;
    checkOutInput.min = checkInInput.value || localToday;
  }

  roomList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-select-room]");
    if (!button) return;
    roomSelect.value = button.dataset.selectRoom;
    updateEstimate();
    $("reservation-heading").scrollIntoView({ behavior: "smooth", block: "center" });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    clearMessage();
    const input = {
      guestName: $("guest-name").value,
      guestContact: $("guest-contact").value,
      roomId: roomSelect.value,
      checkIn: checkInInput.value,
      checkOut: checkOutInput.value
    };
    const result = makeReservation(input, reservations);
    if (!result.ok) {
      showMessage(result.errors.join(" "), "error");
      return;
    }
    reservations = [result.booking, ...reservations];
    if (!saveReservations()) {
      reservations = reservations.filter((item) => item.id !== result.booking.id);
      renderReservations();
      return;
    }
    form.reset();
    setDateMinimums();
    updateEstimate();
    renderReservations();
    showMessage("Reservation confirmed! Reference: " + result.booking.id, "success");
  });

  $("reservation-list").addEventListener("click", (event) => {
    const button = event.target.closest("[data-cancel-booking]");
    if (!button) return;
    const booking = reservations.find((item) => item.id === button.dataset.cancelBooking);
    if (!booking || booking.status === "cancelled") return;
    if (!window.confirm("Cancel reservation " + booking.id + "?")) return;
    const result = cancelReservation(reservations, booking.id);
    if (!result.found) return;
    const previous = reservations;
    reservations = result.reservations;
    if (!saveReservations()) {
      reservations = previous;
      return;
    }
    renderReservations();
    showMessage("Reservation " + booking.id + " has been cancelled.", "success");
  });

  roomSelect.addEventListener("change", updateEstimate);
  checkInInput.addEventListener("change", () => {
    setDateMinimums();
    if (checkOutInput.value && checkOutInput.value <= checkInInput.value) checkOutInput.value = "";
    updateEstimate();
  });
  checkOutInput.addEventListener("change", updateEstimate);

  renderRooms();
  setDateMinimums();
  updateEstimate();
  renderReservations();
})();