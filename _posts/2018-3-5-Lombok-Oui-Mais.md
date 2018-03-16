

---
layout: post
title: Lombok, Oui ! Mais ...
subtitle: Petit retour d'expérience de Lombok après 4 ans d'usage.
logo: lombok-logo.png
category: API
tags: [lombok,java,builder,patterns]
---

Dans ce billet, je vais présenter la bibliothèque Lombok dont je ne peux plus me passer pour mes développements Java. Cela fait maintenant plus de 4 ans que je l'utilise et tout n'est pas rose. Ce sera donc l'occasion de partager aussi certaines recommandations.

J'en lâche une : **n'utilisez pas** `@Data` et je vais vous expliquer pourquoi. Un peu de patience.

## Lombok, à quoi cela sert ?

A part être visiblement une très belle île d'Indonésie, encore, il s'agit d'une bibliothèque qui va géréner pour vous, en respectant de nombreuses bonnes pratiques, ce qu'on appelle du "*boiler plate*".

En Java, dans la catégorie "Boiler plate", voici les nominés :
* getters / setters
* equals  / hashCode
* toString
* constructeurs
* modificateurs d'accès (private, protected, etc.)

*And the winner is* : égalité entre `getter/setters` et `equals/hashCode`. `toString` n'est vraiment pas loin derrière.

## Démonstration par l'exemple

Prenez par exemple les classes métiers suivantes :

![Diag Classes](/images/lombok/lombok-uml.png)

### Implémentation sans Lombok

Pour montrer ce qu'il faudrait faire en Java "sans Lombok", je vais simplement coder la classe `Vehicule` afin qu'elle respecte les conventions Java Beans.

Pour l'exemple, l'unicité sera portée par les champs "numeroMoteur, numeroChassis".
Dans la réalité, l'unicité d'un véhicule est bien plus complexe et dans tous les cas
ne doit pas reposer sur l'immatriculation.


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

*Constat* : déjà plus de 100 lignes de code pour une classe pourtant "mini-rikiki" à la base.

Le code généré par Eclipse est convenable. J'ai choisi dans cet exemple l'option "StringBuilder chaining" pour `toString` mais souvent je préfère la méthode `String.format` que je trouve plus maintenable au détriment peut-être d'un peu de performance.

Mais celà reste du code source généré : *tout code source, même généré doit être maintenable et maintenu !*

### Implémentation avec Lombok

Pour utiliser Lombok, il faut déclarer les éléments suivants dans le fichier `pom.xml` de votre projet MAVEN.

```xml
<properties>
	<maven.compiler.source>1.8</maven.compiler.source>
	<maven.compiler.target>1.8</maven.compiler.target>
	<project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
</properties>

<dependencies>
	<dependency>
		<groupId>org.projectlombok</groupId>
		<artifactId>lombok</artifactId>
		<version>1.16.20</version>
		<scope>provided</scope>
	</dependency>
</dependencies>
```

Là où Lombok va se différencier d'un générateur de code source, c'est que dans son cas il va générer du ByteCode. Donc rien à maintenir, rien de visible. Cette stratégie est bien différente des assistants de génération de code d'Eclipse ou 
Netbeans.

D'ailleurs il faut déclarer l'agent Lombok dans le fichier eclipse.ini, ou alors laisser faire l'installeur intégré au fichier
`lombok.jar`. L'installeur place d'ailleurs lombok.jar dans le répertoire racine d'Eclipse.

```
-javaagent:/opt/eclipse/lombok.jar
```

>Cela fonctionne de la même manière avec NetBeans.

On va pouvoir se concentrer uniquement sur ce qui est important dans notre classe : *ses données et leur représentation*. Le reste sera généré par Lombok au moyen de ses annotations.

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
Dans cet exemple, pour montrer la puissance de Lombok, j'ai volontairement omis les modificateurs `private` devant chacun
des champs. Les champs sont pourtant bien `private` grâce à l'annotation `@FieldDefaults(level=AccessLevel.PRIVATE)`.
Cela étant, après 4 ans d'usage, je préfère quand même faire figurer les modificateurs d'accès au niveau des champs.

>Vous noterez que j'ai reporté l'instanciation de la liste au niveau de la déclaration du champs `interventions`. Cette instanciation figurait, dans l'exemple précédent, au niveau du constructeur.

Et voilà comment passer de plus de 100 lignes de code à 16 lignes ! C'est quand même bien plus clair et quel temps gagné ! Mais on ne va pas en rester là. Lombok peut nous apporter plus encore. 

