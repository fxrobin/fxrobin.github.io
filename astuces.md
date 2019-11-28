---
layout: post
title: Astuces diverses en vrac
logo: toolbox.png
date: 2018-06-04
permalink: /astuces/
lang: fr
---

<div class="intro" markdown='1'>

> Cette image est volontairement pixélisée ... parce que j'aime le pixel bien gros, bien gras qui bave 
> sur un CRT.

Cette page contient un ensemble d'astuces diverses et variées, collectées en fonction de mes recherches
et besoins. Elle ne contient aucun tutoriel mais représente une sorte d'aide-mémoire.

</div>

<!--excerpt-->


## BrowserSync

### installation

```
$ sudo su
$ apt-get update && apt-get -y upgrade && apt-get –y autoremove
$ wget -qO- https://deb.nodesource.com/setup_12.x | sudo -E bash -
$ apt-get install -y nodejs
$ npm install -g browser-sync
```

### exécution 

Dans le cas ci dessous l'application doit être déployée au moins une fois par Eclipse dans le répertoire
du serveur d'application. Chaque changement est écouté et la page (même JSF) est rechargée à la volée en 
cas de changement sur le disque.

```
$ browser-sync start --proxy "http://localhost:8080/ApplicationDemo " --files "/opt/payara41_171/glassfish/domains/domain1/eclipseApps/ApplicationDemo/**/*"
```

En JSF, pour éviter la demande de confirmation de "re-submit POST", il faut ajouter un plugin à Firefox :

[https://addons.mozilla.org/en-US/firefox/addon/auto-confirm/](https://addons.mozilla.org/en-US/firefox/addon/auto-confirm/)


## Docker

### Installation sous Linux Mint 18 

source : [https://gist.github.com/Simplesmente/a84343b1f71a46bbeedbb6c9b20fa9c1#file-install-docker-mint-sh](https://gist.github.com/Simplesmente/a84343b1f71a46bbeedbb6c9b20fa9c1#file-install-docker-mint-sh)

```bash
sudo apt-get update
sudo apt-get install apt-transport-https ca-certificates -y
sudo apt-key adv --keyserver hkp://p80.pool.sks-keyservers.net:80 --recv-keys 58118E89F3A912897C070ADBF76221572C52609D
sudo echo deb https://apt.dockerproject.org/repo ubuntu-xenial main >> /etc/apt/sources.list.d/docker.list
sudo apt-get update
sudo apt-get purge lxc-docker
sudo apt-get install linux-image-extra-$(uname -r) -y
sudo apt-get install docker-engine cgroup-lite apparmor -y
sudo usermod -a -G docker $USER
sudo service docker start
```

### usage sans sudo

Après l'installation de Docker pour éviter d'avoir à exécuter "sudo" dans chaque ligne de commande.

```bash
$ sudo groupadd docker
$ sudo usermod -aG docker $USER
```

La commande `sudo groupadd docker` est optionnelle car il se peut que le groupe existe déjà.

* source : [nickjanetakis.com : docker-tip-20-running-docker-without-sudo-on-linux](https://nickjanetakis.com/blog/docker-tip-20-running-docker-without-sudo-on-linux)

## Scripting Linux

### générer une représentation texte d'un répertoire pour Markdown

```bash
#!/bin/bash
export pwd=$(pwd)
find $pwd | sed -e "s;$pwd;\.;g;s;[^/]*\/;|__;g;s;__|; |;g"
```

### maven clean recursif sur des projets maven

Ce script permet de lancer un "maven clean" à partir d'une arborescence de manière récursive et 
de nettoyer ansi tous les builds :

```bash
echo "Cleaning all maven projects recursively"

find . -name "pom.xml" -exec mvn clean -f '{}'
```

source : [https://stackoverflow.com/questions/15895805/find-pom-in-subdirectories-and-execute-mvn-clean](https://stackoverflow.com/questions/15895805/find-pom-in-subdirectories-and-execute-mvn-clean)

## Vidéo

### concaténer

Créer un fichier `files.txt` qui contient tous les fichiers à concaténer, exemple :

```
capture-01.mp4
capture-02.mp4
capture-03.mp4
```

Concaténation :

```bash
$ ffmpeg -f concat -i files.txt -c:v libx264 -preset result_video.mp4
```

### accélérer

Accélération légère d'une vidéo pour la rendre plus "punchy" tout en restant écoutable :

```bash
$ ffmpeg -i normal_video.mp4 \ 
       -filter_complex "[0:v]setpts=0.85*PTS[v];[0:a]atempo=(1/0.85)[a]" \
       -map "[v]" -map "[a]" \
       -c:v libx264 \
       -preset fast \
       faster_result_video.mp4
```

### Streaming Live de l'écran vers YouTube

Il faut obtenir l'adresse de streaming ainsi que la clé (cf. compte Youtube, ma chaine, mes vidéos)

```bash
$ ffmpeg -f alsa -ac 2 -i hw:0,0 -f x11grab -framerate 30 -video_size 1280x720 \
         -i :0.0+0,0 -c:v libx264 -preset veryfast -maxrate 1984k -bufsize 3968k \
         -vf "format=yuv420p" -g 60 -c:a libvo_aacenc -b:a 128k -ar 44100 \
         -f flv rtmp://example.rtmp.address.youtube/example-key
```
