---
layout: post
title: 4 bitplanes de l'Atari ST
subtitle: Structure de la mémoire vidéo de la basse résolution de l'Atari ST
logo: atari-st-bomb.png
category: articles
tags: [Retro, C, Atari, Retro-Prog]
lang: fr
ref: atari-st-4-bitplanes
---

<div class="intro" markdown='1'>
Quand on se (re)plonge dans la programmation de l'Atari ST et notamment de l'affichage
des pixels à l'écran, on se rend vite compte qu'on a pris de bien mauvaises habitudes
avec nos ordinateurs "modernes", où la structure en mémoire est très simple en comparaison.

Cet article, illustré de programmes en C, va vous permettre de comprendre ENFIN cet agencement
particulièrement étonnant pour ne pas dire étrange.

Retouvez mon ami Fred, qui a délaissé un peu son Amiga pour venir du côté obscur de l'Atari ST,
dans sa quête d'affichage de pixels !
</div>
<!--excerpt-->

## Préambule et mise en situtation

> Fred : "Je veux afficher des Sprites animés avec de la musique en même temps, à 60 FPS !"

Minute Papillon ! Retour en 1985, Nom de Zeus ! Tu n'as que 16 couleurs à ta disposition,
parmis 4096 si tu es le chanceux propriétaire d'un STE ou seulement 512 pour les ST et STF.

Et en plus tu vas rire, mais pour changer la couleur d'1 pixel à l'écran tu vas devoir manipuler
des bits différents sur 8 octets !

> Fred : "Mais ! Euh !!! C'est compliqué !"

Oui c'est un peu compliqué, mais c'est un mal nécessaire pour économiser de la RAM ! Et puis tu verras, 64 bits consécutifs te permettront
de définir la couleur de 16 pixels et ainsi de suite, tous les 8 octets (64 bits).

Allez, sans plus attendre je t'explique tranquillement, mais tu peux oublier de faire de la musique en même
temps pour le moment !

## La mémoire vidéo

A l'initialisation de l'Atari ST, une zone de la mémoire est réservée et contient l'information d'affichage des pixels affichés à l'écran. Je ne vais évoquer dans cet article que de l'affichage en basse résolution, c'est à dire en 320x200 16 couleurs.

L'adresse de cette zone mémoire peut varier. En effet à l'initialisation, la fin de la RAM est allouée. Cela dépend donc de la taille de la mémoire que vous avez. Avec un ST équipé de 4 Mo de RAM, elle se situe à l'adresse `3F8000` alors qu'elle se situe à l'adresse `F8000` pour un ST équipé d'un seul méga octet.

De plus plus, en pratique, l'adresse de la mémoire vidéo est changeable avec certaines contraites dans le cas du ST (le STE n'aura pas ces contraintes), mais ceci est un autre sujet que je n'aborderais pas ici (*double buffering*, etc.).

Cette zone mémoire fait 32 000 octets, c'est à dire un peu moins de 32 Ko, puique 1 Ko = 1024 octets. 

Etant donné qu'un pixel à l'écran fait référence à une couleur parmis 16, seuls 4 bits sont nécessaires par pixel
pour préciser la référence de quelle couleur est à afficher. Et oui, 4 bits == 16 valeurs possibles (de 0 à 15)

Petit rappel si jamais cela devait être nécessaire :

| Décimal | Binaire | Hexa |
|--------:|--------:|:----:|
| `0`     | `0000`  | `0`         |
| `1`     | `0001`  | `1`         |
| `2`     | `0010`  | `2`         |
| `3`     | `0011`  | `3`         |
| `4`     | `0100`  | `4`         |
| `5`     | `0101`  | `5`         |
| `6`     | `0110`  | `6`         |
| `7`     | `0111`  | `7`         |
| `8`     | `1000`  | `8`         |
| `9`     | `1001`  | `9`         |
| `10`    | `1010`  | `A`         |
| `11`    | `1011`  | `B`         |
| `12`    | `1100`  | `C`         |
| `13`    | `1101`  | `D`         |
| `14`    | `1110`  | `E`         |
| `15`    | `1111`  | `F`         |

## La palette et le codage des couleurs

La palette de l'Atari ST est située à l'adresse non modifiable `$FF8240`. En C je dispose
de fonction qui appelleront directement des fonctionnalités du TOS pour récupérer affecter des valeurs
à la palette voire même de définir une nouvelle palette par copie d'une structure équivalente.

