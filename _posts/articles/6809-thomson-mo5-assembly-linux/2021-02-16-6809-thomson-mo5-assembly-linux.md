---
layout: post
title: Assembleur 6809 pour Thomson MO5 sous Linux
subtitle: cross-compilation Assembleur MO5 avec C6809
logo: mo5-pixel-art.png
category: articles
tags: [Retro, Assembleur, Thomson, MO5]
lang: fr
ref: 6809-thomson-mo5-assembly-linux
---

<div class="intro" markdown='1'>

Dans la série "comment compiler à partir de Linux pour une autre machine", l'objectif
de ce mini-tutorial est d'obternir un `.BIN` pour Thomson MO5 avec l'assembleur `C6809`.

Le fichier exécutable sera testé avec l'émulateur DCMOTO de Daniel Coulom avant d'être
transféré sur un véritable MO5.
</div>
<!--excerpt-->

## Le MO5 et le 6809

Je vais décrire ici brièvement le Thomson MO5 et son fameux processeur 6809.

![Thomson MO5](/images/mo5.png)

Les caractéristiques de la bête :

- Processeur Motorola 6809 à 1 MHz
- 48 Ko de mémoire : 16 Ko de ROM, 32 Ko de RAM
- 320 x 200 en 16 couleurs, avec contrainte (2 couleurs tous les 8 pixels, par ligne)

Bref, un truc de dingue !

Au niveau du processeur :

- registres "accumulators" (données) : `A` et `B`, 8 bits chacun. `D` étant la combinaison 16 bits de A et B
- registres "pointers" (adresses) : `X` et `Y` sur 16 bits
- registres de pile : `U` (User stack) et `S` (System stack) sur 16 bits chacun
- registre PC (Program Counter) sur 16 bits
- DP (Direct Page) et CC (Condition Code) sur 8 bits chacun.

Et c'est tout ...

## Installation de l'assembleur 6809

Pour compiler de l'assembleur Motorola 6809 , je vais utiliser `c6809` réalisé par l'équipe "[PULSDEMOS](http://www.pulsdemos.com/c6809.html)".

> Je vous invite d'ailleurs à regarder les réalistions sur Thomson TO8 de ce groupe, c'est absolument génial !

Le binaire pour Linux se situe dans le sous répertoire `linux` : `c6809` que je copie dans `/usr/share/bin` :

Je teste l'installation en lançant la commande `c6809` :


```bash
$ c6809
Compilateur Macro/Assembler-like
  Francois MOURET (c) C6809 v 0.83 - mars 2010

C6809 [options] fichier_source fichier_destination

  options :
  -h  aide de ce programme
  -o  option(s) d'assemblage (NO, OP, SS, WE, WL et WS)
      les parametres d'option (tous desactives par defaut) doivent
      etre separes par des '/'
  -b  type de la sortie (binaire non lineaire par defaut)
      l  binaire lineaire
      h  binaire hybride
      d  donnee
  -d  passage d'argument (<symbole>=<valeur>)
  -c  cree les fichiers ASM au format Thomson
  -q  notifie le depassement de 40 caracteres par ligne (300 par defaut)
  -e  groupe les messages d'erreur du listing (ordre de ligne par defaut)
  -s  ordre d'affichage des symboles du listing (alphabetique par defaut)
      e  par erreur de symbole
      t  par type de symbole
      n  par frequence d'utilisation
  -a  Notifie la compatibilite (assembleur virtuel par defaut)
      a  ASSEMBLER1.0 et ASSEMBLER 2.0
      m  MACROASSEMBLER 3.6
  -m  + TO/TO7/MO machine de travail (TO par defaut)

```

Tout est fonctionnel.

## Compilation d'un programme MO5

