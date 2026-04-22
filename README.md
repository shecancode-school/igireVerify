# IgireVerify: Enterprise Attendance & Real-Time Tracking

IgireVerify is a high-fidelity, enterprise-grade attendance management system designed for **Igire Rwanda Organisation**. It combines geofence-verified check-ins, photo verification, and real-time administrative oversight to ensure 100% data integrity for large-scale programs.

---

## 🚀 The Tech Stack (Core Architecture)

| Component | Technology | Rationale |
| :--- | :--- | :--- |
| **Framework** | **Next.js 15+ (App Router)** | industry-standard for speed, SEO, and secure server-side logic. |
| **Styling** | **Tailwind CSS** | ensures a fully responsive, mobile-first design with professional aesthetics. |
| **Runtime** | **Turbopack** | Used during the build process to optimize page loading and development speed. |
| **Database** | **MongoDB Atlas** | A scalable NoSQL database with custom indexing for high-concurrency (100+ users). |
| **Real-time** | **Socket.io** | Powers the "Live Dashboard" allowing staff to see check-ins instantly without refreshing. |
| **Storage** | **Cloudinary** | Automates photo storage with intelligent program-specific folder organization. |
| **Auth** | **JWT + Bcrypt** | Enterprise security (Stateless Tokens and 12-round salted password hashing). |
| **Email** | **SMTP / Nodemailer** | Handles official email verification and password resets with secure tokens. |

---

## 🛠️ Key Feature Breakdown

### 1. Participant Dashboard (Mobile-First)
- **Geofence Check-in**: Verifies GPS coordinates to ensure the user is physically on-site (within a strictly defined radius).
- **Photo Verification**: Captures a live photo during check-in, stored securely by Program ID in Cloudinary.
- **Attendance Calendar**: A high-contrast, professional calendar showing present/absent/late history.
- **Stable Hydration**: Optimized to prevent "flicker" and errors during the initial load on mobile devices.

### 2. Staff & Admin Dashboard (Command Center)
- **Live Monitor**: Uses WebSockets to stream check-in events globally in real-time.
- **Manual Overrides**: Allows staff to record attendance for participants who face technical or timing issues.
- **Program Breakdown**: Quick-view cards showing enrollment vs. actual attendance for today.
- **Smart Roster**: Searchable grids for viewing attendance history by program and date.

### 3. Reporting & Enterprise Tools
- **Multi-Format Export**: One-click generation of **PDF, CSV, and Excel** reports.
- **Audit Trails**: Every attendance record includes GPS data, timestamps, and photo URLs for total accountability.

---

## 🛰️ API Routes & Logic

### Authentication (`/api/auth`)
- `POST /register`: Enforces `@igirerwanda.org` for staff and requires official program codes for participants.
- `POST /login`: Validates role and email domain to route users to their respective dashboards automatically.
- `POST /verify-email`: Secure, time-limited token verification before account activation.

### Attendance Tracking (`/api/attendance`)
- `POST /preflight`: Validates attendance rules (e.g., "Cannot check out before checking in" or "Session is closed").
- `POST /checkin`: Records GPS, Photo URL, and Status (On-time/Late) into the database.
- `POST /manual`: Secure route for staff to bypass GPS if needed for manual adjustment.

---

## 📈 Scalability & Security FAQs

**Q: Can 100+ people check in at once?**  
**A:** Yes. We use **Database Indexing** on `userId`, `programId`, and `date`. This ensures the database can handle thousands of simultaneous requests without slowing down.

**Q: Where are the passwords stored?**  
**A:** We never store raw passwords. All credentials are hashed using **Bcrypt** and can only be accessed via secure server-side JWT tokens.

**Q: What happens if the internet is slow?**  
**A:** The system has localized error handling and high-efficiency photo compression (JPEG 0.85) to ensure uploads succeed even on 3G networks.

---

## 🛠️ Developer Commands
- `npm run dev`: Start development server.
- **`npm run init-db`**: Custom script to set up all high-performance database indexes.
- `npm run build`: Generate an optimized production bundle.

---
*Created for Igire Rwanda Organisation — 2026*
