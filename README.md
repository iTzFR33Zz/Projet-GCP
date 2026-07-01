# Application Squelette

## Description
L'objectif de ce squelette est d'unifier les processus de build, de test et de validation de sécurité. Ce projet intègre volontairement des simulations de failles logiques et de configurations pour analyser le comportement des outils de détection continue et le masquage des flux de données dans la console.

## Architecture
L'arborescence respecte une structure standardisée pour dissocier le code source de l'application et sa suite de validation réglementaire:

* `public/` : Contient l'interface graphique utilisateur (Frontend HTML statique).
* `src/` : Regroupe la logique métier de l'API Express :
    * `app.js` : Configuration des routes d'API et intégration des cas d'étude de sécurité.
* `tests/` : Suite complète de tests automatisés s'exécutant en isolation:
    * `unit.test.js` : Validation d'une logique ou configuration interne isolée.
    * `integration.test.js` : Contrôle de la conformité des endpoints HTTP de l'API.
    * `e2e.test.js` : Simulation d'un parcours utilisateur de bout en bout.
* `.gitignore` : Fichier de configuration Git excluant les dépendances locales du suivi de version.
* `package.json` : Manifeste déclarant les métadonnées et packages tiers du projet.
* `package-lock.json` : Fichier de verrouillage des versions des modules tiers pour garantir la reproductibilité des environnements.

## Installation et utilisation
### 1. Prérequis
Assurez-vous de disposer de **Node.js** (version 22 ou supérieure) installé sur votre environnement de développement local.

### 2. Installation des dépendances
Pour installer proprement l'arborescence des modules tiers sans altérer le fichier de verrouillage, exécutez la commande suivante dans votre terminal:
```bash
npm ci
```

### 3. Exécution des tests
Avant de pousser vos modifications sur le dépôt distant, vous pouvez valider la robustesse globale de votre code en exécutant la suite de tests unitaires, d'intégration et end-to-end:
```bash
npm test
```

### 4. Démarrage de l'application
Pour lancer le serveur web localement et interagir avec l'interface graphique :
```bash
npm start
```

L'application sera accessible depuis votre navigateur à l'adresse suivante : `http://localhost:3000`.

---

## Validation Pre-commit (Shift-Left Security)

Voici un exemple de l'exécution du hook pre-commit qui intercepte automatiquement la présence de secrets avant même qu'ils ne soient committés dans l'historique Git local :

```text
Exécution des vérifications pre-commit (Shift Left)...
ATTENTION: actionlint n'est pas installé. Ignoré pour ce test, mais recommandé.
2. Exécution de Gitleaks...

    ○
    │╲
    │ ○
    ○ ░
    ░    gitleaks

Finding:     const INTERNAL_TOKEN = "SECWALLET_************************"
Secret:      SECWALLET_************************
RuleID:      generic-api-key
Entropy:     4.690116
File:        backend/src/app.js
Line:        6
Fingerprint: backend/src/app.js:generic-api-key:6

Finding:     const INTERNAL_TOKEN = "SECWALLET_************************"
Secret:      SECWALLET_************************
RuleID:      generic-api-key
Entropy:     4.690116
File:        skeleton/src/app.js
Line:        5
Fingerprint: skeleton/src/app.js:generic-api-key:5

8:09AM INF 1 commits scanned.
8:09AM INF scan completed in 69.2ms
8:09AM WRN leaks found: 2
Erreur Gitleaks : des secrets ont été détectés. Opération annulée.
```
