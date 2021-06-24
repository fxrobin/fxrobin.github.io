---
layout: post
title: 'Atari ST : Routines YM avec le Timer A en ASM et C'
subtitle: Comment retrouver ce son "que les moins de vingt ans ne peuvent pas connaître" ?
logo: atari-rainbow.png
category: articles
tags: [Retro, Assembleur, Atari, Retro-Prog]
lang: fr
ref: m68k-atari-st-ym-player
---

<div class="intro" markdown='1'>

Je vous avais mis l'eau à la bouche, dans mon précédent article relatif aux [interactions entre C et Assembleurs](/m68k-atari-st-assembly-and-c), en annonçant que cela servirait à jouer de la musique sur le processeur audio de l'Atari ST, le YAMAHA-2149 (YM-2149) : *nous y voilà* !

Dans ce tutoriel, nous verrons :

- quelques concepts fondamentaux sur la production de son depuis le YM-2149 ;
- comment interagir en Assembleur et en C avec le YM-2149 ;
- la structure des fichiers YM, principalement `YM2!` et `YM3!` ;
- quelques notions théoriques sur les Timers de l'Atari ST ;
- la diffusion du son, par interruption, au moyen d'une routine `Timer A` ;
- et enfin quelques détails comme par exemple la lecture d'une touche spécifique du clavier.

Ce tutoriel mixera C et Assembleur en fonction des tâches à réaliser :

- la lecture de fichier de musique ainsi que les affichages à l'écran se feront en **C** ;
- la routine de lecture du son sera effectuée en **Assembleur** et déclenchée par le Timer A.

Cerise sur le gâteau, je vous proposerai quand même une implémentation complète exclusivement en C.

Vous pouvez récupérer l'ensemble du code source sur mon [repository dédié sur github](https://github.com/fxrobin/atari-st-stuffs/tree/main/ym_player).

Accrochez-vous, c'est parti !

