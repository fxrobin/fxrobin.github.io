---
layout: post
title: Préconditions des méthodes d'une API
subtitle: Parce qu'il faudrait toujours vérifier les arguments
logo: api-preconditions.png
category: JAVA
tags: [Java, Guava, Apache Preconditions, Spring, Bean Validation, CleanCode, JAX-RS, REST]
---

<div class="intro" markdown='1'>
Comme tout système s’appuyant sur des *inputs*, il est très important de contrôler les arguments des méthodes quand on élabore une API, qu’elle soit locale sous forme de JAR ou distante via un service REST, afin de non seulement la rendre plus robuste et stable mais aussi de se prémunir de certaines attaques.

Cependant, en Java *de base*, c'est particulièrement laborieux, rébarbatif et cela engendre une fainéantise exacerbée. Conséquences directes et désastreuses : baisse de la qualité, de la robustesse du code et créations potentielles de **failles de sécurité**.

Cet article *tente* de faire le tour de la question, sans prétention, en ratissant assez large. C'est à dire en 
allant de *Java classique* jusqu'à *Bean Validation* et JAX-RS, en passant par une implémentation spécifique "*Faite Maison*".
</div>

<!--excerpt-->

## La problématique

Partons du principe que nous devons coder une méthode, accessible depuis du code tiers sous forme d'API.

Cette méthode acceptera quatre arguments :
* **un nom** exprimé en majuscules, sans espaces, ni caractères spéciaux ;
* **un âge** entre 0 et 150 ans
* **une image PNG** contenue dans un tableau de byte ;
* **une liste de compétences**, sous formes de chaines de caractères.

Ce gentil monsieur représentera notre jeu de test :

* **nom** : WAYNE (J'espère ne pas trahir un secret ... j'ai un doute)
* **age** : 35 ans (à vue de nez ...)
* **photo** : une image au format PNG (format préconisé par la league des justiciers)
* **liste de compétences** :
  * NINJA,  
  * HACKING
  * JUSTICE
  * GROSSE BAFFE 
  * BOOMERANG
  * CLUEDO LE WEEK-END AVEC ALFRED

![&copy; DC Comics and Time Warner Company](/images/preconditions/batman.jpg)

> Il ne faut pas être mentaliste pour se rendre compte qu'on a intérêt à bien valider les informations pour qu'il soit content !
> Il n'a pas l'air commode ...

> Image : &copy; DC Comics and Time Warner Company

Dans cet article, on va tester donc :

* Java assert
* Apache Commons Lang
* Guava
* Spring
* Better Preconditions
* Java 8 Objects
* **Une solution perso** (bien que j'évite d'en faire en temps normal)
* Bean Validation

On terminera avec une mise en pratique avec JAX-RS :

* avec la solution "faite-maison"
* avec Bean Validation

Puis on concluera avec quelques réflexions et points d'attention supplémentaires.

## Factorisation : éléments communs

### Vérification d'une image PNG

Globalement, tous ces cas de figure auront besoin à un moment ou à un autre de vérifier
qu'un tableau d'octets `byte[]` contient bien une image PNG.

Ici, on descend "bas niveau" afin de vérifier une simple séquence d'octets qui réprésentent
la signature d'un fichier PNG :

```java
package fr.fxjavadevblog.demo;

import java.util.Arrays;

public final class ValidationUtils
{
	public static byte[] PNG_SIGNATURE = new byte[] { (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A };
	
	private ValidationUtils()
	{
		// protection de cette classe utilitaire.
	}
	
	/**
	 * vérifie que le tableau d'octets contient bien la signature PNG.
	 * 
	 * @param data
	 * 		tableau d'octets à tester
	 * @return
	 * 		true si la signature PNG est trouvée, false dans le cas contraire.
	 */
	public static boolean isPngData(byte[] data)
	{
		return Arrays.equals(PNG_SIGNATURE, Arrays.copyOf(data, PNG_SIGNATURE.length));
	}
	
	/**
	 * vérifie que la référence désigne bien un tableau d'octets et que celui-ci
	 * contient bien la signature PNG.
	 * 
	 * @param data
	 * 		référence potentielle vers un tableau d'octets
	 * @return
	 * 		true si la signature PNG est trouvée, false dans le cas contraire
	 */
	public static boolean isPngData(Object data)
	{
		return (data instanceof byte[] && ValidationUtils.isPngData((byte[]) data));
	}
}
```

Ces méthodes seront appelées, voire implémentées au moyen d'une expression lambda ou désignées par une référence de méthode, au moment opportun.

### Messages d'erreurs

Tous les messages seront conservés sous forme de constantes. Je suis un peu fainéant sur ce coup, il me faudrait faire un `bundle i18n` ... mais ce n'est pas trop l'objet de cet article.

> En espérant que Mickaël Baron dans l'oreillette ne me dise pas que j'aurais vraiment dû le faire :-)

