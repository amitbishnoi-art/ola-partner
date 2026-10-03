# OLA Electric Showroom & Scooty Servicing Platform

A modern, responsive, full-stack web application designed for an authorized **OLA Electric Showroom & Service Hub**. The platform is 100% dynamic and admin-controlled — allowing showroom managers to configure scooters, colors, prices, stock statuses, service bookings, referral benefits, and showroom GPS locations in real-time without modifying code.

---

## 🌟 Key Capabilities & Features

### 1. 🛵 Customer-Facing Showroom Website
- **Dynamic Scooter Catalogue**: Real-time pricing, ex-showroom and on-road prices, battery specs, range, top speed, and color swatches.
- **Stock & Availability Badges**: `Available`, `Limited Stock`, `Sold Out`, `Coming Soon`, and `Discontinued`.
- **Live Location Navigation (Google Maps)**:
  - Users can click **"Navigate from My Live Location (Google Maps)"** on the homepage or contact page.
  - Automatically requests the user's GPS coordinates via the browser Geolocation API (`navigator.geolocation`) and opens Google Maps turn-by-turn driving directions to the configured showroom coordinates.
- **₹501 Complimentary Benefit Program**:
  - Existing purchasers can refer friends/relatives.
  - Generates unique reference tracking IDs (e.g., `REF-XXXX`).
  - Track referral approval and payout status.
- **Test Ride Booking & Inquiries**: Instant booking for test rides with date/time preferences and enquiry submission.
- **Direct WhatsApp Integration**: Floating and in-page buttons pre-configured with the showroom WhatsApp helpline (`8003356163`).

---

### 2. 🔧 Scooty Pre-Booking & Service Hub (`/service`)
- **Pre-Book Service Slot**:
  - Customers can pre-book maintenance or repair at the showroom or nearest service centre.
  - Input: Customer Name, 10-digit Mobile, OLA Scooter Model (S1 Pro Gen 2, S1 Air, S1 X, etc.), Vehicle Registration Number, Service Type, Preferred Date, and Time Slot.
  - **Doorstep Pickup & Drop**: Toggle with complete pickup address input.
  - **Find Nearest Service Centre**: Calculates distance in kilometers from the customer's live GPS location using the Haversine formula.
- **🔍 Track Scooty Service Status & Delivery Time**:
  - Customers can enter their **Booking Reference ID** (e.g. `SRV-2026-0811`) or registered mobile number.
  - **Visual 5-Step Stepper**: `Pending` ➔ `Confirmed` ➔ `In Service` ➔ `Ready for Pickup` ➔ `Completed`.
  - **⏱️ "When will you get your scooty back?"**: Prominent highlight of the **Admin-Assigned Ready / Delivery Time** (e.g. `03:30 PM, 05 Oct 2026`).
  - Technician notes, estimated cost, and one-click Google Maps live navigation to the servicing bay.
- **Near Scooty Centres Directory**:
  - Card view of all authorized regional service points with contact numbers, opening hours, capacity, and direct GPS navigation.

---

### 3. ⚡ Powerful Admin Portal (`/admin`)
- **Showroom Dashboard & Analytics**:
  - Live counts for scooters, pending service pre-bookings, scooters ready for pickup, test rides, enquiries, and referral benefits.
- **Scooter Inventory Control**:
  - Add, edit, and delete scooters.
  - Configure models, variants, prices, range, battery, top speed, charging time, and features.
  - Instant status switches (`Available`, `Limited Stock`, `Sold Out`, `Coming Soon`, `Discontinued`).
  - Multi-color manager with hex code swatches, color-specific stock, and availability.
- **Service Pre-Bookings Management**:
  - View all customer pre-bookings with real-time status badges.
  - Filter by status (`Pending`, `Confirmed`, `In Service`, `Ready for Pickup`, `Completed`, `Cancelled`) or search.
  - **⏱️ Assign Delivery Time**: Admin sets the confirmed appointment time and exact **Estimated Scooty Ready Time** when the customer will get their scooter back.
  - Assign technician name, service bay, estimated cost, and repair remarks.
