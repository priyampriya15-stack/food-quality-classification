# Food Quality Classification Using Deep Learning – Automated Visual Quality Assessment

An end-to-end, full-stack deep learning solution for automated visual assessment and quality classification of food items. Built with React.js, Tailwind CSS, FastAPI, and TensorFlow (Custom CNN & EfficientNetB0).

---

## ⚠️ Important Safety Disclaimer

> **Notice**: Visual appearance alone **cannot** definitively determine microbiological food safety, toxic bacterial presence, or edibility. This automated visual assessment system is designed strictly for research, academic evaluation, and visual quality grading purposes. Always follow standard food safety regulations and regulatory health guidelines.

---

## 📌 Technology Stack

- **Frontend**: React.js 18, Vite, Tailwind CSS, Axios, Recharts, Lucide React
- **Backend API**: Python 3.10+, FastAPI, Uvicorn, Pydantic v2
- **Deep Learning**: TensorFlow / Keras (Custom CNN Architecture, EfficientNetB0 Transfer Learning)
- **Database**: SQLite with SQLAlchemy ORM
- **Image Processing**: Pillow (PIL), OpenCV (`opencv-python-headless`)
- **Evaluation & Metrics**: NumPy, Pandas, Scikit-learn, Matplotlib, Seaborn

---

## 📁 Project Directory Structure

```text
food-quality project/
├── .env.example                  # Root environment template
├── .gitignore                     # Git ignore rules for Python, Node, ML models & data
├── README.md                      # Complete project documentation
├── backend/                       # FastAPI Backend Application
│   ├── .env.example               # Backend environment variables
│   ├── requirements.txt           # Backend dependencies
│   ├── uploads/                   # Temporary directory for image uploads
│   └── app/
│       ├── __init__.py
│       ├── main.py                # FastAPI entry point (Phase 4)
│       ├── api/                   # API routes and endpoints
│       ├── core/                  # Configuration, database setup, security
│       ├── models/                # SQLAlchemy database models
│       ├── schemas/               # Pydantic schemas for request/response
│       └── services/              # Prediction inference and business logic
├── frontend/                      # React + Vite Frontend Application
│   ├── .env.example               # Frontend environment variables
│   ├── index.html                 # HTML entry point with Inter font & SEO meta
│   ├── package.json               # Frontend dependencies & scripts
│   ├── postcss.config.js          # PostCSS configuration
│   ├── tailwind.config.js         # Tailwind CSS styling configuration
│   ├── vite.config.js             # Vite build & dev server config
│   └── src/
│       ├── App.jsx                # Main App component
│       ├── main.jsx               # React DOM root render
│       ├── index.css              # Global styles & Tailwind directives
│       ├── assets/                # Static assets & icons
│       ├── components/            # Reusable UI components
│       ├── pages/                 # Application pages
│       └── services/              # Axios HTTP client
└── ml/                            # Deep Learning Pipeline & Training
    ├── requirements.txt           # Machine learning & evaluation dependencies
    ├── README.md                  # Dataset and model guidelines
    ├── data/                      # Raw and processed datasets (Phase 2)
    ├── models/                    # Trained weights (.keras/.h5) & checkpoints
    ├── reports/                   # Training curves, confusion matrices, metrics
    └── src/                       # Training & evaluation scripts (Phase 3)
```

---

## 🚦 Strict Project Standards

1. **No Fake Predictions**: Models will only make predictions based on actual loaded weights from trained checkpoints. If no model is trained, the API will explicitly return a `503 Service Unavailable / Model Not Loaded` response.
2. **Data Integrity**: The `Moderate Quality` class will **not** be included unless valid, human-labeled data exists for it in the chosen dataset. Otherwise, the classifier strictly targets verified classes (e.g., `Fresh` vs. `Spoiled`).
3. **No Random Weights in Production**: Randomly initialized weights will never be used for real predictions.
4. **Transparent Evaluation**: Metrics, confusion matrices, and ROC curves will be derived solely from actual test-set evaluations.

---

## 🛠️ Windows Installation & Setup Guide

### 1. Prerequisites
- **Python**: Version 3.10 or 3.11 installed and added to Windows PATH.
- **Node.js**: Node 18+ and npm installed.
- **Git**: Installed for version control.