```java
package fr.fxjavadevblog.resources;

/**
 * contient les chaines de formatage des messages.
 *
 * @author fxjavadevblog
 *
 */
public final class PreconditionsMessages
{
	public static final String MSG_NOT_NULL = "L'argument %s ne peut pas être null";
	public static final String MSG_MAJUSCULES = "L'argument %s doit être écrit en majuscules";
	public static final String MSG_IMAGE_PNG = "L'argument %s doit être  une image PNG valide";
	public static final String MSG_AGE_ENTRE = "L'argument %s doit être  %d et %d";
	
	private PreconditionsMessages()
	{
		// protection
	}
}
```

Quelques règles "métier" seront déportées, accessibles via la classe `PreconditionsRules" ci-dessous :

```java
package fr.fxjavadevblog.resources;

/**
 * contient constantes globales utilisées pour valider
 * les données en arguments de méthodes.
 *
 * @author fxjavadevblog
 *
 */
public final class PreconditionsRules
{
	public static final int AGE_MIN = 0;
	public static final int AGE_MAX = 150;
	public static final String REGEXP_MAJUSCULES = "[A-Z]*";

	private PreconditionsRules()
	{
		// protection
	}
}
```

et enfin, comme on voudra désigner une exception par référence de méthode (vers un constructueur),
il nous en faut une de type `RuntimeException` :

```java
import static fr.fxjavadevblog.resources.PreconditionsMessages.MSG_RANGE_PATTERN;
import static fr.fxjavadevblog.resources.PreconditionsRules.AGE_MAX;
import static fr.fxjavadevblog.resources.PreconditionsRules.AGE_MIN;


@SuppressWarnings("serial")
public class AgeException extends RuntimeException
{
	public AgeException(String argumentName, Integer argumentValue)
	{
		super(String.format(MSG_RANGE_PATTERN, argumentName , argumentValue, AGE_MIN, AGE_MAX));
	}
}
```



## La manière classique en JAVA

On commence donc par la version "Java Classique" :

```java
public static void executeOldSchoolJava(String name, Integer age, byte[] photo, Collection<String> competences)
{
	if (name == null)
	{
		throw new IllegalArgumentException(String.format(MSG_NOT_NULL, "name"));
	}

	if (!pattern.matcher(name).matches())
	{
		throw new IllegalArgumentException(String.format(MSG_UPPER_CASE, "name"));
	}

	if (age == null)
	{
		throw new IllegalArgumentException(String.format(MSG_NOT_NULL, "age"));
	}
		
	if (age <= AGE_MIN && age >= AGE_MAX)
	{
		throw new IllegalArgumentException(String.format(MSG_RANGE_PATTERN, "age", AGE_MIN, AGE_MAX));
	}

	if (photo == null)
	{
		throw new IllegalArgumentException(String.format(MSG_NOT_NULL, "photo"));
	}

	if (!ValidationUtils.isPngData(photo))
	{
		throw new IllegalArgumentException(String.format(MSG_NOT_PNG_IMAGE, "photo"));
	}

	if (competences == null || competences.isEmpty())
	{
		throw new IllegalArgumentException(String.format(MSG_NOT_EMPTY_COLLECTION, "competences"));
	}

	// log.info("Toutes les préconditions sont passées");
}
```

On est d'accord, c'est long et ennuyant ... voire carrément lourdingue, pour ne pas dire pire.

Qu'existe-t-il pour nous faciliter tout cela ? 

## Solutions

### Java assert

Soyons succincts : **cette technique est déconseillée**. Elle ne peut être utilisée que pour une phase expérimentale et requiert un paramètre de JVM au lancement de l'application pour être prise en compte.

De plus, cette solution est assez limitée. On oublie : chaînes de formatage `String.format`, lazy instanciation avec lambda, etc.

J'en parle parce qu'il le faut, mais volontairement je ne donnerai pas d'exemple.


### Apache Commons Lang

C'est à mon sens **LA** bibliothèque la plus fournie pour les tests des arguments. Elle existe depuis 2003, avec sa classe `Validate`.

Néanmoins, conçue avant Java 8, elle n'offre aucune intégration de lambdas ni  de références de méthodes. Elle permet la concaténation a posteriori de style `String.format` ou `printf`, ce qui est une bonne optimisation.

Pour l'utiliser, il suffit de déclarer la dépendance MAVEN suivante :

```xml
<dependency>
  <groupId>org.apache.commons</groupId>
  <artifactId>commons-lang3</artifactId>
  <version>3.7</version>
</dependency>
```

Exemple :

```java
public static void executeApacheCommonsLang(String name, Integer age, byte[] photo, Collection<String> competences)
{
	Validate.notNull(name, MSG_NOT_NULL, "name");
	Validate.matchesPattern(name, REGEXP_MAJUSCULES, MSG_UPPER_CASE, "name");
	Validate.notNull(age, MSG_NOT_NULL, "age");
	Validate.inclusiveBetween(AGE_MIN, AGE_MAX, age.intValue());
	Validate.notNull(photo, MSG_NOT_NULL, "photo");
	Validate.isTrue(ValidationUtils.isPngData(photo), MSG_NOT_PNG_IMAGE, "photo");
	Validate.notNull(competences, MSG_NOT_NULL, "competences");
	Validate.notEmpty(competences);
	
	// ici, toutes les vérifications sont passées.
}
```


### Guava

La classe `Preconditions` de Guava existe depuis 2010. Historiquement elle faisait partie de leur ancien projet *Google Collection Library* datant de 2009.

Cette solution est très certainement la plus proche de ce qui me serait utile, mais elle ne dispose pas de support de lambda et donc d'instanciation lazy des exceptions à lever, par exemple.

Elle permet toutefois d'éviter la concaténation directe des chaînes au moyen de chaînes de formatage et d'arguments, comme l'offre `String.format` ou `printf`.

Pour l'utiliser, il suffit de déclarer la dépendance MAVEN suivante :

```xml
<dependency>
  <groupId>com.google.guava</groupId>
  <artifactId>guava</artifactId>
  <version>25.0-jre</version>
