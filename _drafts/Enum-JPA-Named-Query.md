---
layout: post
title: Où définir au mieux une NamedQuery JPA ?
subtitle: Parce que les mécanismes par défaut ne sont pas terribles ...
logo: java-jpa.png
category: JPA, JAVA_EE
tags: [java_ee, jpa]
---

Dans court billet, je vais vous passer succinctement en revue les deux façons
natives qui sont offertes pour déclarer des `NamedQuery` JPA. On verra alors qu'elles
ont des défauts et je vous proposerai alors une 3ème solution qui me parait plus satisfaisante, fondée sur une `enum`.

## Rappels sur les NamedQuery

Une `NamedQuery` est tout simplement une requête JPQL associée avec un nom. 
Pour mémoire, une requête JPQL permet d'intéragir avec le modèle persistant d'un point de vue "Objet" : on ne travaille pas directement
sur les tables et les champs de la base de données.

La différence principale avec une `Query` normale concerne la phase d'analyse syntaxe et sa traduction en un `PreparedStatement` JDBC.
En effet une `NamedQuery` sera analysée en avance de phase et ainsi conservée dans un dictionnaire de requêtes.

Pour des raisons de performances, notamment lors de traitement batch JPA, il vaut donc mieux préviligier des NamedQuery.
Enfin pour des raisons de maintenabilité, il vaut mieux aussi sortir les définitions de requêtes JPQL de l'exécution du code.
Quant il s'agit de construire dynamiquement des requêtes, je conseille plutôt d'utiliser Criteria que des concaténations 
de chaines de caractères contenant du JPQL.

## Où placer nativement une NamedQuery ?

JPA offre nativement deux "endroits" pour déclarer des `NamedQuery`
* soit sur une Entity, avec l'usage d'une ou plusieurs annotations `@NamedQuery`
* soit dans le fichier persistence.xml au moyen du tag `<mapping-file>orm.xml</mapping-file>` et donc d'un fichier orm.xml

Mais cela n'est pas très agréable.

Dans le premier cas, il faut "choisir" la classe qui représente une entité et lui faire porter la requête ... Ce n'est pas très logique. Une entité est sensée représenter une instance d'un tuple et pas de travailler sur plusieurs tuples. De plus l'identifiant de la NamedQuery est spécifié sous forme
textuelle, ce qui n'est pas très pratique pour l'autocomplétion et vérifier que tout fonctionne avant un lancement RUNTIME. On peut régler un peu ce problème avec des constantes String classique éventuellement.

Dans le second cas, on ne pollue pas la classe qui représente l'entité. La déclaration se fait donc "à l'ancienne" dans un fichier XML, ce qui est 
plutôt une bonne idée, mais dans ce cas toujours pas d'autocomplétion, sauf à passer par une enum classique qui reprend exactement le même nom utilisé
dans le fichier XML. Mais on est toujours pas à l'abris d'une erreur qu'on ne découvrira encore une fois qu'au RUNTIME.

Je vais donc vous présenter une solution alternative ...



## Solution avec une "enum" 

L'idée générale est de pouvoir obtenir une NamedQuery au moyen d'une définition dans une enum.

De cette manière, on bénéficera d'emblée de l'autocomplétion.
De plus on va faire porter à l'enum la génération automatique de l'identificateur de la NamedQuery : comme ça plus d'erreur possible !
De toutes façons cet identificateur ne servira qu'en interne de la solution.

Enfin, au démarrage de l'application, un Singleton (quelque soit son implémentation) se charger d'aller référencer les requête JPQL avec
leur identificateur en tant que NamedQuery dans l'EntityManagerFactory, obtenu au moyen de l'EntityManager courant. 

## On plante le décor ...

Afin de comprendre où on va, voici ce que l'on cherche à obtenir dans une façade qui appelera les différentes `NamedQuery` :


