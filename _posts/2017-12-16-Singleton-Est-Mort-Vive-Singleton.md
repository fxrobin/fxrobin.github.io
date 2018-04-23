---
layout: post
title: Le singleton est mort, vive le singleton !
subtitle: Encore un post sur le Singleton ?
logo: brain-logo.png
category: CONCEPTION
tags: [patterns,java,lazy,threadsafe,classloading]
---
<div class="intro" markdown='1'>
L'objectif de ce billet est de présenter une implémentation simple en Java du pattern Singleton. 

Je ne traiterai donc pas de l'utilité ni des recommandations d'usage liées à celui-ci mais bien de mise en oeuvre (codage pour les intimes) en Java Standard Edition (JSE). 
</div>
<!--excerpt-->


## Le constat

Il est vraiment frappant en consultant les sites spécialisés en développement Java de constater à quel point le **Design Pattern Singleton** est dans le top 3 des patterns les plus abordés.

De la même façon, il est encore plus frappant de voir à quel point toutes ces ressources en ligne, toutes ces explications sur l'unicité en mémoire, le double-check-locking prennent une part importante. Même sur des sites pourtant reconnus comme DZONE, on y trouve des articles erronés, car en effet, **rien de plus simple que d'écrire un bon singleton Thread-Safe et Lazy en Java : mais je le garde pour la fin de ce billet ...**



## Les origines du Design Pattern Singleton

Au préalable, revenons aux origines du Singleton, alors que Java n'existait pas encore et à ses principales caractéristiques :

- un singleton c'est un objet construit conformément à sa sa classe et dont on a la garantie qu'il n'existe qu'**une seule et une seule instance** en mémoire à un instant donné.
- en cas d'accès concurrent lors de l'instanciation d'un singleton, il faut veiller à ce que cet aspect soit pris en compte par un **mécanisme de verrous.**
- en général on souhaite que le singleton ne s'initialise pas entièrement, mais seulement à son premier appel, afin d'économiser de la mémoire. On appelle cela le mécanisme "*lazy*".

Ainsi le GoF, propose son pattern singleton. Et certains l'appliquent alors en C++.

## Et la plateforme Java alors ?

Java arrive alors sur le marché, ressemblant tellement à C++ sur sa syntaxe que le singleton du GoF, façon C++, est tout simplement imité sans prendre en compte les spécificités de la plateforme Java :

- une classe n'est chargée que lors de son premier appel.
- le chargement d'une classe est *thread-safe*, c'est un mécanisme garanti par la hiérarchie de *ClassLoader*s de la JVM. 

Ce qui permet d'envisager déjà que :

- le singleton version Java, sera forcément Lazy
- l'instanciation statique du singleton version Java, sera forcément ThreadSafe
- toute autre tentative de ne pas se reposer sur ces caractéristiques apportera un code plus lourd, inutile et potentiellement buggué. (Less Code, Less Bug !)
- un singleton version Java SE avec une seule hiérarchie de ClassLoader sera seul en mémoire JVM. 


## Et "un lazy thread-safe, un ..."

Le voilà, notre beau Singleton Lazy Thread-Safe :

```java
public class LazySingleton 
{
    private static final LazySingleton instance = new LazySingleton();

    private LazySingleton() 
    {
        System.out.println("Construction du Singleton au premier appel");
    }

    public static final LazySingleton getInstance() 
    {
        return instance;
    }
   
    @Override
    public String toString() 
    {
       return String.format("Je suis le LazySingleton : %s", super.toString());
    }
}
```

Voici un programme qui en obtient une instance :

```java
public class MainProg 
{

    public static void main(String[] args) 
    {
        System.out.println("Démarrage du programme");
        System.out.println("Mon singleton n'est toujours pas chargé ...");
        System.out.println("Bon allez, je me décide à l'appeler ...");
        LazySingleton singleton = LazySingleton.getInstance();
        System.out.println("Et maintenant je l'affiche ...");
        System.out.println(singleton);
    }
}
```

et voici son résultat de son exécution qui prouve bien son chargement "*lazy*" :

```
Démarrage du programme
Mon singleton n'est toujours pas chargé ...
Bon allez, je me décide à l'appeler ...
Construction du Singleton au premier appel
Et maintenant je l'affiche ...
Je suis le LazySingleton : demo.LazySingleton@7852e922
```


## Et depuis Java 5, ça donne quoi ?

