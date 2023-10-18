---
layout: post
title: Astuces diverses en vrac
logo: toolbox.png
date: 2020-01-12
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

## Linux

### installation de powerline

```bash
$ sudo apt-get update
$ sudo apt-get install powerline
```

Editer le fichier `.bashrc` et ajouter les lignes suivantes :

```bash
if [ -f /usr/share/powerline/bindings/bash/powerline.sh ]; then
source /usr/share/powerline/bindings/bash/powerline.sh
fi
```

Installer les polices compatibles :

```bash
$ git clone https://github.com/powerline/fonts.git --depth=1
$ cd fonts
$ ./install.sh
```

Le répertoire "fonts" peut être supprimés à partir de cette étape.

Ouvrir un nouveau terminal et choisir une police compatible "powerline" parmi celles qui ont été installées :

```text
======================================= ========================= ====================================
 Powerline Font Family                   Formerly Known As         License
======================================= ========================= ====================================
 3270                                    3270                      BSD/CCAS 3.0
 Anonymice Powerline                     Anonymous Pro             SIL Open Font License, Version 1.1
 Arimo Powerline                         Arimo                     Apache License, Version 2.0
 Cousine Powerline                       Cousine                   Apache License, Version 2.0
 D2Coding for Powerline                  D2Coding                  SIL Open Font License, Version 1.1
 DejaVu Sans Mono for Powerline          DejaVu Sans Mono          DejaVu Fonts License, Version 1.0
 Droid Sans Mono for Powerline           Droid Sans Mono           Apache License, Version 2.0
 Droid Sans Mono Dotted for Powerline    Droid Sans Mono Dotted    Apache License, Version 2.0
 Droid Sans Mono Slashed for Powerline   Droid Sans Mono Slashed   Apache License, Version 2.0
 Fira Mono for Powerline                 Fira Mono                 SIL OPEN FONT LICENSE Version 1.1
 Go Mono for Powerline                   Go Mono                   Go's License
 Hack                                    Hack                      SIL OFL, v1.1 + Bitstream License
 Inconsolata for Powerline               Inconsolata               SIL Open Font License, Version 1.0
 Inconsolata-dz for Powerline            Inconsolata-dz            SIL Open Font License, Version 1.0
 Inconsolata-g for Powerline             Inconsolata-g             SIL Open Font License, Version 1.0
 Input Mono                              Input Mono                `Input’s license 
 Liberation Mono Powerline               Liberation Mono           SIL Open Font License, Version 1.1
 ProFontWindows                          ProFont for Powerline     MIT License
 Meslo for Powerline                     Meslo                     Apache License, Version 2.0
 Source Code Pro for Powerline           Source Code Pro           SIL Open Font License, Version 1.1
 Meslo Dotted for Powerline              Meslo Dotted              Apache License, Version 2.0
 Meslo Slashed for Powerline             Meslo Dotted              Apache License, Version 2.0
 Monofur for Powerline                   Monofur                   Freeware
 Noto Mono for Powerline                 Noto Mono                 SIL Open Font License, Version 1.1
 Roboto Mono for Powerline               Roboto Mono               Apache License, Version 2.0
 Symbol Neu Powerline                    Symbol Neu                Apache License, Version 2.0
 Terminess Powerline                     Terminus                  SIL Open Font License, Version 1.1
 Tinos Powerline                         Tinos                     Apache License, Version 2.0
 Ubuntu Mono derivative Powerline        Ubuntu Mono               Ubuntu Font License, Version 1.0
 Space Mono for Powerline                Space Mono                SIL Open Font License, Version 1.1
