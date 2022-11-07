---
layout: post
title: Le Bootsector d'une disquette THOMSON
subtitle: Ecriture d'un programme sur le Bootsector d'une disquette avec l'aide de Groovy.
logo: thomson-to8.png
category: articles
tags: [Retro, Assembleur, Thomson, TO8, Retro-Prog]
lang: fr
ref: 6809-thomson-to8-bootsector
---

<div class="intro" markdown='1'>

Retour en 1986, Nom de Zeus ! Je vais t'expliquer comment fonctionnait le *bootsector* sur 
les disquettes 3'1/2 double faces, sur THOMSON TO8.

L'objectif : comprendre la structure du *bootsector* pour y déposer un petit programme écrit en
assembleur et qui s'exécutera automatiquement.

</div>
<!--excerpt-->

Si tu sais déjà déjà faire un peu d'assembleur sur THOMSON, et particulièrement le TO8, ce sera
quand même plus simple pour toi pour comprendre cet article.

Tel l'enseignement de Maître Yoda, maitriser l'hexadecimal, tu dois ! Si quand je te dis `$FF` tu ne sais pas que cela
représente un octet où tous les bits sont à 1, et que la valeur décimale est 255, tu vas avoir des difficultés pour saisir
ce qui va suivre.

Comme on utilise des machines modernes pour réaliser des programmes pour des vieilles bécanes, on ne va pas 
se priver et on s'aidera de [Groovy](https://groovy-lang.org) pour réaliser certaines tâches, hors TO8.

C'est parti !

## Petits rappels sur le TO8

Je vais décrire ici brièvement le Thomson TO8 et son fameux processeur 6809.

![Thomson TO8](/images/to8.png)

Les caractéristiques de la bête :

- Processeur Motorola 6809 à 1 MHz (oui, méga-Hertz, pas giga-Hertz !)
- 256 Ko de mémoire extensibles à 512 Ko
- Résolutions :
  - 320 x 200 en 16 couleurs, avec contrainte (2 couleurs tous les 8 pixels, par ligne)
  - 160 x 200 en 16 couleurs, sans contrainte (le fameux mode Bitmap 16 ou BM16 pour les intimes)
  - 320 x 200 en 4 couleurs, sans contrainte
  - 640 x 200 en 2 couleurs, sans contrainte

Bref, encore, un truc de dingue !

Au niveau du processeur :

- registres "accumulators" (données) : `A` et `B`, 8 bits chacun. `D` étant la combinaison 16 bits de A et B
- registres "pointers" (adresses) : `X` et `Y` sur 16 bits
- registres de pile : `U` (User stack) et `S` (System stack) sur 16 bits chacun
- registre "Program Counter" : `PC` sur 16 bits
- registre `DP` (Direct Page) et `CC` (Condition Code) sur 8 bits chacun.

Et c'est tout ... mais surtout plein de secrets cachés et aujourd'hui je vais donc traiter du **bootsector** !

## Pourquoi tripoter un TO8 en 2022 ?

Etrangement, le fonctionnement interne des ordinateurs n'est plus vraiment enseigné en écoles supérieures aujourd'hui. Pas besoin de préciser que je trouve cela dommage. Oui il y aura des écoles avec des exceptions, où cela sera vu, mais c'est assez anecdotique. Le langage de plus bas niveau souvent enseigné est le C, ce qui masque énormément de concepts n'en déplaisent à ceux qui pensent dejà faire des choses de très bas niveau en C.

En ce sens, je pense qu'il est ainsi important de reprendre les fondamentaux. Nostalgiquement, [parce que j'ai pu en profiter dans mon jeune age](/about), je pense que les ordinateurs THOMSON (et ceux de leur génération, 8 bits, voire 16 bits) sont de formidables outils de compréhension : il n'existe pas de barrière entre le code programmé et la machine (processeur et composants) qui l'exécute.

L'avantage des THOMSON, c'est que l'on en trouve encore à des prix abordables, d'occasion évidemment (80 € pour un MO5, 150 € pour un TO8, grosso-modo) et que graĉe à leur sortie PERITEL, ils peuvent encore se brancher sur des écrans et TV actuelles.

Enfin, il existe des émulateurs gratuits, tels que DCMOTO, TEO, THEODORE, THEODORE-WIDE-DOT qui fonctionnent sur de nombreuses plateformes.

Je vous conseille donc de faire un tour sur le site de Daniel Coulom : <http://dcmoto.free.fr/> ou encore de récupérer notre *fork* de THEODORE qui inclut quelques fonctionnalités supplémentaires et qui est un *CORE* pour RETROARCH : <https://github.com/wide-dot/theodore>. Personnellement je me sers de notre fork sur LINUX AMD64 et sur RASPBERRY avec RETROPIE. Pour du debugging je me sers de DCMOTO avec Wine, toujours sous LINUX, car le DEBUGGER est très pratique.

## Quel intérêt de faire un Bootsector sur TO8 ?

Question simple, réponses simples :

- parce que c'est fun !
- **pour se passer du BASIC et de son occupation de la mémoire.**

C'est un peu abrupte comme réponse, mais je vais étayer un peu plus.

Après l'appui sur la touche `1` ou `B` dans le cas du BASIC 512 ou `2` ou `C` dans le cas du BASIC 1.0,
le TO8 va : 

1. lire automatiquement le boosector sur la disquette si elle est présente, 
2. le charger en mémoire à l'adresse `$6200`
3. l'exécuter après avoir effectuer quelques vérifications (signature, somme de contrôle).

Si le bootsector ne contient pas de programme particulier, le BASIC qui est présent en ROM, est lancé et s'initialise.

Enfin si l'utilisateur a appuyé sur `B` ou `C` le BASIC, alors initialisé, va tenter de charger le fichier `AUTO.BAT` sur la première face (face `0`) de la disquette pour l'exécuter. 

Si le programme du bootsector n'a pas besoin du BASIC, ce qui va être le cas de nombreux programmes et jeux écrits exclusivement en assembleur, alors il aura la "main" dès le chargement. Le BASIC ne sera pas exécuté, et donc toute la mémoire sera disponible pour notre programme.

