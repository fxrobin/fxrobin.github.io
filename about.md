---
layout: page
title: A propos de l'auteur
subtitle: parce qu'il y a quand-même un humain qui rédige ...
logo: xenon-reborn.png
permalink: /about/
lang: fr
---

<div class="intro" markdown='1'>

Je m'appelle François-Xavier Robin et suis passionné de développement depuis mon plus jeune âge.

Voici un bref résumé chronologique de mon petit parcours de développeur / administrateur / architecte  ...

</div>

<!--excerpt-->

## 1983-1984 : La TV devient interactive

Jusqu'à l'arrivée de mon Atari 2600, la TV était l'objet sur lequel je regardais plus ou moins passivement les émissions et dessins-animés de l'époque : Goldorak, La Bataille de Planètes, Récrée A2, L'Ile aux enfants, etc.

![ATARI-2600](/images/atari-2600.png)

Dessus, j'ai pu avoir les jeux suivants :

Pole Position

{%include video.html youtube-id="W2jLrNYzyr8?rel=0&amp;showinfo=0"  size="mini" %}

Snoopy and the Red Baron

{%include video.html youtube-id="0XfGUXoTxSo?rel=0&amp;showinfo=0"  size="mini" %}

E.T. (le fameux)

{%include video.html youtube-id="ZPnmewxetNA?rel=0&amp;showinfo=0"  size="mini" %}

Defender

{%include video.html youtube-id="FIH3qE7jUUs?rel=0&amp;showinfo=0"  size="mini" %}

Real Sport Tennis

{%include video.html youtube-id="wMocFmcL1a0?rel=0&amp;showinfo=0"  size="mini" %}

A ce jour, je possède toujours cette seule et unique console et ses jeux, car par la suite je n'ai eu que des micro-ordinateurs.

## 1984-1989 : Découverte de la micro-informatique

En 1984, à 9 ans (les plus forts d'entre vous auront ainsi découvert mon année de naissance au moyen de l'outil mathématique nommé "soustraction") j'ai découvert le développement grâce au THOMSON TO7-70 au fond de la classe de mon école primaire. C'est le déclic grâce au LOGO, au BASIC 1.0, le crayon optique, les cartouches ! Je demande même à l'institutrice de passer quelques récréations sur le TO7 plutôt que d'aller jouer aux billes dans la cours d'école.

A 10 ans, mes parents m'offrent un THOMSON MO5 : 32 Ko de mémoire (48 Ko de RAM, 16 Ko de ROM), sauvegarde cassette, crayon optique. Quand on est seul avec quelques livres (basic, assembleur) c'est l'école de la découverte permanente, des tests, des plantages, des resets et de l'optimisation du code. Et oui 48 Ko et 1 MHz de fréquence, cela nécessite quelques astuces.

A ce jour (30 ans plus tard), j'ai toujours ce goût de l'optimisation et de l'octet bien utilisé.

![MO5](/images/mo5.png)

Parmis les divers petits programmes réalisés :

* une sorte de chatbot ... précurseur mais limité, vous vous en doutez bien !
* une gestion d'adhérents pour le club de tennis de mon père (avec sauvegarde cassette)
* un jeu genre "X-Wing" où des chasseurs TIE passent dans le viseur (si on pilote bien) et que l'on peut détruire bien sûr.

Malheureusement, je n'ai plus aucun code source de cette époque.

Vous pouvez aussi aller jeter un oeil sur [comment assembler un programme pour MO5 à partir de Linux](/6809-thomson-mo5-assembly-linux).

A 12 ans, je monte en gamme, toujours chez THOMSON avec un TO8 : toujours 1 MHz de fréquence d'horloge, mais 256 Ko de RAM, 80Ko de ROM et surtout un lecteur de disquettes double faces. 360 Ko par face ! C'est la profusion d'octets ! Pendant toute cette période mes langages sont donc le BASIC 1.0 puis le BASIC 512 (les deux codés par Microsoft) ainsi que l'assembleur 6809 ! Les fameuses "Routines" ...

![TO8](/images/to8.png)

