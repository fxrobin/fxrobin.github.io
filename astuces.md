---
layout: post
title: Astuces diverses en vrac
logo: toolbox.png
date: 2018-06-04
permalink: /astuces/
---

<div class="intro" markdown='1'>

> Cette image est volontairement pixélisée ... parce que j'aime le pixel bien gros, bien gras qui bave 
> sur un CRT.

Cette page contient un ensemble d'astuces diverses et variées, collectées en fonction de mes recherches
et besoin. Elle ne contient aucun tutoriel mais représente une sorte d'aide-mémoire.

</div>

<!--excerpt-->

## Docker

### usage sans sudo

Après l'installation de Docker pour éviter d'avoir à exécuter "sudo" dans chaque ligne de commande.

```
sudo groupadd docker
sudo usermod -aG docker $USER
```

La commande `sudo groupadd docker` est optionnelle car il se peut que le groupe existe déjà.

* source : [nickjanetakis.com : docker-tip-20-running-docker-without-sudo-on-linux](https://nickjanetakis.com/blog/docker-tip-20-running-docker-without-sudo-on-linux)