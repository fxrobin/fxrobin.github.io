---
layout: post
title: Lombok, YES ! But ...
subtitle: small dive into Lombok after 4 years using
logo: lombok-logo.png
category: articles
tags: [lombok,java,builder,patterns]
lang: en
ref: Lombok-Oui-Mais
---

<div class="intro" markdown='1'>
I will present in this post the Lombok library which I'm currently using for quite every development in Java. After 4 years dealing with it, I wish I could share some experience and give some advice.

As an excerpt, here is my best : don't use `@Data` but you'll need to be patient and to read the conclusion to know why.
</div>
<!--excerpt-->

## Lombok, à quoi cela sert ?

Lombok is not only a beautiful island of Indonesia, it's also a great and small Java library which will generate what is called *boiler plate* in your classes while taking care about good practises.

Here are the perfect candidates in the "Boiler plate" category:

* getters / setters
* equals  / hashCode
* toString
* constructors
* access modifiers (private, protected, etc.).

*And the winner is* : "deuce" between `getter/setters` and `equals/hashCode`. `toString` is not far behind the winners.

## Simple classic Java example

Let's take this simple UML class diagram as our input:

![Diag Classes](/images/lombok/lombok-uml.png)

### Implementation without Lombok

In order to show you what you need to code in standard Java, I'll code the `Vehicule` class as a classical Java Bean.

In this example, unicity will rely on theses fields "motorNumber" and "bodyNumber".
In the real world, vehicule unicity is much more complex and can not anyway rely on the immatriculation plate.

!!! TODO exemple à traduire !!!

```java
public class Vehicule implements Serializable
{
	// champs métier
	private String numeroMoteur;
	private String numeroChassis;
	private String numeroImmatriculation;
	private LocalDate dateMiseEnCirculation;
	
	// champs de relation
	private List<Intervention> interventions;
	
	// constructeurs
	public Vehicule()
	{
		interventions = new ArrayList<>();
	}
	
	public Vehicule(String numeroMoteur, 
			String numeroChassis, 
			String numeroImmatriculation, 
			LocalDate dateMiseEnCirculation)
	{
		this();
		this.numeroMoteur = numeroMoteur;
		this.numeroChassis = numeroChassis;
		this.numeroImmatriculation = numeroImmatriculation;
		this.dateMiseEnCirculation = dateMiseEnCirculation;
	}

	// getters/setters : génération par Eclipse
	
	public String getNumeroMoteur() 
	{
		return numeroMoteur;
	}

	public void setNumeroMoteur(String numeroMoteur) 
	{
		this.numeroMoteur = numeroMoteur;
	}

	public String getNumeroChassis() 
	{
		return numeroChassis;
	}

	public void setNumeroChassis(String numeroChassis) 
	{
		this.numeroChassis = numeroChassis;
	}

	public String getNumeroImmatriculation() 
	{
		return numeroImmatriculation;
	}

	public void setNumeroImmatriculation(String numeroImmatriculation) 
	{
		this.numeroImmatriculation = numeroImmatriculation;
	}

	public LocalDate getDateMiseEnCirculation() {
		return dateMiseEnCirculation;
	}

	public void setDateMiseEnCirculation(LocalDate dateMiseEnCirculation) {
		this.dateMiseEnCirculation = dateMiseEnCirculation;
	}

	public List<Intervention> getInterventions() 
	{
		return interventions;
	}

	public void setInterventions(List<Intervention> interventions) 
	{
		this.interventions = interventions;
	}
	
	// equals/hashCode : génération par Eclipse
	@Override
	public int hashCode() {
		final int prime = 31;
		int result = 1;
		result = prime * result + ((numeroChassis == null) ? 0 : numeroChassis.hashCode());
		result = prime * result + ((numeroMoteur == null) ? 0 : numeroMoteur.hashCode());
		return result;
	}

	@Override
	public boolean equals(Object obj) {
		if (this == obj)
			return true;
		if (obj == null)
			return false;
		if (getClass() != obj.getClass())
			return false;
		Vehicule other = (Vehicule) obj;
		if (numeroChassis == null) {
			if (other.numeroChassis != null)
				return false;
		} else if (!numeroChassis.equals(other.numeroChassis))
			return false;
		if (numeroMoteur == null) {
			if (other.numeroMoteur != null)
				return false;
		} else if (!numeroMoteur.equals(other.numeroMoteur))
			return false;
		return true;
	}	
	
	
	// toString : génération via Eclipse avec "StringBuilder chaining".
	@Override
	public String toString() {
		StringBuilder builder = new StringBuilder();
		builder.append("Vehicule [numeroMoteur=")
			 	.append(numeroMoteur)
			 	.append(", numeroChassis=")
			 	.append(numeroChassis)
				.append(", numeroImmatriculation=")
				.append(numeroImmatriculation)
				.append(", dateMiseEnCirculation=")
				.append(dateMiseEnCirculation)
				.append(", interventions=")
				.append(interventions)
				.append("]");
		return builder.toString();
	}	
}
```

