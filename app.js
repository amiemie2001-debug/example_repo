(function () {
  "use strict";
  const { ROOMS, daysBetween, makeReservation, cancelReservation } = window.RoomBooking;
  const STORAGE_KEY = "stayease-reservations-v1";
  const HISTORY_KEY = "stayease-activity-history-v1";
  const $ = (id) => document.getElementById(id);
  const form = $("reservation-form");
  const roomList = $("room-list");
  const roomSelect = $("room-select");
  const checkInInput = $("check-in");
  const checkOutInput = $("check-out");
  const message = $("form-message");
  let reservations = loadArray(STORAGE_KEY);
  let history = loadArray(HISTORY_KEY);

  function loadArray(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(value) ? value : [];
    } catch (error) {
      return [];
    }
  }

  function saveData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reservations));
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
      return true;
    } catch (error) {
      showMessage("Could not save to browser storage. Check your browser settings and try again.", "error");
      return false;
    }
  }

  function logActivity(booking, action, details) {
    history.unshift({
      id: "EV-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).slice(2, 6).toUpperCase(),
      bookingId: booking.id,
      guestName: booking.guestName,
      roomId: booking.roomId,
      roomName: booking.roomName,
      action,
      details: details || "",
      timestamp: new Date().toISOString()
    });
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, (character) => ({
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

  function displayTimestamp(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Date unavailable";
    return date.toLocaleString("en-PH", { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
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
    $("reservation-count").textContent = String(reservations.length);
    if (reservations.length === 0) {
      $("reservation-list").innerHTML = '<div class="empty-state">No reservations yet.<br>Choose a room and book your first stay.</div>';
      return;
    }
    const sorted = [...reservations].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    $("reservation-list").innerHTML = sorted.map((booking) => {
      const status = booking.status || "confirmed";
      const cancelled = status === "cancelled";
      const statusLabel = status === "checked-in" ? "Checked in" : status === "checked-out" ? "Checked out" : cancelled ? "Cancelled" : "Confirmed";
      const statusClass = status === "checked-in" ? "status-checked-in" : status === "checked-out" ? "status-checked-out" : cancelled ? "status-cancelled" : "";
      let actions = "";
      if (status === "confirmed") {
        actions = `<button class="button button-secondary" type="button" data-check-in="${escapeHtml(booking.id)}">Check in</button>
          <button class="button button-danger" type="button" data-cancel-booking="${escapeHtml(booking.id)}">Cancel reservation</button>`;
      } else if (status === "checked-in") {
        actions = `<button class="button button-primary" type="button" data-check-out="${escapeHtml(booking.id)}">Check out</button>`;
      }
      return `<article class="booking-card">
        <div class="booking-top"><div><h3 class="booking-name">${escapeHtml(booking.guestName)}</h3><p class="booking-meta">Ref: ${escapeHtml(booking.id)}<br>Room ${escapeHtml(booking.roomId)} · ${escapeHtml(booking.roomName)}</p></div><span class="status-pill ${statusClass}">${statusLabel}</span></div>
        <div class="booking-bottom"><div class="booking-dates">${displayDate(booking.checkIn)} → ${displayDate(booking.checkOut)}<br>${booking.nights} night(s)</div><strong class="booking-price">${money(booking.total)}</strong></div>
        ${actions ? `<div class="booking-actions">${actions}</div>` : ""}
      </article>`;
    }).join("");
  }

  function renderHistory() {
    $("history-count").textContent = String(history.length);
    if (history.length === 0) {
      $("activity-history").innerHTML = '<div class="empty-state">No activity recorded yet. New reservations and check-in/check-out actions will appear here.</div>';
      return;
    }
    $("activity-history").innerHTML = history.map((entry) => {
      const labels = {
        reserved: "Reservation created",
        "checked-in": "Guest checked in",
        "checked-out": "Guest checked out",
        cancelled: "Reservation cancelled"
      };
      return `<article class="history-entry">
        <span class="history-dot" aria-hidden="true"></span>
        <div class="history-entry-content">
          <div class="history-entry-top"><strong>${escapeHtml(labels[entry.action] || entry.action)}</strong><time>${escapeHtml(displayTimestamp(entry.timestamp))}</time></div>
          <p><strong>${escapeHtml(entry.guestName)}</strong> · Room ${escapeHtml(entry.roomId)} — ${escapeHtml(entry.roomName)}</p>
          <p class="history-reference">Booking ref: ${escapeHtml(entry.bookingId)}</p>
          ${entry.details ? `<p class="history-details">${escapeHtml(entry.details)}</p>` : ""}
        </div>
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

  function updateBookingStatus(id, nextStatus, action, messageText) {
    const booking = reservations.find((item) => item.id === id);
    if (!booking) return;
    const allowed = (booking.status || "confirmed") === "confirmed" && ["checked-in", "cancelled"].includes(nextStatus)
      || booking.status === "checked-in" && nextStatus === "checked-out";
    if (!allowed) return;
    const previousReservations = reservations;
    const previousHistory = history;
    reservations = reservations.map((item) => item.id === id ? { ...item, status: nextStatus, [action + "At"]: new Date().toISOString() } : item);
    logActivity(booking, action, nextStatus === "checked-in" ? "Check-in recorded." : nextStatus === "checked-out" ? "Check-out recorded." : "Reservation cancelled.");
    if (!saveData()) {
      reservations = previousReservations;
      history = previousHistory;
      return;
    }
    renderReservations();
    renderHistory();
    showMessage(messageText, "success");
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
    const previousReservations = reservations;
    const previousHistory = history;
    reservations = [result.booking, ...reservations];
    logActivity(result.booking, "reserved", "Reservation confirmed for " + result.booking.nights + " night(s).");
    if (!saveData()) {
      reservations = previousReservations;
      history = previousHistory;
      renderReservations();
      renderHistory();
      return;
    }
    form.reset();
    setDateMinimums();
    updateEstimate();
    renderReservations();
    renderHistory();
    showMessage("Reservation confirmed! Reference: " + result.booking.id, "success");
  });

  $("reservation-list").addEventListener("click", (event) => {
    const checkInButton = event.target.closest("[data-check-in]");
    if (checkInButton) {
      updateBookingStatus(checkInButton.dataset.checkIn, "checked-in", "checked-in", "Guest checked in successfully.");
      return;
    }
    const checkOutButton = event.target.closest("[data-check-out]");
    if (checkOutButton) {
      updateBookingStatus(checkOutButton.dataset.checkOut, "checked-out", "checked-out", "Guest checked out successfully.");
      return;
    }
    const cancelButton = event.target.closest("[data-cancel-booking]");
    if (!cancelButton) return;
    const booking = reservations.find((item) => item.id === cancelButton.dataset.cancelBooking);
    if (!booking || (booking.status || "confirmed") !== "confirmed") return;
    if (!window.confirm("Cancel reservation " + booking.id + "?")) return;
    updateBookingStatus(booking.id, "cancelled", "cancelled", "Reservation " + booking.id + " has been cancelled.");
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
  renderHistory();
})();