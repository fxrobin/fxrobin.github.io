---
layout: post
title: Lombok, YES! But ...
subtitle: small dive into Lombok after 4 years using
logo: lombok-logo.png
category: articles
tags: [lombok,java,builder,patterns]
lang: en
ref: Lombok-Oui-Mais
permalink: /Lombok-Yes-But
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

* The default public constructor with no arguments is gone. In fact it is there, but it has been passed `private` by the `@RequiredArgsConstructor` annotation. This prevents instantiation without argument: it's not a Java Bean anymore, but that's not necessarily a problem. Be careful with specs like CDI, JSF, JPA, which require this constructor.  
* A static "factory method" is generated and is named `of(...)` by means of the annotation `@RequiredArgsConstructor(staticName="of")`. Here the `of' convention is used, as for the new Java 8 APIs, but I could have used the old conventions like `newInstance(...)`. The method will take as argument all fields marked `final` or fields annotated with `@NonNull` from Lombok. Be careful not to confuse this with `@NotNull` from Bean Validation or Guava.
* `equals`, `hashCode` and `toString` do not change.
* This time a finer control on the getters / setters is implemented: only the registration (immatriculation in French) can change.

Using this class:

```java
Vehicule v = Vehicule.of("AABBCC123", "X06123", LocalDate.of(1989, 01, 18));
v.setNumeroImmatriculation("AA-123-BB");
System.out.println(v);
```

This is its result in the console thanks to the `toString` method generated by Lombok :

```
Vehicule(numeroMoteur=AABBCC123, numeroChassis=X06123, dateMiseEnCirculation=1989-01-18, numeroImmatriculation=AA-123-BB)
```

It's already starting to do some pretty nice things, but it's not over yet! Far from it ...

## The "Builder" Pattern with Lombok

In the category of patterns a bit verbose to implement in a traditional way, involving duplication of code (especially attribute definitions) which is the last straw for
code (especially attribute definitions), which is the last straw for Design Patterns, here is the Builder implemented
with Lombok.

Before perceiving its ease of implementation, here is the class `Intervention` implemented with Lombok and a factory method for its intanciation:

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
and here is the class `Vehicle` as well as its Builder in the form of an internal class that I will comment on later:

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

Note therefore the use of the following Lombok annotations:

* `@Builder`: generates an internal class of type `Builder` capable of building by means of `method chaining` an instance of the class. The terminal operation will be `build()` ;
* `@AllArgsConstructor(access=AccessLevel.PROTECTED)` : the constructor with all the arguments is necessary for the Builder, but to make it inaccessible from another package, but still from the Builder, I place it here in `protected` ;
* `@NonNull` : tells the Builder all mandatory fields;
* `@Singular` : tells the Builder that we can add occurrences to the list always thanks to method chaining.

Here is an example of the use of this builder:

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

and here is the result in the console:

```
Vehicule(numeroMoteur=X06123, numeroChassis=AABBCC123, dateMiseEnCirculation=1989-01-18, numeroImmatriculation=AA-123-BB)
Intervention(dateIntervention=2018-03-05, kilometrage=1850000, libelle=Vidange, prix=175.0)
Intervention(dateIntervention=2018-02-03, kilometrage=1840000, libelle=Freins, prix=210.0)
Intervention(dateIntervention=2018-01-15, kilometrage=1830000, libelle=Embrayage, prix=350.0)
Intervention(dateIntervention=2017-12-10, kilometrage=1820000, libelle=Pneus, prix=450.0)
```

## The "Factory" Pattern with Lombok

It is sometimes, even often, necessary to have a little more control over the creation of instances,
especially in the Builder, which is why we will implement a solution based on Lombok for
the Design Pattern "Factory".

With Lombok, it's still pretty straightforward, still using the same `@Builder` annotation but this time
on methods:

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

Some explanations:
* `@UtilityClass`: because this factory is not intended to be instantiated, the constructor becomes private. Moreover, the class also becomes `final`;
* the constructor methods must be static: nothing shocking;
* `@Builder(builderClassName="...", builderMethodName="...")`: declare an internal class of type Builder and which will be generated according to the arguments of the method. There will be as many internal builder as annotations.

And here is a small usage:

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

This gives on the console:

```
Vehicule(numeroMoteur=123ABCD, numeroChassis=AAABB123, dateMiseEnCirculation=2018-03-06, numeroImmatriculation=XX-XXX-XX)
Vehicule(numeroMoteur=458AAA, numeroChassis=AAABB578, dateMiseEnCirculation=2018-03-06, numeroImmatriculation=789-AAA-987)
```

## Recommendations (well ...)

I throw them out in bulk, with a little justification anyway.

* Don't use `@Data` : as announced in the preamble, it generates EqualsAndHashCode on all fields, same for ToString, which can cause cyclic executions when you have bi-directional relations between classes.
* Always use `@EqualsAndHashCode` and `@ToString` by specifying the fields with the `of=...` attribute
* Specify the `Getter / Setter` on the fields, and not on the class (basically, not like in all the examples I just gave)
* Beware of the Builder: integrating a Builder will be possible, but JPA, JSF or CDI will wait for the constructor without argument to be present with the "protected" level.
* Beware of code review software that does not analyze the ByteCode but only the source code: they are lost...

## As a conclusion

As you can see, this is a very powerful library that I can't do without, as announced in the preamble.

There are still a lot of annotations that I haven't covered here, but that are just as useful:

* @CommonsLog or @Slf4j or @Log: for easy logs;
* @Value: for immutable objects;
* @Cleanup: for freeing resources;
* @Delegate : to manage correctly the collections in the compositions with a delegate;
* @Synchronized: for synchronization that is FINALLY managed simply and correctly.

*We'll say that this will be part of a future post ...*

**Feel free to tell me about your uses of Lombok in comments, which I will post here if necessary.
