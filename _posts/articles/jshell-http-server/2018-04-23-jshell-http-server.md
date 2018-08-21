---
layout: post
title: Serveur minimal HTTP avec JShell en Java_10
subtitle: Histoire de troller sur NodeJS versus Java
logo: jshell-http-server.png
category: articles
tags: [Java_10, JShell, HttpServer, HttpHandler]
lang: fr
---

<div class="intro" markdown='1'>
NodeJS se targue de pouvoir monter en quelques lignes
de code un simple serveur HTTP. Effectivement, créer ce genre de serveur est vraiment simple et particulièrement
utile pour du déploiement dans le Cloud.

Et Java dans tout ça ? A la traîne ? Has-Been ?

> "Si à 50 ans t'as pas de Rolex et/ou si tu sais pas faire de TypeScript, t'as raté ta vie !"

Fort heureusement, je vais vous montrer qu'avec JShell, apparu avec Java 9, en 10 lignes de code environ,
vous obtiendrez un serveur HTTP Asynchrone, performant, en ayant à portée de main tout ce que vous offre Java 10,
ses modules, ainsi qu'historiquement, toutes les bibliothèques JAR de son écosystème !
</div>

<!--excerpt-->

## Mais c'est quoi encore cette idée à la c ... saugrenue ?

Attention, ça va troller ... Tout le monde s'extasie devant la beauté du "HelloWorld" NodeJS qui revient
à monter un serveur HTTP léger et qui répond à des requêtes.

```javascript
var http = require('http');

//create a server object:
http.createServer(function (req, res) {
  res.write('Hello World!'); //write a response to the client
  res.end(); //end the response
}).listen(8080); //the server object listens on port 8080
```

C'est vrai que c'est court et minimaliste.

Pour le lancer, il faut disposer de "NodeJS" installé puis dans lancer le script sauvegardé sous `minimal.js`.

```
$ node minimal.js
```

Mais, c'est alors que le "vieux" arrive avec son Java et dit :

> "Nan mais ... je peux faire *presque* pareil avec Java et JShell"

## Installation de Java 10 (ou 9) et JShell

L'installation de Java 10 est très simple sur distribution fondée sur DEBIAN (Ubuntu, Mint, etc.) :

```
$ sudo add-apt-repository ppa:linuxuprising/java
$ sudo apt update
$ sudo apt install oracle-java10-installer
```

Pour disposer automatiquement de Java 10 et de ses outils, dont JShell, sur le PATH,
il suffit d'installer ce package en plus :

```
$ sudo apt install oracle-java10-set-default
```

Ensuite on vérifie que tout va bien et que JShell fonctionne.

```
$ java -version
java version "10.0.1" 2018-04-17
Java(TM) SE Runtime Environment 18.3 (build 10.0.1+10)
Java HotSpot(TM) 64-Bit Server VM 18.3 (build 10.0.1+10, mixed mode)

$ jshell
|  Welcome to JShell -- Version 10.0.1
|  For an introduction type: /help intro

jshell> /exit
|  Goodbye
```

## Eh mais JShell c'est quoi donc ?

Si vous vous posez cette question, c'est que vous n'êtes pas encore passé à Java 9
et/ou que vous résidez dans une grotte depuis 2014, date d'élaboration de JShell.

Bon d'accord Java 9 n'est sorti officiellement qu'en septembre 2017. Et, vous allez rire,
Java 10 vient de sortir fin mars 2018. JShell est donc un outil assez récent mais aussi puissant
et précieux.

Pour faire simple, JShell vous permet d'écrire, à la volée ou dans un script, un programme
Java sans avoir à coder tout le cérémonial classique d'une classe et son fameux `public static void main(String... args)`.

Cet article n'a pas vocation à être un tutoriel JShell, mais d'en faire un usage simple.

## Eh mais pourquoi tu prends Java 10 ?

Et pourquoi pas ?

Java 10 va me permettre d'utiliser le mot clé `var` pour l'inférence de type.

> Attention, rien à voir avec le `var` de JavaScript ! Un `var` Java 10 reste fortement typé !

Donc les raisons sont les suivantes :
* moi aussi je peux faire un truc à la mode
* `var` je veux essayer
* 10 c'est `var i=9; i++;`
* 10 c'est aussi `var i=11; i--;`
* 10 c'est 2 aussi quelque part
* 10 ce n'est pas 42 : vivement Java 42 qui devrait apporter toutes les réponses. Selon mes calculs, Java 42 devrait sortir en mars 2034 à raison de 2 releases par an. Ca c'est du buzz !
* Parce que J.M. Doudoux nous a dit de passer à Java 10 !

Que de bonnes raisons !

> Surtout la dernière !

## Le script JShell du serveur Http minimaliste

Et le voilà :

```java
import com.sun.net.httpserver.*;
import java.net.InetSocketAddress;

var address = new InetSocketAddress(8000);

HttpHandler handler = service -> {
	var response = "It works!".getBytes();
	service.sendResponseHeaders(200, response.length);
	service.getResponseBody().write(response);
	service.getResponseBody().close(); };

var server = HttpServer.create(address,0);
server.createContext("/test", handler);
server.start();
System.out.printf("Serveur démarré : %s%n", address);
```

