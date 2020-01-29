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

## Maven : forcer l'usage d'un JDK avec .mavenrc

Editer le fichier `~/.mavenrc` et ajouter ce contenu (à adapter en fonction du chemin réel vers le JDK à désigner):

```bash
export JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64/
```

La commande `mvn` lance au démarrage ce script qui affecte donc la bonne valeur à la variable d'environnement `JAVA_HOME`.

## Minimal POM Java 11

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

## VirtualBox : redimensionner un fichier VDI

Fermer la machine virtuelle (shutdown), puis dans un terminal :

```
$ VBoxManage modifyhd fichier.vdi --resize 20000`
```

> Dans cet exemple la partition fera 20 Go à l'issue du  re-dimensionnement.

Puis, lancer la VM et ouvrir un gestionnaire de disques (GParted sous Linux par exemple), et allouer tout l'espace à la partition.

## BrowserSync

### Installation

```
$ sudo su
$ apt-get update && apt-get -y upgrade && apt-get –y autoremove
$ wget -qO- https://deb.nodesource.com/setup_12.x | sudo -E bash -
$ apt-get install -y nodejs
$ npm install -g browser-sync
```

### Exécution

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

## Scripting Linux

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
| | | | | | | |__GdxCommons.java
| | | | | | |__fonts
| | | | | | | |__ttf
| | | | | | | | |__GdxTrueTypeString.java
| | | | | | | | |__TrueTypeFont.java
| | | | | | | |__bitmap
| | | | | | | | |__BitmapFont.java
| | | | | | | | |__FontUtils.java
| | | | | | | | |__GdxBitmapString.java
| | | | | | |__Global.java
| | | | | | |__SingleExecutor.java
| | | | | | |__libs
| | | | | | | |__MusicAsset.java
| | | | | | | |__TextureAsset.java
| | | | | | | |__ModAsset.java
| | | | | | | |__FontAsset.java
| | | | | | | |__AssetLib.java
| | | | | | | |__AnimationAsset.java
| | | | | | | |__SoundAsset.java
| | | | | | |__displays
| | | | | | | |__Blinker.java
| | | | | | | |__Displayable.java
| | | | | | | |__Renderable.java
| | | | | | | |__Fader.java
| | | | | | | |__Interpolator.java
| | | | | | | |__RenderableAdapter.java
| | | | | | | |__AnimatedSprite.java
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
| | | | | |__artefacts
| | | | | | |__Event.java
| | | | | | |__ArtefactsScene.java
| | | | | | |__AbstractArtefact.java
| | | | | | |__collectables
| | | | | | | |__BonusType.java
| | | | | | | |__Bonus.java
| | | | | | |__managers
| | | | | | | |__CollisionManager.java
| | | | | | | |__ProjectileManager.java
| | | | | | | |__BonusManager.java
| | | | | | | |__ExplosionManager.java
| | | | | | | |__EnemyManager.java
| | | | | | | |__ScoreManager.java
| | | | | | |__Artefact.java
| | | | | | |__ArtefactData.java
| | | | | | |__enemies
| | | | | | | |__Enemy.java
| | | | | | | |__EnemyType.java
| | | | | | | |__Bullet.java
| | | | | | |__friendly
| | | | | | | |__addons
| | | | | | | | |__Shield.java
| | | | | | | |__ship
| | | | | | | | |__Ship.java
| | | | | | | | |__ShipHandler.java
| | | | | | | | |__ShipRenderer.java
| | | | | | | | |__ShipInput.java
| | | | | | | |__weapons
| | | | | | | | |__ShootType.java
| | | | | | | | |__Shoot.java
| | | | | | | | |__SecondWeapon.java
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
| | |__fonts
| | | |__computer_pixel-7.ttf
| | | |__font-blue.properties
| | | |__font-xenon-2.properties
| | | |__font-green.png
| | | |__font-xenon.png
| | | |__font-green.properties
| | | |__PixelOperatorHB.ttf
| | | |__font-blue.png
| | | |__ShareTech-Regular.ttf
| | | |__font-xenon-2.png
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
| | |__shoots
| | | |__bullet.png
| | | |__shoot-anim.png
| | | |__shoot.png
| | | |__little-explosion.png
| | | |__big-shoot.png
| | | |__explosion-sheet.png
| | |__enemies
| | | |__xenon-ship.png
| | | |__enemy.png
| | | |__perforator.png
| | | |__bug.png
| | | |__rafale.png
| | | |__big-enemy.png
| | | |__black-bird.png
| | |__maps
| | | |__map.tmx
| | | |__level01static_resized.png
| | | |__tiles.tsx
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
| |__out
| | |__production
| | | |__classes
| | | | |__META-INF
| | | | | |__XenonReborn.core.main.kotlin_module
| |__.gitignore
|__.travis.yml
|__.vscode
| |__.gitignore
|__docs
| |__dclaa-screens.png
| |__dclaa-game.png
|__.git
| |__objects
| | |__info
| | |__pack
| | | |__pack-24494b1384d2955879ae045fb19ce6ec14056cc2.pack
| | | |__pack-24494b1384d2955879ae045fb19ce6ec14056cc2.idx
| |__config
| |__refs
| | |__tags
| | |__heads
| | | |__master
| | |__remotes
| | | |__origin
| | | | |__HEAD
| |__branches
| |__index
| |__hooks
| | |__pre-rebase.sample
| | |__pre-commit.sample
| | |__pre-receive.sample
| | |__update.sample
| | |__pre-applypatch.sample
| | |__prepare-commit-msg.sample
| | |__commit-msg.sample
| | |__applypatch-msg.sample
| | |__pre-push.sample
| | |__fsmonitor-watchman.sample
| | |__post-update.sample
| |__description
| |__packed-refs
| |__info
| | |__exclude
| |__HEAD
| |__logs
| | |__refs
| | | |__heads
| | | | |__master
| | | |__remotes
| | | | |__origin
| | | | | |__HEAD
| | |__HEAD
|__desktop
| |__build.gradle
| |__.travis.yml
| |__src
| | |__fr
| | | |__fxjavadevblog
| | | | |__xr
| | | | | |__Launcher.java
| |__out
| | |__production
| | | |__classes
| | | | |__META-INF
| | | | | |__XenonReborn.desktop.main.kotlin_module
|__gradlew
|__gradlew.bat
|__libs
| |__modplayer-1.0.0.jar
| |__readme.md
|__project-resources
| |__regles-code-formatter-eclipse.xml
|__settings.gradle
|__.gitignore
|__gradle.properties
|__README.md
```

