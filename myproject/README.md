# AgriBalance AI

Production-ready Django REST + React dashboard for Karnataka agriculture intelligence.

## Stack

- Backend: Django REST Framework, JWT authentication, PostgreSQL
- Frontend: React, TailwindCSS, Chart.js, Leaflet, OpenStreetMap
- AI: Python-ready stack with Pandas, NumPy, Scikit-Learn, TensorFlow, OpenCV, XGBoost
- External data: OpenWeather, NASA Earth, SoilGrids, AGMARKNET/data.gov.in

## Environment

API keys live in `.env`. Use `.env.example` as the safe template for production values.

Required keys:

- `OPENWEATHER_API_KEY`
- `NASA_API_KEY`
- `SOIL_API_KEY`
- `DATA_GOV_API_KEY` when your data.gov.in account requires one

## Backend API

- `GET /api/health/`
- `GET /api/weather/current/?lat=12.9716&lon=77.5946`
- `GET /api/weather/forecast/?lat=12.9716&lon=77.5946`
- `GET /api/earth/imagery/?lat=12.9716&lon=77.5946`
- `GET /api/soil/profile/?lat=12.9716&lon=77.5946`
- `GET /api/market/prices/?state=Karnataka&district=Mysuru&commodity=Rice`
- `POST /api/ai/yield-prediction/`
- `POST /api/auth/register/`
- `POST /api/auth/login/`
- `POST /api/auth/token/refresh/`
- `GET /api/auth/me/`

## Local Development

```bash
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

```bash
cd frontend
npm install
npm run dev
```

## Docker

```bash
docker compose up --build
```

Backend runs on `http://localhost:8000`, frontend on `http://localhost:5173`.
