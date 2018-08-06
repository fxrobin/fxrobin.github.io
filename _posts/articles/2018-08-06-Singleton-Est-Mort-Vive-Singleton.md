---
layout: post
title: Le singleton est mort, vive le singleton !
subtitle: Encore un post sur le Singleton ?
logo: brain-logo.png
category: articles
tags: [patterns,java,lazy,threadsafe,classloading,holder,permgen,meta]
---

<div class="intro" markdown='1'>

> - *Version 1 parue le 16/12/2017*
> - *Version 2 parue le 06/08/2018 : accès concurrents, PermGen / Meta spaces, Holder interne*

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
- en général on souhaite que le singleton ne s'initialise pas entièrement, mais seulement à son premier appel, afin d'économiser de la mémoire. On appelle cela le mécanisme « *lazy* ».

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

## Et « un lazy thread-safe, un ... »

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

et voici son résultat de son exécution qui prouve bien son chargement « *lazy* » :

```
Démarrage du programme
Mon singleton n'est toujours pas chargé ...
Bon allez, je me décide à l'appeler ...
Construction du Singleton au premier appel
Et maintenant je l'affiche ...
Je suis le LazySingleton : demo.LazySingleton@7852e922
```

## Et depuis Java 5, ça donne quoi ?

Enfin, depuis Java 5, c'est à dire fin 2004, une éternité, un singleton peut s'implémenter au moyen d'une « enum ». Petite limitation dans ce cas : on ne peut pas en hériter, mais en a-t-on souvent besoin ?

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

## Et la « serialization » entre en jeu ...

Je n'ai pas non plus abordé un autre problème : souvent un Singleton a besoin d'être « Serializable », mais de fait, la déserialisation d'un singleton permet de créer plusieurs instances.
Ceci « casse » le principe du Singleton qui doit être unique.

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

Ce petit paragraphe sort du cadre de ce billet, puisque je ne souhaitais évoquer que le cas de Java SE et non pas Java EE.

Mais pour illustrer, et pour ceux qui connaissent, voici ce que sont chacune des servlets déclarées dans une WebApp Java : un singleton ! Et oui, *chaque Servlet est un singleton* ! Lazy de surcroit ! Ce qui vallait d'ailleurs au premier déclencheur (un navigateur via URL par exemple) d'avoir un temps d'attente un peu plus long que les clients suivants qui avaient alors la servlet de chargée en mémoire prête à répondre à la requête au moyen d'un Thread.

Idem pour les pages JSP, qui en plus passaient par une phase de compilation éventuelle, préalablement transformées en Servlet, toujours LAZY, car chargées seulement au premier appel.

Pour éviter ces effets d'attente et charger chaque servlet (singleton) dès le déploiement de l'application, le fameux :

```xml
<load-on-startup>1</load-on-startup>
```
Cette configuration de la servlet dans le `web.xml` permet ainsi de la passer en mode « EAGER » (inverse de LAZY).

## Un singleton ça offre quoi ?

Et mainteant que nous avons notre beau singleton, unique en mémoire, il faudrait quand même qu'il nous serve à quelque chose.

En général, on y conserve de l'information, partagée par l'ensemble des utilisateurs du système et/ou par l'ensemble des *threads*, accessible donc par n'importe quel code qu'il soit `static` ou d'instance au sein de méthodes.

Il faut donc faire très attention, tous les chargements, modifications, suppressions  d'informations doivent être *thread-safe* ! Cela dépasse un peu l'objectif de ce billet, mais il va vous falloir gérer la synchronisation avec des verrous, des `synchronized` ou, mieux, n'utiliser que des classes thread-safe et celles de la *concurrency API* comme par exemple :

- `AtomicInteger`
- `Lock` et `ReentrantLock`
- `Collections.synchronizedList()` ou `Collections.synchronizedMap()`
- etc.

## Et depuis Java 8 alors ?

Une question devrait vous tarauder :

> Mais jusqu'ici pourquoi avions besoin d'un Singleton en lieu de place de simples champs `static` ?
  
Il s'agit d'une question de zone de mémoire de la JVM. Sans rentrer dans trop de détails, il faut simplement savoir que jusqu'à Java 7 inclus, les classes et les type primitifs `static` ainsi que les références `static` à des instances étaient stockées dans la zone nommée *Permanent Generation Space*.

Cette zone était limitée au démarrage de JVM, et bien que paramétrable, elle ne pouvait pas s'étendre dynamiquement. Ainsi, il fallait prévoir au mieux : ni trop, ni trop peu. De plus, et il s'agit du point clé : il fallait optimiser cet espace en y mettant le moins d'éléments `static` posssible. D'où la nécessité d'un singleton avec comme seule partie `static`, la référence vers son instance.

Celà a conduit bon nombre de sites fonctionnant sous Java EE à observer le fameux `OutOfMemory : PermGen space`. On triturait alors quelques paramètres de JVM (`PermSize`, `MaxPermSize`), mais au fil des redéploiments d'applications (surtout en DEV), le *Permanent Generation Space* se saturait et il fallait tout vider en relançant le serveur d'applications et donc en redémarrant la JVM : PAS BIEN.

