# Test Backend API with PowerShell

$body = @{
    endpointName = "fraud-detection-model-2025-11-11-13-30-24"
    features = @(0.0,-1.359807,-0.072781,2.536347,1.378155,-0.338321,0.462388,0.239599,0.098698,0.363787,0.090794,-0.551600,-0.617801,-0.991390,-0.311169,1.468177,-0.470401,0.207971,0.025791,0.403993,0.251412,-0.018307,0.277838,-0.110474,0.066928,0.128539,-0.189115,0.133558,-0.021053,149.62)
} | ConvertTo-Json

Write-Host "Testing backend API..." -ForegroundColor Yellow
Write-Host "URL: http://frauddetection-env.eba-43pmkezt.us-east-1.elasticbeanstalk.com/api/predict" -ForegroundColor Cyan

try {
    $response = Invoke-WebRequest -Uri "http://frauddetection-env.eba-43pmkezt.us-east-1.elasticbeanstalk.com/api/predict" -Method POST -Body $body -ContentType "application/json"
    
    Write-Host "`n✅ SUCCESS!" -ForegroundColor Green
    Write-Host "Status Code: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "`nResponse:" -ForegroundColor Cyan
    Write-Host $response.Content
} catch {
    Write-Host "`n❌ ERROR!" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    Write-Host "Error Message: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "`nResponse Body:" -ForegroundColor Yellow
        Write-Host $responseBody
    }
}