```java
public static List <VideoGame> findByGenre(EntityManager em, GameGenre genre)
{
	// création de la namedQuery, identifiée par sa valeur dans l'enum.
	TypedQuery<VideoGame> query = em.createNamedQuery(VideoGameQuery.FIND_BY_GENRE.getIdentifier(), 
	                                                  VideoGame.class);
	query.setParameter("gameGenre", genre);
	return query.getResultList();
}
```

ou encore

```java
public static List <VideoGame> findByNameLike(EntityManager em, String nameLike)
{
	// création de la namedQuery, identifiée par sa valeur dans l'enum.
	TypedQuery<VideoGame> query = em.createNamedQuery(VideoGameQuery.FIND_BY_NAME_LIKE.getIdentifier(), 
	                                                  VideoGame.class);
	query.setParameter("name", nameLike);
	return query.getResultList();
}
```

Ces méthodes seront utilisées dans le programme principal suivant :


```java
// 1ère étape : récupération d'un EntityManager et peuplement de données exemple.
EntityManager em = ApplicationSingleton.createEntityManager();
DataPopulator.populate(em);
		
// Création de l'enregistreur de query JPQL et enregistrement de celle de l'enum.
QueryRegistrator.build(em).register(VideoGameQuery.values());
		
// on appelle la façade pour obtenir les jeux de type SHOOT_THEM_UP
System.out.println("Jeux : Shoot them up");
FacadeVideoGame.findByGenre(em, GameGenre.SHOOT_THEM_UP).forEach(System.out::println);
		
// on appelle la façade pour obtenir les jeux commençant par "Rick"
System.out.println("Jeux : commençant par Rick");
FacadeVideoGame.findByNameLike(em, "Rick%").forEach(System.out::println);
		
em.close();
```

Pour joindre l'utile à l'agréable j'ai pris ici comme entité persistante la représentation d'un jeu vidéo.
J'utilise aussi Lombok pour simplifier l'écriture des classes.

```java
@Entity
@Table(name="VIDEO_GAME")
@ToString(of = { "id", "name", "gameGenre" })
@NoArgsConstructor
public class VideoGame implements Serializable
{
	@GeneratedValue
	@Id
	@Getter
	private Long id;

	@Getter
	@Setter
	private String name;

	@Enumerated(EnumType.STRING)
	@Getter
	@Setter
	@Column(name="GAME_GENRE")
	private GameGenre gameGenre;

	public VideoGame(String name, GameGenre gameGenre)
	{
		super();
		this.name = name;
		this.gameGenre = gameGenre;
	}

}
```
Et voici l'enum utilisée pour le genre du jeu :

```java
public enum GameGenre
{
	RPG, FPS, SHOOT_THEM_UP, ARCADE, PLATFORM, RACING;
}
```

Afin de diposer de données de test, voici le "DataPopulator" utilisé dans le programme principal :


```java
public class DataPopulator
{
	static void populate(EntityManager em)
	{
		// Best ATARI-ST Games ever !
		List<VideoGame> data = ListPopulator.start()
				.add("Xenon", GameGenre.SHOOT_THEM_UP)
				.add("Xenon 2", GameGenre.SHOOT_THEM_UP)
				.add("Rick Dangerous", GameGenre.PLATFORM)
				.add("Rick Dangerous 2", GameGenre.PLATFORM)
				.add("Stunt Car Racer", GameGenre.RACING)
				.build();

		// on les persiste en base via l'entity manager.
		em.getTransaction().begin();
		data.forEach(em::persist);
		em.getTransaction().commit();
	}

}
```

Cette classe utilise ListPopulator que voici :

```java
public class ListPopulator
{
    private List <VideoGame> data = new LinkedList<>();
	
	private ListPopulator() {}
	
	public static ListPopulator start()
	{
		return new ListPopulator();
	}
	
	public ListPopulator add(String name, GameGenre gameGenre)
	{
		data.add(new VideoGame(name, gameGenre));
		return this;
	}
	
	public List<VideoGame> build()
	{
		return new ArrayList<>(data);
	}
}
```



