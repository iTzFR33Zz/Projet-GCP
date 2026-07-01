const express = require('express');
const cors = require('cors');
const path = require('path');
const { exec } = require('child_process');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Faille masquée pour valider Gitleaks : le token d'origine a été retiré.
const INTERNAL_TOKEN = "MOCK_TOKEN_HIDDEN_FOR_SECURITY";
const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../frontend')));

// Limitation du taux de requêtes (Rate Limiting)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limite chaque IP à 100 requêtes par fenêtre de 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// WAF Middleware personnalisé
const wafMiddleware = (req, res, next) => {
  // Routes volontairement vulnérables pour le labo (bypass WAF)
  const vulnerableRoutes = ['/api/debug-ping', '/api/welcome'];
  if (vulnerableRoutes.some(route => req.path.startsWith(route))) {
    return next();
  }

  // Regex pour détecter les injections (XSS et exécution de commandes)
  const xssRegex = /<script\b[^>]*>([\s\S]*?)<\/script>|<img\b[^>]*onerror[\s]*=[\s]*|javascript:/i;
  const cmdInjectionRegex = /(;|\|\||&&|`|\$\(|\bcat\b|\bping\b|\bnetcat\b|\bnc\b|\bcurl\b|\bwget\b)/i;

  const checkPayload = (payload) => {
    if (typeof payload === 'string') {
      if (xssRegex.test(payload) || cmdInjectionRegex.test(payload)) {
        return true;
      }
    } else if (typeof payload === 'object' && payload !== null) {
      for (const key in payload) {
        if (checkPayload(payload[key])) return true;
      }
    }
    return false;
  };

  if (checkPayload(req.query) || checkPayload(req.body) || checkPayload(req.params)) {
    return res.status(403).json({
      error: "WAF: Forbidden",
      message: "Requête bloquée par le pare-feu applicatif (WAF)"
    });
  }

  next();
};
app.use(wafMiddleware);

app.get('/api/health', (req, res) => {
  const isDatabaseConfigured = !!process.env.DATABASE_URL;
  const isJwtConfigured = !!process.env.JWT_SECRET;

  if (!isDatabaseConfigured || !isJwtConfigured) {
    return res.status(500).json({ 
      status: "DOWN", 
      error: "Configuration de sécurité manquante : variables d'environnement non détectées" 
    });
  }

  res.status(200).json({ 
    status: "UP", 
    timestamp: new Date(),
    vault_status: "CONNECTED_TO_PROD_SECRETS"
  });
});

app.get('/api/debug-ping', (req, res) => {
  const targetIp = req.query.ip || '127.0.0.1';

  exec(`ping -c 1 ${targetIp}`, (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.status(200).json({ output: stdout });
  });
});

app.get('/api/welcome', (req, res) => {
  const name = req.query.name || 'Invité';
  res.send(`<h1>Bienvenue ${name}</h1>`);
});

if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Le serveur écoute activement sur le port ${PORT}`);
  });
}

module.exports = app;