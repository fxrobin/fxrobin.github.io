---
layout: post
title: 'Atari ST: Compiler for C programming with Docker'
subtitle: Cross-compiling a Helloworld for TOS within a Docker container
logo: atari-st-bomb.png
category: retro
tags: [Retro, C, Atari, Retro-Prog, Docker]
lang: en
ref: c-programming-for-atari-st-with-docker
permalink: /c-programming-for-atari-st-with-docker/
---

<div class="intro" markdown='1'>
The objective of this little tutorial is to compile a C program for TOS with the help of a Docker container.
</div>
<!--excerpt-->


## Preamble

Following the [previous tutorial](/c-programming-for-atari-st-with-linux/), we will use a Docker container to compile C programs for the Atari ST.

**Why Docker? Because it's a good way to have a clean and reproducible environment, without having to install a lot of things on your computer which could potentially break your system or conflict with other tools and libraries.**

The Docker image used is based on Ubuntu 20.04 and contains the cross-compiler for the 68000 processor, the processor of the Atari ST.

The Dockerfile is a set of instructions that will be used to build the Docker image and install the necessary tools like the cross-compiler coming from [Vincent Rivière's PPA](http://vincent.riviere.free.fr/soft/m68k-atari-mint/ubuntu.php).

## Prerequisites : Docker

Obvioulsy, you need to have Docker installed on your computer. If it's not the case, you can follow the instructions on the [official Docker website](https://docs.docker.com/get-docker/).

## Docker Image for the 68000 Compiler

You now have two options to compile your C program for the Atari ST:
- either use the Docker image available on [Docker Hub](https://hub.docker.com/r/fxrobin/m68k-compiler)
- or build the Docker image yourself by following the instructions below

### Solution 1: Use the Docker Image Available on Docker Hub

To use the Docker image available on Docker Hub, run the following command to verify that everything is working correctly:

```bash
$ docker run -it fxrobin/m68k-compiler make --version
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

The image is functional and ready to be used to compile C programs for the Atari ST.

### Solution 2: Build the Docker Image Yourself

If you want to do everything manually, here is the Dockerfile that will be used to build the Docker image:

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

To build the Docker image, save the Dockerfile in a directory and run the following command:

```bash
$ docker build -t m68k-compiler .
```

This command will build the Docker image and tag it with the name `m68k-compiler`.

Creating the image may take some time depending on your internet connection speed but this operation can be done on a Windows, Mac or Linux computer.

## A simple C program for the Atari ST

Let's create a simple C program that will display a message on the screen of the Atari ST and placing the program in the `./src` directory.

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

and now let's a classic `Makefile` to compile the program:

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

This `Makefile` will compile the `hello.c` program and generate the `hello.tos` executable in the `./target/build` directory.

Here is the tree structure of the project:

```bash
$ tree
.
├── Dockerfile
├── makefile
└── src
    └── hello.c
```

## Launching the compilation with the Docker container

The container itself runs a lightweight Linux distribution, with the cross-compiler for the 68000 processor installed, that can be run on any computer that supports Docker (Windows, Mac, Linux).

To run the Docker container, use the following command:

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

> **Note**: If you have built your own Docker image, replace `fxrobin/m68k-compiler` with `m68k-compiler` in the command above.

This command starts the Docker container, mounts the current directory inside the container, and runs the `make` command with the `--debug=b` option to display the commands executed by `make`.

The `make` command compiles the `hello.c` program for the Atari ST and generates the `hello.tos` in the `./target/build` directory. 

```bash
$ ls -l ./target/build
total 132
-rwxr-xr-x 1 root root 132601 Sep 20 15:59 hello.tos
```

Here is the tree structure of the project after the compilation:

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

You can now test the `hello.tos` executable with your favorite Atari ST emulator, like Hatari on Linux or Steem on Windows.

## Conclusion

Thanks to Docker, we have a clean and reproducible environment to compile C programs for the Atari ST.

You can now compile and build from your favorite IDE or text editor on your favorite operating system (Windows, Linux, MacOS) without worrying about the compatibility of the tools.

## Links
- Packaging Cross Compiler 68k by Vincent Rivière for Ubuntu : <http://vincent.riviere.free.fr/soft/m68k-atari-mint/ubuntu.php>
- Vretrocomputing Youtube channel of Vincent Rivière : <https://www.youtube.com/c/Vretrocomputing>
- Vretrocomputing Facebook page: <https://www.facebook.com/Vretrocomputing/>
