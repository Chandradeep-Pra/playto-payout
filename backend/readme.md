# Playto Payout Engine — Setup Guide

This guide explains how to set up and run the project locally.

## Requirements

Install:

- Python 3.12
- Redis (or Memurai on Windows)
- Virtual environment support (venv)

## Setup Steps

Run the following commands from inside the `backend` folder:

```powershell
py -3.12 -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py makemigrations
python manage.py migrate
python manage.py seed_demo
python manage.py runserver
```

Server will run at:

http://127.0.0.1:8000

## Install Redis (Windows)

Install Memurai (Redis-compatible):

```powershell
winget install Memurai.MemuraiDeveloper
```

Verify installation:

```powershell
memurai-cli ping
```

Expected output:

```
PONG
```

## Start Background Workers

Open two new terminals inside the `backend` folder.

Terminal 1:

```powershell
.\venv\Scripts\Activate.ps1
celery -A config worker --loglevel=info --pool=solo
```

Terminal 2:

```powershell
.\venv\Scripts\Activate.ps1
celery -A config beat --loglevel=info
```

Note:

`--pool=solo` is required for Windows compatibility.

## Start Everything At Once

From inside the `backend` folder:

```powershell
.\start-dev.ps1
```

This opens separate PowerShell windows for:

1. Django server
2. Celery worker
3. Celery beat

Make sure Redis or Memurai is already running before using it.

## Run Tests

```powershell
python manage.py test
```

## Running the Project

Keep these running:

1. Django server
2. Celery worker
3. Celery beat scheduler

Project is now fully operational locally.

## One-Command Startup

From the project root:

```powershell
.\start-project.ps1
```

To reseed demo data during startup:

```powershell
.\start-project.ps1 -SeedDemo
```
