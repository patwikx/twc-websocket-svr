const { Server } = require("socket.io");
const http = require("http");

const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";

// Create HTTP server
const httpServer = http.createServer((req, res) => {
  // Health check endpoint
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", timestamp: new Date().toISOString() }));
    return;
  }
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("POS Socket Server Running");
});

// Create Socket.io server
const io = new Server(httpServer, {
  cors: {
    origin: CORS_ORIGIN === "*" ? "*" : CORS_ORIGIN.split(","),
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Track connected clients by outlet
const outletRooms = new Map();

io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Join outlet room for targeted broadcasts
  socket.on("join:outlet", (outletId) => {
    socket.join(`outlet:${outletId}`);
    console.log(`Socket ${socket.id} joined outlet:${outletId}`);
  });

  // Table status update - broadcast to all clients in same outlet
  socket.on("table:update", (data) => {
    const { outletId, tableId, status, orderId } = data;
    console.log(`Table update: ${tableId} -> ${status} in outlet ${outletId}`);
    
    // Broadcast to all clients in the same outlet (except sender)
    socket.to(`outlet:${outletId}`).emit("table:updated", {
      tableId,
      status,
      orderId,
      timestamp: new Date().toISOString(),
    });
  });

  // Order update - broadcast to all clients in same outlet
  socket.on("order:update", (data) => {
    const { outletId, orderId, action, orderData } = data;
    console.log(`Order update: ${orderId} - ${action} in outlet ${outletId}`);
    
    socket.to(`outlet:${outletId}`).emit("order:updated", {
      orderId,
      action, // 'created', 'updated', 'paid', 'cancelled'
      orderData,
      timestamp: new Date().toISOString(),
    });
  });

  // Full table refresh request
  socket.on("tables:refresh", (data) => {
    const { outletId } = data;
    console.log(`Tables refresh requested for outlet ${outletId}`);
    
    // Tell all clients in outlet to refresh their table data
    io.to(`outlet:${outletId}`).emit("tables:refresh-all");
  });

  socket.on("disconnect", (reason) => {
    console.log(`Client disconnected: ${socket.id} - ${reason}`);
  });
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`🚀 POS Socket Server running on port ${PORT}`);
  console.log(`   CORS Origin: ${CORS_ORIGIN}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down...");
  io.close(() => {
    httpServer.close(() => {
      console.log("Server closed");
      process.exit(0);
    });
  });
});
