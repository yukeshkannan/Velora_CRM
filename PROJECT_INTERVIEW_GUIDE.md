# Aura CRM - Project Technical Guide for Interviews

## 1. Project Overview
**Project Name:** Aura CRM
**Type:** Enterprise-Grade Customer Relationship Management System
**Architecture:** Microservices-based Architecture

**Elevator Pitch:**
"Aura CRM is a scalable, cloud-native application designed to streamline business operations. Unlike traditional monolithic CRMs, Aura uses a distributed microservices architecture to decouple core business logic—such as HR, Sales, and Support—into independent, scalable services. It features a modern, responsive React frontend and is containerized using Docker for consistant deployment on AWS."

---

## 2. Technical Architecture
This is the most important part for a technical interview. You need to explain *how* it works.

### High-Level Flow
1.  **Client (Frontend):** React application running in the user's browser.
2.  **Reverse Proxy (Caddy):** Handles HTTPS (SSL) termination and routes traffic to the backend. It ensures the site is secure (`https://aura-crm.duckdns.org`).
3.  **API Gateway:** A single entry point for all backend requests. It routes requests (e.g., `/api/auth`) to the specific microservice responsible for that task.
4.  **Microservices:** Independent Node.js applications that communicate with the database.
5.  **Database:** MongoDB (Atlas) serves as the persistent storage layer.

### Why Microservices? (Interview Answer)
"I chose a microservices architecture to ensure **scalability** and **maintainability**. If the 'Notification Service' goes down, it doesn't crash the entire application. It also allows different modules (like HR or Invoicing) to be developed and deployed independently."

---

## 3. Technology Stack

### Frontend (Client)
-   **Framework:** React 19 (Latest) with Vite (for fast build times).
-   **Styling:** TailwindCSS (Utility-first CSS for rapid UI development).
-   **State Management:** React Context API & Hooks.
-   **Animations:** Framer Motion (for smooth micro-interactions).
-   **Data Visualization:** Recharts (for analytics dashboards).
-   **HTTP Client:** Axios.

### Backend (Server)
-   **Runtime:** Node.js.
-   **Framework:** Express.js (for building RESTful APIs).
-   **Security:** JWT (JSON Web Tokens) for stateless authentication.
-   **Email Service:** Brevo (formerly Sendinblue) for sending OTPs and notifications.

### Database & Storage
-   **Primary DB:** MongoDB (NoSQL). Chosen for its flexibility with JSON-like data structures which fits the dynamic nature of CRM data.
-   **Object Storage:** AWS S3 (handled via Document Service) for storing files/invoices.

### DevOps & Infrastructure
-   **Containerization:** Docker & Docker Compose (to define and run multi-container applications).
-   **Orchestration:** Docker Compose (local & simple production) / potential for Kubernetes scaling.
-   **Web Server:** Caddy (Automatic HTTPS).
-   **Cloud Provider:** AWS EC2 (hosting the dockerized services).
-   **CI/CD:** GitHub Actions (implied or ready for future implementation).

---

## 4. Microservices Breakdown
Be ready to explain what each "box" in your diagram does.

1.  **Gateway Service:** The traffic cop. It forwards requests like `POST /auth/login` to the Auth Service.
2.  **Auth Service:** Handles User Registration, Login, JWT generation, and Password Resets (sending emails via Brevo).
3.  **HR Service:** Manages Employees, Departments, and their roles.
4.  **Contact Service:** CRUD operations for Client Contacts.
5.  **Opportunity Service:** Manages potential sales deals (Pipelines).
6.  **Task Service:** Project management—assigning tasks to employees.
7.  **Ticket Service:** Customer support ticketing system.
8.  **Document Service:** Handles file uploads (likely connecting to AWS S3).
9.  **Analytics Service:** Aggregates data from other services to show charts/graphs on the dashboard.
10. **Notification Service:** Real-time system alerts.
11. **Search Service:** Global search functionality across the CRM.
12. **Invoice & Product Services:** Managing billing and catalog.

---

## 5. Key Features & Highlights (STAR Method)

**Situation/Challenge:** "We needed a way for different user roles (Admin, Employee, Client) to have different views."
**Action:** "I implemented Role-Based Access Control (RBAC) in the frontend. The Dashboard dynamically renders components based on the user's role stored in their JWT."

**Situation/Challenge:** "Securely handling environment variables for production."
**Action:** "I used a centralized `.env` management strategy locally and injected secrets securely into Docker containers during the deployment process on AWS, ensuring no keys were hardcoded."

**Situation/Challenge:** "The app needed to look professional, not generic."
**Action:** "I utilized TailwindCSS for a custom design system and Framer Motion to add 'glassmorphism' effects and smooth transitions, significantly improving the UX."

---

## 6. Common Interview Questions You Might Get

**Q: How do your services communicate?**
**A:** "Currently, they communicate via synchronous HTTP REST calls through the API Gateway. In the future, I plan to implement a message queue like RabbitMQ for asynchronous communication to decouple them further."

**Q: How do you handle authentication across services?**
**A:** "The Auth Service generates a JWT upon login. This token is passed in the Authorization header. The Gateway or individual services verify this token to grant access to protected routes."

**Q: Why did you use Docker?**
**A:** "It eliminates the 'it works on my machine' problem. By containerizing each service, I ensure that the production environment on AWS is identical to my local development environment."

---

## 7. Future Improvements (Shows you think ahead)
-   **Redis Caching:** To speed up frequently accessed data like User Profiles or Dashboard stats.
-   **WebSockets (Socket.io):** For real-time updates on Tickets and Chats instead of polling.
-   **Kubernetes:** For auto-scaling services based on load.
-   **CI/CD Pipelines:** Creating automated workflows to test and deploy on push.
