# IgireVerify - Attendance Management System

## Project Overview

IgireVerify is a comprehensive attendance management system built for Igire Rwanda Organization. It allows participants and staff to check in/out using GPS verification, photo capture, and cloud storage. The system includes role-based dashboards for participants, staff, and HR personnel.

## Tech Stack & Technical Terms

### Core Technologies
- **Next.js**: A React framework for building full-stack web applications with server-side rendering (SSR) and API routes.
- **React**: A JavaScript library for building user interfaces with components.
- **TypeScript**: A superset of JavaScript that adds static typing for better code reliability.
- **MongoDB**: A NoSQL document database for storing user data, attendance records, etc.
- **Cloudinary**: A cloud-based media management platform for image storage and optimization.

### Key Concepts
- **REST API**: Representational State Transfer API - a style of web API using HTTP methods (GET, POST, PUT, DELETE) for CRUD operations.
- **CRUD**: Create, Read, Update, Delete - the four basic operations for data management.
- **JWT (JSON Web Token)**: A compact, URL-safe means of representing claims between two parties, used for authentication.
- **Server Components**: In Next.js 13+, components that run on the server, allowing direct database access.
- **Client Components**: Components that run in the browser, marked with "use client".
- **Middleware**: Code that runs before requests reach the API routes or pages.
- **Environment Variables**: Configuration values stored outside code (e.g., API keys, database URLs).
- **GPS Geolocation**: Using browser APIs to get user's location coordinates.
- **Canvas API**: HTML5 API for drawing graphics, used here for photo capture.

### Libraries & Dependencies
- **bcryptjs**: Library for hashing passwords securely.
- **jsonwebtoken**: For creating and verifying JWT tokens.
- **mongodb**: Official MongoDB driver for Node.js.
- **next/headers**: Next.js utilities for handling HTTP headers and cookies.
- **navigator.mediaDevices**: Browser API for camera access.
- **navigator.geolocation**: Browser API for GPS location.

## Architecture

### Frontend (Client-Side)
- **Framework**: Next.js with App Router
- **Styling**: Tailwind CSS
- **Components**: Reusable UI components in `/components`
- **Pages**: Route-based pages in `/app` directory
- **State Management**: React hooks (useState, useEffect)

### Backend (Server-Side)
- **API Routes**: RESTful endpoints in `/app/api`
- **Authentication**: JWT-based with httpOnly cookies
- **Database**: MongoDB with connection via `/lib/mongodb.ts`
- **File Upload**: Cloudinary integration via `/lib/cloudinary.ts`

### Database (MongoDB)
- **Collections**:
  - `users`: User accounts with roles (participant, staff)
  - `attendance`: Check-in/check-out records
- **Connection**: Managed via `getDb()` function

## API Documentation

### Authentication Routes

#### POST `/api/auth/register`
**Purpose**: Register a new user account
**Body**:
```json
{
  "name": "string",
  "email": "string",
  "password": "string",
  "confirmPassword": "string",
  "role": "participant" | "staff",
  "programId": "string (optional)"
}
```
**Response**: `201 Created` with success message

#### POST `/api/auth/login`
**Purpose**: Authenticate user and create session
**Body**:
```json
{
  "email": "string",
  "password": "string"
}
```
**Response**: `200 OK` with redirect URL and user data

#### POST `/api/auth/logout`
**Purpose**: Clear authentication session
**Response**: `200 OK`

#### GET `/api/auth/debug`
**Purpose**: Debug authentication state (development only)
**Response**: User validation status and hash checks

### Attendance Routes

#### POST `/api/attendance/checkin`
**Purpose**: Record participant check-in
**Body**:
```json
{
  "userName": "string",
  "programName": "string",
  "checkInTime": "ISO string",
  "gpsInfo": "string",
  "photoUrl": "string"
}
```
**Response**: `200 OK` with attendance ID

#### POST `/api/attendance/checkout`
**Purpose**: Record participant check-out
**Body**: Same as check-in but with `checkOutTime`
**Response**: `200 OK` with attendance ID

## Database Models

### User Model (`/models/User.ts`)
```typescript
interface User {
  _id: ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: "participant" | "staff";
  position?: "HR" | "Facilitator" | "General";
  programId?: string;
  createdAt: Date;
}
```

### Attendance Model (Implicit in API)
```typescript
interface AttendanceRecord {
  _id: ObjectId;
  userName: string;
  programName: string;
  type: "checkin" | "checkout";
  checkInTime?: string;
  checkOutTime?: string;
  gpsInfo: string;
  photoUrl: string;
  createdAt: Date;
}
```

## Authentication Flow

1. **Registration**: User submits form → Password hashed with bcrypt → Stored in MongoDB
2. **Login**: User submits credentials → Password verified with bcrypt → JWT created → Stored in httpOnly cookie
3. **Protected Routes**: Server components check JWT from cookies → Decode and validate → Allow/deny access
4. **Logout**: Clear auth cookie → Redirect to login

## Key Features

### GPS Verification
- Uses `navigator.geolocation.getCurrentPosition()`
- Validates user is within Igire premises (50m radius)
- Checks GPS accuracy (< 58m)

### Photo Capture
- Uses `navigator.mediaDevices.getUserMedia()` for camera access
- Canvas API to capture and compress images
- Upload to Cloudinary for permanent storage

### Role-Based Access
- **Participant**: Basic check-in/out functionality
- **Staff**: Additional staff management features
- **HR**: Full attendance oversight and reporting

## Setup Instructions

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Cloudinary account

### Environment Variables (`.env.local`)
```env
MONGODB_URI=mongodb+srv://...
MONGODB_DB=IgireVerify
JWT_SECRET=your-secret-key
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Installation
```bash
npm install
npm run dev
```

### Database Setup
1. Create MongoDB Atlas cluster
2. Create database named "IgireVerify"
3. Collections created automatically on first use

## Usage

### For Participants
1. Register/Login
2. Navigate to Attendance → Check-in
3. Verify GPS location
4. Capture photo
5. Submit check-in

### For Staff/HR
1. Login with staff credentials
2. Access role-specific dashboard
3. View attendance reports (HR only)

## Security Features

- **Password Hashing**: bcrypt with 12 rounds
- **JWT Tokens**: HttpOnly cookies, 7-day expiration
- **Input Validation**: Server-side validation on all API endpoints
- **GPS Verification**: Prevents remote check-ins
- **Photo Storage**: Secure cloud storage with access controls

## Development Notes

### File Structure
```
src/
├── app/                 # Next.js App Router
│   ├── api/            # API routes
│   ├── dashboard/      # Protected pages
│   └── login/          # Public pages
├── components/         # Reusable UI components
├── lib/               # Utility functions
│   ├── auth.ts        # Authentication helpers
│   ├── mongodb.ts     # Database connection
│   └── cloudinary.ts  # File upload
└── models/            # TypeScript interfaces
```

### Common Issues
- **404 on API calls**: Ensure route files are named `route.ts` (not `routes.ts`)
- **GPS not working**: Check browser permissions and location services
- **Camera access denied**: Enable camera permissions in browser
- **MongoDB connection failed**: Verify `MONGODB_URI` in `.env.local`

## Contributing

1. Follow TypeScript best practices
2. Use descriptive commit messages
3. Test GPS and camera features on mobile devices
4. Ensure all API responses include proper error handling

---

Built with  for Igire Rwanda Organization

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