En pratique, on pourra utiliser la mémoire à partir de l'adresse `$6300`,voire `$6280` pour ne perdre aucun octet, ou encore même `$6000` ou `$6100` si l'on décide de se passer des routines offertes respectivement par le moniteur et l'extra-moniteur, mais attention à ne pas écraser le code du bootsector qui est en train de s'exécuter en `$6100 + PC`!

> "Le moniteur", l'écran ?

Le moniteur, dans le jargon THOMSON, c'est une bibliothèque de routines et de données, implantées en ROM qui nous facilite la tâche : écrire des caractères à l'écran, lire ou écrire des données sur une disquette, interroger le clavier, changer de résolution, produire du son, etc.

Sur le TO8, nous avons aussi l'extra-moniteur : une bibliothèque de routines supplémentaires (fonctions mathématiques, graphismes "évolués", etc.).

## Le Bootsector

### Structure d'une disquette 3 pouces 1/2

Petit rappel sur les disquettes :

![FloppyDisk](/images/6809-thomson-to8-bootsector/floppy-disk-structure.png)

En ce qui concerne la structure des disquettes doubles faces, double densité, qui équipent le TO8 :
- les faces sont numérotées de 0 à 1, 
- les pistes de 0 à 79, 
- les secteurs de 1 à 16. Tu peux remarquer que ce n'est pas numéroté de 0 à 15, étrangement.
  
Etant donné qu'un secteur contient 256 octets : 256 octets x 16 secteurs x 80 pistes = 327 680 octets.
**Une face contient grosso modo 320 Ko.**

Le *bootsector* est situé sur la **face 0, piste 0, secteur 1**. Pour simplifier c'est le tout premier secteur de la disquette, composé de 256 octets.

### Cinématique et structure du bootsector

A partir du menu d'accueil du TO8, si on appuie sur `1` ou `B` ou `2` ou `C`, le TO8 va aller récupérer les 256 octets contenus dans *bootsector* sur la disquette, les placer à l'adresse figée `$6200` et enfin exécuter le programme à cette adresse via un `JSR`.

On peut donc y placer du code exécutable, tant que code compilé ne dépasse pas 248 octets. (255 - 8 : tu verras plus loin pourquoi on a 8 octets en moins).

Ca parait simple vue ainsi, mais le code écrit dans le *bootsector* doit subir quelques modifications par rapport à un programme BINAIRE classique afin d'être exécuté par le TO8 :



| Offset(s) | Contenu |  Remarque(s)|
|-----------|---------|-------------|
| 0 à 119   | le code compilé au format RAW | Chaque octet doit être transformé par son *complément à deux*. Si le code BIN est plus petit que 120 octets, le reste doit être mis à `$00` |
| 120 à 125 | une signature notée en hexadécimal `42 41 53 49 43 32` | ce qui représente `BASIC2` en ASCII. |
| 126       | `$00`   | Octet fixe à zéro
| 127       | Checksum | checksum de la partie RAW entre les offsets 0 et 119 + checksum de la partie signature. Voir détails plus loin |
| 128 à 255 | code RAW ou DATA ou des `$00` | format classique sans complément à deux.

### Le complément à deux, qu'est-ce que c'est ?

En gros, c'est une transformation souvent utilisée en informatique. Dans notre cas elle permet de transformer un octet en un autre et de pouvoir retrouver l'octet d'origine. La transformation est bijective.

Pour le calculer c'est très simple : `256 - a = b`, où `a` est l'octet d'origine et `b` son complément à deux.

Pour retrouver b, c'est simple, niveau 5ème je pense : `256 - b = a`, et bim ! On retrouve b avec a sachant que c'est son complément à deux.

Dans les faits, pour calculer le complément à deux d'un octet, on inverse tous les bits et on ajoute 1. En Java, ça donnera `data = ~data + 1` (*data* est l'octet à transformer, l'opérateur `~` inverse les bits et `+1` ajoute 1).

### Digression : pourquoi le format "RAW" et pas "BIN" ?

Ce paragraphe est un peu "hors-sujet", mais si vous vous posiez la question de la différence entre un fichier `RAW` et un fichier `BIN`, je ne résiste pas à fournir quelques éléments.

Le format RAW, comme son nom l'indique est un format brut, sans entête, sans marqueur final. 

Le format BIN est un peu plus évolué : il peut contenir plusieurs portions binaires (programmes, données, graphismes, etc.) implantées à différentes adresses dans un seul fichier. Le format BIN contient donc, en plus des données binaires, des informations sur la longueur en octets et l'adresse d'implantation de la portion.

Voici le contenu d'un format BIN :

```
00  ([XX XX] [XX XX] [XX XX XX XX XX ...]) * N) 00 00 00 00
HDR   SIZE    ADDR    DATA                      TRAILER
```

- HDR : ENTETE, premier octet à zéro
- SIZE : TAILLE,  entier sur 16 bits représentant la taille de la portion binaire à lire.
- ADDR : ADRESSE IMPLANTATION, entier sur 16 bits représentant l'adresse d'écriture de la portion de DATA.
- DATA : suites d'octets (programme OPCODES ou données)
- TRAILER : la fin du fichier, `00 00 00 00`, signifie donc "taille 0, adresse d'implantation $0000, et donc qu'il n'y a plus aucune portion à implanter en mémoire. Certains disent que `00 00 00 00` est le *trailer* d'un fichier BIN, c'est en fait l'entête d'une portion qui indique qu'elle est de taille zéro (et que le fichier est terminé)

Un ensemble "SIZE, ADDR, DATA" peut se répeter plusieurs fois (N), jusqu'à tomber sur le *trailer*.   

Pour résumer :

- un fichier BIN est une concaténation de plusieurs "portions" binaires, de diverses tailles, qui pourront être implantées en mémoire à des adresses différentes.
- le format RAW, n'a qu'une seule portion : les DATA qui peuvent évidemment être des instructions, sans indication de taille ni d'adresse d'implantation en mémoire. Il est donc beaucoup plus simple à lire.

