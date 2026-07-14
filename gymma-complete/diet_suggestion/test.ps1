$registerBody = @{
    fullName = "Test User"
    phone = "9876543015"
    password = "Password123"
} | ConvertTo-Json

Write-Host "1. Registering new member to get token..." -ForegroundColor Cyan

try {
    $register = Invoke-RestMethod -Uri http://localhost:4000/api/v1/auth/register -Method Post -Body $registerBody -ContentType "application/json"
    $token = $register.data.accessToken
    Write-Host "✅ Registration Successful!" -ForegroundColor Green
} catch {
    Write-Host "❌ Registration failed: $_" -ForegroundColor Red
    exit
}

$dietBody = @{
    age = 25
    gender = "male"
    weightKg = 70
    heightCm = 175
    goal = "lose_fat"
    activityKey = "moderately_active"
    dietaryPattern = "omnivore"
} | ConvertTo-Json

Write-Host "`n2. Calculating Diet Plan..." -ForegroundColor Cyan

try {
    $diet = Invoke-RestMethod -Uri http://localhost:4000/api/v1/diet/calculate -Method Post -Body $dietBody -ContentType "application/json" -Headers @{ Authorization = "Bearer $token" }
    Write-Host "✅ Diet Calculation Successful!" -ForegroundColor Green
    Write-Host "`n--- YOUR RESULTS ---" -ForegroundColor Yellow
    Write-Host "BMR: $($diet.data.bmr) kcal"
    Write-Host "TDEE: $($diet.data.tdee) kcal"
    Write-Host "Target Calories: $($diet.data.targetCalories) kcal"
    Write-Host "Protein: $($diet.data.macros.proteinG)g | Carbs: $($diet.data.macros.carbsG)g | Fat: $($diet.data.macros.fatG)g"
    Write-Host "--------------------`n" -ForegroundColor Yellow
} catch {
    Write-Host "❌ Diet calc failed: $_" -ForegroundColor Red
}
