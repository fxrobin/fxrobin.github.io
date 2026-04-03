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