### 2. Backend Setup & Server Execution
Open PowerShell in the project root:
```powershell
# Navigate to backend directory
cd backend

# Create a virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Upgrade pip and install dependencies
python -m pip install --upgrade pip
pip install -r requirements.txt

# Copy environment config
copy .env.example .env

# Run FastAPI development server with hot-reload
uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```
Interactive API documentation:
- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`

#### REST API Endpoints Overview:
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Register a new user account with hashed password and return JWT |
| `POST` | `/api/v1/auth/login` | Authenticate user credentials and return JWT access token |
| `GET` | `/api/v1/auth/me` | Fetch authenticated user profile (Bearer token required) |
| `POST` | `/api/v1/auth/forgot-password` | Generate signed password reset token (SMTP email integration) |
| `POST` | `/api/v1/auth/reset-password` | Reset password using valid signed reset token |
| `POST` | `/api/v1/predict` | Classify food quality from uploaded image (multipart/form-data) |
| `GET` | `/api/v1/history` | User-scoped paginated prediction history with class/model filters |
| `GET` | `/api/v1/history/{id}` | Detailed inspection of user's past classification |
| `DELETE`| `/api/v1/history/{id}` | Delete user's prediction record and its preview image |
| `DELETE`| `/api/v1/history` | Clear user's prediction history |
| `GET` | `/api/v1/analytics` | User-scoped statistics, class percentages, latency, and trends |
| `GET` | `/api/v1/models` | List available architectures, metadata, and active model status |
| `POST` | `/api/v1/models/switch` | Switch active inference model (`best`, `cnn`, or `efficientnet`) |
| `GET` | `/api/v1/health` | Service health check (DB connectivity & model readiness) |

### 3. ML Pipeline Execution (Training & Evaluation)
In a dedicated PowerShell window:
```powershell
cd ml

# 1. Install ML dependencies
pip install -r requirements.txt

