# 🛡️ Projet DevSecOps - Industrialisation et Sécurité

Bienvenue sur le dépôt officiel du projet DevSecOps. Ce projet a pour but d'illustrer la mise en place d'une architecture Cloud moderne et sécurisée, intégrant des processus de CI/CD complets, de la gestion de secrets dynamiques, et des validations de sécurité "Shift-Left".

## 🏗️ Architecture du Projet (Monorepo)

Le dépôt est scindé en deux composants distincts :

1. **`/frontend`** : Une Single Page Application (SPA) HTML/CSS/JS pur. 
   - Déploiement : **GitHub Pages** (via l'API moderne d'artefacts GitHub Actions).
2. **`/backend`** : Une API REST développée en Node.js (Express).
   - Déploiement : **Vercel** (Environnement Serverless `@vercel/node`).

## ⚙️ Gouvernance Git et Flux de Travail

Le dépôt respecte des règles de gouvernance strictes via les **GitHub Rulesets** :
- **Branche `main` (Production)** : Tout push direct est strictement interdit. La fusion nécessite obligatoirement de passer par une Pull Request vérifiée. C'est la seule branche autorisée à déclencher le déploiement (`deploy-frontend` et `deploy-backend`).
- **Branche `staging` (Intégration)** : Branche de développement et de tests. La pipeline d'Intégration Continue (CI) s'y exécute à chaque événement pour garantir la robustesse du code avant la mise en production.

## 🔒 Intégration Continue et Sécurité (CI/CD)

Notre pipeline GitHub Actions (`.github/workflows/ci-cd.yml`) implémente de nombreux contrôles de sécurité automatisés :

### 1. Sécurité Shift-Left (Pre-commit)
Avant même d'arriver sur GitHub, un hook de sécurité local (`.git/hooks/pre-commit`) analyse le code avec **Gitleaks** pour empêcher l'envoi accidentel de secrets (API Keys, Tokens). L'ancienne faille contenant `SECWALLET_...` a été purgée avec succès !

### 2. Gestion des Secrets (SOPS & Age)
Les secrets de production (comme la base de données et le JWT) sont chiffrés dans le dépôt (`.github/secrets-prod.yaml`) avec **Mozilla SOPS** et l'algorithme cryptographique **Age**. Lors de la phase de déploiement sur Vercel, la pipeline déchiffre ces secrets dynamiquement **en mémoire RAM** et les passe directement à la CLI Vercel, ne laissant aucune trace sur le disque du runner GitHub.

### 3. Pipeline de Build & Scan
- **Tests Automatisés** : Exécution des suites unitaires et E2E (Jest).
- **SAST (Static Application Security Testing)** : Analyse du code source par **GitHub CodeQL** pour détecter d'éventuelles failles d'injection.
- **SCA & Conteneurs** : 
  - Compilation d'une image Docker multi-stages ultra-légère (`node:24-alpine`).
  - Génération d'un inventaire logiciel (**SBOM**) au format CycloneDX grâce à *Anchore Syft*.
  - Scan de vulnérabilités sur l'image Docker via l'outil **Trivy** (intégré via une Custom Composite Action).
  - Poussée de l'image sécurisée sur le registre **GitHub Container Registry (GHCR)**.

## ⚠️ Laboratoire d'Exploitation (Démonstration)

Ce dépôt intègre volontairement un laboratoire de failles pour étudier le comportement des outils et de l'environnement Cloud.

### 1. Failles Logiques Résolues
Le squelette initial comportait plusieurs failles empêchant le déploiement :
- L'API ne servait pas le frontend statique (générant des erreurs E2E 404).
- Le port `3000` était bloqué durant les tests Jest.
- L'API plantait au démarrage sans variables d'environnement (Healthcheck 500).
- Vercel retournait une erreur 302 à cause de l'absence du `vercel.json` indispensable pour le Serverless Express.
*Toutes ces failles ont été corrigées avec succès dans l'historique de commits.*

### 2. Exécution de Commandes (RCE) sur Serverless
La route `/api/debug-ping` est volontairement vulnérable aux injections de commandes shell.
Sur une machine locale, la commande `ping` fonctionne. Sur l'infrastructure **Serverless AWS Lambda de Vercel**, `ping` est absent (renvoyant l'erreur `command not found`).
Cependant, la faille est toujours exploitable en utilisant le séparateur `||` ou `;` pour découvrir l'infrastructure Cloud sous-jacente !
**Exemple de payload :**
```bash
8.8.8.8 ; uname -a ; cat /etc/passwd
```

### 3. Reflected XSS
La route `/api/welcome` prend un paramètre utilisateur brut et l'injecte dans le DOM.
**Exemple de payload :**
```html
<script>alert('Hacked via Vercel!')</script>
```

---
*Ce projet démontre avec succès la création d'un écosystème de développement sécurisé de bout en bout.*
