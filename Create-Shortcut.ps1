# Script to create a desktop shortcut for Crypto Orderbook
$DesktopPath = [Environment]::GetFolderPath("Desktop")
$ShortcutPath = "$DesktopPath\Crypto Orderbook.lnk"
$TargetPath = "$PSScriptRoot\start.bat"
$IconLocation = "C:\Windows\System32\shell32.dll,43"  # Globe icon

$WScriptShell = New-Object -ComObject WScript.Shell
$Shortcut = $WScriptShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = $TargetPath
$Shortcut.WorkingDirectory = $PSScriptRoot
$Shortcut.IconLocation = $IconLocation
$Shortcut.Description = "Start Crypto Orderbook (Backend + Frontend)"
$Shortcut.Save()

Write-Host "Desktop shortcut created successfully!" -ForegroundColor Green
Write-Host "Location: $ShortcutPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "You can now double-click 'Crypto Orderbook' on your desktop to start the application." -ForegroundColor Yellow
Read-Host "Press Enter to exit"
