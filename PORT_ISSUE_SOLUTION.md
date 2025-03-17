# Fixing Port Issues with Expo

## Problem
When trying to start the Expo app with `npx expo start --clear`, you're encountering port conflicts with error messages like:

```
Port 8081 is being used by another process
√ Use port 8086 instead? ... no
› Skipping dev server
```

## Solution

### Option 1: Kill Processes Using Required Ports (PowerShell)

1. Open PowerShell as Administrator
2. Run the following commands to identify and kill processes on each port:

```powershell
# For each port from 8080 to 8086
foreach ($port in 8080..8086) {
    Write-Host "Checking port $port..."
    $processInfo = netstat -ano | findstr ":$port "
    if ($processInfo) {
        $processId = ($processInfo -split '\s+')[-1]
        Write-Host "Killing process on port $port (PID: $processId)"
        taskkill /F /PID $processId
    } else {
        Write-Host "No process found on port $port"
    }
}
```

### Option 2: Use a Different Port

Start Expo with a specific port that's unlikely to be in use:

```
npx expo start --port 19000 --clear
```

### Option 3: Accept the Alternative Port

When Expo asks if you want to use an alternative port, simply accept it by typing "y" instead of "n":

```
Port 8081 is being used by another process
√ Use port 8086 instead? ... yes
```

### Option 4: Use a Port Management Tool

Install and use `kill-port` globally:

```
npm install -g kill-port
kill-port 8080 8081 8082 8083 8084 8085 8086
```

## Restart Your Computer (Last Resort)

If all else fails, restart your computer to free up all ports and processes.

## How to Prevent Port Conflicts

1. Always properly shut down Expo processes with Ctrl+C before closing terminals
2. Check for zombie Node.js processes in Task Manager and end them
3. Avoid running multiple instances of development servers at the same time 