### Et la checksum alors ?

C'est la partie la plus tordue, ou rigolote, au choix. Accrochez-vous !

> Rappelons, juste au cas où, qu'une checksum est généralement la simple addition d'une suite d'octets, c'est le cas ici.

La checksum est répresentée par un entier court, souvent un octet d'ailleurs, même si la somme réelle
est bien plus grande : on reste ainsi dans les valeurs comprises entre 0 et 255. Cela permet de faire généralement un contrôle
d'intégrité pour vérifier que le code n'a pas été altéré, volontairement ou non.

Pour calculer la checksum, il faut :

1. initialiser la checksum avec la valeur `$55`. Pourquoi ? Parce que ! En binaire ça fait une alternance de 0 et de 1 : `$55` == `01010101` ce qui est intéressant comme base de départ pour une checksum.
2. l'additionner avec la checksum de la signature. Cette checksum est obtenue en additionnant le complément à deux de chacun des octets de la signature, et non pas ses octets initiaux. Comme le contenu de la signature est fixé, le calcul de la checksum de la signature ne varie pas. On écrira donc le résultat directement puisque des gens gentils l'ont calculés bien avant nous :`$6C`. Cependant si, tu as envie, celui-ci aurait pû être calculé dynamiquement
3. l'additioner avec la checksum de **l'ensemble des octets d'origines** situés entre 0 et 129. Pour ce calcul, on ne prend pas en compte le complément à deux de chacun des octets.

Pour résumer : `checksum = $55 + $6C + checksum_signature + check_sum_first_part`

> C'est marrant ça, pour le calcul du checksum de la signature, on a pris le complément à deux et les octets sont pourtant écrits 
> tels quels, alors que pour les octets de 0 à 129, on calcule la checksum sur les octets d'origine alors qu'au final 
> les compléments à deux seront dans le bootsector. C'est rigolo, voire tordu.
> Et ça sert à quoi dans notre cas ?

Je n'ai pas une réponse certaine à ce sujet. A mon avis, c'est volontaire, pour rendre complexe le contenu d'un *bootsector*,
afin que n'importe-qui, capable de faire un peu d'assembleur, ne puisse aller le modifier aisément. C'est une sorte de petite 
protection, sachant qu'il n'y a pas de documentation à ce sujet. On peut considérer que c'est une sorte d'obfuscation de code.

Le seul moyen pour comprendre le fonctionnement est de désassembler les instructions en ROM qui chargent le *bootsector* en mémoire et lance son exécution : ce n'est pas à la portée de n'importe qui, à l'époque, sans internet.

Maintenant qu'on sait tout cela, tu vas pouvoir coder ton programme ... avec quelques petites restrictions à cause de la zone mémoire utilisée : en effet, le "moniteur", que l'on utilise pour écrire des caractères à l'écran, utilise une partie de la plage d'adresse à partir de `$6200` pour y stocker ses variables. Si on appelle le moniteur et la routine `PUTC` depuis notre code implanté en `$6200` celui-ci va être écrasé, en partie, par ces variables ce qui provoquera une belle erreur d'exécution.

La bonne idée est donc de faire le minimum dans le code du bootsector, mais un minimum intelligent :

1. charger le contenu du N secteurs situés après le bootsector (donc secteur 2, 3, 4 etc.)
2. implanter le contenu de ces secteurs à partir `$6300` (donc 256 octets après `$6200`, si tu suis bien)
3. JSR en `$6300`, parce qu'on a envie de le lancer notre programme !

## Réalisation d'un bootsector 

### Le code assembleur 6809

L'objectif du code du bootsector est donc de charger N secteurs à partir du secteur 2 inclus et les déposer à partir de l'adresse `$6300`.
Ces éléments seront indiqués avec des *EQUATE*, ce sont des "paramètres" du programme qui pourront varier en fonction des besoins

```
START_SECTOR    EQU $02          ** premier secteur à lire, ici 2 
NB_READ_SECTORS EQU $04          ** nombre de secteurs, ici on lit 4 secteurs = 1 Ko (4x256 octets)
TARGET_ADDR     EQU $6300        ** adresse d'implantation
```

Pour lire les secteurs, nous allons utiliser les routines du moniteur pour cette action.

> Mais ? Tu avais dit que le moniteur utilisait la zone mémoire $6200, on peut donc pas l'utiliser  car ça risque de recouvrir la zone
> occupée par le programme du bootsector !

Par chance, si ! Les routines de lecture de données du lecteur de disquette n'impactent pas cette zone !
On peut donc l'utiliser sans problème ! Sauvés !



