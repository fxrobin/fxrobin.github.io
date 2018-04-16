---
layout: post
title: Où définir au mieux une NamedQuery <nobr>JPA ?</nobr>
subtitle: Parce que les mécanismes par défaut ne sont pas terribles ...
logo: java-jpa.png
category: JAVA_EE
tags: [java_ee, jpa]
---

<div class="intro" markdown='1'>
Je vais vous présenter succinctement les deux façons
natives en JPA pour déclarer des `NamedQuery`. 

On verra alors que ces deux solutions ont des défauts et je vous proposerai alors une **3ème qui me paraît plus satisfaisante, fondée sur une "enum"**.
</div>

<!--excerpt-->

## Rappels sur les NamedQuery

Une `NamedQuery` est tout simplement une requête JPQL associée avec un nom qui permet de l'identifier, comme la clé d'une Map.
 
> Pour mémoire, une requête JPQL permet d'intéragir avec le modèle persistant d'un point de vue "Objet". On ne travaille pas directement sur les tables et les champs de la base de données, mais sur les classes et les attributs.

La différence principale avec une `Query` normale concerne la phase d'analyse syntaxique JPQL et sa traduction en un `PreparedStatement` JDBC, c'est à dire du SQL pré-paramétré.

En effet une `NamedQuery` sera analysée en avance de phase et ainsi conservée dans un dictionnaire (sorte de Map) de requêtes.

Pour des raisons de performances, notamment lors de traitement batch JPA, il vaut donc mieux préviligier des `NamedQuery`.

Enfin pour des raisons de maintenabilité, il est préférable de sortir les définitions de requêtes JPQL de l'exécution du code.

Quant à la construction dynamique de requêtes, je conseille plutôt d'utiliser Criteria que des concaténations de chaines de caractères contenant du JPQL.

## Où placer nativement une NamedQuery ?

JPA offre nativement deux endroits pour déclarer des `NamedQuery` :
* soit sur une classe annotée avec  `@Entity`, avec l'usage d'une ou plusieurs annotations `@NamedQuery`. On peut aussi les mettre sur une classe annotée avec  `@MappedSuperclass` mais cette classe doit réellement être héritée pour que les `NamedQuery`soient prises en compte.
* soit dans le fichier `persistence.xml` au moyen du tag `<mapping-file>orm.xml</mapping-file>` et donc d'un fichier `orm.xml`.

Mais cela n'est pas vraiment idéal, car :

* dans le premier cas, il faut *choisir* la classe qui représente une entité et lui faire porter la requête ... **Ce n'est pas très logique** : une entité est sensée représenter une instance et pas de travailler sur plusieurs instances. De plus l'identifiant de la NamedQuery est spécifié sous forme
textuelle, ce qui n'est pas particulièrément pratique pour l'autocomplétion et vérifier que tout fonctionne avant un lancement RUNTIME. On peut régler éventuellement ce problème avec des constantes String classique.

* dans le second cas, on ne pollue pas la classe qui représente l'entité. La déclaration se fait donc "à l'ancienne" dans un fichier XML, ce qui est plutôt une idée acceptable, mais dans ce cas toujours pas d'autocomplétion, sauf à passer par une constante classique qui reprendra exactement le même nom utilisé que dans le fichier XML. Mais on n'est toujours pas à l'abris d'une erreur qu'on ne découvrira encore une fois qu'au RUNTIME.

**Je vais donc vous présenter une solution alternative ...**

## Solution avec une "enum" 

**L'idée générale est de pouvoir obtenir une NamedQuery au moyen d'une définition dans une enum.**

De cette manière, on bénéficera d'emblée de l'autocomplétion.
De plus on va faire porter à l'enum la génération automatique de l'identificateur de la NamedQuery : comme ça plus d'erreur possible !
De toutes façons, cet identificateur ne servira qu'en interne de la solution.

Enfin, au démarrage de l'application, on référencera les requêtes JPQL avec
leur identificateur en tant que NamedQuery dans l'EntityManagerFactory. 
Ce dernier point sera effectué au moyen de l'EntityManager courant.  

## On plante le décor ...

Afin de comprendre où on va, voici ce que l'on cherche à obtenir dans une façade qui appelera les différentes `NamedQuery` :


```java
TypedQuery<VideoGame> query = em.createNamedQuery(VideoGameQuery.FIND_BY_GENRE.getIdentifier(), VideoGame.class);
```

ou encore :

```java
TypedQuery<VideoGame> query = em.createNamedQuery(VideoGameQuery.FIND_BY_NAME_LIKE.getIdentifier(), VideoGame.class);
```

Ces lignes de codes seront utilisées dans des méthodes dans une façade que le programme principal appellera. La variable `em` contient une référence vers l'entity manager courant :

