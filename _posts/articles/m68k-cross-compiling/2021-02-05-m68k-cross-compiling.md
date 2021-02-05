---
layout: post
title: Programmation C pour Atari ST sous Linux
subtitle: cross-compilation d'un Helloworld pour TOS et GEM
logo: atari-st-bomb.png
category: articles
tags: [Retro, C]
lang: fr
ref: m68k-cross-compiling
---

<div class="intro" markdown='1'>

L'objectif de ce petit tutorial est de compiler 2 programmes C pour TOS puis GEM, à partir de Linux.

Les fichiers exécutables seront testés avec l'émulateur HATARI, avant d'être
réllement exécutés sur un Atari ST en "*plastique et en os*". 
</div>
<!--excerpt-->

> Notez le jeu de mot sur "*os*", c'est cadeau, pour toi public !


## Préambule et remerciements

Avant de commencer ce léger tutorial, je tiens à remercier Vincent Rivière
pour sa passion et son travail formidable autours de l'Atari ST, toujours
aujourd'hui, en 2021 et particulièrement le cross-compiler 68k qui sera utilisé
dans ce tutorial.

> "Vincent, si tu nous écoutes ..." 

Je remercie aussi Arnaud Bercegeay pour la librairie GEM qui sera utilisée dans une partie de ce tutorial.


> "Arnaud, si tu nous lis ..."

Voilà c'était la minute "*Michel Drucker*", passons aux choses sérieures, qui ne le sont pas vraiment.

## Installation du cross-compiler GCC pour 68000

Par défaut, sous Linux, la cible 68000, le processeur de l'Atari ST (et de l'Amiga), est complétement inconnue. 

Il faut donc installer de quoi "*cross-compiler*" un programme C pour 68000 sous un bon vieux Linux X86, pour ma part en 64 bits.

Ceci est d'une simplicité extrème sous Ubuntu et dérivés (je suis sous Mint), 
grâce au PPA de Vincent Rivière et des packages qu'il a préparés pour nous :

```bash
$ sudo add-apt-repository ppa:vriviere/ppa
```

```text
Vous êtes sur le point d'ajouter le PPA suivant :
 PPA for the m68k-atari-mint cross-tools.
See http://vincent.riviere.free.fr/soft/m68k-atari-mint/ubuntu.php for instructions.
 Plus d'informations : https://launchpad.net/~vriviere/+archive/ubuntu/ppa
Appuyez sur Entrée pour continuer ou Ctrl+C pour annuler

Executing: /tmp/apt-key-gpghome.a7viURPyI0/gpg.1.sh --keyserver hkps://keyserver.ubuntu.com:443 --recv-keys BFD8768B6878C33FDFD082C94AAD3A5DB5690522
gpg: clef 4AAD3A5DB5690522 : clef publique « Launchpad PPA for Vincent Rivière » importée
gpg: Quantité totale traitée : 1
gpg:               importées : 1
```

```bash
$ sudo apt update
$ sudo apt sudo apt install cross-mint-essential
```

```text
Les paquets supplémentaires suivants seront installés : 
  binutils-m68k-atari-mint gcc-m68k-atari-mint gemlib-m68k-atari-mint mintbin-m68k-atari-mint mintlib-m68k-atari-mint pml-m68k-atari-mint
Les NOUVEAUX paquets suivants seront installés :
  binutils-m68k-atari-mint cross-mint-essential gcc-m68k-atari-mint gemlib-m68k-atari-mint mintbin-m68k-atari-mint mintlib-m68k-atari-mint pml-m68k-atari-mint
...
...
Paramétrage de mintbin-m68k-atari-mint (0.3-qCVS-20110527-2ppa20200501220938~bionic) ...
Paramétrage de mintlib-m68k-atari-mint (0.60.1.Git-20200504-1ppa20200506194738~bionic) ...
Paramétrage de binutils-m68k-atari-mint (2.30-mint-20180703-1ppa20200501220650~bionic) ...
Paramétrage de gemlib-m68k-atari-mint (0.43.6-qGit-20170304-2ppa20200501105521~bionic) ...
Paramétrage de pml-m68k-atari-mint (2.03-mint-20191013-3ppa20200505192610~bionic) ...
Paramétrage de gcc-m68k-atari-mint (4.6.4-mint-20200504-3ppa20200505195236~bionic) ...
Paramétrage de cross-mint-essential (1.0-3ppa20200501105507~bionic) ...
```

On vérifie que le compilateur est présent :

```bash
$ m68k-atari-mint-gcc --version
```

```
m68k-atari-mint-gcc (GCC) 4.6.4 (MiNT 20200504)
Copyright (C) 2011 Free Software Foundation, Inc.
This is free software; see the source for copying conditions.  There is NO
warranty; not even for MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
```

Première étape satisfaisante, la dopamine commence à se secréter ...

## Compilation d'un programme TOS

On se créer un petit programme en C, tout classique, un violant "Hello Bitmap Brothers", parce que dire bonjour au *monde* me parait un peu présomptueux.

`hello_bb.c`
```c
#include <stdio.h>

void main()
{
    printf("Hello Bitmap Brothers!\n");
    printf("Press Enter");
    getchar();
}
```

on compile cette oeuvre avec notre beau cross-compiler GCC :

```bash
$ m68k-atari-mint-gcc hello_bb.c -o hello_bb.tos
```