`bootsector.asm`
```
*****************************************************
* BOOTLOADER
*
* Charge N secteurs à partir du secteur 2 de la première
* piste du lecteur en cours à une adresse d'implantation
* définie par l'equate TARGET_ADDR.
*
* Voir les equates pour les paramètres.
*
* Auteur: F.X. Robin, fév. 2022
* Inspiré par "bootbloc" de Samuel Devulder Mars 2012
*****************************************************

** EQUATES PARAMETRES -------------------------------
START_SECTOR    EQU $02          ** premier secteur à lire, ici 2 
NB_READ_SECTORS EQU $04          ** nombre de secteurs, ici on lit 4 secteurs = 1 Ko (4x256 octets)
TARGET_ADDR     EQU $6300        ** adresse d'implantation

** EQUATES ROUTINES et REGISTRES ----------------------------------------------------------------------------
DKCO                   EQU $E82A ** routine pour les opérations avec la disquette
REG_TARGET_ADDR        EQU $604F ** registre pour définir l'adresse de réception des données 
REG_DISKOP             EQU $6048 ** registre pour définir l'opération sur la disquette (lecture, écriture)
REG_SECTOR             EQU $604C ** registre pour définir le secteur sur lequel effectuer l'opération
DISKOP_SECT_READ       EQU $02   ** equate pour l'opération de lecture, à utiliser sur le registre REG_DISKOP
** ----------------------------------------------------------------------------------------------------------

        ORG     $6200                   * adresse d'implantation du bootsector, ne peut pas être modifié
        SETDP   $60                     

BEGIN    
        LDA #$60                        * pour réduire la taille du binaire générer, on utiliser des adresses
        TFR A,DP                        * avec DP fixé en $60

        LDS #$A000                      * position de la stack S, A000 n'est pas inclus.

        LDX     #TARGET_ADDR            * addresse d'implantation des données
        STX     <REG_TARGET_ADDR        * on force l'adressage sur 1 octet, car DP est fixé sur $60 

        LDA     #DISKOP_SECT_READ       * opération de lecture        
        STA     <REG_DISKOP             * on force l'adressage sur 1 octet, car DP est fixé sur $60

        LDB     #START_SECTOR
        STB     <REG_SECTOR             * on force l'adressage sur 1 octet, car DP est fixé sur $60
        LDA     #NB_READ_SECTORS        * A est notre compteur qui va décrémenter.

* READ_SECTOR_LOOP                
!       JSR     DKCO                    * charge le secteur
        BCS     END                     * test le carry flag si une erreur est survenue, si oui, on quitte
        INC     <REG_TARGET_ADDR        * 256 bytes suivants pour l'adresse du buffer. On incrémente l'octet de poids fort de l'adresse 6300 devient 6400, etc.
        INC     <REG_SECTOR             * incrémentation du secteur lu
        DECA                            * décrémentation de A
        BNE     <                       * on boucle si on a pas tout lu    
        JSR     TARGET_ADDR             * tout est chargé, on branche à l'adresse d'implantation définie par TARGET_ADDR
!      
END     JMP [$FFFE]                     * reset TO8 si jamais on arrive à cette ligne c'est que qqch s'est mal passé :)
```

On compile ce programme avec lwasm :

```bash
$ lwasm --6809 --raw bootsector.asm --output=bootsector.raw --list=bootsector.lst
```

Après la compilation, on peut le code brut généré :

```
                      (   bootsector.asm):00027                 ORG     $6200                   * adresse d'implantation du bootsector, ne peut pas être modifié
     60               (   bootsector.asm):00028                 SETDP   $60                     
                      (   bootsector.asm):00029         
6200                  (   bootsector.asm):00030         BEGIN    
6200 8660             (   bootsector.asm):00031                 LDA #$60                        * pour réduire la taille du binaire générer, on utiliser des adresses
6202 1F8B             (   bootsector.asm):00032                 TFR A,DP                        * avec DP fixé en $60
                      (   bootsector.asm):00033         
6204 10CEA000         (   bootsector.asm):00034                 LDS #$A000                      * position de la stack S, A000 n'est pas inclus.
                      (   bootsector.asm):00035         
6208 8E6300           (   bootsector.asm):00036                 LDX     #TARGET_ADDR            * addresse d'implantation des données
620B 9F4F             (   bootsector.asm):00037                 STX     <REG_TARGET_ADDR        * on force l'adressage sur 1 octet, car DP est fixé sur $60 
                      (   bootsector.asm):00038         
620D 8602             (   bootsector.asm):00039                 LDA     #DISKOP_SECT_READ       * opération de lecture        
620F 9748             (   bootsector.asm):00040                 STA     <REG_DISKOP             * on force l'adressage sur 1 octet, car DP est fixé sur $60
                      (   bootsector.asm):00041         
6211 C602             (   bootsector.asm):00042                 LDB     #START_SECTOR
6213 D74C             (   bootsector.asm):00043                 STB     <REG_SECTOR             * on force l'adressage sur 1 octet, car DP est fixé sur $60
6215 8604             (   bootsector.asm):00044                 LDA     #NB_READ_SECTORS        * A est notre compteur qui va décrémenter.
                      (   bootsector.asm):00045         
                      (   bootsector.asm):00046         * READ_SECTOR_LOOP                
6217 BDE82A           (   bootsector.asm):00047         !       JSR     DKCO                    * charge le secteur
621A 250A             (   bootsector.asm):00048                 BCS     END                     * test le carry flag si une erreur est survenue, si oui, on quitte
621C 0C4F             (   bootsector.asm):00049                 INC     <REG_TARGET_ADDR        * 256 bytes suivants pour l'adresse du buffer. On incrémente l'octet de poids fort de l'adresse 6300 devient 6400, etc.
621E 0C4C             (   bootsector.asm):00050                 INC     <REG_SECTOR             * incrémentation du secteur lu
6220 4A               (   bootsector.asm):00051                 DECA                            * décrémentation de A
6221 26F4             (   bootsector.asm):00052                 BNE     <                       * on boucle si on a pas tout lu    
6223 BD6300           (   bootsector.asm):00053                 JSR     TARGET_ADDR             * tout est chargé, on branche à l'adresse d'implantation définie par TARGET_ADDR
                      (   bootsector.asm):00054         !      
6226 6E9FFFFE         (   bootsector.asm):00055         END     JMP [$FFFE]                     * reset TO8 si jamais on arrive à cette ligne c'est que qqch s'est mal passé :)
```

et en binaire "pure", ça donne donc ceci :

```bash
$ hexdump -C bootsector.raw
00000000  86 60 1f 8b 10 ce a0 00  8e 63 00 9f 4f 86 02 97  |.`.......c..O...|
00000010  48 c6 02 d7 4c 86 04 bd  e8 2a 25 0a 0c 4f 0c 4c  |H...L....*%..O.L|
00000020  4a 26 f4 bd 63 00 6e 9f  ff fe                    |J&..c.n...|
``` 

Le fichier généré ne fait que 42 octets, ce qui tiendra sans problème dans les 120 "offerts" par le bootsector avant la signature.

### Transformation en complément à 2

Tous les octets de notre programmes doivent être tranformés en leur complément à 2, comme précisé précédemment.

Pour ce faire je vais écrire un petit script Groovy en Java. Oui, Java possède aussi la capacité de faire du scripting, notamment grâce à groovy ! Il n'y a pas que Python dans la vie, il y a Java aussi.

Pour installer Groovy, j'ai d'abord installé [SDKMan](https://sdkman.io/install) puis la commande `$ sdk install groovy`.
En 2 lignes de commande, j'ai un langage de scripting très évolué, proche de Java.

script : `convert.groovy`

```groovy
import java.nio.file.*

