---
layout: post
title: Où définir au mieux une NamedQuery JPA
subtitle: Parce que le mécaniseme par défaut n'est pas terrible ...
logo: lombok-logo.png
category: JPA, JAVA_EE
tags: [java_ee, jpa]
---

Dans court billet, je vais vous passer succinctement en revue les deux façons
natives qui sont offertes pour déclarer des `NamedQuery` JPA. On verra alors qu'elles
ont des défauts et je vous proposerai alors une 3ème solution qui me parait plus satisfaisante, fondée sur une `enum`.

## Rappel sur les NamedQuery

* Qu'est-ce que c'est 
* A quoi cela sert
* Quel intérêt par rapport à une query normale

## Où placer nativement une NamedQuery 

* sur une Entity, avec usage de constante
* dans le fichier persistence.xml (ou un fichier dédié référencé)

## Solution avec une "enum" 

* Déportez les JPQL dans une enum
* Singleton d'initialisation qui parcourt l'enum et qui reférence les
  NamedQuery dans l'EntityManager
  
```java  
public enum GuitarQuery
{
	COUNT("SELECT COUNT(g) FROM Guitare g"), 
	FIND("SELECT g FROM Guitare g WHERE g.id=:id"),
	RANDOM("SELECT g.id FROM Guitare g");

	private final String query;
	private final String identifier;

	private GuitarQuery(String query)
	{
		this.identifier = this.getClass().getSimpleName() + "_" + this.name();
		this.query = query;
	}

	public String getQuery()
	{
		return query;
	}
	
	public String getIdentifier()
	{
		return identifier;
	}

	@Override
	public String toString()
	{
		return this.identifier + " = " + this.query;
	}

}   
```

Le singleton, ici au moyen d'un EJB annoté avec `@Singleton`, mais ce pourrait être un singleton CDI annoté avec `@ApplicationScoped`.

```java
@Singleton
@Startup
@CommonsLog
public class InitNamedQueries
{
	@PersistenceContext
	private EntityManager em;

	@PostConstruct
	public void init()
	{
		EntityManagerFactory factory = em.getEntityManagerFactory();
		for (GuitarQuery q : GuitarQuery.values())
		{
			factory.addNamedQuery(q.getIdentifier(), em.createQuery(q.getQuery()));
			log.info("Ajout de la requête : " + q);
		}
	}
}
```

et son usage 

```java
public Guitare getById(String id)
{
	TypedQuery<Guitare> query = this.getQuery(GuitarQuery.FIND, Guitare.class);
	query.setParameter("id", id);
	return query.getSingleResult();
}
```


## Avantages et conclusion

parce que c'est mieux et qu'on a des constantes.


