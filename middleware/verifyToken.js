const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "Comiocudequemleu";

/**
 * ✅ Middleware com suporte a roles.
 *    Pode ser usado como: verifyToken(["admin"]) ou verifyToken(["client"])
 */
const verifyToken = (roles = []) => {
  return (req, res, next) => {
    try {
      console.log("🧩 [verifyToken] Início da verificação...");

      if (req.method === "OPTIONS") {
        console.log("🧩 [verifyToken] OPTIONS request — ignorada.");
        return next();
      }

      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        console.warn("❌ [verifyToken] Token ausente ou formato inválido.");
        return res.status(401).json({ message: "Acesso negado: Token ausente." });
      }

      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      req.userId = decoded.id; // Compatibility for controllers expecting req.userId

      // Verifica roles se necessário
      if (roles.length && !roles.includes(decoded.role)) {
        console.warn(`🚫 [verifyToken] Role '${decoded.role}' não tem permissão.`);
        return res.status(403).json({ message: "Acesso negado: Permissão insuficiente." });
      }

      console.log("✅ [verifyToken] Token e role válidos. Continuando...");
      next();

    } catch (err) {
      console.error("❌ [verifyToken] Erro na verificação do token:", err.message);
      res.status(401).json({ message: "Token inválido ou expirado." });
    }
  };
};

module.exports = verifyToken;