def bootSectorFileName = args[0]
def bootSectorConverted = args[1]
println "Converting $bootSectorFileName into $bootSectorConverted (2 complement)"

def bootsectorRaw = Paths.get(bootSectorFileName).bytes
printf "INPUT    : %s (%s) %n", bootsectorRaw.encodeHex().toString().toUpperCase(),bootSectorFileName
byte checksum = 0x55
bootsectorRaw.eachWithIndex{data,i -> bootsectorRaw[i] = ~data + 1
                                      checksum += data }
printf "OUTPUT   : %s (%s) %n", bootsectorRaw.encodeHex().toString().toUpperCase(),bootSectorConverted
printf "CHECKSUM : %02X %n",checksum
println "LENGTH   : $bootsectorRaw.length bytes"
Paths.get(bootSectorConverted).bytes = bootsectorRaw
println "Converted file ($bootSectorConverted) is written."
```

> Ça a l'air bien sympa Groovy !

Il suffit ensuite de lancer le convertisseur sur le fichier `bootsector.raw` en spécifiant le fichier de sortie `bootsector.conv`

```bash
$ groovy convert.groovy bootsector.raw bootsector.conv
Converting bootsector.raw into bootsector.conv (2 complement)
INPUT    : 86601F8B10CEA0008E63009F4F86029748C602D74C8604BDE82A250A0C4F0C4C4A26F4BD63006E9FFFFE (bootsector.raw) 
OUTPUT   : 7AA0E175F0326000729D0061B17AFE69B83AFE29B47AFC4318D6DBF6F4B1F4B4B6DA0C439D0092610102 (bootsector.conv) 
CHECKSUM : 5D 
LENGTH   : 42 bytes
Converted file (bootsector.conv) is written.
```

Et voici le fichier `bootsector.conv` obtenu :

```bash
$ hexdump -C bootsector.conv 
00000000  7a a0 e1 75 f0 32 60 00  72 9d 00 61 b1 7a fe 69  |z..u.2`.r..a.z.i|
00000010  b8 3a fe 29 b4 7a fc 43  18 d6 db f6 f4 b1 f4 b4  |.:.).z.C........|
00000020  b6 da 0c 43 9d 00 92 61  01 02                    |...C...a..|
```
### Finalisation des 256 octets du bootsector

Afin d'obtenir le boosector complet, il faut donc rajouter au fichier `bootsector.conv`:

1. la signature `BASIC2` à l'offset 120
2. la checksum additionnée à la checksum de la signature (`$6C`) à l'offet 127

Je vais encore réaliser ceci avec un autre script GROOVY :

```java
import java.nio.file.*

// Usage exemple : groovy create-full-bootsector.groovy bootsector.conv fullbootsector.raw 5D
//
// note : 5D est le report en hexadécimal de la checksum retournée par le script "convert.groovy"

def convertedBootSectorFileName = args[0] 
def fullBootSectorFileName = args[1]
def checkSum = args[2].decodeHex()[0]

println "Creating full bootsector, input : $convertedBootSectorFileName, $fullBootSectorFileName, ${String.format('%02X',checkSum)}"

// creation du bootsector vierge
byte[] fullBootSector = new byte[256]

// lecture du code du bootsector préalablement converti en complément à deux.
def bootsectorConv = Paths.get(convertedBootSectorFileName).bytes

// copie des octets du code du bootsector
System.arraycopy(bootsectorConv,0,fullBootSector,0, bootsectorConv.length)

// insertion de la signature dans le bootsector à l'offset 120
byte[] signature = "BASIC2".bytes // signature : "BASIC2"
System.arraycopy(signature,0,fullBootSector,120, signature.length)

// ajout de la checksum de la partie programme, passée en paramètre à la checksum de la signature 0x6C
// le tout à l'offset 127
fullBootSector[127] = checkSum + 0x6C

// le bootsector complet est finalisé en mémoire, on l'écrit dans le fichier passé en paramètre.
// Groovy nous aide bien pour cette tâche ici !
Paths.get(fullBootSectorFileName).bytes = fullBootSector

println "Ok, CHECKSUM = ${String.format('%02X', fullBootSector[127])}"
```

et je le lance :

```bash
$ groovy create-full-bootsector.groovy bootsector.conv fullbootsector.raw 5D
Creating full bootsector, input : bootsector.conv, fullbootsector.raw, 5D
Ok, CHECKSUM = C9
```

et voici le contenu du fichier `fullbootsector.raw` qui vient d'être créé :

```bash
$ hexdump -C fullbootsector.raw 
00000000  7a a0 e1 75 f0 32 60 00  72 9d 00 61 b1 7a fe 69  |z..u.2`.r..a.z.i|
00000010  b8 3a fe 29 b4 7a fc 43  18 d6 db f6 f4 b1 f4 b4  |.:.).z.C........|
00000020  b6 da 0c 43 9d 00 92 61  01 02 00 00 00 00 00 00  |...C...a........|
00000030  00 00 00 00 00 00 00 00  00 00 00 00 00 00 00 00  |................|
*
00000070  00 00 00 00 00 00 00 00  42 41 53 49 43 32 00 c9  |........BASIC2..|
00000080  00 00 00 00 00 00 00 00  00 00 00 00 00 00 00 00  |................|
*
00000100
```

La signature `BASIC2` a bien été insérée à l'offset 120 ainsi que la checksum `C9` à l'offset 127.
La suite du bootsector est tout à zéro.

Le bootsector est maintenant complet. Passons au "véritable" petit programme qu'il chargera et lancera.

## Réalisation du Programme lancé par le bootsector

Grosse inspiration, je vais faire un petit "Hello world!" évolué en hommage au film *[WarGames](https://en.wikipedia.org/wiki/WarGames)*.

```
*************************************************************
* EQUATES
*************************************************************
GETCH         EQU $E806	  * routine getchar
KEY_ENTER     EQU $0D 	  * touche entrée
PUTC          EQU $E803   * routine PUTC
SET_PALETTE   EQU $EC00   * routine setpalette 
*************************************************************

    ORG $6300

