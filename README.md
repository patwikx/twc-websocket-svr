# POS Socket Server

Real-time WebSocket server for syncing POS terminals and Order Taker pages.

## Local Development

```bash
cd socket-server
npm install
npm start
```

Server runs on `http://localhost:3001`

## Coolify Deployment Guide

### Step 1: Commit and Push

First, commit the `socket-server` folder to your repository:

```bash
git add socket-server/
git commit -m "Add Socket.io server for POS sync"
git push origin main
```

### Step 2: Create New Project in Coolify

1. Go to your Coolify dashboard
2. Click **"+ New Resource"** → **"Docker"** → **"Build Packs" → "Dockerfile"**
3. Connect your GitHub repository
4. Set the **Base Directory** to: `/socket-server`

### Step 3: Configure Build Settings

| Setting             | Value            |
| ------------------- | ---------------- |
| Base Directory      | `/socket-server` |
| Dockerfile Location | `Dockerfile`     |
| Port                | `3001`           |

### Step 4: Environment Variables

Add these environment variables in Coolify:

| Variable      | Value                  | Description                              |
| ------------- | ---------------------- | ---------------------------------------- |
| `PORT`        | `3001`                 | Server port                              |
| `CORS_ORIGIN` | `https://your-app.com` | Your Next.js app URL(s), comma-separated |

**Example for multiple origins:**

```
CORS_ORIGIN=https://your-app.com,https://www.your-app.com
```

### Step 5: Configure Domain (Optional)

**Option A: Subdomain** (Recommended)

- Add domain: `socket.your-domain.com`
- Enable SSL/HTTPS

**Option B: Same Domain, Different Port**

- Use `your-domain.com:3001`
- Note: May require firewall rules

### Step 6: Deploy

1. Click **Deploy**
2. Wait for the build to complete
3. Check health: `https://socket.your-domain.com/health`

### Step 7: Update Next.js Environment

Add to your Next.js `.env`:

```env
NEXT_PUBLIC_SOCKET_URL=wss://socket.your-domain.com
```

For local development:

```env
NEXT_PUBLIC_SOCKET_URL=ws://localhost:3001
```

## Testing

### Health Check

```bash
curl https://socket.your-domain.com/health
# Should return: {"status":"ok","timestamp":"..."}
```

### Browser Console Test

Open browser console on your POS app:

```javascript
const socket = io("wss://socket.your-domain.com");
socket.on("connect", () => console.log("Connected:", socket.id));
socket.emit("join:outlet", "test-outlet-id");
```

## Events

| Event                | Direction        | Description                    |
| -------------------- | ---------------- | ------------------------------ |
| `join:outlet`        | Client → Server  | Join outlet room for updates   |
| `table:update`       | Client → Server  | Send table status change       |
| `table:updated`      | Server → Clients | Receive table status change    |
| `order:update`       | Client → Server  | Send order change              |
| `order:updated`      | Server → Clients | Receive order change           |
| `tables:refresh`     | Client → Server  | Request all clients to refresh |
| `tables:refresh-all` | Server → Clients | Command to refresh table data  |

## Troubleshooting

### Connection Failed

1. Check CORS_ORIGIN matches your app URL exactly
2. Verify WebSocket port is open in firewall
3. Check Coolify logs for errors

### Not Receiving Updates

1. Ensure both clients joined the same outlet: `socket.emit("join:outlet", outletId)`
2. Check browser console for errors
3. Verify the socket is connected: `socket.connected`

### SSL Issues

- Ensure you're using `wss://` (not `ws://`) for HTTPS
- Make sure Coolify SSL is properly configured
