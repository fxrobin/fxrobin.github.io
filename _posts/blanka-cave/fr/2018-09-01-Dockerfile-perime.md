---
layout: post
title: Dockerfile périmé
logo: blanka.png
category: blanka
lang: fr
---

Maaaaaaaaaaaaarrrrrrrrrrhhh !

Blanka perdre heures cause gens mettre `RUN wget <url>` dans script `Dockerfile` qui retourne `HTTP 404` !

Dockerfile devoir :

- utiliser `apt` ou autre gestionnaire de paquets
- et/ou venir avec dépendances et utiliser `ADD`
- et/ou pointer `wget` sur URL stables !

Grrrr !!!!
Blanka envie de casser crânes !!!