DEBUT 
    PULU Y,X,A

    * reglage palette couleur 1 sur CYAN (FF0)
    LDA #$01
    LDX #$FFF0
    LDY #$0FF0
    JSR SET_PALETTE

    * initialisation de l'affichage
    LDX #INIT
    BSR PRINT_STRING

    * affichage du texte
    LDX #MESSAGE
    BSR PRINT_STRING_WITH_EFFECT

    * attente clavier
    BSR KEY_ECHO 

    PULU A,X,Y
FIN    
    JMP [$FFFE]     * reset TO8


********************************************************
* Routine : PRINT_STRING
* Affichage d'une chaine de caractères
* X contient l'adresse de la chaine, terminée par un $00
* Usage : LDX #STRING
*         BSR PRINT_STRING
********************************************************
PRINT_STRING
    PSHU B
!                   * debut de boucle
    LDB ,X+         
    BEQ >           * si c'est 0 on sort de la boucle
    JSR PUTC

    CMPB #$0A       * si c'est retour chariot, on rajoute retour à la ligne.
    BNE <           * sinon on itère une nouvelle fois  
    LDB #$0D
    JSR PUTC
    BRA <
!                  * fin de boucle      
    PULU B
    RTS
********************************************************  

PRINT_STRING_WITH_EFFECT
    PSHU B
!                   * debut de boucle
    
WAIT_VBL_00                
    TST $E7E7              * le faisceau n'est pas dans l'ecran
    BPL WAIT_VBL_00        * tant que le bit est a 0 on boucle
WAIT_VBL_01
    TST $E7E7              * le faisceau est dans l'ecran
    BMI WAIT_VBL_01        * tant que le bit est a 1 on boucle

    LDB #$7F    * curseur carré
    JSR PUTC    
    LDB #$07    * BEEP
    JSR PUTC
    LDB #$08    * on revient un cran en arrière (pour l'écraser par la suite)
    JSR PUTC  
    LDB #$20    * on efface le curseur avec un espace
    JSR PUTC
    LDB #$08    * on revient un cran en arrière 
    JSR PUTC
        
    LDB ,X+         * on charge le caractère à afficher       
    BEQ >           * si c'est 0 on sort de la boucle
    JSR PUTC



    CMPB #$0A       * si c'est retour chariot, on rajoute retour à la ligne.
    BNE <           * sinon on itère une nouvelle fois  
    LDB #$0D
    JSR PUTC
    BRA <
!                  * fin de boucle      
    PULU B
    RTS
********************************************************  


********************************************************
* Routine : KEY_ECHO
* Affiche un curseur et toutes les touches saisie
* jusqu'à ce que le code KEY (equate) soit rencontré
* Usage : BSR KEY_ECHO
********************************************************
KEY_ECHO  
    PSHU B
!
    LDB #$7F    * curseur carré
    JSR PUTC    
    LDB #$08    * on revient un cran en arrière (pour l'écraser par la suite)
    JSR PUTC  
    JSR GETCH   * on attend une touche saisie B contient le caractère tapé
    CMPB #KEY_ENTER    * est-ce le caractère de sortie ?
    BEQ >      
    JSR PUTC    * on l'affiche si ce n'était pas le caractère de sortie        
    BRA <
!  
    PULU B
    RTS  
********************************************************


**************************************************************************************
* DATA
**************************************************************************************
INIT
    FCB $1B,$5B                  * passage en mode 80 colonnes. Oui PUTC peut faire ça
    FCB $1B,$41,$1B,$50,$1B,$60  * screen 1,0,0
    FCB $11,$0C,$00              * effacement du curseur, effacement de l'écran 
**************************************************************************************    

**************************************************************************************    
MESSAGE                         
    INCLUDEBIN "message.raw"     * volontairement le message est en binaire
                                 * histoire d'avoir une petite surprise
    END   
