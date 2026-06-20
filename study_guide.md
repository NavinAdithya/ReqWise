# REQWISE: Complete Study Guide

## 1. The Core Concept (What is the project?)
**Name:** REQWISE
**Purpose:** A Human-First Requirement Validation & QA Performance Assessment Platform.
**In simple terms:** When software is built, "Requirement Documents" (what the software should do) are created. This platform manages those documents and ensures they are high quality. Instead of just using AI to check them, it relies on human QA (Quality Assurance) analysts to manually review checklists and write reports. At the same time, the system monitors the QA analysts—if they make too many mistakes, it forces them to take a training assessment!

### The 3 User Roles:
1. **Client:** Uploads their requirement documents and reviews the final reports.
2. **Admin:** Acts as the manager. They assign tasks to QAs, review the QAs' reports, and log any mistakes the QA makes.
3. **QA Analyst:** Reads the requirements, fills out checklists, writes report findings, and has to pass mandatory tests if they make too many errors.

---

## 2. The Tech Stack (What was used to build it?)
It is built using the highly popular **MERN-like stack**, utilizing modern tools for speed and scalability.

### Frontend (User Interface):
*   **React** (with **Vite** for fast building) & **TypeScript** (for strict, safe coding).
*   **Tailwind CSS** (for styling and modern UI design).
*   **Zustand** (for managing state/data across the app).
*   **Recharts** (for drawing beautiful analytics graphs).