- **Service Centres Management**:
  - Add, edit, or deactivate regional service centers with name, address, contact, operating hours, capacity, and map coordinates.
- **Customers & Sales Records**:
  - Customer registry with purchase history.
  - "Record Scooter Sale" modal to mark customers as verified purchasers and unlock ₹501 referral eligibility.
- **₹501 Complimentary Referral Benefits Ledger**:
  - View all customer introductions.
  - Step-by-step lead progression (`Introduction Submitted` ➔ `Customer Contacted` ➔ `Purchase Completed`).
  - One-click **"Approve ₹501 Benefit"** and **"Mark as Paid"**.
  - Dynamic program settings (modify title, amount, or enable/disable).
- **Showroom & Live Map Location Settings**:
  - Configure showroom name, address, phone, WhatsApp, email, opening hours, and about text.
  - **📍 "Detect My Current Coordinates"** button: Automatically captures admin's current GPS position to configure showroom destination latitude and longitude.
- **CSV Data Reports**:
  - One-click exports for Services, Scooters, Customers, Sales, and Benefits.
- **Activity Audit Logs**:
  - Chronological audit log of all admin modifications.

---

## 🛠️ Technology Stack

| Layer | Technology | Details |
|---|---|---|
| **Frontend** | Next.js 16 (React 19) | Fast Turbopack build, Server & Client Components, Responsive Design |
| **Styling** | Vanilla CSS Tokens | Dark mode theme with OLA Emerald Green accents, Glassmorphism, Micro-animations |
| **Backend** | Node.js + Express | RESTful API, JWT authentication, CORS enabled |
| **Database** | SQLite via `sql.js` | Zero-dependency pure JavaScript SQLite with automatic disk persistence |
| **Maps & GPS** | HTML5 Geolocation API | Live turn-by-turn routing via Google Maps API |

---

## 🚀 Quick Start Guide

### 1. Backend Server
```bash
cd backend
npm install
node src/seed.js   # Seeds admin account, sample scooters, service centers & sample bookings
node src/server.js # Starts API on http://localhost:4000
```

### 2. Frontend Application
```bash
cd frontend
npm install
npm run dev        # Starts Next.js app on http://localhost:3000
```

---

## 🔑 Default Credentials & Quick Links

- **Customer Website**: [http://localhost:3000](http://localhost:3000)
- **Scooty Service Pre-Booking**: [http://localhost:3000/service](http://localhost:3000/service)
- **Service Tracking Demo**: Search for `SRV-2026-0811` or mobile `9876543210` on the `/service` tracking tab
- **Admin Portal**: [http://localhost:3000/admin](http://localhost:3000/admin)
  - **Email**: `admin@olashowroom.com`
  - **Password**: `admin123`
- **Customer OTP Login**: [http://localhost:3000/login](http://localhost:3000/login) (Enter name & mobile, default dev OTP is displayed on screen)

---

## ⚡ Deploying to Vercel

The application is pre-configured for 1-click deployment on **Vercel** via GitHub:

### Option A: Deploy Full Stack on Vercel (Frontend + Serverless API)
1. Go to [vercel.com](https://vercel.com) and click **"Add New..."** ➔ **"Project"**.
2. Select your imported GitHub repository: `https://github.com/amitbishnoi-art/ola-partner.git`.
3. In the project configuration:
   - **Framework Preset**: Other / Auto-detected
   - **Root Directory**: `./` (leave default)
   - Click **Deploy**.
4. Vercel will build using `vercel.json`, hosting both Next.js frontend pages and the Express Serverless API at `/api/*`.

### Option B: Deploy Frontend with Separate Backend (Recommended for high traffic)
1. In Vercel, click **Import Project** for `amitbishnoi-art/ola-partner`.
2. Under **Root Directory**, click **Edit** and select `frontend`.
3. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_API_URL`: Your live backend URL (e.g., `https://your-backend.onrender.com/api` or `https://your-app.vercel.app/api`).
4. Click **Deploy**.

