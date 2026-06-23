# CivicPulse AI

**CivicPulse AI** is an AI-powered hyperlocal issue reporting and civic intelligence platform built for the **Coding Ninjas Vibe2Ship Hackathon** under the **"Community Hero - Hyperlocal Problem Solver"** problem statement.

The platform empowers citizens to report, track, and analyze local public infrastructure issues such as potholes, garbage dumps, water leakages, broken streetlights, sewage overflows, fallen trees, and road damage. Instead of a fragmented reporting process, CivicPulse AI functions as a unified AI-powered civic assistant that evaluates issues, assigns severity, drafts official letters, and visualizes hotspots.

---

## 🚀 Key Features

*   **Google Login**: Secure citizen portal login using Firebase Authentication.
*   **Multimodal Issue Reporting**: Citizens upload a photo of the issue along with a text description.
*   **Browser Geolocation**: Automatically captures latitude and longitude to log the exact location.
*   **Gemini Vision Triage**: Inspects visual evidence to classify the issue type and assess physical hazards.
*   **Automated Complaint Generator**: Instantly crafts a municipality-ready professional letter detailing coordinates and public safety concerns.
*   **Interactive Maps**: Plots reports on a map with category and severity filters, utilizing Google Maps (with a fallback vector map mode if API credentials are not yet configured).
*   **Real-time Dashboard & Status Updates**: Monitors open vs. resolved cases. Users can simulate a municipal authority changing issue status to trigger real-time updates across citizen portals.
*   **Civic Intelligence Analytics**: Aggregates community data into charts (weekly trends, category distributions, severity ratios) and compiles summaries of hotspots.

---

## 🤖 The 4 AI Agents (Gemini 3.5 Flash)

CivicPulse AI utilizes Gemini 3.5 Flash via Google AI Studio through four specialized agents:

1.  **Agent 1: Issue Classification Agent**
    *   **Input**: Uploaded image and citizen description.
    *   **Output**: Exact category classification (`Pothole`, `Garbage`, `Water Leakage`, `Streetlight Damage`, `Sewage Overflow`, `Fallen Tree`, `Road Damage`, `Other`) with a confidence percentage.
2.  **Agent 2: Severity Analysis Agent**
    *   **Input**: Visual details and description.
    *   **Output**: Severity assessment (`Low`, `Medium`, `High`, `Critical`) and a detailed hazard reasoning (e.g., active traffic obstruction).
3.  **Agent 3: Complaint Generator Agent**
    *   **Input**: Category, severity, coordinates, and description.
    *   **Output**: A formal, municipality-ready letter ready for public works departments.
4.  **Agent 4: Insight Agent**
    *   **Input**: Aggregated statistics from current database reports.
    *   **Output**: Broad civic summary trends, high-density hotspots, and resource recommendations for municipal council planning.

---

## 🛠️ Technology Stack

*   **Frontend**: Next.js 15/16 App Router, React 19, TypeScript, Tailwind CSS
*   **Database & Auth**: Firebase Firestore & Firebase Authentication
*   **Storage**: Firebase Storage (for proof photo hosting)
*   **Mapping**: Google Maps API (with vector simulation fallback)
*   **Data Visualization**: Recharts
*   **Forms & Validation**: React Hook Form, Zod
*   **AI Engine**: Google AI Studio (Gemini 3.5 Flash API)

---

## 📂 Project Structure

```text
vibe2ship/
├── src/
│   ├── app/
│   │   ├── layout.tsx             # Root layout with providers (Auth)
│   │   ├── page.tsx               # Landing Page (Introduction & Hero)
│   │   ├── auth/
│   │   │   └── page.tsx           # Secure Google Sign-in Page
│   │   ├── dashboard/
│   │   │   └── page.tsx           # Main Civic Dashboard with KPIs & Recent List
│   │   ├── report/
│   │   │   ├── page.tsx           # Report Form (Geolocation + File Picker)
│   │   │   └── [id]/
│   │   │       └── page.tsx       # Live detail page (AI report, letter download, simulator)
│   │   ├── map/
│   │   │   └── page.tsx           # Interactive Maps with category/severity filters
│   │   ├── analytics/
│   │   │   └── page.tsx           # Charts (Recharts) and dynamic AI policy summaries
│   │   └── api/
│   │       ├── report/
│   │       │   └── route.ts       # Uploads to Storage, triggers Gemini, writes to Firestore
│   │       └── analytics/
│   │           └── route.ts       # Aggregates report counts and caches Gemini Insights
│   ├── components/
│   │   └── navbar.tsx             # Responsive global navigation bar
│   ├── context/
│   │   └── auth-context.tsx       # Firebase Authentication React Context
│   └── lib/
│       ├── firebase.ts            # Client SDK init with build-time fallback config
│       ├── gemini.ts              # Gemini SDK wrapper for the 4 Agents
│       └── utils.ts               # Date formatter and Tailwind merging helpers
├── .env.local.example             # Key configuration templates
├── package.json
└── tsconfig.json
```

---

## ⚙️ Setup Instructions

### 1. Clone & Install Dependencies
Navigate to the root directory and install all npm packages:
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file by copying the template:
```bash
cp .env.local.example .env.local
```
Fill in the following variables:
*   `NEXT_PUBLIC_FIREBASE_*`: Retrieve credentials from your **Firebase Console** (Project Settings).
*   `GEMINI_API_KEY`: Obtain a free API key from **[Google AI Studio](https://aistudio.google.com/)**.
*   `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: Obtain a Maps Javascript API key from **Google Cloud Console**. *(Optional: If left blank or as default, the application will fallback to an interactive Vector coordinate map so it remains testable).*

### 3. Setup Firebase
1.  **Firebase Auth**: Enable the **Google Sign-in provider** in your Firebase console under Authentication.
2.  **Firestore Database**: Initialize Firestore in **Test Mode** (or update security rules to allow read/write access to `users`, `reports`, and `analytics` collections).
3.  **Firebase Storage**: Enable Firebase Storage to allow citizens to upload proof photos.

### 4. Run the Development Server
Start the local server:
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 📦 Deployment

### Deploying to Vercel
Deploy Next.js easily using the Vercel CLI or Git integrations, passing all configured keys in `.env.local` as Vercel Environment Variables.

### Deploying to Cloud Run (from Google AI Studio)
Google AI Studio's **Build Mode** offers a direct deploy workflow:
1.  Navigate to Build Mode inside Google AI Studio.
2.  Click **Publish** (Starter Tier) in the top-right corner.
3.  Google AI Studio will automatically provision a Cloud Run instance and deploy a managed full-stack application, providing a public URL for your submission.
