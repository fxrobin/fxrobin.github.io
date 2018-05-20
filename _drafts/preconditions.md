---
layout: post
title: Préconditions des méthodes d'une API
subtitle: Parce qu'il faudrait toujours vérifier les arguments
logo: api-preconditions.png
category: JAVA
tags: [Java, Guava, Apache Preconditions]
---

<div class="intro" markdown='1'>
Quand on élabore une API accessible par une autre portion de code, que ce soit
en interne sous forme de librairie JAR ou à distance via un service REST, il faut
toujours vérifier les arguments en "entrée".

Cependant, en Java "de base", c'est particulièrement laborieux, rébarbatif et cela
engendre une fainéantise exacerbée car si ces tests sont absent celà à un impact sur la qualité et à la robustesse du code.
</div>
<!--excerpt-->

> C'est carrément casse-bonbons oui !

## La problématique

Partons du principe que nous devons coder une méthode, accessible depuis du code tiers, qui accepte trois arguments :
* un nom exprimé en majuscules, sans espaces, ni caractères spéciaux ;
* un age entre 0 et 150 ans
* une image PNG contenue dans un tableau de byte ;
* une liste de compétences, sous formes de chaines de caractères.s

## La manière classique en JAVA

```java


```

On est d'accord, c'est long et ennuyant ... voire carrément lourdingue, pour ne pas dire pire.
Qu'existe-t-il pour nous faciliter tout cela ? On va tenter de faire un peu le tour de la question.

## Solutions existantes

### Java assert

Soyons succinct : **cette technique est déconseillée**. Elle ne peut être utilisée que pour une phase de développement
et requiert un paramètre de JVM au lancement de l'application pour être prise en compte.
Ce plus cette solution est assez limitée.

On oublie donc ici, chaînes de formatage `String.format`, lazy instanciation avec lambda, etc.

Donc j'en parle parce qu'il le faut, mais volontairement je ne donnerais pas d'exemple.


### Apache Comons Lang

C'est à mon sens la bibliothèque la plus fournie pour les tests des arguments.
Elle existe depuis 2003, avec sa classe `Validate`.

Néanmoins, conçue avant Java 8, elle n'offre aucune intégration de lambdas et de références de constructeurs.
Elle permet la concaténation a posteriori de style `String.format` ou `printf`, ce qui est une bonne optimisation.

Pour l'utiliser, il suffit de déclarer la dépendance MAVEN suivante :

```xml
<dependency>
  <groupId>org.apache.commons</groupId>
  <artifactId>commons-lang3</artifactId>
  <version>3.7</version>
</dependency>
```

### Guava

La classe `Preconditions` de Guava existe depuis 2010. Historiquement elle faisait partie de leur ancien projet *Google Collection Library* datant de 2009.

Cette solution est très certainement la plus proche de ce qui me serait utile, mais là pas de support de lambda
et donc d'instanciation lazy des exception à lever.

Elle permet toutefois d'éviter la concaténation directe des chaînes au moyen de chaînes de formatage et d'arguments,
comme l'offre `String.format` ou `printf`.

Pour l'utiliser, il suffit de déclarer la dépendance MAVEN suivante :

```xml
<dependency>
  <groupId>com.google.guava</groupId>
  <artifactId>guava</artifactId>
  <version>25.0-jre</version>
</dependency>
```


### Spring

Spring offre de quoi valider les arguments aussi depuis la version 1.0 de 2004 !

Depuis la version 5, chaque méthode de vérification se voit surchargée avec la capacité de fournir un `Supplier<String>`, donc une lambda qui fournira une chaîne seulement si le test de validation échoue. C'est ce comportement qui est le plus
optimisé et que je recherche, mais il ne prend pas de référence vers des constructeurs d'`Exception`.

De plus, Spring 5 ne propose pas le formatage `String.format` ou `printf`. Dommage.

Pour l'utiliser, il suffit de déclarer la dépendance MAVEN suivante :

```xml
<dependency>
  <groupId>org.springframework</groupId>
  <artifactId>spring-core</artifactId>
  <version>5.0.5.RELEASE</version>
</dependency>
```

### Better Preconditions

Petite coquette bibliothèquounette très intéressante sur son approche au moyen d'une API fluent.

Il manque cependant des choses primordiales comme la validation avec une regexp ou simplement un test booléen.

L'API n'exploite pas JAVA 8 et utilise Joda Time pour les dates, par exemple.

```xml
<dependency>
  <groupId>com.github.choonchernlim</groupId>
  <artifactId>better-preconditions</artifactId>
  <version>0.1.1</version>
</dependency>
```

