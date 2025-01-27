const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3000;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage });

app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

app.post("/upload", upload.single("file"), (req, res) => {
  res.status(200).json({
    message: "File uploaded successfully!",
    filename: req.file.originalname,
  });
});

app.get("/files", (req, res) => {
  const uploadDir = path.join(__dirname, "uploads");
  fs.readdir(uploadDir, (err, files) => {
    if (err) {
      return res.status(500).json({ message: "Unable to list files" });
    }
    res.json(files);
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
