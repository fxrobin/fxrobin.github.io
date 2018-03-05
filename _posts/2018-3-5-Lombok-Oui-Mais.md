---
nlayout: post
title: Lombok, Oui ! Mais ...
---

## Lombok, après 4 ans d'usage ...

Dans ce billet, je vais présenter la bibliothèque Lombok dont je ne peux plus me passer pour mes développement Java.
Cela fait maintenant plus de 4 ans que j'utilise cette bibliothèque et tout n'est pas rose. Ce sera donc l'occasion de partager aussi certaines recommandations.

J'en lâche une : n'utilisez pas `@Data` et je vais vous expliquer pourquoi. Un peu de patience.

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

<img src="http://yuml.me/diagram/plain;scale:120/class/[Proprietaire|nom]->*[Vehicule|numeroMoteur;numeroChassis;numeroImmatriculation;dateMiseEnCirculation], [Vehicule]*-1[Marque|nom]" />

Pour montrer ce qu'il faudrait faire en Java "sans Lombok", je vais simplement coder la classe `Vehicule` afin
qu'elle respecte les convention Java Beans.

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
	
	// getters/setters
	
	
	// equals/hashCode
```

![To be continued](/images/tobecontinued.png)

