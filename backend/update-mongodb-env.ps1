$connectionString = "mongodb+srv://salman:salman1122@cluster0.tatwtcz.mongodb.net/ajltours?retryWrites=true&w=majority"
Write-Host "Adding MONGODB_URI environment variable..."
Write-Host "Connection String: $connectionString"
Write-Host ""
Write-Host "Please run this command manually in your terminal:"
Write-Host "vercel env add MONGODB_URI production"
Write-Host ""
Write-Host "When prompted, paste this connection string:"
Write-Host $connectionString