</dependency>
```

Exemple :

```java
public static void executeGuava(String name, Integer age, byte[] photo, Collection<String> competences)
{
	Preconditions.checkNotNull(name, MSG_NOT_NULL, "name");
	Preconditions.checkNotNull(age, MSG_NOT_NULL, "age");
	Preconditions.checkNotNull(photo, MSG_NOT_NULL, "photo");
	Preconditions.checkArgument(pattern.matcher(name).matches(), REGEXP_MAJUSCULES, MSG_UPPER_CASE, "name");
	Preconditions.checkArgument(age >= AGE_MIN && age <= AGE_MAX, MSG_RANGE_PATTERN, "age", age, AGE_MIN, AGE_MAX);
	Preconditions.checkArgument(ValidationUtils.isPngData(photo), MSG_NOT_PNG_IMAGE, "photo");
	Preconditions.checkNotNull(competences, MSG_NOT_NULL, "competences");
	Preconditions.checkArgument(competences.size() > 0, MSG_NOT_EMPTY_COLLECTION, "competences");
}
```

### Spring

Spring offre de quoi valider les arguments aussi depuis la version 1.0 de 2004 !

Depuis la version 5, chaque méthode de vérification se voit surchargée avec la capacité de fournir un `Supplier<String>`, donc une lambda qui fournira une chaîne seulement si le test de validation échoue. C'est ce comportement qui est le plus optimisé et que je recherche, mais il ne prend pas de référence vers des constructeurs d'`Exception`.

De plus, Spring 5 ne propose pas le formatage `String.format` ou `printf`. Dommage !

Pour l'utiliser, il suffit de déclarer la dépendance MAVEN suivante :

```xml
<dependency>
  <groupId>org.springframework</groupId>
  <artifactId>spring-core</artifactId>
  <version>5.0.5.RELEASE</version>
</dependency>
```

Exemple :

```java
public static void executeSpringFramework(String name, Integer age, byte[] photo, Collection<String> competences)
{
	Assert.notNull(name, () -> String.format(MSG_NOT_NULL, "name"));
	Assert.notNull(age, () -> String.format(MSG_NOT_NULL, "age"));
	Assert.notNull(photo, () -> String.format(MSG_NOT_NULL, "photo"));
	Assert.notNull(competences, () -> String.format(MSG_NOT_NULL, "competences"));
	Assert.isTrue(pattern.matcher(name).matches(), () -> String.format(MSG_UPPER_CASE, "name"));
	Assert.isTrue(age >= AGE_MIN && age <= AGE_MAX, () -> String.format(MSG_RANGE_PATTERN, "age", age, AGE_MIN, AGE_MAX));
	Assert.isTrue(ValidationUtils.isPngData(photo), () -> String.format(MSG_NOT_PNG_IMAGE, "photo"));
	Assert.notEmpty(competences, () -> String.format(MSG_NOT_EMPTY_COLLECTION, "competences"));
}
```

Clairement, bien qu'il y ait la possibilité de désigner des lambdas, c'est à mon sens la moins agréable à utiliser.


### Better Preconditions

Petite coquette bibliothèquounette très intéressante sur son approche au moyen d'une API fluent que j'ai pu dénicher au hasard de mes recherches sur GitHub.

Il manque cependant des choses primordiales comme la validation avec une regexp ou simplement un test booléen.

L'API n'exploite pas JAVA 8 et utilise Joda Time pour les dates, par exemple.

```xml
<dependency>
  <groupId>com.github.choonchernlim</groupId>
  <artifactId>better-preconditions</artifactId>
  <version>0.1.1</version>