Chaque couleur est exprimée sur 16 bits, c'est à dire 2 octets, ou encore 1 *word* (mot).
Il y a donc 32 octets utilisés pour la palette (16 couleurs * 2 octets).


Ces 16 bits permettent de spéficier la valeur "RGB" (Red Green Blue) de la couleur.

En réalité, seuls les 12 bits de poids faibles seront vraiment utilisés sur STE, et seulement 9 bits répartis sur les 12 bits dans le cas d'un ST/STF.

Chaque composante de couleur peut aller de 0 à 7 dans le cas d'un Atari ST et de 0 à F (avec une petite astuce) pour le STE. Nous allons nous concentrer sur le ST "Normal", sachant que les couleurs définies ainsi sont compatibles avec l'Atari STE.

On remarque qu'il y a donc 8 valeurs possibles (de 0 à 7) pour chaque composante. Ce qui fait 8 x 8 x 8 = 512 couleurs possibles.

Voici quelques exemples pour représenter certaines couleurs :

| ` RGB` | Couleur      |
|--------|--------------|            
| `0777` | blanc        |
| `0000` | noir         |
| `0700` | rouge        |
| `0070` | vert         |
| `0007` | bleu         |
| `0300` | Rouge sombre |
| `0003` | Bleu sombre  |
 
Fred, regarde, les 4 bits de poids fort sont systématiquement à 0. On code la palette sur 12 bits seulement.

Pour les exemples suivants, nous utiliserons cette *petite* palette, définie en C de la manière suivante :

```c
__uint16_t palette[16] =
    {
        0x000, // couleur 0
        0x300, // couleur 1 
        0x030, // couleur 2
        0x003, // couleur 3
        0x330, // couleur 4
        0x033, // couleur 5
        0x303, // couleur 6
        0x333, // couleur 7
        0x000, // couleur 8
        0x700, // couleur 9, rouge vif
        0x070, // couleur 10, vert vif
        0x007, // couleur 11, bleu vif
        0x770, // couleur 12
        0x077, // couleur 13
        0x707, // couleur 14
        0x777  // couleur 15
    };
```

> Notez ici que les 4 bits de poids fort sont omis.
> `__uint16_t` est un type de 16 bits non signé.

## La structure des blocs de 64 bits (4 x 16 bits) consécutifs

Voici venu le temps, non pas des rires et des chants, mais celui de s'attaquer à la fameuse structure "4 bitplanes".

C'est assez particulier, mais quand on "revient" en 1985, cette structure porte tout sens quand il s'agit de gérer
de multiples résolutions avec des couleurs faisant référence à une palette, le tout dans un espace mémoire contraint, 
dans notre cas, je le rappelle : environ 32 Ko ce qui est conséquent sur un ordinateur qui ne possède que 520 Ko !

Ces 64 bits, répartis donc sur 4 mots de 16 bits, serviront à représenter 16 pixels consécutifs.

> Fred : "Mais alors, dis moi, par exemple, comment est représenté le premier pixel en haut à gauche, si je le veux en rouge !"

Alors déjà, le "rouge", dans notre palette, c'est la couleur à l'index 9 du tableau. En effet, à cet index on y trouve la définition du rouge en RGB, c'est à dire 0x700.

Il faut donc affecter "9" quelque part en mémoire pour dire "affiche moi du rouge" !

Si jamais cela était nécessaire, 9, en binaire est représenté `1001`.
Le bit le plus à droite est le bit de poids faible. Le bit de plus à gauche est le bit de poids fort.

> Fred : "Mais je le place où ce `1001` pour que mon premier pixel en haut à gauche soit rouge ?"

C'est là que ça se complique, il va falloir que tu répartisses chacun des ces bits sur 4 mots (*word*, 16 bits) différents :

- 1er mot : sur le bit le plus à gauche (donc le bit de poids fort), il faut placer le bit de poids faible qui représente 9, c'est à dire `1`
- 2ème mot : sur le bit le plus à gauche, il faut placer le 2nd bit qui représente 9, c'est à dire `0`
- 3ème mot : sur le bit le plus à gauche toujours, il faut placer le 3ème bit qui représente 9, c'est à dire `0`
- 4ème mot : encore sur le bit le plus à gauche, il faut placer le 4ème et dernier bit qui représente 9, c'est à dire `1`

Ce qui donne pour ces 4 premiers mots le valeurs suivantes, en binaire.