```java
// les jeux de type SHOOT_THEM_UP
System.out.println("Jeux : Shoot them up");
FacadeVideoGame.findByGenre(em, GameGenre.SHOOT_THEM_UP).forEach(System.out::println);
		
// les jeux commençant par "Rick"
System.out.println("Jeux : commençant par Rick");
FacadeVideoGame.findByNameLike(em, "Rick%").forEach(System.out::println);
```

## Domaine

Pour joindre l'utile à l'agréable, j'ai pris ici comme entité persistante la représentation d'un jeu vidéo et d'un genre de jeu.

![Diag Classes](/images/enum-jpa-named-query/dcla.png)


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

Les interactions seront donc effectuées au moyen de la façade, dont
on a aperçu déjà quelques lignes de code précédemment :

```java
public final class FacadeVideoGame
{
	private FacadeVideoGame()
	{
		// protection du constructeur.
	}
	
	public static List <VideoGame> findByGenre(EntityManager em, GameGenre genre)
	{
		// création de la namedQuery, identifiée par sa valeur dans l'enum.
		TypedQuery<VideoGame> query = em.createNamedQuery(VideoGameQuery.FIND_BY_GENRE.getIdentifier(), VideoGame.class);
		query.setParameter("gameGenre", genre);
		return query.getResultList();
	}
	
	public static List <VideoGame> findByNameLike(EntityManager em, String nameLike)
	{
		// création de la namedQuery, identifiée par sa valeur dans l'enum.
		TypedQuery<VideoGame> query = em.createNamedQuery(VideoGameQuery.FIND_BY_NAME_LIKE.getIdentifier(), VideoGame.class);
		query.setParameter("name", nameLike);
		return query.getResultList();
	}
	
}
```


## Données de test

Afin de disposer de données de test, voici l'ensemble des classes utilisées pour peupler la base de données.

> J'aurais pu utiliser un script SQL d'initialisation, mais je n'ai pas eu envie. 
L'envie est parfois très importante dans la réalisation d'une solution :-)

![Diag Classes](/images/enum-jpa-named-query/diag-data.png)

Le programme principal au complet est le suivant :

```java
public class MainProg
{
	public static void main(String[] args)
	{
		// 1ère étape : récupération d'un EntityManager et peuplement de données exemples.
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
	}
}
```

voici le "DataPopulator" utilisé dans le programme principal :


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

Cette classe utilise ListPopulator que voici ci dessous. Cette classe n'est pas essentielle, mais j'avais envie de m'amuser un peu avec un Builder de List ...


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

Enfin dans le cadre de ce test, j'utilise une base de données embarquée H2.

Voici donc mon `pom.xml` :

```xml
<properties>
	<maven.compiler.source>1.8</maven.compiler.source>
	<maven.compiler.target>1.8</maven.compiler.target>
	<project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
</properties>


<dependencies>
	<dependency>
		<groupId>javax.persistence</groupId>
		<artifactId>javax.persistence-api</artifactId>
		<version>2.2</version>
	</dependency>

	<dependency>
		<groupId>org.eclipse.persistence</groupId>
		<artifactId>org.eclipse.persistence.jpa</artifactId>
		<version>2.7.1</version>
		<scope>runtime</scope>
	</dependency>

	<dependency>
		<groupId>com.h2database</groupId>
		<artifactId>h2</artifactId>
		<version>1.4.196</version>
		<scope>runtime</scope>
	</dependency>

	<dependency>
		<groupId>org.projectlombok</groupId>
		<artifactId>lombok</artifactId>
		<version>1.16.20</version>
		<scope>provided</scope>
	</dependency>
</dependencies>
```

et voici la déclaration du `persistence-unit` du fichier `persistence.xml` :

```xml
<persistence-unit name="named-queries-demo" transaction-type="RESOURCE_LOCAL">
 <exclude-unlisted-classes>false</exclude-unlisted-classes>
	<properties>
		<property name="javax.persistence.jdbc.driver" value="org.h2.Driver"/>
		<property name="javax.persistence.jdbc.url" value="jdbc:h2:mem:test"/>
		<property name="javax.persistence.jdbc.user" value="sa"/>
		<property name="javax.persistence.schema-generation.database.action" value="create"/>
		<property name="eclipselink.logging.level" value="FINE"/>
		<property name="eclipselink.logging.thread" value="false"/>
		<property name="eclipselink.logging.timestamp" value="false"/>
		<property name="eclipselink.logging.exceptions" value="false"/>
	</properties>
 </persistence-unit>
</persistence>
```

> Oui, j'aurais pu aussi le faire avec des tests unitaires JUnit, mais je n'avais toujours pas envie :-)


## Le référenceur programmatique de NamedQuery

Je suis d'accord, le titre de ce paragraphe est un peu pompeux, mais je n'ai pas trouvé mieux pour le moment. Si vous avez une meilleure idée, faites m'en part en commentaires.

