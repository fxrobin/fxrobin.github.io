---
layout: post
title: 'Atari ST : coopération C et Assembleur'
subtitle: Du code C qui appelle de code Assembleur et réciproquement
logo: atari-rainbow.png
category: articles
tags: [Retro, Assembleur, Atari, Retro-Prog]
lang: fr
ref: m68k-atari-st-assembly-and-c
---

<div class="intro" markdown='1'>

Il n'est pas rare de devoir mixer du code C et assembleur au sein d'un même programme.
En effet, certains aspects sont plus simples et souvent tout aussi rapides à coder en C
mais d'autres cas sont paradoxalement plus facile à écrire à assembleur et souvent plus optimisés.

L'idée est donc de pouvoir profiter du meilleur des deux mondes. 

> Cela me rappelle finalement quand du Java appelle du C/C++ via JNI ou JNA qui peut lui-même appeler de l'assembleur.
> Mais ceci est une autre histoire...

Ce bref tutoriel montre comment compiler, à partir de Linux, un programme en mixant C et assembleur pour le TOS de l'Atari ST
avec le compilateur `vasm` et le compilateur `m68k-atari-mint-gcc`

Le fichier exécutable sera exécuté avec l'émulateur HATARI comme dans l'article sur la [cross-compilation 
en C](/m68k-cross-compiling/).

*Spoiler* : Je me servirai de tout cela pour implémenter une routine Timer A
dans le cadre de la lecture de fichiers de musique YM-2149 au format "`YM3!`" à 50 Hz, dans un futur tutoriel...
</div>
<!--excerpt-->

## Pré-requis

Pour ce tutorial, vous aurez besoin :

- du compilateur M68K `vasm`
- du cross-compiler C `m68k-atari-mint-gcc`

Je vous renvoie à mes articles concernant :

- la [configuration de `vasm`](m68k-atari-st-assembly-linux)
- la [configuration de `m68k-atari-mint-gcc`](/m68k-cross-compiling/)

Pour compiler de l'assembleur Motorola 68000 (M68K), je vais utiliser `vasm`.
En effet, `vasm` est un compilateur multi-plateformes (dont mon linux), multi-cibles (dont le M68K).
Sa syntaxe est très (très, très) proche de celle de Devpack, ce que je préfère.

Il existe d'autres solutions pour compiler de l'assembleur M68K, notamment avec GCC lui-même, mais 
c'est avec `vasm` que je préfère. 

Les outils sont prêts.

## Principes

Le but de ce tutoriel est de montrer les cas simples suivants :

- Cas ALPHA   : du code C qui appelle une fonction simple écrite en assembleur.
- Cas BRAVO   : du code assembleur qui appelle une fonction simple en C.
- Cas CHARLIE : du code C qui appelle une fonction assembleur avec des paramètres en entrée et qui retourne une valeur.

> Attention, il s'agit bien de code C et non pas de C++ pour lequel il y aurait quelques
> subilités supplémentaires avec l'usage `extern "C" { }` .

## Cas ALPHA : appel ASM depuis du C

Pour appeler du code assembleur depuis une fonction C, il faut :

- dans le code C : déclarer le prototype de la function. ex: `void asm_helloBitmapBrothers();`
- dans le code ASM : 
  - rajouter l'instruction `XDEF _asm_helloBitmapBrothers`. Cette instruction rend *visible* le label lors de la phase de *linking*.
  - implementer la fonction avec le label `_asm_helloBitmapBrothers:` sans oublier le `RTS` à la fin de l'implementation

> Toutes les déclarations faites en C auront leur représentation en assembleur préfixée par `_` (underscore).
> C'est la raison pour laquelle le prototype C `void asm_helloBitmapBrothers();` devient `_asm_helloBitmapBrothers`.
> En complément, j'ai choisi de préfixer une fonction implémentée en assembleur par `asm_` 
> à des fins *pédagogiques* pour comprendre les interactions et les appels.

Pour résumer :

