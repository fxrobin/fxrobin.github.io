---
layout: post
title: Connaissez-vous vraiment bien l'instanciation en Java ?
subtitle: Afin de (re)découvrir quelques subtilités ...
logo: brain-logo.png
---

Ce court billet va vous présenter quelles instructions sont exécutées dans vos
classes, lorsque que vous en réclamez une instance.

## Que va-t-on tester ?

Une classe Java, que l'on souhaite pouvoir instancier, peut disposer :
* d'une et unique portion de code `static`;
* d'une et unique portion de code d'instance (si vous ne savez pas ce que c'est, l'exemple arrive ci-après ...) ; 
* d'un ou plusieurs constructeurs.

> Pour être un peu plus complet, une classe peut aussi contenir les éléments suivants, mais cet article **ne traite pas de leur instanciation** :
* une ou plusieurs classes embarquées statiques ;
* une ou plusieurs classes embarquées d'instance.

L'idée est donc de tester l'enchainement des lignes de codes lors du mécanisme d'instanciation, pourtant largement utilisé par tous !

## Le jeu de test

Nous avons à notre disposition deux classes : `Root` et `Child`.

Comme leur nom l'indique : `Child` hérite de `Root`, ce qui n'est pas toujours évident quand on implémente l'interface `Hallyday` (*humour ...*).

Pour faire plaisir à J-Jacques (qui cherche encore une `enum` dans cet article) et Mika, un petit diagramme UML : 

![UML](/images/instance-construction-mecanism/uml.png)

On peut difficilement faire plus simple ...

Voici le code source de la classe `Root`

```java
public class Root
{
	// <1>
	static
	{
		System.out.printf("static block : %s %n", Root.class);
	}
	
	// <2>
	{
		System.out.printf("Root instance block : %s %n",this.getClass());
	}
	
	// <3>
	public Root()
	{
		System.out.println("Root noargs constructor");
	}
}
```

On a rarement fait plus concis, mais cette classe n'est quand même pas banale, car elle dispose :

1. **d'une portion de code statique de classe**, déclenchée lors du chargement de la classe par le ClassLoader, à son premier appel ;
2. **d'une portion de code d'instance**, déclenchée avant les constructeurs de la classe ;
3. **d'un constructeur sans argument** (no comment, j'espère que vous savez quand même ce qu'est un constructeur ...)

Et voici le code source de la classe `Child` qui est implémentée sur le même principe que la classe `Root` **dont elle hérite**.

```java
public class Child extends Root
{
	static
	{
		System.out.printf("static block : %s %n", Child.class);
	}
	
	{
		System.out.printf("Child instance block : %s %n",this.getClass());
	}
	
	public Child()
	{
		System.out.println("Child noargs constructor");
	}
}
```

Seuls les différents affichages changent afin de pouvoir différencier l'exécution de telle ou telle 
portion de code.


## Au résultat de l'instanciation

Quand on instancie la classe avec le code suivant : `Child child = new Child()`, voici le résultat :

```
static block : class fr.fxjavadevblog.articles.Root			 
static block : class fr.fxjavadevblog.articles.Child		 
Root instance block : class fr.fxjavadevblog.articles.Child	 
Root noargs constructor										 
Child instance block : class fr.fxjavadevblog.articles.Child 
Child noargs constructor									 
```

Commentaires :

1. sans surprise, le bloc `static` de `Root` est exécuté en premier.
2. puis vient le tour du bloc `static` de `Child` : rien d'étonnant pour le moment.
3. puis c'est le bloc d'instance de `Root` alors que `this.getClass()` retourne bien `Child`. Et oui l'instance concrète courante est bien de type `Child` bien que le code soit présent dans la classe `Root`.
4. le constructeur sans argument de `Root` est déclenché. C'est intéressant, on est toujours pas passé dans le bloc d'instance de `Child`. Pour mémoire, le constructeur par défaut d'une classe mère est toujours appelé implicitement quand aucun autre constructeur `super(args...)` n'est invoqué de manière explicite.
5. le voilà maintenant exécuté notre bloc d'instance de `Child`, **intercallé** donc entre le constructeur sans argument de `Root` et son propre constructeur.
6. Enfin, pour terminer, le constructeur sans argument de `Child` ferme la marche ... Il était temps !

> "Etonnant non" ? Pierre Desprogres, Dix minutes nécessaires de M. Cyclopède.

<iframe class="video mini" width="560" height="315" src="https://www.youtube.com/embed/zcIa4wP-wtA?rel=0&amp;start=4" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>

   
