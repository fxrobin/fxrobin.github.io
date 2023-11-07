---
layout: post
title: "Contribuer à l'Eclipse Foundation : DONE"
subtitle: plutôt que d'attendre en pestant sur sa chaise ...
logo: eclipse.png
category: articles
tags: [OpenSource, Eclipse, Java, GlassFish, GlasFishTools]
lang: fr
ref: contribuer-eclipse-foundation-done
---

<div class="intro" markdown='1'>
Comme tout bon développeur Java, je suis un gros consommateur des solutions fournies par l'Eclipse Foundation.
Je ne vais en citer que quelques-unes : Eclipse IDE, EclipseLink, Eclipse GlassFish, Jetty, Eclipse EGit, Eclipse Maven Integration, etc.

Il était donc temps, au lieu d'attendre *en ronchonnant* qu'un patch ne soit développé, de **contribuer en fournissant un correctif** à un projet.
</div>

<!--excerpt-->

## Contexte

Je vais faire court : Payara 5, dérivé supporté de GlassFish 5 est sorti officiellement le 22/03/2018. Son numéro de version `5.181` contenu dans le fichier MANIFEST du module `glassfish-api.jar` n'est pas compatible avec le plugin "GlassFish Tools" d'Eclipse. Ce dernier se fonde sur une expression régulière qui refuse que le second numéro comporte plus d'un chiffre.

Exemples :

* `4.1.1` : OK
* `4.0` : OK
* `5.9` : OK
* `5.181` (Payara): **NOK** !

![Payara](/images/payara.png)

Il existe un *Workaround* que l'on trouve sur StackOverflow qui consiste à modifier le MANIFEST de Payara, **mais c'est moche** (donc je ne donne pas le lien).

En me baladant *au hasard* pendant mon weekend sur le projet Eclipse GlassFish Tools, je détecte qu'il ne faut que modifier l'expression régulière de la classe "GlassFishInstall" du projet.