autre solution, installer `tree`

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
│   │   ├── maps
│   │   │   ├── level01static_resized.png
│   │   │   ├── map.tmx
│   │   │   └── tiles.tsx
│   │   ├── mods
│   │   │   ├── aa_xenon.xm
│   │   │   ├── breathtaker.mod
│   │   │   ├── doodle-doo.mod
│   │   │   ├── faktory.mod
│   │   │   ├── intro.mod
│   │   │   ├── space-megamix.mod
│   │   │   ├── trance-124.mod
│   │   │   ├── xenon220.xm
│   │   │   └── xenon2.mod
│   │   ├── musics
│   │   │   └── blank.mp3
│   │   ├── ships
│   │   │   ├── shield.png
│   │   │   ├── ship_left.png
│   │   │   ├── ship_noreactor.png
│   │   │   ├── ship_normal.png
│   │   │   ├── ship_old.png
│   │   │   └── ship_right.png
│   │   ├── shoots
│   │   │   ├── big-shoot.png
│   │   │   ├── bullet.png
│   │   │   ├── explosion-sheet.png
│   │   │   ├── little-explosion.png
│   │   │   ├── shoot-anim.png
│   │   │   └── shoot.png
│   │   ├── sounds
│   │   │   ├── big-shoot.mp3
│   │   │   ├── bonus.mp3
│   │   │   ├── clic.mp3
│   │   │   ├── explosion.mp3
│   │   │   ├── game-over.mp3
│   │   │   ├── shield-activated.mp3
│   │   │   ├── shield_down.mp3
│   │   │   ├── shield_up.mp3
│   │   │   ├── ship_explosion.mp3
│   │   │   └── shoot.mp3
│   │   └── log4j2.xml
│   ├── out
│   │   └── production
│   │       └── classes
│   │           └── META-INF
│   │               └── XenonReborn.core.main.kotlin_module
│   ├── src
│   │   └── fr
│   │       └── fxjavadevblog
│   │           └── xr
│   │               ├── artefacts
│   │               │   ├── collectables
│   │               │   │   ├── Bonus.java
│   │               │   │   └── BonusType.java
│   │               │   ├── enemies
│   │               │   │   ├── Bullet.java
│   │               │   │   ├── Enemy.java
│   │               │   │   └── EnemyType.java
│   │               │   ├── friendly
│   │               │   │   ├── addons
│   │               │   │   │   └── Shield.java
│   │               │   │   ├── ship
│   │               │   │   │   ├── ShipHandler.java
│   │               │   │   │   ├── ShipInput.java
│   │               │   │   │   ├── Ship.java
│   │               │   │   │   └── ShipRenderer.java
│   │               │   │   └── weapons
│   │               │   │       ├── SecondWeapon.java
│   │               │   │       ├── Shoot.java
│   │               │   │       └── ShootType.java
│   │               │   ├── managers
│   │               │   │   ├── BonusManager.java
│   │               │   │   ├── CollisionManager.java
│   │               │   │   ├── EnemyManager.java
│   │               │   │   ├── ExplosionManager.java
│   │               │   │   ├── ProjectileManager.java
│   │               │   │   └── ScoreManager.java
│   │               │   ├── AbstractArtefact.java
│   │               │   ├── ArtefactData.java
│   │               │   ├── Artefact.java
│   │               │   ├── ArtefactsScene.java
│   │               │   └── Event.java
│   │               ├── commons
│   │               │   ├── displays
│   │               │   │   ├── AnimatedSprite.java
│   │               │   │   ├── Blinker.java
│   │               │   │   ├── Displayable.java
│   │               │   │   ├── Fader.java
│   │               │   │   ├── Interpolator.java
│   │               │   │   ├── RenderableAdapter.java
│   │               │   │   └── Renderable.java
│   │               │   ├── fonts
│   │               │   │   ├── bitmap
│   │               │   │   │   ├── BitmapFont.java
│   │               │   │   │   ├── FontUtils.java
│   │               │   │   │   └── GdxBitmapString.java
│   │               │   │   └── ttf
│   │               │   │       ├── GdxTrueTypeString.java
│   │               │   │       └── TrueTypeFont.java
│   │               │   ├── gamepads
│   │               │   │   ├── ControllerAdapter.java
│   │               │   │   └── ControllerFactory.java
│   │               │   ├── libs
│   │               │   │   ├── AnimationAsset.java
│   │               │   │   ├── AssetLib.java
│   │               │   │   ├── FontAsset.java
│   │               │   │   ├── ModAsset.java
│   │               │   │   ├── MusicAsset.java
│   │               │   │   ├── SoundAsset.java
│   │               │   │   └── TextureAsset.java
│   │               │   ├── utils
│   │               │   │   ├── DeltaTimeAccumulator.java
│   │               │   │   ├── GameControls.java
│   │               │   │   ├── GdxCommons.java
│   │               │   │   ├── ModPlayer.java
│   │               │   │   ├── MusicPlayer.java
│   │               │   │   └── RandomUtils.java
│   │               │   ├── Global.java
│   │               │   ├── SingleExecutor.java
│   │               │   └── UserControls.java
│   │               └── screens
│   │                   ├── game
│   │                   │   ├── BackgroundParallaxScrolling.java
│   │                   │   ├── DashBoard.java
│   │                   │   ├── GamePlayScreen.java
│   │                   │   ├── ShipStateObserver.java
│   │                   │   └── TiledMapScrolling.java
│   │                   ├── loading
│   │                   │   └── LoadingScreen.java
│   │                   ├── menu
│   │                   │   ├── BackgroundTravelling.java
│   │                   │   └── MenuScreen.java
│   │                   ├── AbstractScreen.java
│   │                   ├── MainControler.java
│   │                   ├── XenonControler.java
│   │                   ├── XenonScreenFactory.java
│   │                   └── XenonScreen.java
│   └── build.gradle
├── desktop
│   ├── out
│   │   └── production
│   │       └── classes
│   │           └── META-INF
│   │               └── XenonReborn.desktop.main.kotlin_module
│   ├── src
│   │   └── fr
│   │       └── fxjavadevblog
│   │           └── xr
│   │               └── Launcher.java
│   └── build.gradle
├── docs
│   ├── dclaa-game.png
│   └── dclaa-screens.png
├── gradle
│   └── wrapper
│       ├── gradle-wrapper.jar
│       └── gradle-wrapper.properties
├── libs
│   ├── modplayer-1.0.0.jar
│   └── readme.md
├── project-resources
│   └── regles-code-formatter-eclipse.xml
├── build.gradle
├── gradle.properties
├── gradlew
├── gradlew.bat
├── README.md
└── settings.gradle

54 directories, 148 files
```

### mkcd et cls

Petits ajouts pratiques pour les commandes bash à ajouter à `~/.bashrc` :

```bash
alias cls='clear'

function mkcd {
    mkdir -p $1
    cd $1
}
```

### maven clean recursif sur des projets maven

Ce script permet de lancer un "maven clean" à partir d'une arborescence de manière récursive et de nettoyer ansi tous les builds :

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
