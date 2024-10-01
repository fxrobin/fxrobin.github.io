---
layout: post
title: 'Atari ST: un compilateur C avec Docker'
subtitle: Cross-compilation d'un Helloworld (program TOS) avec un conteneur Docker
logo: atari-st-bomb.png
category: retro
tags: [Retro, C, Atari, Retro-Prog, Docker]
lang: fr
ref: c-programming-for-atari-st-with-docker
permalink: /atari-st-c-compiler-avec-docker/
---

<div class="intro" markdown='1'>
L'objectif de ce petit tutoriel est de compiler un programme C pour TOS à l'aide d'un conteneur Docker.
</div>
<!--excerpt-->


## Preambule

Suite au [tutoriel précédent](/c-programming-for-atari-st-with-linux/), nous allons utiliser un conteneur Docker pour compiler des programmes C pour l'Atari ST.

**Pourquoi Docker ? Parce que c'est un bon moyen d'avoir un environnement propre et reproductible, sans avoir à installer beaucoup de choses sur votre ordinateur qui pourraient potentiellement casser votre système ou entrer en conflit avec d'autres outils et bibliothèques.**

L'image Docker utilisée est basée sur Ubuntu 20.04 et contient le compilateur croisé pour le processeur 68000, le processeur de l'Atari ST.

