# Le Baron — Jules

Portfolio interactif construit avec Vite et JavaScript vanilla. Le site est bilingue (français / anglais), pensé pour le swipe sur mobile et organisé autour d’un panneau de navigation sur ordinateur.

## Lancer le site en local

```bash
npm install
npm run dev
```

Pour produire le site statique :

```bash
npm run build
npm run preview
```

Le générateur tente de synchroniser les dépôts publics de `RavenJB` avant la compilation. S’il n’y a pas de réseau, le site utilise le dernier instantané `public/data/projects.json` présent dans le dépôt.

## Personnaliser les projets

- `data/projects-overrides.json` permet de définir une catégorie, une description et un message en français et en anglais, un visuel ou le badge « Projet phare » pour chaque dépôt.
- La clé d’un projet est le nom exact du dépôt GitHub. Les champs non renseignés sont complétés par le générateur.
- `public/data/projects.json` est l’instantané affiché localement et le fichier généré avant le déploiement. Il est préférable de modifier les descriptions dans le fichier d’overrides pour qu’elles restent stables après la prochaine synchronisation.
- Les projets sans capture utilisent un visuel géométrique généré en CSS. Ajoute une image sous `public/assets/`, puis indique son chemin relatif au site dans `image`.

Les textes d’exemple qui commencent par `[DEMO]` sont à remplacer. Pour mettre un dépôt en avant, passe `featured` à `true` dans `data/projects-overrides.json`.

## Conversations et assistant

Après un like, la conversation commence par le message personnalisé du projet. Les visiteurs peuvent ensuite écrire dans le chat : l’assistant local répond à quelques questions à partir des métadonnées et du texte du projet. Les messages sont conservés dans le navigateur avec `localStorage`; aucun service d’IA externe n’est appelé. Les réponses limitées sont signalées comme une démo.

Pour brancher un vrai modèle conversationnel, ajoute une fonction côté serveur ou serverless qui détient la clé API. Ne place jamais cette clé dans le JavaScript livré par GitHub Pages.

## Modifier les informations du profil

Les textes de l’interface et les éléments du profil se trouvent dans `data/translations/fr.json` et `data/translations/en.json`. Mets à jour les deux fichiers pour conserver les deux langues. Les coordonnées ne sont volontairement pas renseignées.

## Ajouter une langue

1. Duplique `data/translations/en.json` et traduis les valeurs.
2. Ajoute le fichier dans `src/main.js` à l’objet `LOCALES`.
3. Ajoute son bouton de sélection dans `renderIntro()` et `renderProfile()`.
4. Ajoute les descriptions et messages localisés des projets dans `data/projects-overrides.json`.

## Changer les couleurs et les polices

Les couleurs principales et les variantes du thème sombre se trouvent au début de `src/styles.css`, dans `:root` et `:root[data-theme='dark']`. Les liens de polices sont dans le `<head>` de `index.html`.

## Photo et CV

- Remplace le bloc `.portrait-placeholder` dans `src/main.js` par une image dans `public/assets/` lorsque ta photo est prête.
- Place le CV dans `public/assets/cv-jules-baron.pdf`, puis remplace le bouton désactivé de `renderProfile()` par un lien vers ce fichier. Si tu ajoutes une version anglaise, crée un bouton dédié ou lie le bon PDF selon la langue active.

## Données GitHub et déploiement

Le workflow `.github/workflows/deploy.yml` se lance sur chaque push vers `main`, une fois par jour et manuellement depuis l’onglet Actions. Il lit les dépôts publics avec le `GITHUB_TOKEN` fourni par GitHub Actions, génère le fichier de données, construit Vite et publie `dist` sur GitHub Pages. Aucune clé secrète n’est ajoutée au code source.

L’URL attendue du site est <https://ravenjb.github.io/Le-Baron/>. Dans les paramètres du dépôt, configure **Settings → Pages → Build and deployment → Source: GitHub Actions** si le premier workflow indique que Pages n’est pas encore activé.
