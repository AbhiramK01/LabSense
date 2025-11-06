#!/bin/bash
# Extract tunnel URL from logs

# Start tunnel in background
npx cloudflared tunnel --url http://localhost:8000 > tunnel.log 2>&1 &
TUNNEL_PID=$!

echo "⏳ Starting tunnel... (waiting for URL to appear)"
echo ""

# Wait for URL to appear (retry up to 15 times, 2 seconds each = 30 seconds max)
MAX_RETRIES=15
RETRY_COUNT=0
TUNNEL_URL=""

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    sleep 2
    TUNNEL_URL=$(grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' tunnel.log | head -1)
    
    if [ -n "$TUNNEL_URL" ]; then
        break
    fi
    
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo -n "."
done

echo ""

if [ -z "$TUNNEL_URL" ]; then
    echo "❌ Could not extract tunnel URL after 30 seconds"
    echo "📋 Check tunnel.log for details:"
    tail -30 tunnel.log
    echo ""
    echo "💡 Try running the tunnel manually to see the URL:"
    echo "   npx cloudflared tunnel --url http://localhost:8000"
    kill $TUNNEL_PID 2>/dev/null
    exit 1
fi

echo ""
echo "✅ Tunnel URL: $TUNNEL_URL"
echo "📝 Update VITE_API_BASE in Cloudflare Pages to: ${TUNNEL_URL}/api"
echo "💡 Tunnel PID: $TUNNEL_PID"
echo "💾 URL saved to .tunnel_url.txt"
echo ""

# Save URL to file
echo "$TUNNEL_URL" > .tunnel_url.txt

