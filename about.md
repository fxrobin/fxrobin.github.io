---
layout: page
title: A propos de l'auteur
permalink: /about/
---

Je suis passionné de développement depuis mon plus jeune âge et voici un bref résumé de mon petit parcours d'informaticien ...

## Découverte pendant mon enfance

En 1984, à 9 ans (les plus forts d'entre vous auront ainsi découvert mon année de naissance au moyen de l'outil mathématique nommé "soustraction") j'ai découvert le développement grâce au THOMSON TO7-70 au fond de la classe de mon école primaire.

A 10 ans, mes parents m'offrent un THOMSON M05 : 32 Ko de mémoire, sauvegarde cassette, crayon optique. Quand on est seul avec quelques livres (basic, assembleur) c'est donc l'école de la découverte permanente, des tests, des plantages, des resets et de l'optimisation du code. Et oui 32 Ko et 1 MHz de fréquence, cela nécessite quelques astuces. A ce jour (30 ans plus tard), j'ai toujours ce goût de l'optimisation et de l'octet bien utilisé.

A 12 ans, je monte en gamme, toujours chez THOMSON avec un TO8 : toujours 1 MHz de fréquence d'horloge, mais 256 Ko de RAM et surtout un lecture de disquettes double faces. 360 Ko par face ! C'est la profusion d'octets ! Pendant toute cette période mes langages sont donc le BASIC 1.0 puis le BASIC 512 (le deux codés par Microsoft) ainsi que l'assembleur 6809 ! Les fameuses "Routines" 

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

## Un peu d'acné, mais beaucoup plus de RAM 

A 14 ans, je bascule dans le monde du 68000, avec un ATARI 1040 STE ! 1 Mo de RAM, 8 Mhz. Ce n'est plus de la profusion, c'est de la décadence. Je tripote aussi l'Amiga d'un copain (Frédéric, si tu me lis, merci !) et on commence enfin à coder en C (et oui déjà), en Omikron, en GFA Basic, en STOS.

30 ans plus tard, je voue toujours un culte immense à cette machine !

## Le permis, une voiture, mais surtout un 486 DX2 66 Mhz Turbo

A 18 ans, patatra ..., je bascule avec un 486 DX2 66 (avec un bouton "turbo") et me voilà dans le monde du x86, du QBASIC et de l'assembleur toujours. Je fais une grande partie de mes études en découvrant de nombreux langages, mais en restant fidèle à mon C et mon assembleur. Je fais alors du Pascal, du COBOL, du C++, de l'ADA et ... fin 1998 du **JAVA** ! C'est la révélation. Et pourtant à l'époque "*Java c'est moche*", "*Java c'est lent*". 



### Contactez moi ...

Le mieux c'est grâce à [LinkedIn](https://www.linkedin.com/in/fxrobin).