Fichier `main.c`
```c
// déclaration de la fonction codée en assembleur
void asm_helloBitmapBrothers();

void main()
{
	// appel de la fonction de manière classique.
	asm_helloBitmapBrothers(); 
}
```

et côté assembleur :

Fichier : `asm_functions.s`
```
; ------------------------------------------------------------
; Declaration of the ASM function to be called from C 
; ------------------------------------------------------------
	XDEF _asm_helloBitmapBrothers
; ------------------------------------------------------------


; ------------------------------------------------------------
; Implementation of  : void asm_helloBitmapBrothers(); 
; Description : writes the string placed in MESSAGE
; ------------------------------------------------------------
_asm_helloBitmapBrothers:
	PEA 	MESSAGE  	; Stack : 4 bytes 
	MOVE.W	#9,-(SP)	; Stack : 2 bytes (#9: display string)
	TRAP	#1			; displaying the string
	ADDQ.L	#6,SP		; Stack : ajustment 6 bytes (4+2) 
	RTS
; ------------------------------------------------------------

; ------------------------------------------------------------
; -- EQUATES
; ------------------------------------------------------------
CR	EQU	$0D	; ASCII Carriage Return
LF	EQU	$0A	; ASCII Line Feed
ES	EQU	$00	; Fin de chaine 
; ------------------------------------------------------------

; ------------------------------------------------------------
; -- DATA 
; ------------------------------------------------------------
MESSAGE:
	DC.B	  "Hello Bitmap Brothers!",CR,LF,ES	                             
; ------------------------------------------------------------	
```


## Cas BRAVO : appel C depuis ASM

Pour appeler une fonction C depuis du code assembleur, il faut :

- dans le code C : disposer d'une fonction tout à fait classique. Exemple : `void helloPalaceSoftware()`
- dans le code Asssembleur :
  - déclarer la fonction avec l'instruction `XREF`. Exemple : `XREF _helloPalaceSoftware`.
  - appeler la fonction, alors vue comme une *routine* classique, avec `JSR` ou `BSR`. Exemple : `BSR _helloPalaceSoftware`

> Tout comme dans le cas Alpha, le préfixe `_` (underscore) est important pour que le *linking* se fasse correctement.
> Attention à ne pas confondre `XREF` et `XDEF`. Dans notre cas Bravo, il s'agit de `XREF` : déclaration d'une référence externe.

Exemples :

Fichier `main.c`
```c
void helloPalaceSoftware()
{
	puts("Hello Palace Software!");
}
```

Fichier `asm_functions.s`
```
; ------------------------------------------------------------
; Declaration of the C function to be called from ASM 
; ------------------------------------------------------------
	XREF _helloPalaceSoftware
; ------------------------------------------------------------	


;	... classic assembly code ...
;	...
;	...
	BSR     _helloPalaceSoftware    ; Calls C function void helloPalaceSoftware();		
;	...
;	...	
```

## Cas Charlie : appel ASM "avancé" depuis du C

L'idée est de pouvoir appeler une routine assembleur qui attend des paramètres et qui retourne une valeur.
Afin d'illustrer ce cas, nous aurons le prototype `unsigned int asm_multiply(unsigned int a, unsigned int b);` qui sera implémenté en assembleur. 

Pour bien comprendre ce cas, il faut connaitre le fonctionnement de passage de paramètres au moyen de la pile (stack).
La *stack* est accessible via l'alias `SP` en assembleur. Ce dernier est d'ailleurs la représentation du registre `A7`, dédié l'adresse
courante de la *stack*.