*First impression*: more than 100 lines of code for a such tiny class!

Eclipse has generated an acceptable code. Here I choosed the StringBuilder strategy of the toString assistant, but I often prefer using `String.format` which is more maintenable to me although it is meant to be slower.

The trouble is that it's generated code! Any generated code must be maintainable and maintained! After more than 30 years of software development I feel like source code generation is quite an anti-pattern!

### Implementation with Lombok

To use Lombok, you only need to declare this dependency in your classical `pom.xml`:

```xml
<dependencies>
	<dependency>
		<groupId>org.projectlombok</groupId>
		<artifactId>lombok</artifactId>
		<version>1.16.20</version>
		<scope>provided</scope>
	</dependency>
</dependencies>
```

Just have a look at the scope : `provided`. That means that this is just a dependency while compiling and that there is no need of `Lombok.jar` in your classpath in production. Lombok relies on a JDK mecanism which launches an annotation processor if it's referenced in a file in META-INF. For more information read this <https://projectlombok.org/contributing/lombok-execution-path>

As I said earlier you must wonder why I don't like source code generation but I love lombok. It seems antinomic. In fact it's not as Lombok doesn't generate source code : it generates ByteCode which a different concept. Many frameworks and libraries use ByteCode generation, like Spring, CDI, EJB, etc. Java itself generates ByteCode when creating Dynamic Proxies. Nowadays, This technic is widely used by the raise of annotations usage in Java since Java 5!

Eclipse (or Netbeans or IntelliJ) can also benefit of Lombok by installing a Java Agent thanks to its installer. You can do it by yourself as well by editing the "eclipse.ini" file:

```
-javaagent:/opt/eclipse/lombok.jar
```

Now we can focus only on what's really important in our class: its fields and their types! All the boiler plate will be dynamically generated into ByteCode by Lombok.

```java
@FieldDefaults(level=AccessLevel.PRIVATE)
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@EqualsAndHashCode(of= {"numeroMoteur","numeroChassis"})
@ToString(of= {"numeroMoteur","numeroChassis","numeroImmatriculation","dateMiseEnCirculation"})
public class Vehicule implements Serializable
{
	// champs métier
	String numeroMoteur;
	String numeroChassis;
	String numeroImmatriculation;
	LocalDate dateMiseEnCirculation;
	
	// champs de relation
	List<Intervention> interventions = new ArrayList<>();
}
```

> "It's a kind of magic", Queen

In this example, I intentionnaly omitted the private modifiers in front of every field as they are generated by `@FieldDefaults(level=AccessLevel.PRIVATE)`. But after 4 years using Lombok, I prefer to keep the modifiers visibles and to write them.

> You shall notice that the instanciation of the list `interventions` figuresjkl close its declaration. In the previous example, this instanciation was written in the constructor.

This is how to transform a 100 lines of code class into a 16 lines only class! It's not only about saving time, as IDE tools can do it as fast as well, but it's about clean code and clarity. But we will not end up our journey with Lombok as it can go much further!

Before that, let's have a look at the annotations that I'm using :

