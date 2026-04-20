---
layout: page
title: About the author
subtitle: because there is a human writing all this ...
logo: xenon-reborn.png
permalink: /about/en/
lang: en
ref: about
---

<div class="intro" markdown='1'>

My name is François-Xavier Robin and I have been passionate about software development since I was a child.

Here is a brief chronological summary of my journey as a developer / sysadmin / architect ...

</div>

<!--excerpt-->

## 1983-1984: The TV becomes interactive

Before my Atari 2600 arrived, the TV was just something I watched passively — Goldorak, Battle of the Planets, cartoons of the era.

![ATARI-2600](/images/atari-2600.png)

Games I had on it:

<table>
  <tr>
    <td>Pole Position<br>{%include video.html youtube-id="W2jLrNYzyr8?rel=0&amp;showinfo=0" size="mini" %}</td>
    <td>Snoopy and the Red Baron<br>{%include video.html youtube-id="0XfGUXoTxSo?rel=0&amp;showinfo=0" size="mini" %}</td>
  </tr>
  <tr>
    <td>E.T. (the famous one)<br>{%include video.html youtube-id="ZPnmewxetNA?rel=0&amp;showinfo=0" size="mini" %}</td>
    <td>Defender<br>{%include video.html youtube-id="FIH3qE7jUUs?rel=0&amp;showinfo=0" size="mini" %}</td>
  </tr>
  <tr>
    <td>Real Sport Tennis<br>{%include video.html youtube-id="wMocFmcL1a0?rel=0&amp;showinfo=0" size="mini" %}</td>
  </tr>
</table>

I still own this console and all its games to this day — after this, I moved exclusively to home computers.

## 1984-1989: Discovering home computing

In 1984, at age 9 (the mathematically gifted among you will have deduced my birth year via "subtraction"), I discovered programming thanks to a THOMSON TO7-70 sitting at the back of my primary school classroom. LOGO, BASIC 1.0, the light pen, the cartridges — it was a revelation. I asked the teacher to let me skip recess to spend time on the TO7 instead of playing marbles in the schoolyard.

At age 10, my parents gave me a THOMSON MO5: 48 KB of memory (32 KB RAM, 16 KB ROM), cassette storage, light pen. Alone with a few books on BASIC and assembly, it was a school of constant discovery — testing, crashing, resetting, and optimising. With 48 KB and 1 MHz, you had to be creative.

Even today, 30 years later, I still have that taste for optimisation and every well-used byte.

![MO5](/images/mo5.png)

Among the small programs I wrote:

* A sort of chatbot — precursor but very limited, as you might imagine
* A membership management app for my father's tennis club (with cassette storage)
* A game where TIE fighters fly across a targeting reticle and you destroy them

Unfortunately I no longer have any source code from that era.

You can also read about [how to assemble a program for the MO5 from Linux](/6809-thomson-mo5-assembly-linux).

At age 12, I upgraded — still Thomson — to a TO8: same 1 MHz clock, but 256 KB RAM, 80 KB ROM and a double-sided floppy drive. 360 KB per side! A flood of bytes. During this whole period my languages were BASIC 1.0, then BASIC 512 (both written by Microsoft), and 6809 assembly. The famous "Routines" ...

![TO8](/images/to8.png)

An excerpt from my [article on the TO8 bootsector](/6809-thomson-to8-bootsector):

```
** PARAMETER EQUATES
START_SECTOR    EQU $02          ** first sector to read
NB_READ_SECTORS EQU $02          ** 2 sectors = 512 bytes
TARGET_ADDR     EQU $6300        ** load address

        ORG     $6200
        SETDP   $60

BEGIN
        LDA #$60
        TFR A,DP
        LDS #$A000

        LDX     #TARGET_ADDR
        STX     <REG_TARGET_ADDR
        LDA     #DISKOP_SECT_READ
        STA     <REG_DISKOP
        LDB     #START_SECTOR
        STB     <REG_SECTOR
        LDA     #NB_READ_SECTORS

!       JSR     DKCO
        BCS     END
        INC     <REG_TARGET_ADDR
        INC     <REG_SECTOR
        DECA
        BNE     <
        JSR     TARGET_ADDR

END     JMP [$FFFE]
```

On the TO8 I mostly refined the tennis club membership software, with random-access floppy storage (not sequential). It also generated mailing labels to print and stick on envelopes. Getting the print alignment right was a puzzle. Once again, the source code is long gone (sad).

On these machines I still have a deep fondness for the game [L'Aigle d'Or](https://fr.wikipedia.org/wiki/L%27Aigle_d%27or) by Louis-Marie Rocques.

<table>
  <tr>
    <td><img src="/images/generique-aigle-d-or.png" alt="Generique Aigle d'or" /></td>
    <td><img src="/images/aigle-d-or.jpg" alt="Aigle d'or" /></td>
  </tr>
  <tr>
    <td colspan="2" style="text-align:center"><iframe class="video normal" src="https://www.youtube.com/embed/vwpK4_K0ygQ?rel=0&amp;showinfo=0" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe></td>
  </tr>
</table>

If you are not lucky enough to still own these wonderful working machines, check out Daniel Coulom's excellent Thomson emulation site: [http://dcmoto.free.fr](http://dcmoto.free.fr/)

During the same period I also had great fun at my cousin's and friends' homes with ORIC ATMOS, AMSTRAD CPC 464 and 6128, and an MSX — fine company indeed.

I also ran the computer club at my middle school: the technology teacher trusted me to manage the "GOUPIL" server that networked the MO5s (nanonetwork). M. Guintrand, if you're reading this — thank you!

![Serveur Goupil](/images/goupil.png)

That was also the era when we "cracked" copy-protected software with `POKE 8699,57`. We had no idea what it actually did, but it worked... (note: disabling copy protection is wrong, kids).

## 1989-1993: A bit of acne, but a lot more RAM

At 14 I moved into the 68000 world with an ATARI 1040 STE — 1 MB RAM, 8 MHz. Not a flood anymore, it was pure decadence. I also tinkered with a friend's Amiga (Frédéric, if you're reading this — thanks!) and we started coding in C (already!), Omikron, GFA Basic and STOS.

