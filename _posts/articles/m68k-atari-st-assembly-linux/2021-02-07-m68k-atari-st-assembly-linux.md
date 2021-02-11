---
layout: post
title: Assembleur 68000 pour Atari ST sous Linux
subtitle: compilation Assembleur pour TOS avec VASM et VLINK
logo: atari-st-full-scene-small.png
category: articles
tags: [Retro, Assembleur, Atari-ST]
lang: fr
ref: m68k-atari-st-assembly-linux
---

<div class="intro" markdown='1'>

Ce bref tutorial montre comment compiler, à partir de Linux, un programme en assembleur pour le TOS de l'Atari ST
avec le compilateur `vasm` et le *linker* `vlink`.

Le fichier exécutable sera exécuté avec l'émulateur HATARI comme dans l'article sur la [cross-compilation 
en C](/m68k-cross-compiling/).
</div>
<!--excerpt-->


## Installation du cross-compiler ASSEMBLEUR pour 68000 

Pour compiler de l'assembleur Motorola 68000 (M68K), je vais utiliser `vasm`.
En effet, `vasm` est un compilateur multi-plateformes (dont mon linux), multi-cibles (dont le M68K).

Je vais ainsi récupérer les code source (en C) de `vasm` et `vlink` et les compiler pour mon Linux 64 bits.

Je récupère les sources de `vasm` que je compile et que je copie dans `/usr/local/bin` :

```bash
$ curl http://sun.hasenbraten.de/vasm/release/vasm.tar.gz | tar -xz
$ cd vasm
$ make CPU=m68k SYNTAX=mot
$ sudo cp vasmm68k_mot /usr/local/bin
$ sudo cp vobjdump /usr/local/bin
```

Je fais presque la même manipulation pour `vlink` :

```bash
$ curl http://sun.hasenbraten.de/vlink/release/vlink.tar.gz | tar -xz
$ cd vlink
$ make
$ sudo cp vlink /usr/local/bin
```

Les outils sont prêts.

## Compilation d'un programme TOS

Je me crée un petit programme en assembleur, qui respecte la syntaxe Motorala mais aussi Devpack.

> Pour comprendre ce petit programme je vous invite à regarder [cette vidéo](https://www.youtube.com/watch?v=w9G-DidbTeU) de Vincent Rivière.

`hello.s`
```
; -------------------------------------------------------
; Hello, Bitmap Brothers! en assembleur pour Atari ST 
; (inspiré du HelloWorld de Vretrocomputing, 2019.)
; Date : 02/2021
; -------------------------------------------------------

; -- DEBUT ----------------------------------------------
; affichage du message
	MOVE.L	#MESSAGE,-(sp)	; 4 octets sur la pile
	MOVE.W	#9,-(sp)		; 2 octets sur la pile
	TRAP	#1
	ADDQ.L	#6,sp			; ajustement de la pile

; attente d'une touche
	MOVE.W	#8,-(sp)		; 2 octets sur la pile
	TRAP	#1
	ADDQ.L	#2,sp			; ajustement de la pile

; fin du processus, retour au GEM
	CLR.W   -(sp)			; 1 octet sur la pile
	TRAP    #1				; pas de besoin d'ajuster
; -- FIN ------------------------------------------------

; -- EQUATES --------------------------------------------
CR	EQU	$0D	; ASCII Carriage Return
LF	EQU	$0A	; ASCII Line Feed
ES	EQU	$00	; Fin de chaine 
EA	EQU	$82 ; E accent aigue selon la table ASCII
; -- EQUATES --------------------------------------------

; -- DATA -----------------------------------------------
MESSAGE:
	DC.B	  "Hello Bitmap Brothers!",CR,LF
	DC.B	  "----------------------",CR,LF
	DC.B      "- Compil",EA," avec vasm sur Linux",CR,LF
	DC.B      "- Link",EA," avec vlink sur Linux",CR,LF
	DC.B	  "----------------------",CR,LF
	DC.B	  "<APPUYER SUR UNE TOUCHE>",CR,LF,ES
; -- DATA -----------------------------------------------
```

> Notez l'usage du code ASCII $82 (Hexadécimal) qui correspond au caractère `é` dans la table
> de l'Atari ST. Cette "astuce" est obligatoire car le code source sous Linux est en `UTF-8`.
> L'Atari ST serait incapable, avec les routines par défaut, d'afficher ce caractère codé sur 2 octets,
> s'il était laissé tel quel dans le code source.

Je compile cette nouvelle oeuvre avec `vasm` :

```bash
$ vasmm68k_mot hello.s -Felf -o hello.elf
vasm 1.8j (c) in 2002-2020 Volker Barthelmann
vasm M68k/CPU32/ColdFire cpu backend 2.3n (c) 2002-2020 Frank Wille
vasm motorola syntax module 3.14c (c) 2002-2020 Frank Wille
vasm ELF output module 2.7 (c) 2002-2016,2020 Frank Wille

CODE(acrx2):	          186 bytes
```

Puis j'utilise le *linker* pour produire le fichier exécutable :

```bash
$ vlink hello.elf -bataritos -o HELLO.TOS
```

Le répertoire contient maintenant le programme exécutable `HELLO.TOS` qui ne peut être
exécuté que par un véritable Atari ST ou un émulateur comme HATARI.

```bash
$ hatari -t /usr/local/share/tos/etos256fr.img HELLO.TOS
```
> J'ai placé la ROM de Emutos au préalable dans `/usr/local/share/tos`.

![TOS Result](/images/m68k-atari-st-assembly-linux/tos-result.png){: .fakescreen}

## Conclusion

Les outils `vasm` et `vlink` sont très puissants et produisent un exécutable "mini-rikiki", ici 303 octets ! (oui, octets !)

C'est bien ce que l'on cherche à faire en assembleur en plus d'aller chercher un maximum de performance et de pouvoir
accéder à la machine, et ses fonctionnalités, à son plus bas niveau.

## Liens

- VASM : <http://sun.hasenbraten.de/vasm>
- VLINK : <http://sun.hasenbraten.de/vlink>
- Usage de VASM et VLINK : <https://www.chibiakumas.com/z80/vasm.php>
- Dr. Volker Barthelmann´s Compiler Page : <http://www.compilers.de/>
- Hatari : <https://hatari.tuxfamily.org/>
- EmuTOS : <https://emutos.sourceforge.io/>
- Programmation M68K : <https://www.chibiakumas.com/68000/>
- Chaine Youtube Vretrocomputing : <https://www.youtube.com/c/Vretrocomputing>
- Page Facebook Vretrocomputing : <https://www.facebook.com/Vretrocomputing/>
