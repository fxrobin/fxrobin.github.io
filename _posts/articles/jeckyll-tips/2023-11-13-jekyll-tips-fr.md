---
layout: post
title: Mes astuces Jekyll avec Github Pages
subtitle: 5 ans d'utilisation de Jekyll avec Github Pages
logo: jekyll-logo.png
category: tips
tags: [Jekyll, GitHub Pages]
lang: fr
ref: my-jekyll-tips-with-github-pages
permalink: /mes-astuces-jekyll-github-pages/
mermaid: true
---

<div class="intro" markdown='1'>
Cette page regroupe toutes mes astuces et bonnes pratiques pour Jekyll et Github Pages.
</div>
<!--excerpt-->

## Qu'est-ce que Jekyll et Github Pages ?

Jekyll est un générateur de sites statiques écrit en Ruby. C'est le moteur qui propulse Github Pages.
Je l'utilise depuis 5 ans maintenant et j'en suis très satisfait.

## Exécuter Jekyll en local

De nos jours, il est possible d'exécuter Jekyll en local sur Windows, Linux et Mac, via Docker.
Bien que j'aie utilisé Jekyll nativement sur Linux pendant des années, je préfère désormais utiliser Docker, car c'est plus simple à installer et à maintenir.

Pré-requis : Docker doit être installé sur votre système.

Si vous avez un dépôt avec des Github Pages, vous pouvez exécuter Jekyll en local avec la commande suivante :

```bash
$ docker run -it --rm -v .:/usr/src/app -p "4000:4000" starefossen/github-pages
```

L'image Docker "starefossen/github-pages" est une image pré-construite avec Jekyll et les GEM Github Pages installés. Cela signifie que vous pouvez exécuter Jekyll en local, avec la même version de Jekyll et Github Pages que Github, sans installation supplémentaire.

La commande précédente exécute Jekyll dans le répertoire courant et sert le site sur le port 4000. Vous pouvez ensuite consulter votre site à l'adresse http://localhost:4000.

## Rediriger certaines pages

Quand j'ai migré certaines pages vers de nouvelles URL, j'ai voulu rediriger les anciennes URL vers les nouvelles. La raison est que d'autres sites web ou des posts de forum pouvaient avoir des liens vers les anciennes URL, et je souhaitais les conserver fonctionnels.

L'astuce est très simple car Github Pages supporte les redirections HTTP 301 avec la GEM `jekyll-redirect-from`.

Activez simplement la GEM dans votre fichier `_config.yml` :

```yaml
plugins:
  - jekyll-redirect-from
```

Puis, dans votre page, ajoutez les YAML front matter suivants :

```yaml
---
layout: post
title: Mes astuces Jekyll avec Github Pages
redirect_from:
  - /ancienne-url-1
  - /ancienne-url-2
---

Mon article va ici.
```

## Ajouter le lecteur asciinema

J'aime ajouter le lecteur asciinema à mes articles pour montrer des sessions terminal.

D'abord, je dois enregistrer une session terminal avec asciinema :

```bash
$ asciinema rec ma-session.cast
```

Ensuite, importez ce JavaScript à la fin de la balise `<body>` :

```html
 <script src="/asciinema/asciinema-player.js"></script>  
```

En haut de la page, vous pouvez ajouter le CSS suivant pour styler le lecteur :

```html
<head>
  <link rel="stylesheet" type="text/css" href="/asciinema/asciinema-player.css">
</head>
```

Puis vous pouvez ajouter le lecteur à votre article :

```html
<asciinema-player src="/asciinema/ma-session.cast" cols="80" rows="24"></asciinema-player>
```

ou créer une balise pour Jekyll :

```html
<asciinema-player src="{{ include.cast-file }}" idle-time-limit="2"></asciinema-player>
```

Cette balise peut être appelée comme ceci :

```html
{% include asciinema.html cast-file="asciinema/ma-session.cast" %}
```

[Voici un exemple de page](/Xenon-Reborn) avec un lecteur asciinema.

{%include asciinema.html cast-file="/casts/xenonreborn.cast" %}

## Ajouter des diagrammes Mermaid

Voici un exemple de [diagramme mermaid](http://mermaid.js.org/) :

<div class="mermaid">
flowchart TD;
    A[Deploy to production] --> B{Is it Friday?};
    B -- Yes --> C[Do not deploy!];
    B -- No --> D[Run deploy.sh];
    C --> E[Enjoy your weekend!];
    D --> E;
</div>

Ne vous y trompez pas, il s'agit d'un diagramme généré à partir d'une description textuelle. Ce n'est pas une image.

Voici la description textuelle de ce diagramme :

```text
flowchart TD;
    A[Deploy to production] --> B{Is it Friday?};
    B -- Yes --> C[Do not deploy!];
    B -- No --> D[Run deploy.sh];
    C --> E[Enjoy your weekend!];
    D --> E;
```

Les étapes suivantes montrent comment configurer mermaid sur votre site Jekyll.

Note : cette astuce ne nécessite pas de plugin Jekyll.

### Créer un fichier d'inclusion

Créez d'abord un fichier nommé `mermaid.html` dans le répertoire `_includes`.

```html
<script type="module">
    import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
</script>
```

Ceci charge Mermaid, puis l'initialise sur la page.
Il analyse tous les `<div>` avec la classe `mermaid` et affiche les diagrammes.

### Ajouter l'inclusion dans le pied de page

Dans le pied de page de votre page, avant la fin de la balise `BODY`, ajoutez l'inclusion suivante :

```html
{% raw %}{% if page.mermaid }
  {% include mermaid.html %}
{% endif %}{% endraw %}
```

### Ajouter un paramètre au front-matter

Ajoutez simplement le paramètre `mermaid: true` au front-matter de votre page, si la page ou l'article contient des diagrammes mermaid à afficher.

Voici l'exemple lié à cette page :

```yaml 
---
layout: post
title: Mes astuces Jekyll avec Github Pages
subtitle: 5 ans d'utilisation de Jekyll avec Github Pages
logo: jekyll-logo.png
category: articles
tags: [Site, Jekyll]
lang: fr
ref: my-jekyll-tips-with-github-pages
permalink: /mes-astuces-jekyll-github-pages/
mermaid: true
---
```	

### Ajouter un diagramme mermaid

Ensuite, dans votre contenu, utilisez la syntaxe suivante en encapsulant un diagramme dans une DIV avec la classe `mermaid` :

```html
<div class="mermaid">
flowchart TD;
    A[Deploy to production] --> B{Is it Friday?};
    B -- Yes --> C[Do not deploy!];
    B -- No --> D[Run deploy.sh];
    C --> E[Enjoy your weekend!];
    D --> E;
</div>  
```

À l'intérieur de la DIV, utilisez simplement la syntaxe mermaid.

### Un dernier joli diagramme mermaid

Ceci est un mindmap créé par mermaid. Trop cool.

<div class="mermaid">
        mindmap
        root((Apprendre Java))
          Livres
            Algorithmes
            Clean Code
            Java 8 in Action
          Frameworks
            Spring Framework
            Quarkus Framework
          IDE
            Eclipse
            IntelliJ
            NetBeans
            VisualCode
          Outils de build
            Maven
            Gradle  
</div>      

## Liens

- [Jekyll](https://jekyllrb.com/)
- [Github Pages](https://pages.github.com/)
