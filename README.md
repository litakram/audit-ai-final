# Audit de Maturité IA - Plateforme d'Évaluation Moderne

## 🎯 Vue d'Ensemble

Cette plateforme moderne d'audit de maturité IA permet aux organisations d'évaluer leur niveau de préparation et d'adoption de l'intelligence artificielle selon 6 axes stratégiques et 96 questions structurées. L'interface redesignée offre une expérience utilisateur optimale avec **support du mode clair/sombre** et une **réactivité complète** sur tous les appareils, des smartphones aux grandes consoles de jeu.

## ✨ Fonctionnalités Principales

### 🎨 Interface Moderne
- **Design 2025** : Interface épurée et professionnelle
- **📱 Responsive Design** : Optimisé pour mobile, tablette, desktop et **grandes consoles** (jusqu'à 1600px+)
- **✨ Animations Fluides** : Micro-interactions et transitions élégantes

### 📊 Évaluation Complète
- **6 Axes d'Analyse** : Stratégie IA, Data, Technologies, Gouvernance, Culture, Infrastructure
- **96 Questions Structurées** : Questionnaire complet avec notation 0-5
- **⚡ Progression en Temps Réel** : Suivi automatique et sauvegarde continue
- **📝 Notes Explicatives** : Champs de commentaires pour chaque réponse

### 📈 Tableaux de Bord Interactifs
- **KPIs en Direct** : Score global, taux de completion, dernière mise à jour
- **📊 Visualisations** : Graphiques radar et barres pour analyse visuelle
- **🧭 Navigation Intuitive** : Sidebar avec progression par axe

### 🔄 Import/Export Avancé
- **📄 Export CSV** : Données structurées pour analyse externe
- **📋 Export PDF** : Rapport complet avec graphiques
- **📥 Import JSON** : Reprise d'audits existants
- **💾 Sauvegarde Auto** : Persistance locale automatique

## Structure du Projet

```
audit-ia-redesign/
├── index.html              # Interface principale (SPA)
├── styles.css              # Design system complet
├── app.js                  # Logique applicative
├── questionnaire_maturite_ia_corrected.json  # Données du questionnaire
├── ai-crafters-logo-b.png.webp              # Logo
└── README.md               # Cette documentation
```

## Installation et Utilisation

### Prérequis
- Navigateur web moderne (Chrome, Firefox, Safari, Edge)
- Serveur HTTP local (pour éviter les restrictions CORS)

### Démarrage Rapide

1. **Cloner ou télécharger le projet**
   ```bash
   # Si vous avez le projet en archive
   unzip audit-ia-redesign.zip
   cd audit-ia-redesign
   ```

2. **Démarrer un serveur HTTP local**
   ```bash
   # Avec Python 3
   python3 -m http.server 8080
   
   # Avec Node.js
   npx serve .
   
   # Avec PHP
   php -S localhost:8080
   ```

3. **Ouvrir l'application**
   - Naviguer vers `http://localhost:8080`
   - L'application se charge automatiquement

### Utilisation

1. **Tableau de Bord** : Vue d'ensemble avec KPIs et actions rapides
2. **🌓 Sélecteur de Thème** : Bouton en haut à droite pour basculer entre mode clair et sombre
3. **Audit** : Interface de questionnaire avec navigation intuitive
4. **Révision** : Vérification des réponses avant finalisation
5. **Insights** : Génération de rapports et recommandations IA

## 🌓 Gestion des Thèmes

### Sélecteur de Thème
- **Bouton dédié** : Icône soleil/lune dans le header
- **Persistance** : Préférence sauvegardée automatiquement
- **Détection système** : Suit automatiquement le thème de l'OS si aucune préférence
- **Transition fluide** : Animation douce lors du changement

### Thèmes Disponibles
- **Mode Clair** : Arrière-plan blanc, texte sombre, optimal pour le jour
- **Mode Sombre** : Arrière-plan sombre, texte clair, confortable pour les yeux

## 📱 Responsive Design Avancé

### Breakpoints Supportés
- **📱 Mobile** : 320px - 767px (smartphones)
- **📱 Tablette** : 768px - 1023px (iPad, Android tablets)
- **💻 Desktop** : 1024px - 1399px (ordinateurs standard)
- **🖥️ Grande Console** : 1400px - 1599px (moniteurs gaming, TV)
- **🖥️ Ultra-Large** : 1600px+ (moniteurs ultra-wide, setup gaming)

### Adaptations par Appareil

#### 📱 Mobile (≤ 767px)
- Navigation sidebar transformée en grille compacte
- KPI cards empilées verticalement
- Boutons pleine largeur pour faciliter le touch
- Contrôles de notation centrés et agrandis
- Texte et icônes optimisés pour petits écrans

#### 🖥️ Grandes Consoles (≥ 1400px)
- Sidebar élargie (350px-400px) pour plus de confort
- KPI grid 4x1 pour exploiter l'espace horizontal
- Icônes et textes agrandis pour visibilité à distance
- Espacement généreux pour navigation au gamepad
- Conteneur élargi (jusqu'à 1600px) pour écrans ultra-wide

## Architecture Technique

### Structure des Vues

L'application utilise une architecture SPA (Single Page Application) avec 4 vues principales :

- **Overview** : Tableau de bord avec métriques et actions
- **Audit** : Interface de questionnaire avec sidebar de navigation
- **Review** : Page de révision des réponses
- **Insights** : Génération et affichage des insights IA

### Gestion d'État

```javascript
class AuditApp {
    constructor() {
        this.currentView = 'overview';
        this.currentAxis = 0;
        this.questionnaire = null;
        this.responses = {};
        this.companyInfo = {};
    }
}
```

### Sauvegarde Automatique

Les données sont automatiquement sauvegardées dans le localStorage :
- `audit-responses` : Réponses aux questions
- `company-info` : Informations de l'entreprise
- `theme-preference` : Préférence de thème (light/dark)
- `last-update` : Timestamp de dernière modification

## Personnalisation

### Modifier la Palette de Couleurs

Les couleurs sont définies via des variables CSS dans `styles.css` :

```css
:root {
  /* Mode clair (par défaut) */
  --primary: #081d3f;        /* Bleu foncé principal */
  --secondary: #ECDC2C;      /* Jaune accent */
  --background: #f8fafc;     /* Arrière-plan */
  --surface: #ffffff;        /* Surfaces/cartes */
  --text: #1e293b;          /* Texte principal */
  --text-muted: #64748b;    /* Texte secondaire */
  
  /* Couleurs fonctionnelles */
  --success: #10b981;       /* Succès */
  --warning: #f59e0b;       /* Avertissement */
  --error: #ef4444;         /* Erreur */
  --info: #3b82f6;          /* Information */
}

/* Mode sombre */
[data-theme="dark"] {
  --background: #0f172a;     /* Arrière-plan sombre */
  --surface: #1e293b;       /* Surfaces sombres */
  --text: #f1f5f9;          /* Texte clair */
  --text-muted: #94a3b8;    /* Texte secondaire clair */
  --border: #334155;        /* Bordures sombres */
}
```

### Personnaliser le Sélecteur de Thème

```css
.theme-switcher {
  width: 50px;              /* Taille du bouton */
  height: 50px;
  border-radius: 50%;       /* Forme circulaire */
  background: var(--surface);
  border: 2px solid var(--border);
}

.theme-switcher:hover {
  border-color: var(--secondary);  /* Couleur au survol */
  transform: scale(1.05);          /* Animation au survol */
}
```

### Modifier l'Espacement

```css
:root {
  /* Échelle d'espacement */
  --space-1: 0.25rem;  /* 4px */
  --space-2: 0.5rem;   /* 8px */
  --space-4: 1rem;     /* 16px */
  --space-8: 2rem;     /* 32px */
  /* ... */
}
```

### Modifier la Typographie

```css
:root {
  /* Tailles de police */
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  /* ... */
}
```

## Intégration IA

### Fonction de Génération d'Insights

L'application inclut une fonction placeholder pour l'intégration IA :

```javascript
async function generateInsights(prompt) {
    // Placeholder pour votre API IA
    // Remplacez par votre logique d'appel API
    return {
        summary: "Analyse générée",
        strengths: ["Point fort 1", "Point fort 2"],
        improvements: ["Amélioration 1", "Amélioration 2"],
        recommendations: ["Recommandation 1", "Recommandation 2"]
    };
}
```

### Intégration avec votre API

Pour connecter votre API IA, modifiez la fonction `generateInsights` dans `app.js` :

```javascript
async function generateInsights(prompt) {
    try {
        const response = await fetch('https://votre-api.com/generate-insights', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer YOUR_API_KEY'
            },
            body: JSON.stringify({
                prompt: prompt,
                responses: app.responses,
                companyInfo: app.companyInfo
            })
        });
        
        return await response.json();
    } catch (error) {
        console.error('Erreur API:', error);
        throw error;
    }
}
```

## Fonctionnalités Avancées

### Export de Données

L'application supporte plusieurs formats d'export :

- **CSV** : Export structuré des réponses
- **PDF** : Rapport complet avec graphiques
- **JSON** : Données brutes pour intégration

### Import de Données

Possibilité d'importer des données existantes au format JSON pour reprendre un audit en cours.

### Graphiques Interactifs

Utilisation de Chart.js pour les visualisations :
- Graphique radar pour vue d'ensemble
- Graphique en barres pour scores par axe
- Graphique en secteurs pour répartition

## Compatibilité

### Navigateurs Supportés
- **Chrome** 90+ ✅ (Desktop, Mobile, Console)
- **Firefox** 88+ ✅ (Desktop, Mobile)
- **Safari** 14+ ✅ (Desktop, Mobile, iPad)
- **Edge** 90+ ✅ (Desktop, Xbox)

### Appareils Testés
- **📱 Mobile** : iPhone, Android (320px - 767px)
- **📱 Tablette** : iPad, Android tablets (768px - 1023px)
- **💻 Desktop** : Windows, macOS, Linux (1024px - 1399px)
- **🖥️ Grandes Consoles** : PlayStation, Xbox, Steam Deck (1400px+)
- **🖥️ Moniteurs Gaming** : Ultra-wide, 4K, multi-écrans (1600px+)

### Technologies Utilisées
- **HTML5** : Structure sémantique avec ARIA
- **CSS3** : Variables, Grid, Flexbox, Media Queries avancées
- **JavaScript ES6+** : Classes, Modules, Async/Await, LocalStorage
- **Chart.js** : Visualisations de données interactives
- **Font Awesome** : Icônes vectorielles (soleil/lune pour le thème)

### Accessibilité
- **WCAG 2.1 AA** compliant ✅
- **Support lecteurs d'écran** (NVDA, JAWS, VoiceOver) ✅
- **Navigation clavier** complète avec focus visible ✅
- **Contraste élevé** supporté dans les deux thèmes ✅
- **Préférences système** respectées (prefers-color-scheme) ✅

## Développement

### Structure du Code

Le code est organisé de manière modulaire :

```javascript
// app.js structure
class AuditApp {
    // Initialisation et configuration
    constructor() { ... }
    init() { ... }
    
    // Gestion des données
    loadQuestionnaire() { ... }
    saveData() { ... }
    
    // Interface utilisateur
    updateUI() { ... }
    renderCurrentAxis() { ... }
    
    // Calculs et métriques
    calculateGlobalScore() { ... }
    calculateAxisScore() { ... }
    
    // Export et import
    exportCSV() { ... }
    exportPDF() { ... }
}
```

### Bonnes Pratiques Implémentées

- **Séparation des préoccupations** : HTML structure, CSS présentation, JS comportement
- **Accessibilité** : ARIA labels, navigation clavier, focus management
- **Performance** : Lazy loading, event delegation, optimisation DOM
- **Maintenabilité** : Code commenté, structure claire, variables CSS

## Déploiement

### Hébergement Statique

L'application peut être déployée sur n'importe quel hébergeur statique :

- **Netlify** : Drag & drop du dossier
- **Vercel** : Import depuis Git
- **GitHub Pages** : Push vers repository
- **AWS S3** : Upload des fichiers

### Configuration Serveur

Aucune configuration serveur spéciale requise. Assurez-vous simplement que :
- Les fichiers statiques sont servis correctement
- HTTPS est activé (recommandé)
- Compression gzip activée (optionnel)

## Support et Maintenance

### Logs et Debugging

L'application inclut un système de logging pour faciliter le debugging :

```javascript
// Notifications utilisateur
app.showNotification('Message', 'type');

// Logs console pour développement
console.log('État application:', app);
```

### Mise à Jour du Questionnaire

Pour mettre à jour les questions, modifiez le fichier `questionnaire_maturite_ia_corrected.json` en respectant la structure existante.

### Sauvegarde des Données

Les données utilisateur sont stockées localement. Pour une sauvegarde centralisée, implémentez une synchronisation avec votre backend.

## Licence et Crédits

- **Framework** : Vanilla HTML/CSS/JavaScript
- **Icônes** : Font Awesome 6.4.0
- **Graphiques** : Chart.js
- **Export PDF** : html2pdf.js
- **Markdown** : Marked.js

---

**Version** : 2.1.0  
**Dernière mise à jour** : Août 2025  
**Nouvelles fonctionnalités** : 
- 🌓 Sélecteur de thème clair/sombre avec persistance
- 📱 Responsive design avancé pour grandes consoles (jusqu'à 1600px+)
- ⚡ Optimisations performance et accessibilité
- 🎨 Animations et transitions améliorées

**Compatibilité** : Navigateurs modernes, Mobile à Ultra-wide  
**Licence** : Propriétaire  
**Auteur** : AI Crafters Team

"# audit-ia-ai-crafters-" 
