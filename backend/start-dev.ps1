$ErrorActionPreference = "Stop"

$backendDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$pythonExe = Join-Path $backendDir "venv\Scripts\python.exe"

if (-not (Test-Path $pythonExe)) {
    throw "Virtual environment not found at $pythonExe"
}

$services = @(
    @{
        Name = "PlaytoPay Django"
        Command = "& '$pythonExe' manage.py runserver"
    },
    @{
        Name = "PlaytoPay Celery Worker"
        Command = "& '$pythonExe' -m celery -A config worker --loglevel=info --pool=solo"
    },
    @{
        Name = "PlaytoPay Celery Beat"
        Command = "& '$pythonExe' -m celery -A config beat --loglevel=info"
    }
)

foreach ($service in $services) {
    Start-Process powershell -WorkingDirectory $backendDir -ArgumentList @(
        "-NoExit",
        "-Command",
        "$host.UI.RawUI.WindowTitle = '$($service.Name)'; $($service.Command)"
    )
}

Write-Host "Started Django, Celery worker, and Celery beat in separate terminals."
Write-Host "Make sure Redis or Memurai is already running on localhost:6379."
