---
layout: post
title: C programming for Atari ST with Linux
subtitle: cross-compiling a Helloworld for TOS and GEM
logo: atari-st-bomb.png
category: articles
tags: [Retro, C, Atari, Retro-Prog]
lang: en
ref: m68k-cross-compiling
---

<div class="intro" markdown='1'>

The objective of this little tutorial is to compile two C programs for TOS and then GEM, from Linux.

The executable files will be tested with the HATARI emulator, before being
actually executed on an Atari ST in "plastic and bones".
</div>
<!--excerpt-->


## Preamble and thanks

Before starting this light tutorial, I want to thank Vincent Rivière
for his passion and his great work around the Atari ST, still today
today, in 2021 and especially the 68k cross-compiler that will be used in this tutorial.
in this tutorial.

> "Vincent, if you listen to us ..." 

I also thank Arnaud Bercegeay for the GEM library which will be used in a part of this tutorial.


> "Arnaud, if you read us ..."

That was the "*Michel Drucker*" minute, let's get to the serious stuff, which is not really serious.

## Installing the GCC cross-compiler for 68000

By default, under Linux, the 68000 target, the processor of the Atari ST (and the Amiga), is completely unknown. 

So you have to install something to "cross-compile" a C program for 68000 under a good old X86 Linux, for my part in 64 bits.