Avant celà, détaillons un peu les annotations utilisées :
* `@FieldDefaults(level=AccessLevel.PRIVATE)` : passe tous les champs en `private`
* `@NoArgsConstructor` : génère le constructeur sans argument et `public`
* `@AllArgsConstructor` : génère le constructeur avec tous arguments et `public` (pour l'exemple)
* `@Getter` : génère tous les getters sur les champs
* `@Setter` : génère tous les setters sur les champs
* `@EqualsAndHashCode(of=...)` : génère `equals` et `hashCode` (et d'autres méthodes) sur les champs donnés
* `@ToString(of=...)` : génère `toString` sur les champs donnés

C'est quand même bien pratique mais on peut aller encore plus loin. D'ailleurs il y a un petit problème avec le `@AllArgsConstructor` qui permet ainsi de passer une liste qui ira supplanter la liste initiale ... Bof bof. On va
régler cela bientôt.

## Le Pattern "Factory Method" avec Lombok

Reprenons l'exemple précédent et avec quelques ajustements nous aurons une classe uniquement instanciable au moyen
d'une "factory method" statique.

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

L'exemple devient un peu plus "sympa". Je vais détailler ses particularités :
* Le constructeur public par défaut sans argument a disparu. En fait il est bien là, mais il a été passé `private` par 
  l'annotation `@RequiredArgsConstructor`. Cela empèche donc l'instanciation sans argument : ce n'est plus un Java Bean, mais ce n'est pas forcément grave. Attention toutefois aux specs comme CDI, JSF, JPA, qui réclame pourtant ce constructeur.
  
* une méthode statique "factory method" est généré et est nommé `of(...)` au moyen de l'annotation `@RequiredArgsConstructor(staticName="of")`. Ici la convention "of" est utilisée, comme pour les nouvelles API de Java 8, mais j'aurais pu utiliser les 
vieilles conventions comme `newInstance(...)`. La méthode prendra en argument tous les champs marqués `final` ou les champs annotés avec `@NonNull` de Lombok. Attention à ne pas confondre avec `@NotNull` de Bean Validation ou de Guava.

* equals, hashCode et toString ne changent pas.

* Cette fois-ci un contrôle plus fin sur les getters / setters est mis en place : seule l'immatriculation peut changer.


Usage de cette classe :

```java
Vehicule v = Vehicule.of("AABBCC123", "X06123", LocalDate.of(1989, 01, 18));
v.setNumeroImmatriculation("AA-123-BB");
System.out.println(v);
```

Et son résultat dans la console grâce au toString généré par Lombok :

```
Vehicule(numeroMoteur=AABBCC123, numeroChassis=X06123, dateMiseEnCirculation=1989-01-18, numeroImmatriculation=AA-123-BB)
```
Ca commence déjà à faire des choses plutôt agréables, mais ce n'est pas fini ! Loin de là ... 

## Le Pattern "Builder" avec Lombok

Dans la catégorie des patterns un peu verbeux à mettre en place de manière tradionnelle, impliquant de la duplication
de code (surtout de définitions d'attributs) ce qui est un comble pour des Design Patterns, voici le Builder mis en oeuvre
avec Lombok.

Avant d'en percevoir sa facilité de mise en oeuvre voici la classe `Intervention` implémentée avec Lombok et une "factory method" pour son intanciation :

```java
@FieldDefaults(level=AccessLevel.PRIVATE)
@AllArgsConstructor(staticName="of")
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
* `@Builder` : génère une classe interne de type "Builder" capable de construire au moyen de "method chaining" une instance de la classe. L'opération terminale sera `build()`.
* `@AllArgsConstructor(access=AccessLevel.PROTECTED)` : le constructeur avec tous les arguments est nécessaire au Builder, mais pour le rendre inaccessible depuis un autre package, mais toujours depuis le Builder, je le place ici en `protected`.
* `@NonNull` : indique au Builder tous les champs obligatoires.
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

## Le Pattern "Factory" avec Lombok

Il est parfois, voire souvent, nécessaire d'avoir un peu plus de contrôle pour la création des instances,
notamment dans le Builder, ce qui va nous permettre de mettre en place une solution fondée sur Lombok pour
le Design Pattern "Factory".

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
* `@UtilityClass` : parce que cette factory n'a pas vocation à être instanciée, le constructeur devient privé. De plus la classe devient aussi `final`.
* les méthodes de construction doivent être statiques : rien de choquant.
* `@Builder(builderClassName="...", builderMethodName="...")` : déclarer une classe interne de type Builder et qui va se générer en fonction des arguments de la méthode. Il y aura autant de builder interne que d'annotations.

Et voici un petit usage :

```
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

Je les jette en vrac, avec une petite justification quand même :

* Ne pas utiliser `@Data` : comme annoncé en préambule, cela génère EqualsAndHashCode sur tous les champs, pareil pour ToString, ce qui peut occasioner des exécutions cycliques quand on a des relations bi-directionnelles entre les classes.
* Toujours utiliser `@EqualsAndHashCode` et `@ToString` en précisant les champs avec l'attribut `of=...`
* Spécifier les `Getter / Setter` sur les champs, et non pas sur la classe (en gros, pas comme dans tous les exemples que je viens de donner)
* Attention au Builder : intégrer un Builder sera possible, mais JPA, JSF ou CDI attendront que le constructeur sans argument soit présent avec le niveau "protected".
* Attention aux logiciels de revue de code qui n'analysent pas le ByteCode mais que le code source : ils sont perdus ...

## En guise de conclusion

C'est, vous l'aurez compris, une bibliothèque très puissante dont je ne peux plus me passer, comme annoncé en préambule.

Il y a encore pas mal d'annotations que je n'ai pas couvert ici, mais qui sont tout aussi utiles :
* @CommonsLog ou @Slf4j ou encore @Log : pour les logs faciles.
* @Value : pour les objets immuables.
* @Cleanup : pour la libération de ressources.
* @Delegate : pour gérer correctement les collections dans les compositions avec un délégué.
* @Synchronized :  pour de la synchronisation ENFIN gérée simplement et correctement.

*On va dire que ça fera partie d'un prochain billet ...*

**N'hésitez pas à me faire part de vos usages de Lombok en commentaire, que je reporterai ici le cas échéant.**