```c
__uint16_t pixels[4] =
    {
        0b1000000000000000,         
        0b0000000000000000,          
        0b0000000000000000,         
        0b1000000000000000 
    };
```

J'ai disposé volontairement les mots les uns en dessous des autres. Regarde la première colonne.
On y voit le nombre `1001` en vertical, sachant que le bit de poids faible de ce nombre est placé
sur le premier mot, et le bit de poids fort sur le second mot.

C'est un peu comme si tu distribuais des cartes à différents joueurs :

- les cartes, ce sont les "bits" de l'index de la couleur dans palette, et les joueurs, ce sont les 4 mots consécutifs.
- les joueurs, ce sont les 4 mots consécutifs.

> Fred : "Ouah mais c'est la galère ! Et comment je fais pour avoir du vert à côté du rouge maintenant ?"

Et bien le vert dans notre palette, c'est la couleur 10, qui se note `1010` en binaire.
On refait donc la même manipulation sur chaque mot, mais cette fois-ci sur chacun des bits situés à 1 décallage à droite du bit de poids fort, ceux qui nous a permis d'indiquer la couleur rouge.

```c
__uint16_t pixels[4] =
    {
        0b1000000000000000,         
        0b0100000000000000,          
        0b0000000000000000,         
        0b1100000000000000 
    };
```

Tu vois, en 2ème colonne, le nombre "1010" est apparu, quand tu lis du haut vers le bas.

Maintenant, si tu veux du bleu sur le 16ème pixel de l'écran ...

> Fred : "Je sais ! Je place `1011`, car c'est la référence du bleu, sur le 16ème bit de mes 4 mots.

```c
__uint16_t pixels[4] =
    {
        0b1000000000000001,         
        0b0100000000000001,          
        0b0000000000000000,         
        0b1100000000000001 
    };
```

> Fred : "En fait, c'est simple mais pour changer 1 pixel, il faut manipuler 4 octets répartis sur 4 mots !"

Oui c'est un peu compliqué, il faut bien l'avouer, c'est l'une des raisons pour laquelle les "sprites" sur Atari ST
ont très souvent une largeur de 16 pixels, car ils se manipulent ainsi d'un seul bloc.

> Fred : "Et si je veux refaire le même motif pour les 16 pixels suivants ?"

Facile : tu copies les 4 mots à une adresse située à 4 mots (64 bits) de décalalage, c'est à dire 8 octets plus loin, et ainsi de suite.

Sur une ligne à l'écran, tu as donc 20 blocs de 16 pixels. Chaque bloc prend 8 octets (64 bits, 4 mots).
Une ligne est donc composée de 160 octets.

Et quand tu sais qu'il y a 200 lignes, cela fait bien 32000 octets pour représenter l'écran. (160 octets x 200 lignes).

> Fred : "Ouahhh, j'ai compris !"

## Mise en pratique en C

Pour cette mise en pratique, j'ai donc installé le compilateur GCC "Cross-Compiler" pour Motorola 68000 sur mon Linux.
Le détail de l'installation est dans [cet article](/m68k-cross-compiling).

En complément j'ai installé [libcmini](https://github.com/freemint/libcmini) qui me permet d'obtenir un exécutable `.TOS` de faible taille sur l'Atari ST.

Voici le code source d'un programme qui illustre tout ce que nous venons de voir.