![Rocket Launch](https://media.giphy.com/media/h4NlRPJCQAXOto7E4g/giphy.gif){:.fakescreen}


</div>
<!--excerpt-->

## Pré-requis

Pour ce tutoriel, vous aurez besoin :

- du compilateur M68K `vasm`
- du cross-compiler C `m68k-atari-mint-gcc`

Je vous renvoie à mes articles concernant :
- les [interactions entre C et Assembleurs](/m68k-atari-st-assembly-and-c/2021-06-02-m68k-atari-st-assembly-and-c.md)
- la [configuration de `vasm`](/m68k-atari-st-assembly-linux)
- la [configuration de `m68k-atari-mint-gcc`](/m68k-cross-compiling/)

Les outils sont prêts.

## Préambule

Avant de rentrer dans le vif du sujet, je tenais à préciser qu'avant d'écrire ce tutoriel et les exemples qui l'accompagnent, je ne connaissais rien (mais rien de rien) de la programmation du YM-2149, ni des concepts avancés relatifs à la production de son.

J'avais toutefois quelques souvenirs de cours de sciences physiques :

- un son est une onde qui se propage dans un milieu (dans notre cas, dans l'air) ;
- plus la fréquence d'un son répétitif est **élevé**, plus le son est **aigu** ;
- plus la fréquence d'un son répétitif est **basse**, plus le son est **grave** ;
- un son peut être produit par des enceintes par la transformation d'un courant électrique analogique en mouvement de membrane.

Pour sythétiser, je ne connaissais *pas grand chose* et donc j'espère que ce tutoriel pourra accompagner ceux qui, comme moi, voudront découvrir ce monde au moyen de la programmation du `YM-2149` de l'Atari ST.

Les documentations techniques sont nombreuses à ce sujet, cependant elles ne sont pas du tout digestes quand il s'agit de comprendre les concepts aussi bien liés au son, à la production de son et à la programmation du `YM-2149`. Pour synthéser, ces documents techniques, je les ai trouvés utiles à partir du moment où j'avais pu comprendre les concepts, c'est à dire : "pas au début".

De plus, quand on parcourt les forums spécialisés, j'ai eu la douloureuse impression que tous les intervants maîtrisent le vocabulaire dédié et cela rend l'immersion d'autant plus difficile. En effet tous les codeurs présents semblent faire partie de la "scène démo-codeur" depuis des années, ce qui n'est pas non plus étonnant quand on repense au fait que l'Atari ST a plus de 35 ans d'existence.

Ainsi, sans prétention, j'espère pouvoir vous mettre le pied à l'étrier, sans vous noyer dans les termes techniques. L'objectif est de jouer un fichier de musique au format populaire et répa,du **YM** pour obtenir au final ceci, histoire de vous tenir en haleine :

{%include video.html youtube-id="D1rf20psS1o"  size="normal" %}

Il est toutefois nécessaire d'avoir quelques bases en C ainsi qu'en Assembleur M68K : je ne reviendrai pas sur ce qu'est un `DEFINE` et les pointeurs en C ou encore un `DBRA`  en Assembleur.

## Produire du son sur le YM-2149

La puce YM-2149 est un __PSG__. Vous pouvez ranger vous écharpes "bleues et rouges", il ne s'agit de pas foot ici mais de __Programable Sound Generator__. 

On trouve ce genre de puce dans divers bornes d'arcade, dans le Commodore 64,l'Amstrad CPC, le MSX, etc. et dans notre bel Atari ST. J'utiliserai les termes __YM-2149__ et __PSG__ de manière identique dans ce tutoriel. On peut aussi trouver le terme de __SSG__ (Software-Controlled Sound Generator), notamment dans la [documentation officielle](http://www.ym2149.com/ym2149.pdf).

Le YM-2149 est un clône du __AY-3-8910__ mais il dispose d'un contrôle de volume en sortie sur 32 niveaux au lieu de 16.

Le YM-2149, qui équipe l'Atari ST, est cadencé à 2 Mhz. Il est capable de produire :

- des __ondes sonores "carrés"__ (square waves), dont je décrirai les caractéristique de base un peu plus loin, ce générateur est parfois aussi appelé *buzzer*, 
- du __bruit__ (noise) : ondes pseudo-aléatoire, 
- des __enveloppes__, pour produire certaines atténuation sur l'amplitude (volume) du son. 

Il existe 3 canaux de sortie distincts qui peuvent prendre comme source soit l'un des 3 générateurs d'ondes carrés ou un générateur de bruit, avec des configurations spécifiques pour chacun des 3 canaux.

En ce qui concerne les contraintes (non exhaustif) :

- Il ne peut y avoir qu'une enveloppe à un instant donné, mais que l'on peut appliquer à n'importe quel canal voire à plusieurs canaux simultanés, quelle que soit leur source (square waves, ou noise) ;
- Il ne peut y avoir qu'un seul générateur de bruit, sur l'un des 3 canaux.

Le PSG dispose d'un __mixer__ qui permet de spécifier les canaux qui sont fusionnés sur la sortie __analogique mono__. A moins de faire un peu de bricolage électronique, la sortie de la puce sera en mono : la stéréo ce sera uniquement sur le STE avec d'autres composants (le fameux DMA).

Enfin le PSG dispose d'un convertisseur numérique/analogique sur 5 bits (32 niveaux) qui lui permet de transformer tout cela en un signal électrique analogique pour être envoyé vers des enceintes, c'est à dire, par défaut, la sortie son du câble vers l'écran.

Pour vulgariser au maximum, et les experts du domaine me pardonneront, les 3 générateurs *square waves* ainsi que le générateur d'enveloppe permettront de générer, grosso modo, les mélodies, les basses, alors que le générateur de buit permettra de simuler des éléments de batterie comme la grosse caisse ou le tambour ou encore des bruitages divers et variés.

Ce tutoriel n'a pas pour objectif de vous apprendre les bases de la musique ni de la composition musicale. Nous allons laisser ce domaine riche et complexe aux musiciens. Tout le monde n'a pas le talent de Jean-Michel Jarre, de [Mad Max](https://en.wikipedia.org/wiki/Jochen_Hippel), ni de [David Whittaker](https://en.wikipedia.org/wiki/David_Whittaker_(video_game_composer)) ou encore de David Guetta (quoique dans le cas de David G., ...).

Toutefois, voici à quoi ressemble une onde carrée (__square wave__) de 440 Hz (LA sur le 3^ème octave) visuellement et pour le plaisir des oreilles :
 
{%include video.html youtube-id="1W_uV-p-7_k"  size="normal" %}

Les enveloppes supportées par le YM-2149, permettent par exemple de faire des dents de scie :

{%include video.html youtube-id="IctmUIHdb00"  size="normal" %}

Ou encore des triangles :

{%include video.html youtube-id="NaoHFZXDN5g"  size="normal" %}

Et en combinant tout cela, et surtout avec beaucoup de talent, on arrive à faire ceci :

{%include video.html youtube-id="dTtF1ien42w"  size="normal" %}

Ou encore ceci :

{%include video.html youtube-id="IyS9mk3Q3So"  size="normal" %}

Dans ce dernier exemple, notez l'usage du principe de __digidrum__, non couvert par ce tutorial, qui permet, quand on utilise des fréquences élevées de rafraîchissement du PSG (au delà de 50 Hz), de jouer des samples digitaux (*digits*) et ainsi reproduire plus fidèlement certains sons, comme la batterie généralement, d'où le nom de **digidrum**.

## Interagir avec le YM-2149

La puce possède 16 registres, dénommés de la sorte : __R0, R1, R2, R3, etc..., R15__

Ces 16 registres sont accessibles au moyen d'association d'addresse, donc comme de la mémoire classique.

Seuls les __14 premiers registres__ nous intéressent dans le cadre de la production de son.

Toutefois, et c'est bien là la particularité, __les registres du PSG ne sont pas accessibles simultanément__, mais seulement
au moyen de 2 adresses mémoires :

- `$FF8800` : sélecteur de registre et lecture de valeur courante.
- `$FF8802` : écriture de valeur dans le registre précédemment sélectionné.

Pour affecter une valeur dans l'un des 14 registres du YM-2149, il faut écrire le numéro du registre
souhaité à l'adresse `$FF8800` puis la valeur que l'on souhaite lui affecter à l'adresse `$FF8802`.

Comme ce tutorial n'a pas vocation à vous apprendre à composer de la musique, je ne rentre pas dans le détail
des valeurs que peut prendre chacun des registres, ni à quoi ils servent. La documentation officielle du YM-2149
donne tous ces éléments, mais cela n'est pas nécessaire pour la poursuite de ce tutoriel.

Cependant, afin de vous donner une légère "base" sur le fonctionnement, voici un petit programme en C
qui joue `DO RE MI FA SOL LA SI DO` sur l'octave 3, suivi de son code source.

{%include video.html youtube-id="R2f5o6e7YPQ"  size="normal" %}

Le principe est donc d'envoyer les différentes fréquences qui correpondent à chacune des notes pendant 1 seconde, puis de passer à la note suivante.

Avant d'être envoyée au PSG, la fréquence de la note souhaitée doit subir une légère conversion pour devenir le paramètre attendu par le générateur de *square wave*.
Cette conversion est décrite dans la documentation du YM-2149 et je l'ai reportée dans le code source ci-dessous.

Comme ce paramètre est codé sur 12 bits il sera envoyé sur les R0 et R1 qui sont chargé de prendre en compte le réglage de la fréquence sur le canal A.
- dans R0 je place les 8 bits de poids faible du paramètre ;
- dans R1, je place les 4 bits restants, de poids fort. 

Ce qui fait bien 12 bits utiles au final.

> Pour info, R2 et R3, propose le même mécanisme mais pour le canal B, tandis que R4 et R5 s'occupe du canal C.

Ensuite il faut activer le "mixer" sur le canal A et mettre le volume du canal A au maximum. 

> Nota : il ne faut pas oublier de couper le tout avant de sortir du programme.

Vous pouvez aussi retrouver le [code source de ce programme sur Github](https://github.com/fxrobin/atari-st-stuffs/tree/main/simple_ym_2149).

```c
/**
 * Simple YM-2149 Demo
 * Author : F.X. ROBIN
 * Site   : https://www.fxjavadevblog.fr
 * 
 * This program plays simple notes with the YM-2149 in order to demonstrate
 * the concept of sending commands to the chip.
 * 
 * */

#include <sys/types.h>
#include <stdio.h>
#include <mint/osbind.h>

#define DIVIDER_LINE "----------------------------------------"
#define print_screen(string) puts(string "\r\n")
#define print_divider_line() puts(DIVIDER_LINE "\r")

#define array_size(array) sizeof array / sizeof *array

#define PSG_REGISTER_INDEX_ADDRESS (__uint8_t *)0xFF8800
#define PSG_REGISTER_DATA_ADDRESS  (__uint8_t *)0xFF8802
#define PSG_R0_TONE_A_PITCH_LOW_BYTE  0
#define PSG_R1_TONE_A_PITCH_HIGH_BYTE 1
#define PSG_R7_MIXER_MODE 7
#define PSG_R8_VOLUME_CHANNEL_A 8

#define PSG_CLOCK 2000000 // Hz
#define TONE_DIVIDER 16   // divider for tone generator : 16
#define VBL 50            // Hz (Lazy / Lame. I could check the $FF820A instead)

// English notation. Note + Natural Frequency in Hz
#define NOTE_C 264 // DO
#define NOTE_D 297 // RE
#define NOTE_E 330 // MI
#define NOTE_F 352 // FA
#define NOTE_G 396 // SOL
#define NOTE_A 440 // LA
#define NOTE_B 495 // SI

/**
 * writes a byte at the specified register of the PSG.
 * Note: function is "static inline" in order to avoid stack usage and optimize function calls
 * */
static inline void write_PSG(__uint8_t registerIndex, __uint8_t registerValue)
{
    (*PSG_REGISTER_INDEX_ADDRESS) = registerIndex;
    (*PSG_REGISTER_DATA_ADDRESS) = registerValue;
}

/**
 * waits for a specific amont of seconds. (based on Vsync() and VBL).
 * Note: function is "static inline" in order to avoid stack usage and optimize function calls
 * */
static inline void wait(__uint8_t seconds)
{
    for (int i = 0; i < VBL * seconds; i++)
    {
        Vsync();
    }
}

/**
 * Main program, executed in supervisor mode.
 * */
void run()
{
    print_screen("-=| Simple YM-2149 DEMO |=-");
    print_screen("http://www.fxjavadevblog.fr");
    print_divider_line();

    int notes[7] = {NOTE_C, NOTE_D, NOTE_E, NOTE_F, NOTE_G, NOTE_A, NOTE_B};

    write_PSG(PSG_R7_MIXER_MODE, 0b00111110);       // activate (0) only Tone on channel A, yes activation is 0 !
    write_PSG(PSG_R8_VOLUME_CHANNEL_A, 0b00001111); // max volume on channel A

    int toneModifier = PSG_CLOCK / TONE_DIVIDER;

    for (int i = 0; i < array_size(notes); i++)
    {
        // note[i] must be converted. YM-2149 doc says : RealNoteFreq = (PSG_CLOCK) / (16 * value)
        // "value" reprensents the 12 bit oscillation frequency setting value (called TP in YM-2149 doc.)
        // so with simple maths : value = PSG_CLOCK divided by 16 then divided by note[i]
        // toneModifier = (PSG_CLOCK / TONE_DIVIDER) = (2 000 000 / 16) = 125 000
        __uint16_t value = toneModifier / notes[i]; // only 12 bits used in "value".

        // now write 12 bits value into R0 and R1
        write_PSG(PSG_R0_TONE_A_PITCH_LOW_BYTE, (__uint8_t)value);         // first 8 bits into R0. PSG_APITCHLOW = 0 (R0)
        write_PSG(PSG_R1_TONE_A_PITCH_HIGH_BYTE, (__uint8_t)(value >> 8)); // last 4 bits into R1, so let's ignore first 8 bits. PSG_APITCHHIGH = 1 (R1)

        printf("Playing : %d Hz\r\n", notes[i]);

        wait(1); // wait 1 seconds between each note
    }

    // shutdown volume and mixer

    write_PSG(PSG_R8_VOLUME_CHANNEL_A, 0b00000000); // volume channel A, OFF
    write_PSG(PSG_R7_MIXER_MODE, 0b00111111); // mixer, deactivate (1 !) all

    print_divider_line();
    print_screen("Finished");
    getchar();
}

/**
 * Turn me into god (supervisor mode), and launch "run" function.
 * This is needed for direct accessing the PSG register addresses.
 * */
int main(int argc, char *argv[])
{
    Supexec(&run);
}
```

> Nota : l'attente d'une seconde entre chaque note utilise la VBL. Ce n'est pas la meilleure approche, vous le verrez pas la suite.
> Mais je ne souhaitais pas complexifier de petit exemple, donc c'est convenable.

Ainsi, si l'on cherche à changer la valeur des 14 registres "d'un coup", il faut faire l'action suivante **14 fois** :

1. écrire dans le sélecteur de registre (`$FF8800`).
2. écrire la valeur dans le registre `DATA WRITE` (`$FF8802`).

C'est un peu laborieux, mais avec une boucle, c'est simple et **cela sera nécessaire pour la lecture de fichiers YM**.

Une petite curiosité intéressante : pour connaître la valeur d'un des registres du YM-2149, il faut écrire le numéro
du registre dans le sélecteur, puis, lire à la même adresse (c'est à dire l'adresse du sélecteur !) la valeur
courante. Cela sera utile pour afficher le contenu des registres à un instant donné à l'écran.

Pour résumer cette section, __`$FF8800` et `$FF8802` sont les deux seules adresses mémoires pour intéragir avec les 14 registres du YM-2149__, 
et cela suffira pour produire de la musique !

## Structure des fichiers YM2 et YM3

Arnaud Carré est l'inventeur d'un format de fichier nommé ".YM". Vous trouverez les informations nécessaires sur son site ainsi que des *players* pour
PC et divers utilitaires : <http://leonard.oxg.free.fr/ymformat.html>

Le format "YM" a eu beaucoup de versions (de la 1 à la 6). Dans le cadre de ce tutoriel, je ne vais évoquer que les formats YM2 et YM3 qui sont presque équivalents.

Pour vulgariser, **ces fichiers YM sont des suites de 14 octets**, représentants la capture (*dump*) des 14 registres du YM-2149 réalisés, généralement, 50 fois par secondes (50 Hz).

Cette fréquence est largement suffisante pour permettre de jolies musiques typiques de nos Atari ST tout en laissant
suffisamment de temps processeur au 68000 pour faire tout autre choses que de mettre à jour le "son", comme par exemple
des animations à l'écran, ou calculer l'IA du jeu en cours.

Le format "YM" est généralement compressé au moyen de l'algorithme LZH, répandu sur nos machines. Il est peu gourmand en
ressources pour décompresser et permet d'obtenir un taux de compression intéressant sur les fichiers YM où les données se répètent beaucoup.

Le fichier dispose d'une entête de 4 octets, où l'on trouve les caractères `YM2!` ou `YM3!`.
Les données utiles, dans le cadre de ce tutoriel, commencent donc après cette entête.

Comme indiqué précédemment, les données représentent des séquences de 14 octets, qui seront à envoyer aux 14 registres du YM-2149. Ces séquences seront à envoyer de manière régulière, généralement à une fréquence de 50 fois par secondes.

Ainsi, en prenant la taille totale du fichier, moins les 4 octets d'entête, et qu'on la divise par 14, on obtient le nombre de "music frames", c'est à dire combien de blocs de 14 octets sont présents dans le fichier.

Si on divise alors le nombre de "music frames" par 50 (50 fois par secondes), on obtient donc la durée, en secondes, de la musique.

Un petit détail, mais très important, afin maximiser l'efficacité de l'algorithme de compression LZH, Arnaud Carré a décidé (et il a eu raison) de d'abord placer toutes les valeurs du registres R0 pour chacune des music frames, puis toutes les valeurs de R1 pour chacune des music frames, etc. C'est qu'on appelle un format entrelacé (interleaved).

Ainsi, pour avoir les 14 octets à mettre dans les 14 registres à un instant donné, il faut aller piocher en mémoire à des adresses non contigües, mais facilement calculables en fonction uniquement de la music frame courante et du nombre total de music frames.

Pour comprendre ce format, prenons un exemple : un fichier YM décompressé de taille 70004 octets.

- Après avoir retiré les 4 octets de l'entête, il dispose donc de 70000 octets de données.
- Il y a car 14 registres, donc pour obtenir le nombre de "mudic frames" : 70000 / 14 = 5000..
- Le fichier comporte donc 5000 music frames (de 0 à 4999).
- Etant donné que l'on met à jour le YM-2149 50 fois par seconde avec le contenu des 14 registres inclus dans 1 music frame, la musique dure donc 100 secondes : 5000 / 50 = 100, c'est à dire 1 minute et 40 se secondes.  

La structure en mémoire du fichier lu est la suivante :

Pour la music frame 0 :

- R0 est à l'offset 0, 
- R1 est à l'offset 5000, (offset de R0 + nombre de music frames)
- R2 est à l'offset 10000, (offset de R1 + nombre de music frames)
- R3 est à l'offset 15000, (offset de R0 + nombre de music frames)
- etc.

Pour la music frame 1 :

- R0 est à l'offset 1,
- R1 est à l'offset 5001, (offset de R0 + nombre de music frames)
- R2 est à l'offset 10001, (offset de R1 + nombre de music frames)
- R3 est à l'offset 15001, (offset de R0 + nombre de music frames)
- etc.

Pour la music frame 2 :

- R0 est à l'offset 2,
- R1 est à l'offset 5002, (offset de R0 + nombre de music frames)
- R2 est à l'offset 10002, (offset de R1 + nombre de music frames)
- R3 est à l'offset 15002, (offset de R0 + nombre de music frames)
- etc.

Pour résumer voici la structure résumée au moyen de ce schéma :

![Schema](/images/m68k-atari-st-ym-player/schema-format-ym.png){: .fakescreen}

Ce format (YM2 ou YM3) est finalement assez simple.

La problématique que devra résoudre l'algorithme de lecture est la suivante :

- Le buffer contient 5000 premières valeurs pour R0, puis 5000 autres valeurs pour R1... La lecture du fichier est linéaire.
- Pour chaque "music frame", il faut envoyer une "colonne" de 14 registres au PSG, et non pas une ligne. Il faudra donc se déplacer dans la mémoire pour aller chercher les valeurs situées aux bonnes colonnes (donc aux bons offsets).

> Nota : on pourrait imaginer que le fichier soit lu et qu'il soit ré-agencé en mémoire afin de disposer de N séries (music frames) des 14 registres de manière contigüe. Cela consommerait 
> de la mémoire le temps de cette transformation mais la structure en mémoire serait plus simple. De fait l'algorithme de lecture serait simple et peut-être plus rapide : lire un "paquet" 
> de 14 octets représentants les 14 registres de manière contigüe et les envoyer au PSG. Toutefois, on ne peut envoyer que 1 octets à la fois, les un après les autres et dans tous les cas il faut 
> aller lire les données entrelacées, donc nous n'allons pas mettre en place ce ré-agencement car le gain est trop faible.

## Algorithme de lecture du son

L'algorithme de lecture du son assez simple, il tient en quelques lignes.

Le principe est d'aller chercher les valeurs des 14 registres dans en mémoire de la manière suivantes :

- Lire la valeur du registre R0 en fonction du la music frame courante (en décallant simplement l'adresse) ;
- Puis, chaque valeur de chacun des autres registres (14 au total) doit être récupérée avec un décallage du nombre global de "music frames" ;
- Pour chaque, valeur récupérée, il faut écrire aux adresses $FF8800 et $FF8802 pour programmer le YM-2149 ;
- Enfin, il faut incrémenter le compteur de la "music frame courante" et ne pas la routine sur le compteur est égal ou supérieur au nombre total de "music frames".

Ainsi, il suffit de 3 variables globales :

- `musicData` :l'adresse mémoire du buffer représentant les données du fichiers, en pointant sur le premier octet "utile", c'est à dire sans l'entête YM3! ou YM2!
- `totalMusicFrames` : nombre total de "music frames" (14 octets à envoyer au YM-2149), calculé en fonction de la taille du fichier, mois les 4 octets d'entête.
- `currentMusicFrame` : index courant de la "music frame" envoyé au YM-2149. 

Algorithme général (en pseudo langage fictif, qui ressemble à du BASIC)

```python
ADRESS PSG_REGISTER_INDEX_ADDRESS = $FF8800
ADRESS PSG_REGISTER_DATA_ADDRESS  = $FF8802

ADDRESS musicData = LOAD_FILE("my-music.ym") + 4 
INTEGER totalMusicFrames = (FILE_SIZE("my-music.ym")) - 4) / 14
INTEGER currentMusicFrames = 0

DO_AT_FREQUENCY(50)
    WHILE (currentMusicFrame < totalMusicFrames>)
        ADDRESS bufferOffset = musicData + currentMusicFrame
        FOR BYTE registerIndex FROM 0 TO 13
            BYTE registerValue = PEEK (bufferOffset);
            POKE (PSG_REGISTER_INDEX_ADDRESS, registerIndex)
            POKE (PSG_REGISTER_DATA_ADDRESS, registerValue) 
            bufferOffset = bufferOffset + totalMusicFrame
        NEXT
        INCREMENT currentMusicFrame
    END_WHILE
END_DO_AT_FREQUENCY    
```        

Explications des instructions fictives :

| Instruction | Action | Commentaires   |
|----------------------------|--------|----------------|            
| `ADDRESS <name> = <value>`{:.nowrap} | Déclare une variable de type "adresse" et affecte une valeur. | C'est à dire un pointeur en mémoire. |            
| `INTEGER <name> = <value>`{:.nowrap} | Déclare une variable de type "entier". | |
| `LOAD_FILE(<file>)`{:.nowrap} | Charge un fichier en mémoire et retourne l'adresse sur les données chargés | Ici, on décalle l'adresse de 4 octets pour "passer" l'entête "YM2!" ou "YM3!". |
| `FILE_SIZE(<file>)`{:.nowrap} | Retourne la taille du fichier. | Ici, on retire 4 octets de la taille pour pouvoir en déduire le nombre de "music frames" en divisant par 14. |
| `DO_AT_FREQUENCY(<freq>)`{:.nowrap} <br /> ... <br /> `END_DO_AT_FREQUENCY` | Exécute une portion de code à une fréquence spécifique. | Fréquence en Hz |
| `WHILE (<condition>)`{:.nowrap} <br /> ... <br /> `END_WHILE` | Classiquement, répète une portion de code tant que la condition est vraie. |  |
| `FOR <name> FROM <start> TO <end>`{:.nowrap}  <br /> ... <br /> `NEXT` | Répète une portion de code en fonction d'une itération sur un nombre. | Ici de 0 à 13 inclus |
| `PEEK(<address>)`{:.nowrap} | Retourne la valeur d'un octet situé à une adresse mémoire. | Si on utilise cette instruction 2 fois, il faut rajouer l'instruction `&COLEGRAM`.|  
| `POKE(<address>, <value>)`{:.nowrap}| Ecrit un octet à une adresse donnée. | Petites pensées pour l'âge d'or de la *Bible des Pokes*. |                  
| `INCREMENT <var>`{:.nowrap} | ajoute 1 à une variable numérique. | |

Voici la traduction en C de cet algorithme (sans l'instruction de répétition à 50 Hz):

```c
if (currentMusicFrame < totalMusicFrames)
{
    __uint8_t *address = musicData + currentMusicFrame++;

    for (int i = 0; i < 14; i++)
    {
        *PSG_REGISTER_INDEX_ADDRESS = i;
        *PSG_REGISTER_DATA_ADDRESS = *(address);
        address += totalMusicFrames;
    }
}
```

et voici la même routine, codée en assembleur, je ne mentionne pas encore quelques détails, avant et après cette routine, car ce sera l'objet de la prochaine section.

Registres 68K utilisés :

- `D0` : currentMusicFrame
- `D1` : totalMusicFrames
- `D2` : registerIndex 0 à 13
- `D3` : index de boucle 13 à 0
- `A0` : musicData, puis musicData + currentMusicFrame, puis A0 + totalMusicFrames pour chaque registre

```armasm
    ...
    ...
; --- Let's test if music is over
    MOVE.L  _currentMusicFrame, D0       
    MOVE.L  _totalMusicFrames, D1
    CMP.L   D0, D1                   ; if _currentMusicFrame == _totalMusicFrames
    BEQ     dont_play           	; if music is over, pass over the routine call
; --- begin play	
    MOVE.L  _musicData, A0           ; set base pointer to A0.
    ADDA.L  D0, A0                  ; move the base pointer to _currentMusicFrame offset (D0)
    MOVE.L  #0, D2                   ; 14 registers to write to YM-2149 (R0 to R13).
    MOVE.L 	#13, D3                  ; reverse index for loop optimization
 ; --- begin loop over 14 PSG registers  
loop_write_psg_register:
    MOVEA.B D2, PSG_REGISTER_INDEX_ADDRESS	; write the register number
    MOVEA.B (A0), PSG_REGISTER_DATA_ADDRESS	; write the data at the adress
    ADDQ.L  #1, D2                          ; increment register number (D2)
    ADDA.L  D1, A0                          ; A0 = A0 + _totalMusicFrames (D1)
    DBRA    D3, loop_write_psg_register     ; decrement D3. If D3 >= 0 then loop.
; --- end loop. A tune frame has been sent to the YM2149	
    ADDQ.L  #1, (_currentMusicFrame)        ; incrementing currentMusicFrame
dont_play:
    ...	
    ...
```

La particularité de cette algorithme est donc qu'il soit s'éxécuter de manière cadencée, 50 fois par secondes.

J'entends déjà au fond de la salle :

> "Super, on va pouvoir se caler sur la VBL (vertical blank) qui est à 50 Hz !"

C'est une fausse bonne idée malheureusement, la VBL peut-être à 50 Hz, 60 Hz, et même 70 hz (monochrome). Donc
il ne faut pas se fier à cette information. Mais l'Atari ST dispose de "Timers" programmables que l'on peut paramétrer
à notre guise. C'est l'objet de la prochaine section et notre routine pourra être invoquée proprement à la fréquence 
souhaitée.

## Théorie : Les Timers

Encore une fois, dans cette section, je ne rentrerai pas dans le détails des Timers, mais juste ce qu'il faut pour
comprendre l'usage que nous allons en faire.

En préambule, un timer est une sorte de "cadenceur" qui permet de déclencher du code à intervalle régulier.

Ains, un timer est configuré sur une fréquence d'éxécution et associé avec l'adresse d'une routine à lancer. Ce genre de routine est appelé "Exception", car il interrompt l'exécution du programme en cours momentanément.

L'atari ST dispose de 4 timers : le Timer A, le Timer B, le timer C et le timer D. Chacun ayant quelques spécifités (compteur de lignes HBL, horloge 200 Hz, Horloge RS232), hormis le timer A, c'est ce dernier que nous utiliserons.

Il y a quelques subtilités à prendre en compte dans une telle routine mais cela fera l'objet de la prochaine section.

La mise en place de la routine, c'est à dire son paramétrage, est fait au moyen de l'appel XBIOS via la Trap 14 et de sa routine #31 (xbtimer). Dans notre cas, je vais utiliser une fonction C, déjà présente dans `osbind.h` qui permet de spécifier la fréquence et la routine à appeler. Il est préférable de désactiver le système qui génère l'interruption en fonction du timer, le temps de son paramétrage.

Voici donc à quoi ressemble, en C, le paramétrage de la routine Timer A.

```c
Jdisint(13);
Xbtimer(0, 7, 246,  adresseRoutine);
Jenabint(13);
// à partir de ce moment, la fonction "adresseRoutine" est déclenchée à 50 Hz, environ
```

Explications :

- `Jdisint(13)` : désactive les interruptions de niveau 13. Le timer A est une interruption de niveau 13.
- `Xbtimer(0, 7, 246,  adresseRoutine)` : paramètre le timer A (0), avec une prédevision de fréquence à 7 (c'est à dire 1/200), et une division finale de 246, ce qui équivaut presque à 50 Hz, en mappant l'adresse de la routine dans le vecteur du timer A
- `Jenabint(13)` : réactive les interruptions de niveau 13, dont le Timer A.

> Mais c'est quoi ces valeurs de paramètres `7` et `246` ?

Pour répondre à cette question, il faut se référer à la documentation du __MFP 68901 (Multi Function Peripheral)__, puce responsable de certains cadencements et notamment de celui des timers et donc du Timer A. Le MPF offre une cadence de base à `2,4576 MHz`. Il est possible de définir avec presque exactitude la fréquence souhaitée au moyen de 2 paramètres : le **prédiviseur** et le **diviseur**. 

Voici le tableau de définition du prédiviseur :

| Paramètre | Prédiviseur de fréquence | Fréquence obtenue |
|-----------|---------------------------|------------------|            
| `1`       | 1 / 4                     | 614 400 Hz       |
| `2`       | 1 / 10                    | 245 760 Hz       |
| `3`       | 1 / 16                    | 153 600 Hz       |
| `4`       | 1 / 50                    | 49 152 Hz        |
| `5`       | 1 / 64                    | 38 400 Hz        |          
| `6`       | 1 / 100                   | 24 756 Hz        |          
| `7`       | 1 / 200                   | 12 288 Hz        |          

Ensuite, il faut d'appliquer un **diviseur** pour obtenir la fréquence souhaitée. Ce diviseur d'une précision de 8 bits.

Ainsi pour s'approcher au plus près de 50 Hz, il faut choisir la prédivision `7` : 12288 Hz, que l'on divise par 246, ce qui donne **49,95 Hz**.
Si on utilise 245, on obtenient 50,15 Hz, ce qui est moins proche de notre cible à 50 Hz.

> Nota : la valeur `0` du diviseur n'étant mathématiquement pas possible, elle représente `256`, mais cela n'a pas de conséquence sur ce tutoriel.
> Ce qui permet d'obtenir la fréquence la plus basse possible pour un timer : `12 288 / 256 = 48 Hz`

Enfin, pour arrêter la routine en fin de programme, il suffit de paramétrer le Timer A avec 0 et 0 en tant que pré-diviseur et diviseur de fréquence. L'adresse passé en paramètre est ignorée : `Xbtimer(0, 0, 0,  (void*) 0)`

## Implémenter une routine Timer A

Comme précisé dans la section précédente, une routine type "Timer" est un peu spéciale :

- Il faut veiller à bien sauvegarder l'ensemble des états des registres de données et d'addresse sauf, A7 (SP), bien évidemment, avant d'écriture la routine.
- Il faut que la ne dure pas plus longtemps que la fréquence qui est spécifiée.
- Il faut restorer l'état des registres sauvegardés précédemment.
- Il faut que la routine signale qu'elle est terminée en mettant à zéro un bit spécifique d'un registre mémoire assigné à l'état des exceptions. Dans le cas du timer A, c'est le 5 ème bit du registre `$FFFFFA0F`. Nota : dans le libre du développeur vol. 2, ce bit est appelé __le bit mystérieux__.
- Il faut terminer la routine par l'instruction `RTE` (return from exception) et non pas `RTS`.

Voici donc le canvas d'une routine de type Timer A :

```armasm
    MOVEM.L		D0-A6,-(SP)         ; saves registers

    ; ... Do the real JOB HERE ... but do it fast !

	BCLR.B 	#5, $FFFFFA0F     	; effacer le bit d'interruption de service : bit 5 du timer A
	MOVEM.L	(SP)+,D0-A6   		; restore registers
	RTE                         ; Return from exception : end of Timer A interrupt
```

Simple non ?

> Mais en C ? On fait comment pour faire une function qui se termine par un RTE et non pas un RTS ?

Pas de panique tout est prévu. Il suffit d'aposer `__attribute__((interrupt))` dans la déclaration de la fonction.
Facile++; !

Ce qui donne ceci, en veillant toutefois à mettre le 5ème bit de l'interruption de service à 0 avant de quitter :

```c
#define INTERRUPTION_SERVICE_ADDRESS (__uint8_t *)0xFFFFFA0FL
__uint8_t END_OF_INTERRUPT_TIMER_A = ~(1 << 5);

void __attribute__((interrupt)) timerA_Routine_C()
{
   // ... 
   // ... Do the real JOB HERE ... but do it fast !
   // ...

   // End of timer A routine, let's clear the corresponding service bit
    *(INTERRUPTION_SERVICE_ADDRESS) &= END_OF_INTERRUPT_TIMER_A; // clear service bit.
}
```

## La routine complète Timer A de lecture de musique YM

Je vous propose ici deux versions, l'une en C, l'autre en assembleur

### La routine timer A version C

```c
#define PSG_REGISTER_INDEX_ADDRESS (__uint8_t *)0xFF8800
#define PSG_REGISTER_DATA_ADDRESS (__uint8_t *)0xFF8802
#define INTERRUPTION_SERVICE_ADDRESS (__uint8_t *)0xFFFFFA0FL

unsigned long int totalMusicFrames = 0;
unsigned long int currentMusicFrame = 0;
__uint8_t *musicData;

void __attribute__((interrupt)) timerA_Routine_C()
{
    if (currentMusicFrame < totalMusicFrames)
    {
        __uint8_t *address = musicData + currentMusicFrame++;

        for (int i = 0; i < 14; i++)
        {
            *PSG_REGISTER_INDEX_ADDRESS = i;
            *PSG_REGISTER_DATA_ADDRESS = *(address);
            address += totalMusicFrames;
        }
    }

    *(INTERRUPTION_SERVICE_ADDRESS) &= END_OF_INTERRUPT_TIMER_A; // clear service bit.
}
```

> Dans la version finale de cette routine, j'utiliserai la fonction "write_PSG" à la place des écritured aux adresses du PSG dans la boucle *for*. cf. le [projet sur Github](https://github.com/fxrobin/atari-st-stuffs/tree/main/ym_player).

### La routine timer A version Assembleur

```armasm
; -- References to C defined variables and pointers
	XREF    _currentMusicFrame
	XREF    _totalMusicFrames
	XREF    _musicData

; -- Declaring ASM functions to be called from C	
	XDEF    _asm_timerA_Routine

; -- Equates
PSG_ADDRESS_REGISTER 	EQU $FF8800
PSG_ADDRESS_WRITE_DATA 	EQU $FF8802	

; ------------------------------------------------------------------------------
; -- Implementation of  : _asm_timerA_Routine
; -- Description : timed exception routine (Timer A) to send PSG register values
; --               in order to play some sound (and music).
; ------------------------------------------------------------------------------
_asm_timerA_Routine:
    MOVEM.L	D0-A6,-(SP) ; saves registers
; --- Let's test if music is over
    MOVE.L _currentMusicFrame, D0       
    MOVE.L _totalMusicFrames, D1
    CMP.L  D0,D1       ; if _currentMusicFrame == _totalMusicFrames
    BEQ    dont_play   ; if music is over, pass over the routine call
; --- begin play	
    MOVE.L  _musicData, A0  ; set base pointer to _musicData
    ADDA.L  D0, A0          ; move the base pointer to _currentMusicFrame offset (D0)
    MOVE.L  #13,D0          ; 14 registers to write to YM-2149 (R0 to R13). 
    MOVE.L  #0,D2           ; register index (0 to 13)
 ; --- begin loop over 14 PSG registers
loop_write_psg_register:
    MOVEA.B D2, PSG_ADDRESS_REGISTER        ; write the register number
    MOVEA.B (A0), PSG_ADDRESS_WRITE_DATA    ; write the data at the adress
    ADDQ.L  #1, D2                          ; increment D2 (currentRegister)
    ADDA.L  D1,A0                           ; adding _totalMusicFrames to A0
    DBRA    D0, loop_write_psg_register     ; decrement D0. If D0 >= 0 then loop.
; --- end loop. A music frame has been sent to the YM2149	
    ADDQ.L  #1,(_currentMusicFrame)     ; incrementing currentFrame
dont_play:	
    BCLR.B  #5, $FFFFFA0F       ; clear service bit
    MOVEM.L (SP)+,D0-A6         ; restore registers
    RTE                         ; Return from exception
; ------------------------------------------------------------------------------
```

## Le programme principal en C

Cette version appelle la routine en assembleur.

```c
void run()
{
    // inits display in medium resolution with a custom palette
    screenContext = initMediumResolution();

    Buffer *buffer = loadFile(YM3_FILE);
    initPlayer(buffer);

    displayGreetings();
    displayInfo(buffer);
    displayHeaders();

    locate(0, 9);
    printf("Removing KEYCLICK Sound");
    __uint8_t originalKeyClick = read_byte((__uint8_t *)0x00000484);
    write_byte(0b11111110 & originalKeyClick, (__uint8_t *)0x484);

    Jdisint(13);
    Xbtimer(0, 7, 246, asm_timerA_Routine); // 50 Hz
    Jenabint(13);

    locate(0, 10);
    printf("Timer A routine installed");

    while ((read_byte(SCANCODE_ADDRESS) != 129))
    {
        displayKeyBoardStatus();
        displayStatusBar();
        displayRegistersBar();
        displayVuMeter();
        // let the CPU breathing a little
        Vsync();
    }
    Crawcin();

    // remove timer A routine
    Xbtimer(0, 0, 0, (void *)0);

    soundOff();

    // restore keyclick
    write_byte(originalKeyClick, (__uint8_t *)0x484);

    locate(0, 21);
    printf("Timer A routine removed and KeyClick configuration restored\r\n");
    printf("Cleaning memory...\r\n");
    freeBuffer(buffer);
    printf("Finished. Press [ENTER] to go back to Desktop.\r\n");

    getchar();

    restoreScreenContext(screenContext);
}

int main(int argc, char *argv[])
{
    Supexec(&run);
}

```

## Le diable se cache dans les détails

### Couper le "ding" de l'appui des touches

On ne souhaite pas que notre jolie musique soit interrompue de "ding" d'appui de touche
pendant sa lecture. Cela se désactive facilement :

```c
#define KEYCLICK_CONF_ADDRESS (__uint8_t *)0x484
...
...
// backup the config
 __uint8_t originalKeyClick = read_byte(KEYCLICK_CONF_ADDRESS);
// disable keyclick sound 
write_byte(0b11111110 & originalKeyClick, KEYCLICK_CONF_ADDRESS);

...
...

// restore the config.
write_byte(originalKeyClick, KEYCLICK_CONF_ADDRESS);

```

Attention toutefois à restaurer la valeur de ce registre avant de sortir du programme.
Ce qui signifie qu'il aura fallu la sauvegarder au préalable.

### Et je coupe le son

Avant de retourner au Desktop et quitter le programme, il faut "éteindre" toute production de sonore.

Je le fais en indiquant au registre R7 de tout désactiver, étrangement en mettant tous les bits utiles (6 bits) à 1.

```c
void soundOff()
{ 
    write_byte(7, PSG_REGISTER_INDEX_ADDRESS);        
    write_byte(0b00111111, PSG_REGISTER_DATA_ADDRESS); // mixer, deactivate (1 !) all
}
```

### Clavier

Je ne vais pas rentrer dans les détails de la gestion du __clavier intelligent__ de l'Atari ST.
Oui, c'est bien "intelligent" : `IKBD`, Intelligent Keyboard.

Dans notre cas, il suffit de scruter l'adresse `$FFFC02` et de regarder si elle vaut `129` ce qui correspond
à l'appui et au relâchement de la touche `ESC`.

## Conclusion

Nous voici avec une belle routine pour jouer des fichiers YM simples. Nos oreilles sont maintenant ravies !
L'ensemble parait un peu laborieux, mais quel plaisir d'entendre ces *Chiptunes* !

> Je remercie Lyloo la relecture attentive de cet article.

## Liens & Bibliographie

- [Atari ST Chiptunes "the evolution of soundchip music on Atari ST, by Georges KESSELER (Haxogreen 2018)](<https://www.youtube.com/watch?v=BxEgrkY22vg&list=PLLEkTmNIRKoPlvYx8EFjuWBBqsNDKf-wT)
- [Livre du développeur Atari ST,  2ème edition](https://devlynx.ti-fr.com/ST/le%20livre%20du%20developpeur%20tome%202%20PDF.zip)
- [Atari ST Internals](https://www.synacktiv.com/ressources/Atari-ST-Internals.pdf)
- [Hardware Atari ST](https://devlynx.ti-fr.com/ST/Hardware%20ATARI%20PDF.zip)
- [Atari ST Scancodes & ASCII Table](https://www.jchr.be/atari/tables.htm)
- [Vecteurs d'interruption du 68K et du MFP 68901](http://atariste.free.fr/asm/assembleur10j06.htm)
- [YM archives](https://pacidemo.planet-d.net/aldn)
- [demozoo.org : mad Mmax. (Jochen Hippel)](https://demozoo.org/sceners/2630/)
- [YM file formats](https://raw.githubusercontent.com/skeezix/zikzak/master/zik80/audio-gen/ym-file-format.txt)
- [Arnaud Carré : description YM6!](http://leonard.oxg.free.fr/ymformat.html)

