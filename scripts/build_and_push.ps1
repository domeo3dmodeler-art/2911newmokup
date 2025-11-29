Param(
  [string]$ImageName = "app",
  [string]$Tag = "latest"
)

$Registry = "cr.yandex/crpuein3jvjccnafs2vc"
$FullImage = "$Registry/$ImageName:$Tag"

Write-Host "Building $FullImage..."
docker build -t $FullImage .

Write-Host "Pushing $FullImage..."
docker push $FullImage

Write-Host "Done."

