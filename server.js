const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const WebSocket = require("ws");

const app = express();
const PORT = 3000;

// Configure WebSocket server
const wss = new WebSocket.Server({ noServer: true });
const clients = new Set();

wss.on("connection", (ws) => {
  clients.add(ws);
  ws.on("close", () => clients.delete(ws));
});

const notifyClients = () => {
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send("update");
    }
  }
};

// Configure storage for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => cb(null, file.originalname),
});
const upload = multer({ storage });

app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

// Handle file uploads
app.post("/upload", upload.single("file"), (req, res) => {
  const userName = req.body.name || "Anonymous";
  const fileName = req.file.originalname;
  const fileSize = req.file.size;

  // Log the upload details
  console.log(`File uploaded by ${userName}:`);
  console.log(`  - File Name: ${fileName}`);
  console.log(`  - File Size: ${fileSize} bytes`);

  res.status(200).json({ message: "File uploaded successfully!" });
  notifyClients(); // Notify clients about the new file
});

// Serve the list of files
app.get("/files", (req, res) => {
  const uploadDir = path.join(__dirname, "uploads");
  fs.readdir(uploadDir, (err, files) => {
    if (err) return res.status(500).json({ message: "Unable to list files" });
    res.json(files);
  });
});

// Handle WebSocket upgrade
const server = app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

server.on("upgrade", (req, socket, head) => {
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit("connection", ws, req);
  });
});
