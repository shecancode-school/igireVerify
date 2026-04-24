# IgireVerify - Professional Attendance Tracking System

IgireVerify is a state-of-the-art attendance management platform designed for **Igire Rwanda Organisation**. It ensures high-integrity attendance records by combining **Geolocation Verification** and **Facial Identity Verification**.

---

## 🚀 Key Features

### 1. Geofence Protection
*   **Logic**: Users can only record attendance if they are physically within **100 meters** of the Igire Rwanda premises.
*   **Tech**: Uses the browser's Geolocation API to calculate distance using the Haversine formula.
*   **Coordinates**: Fixed at Igire Rwanda Headquarters (`-1.9305, 30.0747`).
*   **Code Location**: `src/app/dashboard/participant/attendance/checkin/page.tsx` (`handleVerifyLocation` function).

### 2. Facial Identity Verification
*   **Logic**: Every check-in/out requires a live photo capture.
*   **Storage**: Photos are securely uploaded to **Cloudinary** with program-specific organization.
*   **Prevention**: Discourages proxy attendance (one user checking in for another).

### 3. Real-Time Monitoring
*   **Socket.io**: The Admin and HR dashboards update instantly when a participant checks in.
*   **Live Stats**: Instant breakdown of "On-Time", "Late", and "Absent" statuses.

### 4. Smart Scheduling
*   **Time Windows**: Check-ins are only allowed during specific windows (e.g., 08:00 - 08:30).
*   **Timezone Aware**: Handles Kigali time (`Africa/Kigali`) strictly, preventing client-side clock manipulation.
*   **Logic File**: `src/lib/attendance-rules.ts`.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js 15 (App Router) |
| **Language** | TypeScript |
| **Database** | MongoDB (NoSQL) |
| **Storage** | Cloudinary (Images) |
| **Real-time** | Socket.io |
| **Styling** | Tailwind CSS + Lucide Icons |
| **Validation** | Zod (Schema validation) |

---

## 📂 Project Structure & Logic Guide

### 📍 Geolocation Logic
*   **Frontend**: [`src/app/dashboard/participant/attendance/checkin/page.tsx`](./src/app/dashboard/participant/attendance/checkin/page.tsx)
    *   Functions: `handleVerifyLocation`, `distanceInMeters`.
    *   Parameters: `IGIRE_LAT`, `IGIRE_LNG`, `IGIRE_RADIUS_METERS`.

### 🔐 Attendance Rules (On-time vs Late)
*   **Logic File**: [`src/lib/attendance-rules.ts`](./src/lib/attendance-rules.ts)
    *   `getAttendanceStatus`: Determines if a user is "on-time" or "late" based on the program schedule.
    *   `getAttendanceWindowMessage`: Generates user-friendly errors if the user tries to check in outside allowed hours.

### 🗄️ Database & Seeding
*   **Initialization**: [`src/scripts/init-db.ts`](./src/scripts/init-db.ts)
    *   Sets up unique indexes for emails and compound indexes for attendance lookups.
*   **Seeding Programs**: [`seed-programs.js`](./seed-programs.js)
    *   Populates the database with default programs like "Web Fundamentals" and "Advanced Frontend".
*   **Admin Creation**: [`src/app/api/auth/create-admin/route.ts`](./src/app/api/auth/create-admin/route.ts)
    *   One-time setup for the master administrator.

---

## 🌐 API Documentation

### Attendance APIs
| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/attendance/checkin` | `POST` | Validates time, prevents duplicates, and saves check-in record. |
| `/api/attendance/checkout` | `POST` | Records the end of session and updates the attendance record. |
| `/api/attendance/stats` | `GET` | Aggregated stats for dashboards (counts of on-time, late, etc.). |
| `/api/attendance/user-history`| `GET` | Fetches personalized attendance logs for the participant. |

### Admin & Management
| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/admin/users` | `GET/POST` | Manage user accounts and roles. |
| `/api/programs` | `GET/POST` | Create and manage training programs. |
| `/api/admin/reports` | `GET` | Generate CSV/Excel reports for attendance. |

---

## 🔑 User Roles

1.  **Admin**: Full system control, program management, and advanced reporting.
2.  **HR Officer**: Monitors specific programs, manages participant lists.
3.  **Staff**: Access to staff-specific attendance rules and internal dashboards.
4.  **Participant**: Can check in/out, view personal attendance history and profile.

---

## 🛠️ Development Setup

1.  **Environment Variables**:
    Create a `.env.local` with `MONGODB_URI`, `CLOUDINARY_URL`, and `JWT_SECRET`.
2.  **Initialize DB**:
    ```bash
    npm run db:init
    ```
3.  **Seed Data**:
    ```bash
    node seed-programs.js
    ```
4.  **Run App**:
    ```bash
    npm run dev
    ```

---
*Created with  for Igire Rwanda Organisation.*