Il y a de très bonnes explications sur le fonctionnement de la pile, données par Vincent Rivière dans le cadre de ses
[tutoriels assembleur](https://www.youtube.com/watch?v=w9G-DidbTeU&list=PLpqOJeWrMJfRF8UMTGOHvmcagQlvo-zUo) ainsi que dans 
les [cours ASM](http://www.labibleatari.fr/pages/disque/programmation/assembleur/cours/ferocelapincoursserie1.html) de Feroce Lapin.

Dans notre cas, Le code ASM récupéra les 2 arguments (a et b) sur la *stack* et retournera la valeur dans le registre `D0`.

Je ne vais donc donner ici que quelques détails supplémentaires :
- l'accès aux arguments sur la *stack* doit être décalé de 4 octets car, avant de détenir les arguments, elle contient l'adresse de retour nécessaire à l'instruction `RTS`. Cette adresse est placée de manière transparente par l'appel de fonction C.
- chaque argument est placé sur la *stack* en partant de son argument le plus à droite ;
- chaque argument occupe systématiquement 32 bits (4 octets) sur la *stack*, quelque soit la précision de l'argument. Ex: un argument de type `char` (8 bits) occupera quand même 32 bits sur *stack*. La valeur réelle étant placée, bien évidemment, sur l'octet de poids faible.
- la valeur de retour sera à placer dans le registre `D0` avant l'instruction `RTS`.

Exemples :

Fichier `main.c`
```c
unsigned int asm_multiply(unsigned int a, unsigned int b);

void main()
{
	unsigned int total = asm_multiply(6, 3);
	// total contient 18 
}	
```

Dans cet exemple la pile contient :

```
(SP+8) -> $ 4 bytes : #3 (2nd argument)
(SP+4) -> $ 4 bytes : #6 (1er argument)
(SP)   -> $ 4 bytes : $<adresse de retour> 
```

Pour récupérer les arguments, il faut donc se décaler au préalable de 4 octets pour se déplacer au delà de l'adresse de retour de la routine.

Fichier `asm_functions.s`
```
; -----------------------------------------------------------------------------
; Declaration of the C function to be called from ASM 
; -----------------------------------------------------------------------------
	XDEF _asm_multiply
; -----------------------------------------------------------------------------

; -----------------------------------------------------------------------------
; -- Implementation of  : __uint32_t asm_multiply(__uint32_t a, __uint32_t b); 
; -- Description : multiplies 2 numbers (16 bits unsigned integers) and returns 
; --               the value in D0.
; -----------------------------------------------------------------------------
_asm_multiply:
	MOVE.L	4(SP), D0	;get 1st parameter (32 bits), put in D0
	MOVE.L	8(SP), D1	;get 2nd parameter (32 bits), put in D1
	MULU	D1, D0		;multiply D1 with D0 and put the result in D0
	RTS
; -----------------------------------------------------------------------------
```

## Code complet, Makefile et exécution

Voici le code C et ASM de tous ces exemples regroupés en un seul programme :

Fichier `main.c`
```c
#include <sys/types.h>
#include <stdio.h>

#include "fx_screen.h"

//================================================================
// ASM functions. Implemented in "asm-functions.s"
void asm_helloBitmapBrothers();
void asm_callbackHelloPalaceSoftware();
void asm_keypressed();
__uint32_t asm_multiply(__uint32_t a, __uint32_t b);

//================================================================
// Standard C function. Callable (and called) from ASM.
void helloPalaceSoftware()
{
    printf("C > Hello Palace Software\r\n");
}

//================================================================
// Main program
void run()
{
    // inits display in medium resolution with a custom palette
    ScreenContext* screenContext = initMediumResolution();
    
    // Starting the demo
    printf("Starting C <-> ASM Demo\r\n");
    printf("-----------------------\r\n");

    // simply calls ASM   
    asm_helloBitmapBrothers();

    // calls ASM which calls a C function
    asm_callbackHelloPalaceSoftware(); 

    // calls a "complex" function with parameters and return value
    printf("asm_multiply(6,3) =  %d\r\n", asm_multiply(6, 3)); 

    printf("\r\nFinished [PRESS ENTER]\r\n");

    // let's call a last function coded in ASM
    asm_keypressed();

    // Restoring the resolution and its palette  
    restoreScreenContext(screenContext);
}

//================================================================
// Standard C entry point
int main(int argc, char *argv[])
{  
    // switching to supervisor mode and execute run()
    // needed because of direct memory access for reading/writing the palette
    Supexec(&run);
}
```

Ne prêtez pas trop attention à `fx_screen.h` et `fx_screen.c`. Ils contiennent simplement quelques fonctions et constantes pour basculer en mode
"MOYENNE RESOLUTION", sauvegarder la palette, et puis revenir proprement au DESKTOP GEM.

Comme j'utilise `libcmini`, je suis obligé de coder `\r\n` au lieu de `\n` même si cela n'est pas le comportement
standard attendu par `printf()`.

Dans le fichier suivant, les exemples sont un peu plus fournis que dans les explications précédentes, mais ils
sont foncièrement équivalents.

Fichier `asm_functions.s`
```
; -------------------------------------------------------------------------------
; -- Declaring C functions to be called by ASM	
; -------------------------------------------------------------------------------
	XREF	_helloPalaceSoftware	; mapped to void helloPalaceSoftware();
; -------------------------------------------------------------------------------

; -------------------------------------------------------------------------------
; -- Declaring ASM functions to be called from C
; -------------------------------------------------------------------------------
	XDEF	_asm_helloBitmapBrothers
	XDEF	_asm_callbackHelloPalaceSoftware
	XDEF	_asm_keypressed
	XDEF	_asm_multiply
; -------------------------------------------------------------------------------

; -------------------------------------------------------------------------------
; -- Implementation of  : void asm_helloBitmapBrothers();
; -- Description : write the string placed in MESSAGE
; -------------------------------------------------------------------------------
_asm_helloBitmapBrothers:
	PEA			MSG_PREFIX		; Stack : 4 bytes (PEA = PUSH EFFECTIVE ADDRESS)
	BSR			print_string        
	ADDQ.L		#4,sp			; Stack : ajustment 4 bytes
	PEA			MESSAGE			; Stack : 4 bytes 
	BSR			print_string
	ADDQ.L		#4,sp			; Stack : ajustment 4 bytes
	RTS
; -------------------------------------------------------------------------------

; -------------------------------------------------------------------------------
; -- Implementation of  : void  asm_callbackHelloPalaceSoftware(); 
; -- Description : Simply calls the C funtion "helloPalaceSoftWare()".
; -------------------------------------------------------------------------------
_asm_callbackHelloPalaceSoftware:
	PEA		MSG_PREFIX				; Stack : 4 bytes 
	BSR		print_string            
	ADDQ.L	#4,sp					; Stack : ajustment 4 bytes
	BSR		_helloPalaceSoftware	; Calls C void helloPalaceSoftware();
	RTS
; -------------------------------------------------------------------------------

; -------------------------------------------------------------------------------
; -- Implementation of  : void asm_keypressed(); 
; -- Description : wait for a key to be pressed. 
; -------------------------------------------------------------------------------
_asm_keypressed:
	MOVE.W	#8,-(sp)	; Stack : 2 bytes (#8 = key pressed wait)
	TRAP	#1
	ADDQ.L	#2,sp		; Stack : ajustment 2 bytes
	RTS
; -------------------------------------------------------------------------------

; -------------------------------------------------------------------------------
; -- Implementation of  : __uint32_t asm_multiply(__uint32_t a, __uint32_t b); 
; -- Description : multiplies 2 numbers (16 bits unsigned integers) and returns 
; --               the value in D0.
; -------------------------------------------------------------------------------
_asm_multiply:
	MOVE.L	4(SP), D0	;get 1st parameter (32 bits), put in D0
	MOVE.L	8(SP), D1	;get 2nd parameter (32 bits), put in D1
	MULU	D1, D0		;multiply D1 with D0 and put the result in D0
	RTS
; -------------------------------------------------------------------------------

; -------------------------------------------------------------------------------
; -- ASM routine : print_string 
; -- Description : Subroutine to easily print a string.
; -- Usage : 	PEA		MSG				; Stack : 4 bytes 
; --			BSR		print_string        
; --			ADDQ.L	#4,sp			; Stack : ajustment 4 bytes
; -------------------------------------------------------------------------------             
print_string:
	MOVE.L	4(SP),D0	; let's get the parameter in the stack with offset
	MOVE.L	D0,-(SP)	; place it on the stack again
	MOVE.W	#9,-(SP)	; Stack : 2 bytes (#9 = display string)
	TRAP	#1			; displaying the prefix
	ADDQ.L	#6,SP		; Stack : ajustment 6 bytes (4+2) 
	RTS
; -------------------------------------------------------------------------------	

; -------------------------------------------------------------------------------   
; -- EQUATES
; -------------------------------------------------------------------------------
CR	EQU	$0D		; ASCII Carriage Return
LF	EQU	$0A		; ASCII Line Feed
ES	EQU	$00		; Fin de chaine 
; -----------------------------------------------

; -------------------------------------------------------------------------------
; -- DATA
; -------------------------------------------------------------------------------
MESSAGE:
	DC.B	"Hello Bitmap Brothers!",CR,LF,ES
MSG_PREFIX:
	DC.B	"ASM > ",ES
; -------------------------------------------------------------------------------
```

Fichier `Makefile`
```
SOURCES_DIR=./src
BUILD_DIR=./build
DIST_DIR=./dist

# VASM PARAMETERS
ASM=vasmm68k_mot
ASMFLAGS=-Faout -quiet -x -m68000 -spaces -showopt

# GCC PARAMETERS
LIBCMINI=./libcmini
CC=m68k-atari-mint-gcc
CFLAGS=-c -std=gnu99 -I$(LIBCMINI)/include -g

# LINKER PARAMETERS
LINKFLAGS=-nostdlib -s -L$(LIBCMINI)/lib -lcmini -lgcc -Wl,--traditional-format

all: prepare dist

prepare: clean
	mkdir -p $(BUILD_DIR)

clean-compile : clean asm_functions.o screen.o main.o

asm_functions.o: prepare
	$(ASM) $(ASMFLAGS) $(SOURCES_DIR)/asm_functions.s -o $(BUILD_DIR)/asm_functions.o

fx_screen.o: prepare
	$(CC) $(CFLAGS) $(SOURCES_DIR)/fx_screen.c -o $(BUILD_DIR)/fx_screen.o

main.o: prepare
	$(CC) $(CFLAGS) $(SOURCES_DIR)/main.c -o $(BUILD_DIR)/main.o

main: main.o asm_functions.o fx_screen.o
	$(CC) $(LIBCMINI)/lib/crt0.o \
	      $(BUILD_DIR)/asm_functions.o \
		  $(BUILD_DIR)/fx_screen.o \
		  $(BUILD_DIR)/main.o \
		  -o $(BUILD_DIR)/main.tos $(LINKFLAGS);

dist: main
	mkdir -p $(DIST_DIR)
	cp $(BUILD_DIR)/main.tos $(DIST_DIR) 	

clean:
	rm -rf $(BUILD_DIR)
	rm -rf $(DIST_DIR)
```

> J'utilise `libcmini` pour obtenir un binaire `.tos` de faible taille.

Ensuite pour compiler et linker le programme :

```bash
$ $ make
rm -rf ./build
rm -rf ./dist
mkdir -p ./build
m68k-atari-mint-gcc -c -std=gnu99 -I./libcmini/include ./src/main.c -o ./build/main.o
vasmm68k_mot -Faout -quiet -x -m68000 -spaces -showopt ./src/asm_functions.s -o ./build/asm_functions.o

message 2050 in line 17 of "./src/asm_functions.s": operand optimized: label->(d16,PC)
>    PEA        MSG_PREFIX  ; Stack : 4 bytes (PEA = PUSH EFFECTIVE ADDRESS)

message 2054 in line 18 of "./src/asm_functions.s": branch optimized into: b<cc>.b
>    BSR     print_string            

message 2050 in line 20 of "./src/asm_functions.s": operand optimized: label->(d16,PC)
>    PEA     MESSAGE        ; Stack : 4 bytes (PEA = PUSH EFFECTIVE ADDRESS)

message 2054 in line 21 of "./src/asm_functions.s": branch optimized into: b<cc>.b
>    BSR     print_string

message 2050 in line 29 of "./src/asm_functions.s": operand optimized: label->(d16,PC)
>    PEA        MSG_PREFIX  ; Stack : 4 bytes (PEA = PUSH EFFECTIVE ADDRESS)

message 2054 in line 30 of "./src/asm_functions.s": branch optimized into: b<cc>.b
>    BSR     print_string            
m68k-atari-mint-gcc -c -std=gnu99 -I./libcmini/include ./src/fx_screen.c -o ./build/fx_screen.o
m68k-atari-mint-gcc ./libcmini/lib/crt0.o \
      ./build/asm_functions.o \
          ./build/fx_screen.o \
          ./build/main.o \
          -o ./build/main.tos -nostdlib -s -L./libcmini/lib -lcmini -lgcc;
mkdir -p ./dist
cp ./build/main.tos ./dist 
```

> On constate que `vasm` fait quelques optimisations au passage.

Puis pour le lancer :

```bash
$ hatari ./dist/main.tos
```

On obtient l'écran suivant :

![TOS Result](/images/m68k-atari-st-assembly-and-c/capture.png){: .fakescreen}

Et voilà !

Pour compléter, quand on osculte le fichier `main.o`, on comprend pourquoi il faut rajouter `_` (underscore) dans le code ASM.
En effet, toutes les fonctions ont été déclarées avec un label précédé de `_`.

```bash
$ m68k-atari-mint-nm ./build/main.o
         U _asm_callbackHelloPalaceSoftware
         U _asm_helloBitmapBrothers
         U _asm_keypressed
         U _asm_multiply
0000001c T _helloPalaceSoftware
         U _initMediumResolution
00000000 t .LC0
00000030 t .LC1
00000049 t .LC2
00000062 t .LC3
00000084 t .LC4
00000110 T _main
         U ___main
         U _printf
         U _puts
         U _restoreScreenContext
0000009e T _run
```

## Conclusion

Comme annoncé en introduction, je me servirai de ces éléments pour coder une routine qui joue des fichier `.ym` pour notre YM-2149.
En effet, la partie principale de ce futur programme sera codé en C, mais il y aura quelques aller-retours avec du code assembleur notamment
pour déclarer une routine Timer A exécutée 50 fois par seconde (50 Hz).

Ceci sera dans le prochain épisode !

> Je remercie Lyloo & Vincent Rivière pour leur relecture attentive de cet article.

## Liens

- [How to use VASM m68k assembly code within GCC C/C++ programs](https://bus-error.nokturnal.pl/article1-How-to-use-VASM-m68k-assembly-code-within-GCC-C-C-programs>) (*Auteur : Saulot*)
- [Incorporating m68k assembly code (GNU GAS) in GCC C/C++ programs ](<https://bus-error.nokturnal.pl/article2-Incorporating-m68k-assembly-code-GNU-GAS-in-GCC-C-C-programs>) (*Auteurs : V. Rivière & Pawel Goralski*)
- VASM : <http://sun.hasenbraten.de/vasm>
- Usage de VASM : <https://www.chibiakumas.com/z80/vasm.php>
- Dr. Volker Barthelmann´s Compiler Page : <http://www.compilers.de/>
- Hatari : <https://hatari.tuxfamily.org/>
- EmuTOS : <https://emutos.sourceforge.io/>
- Programmation M68K : <https://www.chibiakumas.com/68000/>
- Chaine Youtube Vretrocomputing : <https://www.youtube.com/c/Vretrocomputing>
- Page Facebook Vretrocomputing : <https://www.facebook.com/Vretrocomputing/>