</dependency>
```

Exemple :

```java
public static void executeBetterPreconditions(String name, Integer age, byte[] photo, Collection<String> competences)
{
	PreconditionFactory.expect(name).not().toBeNull().check();
	PreconditionFactory.expect(age).not().toBeNull().toBeEqualOrGreaterThan(AGE_MIN).toBeEqualOrLessThan(AGE_MAX).check();
	PreconditionFactory.expect(photo).not().toBeNull().check();
	PreconditionFactory.expect(competences).not().toBeEmpty();
	// TODO : créer des custom matcher pour les actions plus "particulières".
}
```

En fait, si j'avais un peu de temps à consacrer à un projet sympa, je pense que je le *forkerais* pour en faire une version Java 8 avec support de lambda.

Niveau performances, rien de notable, aucune dégradation constatée même après un tir de 10000 tests.

A noter qu'il faut implémenter une interface `Matcher<V>` pour les tests plus élaborés. Par exemple en l'état pas évident de tester le nom avec une expression régulière ni le contenu du tableau d'octets.


### Java 8 Objects

Enfin, Java 8 arrive avec sa classe `Objects` avec quelques méthodes pour valider.

Extrait de la JAVADOC de la classe `Objects` et de sa méthode `requireNonNull` :

```java
public Foo(Bar bar, Baz baz) {
     this.bar = Objects.requireNonNull(bar, "bar must not be null");
     this.baz = Objects.requireNonNull(baz, "baz must not be null");
}
```

Intéressant, mais beaucoup trop limité, bien qu'elle puisse prendre un `Supplier<String>` comme message. On utilise en fait la classe `Objects` plutôt dans des `filter(Objects::nonNull)` dans l'API Stream de JAVA 8.

Donc, cela ne répond pas au besoin en l'état.

### Preconditions "Fait maison"

Le "fait maison", sauf au restaurant, en général j'évite : je fais une entorse à ce principe quand je ne trouve vraiment rien qui me convienne et c'est malheureusement le cas avec toutes les solutions décrites si dessus.

En effet, ces librairies n'exploitent pas la puissance des expressions lambdas et notamment des références de méthodes et constructeurs, ou quand elle le font, elles ne le permettent pas au bon endroit.

Impossible par exemple de désigner le constructeur d'une exception pour qu'elle soit instanciée a posteriori, ou encore de produire une chaîne avec du formatage type "printf" ou "String.format", ou encore, et c'est le plus important de déclencher a posteriori les expressions booléennes ou des prédicats.

Il faut donc un mix entre toutes ces solutions : *notre propre "bibliothèque"*.

> bibliothèque est un bien grand mot car cela va se résumer à une seule classe !

Donc c'est parti, j'ai décidé de ne pas en faire une API *fluent*, malgré l'envie, pour des raisons de performances supposées : je souhaite éviter l'instanciation d'objets pendant cette phase pour ne pas surcharger le Garbage Collector.

Grosso modo, cela va ressembler à Apache Commons Lang Validation avec ce qui lui manque de prise en compte des lambdas.

Dans un premier temps, la solution permettra de faire les tests suivants, en liaison avec mon besoin immédiat :

* non nullité d'un argument,
* une plage de valeurs d'entiers,
* *matching* d'une expression régulière,
* test booléen standard et par Supplier<Boolean> ainsi que par Predicate<T>,
* désignation par référence et déclenchement d'une exception,
* collection non vide.

Usage :

```java
public static void executeHomeMadePreconditions(String name, Integer age, byte[] photo, Collection<String> competences)
{
	Checker.notNull(name, MSG_NOT_NULL, "name");
	Checker.notNull(age, MSG_NOT_NULL, "age");
	Checker.notNull(photo, MSG_NOT_NULL, "photo");
	Checker.respects(name, pattern, MSG_UPPER_CASE, "name");
	Checker.inRange(age, AGE_MIN, AGE_MAX, AgeException::new, "age");
	Checker.respects(photo, ValidationUtils::isPngData, MSG_NOT_PNG_IMAGE, "photo");
	Checker.notEmpty(competences, MSG_NOT_EMPTY_COLLECTION, "competences");
}
```

Voici le code source de la classe Checker (seule et unique classe) utilisée ci-dessus :

```java
package fr.fxjavadevblog.preconditions;

import java.util.Collection;
import java.util.Map;
import java.util.Map.Entry;
import java.util.function.BiFunction;
import java.util.function.BooleanSupplier;
import java.util.function.Function;
import java.util.function.Predicate;
import java.util.regex.Pattern;

/**
 * cette classe est responsable du test de validité d'arguments en fonction de
 * contraintes.
 * 
 * @author fxjavadevblog
 *
 */
public final class Checker
{
	/**
	 * vérifie que la référence n'est pas nulle. Si elle l'est, une exception de
	 * type "IllegalArgumentException" est levée avec le message (format et
	 * arguments) passé en paramètres.
	 * 
	 * @param arg
	 *            référence à tester
	 * @param format
	 *            chaine de formatage
	 * @param vals
	 *            valeurs à injecter dans la chaine de formatage
	 * 
	 * @see String#format(String, Object...)
	 * @see IllegalArgumentException
	 */
	public static void notNull(Object arg, String format, Object... vals)
	{
		if (arg == null)
		{
			throw new IllegalArgumentException(String.format(format, vals));
		}
	}

	/**
	 * vérifie que la référence n'est pas nulle. Si elle l'est, le supplier
	 * d'IllegalArgumentException est invoqué, et le message est fourni à la
	 * construction de l'exception. Enfin, l'exception est levée.
	 * 
	 * @param arg
	 *            référence à tester
	 * @param exceptionSupplier
	 *            supplier d'IllegalArgumentException
	 * @param argName
	 *            message à fournir à l'exception
	 * 
	 * @see IllegalArgumentException
	 */
	public static void notNull(Object arg, Function<String, IllegalArgumentException> exceptionSupplier, String argName)
	{
		if (arg == null)
		{
			throw exceptionSupplier.apply(argName);
		}
	}


