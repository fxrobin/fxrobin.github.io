---
layout: post
title: Développer en s'amusant et réciproquement
subtitle: Ou comment apprendre à coder en réalisant un jeu vidéo ...
logo: xenon-reborn.png
category: articles
tags: [algo, LibGDX, java]
---

<div class="intro" markdown='1'>
Dans mon parcours professionnel, j'ai été formateur de jeunes développeurs pendant sept années.
Ces derniers venaient d'horizons différents, parfois sans aucune compétence en terme de programmation. 

Afin de rendre ludique l'apprentissage des fondamentaux de l'algorithmique et de Java, je les ai fait participer à la création d'un jeu video : **Xenon Reborn**.
</div>

<!--excerpt-->

## Contexte

Coder des applications "professionnelles" nécessite un background technique assez important tant les éléments à prendre en compte sont nombreux, surtout quand il s'agit d'applications web, multi-utilisateurs, transactionnelles et sécurisées.

Cela ne peut pas se faire sans une bonne maîtrise des fondamentaux.

> "Science sans conscience n’est que ruine de l’âme", François Rabelais, Pantagruel. 

A mon sens, ces fondamentaux sont :

* la représentation des données, l'adressage ;
* l'exécution d'un programme ;
* l'ordonnancement des tâches et des instructions ;
* le fonctionnement d'un ordinateur ;
* ré-utiliser les fonctionnalités existantes (libs, BIOS, jar, etc.) ;
* l'utilisation des ressources ;
* la factorisation du code.

Lassé par les TP/TD un peu trop conventionnels, j'ai donc réalisé une infrastructure de jeu vidéo de type "Shoot Them Up" (Shm'up pour les intimes) à scrolling vertical, digne des années 1990, nostalgie oblige ...

C'est cette infrastructure sur laquelle sont venus s'appuyer mes stagiaires pour développer telle ou telle partie du jeu comme par exemple la gestion des collisions ou encore l'attribution de bonus et la gestion de l'état du vaisseau spatial.

Car oui, sous des allures "peu sérieuses", coder un jeu vidéo permet de mettre en oeuvre des concepts de Design Patterns (Singleton, Facade, Factory), de polymorphisme, de découplage, de complexité algorithmique. Ces concepts seront toujours valables sur des applications professionnelles. 

Ce projet "fil rouge" s'incrivait dans un cours de "Java Bases" où les notions suivantes n'avaient pas encore été abordées, ce qui représentait un sacré challenge pour faire un jeu vidéo :

* les collections (toutes) : ils n'avaient étudier que `List` et `ArrayList` ;
* les fichiers ;
* les interfaces graphiques ;
* le multi-threading ;
* les lambdas de Java 8 ;
* Maven ;
* JUnit.

