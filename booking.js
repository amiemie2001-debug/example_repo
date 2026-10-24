(function (root) {
  "use strict";

  const ROOMS = [
    { id: "101", name: "Cozy Single", type: "Single room · 1 guest", price: 1200, symbol: "🛏️" },
    { id: "102", name: "Classic Twin", type: "Twin room · 2 guests", price: 1800, symbol: "🛌" },
    { id: "201", name: "Garden Deluxe", type: "Deluxe room · 2 guests", price: 2500, symbol: "🌿" },
    { id: "202", name: "Family Suite", type: "Family suite · 4 guests", price: 3500, symbol: "🏡" },
    { id: "301", name: "Premium View", type: "Premium room · 2 guests", price: 4200, symbol: "🌅" }
  ];

  function daysBetween(checkIn, checkOut) {
    const start = Date.parse(checkIn + "T00:00:00Z");
    const end = Date.parse(checkOut + "T00:00:00Z");
    if (!Number.isFinite(start) || !Number.isFinite(end)) return 0;
    return Math.round((end - start) / 86400000);
  }

  function datesOverlap(aStart, aEnd, bStart, bEnd) {
    return aStart < bEnd && bStart < aEnd;
  }

  function validateReservation(input, reservations) {
    const errors = [];
    const guestName = String(input.guestName || "").trim();
    const guestContact = String(input.guestContact || "").trim();
    const roomId = String(input.roomId || "");
    const checkIn = String(input.checkIn || "");
    const checkOut = String(input.checkOut || "");
    const room = ROOMS.find((item) => item.id === roomId);

    if (!guestName) errors.push("Please enter the guest name.");
    if (!guestContact) errors.push("Please enter a contact number.");
    if (!room) errors.push("Please choose a valid room.");
    if (!checkIn || !checkOut) errors.push("Please select both check-in and check-out dates.");
    if (checkIn && checkOut && daysBetween(checkIn, checkOut) <= 0) {
      errors.push("Check-out must be later than check-in.");
    }
    if (room && checkIn && checkOut && daysBetween(checkIn, checkOut) > 0) {
      const collision = (reservations || []).some((reservation) =>
        reservation.roomId === roomId &&
        reservation.status !== "cancelled" &&
        datesOverlap(checkIn, checkOut, reservation.checkIn, reservation.checkOut)
      );
      if (collision) errors.push("This room is already reserved for some or all of those dates. Please choose another room or date.");
    }

    return { valid: errors.length === 0, errors, room, nights: daysBetween(checkIn, checkOut) };
  }

  function makeReservation(input, reservations, now) {
    const validation = validateReservation(input, reservations);
    if (!validation.valid) return { ok: false, errors: validation.errors };

    const booking = {
      id: "ST-" + (now || Date.now()).toString(36).toUpperCase() + "-" + Math.random().toString(36).slice(2, 6).toUpperCase(),
      guestName: String(input.guestName).trim(),
      guestContact: String(input.guestContact).trim(),
      roomId: String(input.roomId),
      roomName: validation.room.name,
      checkIn: String(input.checkIn),
      checkOut: String(input.checkOut),
      nights: validation.nights,
      total: validation.nights * validation.room.price,
      status: "confirmed",
      createdAt: new Date(now || Date.now()).toISOString()
    };
    return { ok: true, booking };
  }

  function cancelReservation(reservations, id) {
    let found = false;
    const updated = (reservations || []).map((reservation) => {
      if (reservation.id !== id || reservation.status === "cancelled") return reservation;
      found = true;
      return { ...reservation, status: "cancelled" };
    });
    return { found, reservations: updated };
  }

  const api = { ROOMS, daysBetween, datesOverlap, validateReservation, makeReservation, cancelReservation };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.RoomBooking = api;
})(typeof globalThis !== "undefined" ? globalThis : this);