Un petit exemple pour la route (dont je ne suis pas l'auteur) :

```
USERAF      EQU    $2070
PUTCH       EQU    2
CHDRAW      EQU    $2036

            ORG    &32000
            LDX    #DEFGR0
            STX    USERAF
            LDV    #TABLE
DEBUT       LDB    ,U+
            CMPB   #4
            BEQ    SUITE
            CALL   PUTCH
            BRA    DEBUT
SUITE       CLRA
            LDX    #$14
            LDY    #$0C
SUITE2      LDB    #$80
            STB    CHDRAW
            CALL   CHPLH
            JSR    COMPT
etc ...
```

Sur TO8 j'ai surtout perfectionné le logiciel de gestion des adhésions du club de tennis, avec sauvegarde à accès direct sur disquette (pas séquentiel). Ce programme générait aussi les étiquettes à imprimer et coller sur les enveloppes pour les mailings. Je me souviens du casse tête pour que l'impression soit bien alignée ... Là encore, je n'ai plus les codes sources ... (triste je suis).

Sur ces ordinateurs, je voue toujours un culte au jeu [L'Aigle d'Or](https://fr.wikipedia.org/wiki/L%27Aigle_d%27or) de Louis-Marie Rocques.

![Generique Aigle d'or](/images/generique-aigle-d-or.png) ![Aigle d'or](/images/aigle-d-or.jpg)

<iframe class="video normal" src="https://www.youtube.com/embed/vwpK4_K0ygQ?rel=0&amp;showinfo=0" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>

Si vous n'avez pas la chance, comme moi, de posséder encore ces fabuleuses machines en état de fonctionnement, vous pouvez aller sur le formidable site de Daniel Coulom dédié à l'émulation des Thomson : [http://dcmoto.free.fr](http://dcmoto.free.fr/)

A la même période, je m'éclate aussi chez mon cousin et chez des copains avec des ORIC ATMOS, AMSTRAD CPC 464 et 6128 ainsi qu'un MSX : que du beau monde.

Je m'occupe aussi du club informatique de mon collège : le professeur d'EMT me laissant le soin de la gestion du serveur "GOUPIL" qui connectait les MO5 en réseau (nanoréseau). M. Guintrand, si vous me lisez, merci encore !

![Serveur Goupil](/images/goupil.png)

C'est l'époque où on "déplombait" les logiciels protégés avec un `POKE 8699,57`. On ne savait pas trop ce que ça faisait, mais ça le faisait ... (ndlr:  désactiver la protection anti-copie, c'est mal ...)

## 1989-1993 : Un peu d'acné, mais beaucoup plus de RAM

A 14 ans, je bascule dans le monde du 68000, avec un ATARI 1040 STE ! 1 Mo de RAM, 8 Mhz. Ce n'est plus de la profusion, c'est de la décadence. Je tripote aussi l'Amiga d'un copain (Frédéric, si tu me lis, merci !) et on commence enfin à coder en C (et oui déjà), en Omikron, en GFA Basic, en STOS.

![ATARI-ST](/images/atari-st.png) 
![AMIGA](/images/amiga.png)

30 ans plus tard, je voue toujours un culte immense à cette machine et notamment aux jeux XENON et XENON 2 des [Bitmap Brothers](https://fr.wikipedia.org/wiki/Bitmap_Brothers).

![Xenon 1](/images/xenon-1.jpg)
![Xenon 2](/images/xenon-2.jpg)

En 2017, j'ai d'ailleurs réalisé un petit hommage à ces deux jeux : [Xenon Reborn](https://www.youtube.com/watch?v=ki39sbk4VKc) en Java avec LibGDX.

<iframe class="video" src="https://www.youtube.com/embed/ki39sbk4VKc" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>

Le projet hébergé sur GitHub est ici : [https://github.com/fxrobin/Xenon_Reborn](https://github.com/fxrobin/Xenon_Reborn)

Un article y est consacré : [Développer en s'amusant et réciproquement : Xenon-Reborn](/Xenon-Reborn)

## 1993-1996 : Le permis, une voiture, mais surtout un 486 DX2 66 Mhz Turbo

A 18 ans, patatra ..., je bascule avec un 486 DX2 66 (avec un bouton "turbo") et me voilà dans le monde du x86, du QBASIC et de l'assembleur toujours.

Je fais une grande partie de mes études en découvrant de nombreux langages, mais en restant fidèle à mon C et mon assembleur. Le tout avec des mégas "en veux-tu, en voilà", 250 Mo de disque dur. Comme "développer" est maintenant devenu aussi "mes études",
ma maman **chérie-adorée-que-j'aime-très-fort** ne peut plus me dire "*lâche cet ordinateur et fais tes devoirs !*".

A cette occasion, je découvre aussi ce qu'est le cache de second niveau sur un processeur (CYRIX en l'occurence). Pourquoi ? Parce que quand je l'active dans le BIOS, le PC fonctionne vraiment mieux ... jusqu'à ce qu'il plante. Et oui mon cache L2 était défectueux ...

Je decouvre le Mode X (mode 13h pour les intimes), les interruptions BIOS, le cartes graphiques faisant planter le redimensionnement de colonnes sous Excel et WIN 3.11. C'est l'heure de la programmation avec Watcom C++ et son fameux mode protégé `dos4gw` avec lequel tous les jeux du moment tournaient pour avoir accès à toute la RAM ... 16 Mo !

![Watcom C++](/images/watcom.png)

Je développe un jeu nommé "Red Devil 97", clone de "Blue Angel 69" sur Atari ST et Amiga. 

<iframe class="video normal" src="https://www.youtube.com/embed/zVy3VXSf2yY?rel=0&amp;showinfo=0;start=71" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>

Voici ma version "encore BETA", je ne l'ai jamais fini, mais c'était jouable à deux ou contre l'ordi.

![Red Devil 97](/images/rdevil_001.png)

J'ai toujours le code source (C++ et Assembleur), mais comme c'est "crade", je ne veux pas le montrer. A cette occasion je développe l'IA (c'est un bien grand mot) pour le joueur adverse.

J'y développe une interface graphique complète avec animations (60 FPS de mémoire), des animations de sprites, des effets de transparences (plateaux de droite, chiffres sur les cases) et un gestionnaire d'événéments. Les routines graphiques sont en partie en assembleur.

J'y inclus MIKMOD pour y lire des `.mod` et `.xm` (tracker Atari et Amiga).

> Peut-être qu'un jour, je referai un clone du clone en Java.

En C++ je réalise un moteur de résolution "faits / conséquences" appelé "Système Expert" avec un camarade étudiant (David Rideau, si tu me lis ...). C'est du pattern "Oberver / Observable" mais sans le savoir, on l'invente. De manière réactive, les changements sont propagés : sur du Reactive Programming avant l'heure ...

Je participe à un concours international d'algorithmes pour trouver des solutions à de nombreuses contraintes. On choisit alors les algorithmes génétiques dont j'élabore le moteur avec mon chargé de TD à la fac de Versailles-Saint-Quentin, Franck Quessette. J'adore, c'est magique et ça marche déjà bien pour l'époque (1996).

Je fais alors du Pascal, du COBOL, du C++, de l'ADA et ... fin 1996 du **JAVA** ! C'est la révélation. Et pourtant à l'époque "*Java c'est moche*", "*Java c'est lent*".

## 1996 : Mon histoire (d'amour ?) avec Java

![I LOVE JAVA](/images/i-love-java.png)
{: style="text-align : center"}

Et voilà toutes les questions qui me sont venues en 1996 :

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

## Mes principales réalisations en Java entre 1996 et 2002

* Un interpréteur / compilateur de requêtes SQL
* Un moteur de stockage SGBDR distribué
* Un framework de templating web fondé sur des servlets
* Un framework de templating et de développement d'appplications fondés sur des servlets (ressemblait à JSF) en XML
* Un extracteur et intégrateur de données avec un format XML pivot
* Un plugin pour Apache VFS pour stocker en base de données MySQL
* Une application pour commander l'apéro (choisir ses boissons) pour mes collègues (et moi-même) avant de se rendre au bar ...
* Une GED avec indexation (Lucene) et gestion des versions

## To be continued

Quand je ferai l'effort de tout me souvenir ...

![Guru Meditation](/images/guru-meditation.gif) 
{: style="text-align : center"}

![Atari ST Bombs](/images/bombs.png)
{: style="text-align : center"}

## Contactez moi

Le mieux c'est grâce à [LinkedIn](https://www.linkedin.com/in/fxrobin).