# Front Matter - Template complet

```yaml
---
layout: post
title: "Titre court, percutant, avec ponctuation si besoin !"
subtitle: "Sous-titre qui contextualise ou pique la curiosité"
logo: nom-du-logo.png          # dans /images/logos/
category: articles             # ou: retro
tags: [Tag1, Tag2, Tag3]
lang: fr                       # ou: en
ref: identifiant-unique-kebab  # partagé entre les versions linguistiques
permalink: /url-de-l-article/
redirect_from:                 # optionnel
  - /ancienne-url
mermaid: true                  # optionnel - uniquement si diagrammes Mermaid
---
```

## Règle de nommage du fichier

```
_posts/<category>/<slug>/YYYY-MM-DD-<slug>[-lang].md
```

Exemples :
- `_posts/articles/lombok-oui-mais/2018-03-05-Lombok-Oui-Mais-FR.md`
- `_posts/retro-prog/m68k-docker-compiler/2024-09-20-m68k-docker-compiler-fr.md`

## Bilinguisme

Deux fichiers distincts avec le même `ref`. La valeur de `lang` et le `permalink` diffèrent, tout le reste peut diverger (le contenu n'est pas une traduction mécanique).