======================================= ========================= ====================================
```

### snap et snap store

Pour béneficer de snap et de son **store** :

```bash
$ sudo apt update
$ sudo apt install snapd
```

Rebooter ou quitter la session en cours.

Pour le store :

```bash
$ sudo snap install snap-store
snap-store 20191114.a9948d5 par Canonical✓ installé
```

### générer une représentation texte d'un répertoire pour Markdown

Créer un exécutable `mdgentree.sh` dans

```bash
#!/bin/bash
export pwd=$(pwd)
find $pwd | sed -e "s;$pwd;\.;g;s;[^/]*\/;|__;g;s;__|; |;g"
```

Exemple de génération :

```bash
robin:~/git/XenonReborn $ ~/.bin/mdgentree 
.
|__gradle
| |__wrapper
| | |__gradle-wrapper.jar
| | |__gradle-wrapper.properties
|__build.gradle
|__core
| |__build.gradle
| |__.travis.yml
| |__src
| | |__fr
| | | |__fxjavadevblog
| | | | |__xr
| | | | | |__commons
| | | | | | |__gamepads
| | | | | | | |__ControllerAdapter.java
| | | | | | | |__ControllerFactory.java
| | | | | | |__UserControls.java
| | | | | | |__utils
| | | | | | | |__ModPlayer.java
| | | | | | | |__MusicPlayer.java
| | | | | | | |__RandomUtils.java
| | | | | | | |__GameControls.java
| | | | | | | |__DeltaTimeAccumulator.java
| | | | | |__screens
| | | | | | |__AbstractScreen.java
| | | | | | |__loading
| | | | | | | |__LoadingScreen.java
| | | | | | |__game
| | | | | | | |__ShipStateObserver.java
| | | | | | | |__TiledMapScrolling.java
| | | | | | | |__DashBoard.java
| | | | | | | |__BackgroundParallaxScrolling.java
| | | | | | | |__GamePlayScreen.java
| | | | | | |__menu
| | | | | | | |__MenuScreen.java
| | | | | | | |__BackgroundTravelling.java
| | | | | | |__XenonControler.java
| | | | | | |__MainControler.java
| | | | | | |__XenonScreen.java
| | | | | | |__XenonScreenFactory.java
| |__assets
| | |__commons
| | | |__bonus.png
| | | |__bonus-power-up-anim.png
| | | |__life.png
| | | |__xenon-reborn.png
| | |__mods
| | | |__trance-124.mod
| | | |__aa_xenon.xm
| | | |__xenon220.xm
| | | |__doodle-doo.mod
| | | |__xenon2.mod
| | | |__intro.mod
| | | |__space-megamix.mod
| | | |__faktory.mod
| | | |__breathtaker.mod
| | |__log4j2.xml
| | |__ships
| | | |__ship_noreactor.png
| | | |__ship_old.png
| | | |__ship_right.png
| | | |__ship_left.png
| | | |__ship_normal.png
| | | |__shield.png
| | |__musics
| | | |__blank.mp3
| | |__backgrounds
| | | |__right_bg.png
| | | |__ghostbusters-bzhcamp.png
| | | |__footer.png
| | | |__left_bg.png
| | | |__bombing-pixels-white.jpg
| | | |__space.jpg
| | |__sounds
| | | |__bonus.mp3
| | | |__explosion.mp3
| | | |__game-over.mp3
| | | |__shield-activated.mp3
| | | |__big-shoot.mp3
| | | |__shield_down.mp3
| | | |__clic.mp3
| | | |__shoot.mp3
| | | |__ship_explosion.mp3
| | | |__shield_up.mp3
| |__logs
| | |__refs
|__gradle.properties
|__README.md
```

Autre solution, installer `tree` qui génère un résultat bien plus agréable.

```bash
$ sudo apt-get install tree
$ tree --dirsfirst
.
├── core
│   ├── assets
│   │   ├── backgrounds
│   │   │   ├── bombing-pixels-white.jpg
│   │   │   ├── footer.png
│   │   │   ├── ghostbusters-bzhcamp.png
│   │   │   ├── left_bg.png
│   │   │   ├── right_bg.png
│   │   │   └── space.jpg
│   │   ├── commons
│   │   │   ├── bonus.png
│   │   │   ├── bonus-power-up-anim.png
│   │   │   ├── life.png
│   │   │   └── xenon-reborn.png
│   │   ├── enemies
│   │   │   ├── big-enemy.png
│   │   │   ├── black-bird.png
│   │   │   ├── bug.png
│   │   │   ├── enemy.png
│   │   │   ├── perforator.png
│   │   │   ├── rafale.png
│   │   │   └── xenon-ship.png
│   │   ├── fonts
│   │   │   ├── computer_pixel-7.ttf
│   │   │   ├── font-blue.png
│   │   │   ├── font-blue.properties
│   │   │   ├── font-green.png
│   │   │   ├── font-green.properties
│   │   │   ├── font-xenon-2.png
│   │   │   ├── font-xenon-2.properties
│   │   │   ├── font-xenon.png
│   │   │   ├── PixelOperatorHB.ttf
│   │   │   └── ShareTech-Regular.ttf
├── build.gradle
├── gradle.properties
├── gradlew
├── gradlew.bat
├── README.md
└── settings.gradle