This is extremely easy to do under Ubuntu and derivatives (I'm under Linux Mint), 
thanks to Vincent Rivière's PPA and the packages he prepared for us:

```bash
$ sudo add-apt-repository ppa:vriviere/ppa
```

```text
Vous êtes sur le point d'ajouter le PPA suivant :
 PPA for the m68k-atari-mint cross-tools.
See http://vincent.riviere.free.fr/soft/m68k-atari-mint/ubuntu.php for instructions.
 Plus d'informations : https://launchpad.net/~vriviere/+archive/ubuntu/ppa
Appuyez sur Entrée pour continuer ou Ctrl+C pour annuler

Executing: /tmp/apt-key-gpghome.a7viURPyI0/gpg.1.sh --keyserver hkps://keyserver.ubuntu.com:443 --recv-keys BFD8768B6878C33FDFD082C94AAD3A5DB5690522
gpg: clef 4AAD3A5DB5690522 : clef publique « Launchpad PPA for Vincent Rivière » importée
gpg: Quantité totale traitée : 1
gpg:               importées : 1
```

```bash
$ sudo apt update
$ sudo apt install cross-mint-essential
```

```text
Les paquets supplémentaires suivants seront installés : 
  binutils-m68k-atari-mint gcc-m68k-atari-mint gemlib-m68k-atari-mint mintbin-m68k-atari-mint mintlib-m68k-atari-mint pml-m68k-atari-mint
Les NOUVEAUX paquets suivants seront installés :
  binutils-m68k-atari-mint cross-mint-essential gcc-m68k-atari-mint gemlib-m68k-atari-mint mintbin-m68k-atari-mint mintlib-m68k-atari-mint pml-m68k-atari-mint
...
...
Paramétrage de mintbin-m68k-atari-mint (0.3-qCVS-20110527-2ppa20200501220938~bionic) ...
Paramétrage de mintlib-m68k-atari-mint (0.60.1.Git-20200504-1ppa20200506194738~bionic) ...
Paramétrage de binutils-m68k-atari-mint (2.30-mint-20180703-1ppa20200501220650~bionic) ...
Paramétrage de gemlib-m68k-atari-mint (0.43.6-qGit-20170304-2ppa20200501105521~bionic) ...
Paramétrage de pml-m68k-atari-mint (2.03-mint-20191013-3ppa20200505192610~bionic) ...
Paramétrage de gcc-m68k-atari-mint (4.6.4-mint-20200504-3ppa20200505195236~bionic) ...
Paramétrage de cross-mint-essential (1.0-3ppa20200501105507~bionic) ...
```

We check that the compiler is present:

```bash
$ m68k-atari-mint-gcc --version
```

```
m68k-atari-mint-gcc (GCC) 4.6.4 (MiNT 20200504)
Copyright (C) 2011 Free Software Foundation, Inc.
This is free software; see the source for copying conditions.  There is NO
warranty; not even for MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
```

First satisfactory stage, the dopamine starts to be secreted...

## Compiling a TOS program

We create a small program in C, all classic, a good old "Hello Bitmap Brothers" message, because saying hello to the *world* seems a bit presumptuous.

`hello_bb.c`
```c
#include <stdio.h>

void main()
{
    printf("Hello Bitmap Brothers!\n");
    printf("Press Enter");
    getchar();
}
```

We compile this work with our beautiful GCC cross-compiler :

```bash
$ m68k-atari-mint-gcc hello_bb.c -o hello_bb.tos
```

The executable file `hello_bb.tos` just appeared in the folder,
but my little linux is unable to do anything with it without a 
68000 emulator: Hatari, that's the subject of the next section.

## Installing, setting up and running the program under Hatari

To install the [Hatari] emulator (https://hatari.tuxfamily.org/), all you need is a very small "*bash*" line:

```bash
$ sudo apt-get install hatari
```

Here it is, it's almost ready, because the emulator needs the TOS (or rather a TOS). I get [EmuTOS](https://emutos.sourceforge.io/) which is a free version of the TOS and I put it in a directory "`../tos/etos256fr.img`". I took the french version.

I just have to run the previously compiled program directly, by configuring Hatari with the following parameters: 

- `-t ../tos/etos256fr.img` : use the EmuTOS ROM
- `--tos-res med` : be in medium resolution, just for the *fun*.

This gives the following command line:

```bash
$ hatari -t ../tos/etos256fr.img --tos-res med hello_bb.tos
```

> In this configuration, Hatari automatically mounts a C disk on the directory containing the specified program 
> `.tos` or `.prg` program specified and runs it.

The Hatari emulator starts and runs the `hello_bb.tos` program directly:

![TOS Result](/images/m68k-cross-compiling/tos.png){: .fakescreen}

The dopamine starts to reach a high level in the brain! But we are not
stop there ...

## Compiling a GEM program

GEM is the graphic environment of the Atari ST. 
It is a window manager designed in 1984 by Digital Research and ported to 68000 by Atari in 1985.
At the same time, Microsoft Windows 1.0 (Yes, 1.0!) was available.

> In short, GEM offers the *machine* that you manipulate with the mouse and that has windows on a green background.

We are going to code a `PRG` program for Atari, which uses the GEM features, especially the creation of a modal window, by means of the library "[GEM Lib](http://arnaud.bercegeay.free.fr/gemlib/)". This library is already present, as it is provided with the `cross-mint-essential` package.

Then, a small program that uses this library:

`hello_ge.c`
```c
#include <gem.h>

int main( void) 
{
	appl_init();
	form_alert( 1, "[1][Hello GEM!][OK]");
	appl_exit();
	return 0;
}
```

That we compile by indicating the library "`gem`":

```bash
$ m68k-atari-mint-gcc hello_ge.c -o hello_ge.prg -lgem
```

> Note that I make sure that my file has only 8 characters before the extension, even if it works 
> also with more characters under Hatari.

Then I restart the emulator :

```bash
$ hatari -t ../tos/etos256fr.img --tos-res med hello_ge.prg
```

And I get this :

![GEM Result](/images/m68k-cross-compiling/gem.png){: .fakescreen}

Dopamine overdose ...

## Conclusion

Using a Linux compilation chain to produce executables for the Atari ST and its 68000, it's really practical.

I just have to transfer it on a real Atari ST and enjoy ...

For your information, personally, I can transfer files on my Atari 1040 STE thanks to :

- a floppy disk formatted in DOS 720k and thus a compatible floppy drive. Even in USB, it exists.
- Ghostlink + RS 232 interface + DosBox that I use on a Raspberry PI.
- to an SD card, connected to a SD/IDE converter, itself connected to an [IDE controller, directly on the 68000](https://forum.system-cfg.com/viewtopic.php?t=6889).

Finally, there are many libraries that have been ported for 68k, notably SDL 1.2, which will interest me in another tutorial.
I will be interested in another tutorial to come, if it works for my STE ...

## Links

- Packaging Cross Compiler 68k by Vincent Rivière for Ubuntu : <http://vincent.riviere.free.fr/soft/m68k-atari-mint/ubuntu.php>
- Hatari : <https://hatari.tuxfamily.org/>
- EmuTOS : <https://emutos.sourceforge.io/>
- GEM Lib : <https://github.com/freemint/gemlib>, 2016 (for the online doc) <http://arnaud.bercegeay.free.fr/gemlib/>
- Vretrocomputing Youtube channel of Vincent Rivière : <https://www.youtube.com/c/Vretrocomputing>
- Vretrocomputing Facebook page: <https://www.facebook.com/Vretrocomputing/>
