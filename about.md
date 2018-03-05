---
layout: page
title: A propos de l'auteur
permalink: /about/
---

Je suis passionné de développement depuis mon plus jeune âge et voici un bref résumé de mon petit parcours de développeur / administrateur / architecte  ...

## Découverte pendant mon enfance

En 1984, à 9 ans (les plus forts d'entre vous auront ainsi découvert mon année de naissance au moyen de l'outil mathématique nommé "soustraction") j'ai découvert le développement grâce au THOMSON TO7-70 au fond de la classe de mon école primaire.

A 10 ans, mes parents m'offrent un THOMSON M05 : 32 Ko de mémoire, sauvegarde cassette, crayon optique. Quand on est seul avec quelques livres (basic, assembleur) c'est donc l'école de la découverte permanente, des tests, des plantages, des resets et de l'optimisation du code. Et oui 32 Ko et 1 MHz de fréquence, cela nécessite quelques astuces. A ce jour (30 ans plus tard), j'ai toujours ce goût de l'optimisation et de l'octet bien utilisé.

A 12 ans, je monte en gamme, toujours chez THOMSON avec un TO8 : toujours 1 MHz de fréquence d'horloge, mais 256 Ko de RAM et surtout un lecteur de disquettes double faces. 360 Ko par face ! C'est la profusion d'octets ! Pendant toute cette période mes langages sont donc le BASIC 1.0 puis le BASIC 512 (les deux codés par Microsoft) ainsi que l'assembleur 6809 ! Les fameuses "Routines" ... 

