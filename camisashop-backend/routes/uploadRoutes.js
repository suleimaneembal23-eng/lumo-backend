// routes/uploadRoutes.js
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();

const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Configuração do armazenamento com Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); // pasta uploads/
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// Filtro para aceitar apenas imagens
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error("Apenas arquivos de imagem (jpg, jpeg, png, webp) são permitidos!"));
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Endpoint de upload (single image)
router.post("/", upload.single("image"), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Nenhum arquivo enviado." });

    const fullUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    // Return key 'imageUrl' to match frontend expectation
    res.json({ imageUrl: fullUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao fazer upload da imagem." });
  }
});

module.exports = router;
