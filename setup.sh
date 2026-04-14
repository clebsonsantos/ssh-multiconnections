#!/bin/bash
# Install Tauri system dependencies on Debian/Ubuntu/WSL
set -e

echo "==> Installing Tauri system dependencies..."
sudo apt-get update
sudo apt-get install -y \
  libwebkit2gtk-4.1-dev \
  libgtk-3-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev \
  patchelf \
  build-essential \
  libssl-dev \
  pkg-config

echo "==> Installing Rust (if not present)..."
if ! command -v cargo &>/dev/null; then
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
  source "$HOME/.cargo/env"
fi

echo "==> Adding build targets..."
rustup target add x86_64-unknown-linux-gnu

echo ""
echo "==> For Windows cross-compilation, also run:"
echo "    sudo apt-get install -y mingw-w64"
echo "    rustup target add x86_64-pc-windows-gnu"
echo ""
echo "==> Installing npm dependencies..."
npm install

echo ""
echo "==> All done! Run 'npm run tauri:dev' to start development."
