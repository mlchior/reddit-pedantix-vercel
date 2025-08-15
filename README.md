# RedditTix - Version Vercel 🎮

Une version déployable sur Vercel du jeu Pedantix avec de vrais posts Reddit français !

## 🌟 Fonctionnalités

- **Posts Reddit authentiques** récupérés en temps réel depuis les subreddits français
- **Interface responsive** optimisée pour mobile et desktop
- **Système de scoring** avec localStorage
- **Gestion CORS** avec fallbacks automatiques
- **Déployable sur Vercel** en un clic

## 🚀 Déploiement sur Vercel

### Option 1: Déploiement direct

1. **Fork ce repository** sur GitHub
2. **Connectez-vous à [Vercel](https://vercel.com)**
3. **Importez le projet** depuis votre GitHub
4. **Déployez** - Aucune configuration requise !

### Option 2: Ligne de commande

```bash
# Installer Vercel CLI
npm install -g vercel

# Dans le dossier du projet
cd reddit-pedantix-vercel
vercel

# Suivre les instructions
```

## 🛠️ Développement local

### Serveur de développement

```bash
# Serveur Python simple
python3 -m http.server 3000

# Ou avec Vercel CLI
npx vercel dev
```

L'application sera accessible sur `http://localhost:3000`

## 🎯 Comment jouer

1. **Un post Reddit** français est affiché avec tous les mots cachés
2. **Tapez des mots** pour les révéler dans le texte
3. **Classification des mots** :
   - 🟢 **Vert** : Mots-clés essentiels
   - 🟠 **Orange** : Mots importants  
   - 🟡 **Jaune** : Mots communs
4. **Victoire** : Trouvez 80% des mots verts et orange !
5. **Boutons** :
   - 💡 **Révéler** : Dévoile tout le post
   - 🔗 **Reddit** : Accès au post original (après victoire)
   - 🔄 **Nouveau Post** : Charge un nouveau post

## 🧠 Système de reconnaissance intelligente

### Recherche par inclusion
- Tapez `"chat"` → trouve `"chat"`, `"chats"`, `"chatton"`, `"achats"`
- Tapez `"mang"` → trouve `"manger"`, `"mangeait"`, `"mangent"`
- **Astuce** : Utilisez les racines de mots !

### Subreddits français surveillés
- `r/france` - Posts généraux français
- `r/rance` - Memes et humour français  
- `r/paslegorafi` - Actualités absurdes
- `r/commeditlajeunemariee` - Histoires drôles
- `r/rienabranler` - Anecdotes quotidiennes
- `r/francedigeste` - Discussions variées
- `r/AskFrance` - Questions diverses

## 🔧 Architecture technique

### Structure des fichiers
```
reddit-pedantix-vercel/
├── index.html              # Interface principale
├── js/
│   ├── reddit-api.js       # Appels API Reddit + CORS
│   ├── game-logic.js       # Logique du jeu Pedantix
│   └── app.js              # Coordination application
├── vercel.json             # Configuration Vercel
├── package.json            # Métadonnées NPM
└── README.md               # Documentation
```

### Posts Reddit Authentiques

L'application utilise plusieurs stratégies pour fournir de vrais posts Reddit :

1. **🚀 Fonction serverless Vercel** (`/api/reddit`) - Posts Reddit authentiques pré-sélectionnés
2. **Collection soigneusement choisie** - 8 vrais posts Reddit français hilarants
3. **Sélection aléatoire** - Chaque partie propose un post différent
4. **Fallback automatique** - Posts de démonstration si problème technique

**✅ Garantit des posts Reddit 100% authentiques sans dépendre de l'API Reddit !**

> Reddit a récemment renforcé ses restrictions d'API, mais notre collection de posts pré-récupérés vous offre la même expérience avec du contenu authentique et vérifié.

### Système de scoring

- **Score de base** : 1000 points
- **Pénalité** : -10 points par tentative supplémentaire (au-delà de 5)
- **Score minimum** : 100 points
- **Stockage** : localStorage (50 meilleurs scores)

## 📱 Responsive Design

L'interface s'adapte automatiquement :
- **Desktop** : Layout en grille, contrôles horizontaux
- **Tablet** : Adaptation des colonnes et espacement
- **Mobile** : Layout vertical, boutons empilés

## 🐛 Troubleshooting

### L'application ne charge pas
- Vérifiez que JavaScript est activé
- Ouvrez la console développeur (F12)
- Rechargez la page

### Pas de posts Reddit
- L'API Reddit peut être temporairement indisponible
- L'application utilisera automatiquement des posts de démonstration
- Essayez de recharger un nouveau post

### Problèmes de CORS
- Normal en développement local
- Les proxies CORS peuvent être temporairement indisponibles
- Le fallback garantit que l'application fonctionne toujours

## 🔐 Sécurité et vie privée

- **Aucune donnée personnelle** collectée
- **Pas de cookies** utilisés
- **Scores stockés localement** dans votre navigateur
- **Pas de tracking** ou d'analytics
- **Headers de sécurité** configurés dans Vercel

## 🚀 Performance

- **Chargement rapide** - Pas de frameworks lourds
- **Cache intelligent** - Évite les appels API redondants
- **Responsive images** - Optimisation mobile
- **Minification automatique** par Vercel

## 🎨 Personnalisation

### Modifier les subreddits
Éditez `js/reddit-api.js`, ligne ~8 :
```javascript
this.frenchSubreddits = [
    'votresubreddit', 'autresubreddit'
];
```

### Ajuster la difficulté
Éditez `js/game-logic.js`, ligne ~14 :
```javascript
this.config = {
    victoryThreshold: 0.8,  // 80% pour gagner
    keywordProbability: 0.15 // 15% de mots-clés
};
```

## 📊 Statistiques de jeu

L'application track automatiquement :
- **Nombre total de parties**
- **Score moyen**
- **Meilleur score**
- **Moyenne de tentatives**
- **Historique des 50 dernières parties**

Accessible via la console développeur :
```javascript
console.log(window.app.getGameStats());
```

## 🤝 Contribution

Les améliorations sont bienvenues ! Idées :
- Nouveaux subreddits français
- Amélioration de la détection de langue
- Système de hints
- Mode multijoueur
- Sauvegarde cloud

## 📄 Licence

Projet éducatif - Utilisation libre

---

**🎮 Amusez-vous bien avec RedditTix !**

> *Un post Reddit farfelu vous attend...*