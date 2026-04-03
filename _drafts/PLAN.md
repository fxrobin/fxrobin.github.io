# Plan de rédaction des drafts

Dernière mise à jour : 2026-04-03

## Articles à finir — par priorité

### 🔴 1. Maven / Javadoc / Lombok / Java 21
**Fichier :** `maven-javadoc-lombok-java-21/2024-10-04-maven-javadoc-lombok-java-21-fr.md`  
**Avancement :** ~70%  
**Ce qui manque :**
- Reécrire le teaser (pattern "règle choc + promesse")
- Compléter le bloc XML vide dans `## Solution` (pom.xml avec plugin delombok) — sources dispo
- Compléter le bloc XML vide du profil Maven dans `### Quel est mon meilleur profil ?`
- Enrichir la conclusion (angle ChatGPT/Copilot inutiles → autodérision)

**Plan de sections final :**
```
div.intro (reécrire)
## Lombok : cette bibliothèque que j'aime
## Mais quel est le problème ?
## Le projet de démonstration
## Ajout de la génération de la JavaDoc (warnings à montrer)
## La solution : delombok à la rescousse
  ### Pourquoi delombok ?
  ### Ajout du plugin delombok (XML manquant à compléter)
  ### L'effet de bord dans l'IDE
  ### Quel est mon meilleur profil ? (profil Maven à compléter)
  ### Résultat final (Javadoc sans warnings)
## En guise de conclusion
```

---

### 🟠 2. Focus sur `List<T>` — ArrayList vs LinkedList
**Fichier :** `focus-list.md`  
**Avancement :** ~15%  
**Front matter à corriger :** ajouter `lang: fr`, `ref`, `permalink`, `category: articles`  
**Ce qui manque :**
- Teaser à écrire (pattern "question rhétorique")
- Section complexité algorithmique : tableau Big-O + schéma mémoire
- Démonstration par le code : benchmark ArrayList vs LinkedList sur ajout en tête
- Section "Quand choisir quoi ?" avec règle d'or
- Conclusion

**Plan de sections :**
```
div.intro (reécrire)
## Ah, parce qu'il y a plusieurs implémentations de List<T> ?
## La complexité algorithmique, sans prise de tête
  → Tableau Big-O : accès, insertion début/milieu/fin, suppression
  → Schéma mémoire ArrayList vs LinkedList
## Démonstration par le code
  → Benchmark simple, sortie console
## Quand choisir quoi ? (enfin !)
  → Tableau de décision + règle d'or
## En guise de conclusion
```

---

### ~~🟡 3. Eclipse Collections~~ - PUBLIE le 2026-04-03
**Fichier :** `_posts/articles/eclipse-collections/2026-04-03-eclipse-collections-fr.md`

**Plan de sections :**
```
div.intro (bonne base, à peaufiner)
## A vos marques ! Prêts ? Partez ! (pom.xml ok)
## Petit tour de l'API
  → MutableList / ImmutableList vs List JDK
  → Rich API : select, reject, collect, detect, injectInto
  → Comparatif avec Stream API
## Exemples concrets
  → Filtrage + transformation en une ligne
  → Partition d'une liste
  → Performances sur grande collection
## Préconisations (enfin !)
  → Quand utiliser EC vs Stream API
  → Interop avec les API JDK standard
## En guise de conclusion
```

---

### 🟡 4. Questions POO
**Fichier :** `questions-poo.md`  
**Avancement :** 80% questions / 0% réponses  
**Format atypique** (quiz) — à retravailler comme article interactif  
**Ce qui manque :**
- Front matter : ajouter `lang`, `ref`, `permalink`, corriger `category`
- Intro avec mise en situation (public cible : étudiants / entretiens)
- Réponses avec courte explication pour chaque question
- Corriger Q39 (héritage multiple invalide en Java — intentionnel ?)

---

## Idées à démarrer

### 💡 L'Obsession des Primitives — ou pourquoi votre `String email` ment depuis le début
**Statut :** idée, pas encore de fichier  
**Angle :** craftsmanship — le code smell *Primitive Obsession* et comment Java Records le résout élégamment  
**Accroche :**
```java
// Rien n'empêche d'appeler ça à l'envers — le compilateur ne dit rien
User createUser(String firstName, String lastName, String email, String phone)
```
**Plan pressenti :**
```
## Un exemple qui fait mal
## Le pattern Value Object (et pourquoi vous l'évitez)
## Java Records : le Value Object sans douleur
## Validation incluse : le compact constructor
## Sealed classes : aller encore plus loin (états, variantes)
## Intégration avec Lombok, JPA, Jackson (les pièges courants)
## Préconisations (enfin !)
## En guise de conclusion
```
**Connexions avec articles existants :** Lombok, API preconditions, coding style  
**Sources de référence :**
- https://www.javacodegeeks.com/2025/09/immutable-java-why-value-objects-can-make-your-code-bulletproof.html
- https://www.infoq.com/articles/exploring-java-records/
- https://enterprisecraftsmanship.com/posts/entity-vs-value-object-the-ultimate-list-of-differences/

---

## Mis de côté (sans priorité)

### Architecture Père Noël
**Fichier :** `x-mas-architecture/x-mas-architecture-fr.md`  
Stack à mettre à jour (Java 11 → Java 21, Quarkus 3.5 → LTS actuel) avant d'envisager la finalisation.

---

## Supprimés / Archivés

| Draft | Raison |
|---|---|
| `angular8-javaee.md` | Stack obsolète (Angular 8, Java EE 8, RethinkDB) |
| `choisir-js-angular-react-vue-webcomponents.md` | Non prioritaire, trop daté |