Je me crée un petit programme en assembleur pour MO5 (attention, ce n'est pas compatible avec TO7  et +)


`hello.ass`
```
(main)MAIN.ASM   * Marquage du programme principal

DEBUT
    ORG $6000
    LDX #MESSAGE
AFFICHE		
    LDB ,X+
    BEQ FIN
    SWI 
    FCB $02
    BRA AFFICHE

FIN
    RTS

MESSAGE
    FCS "HELLO LES THOMSONISTES !",0
    END
```

> Le programme sera implanté à l'adresse $6000.

Je compile cette nouvelle oeuvre avec `c6809` :

```bash
$ c6809 -mMO hello.ass HELLO.BIN
Macro Pass
Pass1
Pass2

000000 Total Errors

000004 Total Symbols
```

Je peux afficher le code compilé :

```bash
cat codes.lst 
```

```plaintext
/*--------------------------------------------------------------*
 * Compilé avec C6809 v0.83                                     *
 *--------------------------------------------------------------*
 * Fichier source      : hello.ass
 * Fichier destination : HELLO.BIN
 * Contenu :
 *     Main     0:MAIN.ASM     174
 *--------------------------------------------------------------*/

Macro Pass
Pass1
Pass2
      2
      3        0000               DEBUT
      4        6000                      ORG $6000
      5  3     6000 8E   600C            LDX #MESSAGE
      6        6003               AFFICHE
      7  4+2   6003 E6   80              LDB ,X+
      8  3     6005 27   04              BEQ FIN
      9  19    6007 3F                   SWI
     10        6008 02                   FCB $02
     11  3     6009 20   F8              BRA AFFICHE
     12
     13        600B               FIN
     14  5     600B 39                   RTS
     15
     16        600C               MESSAGE
     17        600C 48 45 4C 4C          FCS "HELLO LES THOMSONISTES !",0
               6010 4F 20 4C 45
               6014 53 20 54 48
               6018 4F 4D 53 4F
               601C 4E 49 53 54
               6020 45 53 20 21
               6024 00
     18                  0000            END

000000 Total Errors

000004 Total Symbols
     1x          Label 6003 AFFICHE
     0x          Label 0000 DEBUT
     1x          Label 600B FIN
     1x          Label 600C MESSAGE
```


Le fichier produit est un `.BIN`  qui ne fait que 47 octets :

```bash
$ hexdump -C HELLO.BIN 
00000000  00 00 25 60 00 8e 60 0c  e6 80 27 04 3f 02 20 f8  |..%`..`...'.?. .|
00000010  39 48 45 4c 4c 4f 20 4c  45 53 20 54 48 4f 4d 53  |9HELLO LES THOMS|
00000020  4f 4e 49 53 54 45 53 20  21 00 ff 00 00 00 00     |ONISTES !......|
0000002f
```

Je génère une disquette `.fd` avec support DOS et importation du fichier avec l'outil `DCFDUTIL`

![DCFDUTIL](/images/6809-thomson-mo5-assembly-linux/dcfdutil.png){: .fakescreen}

Ensuite je peux lancer l'émulateur avec cette disquette, charger le programme et le lancer.

Le mieux pour cela c'est de préparer un petit programme en BASIC qui va être ajouté aussi à la disquette :

`RUNME.BAS`

```plaintext
10 LOADM "HELLO.BIN"
20 EXEC &H6000
```

Je lance DCMOTO, avec Wine sous Linux, en mode MO5 avec la disquette `demo.fd` 

![DCMOTO](/images/6809-thomson-mo5-assembly-linux/dcmoto.png){: .fakescreen}

Tada !

## Conclusion

Le plus difficile, dans tout cela, c'est de créer l'image de la disquette et de lancer l'émulateur ! Etant sous Linux j'aurais aimé
pouvoir scripter cela.

Je vous invite à (re)découvrir cette machine simple mais efficace, qui m'a permis de découvrir l'informatique et la programmation
quand j'avais 10 ans ! A l'époque j'avais la cartouche "Assembleur" et un gros (très gros) bouquin !

## Liens

- DCMOTO de Daniel Coulon : <http://dcmoto.free.fr/>
- PULSDEMOS : <http://www.pulsdemos.com/>
- L'assembleur 6809 MO/TO pour Linux et Windows : <http://www.pulsdemos.com/c6809.html>
- logicielsmoto.com : <http://www.logicielsmoto.com/home.php>
- Forum CFG "8 bits" : <https://forum.system-cfg.com/viewforum.php?f=1>