Enfin, depuis Java 5, c'est à dire fin 2004, une éternité, un singleton peut s'implémenter au moyen d'une "enum". Petite limitation dans ce cas : on ne peut pas en hériter, mais en a-t-on souvent besoin ?

Version enum Java 5 :

```java
public enum LazySingletonEnum
{
    INSTANCE;

    private LazySingletonEnum()
    {
        System.out.println("Construction du LazySingletonEnum");
    }

    public static LazySingletonEnum getInstance()
    {
        return INSTANCE;
    }

    public String getMessage()
    {
        return String.format("Je suis le LazySingleton : %s", super.toString());
    }
}
```

et son usage :

```
System.out.println("Démarrage du programme");
System.out.println("Mon singleton n'est toujours pas chargé ...");
System.out.println("Bon allez, je me décide à l'appeler ...");
LazySingletonEnum singleton = LazySingletonEnum.getInstance();
System.out.println("Et maintenant je l'appelle  ...");
System.out.println(singleton.getMessage());
System.out.println("On peut aussi l'appeler directement : ");
System.out.println(LazySingletonEnum.INSTANCE.getMessage());
```

qui donne le résultat probant suivant :

```
Démarrage du programme
Mon singleton n'est toujours pas chargé ...
Bon allez, je me décide à l'appeler ...
Construction du LazySingletonEnum
Et maintenant je l'appelle  ...
Je suis le LazySingleton : INSTANCE
On peut aussi l'appeler directement : 
Je suis le LazySingleton : INSTANCE
```

## Et la "serialization" entre en jeu ...

Je n'ai pas non plus abordé un autre problème : souvent un Singleton a besoin d'être "Serializable", mais de fait, la déserialisation d'un singleton permet de créer plusieurs instances.
Ceci "casse" le principe du Singleton qui doit être unique.

Pour résoudre ce problème, il suffit de définir `readResolve()` dans le singleton lui-même.

```java
public class Singleton implements Serializable 
{
    private static Singleton singleton = new Singleton( );

    private Singleton() 
    {
       // protection 
    }

    public static Singleton getInstance( ) 
    {
      return singleton;
    }

    public Object readResolve() 
    {
       return Singleton.getInstance( );
    }  
}
```

> A noter que cela n'est pas nécessaire dans le cas d'un singleton codé au moyen d'une enum.

> Attention aussi à vos objets que vous serialisez peut-être et qui possèderaient une référence vers le singleton. Il vaut mieux dans ce cas place le mot clé `transient` devant sa référence.

## Petit détour du côté des Servlets

Ce petit paragraphe sort du cadre de ce billet, puisque je ne souhaitais évoquer que le cas de Java SE et non
pas Java EE.

Mais pour illustrer, et pour ceux qui connaissent, voici ce que sont chacune des servlets déclarées dans une WebApp Java : un singleton ! Et oui, *chaque Servlet est un singleton* ! Lazy de surcroit ! Ce qui vallait d'ailleurs au premier déclencheur (un navigateur via URL par exemple) d'avoir un temps d'attente un peu plus long que les clients suivants qui avaient alors la servlet de chargée en mémoire prête à répondre à la requête au moyen d'un Thread.

Idem pour les pages JSP, qui en plus passaient par une phase de compilation éventuelle, préalablement transformées en Servlet, toujours LAZY, car chargées seulement au premier appel.

Pour éviter ces effets d'attente et charger chaque servlet (singleton) dès le déploiement de l'application, le fameux :

```xml
<load-on-startup>1</load-on-startup>
```
Cette configuration de la servlet dans le `web.xml` permet ainsi de la passer en mode "EAGER" (inverse de LAZY).


## Il faut conclure ...

Je viens d'écrire ce que je m'étais pourtant interdit de faire : un n-ième billet sur le Singleton en Java venant s'ajouter à la quantité déjà astronomique de ceux qui existent sur le net.

Ce qu'il faut retenir : vous n'aurez JAMAIS la garantie d'avoir une instance unique d'une classe en Java. Par introspection, par AOP, vous aurez toujours un moyen de casser l'unicité mémoire qu'on attend pourtant d'un singleton. Il suffit juste de faire un peu attention.

En guise de réelle conclusion, utilisez : 
* `@ApplicationScoped` de CDI, que vous pouvez utiliser même en Java SE si vous prenez "Weld" dans vos dépendances 
* `@Singleton` de la spec EJB en environnement Java EE et vous serez définitivement tranquille.
