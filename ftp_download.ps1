$ftpUrl = "ftp://ftp.santinibodyart.com/index.html"
$username = "agent@santinibodyart.com"
$password = "241094Luckas*"
$localPath = "c:\Users\Lucas Silva\Documents\qr-trans\index_ftp.html"

$webClient = New-Object System.Net.WebClient
$webClient.Credentials = New-Object System.Net.NetworkCredential($username, $password)
$webClient.DownloadFile($ftpUrl, $localPath)
Write-Host "Download complete"