	/**
	 * vérifie que l'argument se situe bien sans une plage de valeurs Integer.
	 * 
	 * @param arg
	 * 		 argumenter à tester
	 * @param min
	 * 		valeur minimale incluse
	 * @param max
	 * 		valeur maximale incluse
	 * @param msgRangePattern
	 *  	format message en cas d'erreur (voir String.format)
	 * @param argName
	 * 		 nom de l'argument testé
	 */
	public static void inRange(Integer arg, int min, int max, String msgRangePattern, String argName)
	{
		if (arg == null || arg < min || arg > max)
		{
			throw new IllegalArgumentException(String.format(msgRangePattern, argName, arg, min, max));
		}
	}

	/**
	 * vérifie que l'argument se situe bien sans une plage de valeurs Integer.
	 * Cette méthode permet de désigner une exception, pour la démo (à compléter dans les autres méthodes).
	 * 
	 * @param arg
	 * 		 argumenter à tester
	 * @param min
	 * 		valeur minimale incluse
	 * @param max
	 * 		valeur maximale incluse
	 * @param function
	 * 		function lambda prenant une chaine de caractères et un entier 
	 * 		et retournant une instance de RuntimeException. Permet de désigner une exception
	 * 		notamment avec l'un des ses constructeurs. 
	 * @param argumentName
	 */
	public static void inRange(Integer arg, 
								 int min, 
								 int max, 
								 BiFunction<String, Integer, ? extends RuntimeException> function, 
								 String argumentName)
	{
		if (arg == null || arg < min || arg > max)
		{
			throw function.apply(argumentName, arg);
		}
	}

	/**
	 * vérifie qu'une collection n'est ni nulle, ni vide.
	 * 
	 * @param competences
	 *            collection à tester
	 * @param format
	 *            format message en cas d'erreur (voir String.format)
	 * @param vals
	 *            valeurs à injecter dans le format de message
	 * 
	 * @see String#format(String, Object...)
	 * @see IllegalArgumentException
	 */
	public static void notEmpty(Collection<?> competences, String format, Object... vals)
	{
		if (competences == null || competences.isEmpty())
		{
			throw new IllegalArgumentException(String.format(format, vals));
		}
	}

	/**
	 * vérifie qu'une chaine de caractères respecte bien une expression
	 * régulière définie dans un Pattern.
	 * 
	 * @param data
	 *            chaine à tester
	 * @param pattern
	 *            expression régulière
	 * @param format
	 *            format message en cas d'erreur (voir String.format)
	 * @param vals
	 *            valeurs à injecter dans le format de message
	 * 
	 * @see String#format(String, Object...)
	 * @see IllegalArgumentException
	 */

	public static void respects(String data, Pattern pattern, String format, Object... vals)
	{
		if (!pattern.matcher(data).matches())
		{
			throw new IllegalArgumentException(String.format(format, vals));
		}
	}

	/**
	 * vérifie que l'expression booléen "predicate" est bien à true, sinon une
	 * exception "IllegalException" est levée avec le message fourni.
	 * 
	 * @param predicate
	 *            expression booléenne.
	 * @param format
	 *            format message en cas d'erreur (voir String.format)
	 * @param vals
	 *            valeurs à injecter dans le format de message
	 * 
	 * @see String#format(String, Object...)
	 * @see IllegalArgumentException
	 */
	public static void respects(boolean predicate, String format, Object... vals)
	{
		if (!predicate)
		{
			throw new IllegalArgumentException(String.format(format, vals));
		}
	}

	/**
	 * vérifie que l'expression booléenne évaluée a posteriori par le
	 * BooleanSupplier fourni en paramètre retorune bien à true, sinon une
	 * exception "IllegalException" est levée avec le message fourni.
	 * 
	 * @param predicate
	 *            supplier d'expression booléene.
	 * @param format
	 *            format message en cas d'erreur (voir String.format)
	 * @param vals
	 *            valeurs à injecter dans le format de message
	 * 
	 * @see String#format(String, Object...)
	 * @see IllegalArgumentException
	 */
	public static void respects(BooleanSupplier predicate, String format, Object... vals)
	{
		if (!predicate.getAsBoolean())
		{
			throw new IllegalArgumentException(String.format(format, vals));
		}
	}

	/**
	 * vérifie que la référence, confrontée au prédicat, retourne true, sinon
	 * une exception "IllegalException" est levée avec le message fourni.
	 * 
	 * @param predicate
	 *            prédicat prenant un type T et qui contient la logique "true"
	 *            ou "false".
	 * @param format
	 *            format message en cas d'erreur (voir String.format)
	 * @param vals
	 *            valeurs à injecter dans le format de message
	 * 
	 * @see String#format(String, Object...)
	 * @see IllegalArgumentException
	 */
	public static <T> void respects(T t, Predicate<T> predicate, String format, Object... vals)
	{
		if (!predicate.test(t))
		{
			throw new IllegalArgumentException(String.format(format, vals));
		}
	}
	
