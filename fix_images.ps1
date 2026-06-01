# Helper script to move images from the AI brain folder to the project images folder
# This is necessary because browsers block loading local files (file://) for security.

$brainDir = "C:\Users\ELCOT\.gemini\antigravity\brain\57059171-229e-43b0-946f-16f49a1d5b09"
$oldBrainDir = "C:\Users\ELCOT\.gemini\antigravity\brain\5dd2a85f-d85b-403c-a33c-dd2bb74757fa"
$targetDir = "d:\justcook\images"

if (!(Test-Path $targetDir)) {
    New-Item -ItemType Directory -Force -Path $targetDir
}

# Copy Latest Hero Images (Turn 15)
Copy-Item "$brainDir\media_57059171-229e-43b0-946f-16f49a1d5b09_1777755502626.jpg" "$targetDir\hero_1.jpg" -Force
Copy-Item "$brainDir\media_57059171-229e-43b0-946f-16f49a1d5b09_1777755513258.jpg" "$targetDir\hero_2.jpg" -Force
Copy-Item "$brainDir\media_57059171-229e-43b0-946f-16f49a1d5b09_1777755523171.jpg" "$targetDir\hero_3.jpg" -Force
Copy-Item "$brainDir\media_57059171-229e-43b0-946f-16f49a1d5b09_1777755531980.jpg" "$targetDir\hero_4.jpg" -Force

Write-Host "Images moved successfully! Please refresh your browser."
