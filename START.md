# Start Guide

## One Command

From the project root:

```powershell
cd C:\Users\HP\Downloads\playotPay
.\start-project.ps1
```

This will:

1. create the backend virtual environment if missing
2. install backend dependencies
3. run database migrations
4. install frontend dependencies if needed
5. start Django
6. start Celery worker
7. start Celery beat
8. start the React frontend

Frontend:

`http://127.0.0.1:5173`

Backend API:

`http://127.0.0.1:8000`

## Reseed Demo Data

If you want to reseed demo data while starting:

```powershell
cd C:\Users\HP\Downloads\playotPay
.\start-project.ps1 -SeedDemo
```

## Requirement

Redis or Memurai should be running on:

`127.0.0.1:6379`

Without Redis, payouts may remain in hold or pending state because Celery background processing will not complete.

## Manual Start

If you want to start services manually:

### Backend

```powershell
cd C:\Users\HP\Downloads\playotPay\backend
py -3.12 -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Celery Worker

```powershell
cd C:\Users\HP\Downloads\playotPay\backend
.\venv\Scripts\Activate.ps1
celery -A config worker --loglevel=info --pool=solo
```

### Celery Beat

```powershell
cd C:\Users\HP\Downloads\playotPay\backend
.\venv\Scripts\Activate.ps1
celery -A config beat --loglevel=info
```

### Frontend

```powershell
cd C:\Users\HP\Downloads\playotPay\frontend
npm install
npm run dev
```