Ce diagramme UML répresente le système mis en place. La classe MainProg n'est là que pour faire référencer au QueryRegistrator l'ensemble des valeurs de l'enum.

![Diag Classes](/images/enum-jpa-named-query/diag-registrator.png)

> la seconde méthode "register(RegistrableQuery... queries)" est bien implémentée
au moyen d'un varsargs et non pas d'un tableau, comme représenté dans ce diagramme.

En premier lieu, voici l'interface `RegistrableQuery` qui sera implémentée par l'enum et qui garantira le comportement attendu par chacune des valeurs :

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

Voici **ENFIN** l'enum qui porte nos requêtes JPQL qui vont devenir des `NamedQuery` :

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

Ensuite voici notre référenceur programmatique (registrator) :

```java
@Log
public final class QueryRegistrator
{
	private EntityManager em;

	private QueryRegistrator()
	{
		// protection du constructeur
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

## Au résultat

Voici ce que l'on obtient dans la console avec le niveau de log fixé à `FINE` :

```
mars 12, 2018 11:16:58 AM demo.registrator.QueryRegistrator register
INFOS: Registered : class demo.model.VideoGameQuery_FIND_BY_GENRE >> EJBQueryImpl(ReadAllQuery(referenceClass=VideoGame sql="SELECT ID, GAME_GENRE, NAME FROM VIDEO_GAME WHERE (GAME_GENRE = ?)"))
mars 12, 2018 11:16:58 AM demo.registrator.QueryRegistrator register
INFOS: Registered : class demo.model.VideoGameQuery_FIND_BY_NAME_LIKE >> EJBQueryImpl(ReadAllQuery(referenceClass=VideoGame sql="SELECT ID, GAME_GENRE, NAME FROM VIDEO_GAME WHERE NAME LIKE ?"))
Jeux : Shoot them up
[EL Fine]: sql: ServerSession(1179381257)--Connection(2124643775)--SELECT ID, GAME_GENRE, NAME FROM VIDEO_GAME WHERE (GAME_GENRE = ?)
	bind => [SHOOT_THEM_UP]
VideoGame(id=1, name=Xenon, gameGenre=SHOOT_THEM_UP)
VideoGame(id=2, name=Xenon 2, gameGenre=SHOOT_THEM_UP)
Jeux : commençant par Rick
[EL Fine]: sql: ServerSession(1179381257)--Connection(2124643775)--SELECT ID, GAME_GENRE, NAME FROM VIDEO_GAME WHERE NAME LIKE ?
	bind => [Rick%]
VideoGame(id=3, name=Rick Dangerous, gameGenre=PLATFORM)
VideoGame(id=4, name=Rick Dangerous 2, gameGenre=PLATFORM)
```
Les requêtes JPQL ont bien été parcourues en avance de phase et inscrites auprès de l'EntityManagerFactory.
Elles sont bien converties en PreparedStatement, comme prévu.

## Avantages, conclusions et reste à faire ...

Les requêtes JPQL NamedQuery ne sont maintenant :
* ni perdues au sein d'une méthode ;
* ni mal placées sur la déclaration d'une entité persistante ;
* ni sans liaison directe au sein d'un fichier `orm.xml`.

On a gagné :
* en découplage,
* en autocomplétion,
* en ré-utilisation,
* en maintenance (les NamedQuery sont centralisées).

Il restera, pour améliorer le système, à prendre en compte les `QueryHints` et `LockMode` : cela pourra être codé au niveau de l'enum.

On pourra aussi faire porter à l'enum la classe métier "de travail" et créer une classe
utilitaire pour créer automatiquememt des "RegistrableQuery" sans avoir à le faire
nous même. J'ai préféré cette approche pour ne pas chambouler toutes les pratiques d'instanciation de NamedQuery déjà éventuellement en place.

Enfin, le référencement pourra se faire de manière automatique au démarrage au moyen
d'un singleton dédié. Par exemple :
* un EJB Singleton annoté avec `@Singleton` et `@Startup` 
* ou un Bean CDI annoté avec `@ApplicationScoped` avec un observateur sur `ApplicationScoped.class` : https://rmannibucau.wordpress.com/2015/03/10/cdi-and-startup/

**Enfin cela me permettra d'embrayer sur un nouveau post relatif à "Spring Data JPA" versus "CDI DeltaSpike Data Module", pour voir que finalement on peut presque se passer de la définition de `@NamedQuery` à l'ancienne avec ces deux bibliothèques ! Nom de Zeus !**

Comme on dit à *Hill Valley* ...

![To Be Continued](/images/tobecontinued.png)


*N'hesitez pas à formuler des remarques ou poser des questions dans les commentaires afin d'améliorer la clareté de ce qui est présenté, voire d'améliorer et/ou de simplifier l'ensemble.* 

**Vous pouvez retrouver l'intégralité du code source de ce projet sur mon compte [GitHub](https://github.com/fxrobin/articles).**