Le Dockerfile est un ensemble d'instructions qui seront utilisées pour construire l'image Docker et installer les outils nécessaires comme le cross-compiler provenant du [PPA de Vincent Rivière](http://vincent.riviere.free.fr/soft/m68k-atari-mint/ubuntu.php).

## Prérequis : Docker

Évidemment, vous devez avoir Docker installé sur votre ordinateur. Si ce n'est pas le cas, vous pouvez suivre les instructions sur le [site officiel de Docker](https://docs.docker.com/get-docker/).

## Image Docker pour le compilateur 68000

Vous avez maintenant deux options pour compiler votre programme C pour l'Atari ST :
- soit utiliser l'image docker disponible sur le [Docker Hub](https://hub.docker.com/r/fxrobin/m68k-compiler)
- soit construire l'image Docker vous-même en suivant les instructions ci-dessous

### Solution 1 : Utiliser l'image Docker disponible sur  Docker Hub

Pour utiliser l'image Docker disponible sur le Docker Hub, exécutez la commande suivante pour vérifier que tout fonctionne correctement :

```bash
$  docker run -it fxrobin/m68k-compiler make --version
Unable to find image 'fxrobin/m68k-compiler:latest' locally
latest: Pulling from fxrobin/m68k-compiler
602d8ad51b81: Already exists
a83e648886ca: Pull complete
fff2a7d88eba: Pull complete
Digest: sha256:797d84ac0937717aa6891c54ef23dc29ad151ac062343d69634502968cb6d109
Status: Downloaded newer image for fxrobin/m68k-compiler:latest
GNU Make 4.2.1
Built for x86_64-pc-linux-gnu
Copyright (C) 1988-2016 Free Software Foundation, Inc.
License GPLv3+: GNU GPL version 3 or later <http://gnu.org/licenses/gpl.html>
This is free software: you are free to change and redistribute it.
There is NO WARRANTY, to the extent permitted by law.
```

L'image est fonctionnelle et prête à ête utilisée pour compiler des programmes C pour l'Atari ST.

### Solution 2 : Création de l'image Docker

Si vous souhaitez faire le tout manuellemen, voici le Dockerfile qui sera utilisé pour construire l'image Docker :

`Dockerfile`
```dockerfile
# Use an Ubuntu base image
FROM ubuntu:20.04

# Set environment variables to avoid prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install dependencies and cross-mint-essential from the PPA
RUN apt-get update && \
    apt-get install -y build-essential gcc make software-properties-common && \
    add-apt-repository ppa:vriviere/ppa && \        
    apt-get update && \
    apt-get install -y cross-mint-essential && \    
    rm -rf /var/lib/apt/lists/*


# Set the working directory inside the container
WORKDIR /app

# Run a shell by default when starting the container
CMD ["/bin/bash"]
```

Pour construire l'image Docker, enregistrez le Dockerfile dans un répertoire et exécutez la commande suivante à partir de ce répertoire :

```bash
$ docker build -t m68k-compiler .
```

Cette commande va construire l'image Docker et la taguer avec le nom `m68k-compiler`.

La création de l'image peut prendre un certain temps en fonction de la vitesse de votre connexion Internet, mais cette opération peut être effectuée sur un ordinateur Windows, Mac ou Linux.

## Un programme C simple pour l'Atari ST

Créons un programme C simple qui affichera un message à l'écran de l'Atari ST et plaçons le programme dans le répertoire `./src`.

`hello.c`
```c
#include <stdio.h>

void main()
{
    printf("Hello Bitmap Brothers!\n");
    printf("Press Enter");
    getchar();
}
```

et maintenant, voici un `Makefile` classique pour compiler le programme :

`makefile`
```makefile
# Makefile for building all .c files in ./src into Atari ST TOS programs

# Compiler 
CC = m68k-atari-mint-gcc

# Directories
SRC_DIRECTORY = ./src
OBJ_DIRECTORY = ./target/obj
BUILD_DIRECTORY = ./target/build

# Target executable
TARGET = $(BUILD_DIRECTORY)/hello.tos

# Source files
SRCS = $(wildcard $(SRC_DIRECTORY)/*.c)

# Object files
OBJS = $(patsubst $(SRC_DIRECTORY)/%.c, $(OBJ_DIRECTORY)/%.o, $(SRCS))

# Default target
all: $(TARGET)

# Link the object files to create the executable
$(TARGET): $(OBJS)
	@mkdir -p $(BUILD_DIRECTORY)
	$(CC) -o $@ $^

# Compile source files to object files
$(OBJ_DIRECTORY)/%.o: $(SRC_DIRECTORY)/%.c
	@mkdir -p $(OBJ_DIRECTORY)
	$(CC) $(CFLAGS) -c $< -o $@

# Clean up build files
clean:
	rm -rf $(OBJ_DIRECTORY) $(BUILD_DIRECTORY)
```

Ce `Makefile` compilera le programme `hello.c` et générera l'exécutable `hello.tos` dans le répertoire `./target/build`.

Voici la structure de l'arborescence du projet :

```bash
$ tree
.
├── Dockerfile
├── makefile
└── src
    └── hello.c
```

## Lancement de la compilation avec le conteneur Docker

Le conteneur lui-même exécute une distribution Linux légère, avec le cross-compiler 68000, qui peut être exécuté sur n'importe quel ordinateur prenant en charge Docker (Windows, Mac, Linux).

Pour exécuter le conteneur Docker, utilisez la commande suivante :

```bash
$ docker run -it -v $(pwd):/app fxrobin/m68k-compiler make --debug=b
GNU Make 4.2.1
Built for x86_64-pc-linux-gnu
Copyright (C) 1988-2016 Free Software Foundation, Inc.
License GPLv3+: GNU GPL version 3 or later <http://gnu.org/licenses/gpl.html>
This is free software: you are free to change and redistribute it.
There is NO WARRANTY, to the extent permitted by law.
Reading makefiles...
Updating makefiles....
Updating goal targets....
 File 'all' does not exist.
   File 'target/build/hello.tos' does not exist.
     File 'target/obj/hello.o' does not exist.
    Must remake target 'target/obj/hello.o'.
m68k-atari-mint-gcc  -c src/hello.c -o target/obj/hello.o
    Successfully remade target file 'target/obj/hello.o'.
  Must remake target 'target/build/hello.tos'.
m68k-atari-mint-gcc -o target/build/hello.tos target/obj/hello.o
  Successfully remade target file 'target/build/hello.tos'.
Must remake target 'all'.
Successfully remade target file 'all'.
```
> **Note** : Si vous avez construit votre propre image Docker, remplacez `fxrobin/m68k-compiler` par `m68k-compiler` dans la commande ci-dessus.

Cette commande démarre le conteneur Docker, monte le répertoire courant à l'intérieur du conteneur et exécute la commande `make` avec l'option `--debug=b` pour afficher les commandes exécutées par `make`.

La commande `make` compile le programme `hello.c` pour l'Atari ST et génère le fichier `hello.tos` dans le répertoire `./target/build`.

```bash
$ ls -l ./target/build
total 132
-rwxr-xr-x 1 root root 132601 Sep 20 15:59 hello.tos
```

Voici la structure de l'arborescence du projet après la compilation :

```bash
$ tree
.
├── Dockerfile
├── makefile
├── src
│   └── hello.c
└── target
    ├── build
    │   └── hello.tos
    └── obj
        └── hello.o
```      

Vous pouvez maintenant tester l'exécutable `hello.tos` avec votre émulateur Atari ST préféré, comme Hatari sur Linux ou Steem sur Windows.

## Conclusion

Grâce à Docker, nous avons un environnement propre et reproductible pour compiler des programmes C pour l'Atari ST.

Vous pouvez maintenant compiler et construire à partir de votre IDE ou éditeur de texte préféré sur votre système d'exploitation préféré (Windows, Linux, MacOS) sans vous soucier de la compatibilité des outils.

## Liens
- Packaging Cross Compiler 68k par Vincent Rivière pour Ubuntu : <http://vincent.riviere.free.fr/soft/m68k-atari-mint/ubuntu.php>
- Chaîne Youtube Vretrocomputing de Vincent Rivière : <https://www.youtube.com/c/Vretrocomputing>
- Page Facebook Vretrocomputing : <https://www.facebook.com/Vretrocomputing/>
