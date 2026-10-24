# StayEase — Room Reservation System

A responsive room reservation MVP built with plain HTML, CSS, and JavaScript. It uses browser `localStorage`, so no backend or database setup is required.

## Features

- Browse five sample rooms and nightly rates in Philippine pesos (PHP).
- Enter guest name, contact number, room, check-in date, and check-out date.
- Automatically calculate nights and estimated total.
- Validate required fields and require check-out to be later than check-in.
- Prevent overlapping reservations for the same room.
- View booking references, guest details, room, dates, cost, and status.
- Cancel a reservation without deleting its history.
- Save reservations in the current browser.
- Automated logic tests using Node.js's built-in test runner.

## Sample rooms and rates

| Room | Type | Rate per night |
|---|---|---:|
| 101 — Cozy Single | Single · 1 guest | ₱1,200 |
| 102 — Classic Twin | Twin · 2 guests | ₱1,800 |
| 201 — Garden Deluxe | Deluxe · 2 guests | ₱2,500 |
| 202 — Family Suite | Family · 4 guests | ₱3,500 |
| 301 — Premium View | Premium · 2 guests | ₱4,200 |

These are example rates for this educational project, not real hotel offers.

## Run the app

### Option A — Open directly

1. Download or clone the repository.
2. Open `index.html` in a modern browser.
3. Select a room, complete the form, and confirm a reservation.

### Option B — Visual Studio Code

1. Open this folder in VS Code.
2. If you have the Live Server extension, right-click `index.html`.
3. Select **Open with Live Server**.

### Option C — Local web server

From the project directory, run:

```bash
python -m http.server 8000
```

Open [http://localhost:8000](http://localhost:8000).

## Run the automated tests

The web app does not require Node.js to run. Node.js 18 or later is required only for tests.

```bash
npm test
```

Or run the test file directly:

```bash
node --test tests/booking.test.js
```

## MVP test checklist

| # | Scenario | Expected result |
|---:|---|---|
| 1 | Reserve an available room | Booking is saved and appears in the list |
| 2 | Reserve the same room for overlapping dates | Booking is rejected |
| 3 | Check out on or before check-in | Booking is rejected |
| 4 | Leave guest name or contact blank | Booking is rejected |
| 5 | Book 3 nights at ₱1,200 per night | Total is ₱3,600 |
| 6 | Book a different room for the same dates | Allowed if that room is available |
| 7 | Book on the date another guest checks out | Allowed; checkout day is not an occupied night |
| 8 | Cancel an active reservation | Status changes to Cancelled; record remains |
| 9 | Refresh the page | Saved reservations remain in the same browser |
| 10 | Choose a past check-in date | Date picker prevents dates before today |

Automated tests cover booking rules and validation. Also test the interface and browser storage manually.

## Project structure

```text
example_repo/
├── index.html
├── styles.css
├── booking.js
├── app.js
├── package.json
├── README.md
└── tests/
    └── booking.test.js
```

## Important limitations

- This is a learning/demo MVP, not a production hotel booking platform.
- Reservations are saved only in the current browser profile and origin. They are not shared across devices or users.
- Without a server, simultaneous bookings from separate browsers cannot be coordinated reliably.
- No authentication, payments, email confirmations, or real hotel inventory integration is included.
- Do not enter sensitive or real customer information into this demo.
- Clearing browser site data can erase saved reservations.

## Suggested improvements

- Add a backend API and database for shared reservations.
- Add administrator login and room management.
- Add guest counts, amenities, and room photos.
- Add booking search, editing, and printable confirmations.
- Add server-side validation and concurrency-safe booking checks.

## License

Educational use. Adapt this project for class activities and personal practice.