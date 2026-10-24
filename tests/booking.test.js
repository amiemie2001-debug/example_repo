const test = require("node:test");
const assert = require("node:assert/strict");
const { ROOMS, daysBetween, datesOverlap, validateReservation, makeReservation, cancelReservation } = require("../booking.js");

const validInput = {
  guestName: "Alex Santos",
  guestContact: "09171234567",
  roomId: "101",
  checkIn: "2026-11-10",
  checkOut: "2026-11-13"
};

test("provides at least five sample rooms", () => {
  assert.ok(ROOMS.length >= 5);
});

test("calculates nights between dates", () => {
  assert.equal(daysBetween("2026-11-10", "2026-11-13"), 3);
  assert.equal(daysBetween("2026-11-10", "2026-11-10"), 0);
});

test("allows a valid reservation and calculates its total", () => {
  const result = makeReservation(validInput, [], 1000);
  assert.equal(result.ok, true);
  assert.equal(result.booking.nights, 3);
  assert.equal(result.booking.total, 3600);
  assert.equal(result.booking.status, "confirmed");
});

test("rejects missing guest information", () => {
  const result = validateReservation({ ...validInput, guestName: " ", guestContact: "" }, []);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.includes("guest name")));
  assert.ok(result.errors.some((error) => error.includes("contact number")));
});

test("rejects checkout on or before check-in", () => {
  const sameDay = validateReservation({ ...validInput, checkOut: validInput.checkIn }, []);
  const reversed = validateReservation({ ...validInput, checkOut: "2026-11-09" }, []);
  assert.equal(sameDay.valid, false);
  assert.equal(reversed.valid, false);
});

test("detects overlapping reservations for the same room", () => {
  const existing = [{ roomId: "101", checkIn: "2026-11-11", checkOut: "2026-11-15", status: "confirmed" }];
  const result = validateReservation(validInput, existing);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.includes("already reserved")));
});

test("allows back-to-back bookings when dates do not overlap", () => {
  assert.equal(datesOverlap("2026-11-10", "2026-11-13", "2026-11-13", "2026-11-15"), false);
  const existing = [{ roomId: "101", checkIn: "2026-11-13", checkOut: "2026-11-15", status: "confirmed" }];
  assert.equal(validateReservation(validInput, existing).valid, true);
});

test("does not block a different room for the same dates", () => {
  const existing = [{ roomId: "102", checkIn: "2026-11-11", checkOut: "2026-11-12", status: "confirmed" }];
  assert.equal(validateReservation(validInput, existing).valid, true);
});

test("cancelled reservations do not block future bookings", () => {
  const existing = [{ roomId: "101", checkIn: "2026-11-11", checkOut: "2026-11-15", status: "cancelled" }];
  assert.equal(validateReservation(validInput, existing).valid, true);
});

test("cancels an active reservation without deleting its history", () => {
  const existing = [{ id: "ST-ONE", status: "confirmed" }];
  const result = cancelReservation(existing, "ST-ONE");
  assert.equal(result.found, true);
  assert.equal(result.reservations[0].status, "cancelled");
  assert.equal(existing[0].status, "confirmed");
});

test("returns not found for an unknown reservation ID", () => {
  const result = cancelReservation([], "missing");
  assert.equal(result.found, false);
  assert.deepEqual(result.reservations, []);
});