De plus, mes stagiaires découvraient Eclipse, ayant fait des cours d'Algo pur en pseudo-langage et avec [Java's Cool](http://javascool.gforge.inria.fr/). Parallèlement ils avaient des cours de POO, menés avec [Bluej](https://www.bluej.org/).

## Hommage

Si vous ne l'aviez pas encore [compris ou lu](/about), je suis nostalgique des jeux vidéo des années 90 et principalement de deux jeux : **Xenon** et **Xenon 2** des [Bitmap Brothers](https://fr.wikipedia.org/wiki/Bitmap_Brothers) sur Atari-ST et Amiga.

![Xenon 1](/images/xenon-1.jpg)
![Xenon 2](/images/xenon-2.jpg)

{%include video.html youtube-id="v9nD9DQwd80?start=175"  size="normal" %}

![ATARI-ST](/images/atari-st.png)
![AMIGA](/images/amiga.png)

J'ai donc souhaité rendre hommage, à mon humble niveau, à ces deux "hits" de l'informatique micro-ludique 1980-2000 ...

## Au résultat

Voici ce que cela donne pour le moment, le jeu commence vraiment vers 48 secondes de vidéo, avant il s'agit surtout d'un peu de musique et de mouvements aléatoires de caméra sur le fond étoilé :

{%include video.html youtube-id="ki39sbk4VKc" size="normal" %}

Si vous souhaitez y jouer, il vous suffit d'avoir un Java 8 (JRE) d'installé sur votre poste (Windows ou Linux), de dézipper ce fichier :

{%include download.html url="https://github.com/fxrobin/Xenon_Reborn/files/1894717/XenonReborn_0.1.10.zip" title="XenonReborn_0_1_10.zip" %}

Puis, lancez le fichier jar `XenonReborn.jar` situé à la racine.

Pour vous amuser un peu, voici les commandes :

|Touche(s)    					| Action 											|
|-------------------------------|---------------------------------------------------|
|`FLECHES DU CURSEUR` 		    | mouvements du vaisseau							|
|`CTRL-DROIT` 					| tir conventionnel									|
|`SHIFT-DROIT` 				    | tir destructeur									|
|`ENTREE` 						| activation/désactivation du bouclier				|
|`F1` 							| bascule mode plein écran / fenêtré				|
|`ESC` 							| retour à l'écran précédent						|
|`CURSEUR GAUCHE et DROIT`	    | change la musique seulement sur l'écran de menu   |

## Solutions techniques

### Diagrammes de classes

Voici différents diagrammes, afin de vous rendre compte d'une partie du système réalisé.

![Diagramme UML Game](/images/xenon-reborn/dclaa-game.png)

![Diagramme UML Screens](/images/xenon-reborn/dclaa-screens.png)

### Graphismes

Le projet a été réalisé en Java, parce que la formation de mes stagiaires a comme objectif la maitrise de ce langage et notamment, au final, de la plateforme Java EE 7. Cela passe donc par l'apprentissage de Java SE 8.

Je me suis appuyé sur LibGDX, décliné exclusivement en mode "Client Lourd Java" (pas de client Android), qui est une bibliothèque avec laquelle j'avais déjà fait quelques essais et qui m'avait semblé robuste. 60 FPS pour un jeu sensé être "retro", c'est beaucoup trop ...

Je n'ai pas utilisé les classes offertes par la partie Scene2D (`Actor`, `Stage`, etc.) : j'ai préféré recoder mes propres éléments comme `AnimatedSprite`, mais au final cela y ressemble fortement. Si je devais refactoriser ce point je m'appuierais sur les classes offertes en prenant le temps de les étudier un peu mieux.

Je me suis contraint à coder toute une infrastructure, notamment MVC, pour la gestion des écrans et des évenements clavier, afin de ne pas trop complexifier la tâche de mes développeurs : l'objectif étant de leur faire pratiquer "boucle, conditions, variables, méthodes".

### Musiques et Sons

Jouer du MP3, rien de plus facile avec LibGDX. Trop facile même.

Pour rendre vraiment hommage aux RetroGames, j'ai donc utilisé une bibliothèque de lecture de "MOD".
Les nostalgiques comme moi se rappeleront alors des différents *Sound Tracker* utilisés sur ST et AMIGA
qui jouaient des musiques digitalisées "de dingues" alors que le poids des fichiers était très faibles.

Je m'y suis donc contraint, ne serait-ce que pour retrouver "le son d'autrefois" ...

Le reste des effets sonores (tirs, explosions) sont généralement joués à partir de fichier WAV directement
par LibGDX.

### Algorithmes

Ici le terme d'algorithme est un bien grand nom. En effet, il s'agissait surtout de mettre en oeuvre les fondamentaux du développement :

* variables,
* boucles,
* conditions.

Puis d'enchainer sur les concepts fondamentaux de la programmation orientée "objets" :

* responsabilité,
* découplage,
* encapsulation,
* héritage;

Le tout étant toujours vu sous l'angle de la factorisation du code : **dupliquer du source, c'est mal !**

**Objectifs** : 1 classe = 10 méthodes, 10 lignes de code par méthode max.

Voici par exemple l'algorithme codé par certains stagiaires concernant la détection de collision, au moyen de la méthode d'intersection de cercles, bien suffisante pour un *Shoot Them Up*, sachant que tout élément à l'écran implémente une interface `Artefact` définie à cette occasion :

```java
package net.entetrs.xenon.artefacts;

import com.badlogic.gdx.graphics.g2d.Sprite;
import com.badlogic.gdx.math.Circle;

import net.entetrs.xenon.commons.displays.Renderable;

/**
 * représente un artefact qui possède des points de vie, une force d'impact, un
 * cercle de collision et un sprite courant. Un artefact est "Renderable" par
 * héritage d'interface.
 * 
 * @author fxrobin et stagiaires.
 * @see Renderable
 */

public interface Artefact extends Renderable
{
	/**
	 * retourne le cercle de collision.
	 * 
	 * @return
	 */
	Circle getBoundingCircle();
	
	/**
	 * retourne le nombre de point de vie de l'artefact.
	 * 
	 * @return
	 * 		le nombre de points de vie.
	 */
	int getLifePoints();

	/**
	 * décrémente les points de vie en fonction de la force d'impact exercée.
	 * 
	 * @param force
	 *            force d'impact.
	 */
	void decreaseLife(int force);

	/**
	 * retourne la force d'impact de cet artefact.
	 * 
	 * @return la force d'impact.
	 */
	int getImpactForce();

	/**
	 * retourne "true" si l'artefact est toujours en vie, "false" sinon.
	 * 
	 * @return "true" si l'artefact est toujours en vie, "false" sinon.
	 */
	boolean isAlive();

	/**
	 * retourne le Sprite courant resprésenté par cet artefact.
	 * 
	 * @return le sprite courant.
	 */
	Sprite getSprite();

	/**
	 * affecte le nombre de points de vie.
	 * 
	 * @param lifePoints
	 */
	void setLifePoints(int lifePoints);

	/**
	 * affecte la vitesse sur l'axe Y.
	 * 
	 * @param vectorY
	 */
	void setVectorY(float vectorY);

	/**
	 * affecte la vitesse sur l'axe X.
	 * 
	 * @param vectorX
	 */
	void setVectorX(float vectorX);

	/**
	 * retourne la vitesse sur l'axe Y.
	 * 
	 * @return
	 */
	float getVectorY();

	/**
	 * retourne la vitesse sur l'axe X.
	 * 
	 * @return
	 */
	float getVectorX();

	/**
	 * déplace l'artefact en fonction de sa vitesse sur les 2 axes
	 * et en fonction du temps delta écoulé.
	 * 
	 * @param delta
	 */
	void act(float delta);

	/**
	 * affecte la taille du cercle de collision.
	 * 
	 * @param radius
	 */
	void setRadius(float radius);
	
	/**
	 * retourne vrai si cet artefact entre en collision
	 * avec celui passé en paramètre.
	 * 
	 * @param otherArtefact
	 * @return
	 * 	 	"true" si la collision est avérée, "false" sinon.
	 */
	boolean isCollision(Artefact otherArtefact);

	/**
	 * augmente la vie de l'arteface (dans la limite de son maximum).
	 * 
	 * @param points
	 * 		points de vie à ajouter.
	 */
	void increaseLife(final int points);
	
}
```

Système de gestion de collisions :

```java
package net.entetrs.xenon.artefacts.managers;

import java.util.List;
import java.util.Random;

import net.entetrs.xenon.artefacts.Artefact;
import net.entetrs.xenon.artefacts.enemies.Bullet;
import net.entetrs.xenon.artefacts.extra.BonusType;

/**
 * gestionation de collisions entre des "targets" (cibles) et des "projectiles".
 * 
 * @author fxrobin & stagiaires.
 *
 */
public final class CollisionManager
{
	private static CollisionManager instance = new CollisionManager();
	private static Random randomGenerator = new Random();

	public static CollisionManager getInstance()
	{
		return instance;
	}

	private CollisionManager()
	{
		/* protection */
	}

	/**
	 * vérifie les collisions entre une liste de cibles (targets), et une liste de projectiles (projectiles). 
	 * 
	 * @param targets
	 * @param projectiles
	 */
	public void checkCollision(List<? extends Artefact> targets, List<? extends Artefact> projectiles)
	{
		// on vérifie la collision de tous les "targets" avec chacun des "projectiles".
		for (Artefact t : targets)
		{
			for (Artefact p : projectiles)
			{
				checkCollision(t, p);
			}
		}
	}

	/**
	 * vérifie la collision entre deux artefacts, l'un "cible", l'autre "projectile".
	 * Si c'est le cas, le calcul des impacts est lancé, puis la vérification de l'état
	 * "alive" du target.
	 * 
	 * @param target
	 * @param projectile
	 */
	public void checkCollision(Artefact target, Artefact projectile)
	{
		if (target.isCollision(projectile))
		{
			/* collision !!! */
			processCollision(target, projectile);
			checkDestruction(target);
		}
	}
	
	/**
	 * décrémente la vie de deux artefacts en fonction des forces d'impact
	 * de leur opposant respectif.
	 * 
	 * @param target
	 * @param projectile
	 */
	public void processCollision(Artefact target, Artefact projectile)
	{
		projectile.decreaseLife(target.getImpactForce());
		target.decreaseLife(projectile.getImpactForce());
	}

	/**
	 * vérifie si l'artefact est détruit en lui demandant s'il est "alive".
	 * s'il est détruit, le score est incrémenté de 10 points et un bonus
	 * sera éventuellement généré.
	 * 
	 * @param target
	 */
	public void checkDestruction(Artefact target)
	{	
		if (!target.isAlive())
		{
			/* MAJ du score */
			ScoreManager.getInstance().add(10);
			/* Génération des bonus éventuels en fonction de la cible abattue */
			processBonus(target);
		}
	}

	/**
	 * génère éventuellement un bonus (une chance sur 2 de la générer).
	 * Le bonus apparaitra là où l'artefact a été détruit.
	 * 
	 * @param target
	 */
	public void processBonus(Artefact target)
	{
		/* une destruction sur deux génère un bonus et les bullets sont ignorées*/
		if (randomGenerator.nextBoolean() && !(target instanceof Bullet))
		{
			/* puis on choisi au hasard, encore l'un ou l'autres des bonus potentiels.*/
			BonusType bonusType = randomGenerator.nextBoolean() ? BonusType.NORMAL_BONUS : BonusType.POWER_UP_BONUS;
			BonusManager.getInstance().addBonus(bonusType, target.getBoundingCircle().x, target.getBoundingCircle().y);
		}
	}
}
```

## Temps passé et technos abordées

Pour donner un ordre de grandeur, j'ai dû passer 20 heures sur l'ensemble du coding sans compter le temps passer à trouver (pomper oooh c'est pas bien) des ressources graphiques et sonores. Cela reste assez peu finalement au regard du résultat.

Je me suis forcé aussi à ne pas utiliser Lombok, qui aurait pourtant bien acceléré les choses, mais il fallait être en accord avec les compétences détenues par mes stagiaires à ce moment là.

A ce jour voici les statistiques d'analyse de code (CODACY et CODEFACTOR) :

* LineOfCode : 2897
* Java Files : 61
* Issues : 0%, Complex Files : 0%, Duplicated Code : 0%
* CODEFACTOR : rated A
* CODACY: rated A

Je sais que certains aiment bien les statistiques de "production de code". Grosso modo, cela représente  140 LoC par heure. Comme une classe c'est en moyenne 50 LoC, cela fait 3 classes par heure. Ces statistiques ne veulent pas dire grand chose, mais je les laisse quand même.

Voici les points du jeu sur lesquels j'ai passé le plus de temps, souvent sur des détails d'ailleurs :

* enchainement par fade-in, fade-out des écrans (rien dans LibGDX pour cette chose pourtant nécessaire !)
* scrolling parallax perso versus TileMap
* affichage en channel Alpha du niveau de bouclier à gauche, parce que il faut prendre en compte les particularités du SpriteBatch
* gestion des ressources au moyen d'enum (Jean-Jacques, spéciale dédicasse si tu as lu jusque là ...)
* Découplage de l'affichage du vaisseau en fonction de son état et des traitements des inputs.

Vu des stagiaires, se rendre compte  :

* que développer un jeu vidéo ce n'est pas simple et finalement revoir à la baisse leurs prétentions de recoder Call Of Duty ...
* qu'avec quelques lignes de codes, quelques boucles, on fait des choses sympatiques
* que reprendre du code qu'on a pas écrit, ce n'est pas simple.

Cela m'a permis surtout, en fonction du niveau individuel de chacun de mes développeurs, de leur faire faire des choses plus au moins complexes et même d'en initier certains aux lambdas Java 8 et à la Stream API.

## Conclusions

J'aurais aimé structurer un peu mieux les différentes étapes à faire coder par mes stagiaires. La raison est que je (re)découvrais LibGDX en même temps qu'eux : pas facile pour estimer des jalons sur une technos non maîtrisée (à méditer ...).

Souvent, j'ai codé la solution, puis j'ai retiré les portions que j'estimais être à leur portée.
Certains ont été vraiment déroutés par l'usage de l'anglais et surtout par reprendre du code source 
qui ne leur appartient pas : et pourtant avant de savoir écrire du code, il faut aussi et surtout savoir le lire !

Je leur avais demandé de regarder LibGDX en avance de phase, mais je pense que cette action n'était pas encore dans leur compétence : **lire de la JavaDoc** !

On a pu aborder, sans les étudier en profondeur, la gestion des fichiers en ressource (images, sons), la gestion des logs. Seule les exceptions ne sont pas mis en oeuvre alors qu'elles font parties des fondamentaux du développement Java.

Il reste encore pas mal de choses à coder, comme par exemple la scénarisation des niveaux, décrite dans des fichiers (XML par exemple) car pour l'instant les ennemis son générés alétoirement, indéfinement, par vague successives.

Si c'était à refaire, je le referais, mais en y consacrant plus que 20 heures et en jalonnant un peu plus les étapes de réalisation pour ne pas en "perdre" certains. Je pense au final m'être plus amusé qu'eux ...

S'ils lisent cet article, je les invite d'ailleurs à faire part de leurs commentaires sur cette partie "ludique" de l'apprentissage du développement.

Le code source du projet est disponible sur mon repository GitHub : <https://github.com/fxrobin/Xenon_Reborn>