	/**
	 * vérifie que la référence, confrontée au prédicat, retourne true, sinon
	 * une exception "IllegalException" est levée avec le message fourni.
	 * 
	 * @param predicate
	 *            prédicat prenant un type T et qui contient la logique "true"
	 *            ou "false"
	 * @param function
	 * 			function lambda prenant le nom de l'argument testé et un T 
	 * 			qui retourne une instance de RuntimeException. Permet de désigner une exception
	 * 			notamment avec l'un des ses constructeurs. 
	 * 			
	 * @param argumentName
	 * 			nom de l'argument testé
	 *
	 *	@see IllegalArgumentException
	 */
	
	public static <T> void respects(T t, Predicate<T> predicate,  BiFunction<String, T, ? extends RuntimeException> function, String argumentName)
	{
		if (!predicate.test(t))
		{
			throw function.apply(argumentName, t);
		}
	}

	/**
	 * vérifie qu'aucune valeur de la Map ne fasse référence à "null", sinon une
	 * exception de type IllegalArgumentException est levée avec le message
	 * fourni.
	 * 
	 * Le message devra prendre forcément un "%s" en entrée pour faire référence
	 * à la clé de la Map dont la valeur associée est nulle.
	 * 
	 * @param arguments
	 *            map à tester
	 * 
	 * @param format
	 *            chaine de formatage du message.
	 * 
	 */
	public static void notAnyNullValue(Map<?, ?> arguments, String format)
	{
		for (Entry<?, ?> e : arguments.entrySet())
		{
			if (e.getValue() == null)
			{
				throw new IllegalArgumentException(String.format(format, e.getKey()));
			}
		}
	}

}
```

Biensûr, ici il ne s'agit que d'un embryon du début d'un commencement d'un prémice de classe utilitaire. Mais cela donne une bonne idée du cadre qui est offert et, en l'état, offre déjà beaucoup de souplesse, notamment grâce au `Predicate<T>`.

Je vais commenter toutefois l'une des méthodes de cette classe qui est, à mon sens, la plus intéressante :

```java
public static <T> void respects(T t, 
								Predicate<T> predicate,  
								BiFunction<String, T, ? extends RuntimeException> function, 
								String argumentName)
{
	if (!predicate.test(t))
	{
		throw function.apply(argumentName, t);
	}
}
```

De prime abord, cette méthode attend pas mal de choses pour fonctionner : elle devrait elle-même contrôler ses arguments ... mais je ne le fais pas pour être un peu plus concis dans cet article déjà bien long.

En regardant la signature de la méthode, voici quelques éléments de compréhension :

* `<T>` : type générique qui représentera le type de l'argument testé et par conséquent `t` est la valeur de l'argument.
* `Predicate<T> predicate` interface fonctionnelle capable de tester un `<T>` et le fait que sa valeur soit correcte. Un `Predicate` retourne toujours `true` ou `false`.
* `BiFunction<String, T, ? extends RuntimeException> function` : cela peut paraitre complexe, mais permet de désigner une interface fonctionnelle prenant un `String` (le nom de l'argument) et un `T` (la valeur de l'argument) et retournant une instance d'une classe héritant directement ou indirectement de RuntimeException. Cela permettra de désigner `AgeException::new` par exemple car son constructeur est le suivant pour mémoire : `public AgeException(String, Integer)`.

### Bean Validation

Petit détour avec une API de "haut niveau" mais trop peu utilisée à mon goût.

![ring](/images/preconditions/ring.jpg)

> Ambiance ring de boxe : Et voici **Beeeeeaaaan Vaaaaalidationnnnnn** !

> Image: [Panza Kick Boxing](https://fr.wikipedia.org/wiki/Panza_Kick_Boxing) &copy; Loriciels 1990 - Futura, Pascal Jarry, Marco de Flores.

**Bean Validation** permet de placer des annotations de validation de valeur sur des attributs ou des arguments. C'est une spécification extensible dont l'implémentation de référence est **Hibernate Validator**.

> J'adore cette spec. Elle est vraiment très puissante. Elle s'intègre parfaitement à un ensemble conséquent d'autres specs de Java EE, comme notamment JPA, JSF, EJB, CDI. De plus elle est extensible aussi bien par annotation que par programmation ... Si vous ne connaissez pas Bean Validation, je vous recommande de jeter un coup d'oeil rapide sachant qu'on peut l'utiliser aussi en Java SE.

Pour l'utiliser :

```xml
<dependency>
	<groupId>org.hibernate.validator</groupId>
	<artifactId>hibernate-validator</artifactId>
	<version>6.0.9.Final</version>
</dependency>
```

L'idée est d'encapsuler les arguments dans une classe spécifique et de la confronter en validation avant usage.

Voici ce qui va permettrer de déclencher Bean Validation :

```java
/**
 * permet de déclencher une validation via BeanValidation.
 * 
 * @author fxjavadevblog
 *
 */
public class BeanValidationChecker
{
	// instanciation en EAGER d'un validator BeanValidation.
	private static Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

