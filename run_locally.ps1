# run_locally.ps1

# 1. Print nice header
Write-Host "=============================================" -ForegroundColor Green
Write-Host "      InsightLoop Local Runner Script        " -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

# 2. Check if local MySQL is running
Write-Host "Checking if local MySQL service (wampmysqld64) is running..." -ForegroundColor Cyan
$mysqlService = Get-Service -Name "wampmysqld64" -ErrorAction SilentlyContinue
if ($null -eq $mysqlService) {
    # If not wampmysqld64, check for any service containing 'mysql' or 'mariadb'
    $mysqlService = Get-Service -Name "*mysql*", "*mariadb*" -ErrorAction SilentlyContinue | Select-Object -First 1
}

if ($null -ne $mysqlService) {
    if ($mysqlService.Status -ne 'Running') {
        Write-Warning "MySQL service '$($mysqlService.Name)' is found but is NOT running. Current status: $($mysqlService.Status)."
        Write-Warning "Please start your MySQL server (e.g., via WampServer, XAMPP, or Services.msc) and run this script again."
    } else {
        Write-Host "Found running MySQL service: $($mysqlService.DisplayName) ($($mysqlService.Name))" -ForegroundColor Green
    }
} else {
    Write-Warning "Could not detect a local MySQL Windows service. Assuming you have MySQL running on port 3306."
}

# 3. Load .env file
if (Test-Path ".env") {
    Write-Host "Loading environment variables from .env..." -ForegroundColor Cyan
    Get-Content .env | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#")) {
            if ($line -match '^\s*([^#=\s]+)\s*=\s*(.*)$') {
                $name = $Matches[1].Trim()
                $value = $Matches[2].Trim()
                # Remove surrounding quotes if any
                $value = $value -replace "^['`"]|['`"]$"
                Set-Item -Path "env:$name" -Value $value
                Write-Host "  Loaded: $name" -ForegroundColor DarkGray
            }
        }
    }
} else {
    Write-Warning ".env file not found. Copying .env.example to .env..."
    Copy-Item .env.example .env
    # Reload env
    Get-Content .env | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#")) {
            if ($line -match '^\s*([^#=\s]+)\s*=\s*(.*)$') {
                $name = $Matches[1].Trim()
                $value = $Matches[2].Trim()
                $value = $value -replace "^['`"]|['`"]$"
                Set-Item -Path "env:$name" -Value $value
            }
        }
    }
}

# 4. Find Maven executable
Write-Host "Locating Maven..." -ForegroundColor Cyan
$mvn = Get-Command mvn -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source -First 1
if (-not $mvn) {
    # Check JetBrains IntelliJ directory
    $mvn = Get-ChildItem -Path "C:\Program Files\JetBrains" -Filter "mvn.cmd" -Recurse -ErrorAction SilentlyContinue | Select-Object -ExpandProperty FullName -First 1
}

if (-not $mvn) {
    Write-Error "Maven (mvn or mvn.cmd) not found on PATH or in C:\Program Files\JetBrains."
    Write-Host "Please install Maven, or install IntelliJ IDEA Community/Ultimate, or edit this script with the path to your mvn.cmd." -ForegroundColor Yellow
    exit 1
}
Write-Host "Using Maven: $mvn" -ForegroundColor Green

# 5. Find Node.js
Write-Host "Locating Node.js..." -ForegroundColor Cyan
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
    Write-Error "Node.js (node) not found on PATH. Node.js is required to run the frontend."
    exit 1
}
Write-Host "Using Node.js: $($node.Source)" -ForegroundColor Green

# 6. Start backend services
$services = @(
    @{ name = "auth-service"; path = "services/auth-service" },
    @{ name = "feedback-service"; path = "services/feedback-service" },
    @{ name = "validation-service"; path = "services/validation-service" },
    @{ name = "escalation-service"; path = "services/escalation-service" },
    @{ name = "api-gateway"; path = "services/api-gateway" }
)

Write-Host "Starting backend services..." -ForegroundColor Cyan
foreach ($svc in $services) {
    Write-Host "  Starting $($svc.name)..." -ForegroundColor Green
    $svcPath = Resolve-Path $svc.path
    # Start Maven in a new command window
    Start-Process cmd -ArgumentList "/k", "title $($svc.name) && cd /d `"$svcPath`" && `"$mvn`" spring-boot:run"
    Start-Sleep -Seconds 2 # Stagger start times slightly
}

# 7. Start frontend
Write-Host "Starting frontend Angular application..." -ForegroundColor Cyan
$frontendPath = Resolve-Path "frontend"
Start-Process cmd -ArgumentList "/k", "title frontend-angular && cd /d `"$frontendPath`" && npm start -- --proxy-config proxy.conf.json"

Write-Host "=============================================" -ForegroundColor Green
Write-Host "All services started in separate windows!" -ForegroundColor Green
Write-Host "Please check each console window for logs/errors." -ForegroundColor Yellow
Write-Host "=============================================" -ForegroundColor Green
Write-Host "Access URLs:" -ForegroundColor Cyan
Write-Host "  Frontend SPA:        http://localhost:4200" -ForegroundColor Green
Write-Host "  API Gateway:         http://localhost:8080" -ForegroundColor Green
Write-Host "  Auth Swagger:        http://localhost:8081/swagger-ui.html" -ForegroundColor Green
Write-Host "  Feedback Swagger:    http://localhost:8082/swagger-ui.html" -ForegroundColor Green
Write-Host "  Validation Swagger:  http://localhost:8083/swagger-ui.html" -ForegroundColor Green
Write-Host "  Escalation Swagger:  http://localhost:8084/swagger-ui.html" -ForegroundColor Green
Write-Host ""
Write-Host "Seed Credentials:" -ForegroundColor Cyan
Write-Host "  ADMIN:   admin@insightloop.com / Admin@123" -ForegroundColor Green
Write-Host "  MANAGER: manager@insightloop.com / Manager@123" -ForegroundColor Green
Write-Host "  AGENT:   agent@insightloop.com / Agent@123" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
