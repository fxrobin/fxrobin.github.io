---
layout: post
title: Angular 8 and Java EE 8
subtitle: Rien de bien sorcier, juste un petit walkthrough
logo: java.png
category: JAVA
tags: [Java, Angular]
---

<div class="intro" markdown='1'>

Ayé ! (Ca y est).

J'ai basculé du côté obscur. Tout le monde va me tomber dessus pour cette phrase, mais c'est pas grave j'assume.
J'adore le langage Java depuis des années et son écosystème, parfois trop riche, de bibliothèques et d'API.

Mais il faut se résoudre, tel M. Panurge le demande, à suivre la mode et ainsi se plonger dans les technologies (pas si neuves) utilisées massivement.

Me voilà donc à écrire ce petit **tutorial Angular 8 + backend Java EE 8 (JAX-RS + CDI + Payara Micro + JDK 11 + RethinkDB)**

</div>
<!--excerpt-->


## Pré-requis

On va faire du TypeScript (la version Objet de JavaScript ...), donc il nous faut plein de choses à installer.

Il va nous falloir aussi un backend Java. Pour le Fun, on va prendre un JDK 11 Corretto de chez Amazon.
On fera un bon vieux WAR qui utilisera JAX-RS 2 et CDI 2. Il sera déployé et exécuté par Payara Micro 5.

Le tout sera Dockerisé :

1. image Docker pour le frontend
2. image Docker pour le backend java 
3. image Docker pour la persistence avec RethinkDB


### NodeJS 12 + NPM

```bash
$ wget -qO- https://deb.nodesource.com/setup_12.x | sudo -E bash -
```

puis

```bash
$ sudo apt-get install -y nodejs
```

on vérifie l'installation :

```bash
$ node -v
v12.13.0
```

### Angular CLI 

```bash
$ npm install -g @angular/cli
```

Répondre `Yes` pendant l'installation, puis désactivation des **analytic usages** :

```bash
$ ng analytics off

+ @angular/cli@8.3.18
```

## Conclusion

## Liens

* <https://rethinkdb.com/docs/guide/java/>