# 2. Compile syntax check
python -m py_compile ml/src/*.py

# 3. Validate and prepare dataset (once images are placed in ml/data/raw/)
python ml/src/validate_dataset.py
python ml/src/prepare_dataset.py

# 4. Train Deep Learning Models
# Baseline Custom CNN (CPU-friendly: --batch-size 16)
python ml/src/train.py --model cnn --epochs 20 --batch-size 32

# Transfer Learning EfficientNetB0 (ImageNet pretrained weights)
python ml/src/train.py --model efficientnet --epochs 20 --batch-size 32

# Train both architectures sequentially
python ml/src/train.py --model both --epochs 20 --batch-size 32

# 5. Model Evaluation and Selection
python ml/src/evaluate.py --model both

# 6. Single Image Quality Prediction
python ml/src/predict.py --image "sample_food.jpg" --model best

# 7. Run Complete Unit & Integration Test Suite
python -m unittest discover -s ml/tests -p "test_*.py"
```

> **CPU & Limited Memory Recommendations**:
> For machines without dedicated GPUs or with limited RAM (<8GB), use `--batch-size 16` and `--epochs 10` to avoid memory pressure during training.

### 4. Frontend Setup
In a dedicated PowerShell window:
```powershell
cd frontend

# Install npm dependencies
npm install

# Copy environment config
copy .env.example .env

# Run development server
npm run dev
```

---

## 🗺️ Development Roadmap

- [x] **Phase 1: Project Scaffolding & Setup**
  - Created modular folder hierarchy (`backend`, `frontend`, `ml`).
  - Configured dependency manifests (`requirements.txt`, `package.json`).
  - Added environment templates (`.env.example`), `.gitignore`, and documentation.
- [x] **Phase 2: Dataset Selection & Preparation**
  - Identified and verified public Fruits & Vegetables Fresh/Rotten Kaggle datasets with licensing details.
  - Implemented dataset configuration (`ml/src/dataset_config.py`) with 70/15/15 stratified splits and seed 42.
  - Implemented automated dataset validation (`ml/src/validate_dataset.py`) generating `validation_report.json`.
  - Implemented dataset preparation (`ml/src/prepare_dataset.py`) with duplicate hashing and manifest generation.
- [x] **Phase 3: Model Architecture, Training & Evaluation**
  - Implemented Custom CNN architecture (`ml/src/cnn_model.py`) with Conv2D, BatchNorm, Dropout, GAP, and Softmax.
  - Implemented EfficientNetB0 transfer learning architecture (`ml/src/efficientnet_model.py`) with ImageNet pretrained weights and optional fine-tuning.
  - Built training pipeline (`ml/src/train.py`) with EarlyStopping, ModelCheckpoint, ReduceLROnPlateau, and CSVLogger.
  - Built evaluation pipeline (`ml/src/evaluate.py`) with Scikit-learn metrics, confusion matrices, training curves, and best model selection.
  - Implemented inference module (`ml/src/predict.py`) and FastAPI backend integration service (`backend/app/services/prediction_service.py`).
  - Implemented and executed comprehensive unit test suite (`ml/tests/test_model_pipeline.py`).
- [x] **Phase 4: FastAPI Backend & SQLite Database**
  - Configured SQLite database with SQLAlchemy sessionmaker and thread-safe engine (`backend/app/core/database.py`).
  - Created `PredictionRecord` ORM entity with indexing on timestamps and classes (`backend/app/models/prediction.py`).
  - Implemented complete REST endpoints: `/api/v1/predict`, `/history`, `/analytics`, `/models`, and `/health`.
  - Implemented validation for uploaded files (10MB limit, Pillow integrity verification) and graceful 503 handling when models are missing.
  - Built comprehensive unit & integration test suite (`backend/tests/test_backend_api.py`).
- [x] **Phase 5: Responsive React Dashboard**
  - Implemented modern Dark-Mode Dashboard with Tailwind CSS, Lucide React, and Recharts.
  - Interactive Produce Image Upload with drag-and-drop, client-side validation, and image preview.
  - WebRTC live camera capture modal (`CameraModal.jsx`).
  - Real-time classification confidence bars and probability distribution.
  - Analytics dashboard with Recharts Quality Distribution (Pie) and Activity Timeline (Area) visualizations.
  - Complete prediction history table with class filters (`ALL`, `Fresh`, `Spoiled`), search, pagination, thumbnail lightbox, and individual/bulk deletion.
  - Active model management interface with runtime switcher (`best`, `cnn`, `efficientnet`) and Windows CLI training guidance.
  - Methodology, dataset documentation, and prominent food safety disclaimers (`AboutPage.jsx`).
- [x] **Phase 6: Integration Testing & Verification**
  - Verified backend REST API endpoints (`/predict`, `/history`, `/analytics`, `/models`, `/health`).
  - Verified SQLite persistence, query filtering, and audit trail deletion.
  - Verified fail-fast image integrity validation with Pillow and graceful HTTP 503 handling when models are uninitialized.
  - 100% test pass rate across backend test suite (`backend/tests/test_backend_api.py`) and ML test suite (`ml/tests/test_model_pipeline.py`).
  - Verified clean production compilation of frontend bundle via `npm run build` with zero syntax or bundling errors.
- [x] **Phase 7: Final Documentation & Deployment Readiness**
  - Created end-to-end user and developer guides, verified environment configuration, and submission-ready verification checklist.
- [x] **Phase 8: Production Cloud Deployment (GitHub, Render, Vercel)**
  - Hardened CORS, SPA routing (`vercel.json`), and PostgreSQL/SQLite dual-engine database layer.
  - Formatted Render Blueprint (`render.yaml`) for zero-touch backend deployment.

---

## 🚀 Cloud Deployment Guide

### Architecture Overview

```
                      ┌────────────────────────────────────────┐
                      │             Vercel Frontend            │
                      │  (React 18 + Vite + Tailwind CSS SPA)  │
                      └──────────────────┬─────────────────────┘
                                         │ HTTPS / CORS
                                         ▼
                      ┌────────────────────────────────────────┐
                      │              Render Backend            │
                      │  (FastAPI + Uvicorn + TensorFlow ML)   │
                      └──────────────────┬─────────────────────┘
                                         │
                         ┌───────────────┴───────────────┐
                         ▼                               ▼
             ┌───────────────────────┐       ┌───────────────────────┐
             │ SQLite (Default Free) │  OR   │ Render PostgreSQL     │
             │ Container Filesystem  │       │ (Managed Persistence) │
             └───────────────────────┘       └───────────────────────┘
```

---

### Step 1: Deploy Backend to Render

1. Log in to [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** → **Web Service**.
3. Connect your GitHub repository.
4. Configure service settings:
   - **Name**: `food-quality-backend`
   - **Region**: Oregon (or nearest)
   - **Branch**: `main`
   - **Root Directory**: `.` *(leave blank or set to `.` so `ml/models` is accessible)*
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
5. Configure Environment Variables in the Render dashboard:
   | Variable | Value | Description |
   | :--- | :--- | :--- |
   | `PYTHON_VERSION` | `3.10.12` | Ensures pre-built TensorFlow binary wheels install cleanly |
   | `DATABASE_URL` | `sqlite:///./food_quality.db` | Default SQLite (or paste your PostgreSQL internal connection URL) |
   | `JWT_SECRET_KEY` | *(Generate a 32+ char random string)* | Used for signing authentication tokens |
   | `CORS_ORIGINS` | `*` *(or your Vercel URL)* | Allowed frontend origins |
6. Click **Create Web Service**. Wait for the build and deployment to succeed.
7. Note down your backend URL (e.g. `https://food-quality-backend.onrender.com`).
8. Verify health endpoint: `https://YOUR-RENDER-BACKEND.onrender.com/api/v1/health`

---

### Step 2: Deploy Frontend to Vercel

1. Log in to [Vercel Dashboard](https://vercel.com/).
2. Click **Add New...** → **Project**.
3. Import your GitHub repository.
4. In the Project Configuration:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click Edit and select `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. In **Environment Variables**, add:
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: `https://YOUR-RENDER-BACKEND.onrender.com/api/v1` *(replace with actual Render URL)*
6. Click **Deploy**.
7. Once deployed, open your live Vercel URL (e.g., `https://food-quality-app.vercel.app`).