```

et le fichier `message.raw` :

```
$ hexdump -C message.raw
00000000  5b 43 50 45 31 37 30 34  54 4b 53 5d 0a 0a 47 52  |[CPE1704TKS]..GR|
00000010  45 45 54 49 4e 47 53 20  50 52 4f 46 45 53 53 4f  |EETINGS PROFESSO|
00000020  52 20 46 41 4c 4b 45 4e  0a 0a 3e 20 48 45 4c 4c  |R FALKEN..> HELL|
00000030  4f 0a 0a 41 20 53 54 52  41 4e 47 45 20 47 41 4d  |O..A STRANGE GAM|
00000040  45 2e 0a 54 48 45 20 4f  4e 4c 59 20 57 49 4e 4e  |E..THE ONLY WINN|
00000050  49 4e 47 20 4d 4f 56 45  20 49 53 0a 4e 4f 54 20  |ING MOVE IS.NOT |
00000060  54 4f 20 50 4c 41 59 2e  0a 0a 48 4f 57 20 41 42  |TO PLAY...HOW AB|
00000070  4f 55 54 20 41 20 4e 49  43 45 20 47 41 4d 45 20  |OUT A NICE GAME |
00000080  4f 46 20 43 48 45 53 53  3f 0a 0a 3e 20 00        |OF CHESS?..> .|
```

On le compile en mode RAW (effectivement le format BIN ne convient pas, car le progamme sera directement placé secteur 2 et 3).

```bash
$ lwasm --6809 --raw bootprog.asm --output=bootprog.raw --list=bootprog.lst
```

et on obtient le fichier `bootprog.raw` :

```bash
$ hexdump -C bootprog.raw 
00000000  37 32 86 01 8e ff f0 10  8e 0f f0 bd ec 00 8e 63  |72.............c|
00000010  8c 8d 0d 8e 63 97 8d 1f  8d 57 37 32 6e 9f ff fe  |....c....W72n...|
00000020  36 04 e6 80 27 0e bd e8  03 c1 0a 26 f5 c6 0d bd  |6...'......&....|
00000030  e8 03 20 ee 37 04 39 36  04 7d e7 e7 2a fb 7d e7  |.. .7.96.}..*.}.|
00000040  e7 2b fb c6 7f bd e8 03  c6 07 bd e8 03 c6 08 bd  |.+..............|
00000050  e8 03 c6 20 bd e8 03 c6  08 bd e8 03 e6 80 27 0e  |... ..........'.|
00000060  bd e8 03 c1 0a 26 d2 c6  0d bd e8 03 20 cb 37 04  |.....&...... .7.|
00000070  39 36 04 c6 7f bd e8 03  c6 08 bd e8 03 bd e8 06  |96..............|
00000080  c1 0d 27 05 bd e8 03 20  ea 37 04 39 1b 5b 1b 41  |..'.... .7.9.[.A|
00000090  1b 50 1b 60 11 0c 00 5b  43 50 45 31 37 30 34 54  |.P.`...[CPE1704T|
000000a0  4b 53 5d 0a 0a 47 52 45  45 54 49 4e 47 53 20 50  |KS]..GREETINGS P|
000000b0  52 4f 46 45 53 53 4f 52  20 46 41 4c 4b 45 4e 0a  |ROFESSOR FALKEN.|
000000c0  0a 3e 20 48 45 4c 4c 4f  0a 0a 41 20 53 54 52 41  |.> HELLO..A STRA|
000000d0  4e 47 45 20 47 41 4d 45  2e 0a 54 48 45 20 4f 4e  |NGE GAME..THE ON|
000000e0  4c 59 20 57 49 4e 4e 49  4e 47 20 4d 4f 56 45 20  |LY WINNING MOVE |
000000f0  49 53 0a 4e 4f 54 20 54  4f 20 50 4c 41 59 2e 0a  |IS.NOT TO PLAY..|
00000100  0a 48 4f 57 20 41 42 4f  55 54 20 41 20 4e 49 43  |.HOW ABOUT A NIC|
00000110  45 20 47 41 4d 45 20 4f  46 20 43 48 45 53 53 3f  |E GAME OF CHESS?|
00000120  0a 0a 3e 20 00                                    |..> .|
```



## Génération d'une image de disquette

Il s'agit maintenant de mettre tout cela sur une image de disquette `.fd` que saura lire un émulateur comme DCMOTO ou THEODORE.

Une image `.fd` c'est tout simplement 2 faces de 80 pistes composées de 16 secteurs chacunes, chaque secteur faisant 256 octets.

L'idée est de realiser un petit script en Groovy, car on l'aime beaucoup maintenant ce petit langage de scripting, qui :

1. prend le nom du fichier du programme *bootsecteur* converti en complément à deux, et le placer secteur 1 de la piste 0 de la face 0
2. prend le nom du fichier du programme réel, lancé par le programme *bootsector*, et le placer secteur 2 et 3 de la piste 0 de face 0
3. prend le nom du fichier `.fd` à générer.

Voici ce script :

```java
import java.nio.file.*

// Usage exemple : groovy create-disk.groovy fullbootsector.raw bootprog.raw boot-demo.fd

def fullBootSectorFileName = args[0]
def realProgramFileName = args[1]
def fdImageFileName = args[2]

println "Creating FD Image. Input : $fullBootSectorFileName, $realProgramFileName, $fdImageFileName"

// creation du bootsector vierge
def DISK_SIZE = 2 * 80 * 16 * 256
byte[] fdImage = new byte[DISK_SIZE]

// lecture du code du bootsector préalablement converti en complément à deux.
def fullBootSector = Paths.get(fullBootSectorFileName).bytes
def realProgram = Paths.get(realProgramFileName).bytes

print "Copying bootsector code ..... "
System.arraycopy(fullBootSector,0,fdImage,0, fullBootSector.length) // premier secteur == Offset 0
println "[OK]"

print "Copying real program code ... "
System.arraycopy(realProgram,0,fdImage,256, realProgram.length)  // 2ème secteur == Offset 256
println "[OK]"

// L'image FD est terminée, on l'écrit, Groovy nous aide bien pour cette tâche ici !
Paths.get(fdImageFileName).bytes = fdImage

println "Ok, FD image generated! You can run it with your prefered emulator."
```

Lancement du script :

```bash
$ groovy create-disk.groovy fullbootsector.raw bootprog.raw boot-demo.fd
Creating FD Image. Input : fullbootsector.raw, bootprog.raw, boot-demo.fd
Copying bootsector code ..... [OK]
Copying real program code ... [OK]
Ok, FD image generated! You can run it with your prefered emulator.
```

On peut contrôler le contenu de la disquette :

