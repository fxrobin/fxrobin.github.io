# Tics de génération IA - Ce qu'il faut éviter (et ce qu'il faut garder)

Ces règles sont fondées sur une analyse grep du corpus existant (32 fichiers publiés).

## Tournures à bannir - absentes du corpus, marqueurs IA avérés

- "Il est important de noter que", "Il convient de souligner", "Force est de constater", "Il va sans dire que"
- "il semblerait que", "dans la plupart des cas", "il est généralement admis"
- "fascinant", "élégant" appliqués au code
- "La bonne nouvelle, c'est que...", "C'est une excellente question"
- "Par ailleurs," et "Cela étant dit," en début de phrase
- Capitaliser les Concepts Sans Raison : "la Programmation Orientée Objet", "le Développement Logiciel"

## A conserver - l'auteur les utilise naturellement

Vérifiés dans le corpus, à ne pas bannir par erreur :

| Expression | Occurrences | Exemple réel |
|------------|-------------|--------------|
| "Ainsi," | 7 | "Ainsi, il suffit de 3 variables globales :" |
| "De fait," | 1 | "De fait, il est maintenant compréhensible" |
| "puissant" | 8 | "une bibliothèque très puissante dont je ne peux plus me passer" |
| "robuste" | 3 | "m'avait semblé robuste" |
| "très simple/pratique" | 9 | "C'est vraiment très pratique ce live reload !" |
| "C'est là que" | 1 | "C'est là que ça se complique" |
| "Je vais maintenant [action directe]" | 1 | "Je vais maintenant le restructurer à ma façon" |

## Structure à éviter

- Résumer ce qu'on vient de faire en fin de section (sauf conclusion finale)
- Conclusions qui répètent l'intro avec d'autres mots
- Présenter "les deux côtés" systématiquement même quand ce n'est pas le sujet
- "Il existe 3 façons principales de..." quand le nombre est arbitraire

**Nuance sur "Je vais maintenant..."** : acceptable quand c'est une action directe ("Je vais maintenant le restructurer"), pas acceptable comme méta-commentaire creux ("Je vais maintenant vous expliquer ce que nous venons de voir").

## Bullets : usage correct vs tic IA

Les bullets sont normaux dans ce blog (637 occurrences dans le corpus). Ce qui trahit l'IA :
- Items tous de longueur identique avec structure grammaticale parfaitement parallèle
- Toujours exactement 3 ou 5 items
- Bullets pour ce qui se lirait naturellement en une phrase

Bons usages (corpus) : lister des annotations Lombok, énumérer les specs d'un processeur rétro, détailler des étapes d'installation, présenter les options d'un choix technique.

## Rythme

Un texte humain a un rythme irrégulier. Phrases courtes. Puis une phrase plus longue qui développe une idée, prend le temps d'argumenter, et assume de ne pas être parfaitement concise. Des digressions entre parenthèses (comme dans les articles existants). Des opinions tranchées sans sur-qualification.

## Gimmicks classiques des IA génératives (revue web, sept. 2026)

Sources : détection statistique Pangram (jusqu'à 45x de surreprésentation), Wikipedia "Signs of AI writing", Forbes fév. 2026. Règle d'or : **aucun signal isolé n'est une preuve, c'est la densité qui trahit**. Un "paysage" perdu dans 5 000 mots ne veut rien dire ; cinq tics par paragraphe, si.

### Vocabulaire à bannir

| Gimmick (FR / EN) | Pourquoi ça trahit | Écrire à la place |
|---|---|---|
| (se) plonger dans, plongée dans / delve, dive in | le tic n°1, documenté jusque dans les revues scientifiques | regarder de près, examiner, "voici ce que j'ai trouvé" |
| tapisserie, tisser / tapestry | métaphore décorative sans détail réel | nommer la chose concrètement |
| paysage + nom abstrait / landscape | "le paysage Quarkus" ne veut rien dire | le mot précis : l'écosystème, la doc, les versions |
| exploiter (tout le potentiel), harnais / leverage, harness | jargon corporate des modèles | utiliser |
| libérer, débloquer (le potentiel) / unleash, unlock | incantation sans chiffre | chiffrer le gain |
| passer au niveau supérieur, booster / elevate, supercharge | promesse vide | dire ce qui change concrètement |
| sans couture (en rafale) / seamless | un "seamless" isolé passe, trois c'est une pub | un seul adjectif précis |
| changer la donne / game-changer | slogan, jamais une mesure | décrire l'effet mesuré |
| joue un rôle crucial / clé / plays a crucial role | formule passe-partout | dire qui fait quoi |
| témoigne de, est un témoignage de / testament | solennité artificielle | "ça montre", "la preuve :" |
| mine d'or (d'informations) / treasure trove | pirate des données | "tout ce qu'il faut", avec le contenu derrière |
| se lancer dans un voyage / embark on a journey | on teste un framework, on ne part pas en croisade | commencer, tester, mesurer |
| vibrant, grouillant, niché / vibrant, bustling, nestled | adjectifs de carte postale | adjectifs qui décrivent vraiment |
| dans le royaume de / in the realm of | cadrage creux | couper, attaquer le sujet |

### Tournures à bannir

- "dans le monde en constante évolution d'aujourd'hui", "à l'ère du numérique" / "in today's fast-paced world" : dater précisément ("depuis Quarkus 3.38") au lieu d'incanter l'époque. "Dans un monde où..." est toléré dans le corps du texte, jamais en accroche d'intro.
- "de nombreux experts suggèrent", "les résultats peuvent varier" : nommer la source ou assumer ("je mesure"), pas de neutralité tiède.
- "En conclusion," / "Pour conclure," / "In conclusion," en ouverture : récap + promesse (voir `teaser-patterns.md`), pas d'étiquette.
- "Imaginez...", "Et si... ?" en série / "Imagine...", "Picture this" : une seule question rhétorique max, puis la réponse.
- "Voici ce que la plupart des gens ratent", "je vais être on ne peut plus clair" : annoncer moins, livrer plus. La clarté ne se proclame pas.
- "Excellente question !" et validations non sollicitées : attaquer direct, sans flatterie.
- "non seulement... mais aussi" et "ce n'est pas X, c'est Y" systématiques / "not only... but also", "it's not just X, it's Y" : varier les parallélismes au lieu d'enfiler le même moule.
- "là où X rencontre Y" / "where X meets Y" : dire la relation concrètement.

### Structure à surveiller

- Triades parallèles en rafale (rapide, simple, puissant à chaque paragraphe) : la règle de trois systématique est un tic, varier les longueurs de listes.
- Transitions empilées en ouverture de paragraphes successifs (De plus, Par ailleurs, Cependant, En outre / Moreover, Furthermore, Additionally) : Aussi, Mais, Donc.
- Gras sur un mot sur deux : grasser l'affirmation, pas le décor.
- Titres EN en Title Case : phrase case, comme en FR.

### Exception corpus

"robuste" / "robust" figure dans les listes de tics du web, mais l'auteur l'emploie naturellement (8 occurrences vérifiées). Le corpus local tranche : on conserve, et on ne déclenche l'alerte que sur l'empilement avec d'autres tics.
