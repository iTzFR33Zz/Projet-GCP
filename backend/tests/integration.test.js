const request = require('supertest');
const app = require('../src/app');

describe('Tests d\'Intégration - Endpoints d\'API', () => {
  it('GET /api/health devrait retourner un code 200 et un statut valide', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('status');
    expect(res.body.status).toBe('UP');
  });

  describe('WAF (Web Application Firewall)', () => {
    it('devrait bloquer une tentative de XSS sur une route protégée (par ex. inexistant)', async () => {
      const res = await request(app).get('/api/health?payload=<script>alert(1)</script>');
      expect(res.statusCode).toEqual(403);
      expect(res.body.error).toBe('WAF: Forbidden');
    });

    it('devrait bloquer une tentative d\'injection de commande', async () => {
      const res = await request(app).get('/api/health?param=;cat /etc/passwd');
      expect(res.statusCode).toEqual(403);
      expect(res.body.error).toBe('WAF: Forbidden');
    });

    it('NE devrait PAS bloquer une tentative sur les routes volontairement vulnérables', async () => {
      // Le bypass est configuré pour /api/debug-ping et /api/welcome
      const res = await request(app).get('/api/welcome?name=<script>alert(1)</script>');
      expect(res.statusCode).toEqual(200);
      expect(res.text).toContain('<script>alert(1)</script>');
    });
  });
});