* `@FieldDefaults(level=AccessLevel.PRIVATE)` : set all fields to `private` visibility
* `@NoArgsConstructor` : generates a `public` constructor without arguments
* `@AllArgsConstructor` : generates a `public` constructor with all arguments mapped to all fields
* `@Getter` : generates getter for every field;
* `@Setter` : generates stter for every field;
* `@EqualsAndHashCode(of=...)` : generatse `equals` and `hashCode` (en some protected method) on the given fields
* `@ToString(of=...)` : generates `toString` on the given fields

It's really convenient but we still can go further. There is a small issue here with `@AllArgsConstructor` which allows to change the reference of the list, breaking the encapsulation principle. We will fix that in the next section.

## Factory Method Pattern with Lombok

Let's take the previous example and change the classic constructor into a factory method thanks to the argument `staticName="of"` of the existing annotation `@RequiredArgsConstructor`.

```java
@FieldDefaults(level=AccessLevel.PRIVATE)
@RequiredArgsConstructor(staticName="of")
@EqualsAndHashCode(of= {"numeroMoteur","numeroChassis"})
@ToString(of= {"numeroMoteur","numeroChassis","numeroImmatriculation","dateMiseEnCirculation"})
public class Vehicule implements Serializable
{
	@Getter
	final String numeroMoteur;

	@Getter
	final String numeroChassis;
	
	@Getter
	final LocalDate dateMiseEnCirculation;

	@Getter	 @Setter
	String numeroImmatriculation;
	
	// champs de relation
	@Getter
	List<Intervention> interventions = new ArrayList<>();
}
```

Here are some explanations :

* Le constructeur public par défaut sans argument a disparu. En fait il est bien là, mais il a été passé `private` par l'annotation `@RequiredArgsConstructor`. Cela empèche donc l'instanciation sans argument : ce n'est plus un Java Bean, mais ce n'est pas forcément grave. Attention toutefois aux specs comme CDI, JSF, JPA, qui réclame pourtant ce constructeur.  
* une méthode statique « factory method » est générée et est nommée `of(...)` au moyen de l'annotation `@RequiredArgsConstructor(staticName="of")`. Ici la convention « of » est utilisée, comme pour les nouvelles API de Java 8, mais j'aurais pu utiliser les vieilles conventions comme `newInstance(...)`. La méthode prendra en argument tous les champs marqués `final` ou les champs annotés avec `@NonNull` de Lombok. Attention à ne pas confondre avec `@NotNull` de Bean Validation ou de Guava.
* `equals`, `hashCode` et `toString` ne changent pas.
* Cette fois-ci un contrôle plus fin sur les getters / setters est mis en place : seule l'immatriculation peut changer.

Usage de cette classe :

```java
Vehicule v = Vehicule.of("AABBCC123", "X06123", LocalDate.of(1989, 01, 18));
v.setNumeroImmatriculation("AA-123-BB");
System.out.println(v);
```

Et son résultat dans la console grâce à la méthode `toString` générée par Lombok :

```
Vehicule(numeroMoteur=AABBCC123, numeroChassis=X06123, dateMiseEnCirculation=1989-01-18, numeroImmatriculation=AA-123-BB)
```

Ca commence déjà à faire des choses plutôt agréables, mais ce n'est pas fini ! Loin de là ...

## Le Pattern « Builder » avec Lombok