## Le référenceur programmatique de NamedQuery

Je suis d'accord, le titre de ce paragraphe est un peu pompeux, mais je n'ai pas trouvé mieux
pour le moment. Si vous avez une meilleure idée, faites m'en part en commentaires.

Tout d'abord l'enum qui porte nos requêtes JPQL qui vont devenir des `NamedQuery` :

```java
public enum VideoGameQuery implements RegistrableQuery
{
	/**
	 * retourne les VideoGame en fonction de leur genre. 
	 * Argument JPQL attendu : gameGenre de type GameGenre.	
	 */
	FIND_BY_GENRE("SELECT vg FROM VideoGame vg WHERE vg.gameGenre = :gameGenre"), 

	/**
	 * retourne les VideoGame en fonction d'un nom approchant (LIKE). 
	 * Argument JPQL attendu : name de type String.
	 */
	FIND_BY_NAME_LIKE("SELECT vg FROM VideoGame vg WHERE vg.name LIKE :name");


	// partie "technique"

	/**
	 * String JPQL de la requête
	 */
	final String query;

	/**
	 * constructeur pour chaque valeur de l'enum.
	 * 
	 * @param returnedClass
	 * @param query
	 */
	private VideoGameQuery(String query)
	{
		this.query = query;
	}


	/**
	 * retourne la requête JPQL
	 */
	@Override
	public String getQuery()
	{
		return this.query;
	}

	/**
	 * contruit et retourne l'identifiant de la requête JPQL qui sert de clé pour
	 * la namedQuery.
	 */
	@Override
	public String getIdentifier()
	{
		return String.format("%s_%s", this.getClass(), this.name());
	}
}
```

Notez que cette enum implémente l'interface `RegistrableQuery` que voici :

```java
public interface RegistrableQuery
{
	/**
	 * @return la requête JPQL.
	 */
	String getQuery();

	/**
	 * @return l'identifiant de la requête JPQL.
	 */
	String getIdentifier();
}
```

Ensuite voici notre référenceur programmatique (registrator) :

```java
@Log
public class QueryRegistrator
{
	private EntityManager em;

	private QueryRegistrator()
	{

	}

	public static QueryRegistrator build(EntityManager em)
	{
		QueryRegistrator qr = new QueryRegistrator();
		qr.em = em;
		return qr;
	}

	/**
	 * enregistre la requête auprès de l'EntityManagerFactory.
	 * Cette requête deviendra alors une NamedQuery accessible via son enum.
	 * 
	 * @param query
	 * @return instance courante pour permettre du method chaining.
	 */
	public QueryRegistrator register(RegistrableQuery query)
	{
		Query realQuery = this.em.createQuery(query.getQuery());
		EntityManagerFactory emf = em.getEntityManagerFactory();
		emf.addNamedQuery(query.getIdentifier(), realQuery);
		if (log.isLoggable(Level.INFO))
		{
			log.info(String.format("Registered : %s >> %s", query.getIdentifier(), realQuery));
		}
		return this;
	}
	
	/**
	 * enregistre plusieurs requêtes auprès de l'EntityManagerFactory.
	 * Cette requête deviendra alors une NamedQuery accessible via son enum.
	 * 
	 * @param queries
	 * @return instance courante pour permettre du method chaining.
	 */
	public QueryRegistrator register(RegistrableQuery... queries)
	{
		Stream.of(queries).forEach(this::register);
		return this;
	}

}
```

C'est bien cette classe et sa méthode `register(RegistrableQuery query)` qui fait tout le travail.
La méthode `register(RegistrableQuery... queries)` permettra d'inscrire toutes les valeurs de l'enum d'un coup.
Souvenez-vous, c'était dans programme principal :

```java
QueryRegistrator.build(em).register(VideoGameQuery.values());
```

## Avantages, conclusions et reste à faire ...

parce que c'est mieux et qu'on a des constantes.
* Autocomplétion
* Manque QueryHints et LockMode

