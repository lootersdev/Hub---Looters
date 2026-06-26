$token = $env:GITHUB_TOKEN
if (-not $token) { Write-Host "❌ GITHUB_TOKEN manquant"; exit 1 }
git add .
git commit -m "update"
git remote set-url origin "https://lootersdev:$token@github.com/lootersdev/Hub---Looters.git"
git push origin main
git remote set-url origin "https://github.com/lootersdev/Hub---Looters.git"
Write-Host "✅ Déployé !"