Dans la catégorie des patterns un peu verbeux à mettre en place de manière tradionnelle, impliquant de la duplication
de code (surtout de définitions d'attributs) ce qui est un comble pour des Design Patterns, voici le Builder mis en oeuvre
avec Lombok.

Avant d'en percevoir sa facilité de mise en oeuvre voici la classe `Intervention` implémentée avec Lombok et une « factory method » pour son intanciation :

```java
@FieldDefaults(level=AccessLevel.PRIVATE)
@AllArgsConstructor(staticName="of")
@EqualsAndHashCode(of="dateIntervention")
@ToString
@Getter
public class Intervention implements Serializable, Comparable<Intervention> 
{
	final LocalDate dateIntervention;
	
	final Long kilometrage;
	
	@Setter
	String libelle;
	
	@Setter
	BigDecimal prix;

	@Override
	public int compareTo(Intervention o) 
	{	
		return this.dateIntervention.compareTo(o.getDateIntervention());
	}
}
```

et voici la classe `Vehicule` ainsi que son Builder sous forme de classe interne que je commenterai par la suite :

```java
@FieldDefaults(level=AccessLevel.PRIVATE)
@EqualsAndHashCode(of= {"numeroMoteur","numeroChassis"})
@ToString(of= {"numeroMoteur","numeroChassis","numeroImmatriculation","dateMiseEnCirculation"})
@Builder
public class Vehicule implements Serializable
{
	@Getter
	@NonNull
	String numeroMoteur;

	@Getter
	@NonNull
	String numeroChassis;
	
	@Getter
	@NonNull
	LocalDate dateMiseEnCirculation;

	@Getter	@Setter
	String numeroImmatriculation;
	
	// champs de relation
	@Getter
	@Singular
	List<Intervention> interventions = new ArrayList<>();
}
```

Notez donc l'usage des annotations Lombok suivantes :

* `@Builder` : génère une classe interne de type « Builder » capable de construire au moyen de « method chaining » une instance de la classe. L'opération terminale sera `build()` ;
* `@AllArgsConstructor(access=AccessLevel.PROTECTED)` : le constructeur avec tous les arguments est nécessaire au Builder, mais pour le rendre inaccessible depuis un autre package, mais toujours depuis le Builder, je le place ici en `protected` ;
* `@NonNull` : indique au Builder tous les champs obligatoires ;
* `@Singular` : indique au Builder que l'on pourra ajouter des occurences à la liste toujours grâce à du method chaining.

Voici un exemple d'usage de ce builder :

```java
Vehicule.VehiculeBuilder builder = Vehicule.builder();

Vehicule v = builder.numeroChassis("AABBCC123")
		.numeroMoteur("X06123")
		.dateMiseEnCirculation(LocalDate.of(1989, 01, 18))
		.numeroImmatriculation("AA-123-BB")
		.intervention(Intervention.of(LocalDate.of(2018, 03, 05), 1850000L, "Vidange", new BigDecimal("175.0")))
		.intervention(Intervention.of(LocalDate.of(2018, 02, 03), 1840000L, "Freins", new BigDecimal("210.0")))
		.intervention(Intervention.of(LocalDate.of(2018, 01, 15), 1830000L, "Embrayage", new BigDecimal("350.0")))
		.intervention(Intervention.of(LocalDate.of(2017, 12, 10), 1820000L, "Pneus", new BigDecimal("450.0")))
		.build();

System.out.println(v);
v.getInterventions().forEach(System.out::println);
```

et voici le résultat dans la console

```
Vehicule(numeroMoteur=X06123, numeroChassis=AABBCC123, dateMiseEnCirculation=1989-01-18, numeroImmatriculation=AA-123-BB)
Intervention(dateIntervention=2018-03-05, kilometrage=1850000, libelle=Vidange, prix=175.0)
Intervention(dateIntervention=2018-02-03, kilometrage=1840000, libelle=Freins, prix=210.0)
Intervention(dateIntervention=2018-01-15, kilometrage=1830000, libelle=Embrayage, prix=350.0)
Intervention(dateIntervention=2017-12-10, kilometrage=1820000, libelle=Pneus, prix=450.0)
```

## Le Pattern « Factory » avec Lombok

Il est parfois, voire souvent, nécessaire d'avoir un peu plus de contrôle pour la création des instances,
notamment dans le Builder, ce qui va nous permettre de mettre en place une solution fondée sur Lombok pour
le Design Pattern « Factory ».

Avec Lombok, cela reste assez simple, en utilisant toujours la même annotation `@Builder` mais cette fois-ci
sur des méthodes :

```java
@UtilityClass
public class VehiculeFactory 
{
	@Builder(builderClassName="SmallBuilder", builderMethodName="smallBuilder")
	public static Vehicule newVehicule(String numeroChassis, String numeroMoteur)
	{
		return Vehicule.builder().numeroChassis(numeroChassis)
					 .numeroMoteur(numeroMoteur)
					 .dateMiseEnCirculation(LocalDate.now())
					 .numeroImmatriculation("XX-XXX-XX")
					 .build();
	}
	
	@Builder(builderClassName="FullBuilder", builderMethodName="fullBuilder")
	public static Vehicule newVehicule(String numeroChassis, 
					   String numeroMoteur, 
					   LocalDate dateMiseEnCirculation, 
					   String numeroImmatriculation)
	{
		return Vehicule.builder().numeroChassis(numeroChassis)
					 .numeroMoteur(numeroMoteur)
					 .dateMiseEnCirculation(dateMiseEnCirculation)
					 .numeroImmatriculation(numeroImmatriculation)
					 .build();
	}
}
```

Quelques explications :
* `@UtilityClass` : parce que cette factory n'a pas vocation à être instanciée, le constructeur devient privé. De plus la classe devient aussi `final` ;
* les méthodes de construction doivent être statiques : rien de choquant ;
* `@Builder(builderClassName="...", builderMethodName="...")` : déclarer une classe interne de type Builder et qui va se générer en fonction des arguments de la méthode. Il y aura autant de builder interne que d'annotations.

Et voici un petit usage :

```java
Vehicule v1 = VehiculeFactory.smallBuilder()
			  .numeroChassis("AAABB123")
			  .numeroMoteur("123ABCD")
			  .build();

Vehicule v2 = VehiculeFactory.fullBuilder()
		      .numeroChassis("AAABB578")
		      .numeroMoteur("458AAA")
		      .dateMiseEnCirculation(LocalDate.now())
		      .numeroImmatriculation("789-AAA-987")
		      .build();

System.out.println(v1);
System.out.println(v2);
```

Ce qui donne sur la console :

```
Vehicule(numeroMoteur=123ABCD, numeroChassis=AAABB123, dateMiseEnCirculation=2018-03-06, numeroImmatriculation=XX-XXX-XX)
Vehicule(numeroMoteur=458AAA, numeroChassis=AAABB578, dateMiseEnCirculation=2018-03-06, numeroImmatriculation=789-AAA-987)
```

## Préconisations (enfin ...)

Je les jette en vrac, avec une petite justification quand même.

* Ne pas utiliser `@Data` : comme annoncé en préambule, cela génère EqualsAndHashCode sur tous les champs, pareil pour ToString, ce qui peut occasioner des exécutions cycliques quand on a des relations bi-directionnelles entre les classes.
* Toujours utiliser `@EqualsAndHashCode` et `@ToString` en précisant les champs avec l'attribut `of=...`
* Spécifier les `Getter / Setter` sur les champs, et non pas sur la classe (en gros, pas comme dans tous les exemples que je viens de donner)
* Attention au Builder : intégrer un Builder sera possible, mais JPA, JSF ou CDI attendront que le constructeur sans argument soit présent avec le niveau « protected ».
* Attention aux logiciels de revue de code qui n'analysent pas le ByteCode mais que le code source : ils sont perdus...

## En guise de conclusion

C'est, vous l'aurez compris, une bibliothèque très puissante dont je ne peux plus me passer, comme annoncé en préambule.

Il y a encore pas mal d'annotations que je n'ai pas couvert ici, mais qui sont tout aussi utiles :

* @CommonsLog ou @Slf4j ou encore @Log : pour les logs faciles ;
* @Value : pour les objets immuables ;
* @Cleanup : pour la libération de ressources ;
* @Delegate : pour gérer correctement les collections dans les compositions avec un délégué ;
* @Synchronized :  pour de la synchronisation ENFIN gérée simplement et correctement.

*On va dire que ça fera partie d'un prochain billet ...*

**N'hésitez pas à me faire part de vos usages de Lombok en commentaire, que je reporterai ici le cas échéant.**