	/**
	 * lance une validation sur l'objet data, potentiellement annoté avec des
	 * contraintes BeanValidation.
	 * 
	 * Les contraintes violées sont aggrégées aux sein d'une et une seule
	 * "IllegalArgumentException".
	 * 
	 * @param data
	 *            instance à tester.
	 */
	public static <T> void check(T data)
	{
		Set<ConstraintViolation<T>> violations = validator.validate(data);
		if (!violations.isEmpty())
		{
			StringBuilder sb = new StringBuilder();
			violations.forEach(v -> sb.append(v.getMessage()).append("\n"));
			throw new IllegalArgumentException(sb.toString());
		}
	}

}
```

Ensuite voici la classe qui encapsulera les arguments (utilisation de Lombok ici, juste pour plus de concision) :

```java
@Getter
@AllArgsConstructor
protected static class InputData
{
	@NotNull
	@NotEmpty
	@Pattern(regexp = PreconditionsMessages.REGEXP_MAJUSCULES)
	private String name;

	@NotNull
	@Min(0)
	@Max(150)
	private Integer age;

	@NotNull
	@PngData
	private byte[] photo;

	@NotNull
	@NotEmpty
	private Collection<String> competences;
}
```

Voici la création de l'annotation "@PngData"  :

```java
package fr.fxjavadevblog.demo;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import javax.validation.Constraint;
import javax.validation.Payload;

@Constraint(validatedBy = { PngDataValidator.class })
@Target({ ElementType.FIELD, ElementType.PARAMETER })
@Retention(value = RetentionPolicy.RUNTIME)
@Documented
public @interface PngData
{
	String message() default "Invalid PNG data";

	Class<?>[] groups() default {};

	Class<? extends Payload>[] payload() default {};
}
```

Et voici son ConstraintValidator associé :

```java
package fr.fxjavadevblog.demo;

import javax.validation.ConstraintValidator;
import javax.validation.ConstraintValidatorContext;

public class PngDataValidator implements ConstraintValidator<PngData, Object>
{
	@Override
	public boolean isValid(Object arg, ConstraintValidatorContext arg1)
	{
		if (arg instanceof byte[])
		{
			byte[] data = (byte[]) arg;
			return ValidationUtils.isPngData(data);
		}
		else
		{
			return false;
		}
	}
}
```

et enfin l'usage :

```java
public static void executeBeanValidation(String name, Integer age, byte[] photo, Collection<String> competences)
{
	InputData input = new InputData(name, age, photo);
	BeanValidationChecker.check(input);

	// c'est court ! Mais ça fonctionne parfaitement
}
```

## REST : JAX-RS et Bean Validation

On pose le décor : JAX-RS est une spécification, incluse dans Java EE, capable de motoriser simplement une API que l'on souhaite exposer sous forme REST.

Soyons succinct : **JAX-RS est capable déclencher des annotations Bean Validation** !

> Trop classe !

On passe à la démo avec d'abord un extrait du POM :

```xml
...

<packaging>war</packaging>

<properties>
	<project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
	<maven.compiler.target>1.8</maven.compiler.target>
	<maven.compiler.source>1.8</maven.compiler.source>
	<failOnMissingWebXml>false</failOnMissingWebXml>
</properties>

<dependencies>
	<dependency>
		<groupId>javax</groupId>
		<artifactId>javaee-api</artifactId>
		<version>8.0</version>
		<scope>provided</scope>
	</dependency>
	<dependency>
		<groupId>org.projectlombok</groupId>
		<artifactId>lombok</artifactId>
		<version>1.16.20</version>
	</dependency>	
	...
</dependencies>	
```

On dépend donc de Java EE 8 qui sera motorisé dans mon cas par OpenLiberty mais cela n'a pas d'incidence sur le développement.

On déclare le endpoint global JAX-RS :

```java
@ApplicationPath("/bat-api")
public class BatCaveSystem extends Application
{
    // vide ! et oui, rien à faire de spécial ici.
}
```

Comme je vais fournir une API REST sur le backend de SI de Bruce au manoir Wayne, je nomme donc l'url `/bat-api`. Bruce souhaite pouvoir envoyer un nom et un âge, et que les information en entrée soient validées. C'est un peu idiot, mais comme c'est Bruce Wayne, et bien on obéit ...

### JAX-RS et Checker "fait maison"

Pour des raisons de concision, je restreins le champ d'étude à deux types d'arguments : le nom et l'age.

Le contrôle des entrées est réalisé avec le `Checker` présenté précédemment :

```java
@Path("/directory")
public class BatCaveDirectory
{
	private static java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("[A-Z]*");

	@POST
	@Path("/add")
	public Response add(String name, Integer age)
	{
		Checker.notNull(name, MSG_NOT_NULL, "name");
		Checker.notNull(age, MSG_NOT_NULL, "age");
		Checker.respects(name, pattern, MSG_UPPER_CASE, "name");
		Checker.inRange(age, AGE_MIN, AGE_MAX, AgeException::new, "age");
		
		System.out.printf("Name : %s %n", name); // bouhh les sysout moches !
		System.out.printf("Age : %d %n", age);   // un peu fainéant, je l'avoue !
		
		return Response.ok(LocalDateTime.now().toString()).build();
	}
}
```

### JAX-RS et Bean Validation

Voici donc le moyen de contrôler tout cela en JAX-RS avec Bean Validation :

```java
@Path("/directory")
public class BatCaveDirectory
{
	@POST
	@Path("/add")
	public Response add(@FormParam(value = "name") String name, 
						@FormParam(value = "age") @Min(0) @Max(150) Integer age)
	{
		System.out.printf("Name : %s %n", name);
		System.out.printf("Age : %d %n", age);
		
		return Response.ok(LocalDateTime.now().toString()).build();
	}
}
```

Afin d'avoir un retour "lisible" en cas d'erreur, il faut coder un `ExceptionManager` :

```java
package fr.fxjavadevblog.demo;

