#!/usr/bin/env bash
set -euo pipefail
cd ~/domeo-mvp
git fetch origin
git checkout main
git pull --ff-only
cd app
sudo systemctl restart domeo
