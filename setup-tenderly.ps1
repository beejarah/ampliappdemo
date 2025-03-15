# PowerShell script to add Tenderly to PATH

# Define the path to the Tenderly executable directory
$tenderlyPath = "C:\Users\bjmak\Ampli\Tenderly"

# Check if the Tenderly executable exists
$tenderlyExe = Join-Path -Path $tenderlyPath -ChildPath "tenderly.exe"
if (-Not (Test-Path $tenderlyExe)) {
    Write-Host "ERROR: Tenderly executable not found at $tenderlyExe" -ForegroundColor Red
    exit 1
}

# Get the current PATH
$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")

# Check if the path is already in PATH
if ($currentPath -like "*$tenderlyPath*") {
    Write-Host "Tenderly path is already in your PATH environment variable." -ForegroundColor Green
} else {
    # Add the path to the current PATH
    $newPath = $currentPath + ";" + $tenderlyPath
    
    # Update the PATH environment variable for the current user
    [Environment]::SetEnvironmentVariable("Path", $newPath, "User")
    
    Write-Host "Tenderly path has been added to your PATH environment variable." -ForegroundColor Green
    Write-Host "You'll need to restart any open command prompts or PowerShell windows for this change to take effect." -ForegroundColor Yellow
}

# Verify Tenderly CLI works
try {
    & "$tenderlyExe" --version
    Write-Host "Tenderly CLI is working correctly." -ForegroundColor Green
    
    Write-Host "`nNext steps:" -ForegroundColor Cyan
    Write-Host "1. Restart your command prompt or PowerShell window" -ForegroundColor Cyan
    Write-Host "2. Run 'tenderly login' to authenticate" -ForegroundColor Cyan
    Write-Host "3. Create a directory for your Web3 Actions project with 'mkdir web3-actions && cd web3-actions'" -ForegroundColor Cyan
    Write-Host "4. Initialize your project with 'tenderly actions init --template onboarding'" -ForegroundColor Cyan
    Write-Host "5. Deploy your actions with 'tenderly actions deploy'" -ForegroundColor Cyan
} catch {
    Write-Host "ERROR: Failed to run Tenderly CLI. Please check the installation." -ForegroundColor Red
} 