Confiant, je me lance donc dans la correction, son test et sa publication, ayant déjà participé, en tant que committer, à un projet [OpenSource COFAX, sur SourceForge](https://sourceforge.net/projects/cofax/) en 2008. De plus j'ai déjà pas mal pratiqué GitHub pour des projets perso, mais aussi sur des projets *forkés* via *PULL REQUEST*. Cependant ces deux expériences ne me serviront pas à grand-chose dans ce cas.

> À bien y réfléchir, peut-être que si, un peu quand même.

## Eclipse Bugzilla

En réalité, je passe un peu de temps sur le Bugzilla de la fondation Eclipse.
Je cherche éventuellement le bug dans le système pour y ajouter un commentaire, mais d'emblée je ne le trouve pas.

> Note : je ne sais pas trop comment j'ai fait pour ne rien trouver, car après coup, on y trouve
> tout de suite une *issue* en tapant "GlassFish Tools" dans le moteur de recherche.

Je me décide alors à créer une *issue*, mais lors de la saisie, il me propose un *duplicate* qui correspond.
En fait je ne l'avais pas trouvé car cette *issue* n'avait pas été encore validée et *OPEN*.

J'y rajoute donc un commentaire et je conserve précieusement le code du Bug *532854* pour l'ajouter à mon *commit* quand ce sera le moment.

> Au passage, Bugzilla n'est pas configuré entièrement sur UTF-8, la "cédille" de mon prénom est en carafe ! Ce n'est pas bien M. Eclipse Foundation !

## Git : clonage du projet

En allant sur le site dédié, je trouve donc le site d'hébergement des sources du projet qui fonctionne avec Git:

`http://git.eclipse.org/gitroot/gerrit/glassfish-tools/glassfish-tools.git`

Cette URL me permet de récupérer le source

> Malheureusement, je le découvrirai plus tard, elle ne conviendra pas pour publier mon correctif.

Je fais mon `git clone [url]` et j'obtiens les sources, ce qui me permet de localiser rapidement la classe incriminée. Son import dans Eclipse se passe sans aucun problème donc je ne vais rien détailler à ce sujet.

## Correctif

Voici la partie la plus simple, je m'attaque à la classe `GlassFishInstall` et son pattern de détection de version : 

```java
private static final Pattern VERSION_PATTERN = Pattern.compile( "([0-9]\\.[0-9](\\.[0-9])?(\\.[0-9])?)(\\..*)?" );
```

La correction est triviale, je rajoute `{1,3}` après le premier point détecté dans la *regexp*.

```java
private static final Pattern VERSION_PATTERN = Pattern.compile( "([0-9]\\.[0-9]{1,3}(\\.[0-9])?(\\.[0-9])?)(\\..*)?" );
```

Je teste mon expression régulière sur différentes valeurs avec des outils en ligne, puis je teste en lançant de la feature dont fait partie le plugin sous forme de "Eclipse Application".

J'ai plusieurs versions de GlassFish d'installées sur mon poste et de Payara, donc je teste toutes les instances.
Tout fonctionne du premier coup, comme d'habitude :-) :-) Aïe mes chevilles ...

> À ce moment précis, je m'autocongratule derrière mon clavier, puis devant la glace de la salle de bain : *"La machine Tuck Pendleton, zéro défaut !"*. Un cadeau à gagner pour celui qui me dit de quel film est issue cette phrase dans les commentaires, avec le minutage !

Enfin, je me décide à le publier sur son repository Eclipse.

> L'autocongratulation ne va pas durer longtemps.

Confiant, mais en même temps je me doutais que cela n'allait pas être possible, je tente un "PUSH" et là, patatra... **Je n'ai pas le droit de faire l'opération : logique**.

La suite détaille ma quête pour publier mon correctif.

## Gerrit

Je commence donc à chercher des articles ou des références liées à la contribution pour l'Eclipse Foundation.

Je trouve peu de choses finalement et je me rends compte que le repo git est géré par Gerrit.

Pour contribuer, il va me falloir :

* un compte Eclipse (ok ça j'en ai déjà un) et activer l'ECA : Eclipse Contributor Agreement
* s'enregistrer sur Gerrit avec le compte Eclipse
* générer un compte et un password sur Gerrit : c'est ce compte qui servira pour git.

Une fois toutes ces opérations faites, le PUSH ne fonctionne toujours pas.
Logique encore, pourquoi aurais-je le droit sur le "master" sans être un committer officiel ?

Ce qui m'aide, comme souvent, c'est [cet article du site de Lars Vogel](http://www.vogella.com/tutorials/EclipsePlatformDevelopment/article.html).

Je découvre, avec le moteur de recherche de Gerrit un autre projet et une autre URL pour GlassFish Tools, qui me mettent la puce à l'oreille:

* PROJET : `glassfish-tools/glassfish-tools`
* URL : `https://[username]@git.eclipse.org/r/a/glassfish-tools/glassfish-tools`

Un peu perdu dans la configuration du PUSH STREAM par rapport à mon repo git, je décide alors de faire un clone de ce nouveau repo, dédié au DEV
de contributeurs enregistrés et authentifiés sur le site Eclipse (ECA).

Je réapplique mon correctif dans ce nouveau repo, qui est identique à l'autre.
J'ai choisi cette "tactique" car j'avais vraiment fait très peu de modification sur le code source.
Sinon j'aurais cherché un peu plus comment reparamétrer l'upstream, mais je ne voulais plus me 
complexifier la démarche.

Je *commit* en faisant bien attention au format du message :

```
Bug 532854 - Payara 5 directory is not accepted

Changing the pattern of the matcher. 

Change-Id: I0000000000000000000000000000000000000000
Signed-off-by: François-Xavier Robin <...@...com>
```

> l'Id sera changé automatiquement par Bugzilla.

Voici le tracker : [https://git.eclipse.org/r/#/c/120562](https://git.eclipse.org/r/#/c/120562)

## PUSH PUSH PUSH

Et quand je *PUSH*, miracle, cela fonctionne.
Je consulte Gerrit : mon correctif est bien présent.

Je me félicite, tel le politicien moyen.

> Bon pas trop, parce que j'ai un peu cherché quand même. 

## Plugin Eclipse EGerrit

> Et, à la fin, c'est *Starsky & Hutch* qui gagnent ? 

Non, je tombe, en fin de parcours, sur ce plugin Eclipse : [EGerrit](https://marketplace.eclipse.org/content/egerrit).

Je lui fournis mes *credentials* et j'obtiens, dans une *view eclipse : EGerrit dashboard*, l'ensemble des informations liées au Gerrit de la foundation Eclipse :

![EGerrit](/images/glassfish-tools/egerrit.png)

Pour m'y connecter, j'ai fourni :

* l'URL du Gerrit de l'Eclipse Foundation : `https://git.eclipse.org/r`
* le login/password **Eclipse Foundation** (attention, pas celui pour interagir via Git sur un repo Gerrit)

Je vois qu'il y a une *issue* concernant l'association avec le JDK 9, ce sera donc mon
prochain fix, maintenant que tout est configuré.

> Mais les *bandits sont toujours en cavale et en voiture c'est poursuite infernale* ...

## Conclusions

Je bascule en mode *économie d'énergie* pour lister les points-clés de cette *aventure* :

* correction rapide : c'était même pas du Java mais une pauvre *regexp*.
* publication longue : un temps un peu trop long à trouver la démarche.
* satisfaction du devoir accompli : le bonheur, ça n'a pas de prix.
* encore un truc qui ne devait prendre que 15 minutes ...

> Certains projets Eclipse sont sur GitHub. C'est le cas de "GlassFish AppServer" ou encore de "Payara".
> Dans ce cas les manipulations sont différentes et sont "classiques" avec des PULL REQUESTS.

## Builds

Pour ceux qui n'auraient pas la patience de l'intégration de ce BugFix dans le build officiel, voici
le build de la *deployable feature* :

{%include download.html url="/downloads/org.eclipse.glassfish.tools-ROBIN-Bug-FIX-532854.zip" title="org.eclipse.glassfish.tools-ROBIN-Bug-FIX-532854.zip" %}

> Attention, ce build n'est livré que temporairement et ne se substitue pas aux futurs builds.

Pour l'installer : cliquer sur `Help` > `Install new software`.

### Etape 01

Cliquer sur `Add` puis `Archive` : séléctionner le fichier ZIP téléchargé précédemment.

![Etape 01](/images/glassfish-tools/GlassFishTools_FIX_532854_01.png)

### Etape 02

![Etape 02](/images/glassfish-tools/GlassFishTools_FIX_532854_02.png)

> Attention à bien décocher : "Group items by category" et "Hide items that are already installed"

Cliquer sur `Next` et laisser faire l'installation.

## Liens utiles

* <http://www.vogella.com/tutorials/EclipsePlatformDevelopment/article.html>
* <https://git.eclipse.org/c/>
* <https://marketplace.eclipse.org/content/egerrit>
* <https://wiki.eclipse.org/EGerrit/User_Guide>