Un petit exemple pour la route (dont je ne suis pas l'auteur) :

```
USERAF      EQU     $2070
PUTCH       EQU     2
CHDRAW      EQU     $2036

            ORG   &32000
            LDX    #DEFGR0
            STX    USERAF
            LDV    #TABLE
DEBUT       LDB     ,U+
            CMPB   #4
            BEQ     SUITE
            CALL   PUTCH
            BRA     DEBUT
SUITE       CLRA
            LDX     #$14
            LDY     #$0C
SUITE2      LDB     #$80
            STB      CHDRAW
            CALL    CHPLH
            JSR      COMPT
            LDB      #$81
            STB      CHDRAW
            CALL    CHPLH
            JSR       COMPT
            INCA
            CMPA    #$32
            BNE      SUITE2
            BRA      FIN
COMPT       PSHS     A
            CLRA    
            CLRB
A1          ADDD    #1 
            CMPD    #$80FF
            BNE       A1
            PULS     A
            RTS
FIN         LDB       #$70
            CALL PUTCH
            STOP
TABLE       FCB   $0C, $1B, $73, $14, $4
DEFGR0      FCB    36, 36, 36, 60, 255, 24, 60, 60
DEFGR1      FCB    129, 66, 36, 60, 60, 90, 189, 60
            END           

```

Sur ces ordinateurs, je voue toujours un culte au jeu [L'Aigle d'Or](https://fr.wikipedia.org/wiki/L%27Aigle_d%27or) de Louis-Marie Rocques.

![Generique Aigle d'or](/images/generique-aigle-d-or.png)
![Aigle d'or](/images/aigle-d-or.jpg)

A la même période, je m'éclate aussi chez mon cousin et chez des copains avec des ORIC ATMOS, AMSTRAD CPC 464 et 6128 ainsi qu'un MSX : que du beau monde.

Je m'occupe aussi du club informatique de mon collège : le professeur d'EMT me laissant le soin de la gestion du serveur "GOUPIL" qui connectait les MO5 en réseau (nanoréseau). M. Guintrand, si vous me lisez, merci encore !

![Serveur Goupil](/images/goupil.png)

C'est l'époque où on "déplombait" les logiciels protégés avec un `POKE 8699,57`. On ne savait pas trop ce que ça faisait, mais ça le faisait ... (ndlr:  désactiver la protection anti-copie, c'est mal ...)


## Un peu d'acné, mais beaucoup plus de RAM 

A 14 ans, je bascule dans le monde du 68000, avec un ATARI 1040 STE ! 1 Mo de RAM, 8 Mhz. Ce n'est plus de la profusion, c'est de la décadence. Je tripote aussi l'Amiga d'un copain (Frédéric, si tu me lis, merci !) et on commence enfin à coder en C (et oui déjà), en Omikron, en GFA Basic, en STOS.

30 ans plus tard, je voue toujours un culte immense à cette machine et notamment aux jeux XENON et XENON 2 des [Bitmap Brothers](https://fr.wikipedia.org/wiki/Bitmap_Brothers) !

![Xenon 1](/images/xenon-1.jpg)
![Xenon 2](/images/xenon-2.jpg)

En 2017, j'ai d'ailleurs réalisé un petit hommage à ces deux jeux : [Xenon Reborn](https://www.youtube.com/watch?v=ki39sbk4VKc) en Java avec LibGDX.

Cliquez sur l'image ci-dessous pour lancer une vidéo sur YouTube.

[![Xenon_Reborn_Capture v0.1.8](https://img.youtube.com/vi/ki39sbk4VKc/0.jpg)](https://youtu.be/ki39sbk4VKc)

Le projet hébergé sur GitHub est ici : [https://github.com/fxrobin/Xenon_Reborn](https://github.com/fxrobin/Xenon_Reborn)

## Petit résumé en image avant de passer à l'âge adulte

![MO5](/images/mo5.png)
![TO8](/images/to8.png)

![ATARI-ST](/images/atari-st.png)
![AMIGA](/images/amiga.png)

## Le permis, une voiture, mais surtout un 486 DX2 66 Mhz Turbo

A 18 ans, patatra ..., je bascule avec un 486 DX2 66 (avec un bouton "turbo") et me voilà dans le monde du x86, du QBASIC et de l'assembleur toujours. 

Je fais une grande partie de mes études en découvrant de nombreux langages, mais en restant fidèle à mon C et mon assembleur. Le tout avec des mégas "en veux-tu, en voilà", 250 Mo de disque dur. Comme "développer" est maintenant devenu aussi "mes études",
ma maman **chérie-adorée-que-j'aime-très-fort** ne peut plus me dire "*lâche cet ordinateur et fais tes devoirs !*".

A cette occasion, je découvre aussi ce qu'est le cache de second niveau sur un processeur (AMD en l'occurence). Pourquoi ? Parce que je l'active dans le BIOS, le PC fonctionne vraiment mieux ... jusqu'à ce qu'il plante. Et oui mon cache L2 était défectueux ... 


Je decouvre le Mode X (mode 13h pour les intimes), les interruptions BIOS, le cartes graphiques faisant planter le redimensionnement de colonnes sous Excel et WIN 3.11. C'est l'heure de la programmation avec Watcom C++ et son fameux mode protégé `dos4gw` avec lequel tous les jeux du moment tournaient pour avoir accès à toute la RAM ... 16 Mo !

![Watcom C++](/images/watcom.png)

Je fais alors du Pascal, du COBOL, du C++, de l'ADA et ... fin 1998 du **JAVA** ! C'est la révélation. Et pourtant à l'époque "*Java c'est moche*", "*Java c'est lent*". 

## Mon histoire (d'amour ?) avec Java ...

![I LOVE JAVA](/images/i-love-java.png)

Et voilà toutes les questions qui me sont venues en 1998 :

* Quoi ? Je peux enfin avoir du code portable et ne pas avoir à le recompiler ?
* Quoi ? Le JDK est gratuit ?
* Quoi ? Je peux faire des interfaces graphiques portables (bon c'était AWT ... argh) ?
* Quoi ? Je peux embarquer tout ça dans Netscape (les jeunes ne comprendront pas) ?
* Quoi ? Quand je mets à jour mon application sur le serveur c'est téléchargé automatiquement ?
* Quoi ? C'est multithread ?

Puis en 1999 :
* Quoi ? Je peux générer des pages web côté serveur à la place de mes scripts CGI (les jeunes ne comprendront pas) avec des Servlets ?
* Quoi ? Tomcat c'est gratuit ?
* Quoi ? JBuilder c'est PAS gratuit ... 
* Quoi ? Je peux me connecter à n'importe quelle base de données (ah bah oui parce que je sais aussi faire du SQL hein ...) ?

To be continued (quand je ferai l'effort de tout me souvenir)


### Contactez moi ...

Le mieux c'est grâce à [LinkedIn](https://www.linkedin.com/in/fxrobin).