<table>
  <tr>
    <td><img src="/images/atari-st.png" alt="ATARI-ST" /></td>
    <td><img src="/images/amiga.png" alt="AMIGA" /></td>
  </tr>
</table>

Thirty years later I still have an immense fondness for this machine, especially for the games XENON and XENON 2 by [Bitmap Brothers](https://fr.wikipedia.org/wiki/Bitmap_Brothers).

<table>
  <tr>
    <td><img src="/images/xenon-1.jpg" alt="Xenon 1" /></td>
    <td><img src="/images/xenon-2.jpg" alt="Xenon 2" /></td>
  </tr>
</table>

In 2017 I made a small tribute to those two games: [Xenon Reborn](https://www.youtube.com/watch?v=ki39sbk4VKc), written in Java with LibGDX.

<iframe class="video" src="https://www.youtube.com/embed/ki39sbk4VKc" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>

The GitHub project: [https://github.com/fxrobin/Xenon_Reborn](https://github.com/fxrobin/Xenon_Reborn)

An article about it: [Developing while having fun and vice versa: Xenon-Reborn](/Xenon-Reborn)

## 1993-1996: A driving licence, a car, but mostly a 486 DX2 66 MHz Turbo

At 18, crash landing — I switched to a 486 DX2 66 (with a "turbo" button) and entered the world of x86, QBASIC and, still, assembly.

I went through university discovering many languages but staying loyal to C and assembly. With megabytes to spare and a 250 MB hard drive, "developing" had also become "my studies" — so my dear **beloved-adored-mum** could no longer tell me to *"put down that computer and do your homework!"*.

It was also when I discovered what an L2 cache was — the hard way. Every time I enabled it in the BIOS the PC ran noticeably better... until it crashed. Turned out my L2 cache was faulty.

I discovered Mode X (Mode 13h for the initiated), BIOS interrupts, graphics cards that crashed column resizing in Excel and WIN 3.11. The era of Watcom C++ and its famous `dos4gw` protected mode that every game used to access all the RAM — 16 MB!

![Watcom C++](/images/watcom.png)

I wrote a game called "Red Devil 97", a clone of "Blue Angel 69" from the Atari ST and Amiga.

<iframe class="video normal" src="https://www.youtube.com/embed/zVy3VXSf2yY?rel=0&amp;showinfo=0;start=71" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>

Here is my still-BETA version — never finished, but it was playable both two-player and against the computer.

![Red Devil 97](/images/rdevil_001.png)

I still have the source code (C++ and Assembly), but it's rough, so I won't show it. This is where I wrote my first AI (a generous word for it) for the opponent player.

The game featured a full GUI with animations (60 FPS from memory), sprite animations, transparency effects, and an event manager. Some graphics routines were in assembly.

I integrated MIKMOD to play `.mod` and `.xm` files (Atari and Amiga tracker formats).

> Maybe one day I'll redo a clone of the clone in Java.

In C++ I also built a fact/consequence resolution engine called an "Expert System" with a fellow student (David Rideau, if you're reading...). It was the Observer/Observable pattern — except we didn't know that yet, we invented it ourselves. Changes propagated reactively: Reactive Programming before the name existed.

I entered an international algorithm competition to solve multi-constraint problems. We chose genetic algorithms, and I built the engine with my university tutor at Versailles-Saint-Quentin, Franck Quessette. It was magical and it worked well even for 1996.

I studied Pascal, COBOL, C++, ADA, and... in late 1996, **JAVA**! A revelation. Even though back then "*Java is ugly*", "*Java is slow*".

## 1996: My (love?) story with Java

![I LOVE JAVA](/images/i-love-java.png)
{: style="text-align : center"}

Every question that hit me in 1996:

* What? I can finally have portable code without recompiling for each target?
* What? The JDK is free?
* What? I can build portable GUIs (it was AWT... ugh)?
* What? I can embed all this in Netscape (youngsters won't understand)?
* What? When I update my app on the server it downloads automatically?
* What? It's multithreaded?

Then in 1999:

* What? I can generate web pages server-side instead of CGI scripts (youngsters won't understand) with Servlets?
* What? Tomcat is free?
* What? JBuilder is NOT free...
* What? I can connect to any database (yes, I also know SQL)?

## Main Java projects between 1996 and 2002

* A SQL query interpreter / compiler
* A distributed RDBMS storage engine
* A web templating framework based on Servlets
* A Servlet-based XML templating and application framework (resembled JSF)
* A data extraction and integration tool with a pivot XML format
* An Apache VFS plugin to store files in a MySQL database
* An app to order drinks for colleagues (and myself) before heading to the bar
* A document management system with Lucene indexing and version control

## To be continued

When I make the effort to remember everything else ...

![Guru Meditation](/images/guru-meditation.gif) 
{: style="text-align : center"}

![Atari ST Bombs](/images/bombs.png)
{: style="text-align : center"}

## Contact me

Best via [LinkedIn](https://www.linkedin.com/in/fxrobin).