Bon, à part le fait que j'ai l'impression de (re)découvrir les Servlets en 1999,
cela reste agréable à écrire :

* `InetSocketAddress` : vous connaissez tous depuis un paquet d'années, sans mauvais jeu de mots.
* `HttpServer` et `HttpHandler` : cette classe et cette interface sont apparues depuis Java 6 et elles sont bien présentes dans Java 10.
* Une petite expression lambda, pour définir le `HttpHandler`, qui est bien une interface à une seule méthode !
* Un peu de "mamaille low level" : taille de la réponse, code HTTP en retour 200, écriture et fermeture du flux.
* Création du serveur HTTP et de l'association du handler avec le context `/test`.

Le script est sauvegardé en tant que `minimal.jsh` et il est lancé de cette manière :

```
$ jshell --startup minimal.jsh
Serveur démarré : 0.0.0.0/0.0.0.0:8000
|  Welcome to JShell -- Version 10.0.1
|  For an introduction type: /help intro
```

Et voilà. Il manque plus qu'à utiliser son navigateur favori sur `http://localhost:8000/test` et on obtient bien :

```
It works!
```

Pour l'arrêter :

```
jshell> /exit
```

## Encore un petit effort d'encodage

Pour compléter ce petit exemple, il faut signaler l'encodage `UTF-8` au navigateur :

```java
import com.sun.net.httpserver.*;
import java.net.InetSocketAddress;

var CONTENT_TYPE = "text/plain; charset=UTF-8";
var address = new InetSocketAddress(8000);

HttpHandler handler = service -> {
	var response = "ça marche !".getBytes();
	service.getResponseHeaders().set("Content-Type", CONTENT_TYPE);
	service.sendResponseHeaders(200, response.length);
	service.getResponseBody().write(response);
	service.close(); };

var server = HttpServer.create(address,0);
server.createContext("/test", handler);
server.start();
System.out.printf("Serveur démarré : %s%n", address);
```

et voici ce que l'on reçoit dans les headers HTTP de retour :

```
Content-length	: 12
Content-type	: text/plain; charset=UTF-8
Date			: Mon, 23 Apr 2018 11:27:22 GMT
```

On voit bien que le caractère `ç` est codé en UTF-8 sur deux octets. Puisque la chaine
lisible est composée de 11 caractères, plus un pour ce caractère "spécial".

## Et si on y mettait tout notre coeur ...

Je me suis "déchiré" sur le titre de cette partie. L'idée est de répartir la charge
sur tous les coeurs (cores) à notre disposition au moyen d'un pool de Threads.
En l'occurence en NodeJS ce point devient dejà un peu moins simple.

En JShell (et donc Java) cela est extra-supra-simplissimismus grâce au FixedThreadPool offert
par la classe `Executors`, que l'on limite ici aux nombre de *cores* disponibles :

```java
import com.sun.net.httpserver.*;
import java.net.InetSocketAddress;
import java.util.concurrent.Executors;

/* HttpHandler équivalent aux exemples précédents */

var server = HttpServer.create(address,0);
server.createContext("/test", handler);
server.setExecutor(Executors.newFixedThreadPool(Runtime.getRuntime().availableProcessors()));
server.start();
System.out.printf("Serveur démarré : %s%n", address);
```

Et bim ! (comme dirait ma petite soeur)
Asynchrone, et multicores !

Après de multiples `F5`, voici ce que l'on obtient dans le navigateur :

```
ça marche ! Thread[pool-1-thread-1,5,main]
ça marche ! Thread[pool-1-thread-2,5,main]
ça marche ! Thread[pool-1-thread-3,5,main]
ça marche ! Thread[pool-1-thread-4,5,main]
ça marche ! Thread[pool-1-thread-5,5,main]
ça marche ! Thread[pool-1-thread-6,5,main]
ça marche ! Thread[pool-1-thread-7,5,main]
ça marche ! Thread[pool-1-thread-8,5,main]
ça marche ! Thread[pool-1-thread-1,5,main]
ça marche ! Thread[pool-1-thread-2,5,main]
ça marche ! Thread[pool-1-thread-3,5,main]
ça marche ! Thread[pool-1-thread-4,5,main]
ça marche ! Thread[pool-1-thread-5,5,main]
```

## Version Docker

On me dit dans l'oreillette que j'aurais pu être un peu moins flemmard et de conteneuriser le tout
avec Docker.

Donc je remercie chaleureusement celui qui est à l'autre bout de l'oreillette, **Mickaël Baron**, pour la version Docker, une fois le script `minimal.jsh` créé bien évidemment (ici dans le répertoire courant) :

```
$ sudo docker run -it -p 8000:8000 -v $(pwd)/minimal.jsh:/minimal.jsh openjdk:10-jdk /bin/jshell --startup /minimal.jsh
```


## Pour conclure ...

Easy, isn't it ?
Finalement ce n'est pas si "has-been" que cela Java ...

> Cet article contient un certain nombre de blagues pour trolls et geeks.
Un cadeau à gagner pour celui qui me donne le nombre exact en commentaires.
Attention, il y a un piège.