Le fichier exécutable `hello_bb.tos` vient d'apparaitre dans le dossier,
mais mon petit linux est bien incapable d'en faire quoi que ce soit sans un 
émulateur 68000 : Hatari, c'est le sujet de la section suivante.

## Installation, paramétrage et lancement du programme sous Hatari

Pour installer l'émulateur [Hatari](https://hatari.tuxfamily.org/),il suffit d'une toute petite ligne "*bash*" :

```bash
$ sudo apt-get install hatari
```

Voilà, c'est presque prêt, car l'émulateur a besoin du TOS (ou plutôt d'un TOS). Je récupère [EmuTOS](https://emutos.sourceforge.io/) qui est une version libre du TOS et je le place dans un répertoire "`../tos/etos256fr.img`". J'ai pris la version française.

Je n'ai plus qu'à lancer directement le programme compilé précédemment, en configurant Hatari avec les paramètres suivants : 

- `-t ../tos/etos256fr.img` : utiliser la ROM Emutos
-  `-d .` : créer un disque dur "C" visible par l'Atari, pointant à la racine de mon répertoire courant, là où ce trouve le fichier `hello_bb.tos` :
- `--auto "C:\hello_bb.tos"` : préciser le programme à lancer
- `--tos-res med` : être en moyenne résolution, juste pour le *fun*.

Cela donne la ligne de commande suivante :

```bash
$ hatari -t ../tos/etos256fr.img -d . --auto "C:\hello_bb.tos" --tos-res med
```

L'émulateur Hatari se lance et lance directement le programme `hello_bb.tos` :

![TOS Result](/images/m68k-cross-compiling/tos.png){: .fakescreen}

La dopamine commence à atteindre un niveau élevé dans le cerveau ! Mais on ne
va pas s'arrêter en si bon chemin ...

## Compilation d'un programme GEM

GEM c'est l'environnement graphique de l'Atari ST. 
C'est gestionnaire de fenêtres conçu en 1984 par Intel, porté sur 68000 par Atari en 1985
A la même époque on trouve Microsoft Windows 1.0 (Oui, 1.0 !).

> En bref, GEM offre le *machin* qu'on manipule avec la souris et qui a des fenêtres sur un fond vert.

Nous allons coder un progamme `PRG` pour Atari, qui utilisent les fonctionnalités du GEM, notamment la création d'une fenêtre modale, au moyen de la librarie "[GEM Lib](http://arnaud.bercegeay.free.fr/gemlib/)"

Encore une fois, grâce au travail d'Arnaud Bercegeay pour la librairie GEM et de Vincent Rivière pour le packaging Ubuntu, c'est d'une simplicité enfantine. Même la génération Z devrait en être capable. Ok, c'est facile et gratuit venant d'une génération X, mais ça fait du bien.

```bash
$ sudo apt install gemma-m68k-atari-mint
```

Voilà, facile.

Ensuite, un petit programme qui utilise cette bibliothèque :

`hello_ge.c`
```c
#include <gem.h>

int main( void) 
{
	appl_init();
	form_alert( 1, "[1][Hello GEM!][OK]");
	appl_exit();
	return 0;
}
```

Que l'on compile en indiquant bien la librairie "`gem`" :

```bash
$ m68k-atari-mint-gcc hello_ge.c -o hello_ge.prg -lgem
```

> Notez que je veille à ce que mon fichier n'ait que 8 caractères avant l'extension, même si cela fonctionne 
> aussi avec plus de caractères sous Hatari.

Ensuite je relance l'émulateur :

```bash
$ hatari -t ../tos/etos256fr.img -d . --auto "C:\hello_ge.prg" --tos-res med
```

Et j'obtiens ceci :

![GEM Result](/images/m68k-cross-compiling/gem.png){: .fakescreen}

Overdose de dopamine ...

## Conclusion

Utiliser une chaine de compilation sous Linux pour produire des exécutables pour l'Atari ST et son 68000, c'est vraiment pratique.

Je n'ai plus qu'à transférer le tout sur un réel Atari ST et profiter ...

Pour info, à titre personnel, je peux transférer des fichiers sur mon Atari 1040 STE grâce :

- à une disquette formatée en DOS 720k et donc à un lecteur de disquette compatible. Même en USB, cela existe.
- à Ghostlink + interface RS 232 + DosBox que j'utilise sur un Raspberry PI.
- à une carte SD, reliée à un convertisseur SD/IDE, lui-même relié à un [contrôleur IDE, directement sur le 68000](https://forum.system-cfg.com/viewtopic.php?t=6889).

Enfin, il existe de nombreuses librairies qui ont été portées pour 68k, notamment SDL 1.2, ce qui
m'intéressera dans un autre tutorial à venir, si cela fonctionne pour mon STE ...

## Liens

- Packaging Cross Compiler 68k par Vicent Rivière pour Ubuntu : http://vincent.riviere.free.fr/soft/m68k-atari-mint/ubuntu.php
- Hatari : https://hatari.tuxfamily.org/
- Emutos : https://emutos.sourceforge.io/
- GEM Lib : http://arnaud.bercegeay.free.fr/gemlib/
- Chaine Youtube Vretrocomputing de Vincent Rivière : https://www.youtube.com/channel/UCG4S3PerB8tmodN-tpGQthA

