# Patterns de teaser - Bloc intro

Tout article commence par `<div class="intro" markdown='1'>` suivi de `<!--excerpt-->`.

L'intro doit accrocher et promettre sans tout révéler. Elle se termine toujours sur une friction ou une promesse, jamais sur une conclusion.

## Les 6 patterns du corpus

| Pattern | Exemple tiré du corpus | Effet |
|---------|------------------------|-------|
| **La règle choc + promesse** | *"J'en donne une : **n'utilisez pas** `@Data` et je vais vous expliquer pourquoi. Un peu de patience."* | Crée une attente |
| **Le spoiler-fin retardé** | *"rien de plus simple... mais je le garde pour la fin de ce billet"* | Tire le lecteur jusqu'à la conclusion |
| **Le voyage dans le temps** | *"Retour en 1986, Nom de Zeus !"* | Immersion immédiate |
| **La question rhétorique** | *"Connaissez-vous bien l'instanciation ?"* | Challenge l'ego du lecteur |
| **L'aveu d'hérésie** | *"une idée, certes un peu étrange... je ne renonce pas à la beauté du geste"* | Sympa, auto-dérision |
| **Le panorama + promesse** | *"cet article tente de faire le tour de la question, sans prétention, en ratissant assez large"* | Humble et exhaustif |

## Teasers intermédiaires

Pour les articles longs, relancer la curiosité en fin de section :

- *"C'est quand même bien pratique mais on peut aller encore plus loin."*
- *"Ca commence déjà à faire des choses plutôt agréables, mais ce n'est pas fini ! Loin de là ..."*
- *"Quelques explications :"* (après un bloc de code dense, on respire)
- Poser une question rhétorique puis y répondre dans la section suivante

## Titres de sections (H2/H3)

Eviter les titres génériques. Préférer :
- La question directe : "Lombok, à quoi cela sert ?", "Que va-t-on tester ?"
- L'annonce avec ironie : "Et la plateforme Java alors ?", "Et un lazy thread-safe, un..."
- La mise en jambe pour les sections introductives
- "Préconisations (enfin...)" - le "(enfin...)" crée de l'attente accumulée

## Plan type d'un article technique

```
1. Intro teaser (div.intro)
2. Mise en contexte / La problématique / Le constat
3. Démonstration par l'exemple (progressif : simple -> complexe)
   - Situation de départ (sans la solution)
   - Amélioration étape par étape
   - Version finale / recommandée
4. Préconisations / Bonnes pratiques (H2 avec "(enfin...)")
5. En guise de conclusion
```

## Conclusion

Header canonique : `## En guise de conclusion`

Structure :
1. Récapitulatif en 1-2 phrases
2. Ce qui n'a pas été couvert -> promesse d'un prochain article
3. Appel à la participation du lecteur

Formules de clôture typiques :
```
*On va dire que ça fera partie d'un prochain billet ...*

**N'hésitez pas à me faire part de vos [retours/usages/questions] en commentaire.**
```