En Java 8, bim, paf, badaboum, adieu le *PermGen Space*, bienvenue au **Meta Space**.

Cette zone appartient désormais au HEAP. De ce fait, elle est aussi *garbage collectée* suivant différents algorithmes que le HEAP classique : il est nettoyé quand des classes de ne sont plus utilisées depuis un moment et les champs statiques sont libérés eux-aussi. La zone est de surcroit dynamique en terme de taille : finies les limitations. Donc un champ statique n'est plus coûteux « comme avant ».

Pourquoi alors s'enquiquiner avec un Singleton depuis Java 8 puisque maintenant que les champs statiques ne posent plus de problème ?

Voici un « vieux » singleton Java 7 et son adaptation Java 8 qui offrent les mêmes fonctionnalités, sans impact mémoire.

Version Java 7 et - :

```java
public class VisitCounter 
{
    // implémenté sous forme de singleton //

    private static VisitCounter singleton = new VisitCounter();

    private AtomicInteger visitCounter = new AtomicInteger();

    private VisitCounter() 
    {
       // protection 
    }

    public static VisitCounter getInstance()
    {
      return singleton;
    }

    public int getCounter()
    {
        return visitCounter.get();
    }

    public int increment()
    {
        return visitCounter.incrementAndGet();
    }
}
```

Version Java 8 et + :

```java
public final class VisitCounter
{
    private static AtomicInteger visitCounter = new AtomicInteger();

    public static int getCounter()
    {
        return visitCounter.get();
    }

    public static int increment()
    {
        return visitCounter.incrementAndGet();
    }
}
```

Il faut quand même préciser les inconvénients :

- les informations ne sont pas sérialisables ;
- les méthodes ne sont pas rédéfinissables.

Mais justement, c'est assez intéressant ! Bon nombre de vieux singleton offrant des services devraient se voir refactoriser de la sorte ! Simplicité, efficacité. Mais seulement en Java 8 et + !

## Grosse paresse ! (double lazyness)

On vient donc de voir que, par défaut, un singleton était « lazy » en Java. Pourquoi aller donc chercher encore plus loin la paresse avec la fameuse technique du **Holder interne** ?

Il peut arriver que l'on veuille un peu « discuter » avec le singleton avant le réel usage de celui-ci et donc économiser le RAM jusqu'au dernier moment.

Reprenons l'exemple précédent que ce soit en version singleton Java 7 et répose donc sur la définition d'une classe interne, chargée elle aussi par la JVM qu'à son premier appel, donc par le singleton lui-même, au moment des appels des méthodes « métiers » :

```java
public class VisitCounter 
{
    // implémenté sous forme de singleton //

    private static class Holder
    {
        private static final VisitCounter singleton = new VisitCounter();
    }

    private AtomicInteger visitCounter = new AtomicInteger();

    private VisitCounter() 
    {
       // protection 
    }

    public static Singleton getInstance()
    {
      return Holder.singleton;
    }

    public int getCounter()
    {
        return visitCounter.get();
    }

    public int increment()
    {
        return visitCounter.incrementAndGet();
    }
}
```

En Java 8, c'est même encore plus simple, puisque le Holder contient les champs « utiles » :

```java
public final class VisitCounter
{
    private static class Holder
    {
        private static final AtomicInteger visitCounter = new AtomicInteger();
    }

    public static int getCounter()
    {
        return Holder.visitCounter.get();
    }

    public static int increment()
    {
        return Holder.visitCounter.incrementAndGet();
    }
}
```

Ainsi un `VisitCounter.class`, ou une introspection de premier niveau de cette classe n'ira pas charger le Holder et donc n'ira pas initialiser les champs nécessaire au fonctionnement. D'ailleurs on peut mixer "lazy" classique, avec le holder pour les données les plus coûteuses.

J'appelle cela de la très grosse paresse ...

## Il faut conclure

Je viens d'écrire ce que je m'étais pourtant interdit de faire : un n-ième billet sur le Singleton en Java venant s'ajouter à la quantité déjà astronomique de ceux qui existent sur le net.

Ce qu'il faut retenir : vous n'aurez JAMAIS la garantie d'avoir une instance unique d'une classe en Java. Par introspection, par AOP, vous aurez toujours un moyen de casser l'unicité mémoire qu'on attend pourtant d'un singleton. Il suffit juste de faire un peu attention.

En guise de réelle conclusion, utilisez :

- `@ApplicationScoped` de CDI, que vous pouvez utiliser même en Java SE si vous prenez « Weld » dans vos dépendances ;
- `@Singleton` de la spec EJB en environnement Java EE et vous serez définitivement tranquille.

Mais, de grâce, arrêtez de faire du double-check locking ! A part des ennuis vous n'aurez rien à gagner !