```c
#include <sys/types.h>
#include <stdio.h>

__uint16_t* videoAddress;

const short LOW_RES = 0;
const short MEDIUM_RES = 1;

__uint16_t savedResolution;
__uint16_t savedPalette[16];

__uint16_t palette[16] =
{
    0x000, 
    0x300,
    0x030,
    0x003,
    0x330,
    0x033,
    0x303,
    0x333,
    0x000,
    0x700,
    0x070,
    0x007,
    0x770,
    0x077,
    0x707,
    0x777
};

// gets color value in the current palette
__uint16_t GetColor(short colorIndex)
{
    return Setcolor(colorIndex, -1);
}

// saves the current palette into a buffer
void SavePalette(__uint16_t* paletteBuffer)
{
    for(int i=0; i < 16; i++)
    {
        paletteBuffer[i] = GetColor(i);
    }
}

// saves the current resolution and its palette
void SaveResolutionAndPalette()
{
    savedResolution = Getrez(); // Get current resolution
    SavePalette(savedPalette); // Save the palette
}

// restores the saved resolution and its palette
void RestoreResolutionAndPalette()
{
    Setscreen(-1,-1, savedResolution);
    Setpalette(&savedPalette);
}

// changes the current resolution
void SetResolution(short resolution)
{
    Setscreen(-1,-1, resolution);
}

// 
void DisplayInfo()
{
    SetResolution(MEDIUM_RES);
    Setcolor(0, 0x000);
    Setcolor(1, 0x777);
    Setcolor(2, 0x700);
    Setcolor(3, 0x070);
    printf("Starting ...\r\n");
    printf("Video Address : %x\r\n", videoAddress);
    printf("Press [ENTER]\r\n");
    getchar();
}

void DisplayScreen()
{
    // pattern : 16 pixels into 4 words
    __uint16_t pixels[4] =
    {
        0b1000000000000001,
        0b0100000000000001,
        0b0000000000000000,
        0b1100000000000001
    };

    // not optimized, but better for comprehension
    // 20 block * 200 lines = 4000 iterations
    for(int i = 0 ; i < 4000 ; i ++)
    {
        short offset = 4 * i;
        videoAddress[offset]     = pixels[0];
        videoAddress[offset + 1] = pixels[1];
        videoAddress[offset + 2] = pixels[2];
        videoAddress[offset + 3] = pixels[3];
    }
}

// demo runs here
int main(int argc, char *argv[])
{
    // inits
    videoAddress = Logbase(); // get the logical pointer of the video RAM
    SaveResolutionAndPalette();
    DisplayInfo();
 
    // demo
    SetResolution(LOW_RES);
    Setpalette(palette);
    DisplayScreen();    
    getchar();

    // restore initial state   
    RestoreResolutionAndPalette();
    return 0;
}
```

Pour le compiler, ce Makefile :

```makefile
CC=m68k-atari-mint-gcc
LIBCMINI=/usr/m68k-atari-mint/libcmini
CFLAGS=-std=gnu99 -I/usr/m68k-atari-mint/include-libcmini -nostdlib $(LIBCMINI)/crt0.o 
LINKFLAGS=-s -L$(LIBCMINI) -lcmini -lgcc
all: clean main

main: 
	$(CC) $(CFLAGS) main.c -o main.tos $(LINKFLAGS)

clean:
	rm -rf *.tos
```

et pour l'exécuter :

```bash
$ make all && hatari main.tos
```

Et on obtient le premier écran d'info (pas très bavard, mais c'est déjà ça) :

![DisplayInfo](/images/atari-st-4-bitplanes/grab0001.png){: .fakescreen}

Puis après avoir appuyé sur la touche `ENTREE` :

![DisplayScreen](/images/atari-st-4-bitplanes/grab0002.png){: .fakescreen}

Avec un petit zoom, sur les 3 premier blocs de 16 pixels (rouge, vert, sur les deux premiers pixels, puis bleu sur le 16ème pixel):

![DisplayScreen](/images/atari-st-4-bitplanes/zoom.png){: .fakescreen}

Puis après avoir appuyé sur la touche `ENTREE` retour au *Desktop* avec la bonne résolution et la bonne palette.

![Retour GEM](/images/atari-st-4-bitplanes/grab0003.png){: .fakescreen}

## Conclusion

Tu vois c'était pas si compliqué.

> Fred : "Mais c'est aussi parce que tu expliques trop bien ..."

Tu vas me faire rougir ! Et tu sais quoi, tout ce que tu viens de comprendre est aussi valable sur ton Amiga, qui, il
me faut l'avouer même si cela m'est difficile, est un peu plus puissant que mon Atari ST sur ce point. En effet, sur ton Amiga, tu peux avoir une palette de 64 couleurs en 320x256 qui utilise 6 bitplanes où 1 pixel est réparti sur 6 mots !

Mais je terminerai cet article par le mot "Atari ST", pour ne pas conclure sur l'Amiga, ce serait un comble.
Mince, encore ...

Atari ST !!!

Voilà, c'est bien comme cela.

## Remerciements

Je tiens, une nouvelle fois, à remercier Vincent Rivière pour la relecture attentive de cet article et pour ses conseils bienveillants.

- Chaine Youtube Vretrocomputing de Vincent Rivière : <https://www.youtube.com/c/Vretrocomputing>
- Page Facebook Vretrocomputing : <https://www.facebook.com/Vretrocomputing/>