54 directories, 148 files
```

### Bash Alias : mes petites astuces

Petits ajouts pratiques pour les commandes bash à ajouter à `~/.bashrc` :

```bash
alias cls='clear'
alias lh='ls -gFh --group-directories-first --time-style=long-iso'
alias ..='cd ..'

function mkcd {
    mkdir -p $1
    cd $1
}

function cl {
    cd $1
    lh
}
```

Exemples :

- `cls` : efface l'écran, ça me rappelle mon [MO5 et mon TO8](/about/#1984-1989--découverte-pendant-mon-enfance)
- `lh` : c'est un `ls -l` un peu optimisé. Il met les répertoires en premier, affiche de jolies dates et les unités de taille des fichiers sont simple à lire.
- `mkcd mon_repertoire` : va créer un répertoire `mon_repertoire` et se placer automatiquement dedans.
- `cl mon_repertoire` : va se placer dans le répertoire et afficher son contenu avec un `lh`.
- `..` : se place dans le répertoire parent, comme un `cd ..` mais on gagne 3 caractères.

### Echoing like a Terminator

Pour afficher le contenu d'un fichier comme dans Terminator.
Ca sert à rien, mais c'est FUNNY.

```bash
$ cat myfile.txt | pv -qL50
$ echo "I'll be back!" | pv -qL10
```

### Ajouter la clé SSH publique d'un utilisateur à un serveur distant

Prérerquis : avoir généré une clé SSH publique/privée sur le poste local.

Version simple, si vous avez déjà un utilisateur sur le serveur distant :

```bash
$ ssh-copy-id -i ~/.ssh/id_rsa.pub user@server
```

Version plus complète, si vous n'avez pas encore d'utilisateur sur le serveur distant, à partir de ce serveur :

```bash
$ sudo adduser user
$ sudo mkdir -p /home/user/.ssh
$ cat id_rsa.pub >> /home/user/.ssh/authorized_keys
$ chmod 700 /home/user/.ssh
$ chmod 600 /home/user/.ssh/authorized_keys
$ chown -R user:user /home/user
```

## Java & Co

### Maven : forcer l'usage d'un JDK avec .mavenrc

Pour l'utilisateur courant, éditer le fichier `~/.mavenrc` et ajouter ce contenu (à adapter en fonction du chemin réel vers le JDK à désigner):

```bash
export JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64/
```

Pour une modification "system wide" (quel que soit l'utilisateur ), éditer le fichier `/etc/mavenrc` et y faire un `export JAVA_HOME` de la même manière que ci-dessus.

La commande `mvn` lance au démarrage ce script qui affecte donc la bonne valeur à la variable d'environnement `JAVA_HOME`.

### Maven : clean recursif sur des projets maven

Ce script permet de lancer un "maven clean" à partir d'une arborescence de manière récursive et de nettoyer ansi tous les builds :

```bash
echo "Cleaning all maven projects recursively"

find . -name "pom.xml" -exec mvn clean -f '{}'
```

source : [https://stackoverflow.com/questions/15895805/find-pom-in-subdirectories-and-execute-mvn-clean](https://stackoverflow.com/questions/15895805/find-pom-in-subdirectories-and-execute-mvn-clean)

### Minimal POM Java 11

Voici la structure minimale d'un POM Java 11 (pom.xml) avec :

- lombok 1.18.10
- logback classic 1.2.3 et SLF4J (transitive dep)
- commons-lang 3.9

```xml
<properties>
       <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
       <project.reporting.outputEncoding>UTF-8</project.reporting.outputEncoding>
       <maven.compiler.target>11</maven.compiler.target>
       <maven.compiler.source>11</maven.compiler.source>
       <lombok.version>1.18.10</lombok.version>
       <logback.version>1.2.3</logback.version>
       <commons-lang.version>3.9</commons-lang.version>
</properties>

