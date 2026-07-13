# Student Management System

A premium, microservices-based Student Management System built using **.NET 8 C#**, **EF Core 8**, **PostgreSQL**, and **ReactJS (Vite)**. 

The application utilizes Clean Architecture, the Repository Pattern, Dependency Injection, JWT Bearer Authentication, and secure Role-Based Access Control (RBAC).

For detailed service dependencies, sync flows, and database caching patterns, refer to [ARCHITECTURE.md](ARCHITECTURE.md).

---

## 🚀 Port & Microservice Configurations

The system is configured with the following defaults:

* **React Frontend**: `http://localhost:5173`
* **Identity Microservice**: `http://localhost:5003`
* **Academic Microservice**: `http://localhost:5002`
* **Database Server**: PostgreSQL (`localhost:5432` / Username: `shubh` / Password-less authentication)
  * Identity Database: `sms_identity`
  * Academic Database: `sms_academic`

---

## 🔑 Seeded Credentials (Already Created)

The database automatically initializes and seeds a default **Principal (Admin)** account:

* **Email**: `admin@school.com`
* **Password**: `AdminPassword123`
* **Role**: `Admin`

---

## 🛠️ How to Setup & Run

### 1. Pre-requisites
Ensure PostgreSQL is running locally on port 5432. The database schemas are created automatically on startup using EF Core `Database.EnsureCreatedAsync()`.

### 2. Execute with One-Click Launch Script
Run the automated bash script from the root folder:
```bash
./start.sh
```
This script concurrently starts both .NET 8 Web APIs and launches the Vite React dev server.

---

## 📘 User Guide & Verification Flow

### Step 1: Log in as Principal Admin
1. Open [http://localhost:5173](http://localhost:5173).
2. Log in using `admin@school.com` / `AdminPassword123`.
3. **Manage Faculty**: Register a new Teacher (e.g. `teacher@school.com` / `Password123`) and a Lab Admin (e.g. `coordinator@school.com` / `Password123`).
4. **Manage Subjects**: Create a department subject (e.g. `CS101` - `Data Structures`).
5. **Manage Students**: Add students manually (e.g. `student@school.com` / `Student123`) or import lists via a CSV spreadsheet.

### Step 2: Log in as Lab Admin (Class Coordinator)
1. Log in using the Coordinator credentials you created (e.g. `coordinator@school.com` / `Password123`).
2. **Assign Teachers**: Match teachers to subject hours (e.g., assigning `teacher@school.com` to teach `Data Structures` at slot `Mon 10:00 AM`).
3. **Schedule Sessions**: Create class sessions for subjects.
4. **Setup Exams**: Schedule term exams (e.g. `Midterm CS101` / Max Marks: 100).

### Step 3: Log in as Student
1. Log in using the student credentials (e.g. `student@school.com` / `Student123`).
2. **Digital ID Card**: View the student profile layout displaying details and a dynamically generated **Enrollment QR Code**.
3. **Scan Simulator**: Click the floating **Attendance QR Simulator** on the bottom right to execute check-in/out scans (first scan marks `Partial` entry; second scan registers `Present` exit).

### Step 4: Log in as Teacher
1. Log in using the teacher credentials (e.g. `teacher@school.com` / `Password123`).
2. **Log Session**: Start a scheduled session, document the **Topic Covered** today, and submit the manual attendance check sheet.
3. **Grading Desk**: Post an assignment, record grades, and submit. The sheet will lock immediately, blocking further teacher edits.

### Step 5: Execute Overrides (Coordinator / Admin)
1. Log in back as the Coordinator or Admin.
2. Go to **Override Dashboard** to modify locked assignment grades or manually adjust attendance check histories.
3. In the **Exams Hub**, log term scores for the class.