import java.util.List;
import java.util.stream.Collectors;

import javax.validation.ConstraintViolation;
import javax.validation.ConstraintViolationException;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.ext.ExceptionMapper;
import javax.ws.rs.ext.Provider;

import lombok.Data;
import lombok.Builder;

/**
 * gestionnaire d'exception specifique pour JAX-RS.
 *
 * source : https://stackoverflow.com/questions/44308101/customizing-jax-rs-response-when-a-constraintviolationexception-is-thrown-by-bea
 * 
 */


@Provider
public class ConstraintViolationExceptionMapper implements ExceptionMapper<ConstraintViolationException>
{
	// classe interne qui détient les erreurs de validation, usage de Lombok au passage
	@Data
	@Builder
	public static class ValidationError
	{
		private String path;
		private String message;
	}
	
	// transforme l'ensemble des contraintes violées en une liste de ValidationError
	// retournée sous forme JSON
	@Override
	public Response toResponse(ConstraintViolationException exception)
	{
		List<ValidationError> errors = exception.getConstraintViolations().stream().map(this::toValidationError).collect(Collectors.toList());
		return Response.status(Response.Status.BAD_REQUEST).entity(errors).type(MediaType.APPLICATION_JSON).build();
	}

	// transforme une constrainte de validation en une ValidationError
	private ValidationError toValidationError(ConstraintViolation<?> constraintViolation)
	{
		return ValidationError.builder()
			   .path(constraintViolation.getPropertyPath().toString())
			   .message(constraintViolation.getMessage()).build();
	}
}
```

On peut même faire en sorte que les données soient directement mappées et validées au sein d'une classe de type *Value Object*. Dans cet exemple, j'utilise une classe interne statique encore un peu de Lombok et son annotation `@Data` qui, pour une fois, convient bien :

```java
@Path("/directory")
public class BatCaveDirectory
{
	@Data
	public static class InputData
	{
		@FormParam(value = "name")
		@NotNull
		@NotEmpty
		private String name;
		
		@FormParam(value = "age")
		@Min(0) @Max(150)
		private Integer age;
	}

	@POST
	@Path("/add")
	public Response addEntity(@Valid @BeanParam InputData input)
	{
		return Response.ok(LocalDateTime.now().toString() + " : " + input).build();
	}
}
```

Cela devient vraiment simple et puissant avec `@Valid` et `@BeanParam` ! On peut bien sûr envisager de faire sa propre contrainte BeanValidation ...

> Oulah, mais oui, dis donc ! C'est bien puissant !


Enfin, si les données ne sont pas valides on obtient alors une erreur sérialisée en JSON :

```json
[
  { 
    "message":"doit être inférieur ou égal à 150",
    "path":"addEntity.arg0.age"
  },
  { 
    "message":"doit correspondre à \"[A-Z]*\"",
    "path":"addEntity.arg0.name"
  }
]
```

## Quelques réflexions supplémentaires

On voit dans les exemples ci-dessus que le nombre d'arguments peut être trop élevé : en général, j'encapsule cela dans une nouvelle classe, par exemple une classe static interne. L'avantage c'est que cette classe pourra porter des annotations Bean Validation et donc être soumise à validation. Cependant en cas de très forte sollication, étant donné le nombre important d'objets temporaires créés uniquement pour encapsuler, il faudra faire attention à la consommation mémoire et au coût de passage du garbage collector.

Il m'arrive même souvent que ces classes soient aussi des classes JPA. Pas de mélange des genres selon moi car tant qu'aucune instance n'est validée par Bean Validation, JPA ne la persiste pas et ne fait donc pas partie du contexte du persistence. C'est une sorte de DTO temporaire qui m'évite de redéfinir les champs : un bon développeur se doit d'être paresseux.

Dans tous les cas, je pense qu'il ne faut pas généraliser les tests de préconditions à toutes les classes d'une application Java. Il faut, à mon sens, se concentrer sur ce qui est offert en `public` par l'API, que ce soit localement ou à distance via services REST.

Au sujet des webservices, j'aimerais rappeler qu'avec JAX-WS (SOAP) ou JAX-RS (REST) les annotations Bean Validation sont prises en compte :

* lors de la génération des schémas XSD et contrat WSDL. En entrée d'un WS SOAP, avant l'invocation de la méthode JAVA, les arguments sont donc automatiquement validés ;
* lors de l'appel de la méthode dans le cas de REST (donc plus tardivement).

> En espérant ne pas vous avoir effrayé avec ces tests de préconditions ...