En fait, si j'avais un peu de temps à consacrer à un projet sympa, je pense que je le *forkerais* pour en faire une version Java 8 avec support de lambda.

Niveau performances, rien de notable, aucune dégradation constatée même après un tir de 10000 tests.

### Java 8 Objects

Enfin, Java 8 arrive avec sa classe `Objects` avec quelques méthodes pour valider.

Extrait de la JAVADOC de la classe `Objects` et de sa méthode `requireNonNull` :

```java
public Foo(Bar bar, Baz baz) {
     this.bar = Objects.requireNonNull(bar, "bar must not be null");
     this.baz = Objects.requireNonNull(baz, "baz must not be null");
}
```

Intéressant, mais beaucoup trop limité, bien qu'elle puisse prendre un `Supplier<String>` comme message.
On utilise en fait la classe `Objects` plutôt dans des `filter(Objects::nonNull)` dans l'API Stream de JAVA 8.

## Precondition "Fait maison"

Le "fait maison", sauf au restaurant, en général j'évite : je fais une entorse à ce principe quand je ne trouve vraiment rien qui me convienne et c'est malheureusement le cas avec toutes les solutions décrites si dessus.

En effet, ces librairies n'exploitent pas la puissance des expressions lambdas et notamment des références de méthodes et constructeurs.

Impossible par exemple de désigner le constructeur d'une exception pour qu'elle soit instanciée a posteriori, ou encore de produire une chaine avec du formatage type "printf" ou "String.format".

Il faut donc un mix entre toutes ces solutions : notre propre "bibliothèque".

> bibliothèque est un bien grand mot car cela va se résumer à quelques classes

Donc c'est parti, voici à quoi cela va ressembler, en tout cas pour la première méthode qui vérifiera la non nullité d'un paramètre.
J'ai décidé de ne pas en faire une API fluent, malgré l'envie, pour des raisons de performances supposées : je souhaite éviter l'instanciation d'objets pendant cette phase pour ne pas surcharger le Garbage Collecting.

Grosso modo, cela va ressembler à Apache Commons Lang Validation avec ce qui lui manque de prise en compte des lambdas.

```java
```

Usage :

```
```

On étoffe un peu la solution avec d'autres types de vérifications :
* une plage de valeurs d'entiers
* *matching* d'une expression régulière
* test booléen standard et par Supplier<Boolean> ainsi que par Predicate<T>.
* désignation par référence et déclenchement d'une exception

```
```

Usage :
```
```

## Bean Validation

Bean Validation permet de placer des annotations de validation de contenu sur des
attributs ou des arguments. C'est une spécification extensible dont l'implémentation de
référence est Hibernate Validator.

Pour l'utiliser :

```xml
<dependency>
			<groupId>org.hibernate.validator</groupId>
			<artifactId>hibernate-validator</artifactId>
			<version>6.0.9.Final</version>
</dependency>
```

En Java SE, sans CDI, l'idée est d'encapsuler les arguments dans une classe spécifique
et de les confronter en validation avant usage.




### avec EJB @AroundInvoque et Bean Validation

### avec CDI @Interceptor et Bean Validation

## Quelques réflexions supplémentaires

On voit dans les exemples ci dessus que le nombre d'arguments peut être trop élevé : en général j'encapsule cela dans
une nouvelle classe, par exemple une classe static interne.

L'avantage c'est que cette classe pourra porter des annotations Bean Validation et donc être soumise à validation.

Il m'arrive même souvent que ces classes soient aussi des classes JPA. Pas de mélange des genres selon moi car tant qu'aucune
instance n'est pas validée par Bean Validation, JPA ne la persiste pas et ne fait donc pas partie du contexte du persistence.
C'est une sorte de DTO temporaire qui m'évite de redéfinir les champs : un bon développeur se doit d'être paresseux.

Dans tous les cas, je pense qu'il ne faut pas généraliser les tests de préconditions à toutes les classes d'une application
Java. Il faut, à mon sens, se concentrer sur ce qui est proposer et visible par l'API, que ce soit localement ou
à distance avec des services REST.

Au sujet des webservices, j'aimerais rappeler qu'avec JAX-WS (SOAP) ou JAX-RS (REST) les annotations Bean Validation sont prises en compte :
- lors de la génération des schémas XSD et contrat WSDL. En entrée d'un WS SOAP, d'un point de vu méthode JAVA, les arguments sont
donc automatiquement validés.
- lors de l'appel de la méthode, donc plus tardivement, dans le cas de REST.

Exemple JAX-WS et Bean validation

```java
```

Exemple JAX-RS et Bean validation
