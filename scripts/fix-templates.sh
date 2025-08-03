#!/bin/bash
echo "🚀 ViewsBoost Template Fix - One Command Setup"
echo "=============================================="

# Check if we're on macOS and offer to install gcloud
if [[ "$OSTYPE" == "darwin"* ]]; then
  if ! command -v gsutil &> /dev/null; then
    echo "📦 Installing Google Cloud SDK..."
    brew install google-cloud-sdk
  fi
fi

# Run the setup
node scripts/setup-cors.js

echo ""
echo "✅ Done! Refresh your browser to see template thumbnails!"