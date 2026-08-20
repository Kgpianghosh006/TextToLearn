# 🎓 TextToLearn

**🚀 Live Demo:** [https://texttolearn-omega.vercel.app/](https://texttolearn-omega.vercel.app/)

> **Transform any text or topic into a fully-fledged, interactive AI course in seconds.**

TextToLearn is an AI-powered educational platform that generates structured courses from simple text prompts. It automatically creates modules, detailed lessons, interactive multiple-choice questions, curated YouTube video supplements, and even audio summaries. 

Whether you're looking to learn a new programming language, explore history, or understand complex scientific concepts, TextToLearn builds a personalized curriculum just for you.

---

## ✨ Key Features

- **🧠 AI Course Generation:** Enter any topic, and our AI (powered by Google Gemini) generates a comprehensive course outline, complete with modules and sequential lessons.
- **📚 Rich Lesson Content:** Lessons are automatically enriched with detailed paragraphs, code snippets, and objectives.
- **🎧 Audio Summaries (Hinglish):** On-the-fly text-to-speech audio generation allows users to listen to lesson summaries.
- **🎥 Smart Video Integration:** Automatically fetches relevant YouTube videos to supplement the text-based learning.
- **📝 Interactive MCQs:** Test your knowledge with AI-generated multiple-choice questions at the end of lessons.
- **📄 PDF Export:** Download entire courses or individual lessons as beautifully formatted PDF documents for offline reading.
- **🌓 Enterprise UI:** A sleek, responsive dashboard featuring Dark and Light modes, built with Tailwind CSS v4.
- **🔒 Secure Authentication:** User accounts, private course history, and secure API routes protected by Auth0.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React.js (via Vite)
- **Styling:** Tailwind CSS v4
- **Routing:** React Router v6
- **Authentication:** Auth0 React SDK
- **PDF Generation:** html2canvas & jsPDF

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB & Mongoose
- **Authentication:** Auth0 (express-oauth2-jwt-bearer)
- **AI Integration:** Google Gemini API (`@google/genai`)
- **Audio Generation:** Google TTS API

---

## 🚀 Getting Started (Local Development)

Follow these instructions to set up and run TextToLearn on your local machine.

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MongoDB](https://www.mongodb.com/) (Local instance or MongoDB Atlas cluster)
- [Auth0 Account](https://auth0.com/) (For frontend/backend authentication)
- [Google Gemini API Key](https://aistudio.google.com/app/apikey)

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/TextToLearn.git
cd TextToLearn
```

### 2. Backend Setup
Navigate to the server directory and install dependencies:
```bash
cd server
npm install
```

Create a `.env` file in the `server` directory and add the following variables:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_google_gemini_api_key

# Auth0 Backend Configuration
AUTH0_AUDIENCE=your_auth0_api_audience
AUTH0_ISSUER_BASE_URL=https://your-auth0-domain.us.auth0.com/
```

Start the backend server:
```bash
npm run dev
# The server will start on http://localhost:5000
```

### 3. Frontend Setup
Open a new terminal, navigate to the client directory, and install dependencies:
```bash
cd client
npm install
```

Create a `.env` file in the `client` directory and add the following variables:
```env
VITE_API_URL=http://localhost:5000

# Auth0 Frontend Configuration
VITE_AUTH0_DOMAIN=your-auth0-domain.us.auth0.com
VITE_AUTH0_CLIENT_ID=your_auth0_client_id
VITE_AUTH0_AUDIENCE=your_auth0_api_audience
```

Start the frontend development server:
```bash
npm run dev
# The frontend will start on http://localhost:5173
```

---

## 📂 Project Structure

```text
TextToLearn/
├── client/                 # React Frontend (Vite)
│   ├── src/
│   │   ├── components/     # UI Components, Blocks, & Layouts
│   │   ├── pages/          # Route Views (CourseView, HomeView, etc.)
│   │   ├── utils/          # API helpers and utilities
│   │   └── App.jsx         # Main App router and Auth0 Provider
│   └── .env                # Frontend environment variables
│
└── server/                 # Node.js/Express Backend
    ├── controllers/        # Route logic (Course, Video, Audio)
    ├── middlewares/        # Express middlewares (Auth0 checkJwt)
    ├── models/             # Mongoose Schemas (Course, Module, Lesson)
    ├── routes/             # Express API Routes
    ├── services/           # External API integrations (Gemini, TTS, YouTube)
    ├── server.js           # Backend entry point
    └── .env                # Backend environment variables
```

---

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

## 📝 License
This project is licensed under the MIT License.