<dependencies>
       <dependency>
              <groupId>org.projectlombok</groupId>
              <artifactId>lombok</artifactId>
              <version>${lombok.version}</version>
              <scope>provided</scope>
       </dependency>

       <dependency>
              <groupId>ch.qos.logback</groupId>
              <artifactId>logback-classic</artifactId>
              <version>${logback.version}</version>
       </dependency>

       <dependency>
              <groupId>org.apache.commons</groupId>
              <artifactId>commons-lang3</artifactId>
              <version>${commons-lang.version}</version>
       </dependency>
</dependencies>
```

## Divers

### Gitlab

Arrêter le service gitlab :

```bash	
$ sudo gitlab-ctl stop
```

Retirer gitlab du démarrage automatique :

```bash
$ sudo systemctl disable gitlab-runsvdir.service
```

### VirtualBox : redimensionner un fichier VDI

Cela doit se faire en plusieurs étapes mais au préalable, il vaut mieux éteindre la machine virtuelle (shutdown).

Ensuite, dans un terminal :

```bash
$ VBoxManage modifyhd fichier.vdi --resize 20000
```

> Dans cet exemple la partition fera 20 Go à l'issue du  re-dimensionnement pour VirtualBOx

Puis, lancer la VM et ouvrir un gestionnaire de disques (GParted sous Linux par exemple) et allouer tout l'espace à la partition en la redimensionnant.

### BrowserSync

#### Installation

```
$ sudo su
$ apt-get update && apt-get -y upgrade && apt-get –y autoremove
$ wget -qO- https://deb.nodesource.com/setup_12.x | sudo -E bash -
$ apt-get install -y nodejs
$ npm install -g browser-sync
```

#### Exécution

Dans le cas ci dessous l'application doit être déployée au moins une fois par Eclipse dans le répertoire
du serveur d'application. Chaque changement est écouté et la page (même JSF) est rechargée à la volée en 
cas de changement sur le disque.

```bash
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

### Démarrer et arrêter les services Docker

Ce script permet d'arrêter ou lancer les services liés à Docker :

```bash
#!/bin/bash
# Author : FX ROBIN - 2020-04-06


if [ "$1" = "--help" ]
then
  echo "Starts or stops Docker services"
  echo "Usage : dctl [start|stop]"
  exit 0
fi

# inclusion des affichages en couleur avec printc
RESTORE='\033[0m'

RED='\e[91m'
GREEN='\e[92m'
YELLOW='\033[00;33m'
BLUE='\033[00;34m'
PURPLE='\033[00;35m'
CYAN='\033[00;36m'
LIGHTGRAY='\033[00;37m'

function printc()
{
 echo -e "$1$2"
 echo -en "${RESTORE}"
}

#inclusion de la vérification des droits super-utilisateur
if [ "$EUID" -ne 0 ]; then
  printc $RED "This script must be run as super user. Try this : sudo dctl start|stop"
  exit 2
fi  

if [[ "start stop" != *"$1"* ]]; then
  printc $RED "Bad parameter. Should be 'start' or 'stop'."
  exit 2
fi

# STARTING

case $1 in
	start)
		printc $GREEN ">_Starting Docker ..."
		systemctl enable docker.socket
		systemctl enable docker.service

		systemctl start docker.socket
		systemctl start docker.service
		;;
	stop)
		printc $RED ">_Stoping Docker ..."
		systemctl stop docker.service
		systemctl stop docker.socket

		systemctl disable docker.socket
		systemctl disable docker.service
		;;
esac		
		
systemctl --no-pager status docker.service | grep "Active:"
```


Usage :

```bash
$ dctl start
>_Starting Docker ...
Created symlink /etc/systemd/system/sockets.target.wants/docker.socket → /lib/systemd/system/docker.socket.
Synchronizing state of docker.service with SysV service script with /lib/systemd/systemd-sysv-install.
Executing: /lib/systemd/systemd-sysv-install enable docker
insserv: warning: current start runlevel(s) (empty) of script `docker' overrides LSB defaults (2 3 4 5).
insserv: warning: current stop runlevel(s) (0 1 2 3 4 5 6) of script `docker' overrides LSB defaults (0 1 6).
   Active: active (running) since Mon 2020-04-06 14:57:00 CEST; 6ms ago
```

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