### Backend (Server & Logic):
*   **Node.js** with **Express.js** (creates the API routes).
*   **Zod** (for strict data validation—making sure bad data doesn't get in).
*   **JWT (JSON Web Tokens) & Bcrypt** (for secure login sessions and password hashing).

### Database:
*   **MongoDB** (with **Mongoose ODM** to interact with the database).

---

## 3. The Logic & Workflow (How does it work?)
The entire application runs on a strict **State Machine** (a step-by-step pipeline) for the Requirement Documents:

1. **`DRAFT`:** Client uploads their document.
2. **`ASSIGNED`:** Admin assigns it to a specific QA Analyst.
3. **`UNDER_ANALYSIS`:** The QA Analyst reads the spec and marks off items on their checklist.
4. **`REPORT_GENERATED`:** The QA writes up a summary of missing features or risks.
5. **`UNDER_REVIEW`:** The QA sends the finished report to the Admin for approval.
6. **`CLIENT_REVIEW`:** If the Admin likes it, they forward it to the Client.
7. **`REVALIDATION`:** If the Admin finds mistakes, they reject it and send it back to the QA.
8. **`FINALIZED`:** The Client accepts the final report.

### The "Secret Sauce" Engine (QA Assessment):
If an Admin spots a QA making a mistake, they log it. Mistakes have weights: Low (1 pt), Medium (3 pts), High (5 pts). If a QA reaches **10 points** (or makes the same mistake multiple times), the system triggers a mandatory competency assessment quiz. They are given a **2-day grace period** to complete it. During this 2-day duration, they can still work and review tasks. However, if they do not attend and pass the test within 2 days, their dashboard is completely locked and they cannot continue working!

---

## 4. Which Functions are used for Which? (Backend Controllers)
The backend uses a "Controller" pattern. Here are the main controllers and the functions inside them:

1. **`RequirementController`**:
   * `create()`: Used when a Client uploads a new document.
   * `assign()`: Used by the Admin to assign the document to a QA.
   * `getChecklist()` & `updateChecklist()`: Used when the QA is checking off items during their analysis.
2. **`ReportController`**:
   * Used to generate, save, and submit the manual QA findings to the Admin.
3. **`ReviewController`**:
   * Handles the approval/rejection logic. Functions here move the document between `UNDER_REVIEW`, `CLIENT_REVIEW`, and `REVALIDATION`. 
4. **`MistakeController`**:
   * Used strictly by the Admin to log a mistake against a QA Analyst. It calculates the points (1, 3, or 5).
5. **`AssessmentController`**:
   * Contains functions that constantly check: *"Does this QA have 10 points yet?"* 
   * If yes, it triggers the test, fetches the quiz questions, and grades their answers.
6. **`AuthController`**:
   * `login()` / `register()`: Handles securely logging in Clients, QAs, and Admins using JWT tokens.

---

## 5. Potential Questions & Answers (Viva / Interview Prep)

**Q1: What is the main problem that REQWISE solves?**
**Answer:** Most requirement validation tools rely entirely on AI to auto-generate reports, which can miss human nuance. REQWISE solves this by putting the human QA analyst first. It provides a structured way for human QAs to review requirements manually while the system tracks their accuracy and performance in the background.

**Q2: What happens if a QA analyst keeps making mistakes?**
**Answer:** The system has a built-in 'Mistake Engine'. Admins can log mistakes as Low, Medium, or High severity (1, 3, or 5 points). If a QA reaches 10 points, or makes the same mistakes repeatedly, the system triggers a mandatory competency assessment. The QA is given a **2-day duration (grace period)** to pass it. They can still review requirements during these 2 days, but if they fail to attend the test within the deadline, their dashboard becomes fully locked.

**Q3: How do you handle security and user authentication?**
**Answer:** Security is handled using JSON Web Tokens (JWT). When a user logs in, their password (which is securely hashed in the database using Bcrypt) is verified, and they are given a JWT. Every time they try to access a protected route (like viewing a document), the backend middleware verifies the token and their specific Role (Admin, QA, or Client).

**Q4: How do you ensure the platform loads quickly?**
**Answer:** On the frontend, we use Vite which splits our code into smaller 'chunks'. Large libraries (like Recharts for our graphs) are separated from the main code so the initial page loads extremely fast. Our main JavaScript bundle is kept under 400KB.

**Q5: What happens if an Admin rejects a QA report?**
**Answer:** The state of the requirement changes to `REVALIDATION`. The report is sent back to the QA Analyst with the Admin's feedback. The QA must then fix the issues in their review or checklist before resubmitting it.

**Q6: Why did you choose MongoDB for this project instead of SQL?**
**Answer:** MongoDB is a NoSQL database that works very well with JSON-like documents. Because requirement specifications and checklists can vary in structure depending on the project category, MongoDB provides the flexibility we need without requiring strict schemas for every possible checklist variation. 

**Q7: How does the system know when a QA has made a mistake?**
**Answer:** Mistakes are not automatically detected; they are logged by the Admin during the `UNDER_REVIEW` phase. When reviewing a QA's report, if the Admin spots an error (like missing a critical requirement), they manually log a mistake with a severity of Low, Medium, or High, which adds points to the QA's profile.

**Q8: Can a Client directly communicate with a QA Analyst?**
**Answer:** No, the platform is designed with an Admin bottleneck for quality control. The Client uploads the document, the Admin assigns the QA, and the Admin reviews the QA's report before forwarding it to the Client. This ensures the Client only ever sees finalized, high-quality QA work.

---

## 6. Advanced / Complex Questions (For Extra Marks!)

**Q9: Why did you choose Zustand over Redux for state management on the frontend?**
**Answer:** While Redux is powerful, it introduces a lot of boilerplate code (actions, reducers, dispatchers). Zustand provides a much simpler, lightweight, and hook-based API that integrates perfectly with React. It allows us to manage global state (like user sessions and active requirement data) efficiently without the steep learning curve and massive file sizes associated with Redux.

**Q10: Can you explain the exact algorithm/logic used to trigger a QA Assessment?**
**Answer:** The system triggers an assessment if any of these three conditions are met:
1. **Cumulative Weight Threshold:** The QA reaches $\ge 10$ points across all their logged mistakes.
2. **Project-Specific Pattern:** The QA makes $\ge 2$ instances of the *exact same* mistake type within a single project.
3. **Category-Specific Pattern:** The QA makes the *exact same* mistake type across $\ge 3$ different projects within the same domain/category.
This ensures we catch both overall poor performance *and* specific recurring knowledge gaps.

**Q11: How is the backend secured against unauthorized access?**
**Answer:** We implemented **Role-Based Access Control (RBAC)** coupled with **JWT Authentication Middleware**. Every incoming API request passes through a middleware function that first verifies the JWT signature. Once the user is identified, it checks their `role` property against the endpoint's allowed roles. If a Client tries to access an Admin-only route (like `/api/mistakes`), the server intercepts the request and instantly returns a `403 Forbidden` error without ever reaching the controller logic.

**Q12: I see you mentioned keeping the JavaScript bundle under 400KB. How is this achieved with large libraries like Recharts?**
**Answer:** We achieved this through **Code Splitting** and **Dynamic Imports** configured via Vite and Rollup. Instead of sending the entire application to the browser on the first load, we split the code. Heavy components, such as the Recharts analytics dashboard, are compiled into separate "chunks". The browser only downloads the core React app initially, and fetches the charting chunk *only* when the user actually navigates to the dashboard page.

**Q13: By attending the mandatory assessment test, how does a QA Analyst actually improve?**
**Answer:** The assessment acts as a targeted training mechanism rather than just a punishment. Because the platform tracks the *specific categories* of mistakes the QA makes (e.g., missing security flaws or ignoring edge cases), the assessment forces them to revisit those exact topics. They must successfully answer competency questions related to their weaknesses to prevent their dashboard from being locked after the 2-day grace period. This ensures active re-learning and prevents the same poor habits from bleeding into future projects.

---

## 7. Deep Dive Technical Questions

**Q14: How did you lock the dashboard? Which function is used?**
**Answer:** We lock the dashboard using a combination of Frontend and Backend security. On the frontend, we use a component called **`ProtectedRoute.tsx`**. It wraps around our pages and checks if the user's `useStore` has a valid login token. If they don't, it immediately redirects them to the login page. On the backend, we use an Express middleware function called **`protect`** (which verifies the JSON Web Token) and **`restrictTo`** (which checks if the user's Role—Admin, QA, or Client—is allowed to access that specific endpoint).

**Q15: In Admin review actions, how does AI Validate work?**
**Answer:** When an Admin reviews a QA’s report, they can click 'Run AI Validation'. This triggers the **`AiValidationService`** on the backend. The service securely sends the original Requirement text, the QA's findings (missing features, risks), and the checklist to a Large Language Model (Google Gemini AI) via an API. We provide the AI with a strict system prompt asking it to act as an auditor. It compares the two and returns a JSON response scoring the QA's accuracy and highlighting any conflicts or false positives the QA might have missed.

**Q16: How are the tests created based on their mistakes?**
**Answer:** We built a **Mistake Engine**. When an Admin rejects a QA report, they can log a 'Mistake' (Low, Medium, or High severity). The backend `MistakeService` assigns points to these severities (e.g., High = 5 points). Once a QA accumulates **10 points**, the system automatically flags them for a competency test. It uses the `AiValidationService.generateAssessment` function to look at the exact mistakes they made (e.g., 'Missed PCI compliance') and dynamically generates customized, open-ended test questions about those specific topics.

**Q17: How are Admin and QA Analyst interconnected?**
**Answer:** They are connected through a highly structured **Assignment Workflow**. The Admin acts as the manager: they create the Requirement documents and *assign* them to a specific QA. The QA then gets a notification, reviews the document, and submits a 'QA Report'. The Admin then receives this report and must review it. If it's good, the Admin approves it and sends it to the Client. If it's bad, the Admin rejects it, sends it back to the QA for 'Revalidation', and logs a mistake. They rely entirely on each other to move the document forward.

**Q18: Which modules did you use and how do you use less modules?**
**Answer:** We used a **Modular Monolith Architecture** using Express, React, and MongoDB. Instead of using dozens of heavy external libraries or splitting the app into complex microservices, we built our own highly focused internal modules (like `ReviewService`, `ReportService`, and `ComparativeValidationService`). By keeping the logic inside specialized Service classes, the code is reusable. For example, our 'NotificationService' is just one lightweight module that gets called by the Admin, QA, and Client controllers, keeping our dependency count low and our app incredibly fast.

**Q19: Simply explain the workflow of the project.**
**Answer:** The workflow is a linear pipeline designed for human accuracy:
1. **Draft:** Admin uploads a Requirement Document.
2. **Assign:** Admin gives it to a QA Analyst.
3. **Analysis:** The QA checks the document against a smart checklist and drafts a report of risks/missing features.
4. **Admin Review:** Admin double-checks the QA's report (using AI to help if needed).
5. **Client Review:** The Client sees the final polished document. They can Accept it, Reject it, or Modify the text themselves to finalize it.

**Q20: Explain the logic of the project.**
**Answer:** The core logic of the project is **Accountability and Continuous Validation**. Most tools assume AI is perfect or humans are perfect. Our logic assumes *neither* are perfect. The system logic forces the human QA to do the initial deep thinking, forces the Admin to double-check the QA's work, and then uses AI purely as an 'assistant' to catch discrepancies. Furthermore, the logic punishes poor performance by automatically forcing QAs to take tests if their mistake score gets too high, ensuring high quality over time.

**Q21: How does the 'Quick Validation Check' work in the Client Modify option?**
**Answer:** When a Client decides they want to modify a requirement themselves (e.g., rewriting a paragraph), they can click 'Quick Validation'. The frontend takes their *newly typed text* and sends it to the backend's **`ComparativeValidationService`**. This service instantly runs an algorithm to check if the new text breaks any predefined rules (like replacing 'HTTPS' with 'HTTP' for a Fintech app), checks if it still meets checklist coverage, and looks for missing standard sections. It immediately alerts the client of any conflicts before they finalize the document.

---

## 8. Project Folder & File Structure Explained

To easily understand how the code is organized, here is a breakdown of the primary folders and what they are used for. The project is split into two main directories: **`backend/`** (the server and database logic) and **`frontend/`** (the React user interface).

### 🖥️ Backend Directory (`/backend`)
This is where all the secure logic, database models, and AI integrations live.

*   **`src/controllers/`**: These files handle the incoming HTTP requests from the frontend. They extract the data the user sent and decide what to do with it. (e.g., `ReportController.ts` handles when a QA submits a report).
*   **`src/services/`**: The "brain" of the backend. Instead of putting complex logic in controllers, we put it here. This includes AI interactions (`AiValidationService.ts`), heavy math/diffing logic (`ComparativeValidationService.ts`), and database updates (`ReviewService.ts`).
*   **`src/models/`**: Defines the strict structure of our MongoDB database using Mongoose. Here you define exactly what a "Requirement", "Report", or "Mistake" looks like.
*   **`src/routes/`**: Acts as the traffic cop. It maps URL endpoints (like `/api/reports`) to the specific function in a `Controller` that should handle it.
*   **`src/middleware/`**: Security checkpoints. Functions like `auth.ts` sit in the middle of a request to verify JSON Web Tokens and check if a user is an Admin, QA, or Client before letting them through.
*   **`src/scripts/`**: Helper files used during development, like `seedProduction.ts`, which instantly fills the database with fake clients, QAs, and requirements so we can test the app.
*   **`src/utils/`**: Shared tools and validation rules. It includes Zod schemas that strictly verify the exact shape of data the frontend is allowed to send.

### 🎨 Frontend Directory (`/frontend`)
This is the React application that runs in the user's web browser.

*   **`src/pages/`**: The main screens of the application. Each file represents a full page you can navigate to, such as `ClientReviewPage.tsx`, `AdminDashboard.tsx`, or `QAWorkspace.tsx`.
*   **`src/components/`**: Reusable building blocks of the UI. Things like navigation bars, buttons, and secure wrappers (`ProtectedRoute.tsx` which locks the dashboard) live here.
*   **`src/layouts/`**: Wrappers for pages to give them a consistent look. For example, `DashboardLayout.tsx` provides the sidebar and top navigation for all logged-in users.
*   **`src/services/`**: Contains the code that actually talks to the backend API. Files here use the `fetch` API to send network requests to the backend controllers.
*   **`src/store/`**: The global state management using Zustand (`index.ts`). This is where we temporarily save data (like the user's profile, or the list of requirements) so multiple React components can share it without fetching from the backend twice.
*   **`src/types/`**: TypeScript definition files. They mirror the backend models so the frontend knows exactly what data shape to expect (e.g., ensuring it knows a requirement has a `title` and `description`).
*   **`src/assets/`**: Static files like global CSS (`index.css`) or image files.