```bash
$ hexdump -C boot-demo.fd 
00000000  7a a0 e1 75 f0 32 60 00  72 9d 00 61 b1 7a fe 69  |z..u.2`.r..a.z.i|
00000010  b8 3a fe 29 b4 7a fc 43  18 d6 db f6 f4 b1 f4 b4  |.:.).z.C........|
00000020  b6 da 0c 43 9d 00 92 61  01 02 00 00 00 00 00 00  |...C...a........|
00000030  00 00 00 00 00 00 00 00  00 00 00 00 00 00 00 00  |................|
*
00000070  00 00 00 00 00 00 00 00  42 41 53 49 43 32 00 c9  |........BASIC2..|
00000080  00 00 00 00 00 00 00 00  00 00 00 00 00 00 00 00  |................|
*
00000100  37 32 86 01 8e ff f0 10  8e 0f f0 bd ec 00 8e 63  |72.............c|
00000110  8c 8d 0d 8e 63 97 8d 1f  8d 57 37 32 6e 9f ff fe  |....c....W72n...|
00000120  36 04 e6 80 27 0e bd e8  03 c1 0a 26 f5 c6 0d bd  |6...'......&....|
00000130  e8 03 20 ee 37 04 39 36  04 7d e7 e7 2a fb 7d e7  |.. .7.96.}..*.}.|
00000140  e7 2b fb c6 7f bd e8 03  c6 07 bd e8 03 c6 08 bd  |.+..............|
00000150  e8 03 c6 20 bd e8 03 c6  08 bd e8 03 e6 80 27 0e  |... ..........'.|
00000160  bd e8 03 c1 0a 26 d2 c6  0d bd e8 03 20 cb 37 04  |.....&...... .7.|
00000170  39 36 04 c6 7f bd e8 03  c6 08 bd e8 03 bd e8 06  |96..............|
00000180  c1 0d 27 05 bd e8 03 20  ea 37 04 39 1b 5b 1b 41  |..'.... .7.9.[.A|
00000190  1b 50 1b 60 11 0c 00 5b  43 50 45 31 37 30 34 54  |.P.`...[CPE1704T|
000001a0  4b 53 5d 0a 0a 47 52 45  45 54 49 4e 47 53 20 50  |KS]..GREETINGS P|
000001b0  52 4f 46 45 53 53 4f 52  20 46 41 4c 4b 45 4e 0a  |ROFESSOR FALKEN.|
000001c0  0a 3e 20 48 45 4c 4c 4f  0a 0a 41 20 53 54 52 41  |.> HELLO..A STRA|
000001d0  4e 47 45 20 47 41 4d 45  2e 0a 54 48 45 20 4f 4e  |NGE GAME..THE ON|
000001e0  4c 59 20 57 49 4e 4e 49  4e 47 20 4d 4f 56 45 20  |LY WINNING MOVE |
000001f0  49 53 0a 4e 4f 54 20 54  4f 20 50 4c 41 59 2e 0a  |IS.NOT TO PLAY..|
00000200  0a 48 4f 57 20 41 42 4f  55 54 20 41 20 4e 49 43  |.HOW ABOUT A NIC|
00000210  45 20 47 41 4d 45 20 4f  46 20 43 48 45 53 53 3f  |E GAME OF CHESS?|
00000220  0a 0a 3e 20 00 00 00 00  00 00 00 00 00 00 00 00  |..> ............|
00000230  00 00 00 00 00 00 00 00  00 00 00 00 00 00 00 00  |................|
```

L'image FD est maintenant prête à être exécutée dans un émulateur :

## Exécution dans un émulateur

Pour exécuter le fichier, je pourrais utiliser DCMOTO, mais je vais le faire avec le [fork du core THEODORE](https://github.com/wide-dot/theodore), du groupe [WIDE-DOT]() (dont je fais humblement partie aux côtés de BENTOC et ADNZ) pour RETROARCH.

Au préalable, j'ai installé RETROARCH et récupérér le core THEODORE avec les commandes suivantes 

1- `sudo add-apt-repository ppa:libretro/stable && sudo apt-get update && sudo apt-get install retroarch`
2- `$ git clone https://github.com/wide-dot/theodore.git`

Le core est situé dans le répertoire `dist` 

```bash
~/github/wide-dot/theodore $ tree dist
dist
├── arm7
│   └── theodore_libretro.so
├── linux
│   └── theodore_libretro.so
├── macos
│   └── theodore_libretro.dylib
└── win
    └── theodore_libretro.dll
```

Sous mon linux je vais donc utiliser le core `~/github/wide-dot/theodore/dist/linux/theodore_libretro.so` de la manière suivante en lançant le fichier `boot-demo.fd` :

```bash
$ retroarch -L ~/github/wide-dot/theodore/dist/linux/theodore_libretro.so boot-demo.fd
```

On obtient alors l'ouverture de l'émulateur en mode TO8 :

![Theodore Capture 01](/images/6809-thomson-to8-bootsector/theodore-01.png)

Et après avoir tapé `1` ou `2` ou `B` ou `C`, on obtient le chargement du bootsector, du programme et son lancement !

![Theodore Capture 01](/images/6809-thomson-to8-bootsector/theodore-02.png)

## Conclusion et remerciements

Pour conclure ce petit article, le point fondal est vraiment la partie de transformation en complément à deux d'une portion du code du bootsector, ainsi que le calcul de la checksum. Le reste est assez trivial fort heureusement.

Dans cet article j'ai proprosé un ensemble de scripts Groovy pour réaliser chacune des tâches successivement à titre pédagogique. J'aurais pu, évidemment, regrouper l'ensemble au sein d'un même script, plus compact, mais cela aurait été moins accessible à mon sens.

J'aimerais remercier très chaleureusement Bentoc pour les éléments liés à la génération d'un bootsector ainsi que Sam pour les explications
fournies sur [logicielsmoto.com](http://www.logicielsmoto.com/home.php) ! Merci à vous pour faire vivre notre "petite" passion THOMSONISTE et 
pour partager votre savoir !

J'ai pu ainsi collaborer du jeu **[Pacman 40th Anniversary](https://www.oxustudio.com/pacman/)** réalisé par ADNZ en codant le chargement de l'ensemble des fichiers BIN du jeu au moyen du *bootsector*  avec des routines de chargement améliorées par rapport au `LOADM` du BASIC, en utilisant certaines routines de l'extra-moniteur.

Un grand merci également à Rodrik et sa chaine [Rodrik Studio](https://www.youtube.com/c/rodrikstudio), qui met régulièrement en avant nos vieilles bécanes que l'on aime tant !

## Liens

- DCMOTO de Daniel Coulom : <http://dcmoto.free.fr/>
- Fork THEODORE de WIDE-DOT : <https://github.com/wide-dot/theodore>
- Site WIDE-DOT : <https://www.wide-dot.com/>
- Rodrik Studio : <https://www.youtube.com/c/rodrikstudio>
