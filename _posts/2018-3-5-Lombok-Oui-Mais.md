---
nlayout: post
title: Lombok, Oui ! Mais ...
---

## Lombok, après 4 ans d'usage ...

Dans ce billet, je vais présenter la bibliothèque Lombok dont je ne peux plus me passer pour mes développement Java.
Cela fait maintenant plus de 4 ans que j'utilise cette bibliothèque et tout n'est pas rose. Ce sera donc l'occasion de partager aussi certaines recommandations.

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

Pour montrer ce qu'il faudrait faire en Java "sans Lombok", je vais simplement coder la classe `Vehicule` afin qu'elle respecte les convention Java Beans.

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
	private List<Marque> marques;
	
	// constructeurs
	public Vehicule()
	{
		marques = new ArrayList<>();
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

	public List<Marque> getMarques() 
	{
		return marques;
	}

	public void setMarques(List<Marque> marques) 
	{
		this.marques = marques;
	}
	
	
	// equals/hashCode : génération par Eclipse sur "numeroChassis" et "numeroMoteur"
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
				.append(", marques=")
				.append(marques)
				.append("]");
		return builder.toString();
	}	
}
```

*Constat* : déjà plus de 100 lignes de code pour une classe pourtant "mini-rikiki" à la base.

Le code généré par Eclipse est convenable. J'ai choisi dans cet exemple l'option "StringBuilder chaining" pour `toString` mais souvent le préfère la méthode `String.format` que je trouve plus maintenable.

Mais celà reste du code source généré : *tout code source, même généré doit être maitenable et maintenu !*

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
	List<Marque> marques = new ArrayList<>();
}
```
Dans cet exemple, pour montrer la puissance de Lombok, j'ai volontairement omis les modificateurs `private` devant chacun
des champs. Les champs sont pourtant bien `private` grâce à l'annotation `@FieldDefaults(level=AccessLevel.PRIVATE)`.
Cela étant, après 4 ans d'usage, je préfère quand même faire figurer les modificateurs d'accès au niveau des champs.

>Vous noterez que j'ai reporté l'instanciation de la liste au niveau de la déclaration du champs `marques`. Cette instanciation figurait, dans l'exemple précédent, au niveau du constructeur.

Et voilà comment passer de plus de 100 lignes de code à 16 lignes ! C'est quand même bien plus clair et quel temps gagné ! Mais on ne va pas en rester là. Lombok peut nous apporter plus encore. 

Avant celà, détaillons un peu les annotations utilisées :
* `@FieldDefaults(level=AccessLevel.PRIVATE)` : passe tous les champs en `private`
* `@NoArgsConstructor` : génère le constructeur sans argument et `public`
* `@AllArgsConstructor` : génère le constructeur avec tous arguments et `public` (pour l'exemple)
* `@Getter` : génère tous les getters sur les champs
* `@Setter` : génère tous les setters sur les champs
* `@Setter` : génère tous les setters sur les champs
* `@EqualsAndHashCode(of=...)` : génère `equals` et `hashCode` (et d'autres méthodes) sur les champs donnés
* `@ToString(of=...)` : génère `toString` sur les champs donnés

C'est quand même bien pratique mais on peut aller encore plus loin. D'ailleurs il y a un petit problème avec le `@AllArgsConstructor` qui permet ainsi de passer une liste qui ira supplanter la liste initiale ... Bof bof. On va
régler cela bientôt.

## Le Design Pattern "factory method" avec Lombok

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
	List<Marque> marques = new ArrayList<>();
}
```

L'exemple devient un peu plus "sympa". Je vais détailler ses particularités :
* Le constructeur public par défaut sans argument a disparu. En fait il est bien là, mais il a été passé `private` par 
  l'annotation `@RequiredArgsConstructor`. Cela empèche donc l'instanciation sans argument : ce n'est plus un Java Bean, mais ce n'est pas forcément grave. Attention toutefois aux specs comme CDI, JSF, JPA, qui réclame pourtant ce constructeur.
  
* une méthode statique "factory method" est généré et est nommé `of(...)` au moyen de l'annotation `@RequiredArgsConstructor(staticName="of")`. Ici la convention "of" est utilisée, comme pour les nouvelles API de Java 8, mais j'aurais pu utiliser les 
vieilles conventions comme `newInstance(...)`. La méthode prendra en argument tous les champs marqués `final` ou les champs annotés avec `@NonNull` de Lombok. Attention à ne pas confondre avec `@NotNull` de Bean Validation ou de Guava.

* equals, hashCode et toString ne changent pas.

* Cette fois-ci un contrôle plus fin sur les getters / setters est mis en place : seule l'immatriculation peut changer.

Ca commence déjà à faire des choses plutôt agréables, mais ce n'est pas fini ! Loin de là ... 

![To be continued](/images/tobecontinued.png)

