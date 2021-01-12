---
layout: post
title: Questions de POO
subtitle: Rien de bien sorcier
logo: java.png
category: JAVA
tags: [Java, POO]
---

<div class="intro" markdown='1'>

Petit questionnnaire de POO

</div>
<!--excerpt-->

## Question 01

Trouvez les identificateurs respectant les conventions de nommage Java.

1. `nombre_Elements`
1. `NOMBRE_MAX_MESSAGES`
1. `age_de_la_personne`
1. `âgeDeLaPersonne`
1. `MaClasse`
1. `afficherMessage`
1. `GESTION_Personnes`

## Question 02

Quelle est la présentation en mémoire (en bits) de ces types primitifs Java.

1. `long`
1. `float`
1. `byte`
1. `int`
1. `double`
1. `short`

## Question 03

En Java le transtypage (cast) entre un type primitif de plus faible précision vers un type primitif
de plus grande précision est automatique et implicite.

- Vrai
- Faux

## Question 04

En Java, quelle combinaison de mots-clés fait qu’un identificateur pourra être la référence vers une constante ?

1. `public static abstract`
1. `public static final`
1. `public abstract final`
1. `private final abstract`

## Question 05

Quels seront les cas qui apparaitront sur la console si les instructions suivantes sont
exécutées ?

```java
int i = 3;
switch (i) {
    case 1 : System.out.println("Cas 1");
    case 2 : System.out.println("Cas 2");
    case 3 : System.out.println("Cas 3");
    default : System.out.println("Cas par défaut");
}
```

1. Cas 1
1. Cas 2
1. Cas 3
1. Cas par défaut

## Question 06

Comment nomme-t-on les attributs partagés par l’ensemble des instances d’une classe ?

1. variable de classe
2. variable d’instance

Quel mot-clé Java est employé pour les désigner ?

1. `static`
1. `abstract`

## Question 07

Une classe peut-elle disposer de plusieurs constructeurs ?

- Oui
- Non

## Question 08

Quelle erreur (ou exception) sera obtenue suite à l’appel d’une méthode sur une référence non affectée ?

1. `IOException`
1. `ClassCastException`
1. `NullPointerException`
1. `OutOfMemoryError`

## Question 09 

L’identité d’un objet est caractérisée par un nombre restreint de ses champs alors que l’état d’un objet est caractérisé par l’ensemble des valeurs de ses champs.

- Vrai
- Faux

## Question 10

Reliez chaque étape du cycle de vie d’un objet :

1. Instanciation
1. Utilisation
1. Désuétude
1. Destruction

Avec sa définition :

1. Usage des méthodes de l’objet.
1. Suppression de l’espace occupé par l’instance en mémoire.
1. Perte de référence de l’objet par la JVM.
1. Obtention d’une nouvelle référence.

## Question 11

Reliez chaque design pattern :

1. Facade
1. FactoryMethod
1. Observer
1. Singleton
1. Builder

Avec sa catégorie :

1. Constructeurs
1. Structuraux
1. Comportementaux

## Question 12

Quelles méthodes doivent être redéfinies en Java pour tester l’égalité entre deux objets ?

1. `equals` et `compareTo`
1. `equals` et `hashCode`
1. `compareTo` et `hashCode`
1. `toString` et `compareTo`

## Question 13

Reliez chaque définition ...

1. Permet de déclarer qu’une classe hérite d’une autre.
1. Permet de déclarer une classe ou une méthode comme étant abstraite.
1. Permet à une instance de classe fille de faire référence à une instance de sa classe mère.
1. Permet d’empêcher la redéfinition d’une méthode.
1. Permet de déclarer les interfaces implémentées par une classe.
1. Permet d’empêcher l’héritage d’une classe.

... avec le mot clé Java qui correspond :

1. `final`
1. `extends`
1. `implements`
1. `super`
1. `abstract`
1. `throws`

## Question 14

Dans le paradigme « Model View Presenter », le « modèle » est capable de modifier l’état de la « vue ».

- Vrai
- Faux

Le paradigme « Modèle Vue Contrôleur » est constitué de couches qui s’échangent des informations les unes avec les autres.

- Vrai
- Faux

## Question 15

Quelles sont les différentes façons de cloner l’instance d’une classe ?

1. Une copie superficielle.
1. Une copie par héritage.
1. Une copie en profondeur.
1. Une copie par référence de valeur.
1. Une copie par valeur de référence.

## Question 16

En JAVA, quelle est l’interface mère de toute exception ?

1. `Throwable`
1. `Runnable`
1. `Comparable`
1. `RuntimeException`

## Question 17

Toute classe possédant au moins une méthode abstraite est abstraite.

- Vrai
- Faux

Une classe abstraite qui ne possède pas de méthode abstraite peut être instanciée.

- Vrai
- Faux

Une classe abstraite ne contient aucune méthode concrète.

- Vrai
- Faux

## Question 18

Qu’est-ce qu’un fichier `.class` en JAVA ?

1. C’est un fichier qui représente le code exécutable par une JVM.
1. C’est un fichier converti en ByteCode par un compilateur JAVA.
1. C’est un fichier qui contient le code source d’une classe JAVA.
1. C’est un fichier à installer dans le JDK pour compiler en Java.

## Question 19

L’identificateur « Selectionnable » est associé intuitivement à ...

1. Une interface.
1. Une classe.
1. Une classe abstraite.
1. Une méthode.
1. Un paramètre de méthode.

## Question 20

Une interface peut être déclarée `protected` pour n’être utilisée qu’au sein de son propre « package ».

- Vrai
- Faux

## Question 21

Quels sont les moyens de découplage entre deux classes ?

1. Une méthode redéfinie.
1. Une surcharge de méthode.
1. Une interface.
1. Une classe abstraite.

## Question 22

Qu’est-ce que le graphe d’objets d’une application ?

1. C’est l’ensemble des interfaces et de leurs liaisons entre elles.
1. C’est l’ensemble des instances et de leurs relations entre elles.
1. C’est l’ensemble des héritages entres les classes d’objets.

## Question 23

Soit une classe A ayant un attribut « private int compteur ». Est-ce qu’une classe B
héritant de A pourra accéder directement à cet attribut ?

1. Oui
1. Non

## Question 24

Quelle est l’interface la plus adéquate pour manipuler l’instance d’une classe « ArrayList » ?

1. L’interface `Properties`
1. L’interface `List`
1. L’interface `AbstractList`
1. L’interface `AbstractCollection`
1. L’interface `Set`

## Question 25

Quelles sont les affirmations qui caractérisent l’opérateur « new » ?

1. Il permet d’instancier une nouvelle JVM.
1. Il permet de cloner un objet selon le concept « Deep Copy ».
1. Il permet d’instancier une classe et d’allouer un espace en mémoire.
1. Il crée une dépendance forte entre deux classes.
1. Aucune de ces affirmations n’est exacte.

## Question 26

Quel mot clé JAVA est utilisé pour indiquer un héritage entre deux « packages » ?

1. `extends`
1. `implements`
1. `inherits`
1. `define`
1. Aucune de ces propositions.

## Question 27

La méthode `toString()` de la classe `Object` est abstraite, mais elle peut ne pas être redéfinie.

- Vrai
- Faux

## Question 28

Quel mot clé JAVA doit être placé sur la définition d’une classe pour empêcher qu’une autre classe en hérite ?

1. `static`
1. `private`
1. `protected`
1. `final`

## Question 29

Qu’est que la « visibilité » ?

1. Elle permet de définir le niveau d’accessibilité de certains éléments comme des champs, des méthodes voire même des classes entières.
1. Elle permet de redéfinir l’accès aux objets par la JRE.
1. Elle permet de rendre exécutable un programme en fonction du profil de l’utilisateur qui serait authentifié sur l’application.
1. Elle permet d’activer ou de désactiver des objets lors du développement d’une application.

## Question 30

Qu’est-ce que le principe d’encapsulation ?

1. C’est qu’un objet fasse uniquement référence à d’autres objets.
1. C’est qu’une classe encapsule des méthodes d’autres classes.
1. C’est qu’une classe masque et protège son implémentation.
1. C’est qu’un objet protège son accès avec le modificateur « protected ».
1. C’est qu’une méthode encapsule l’appel d’une autre méthode par factorisation.

## Question 31

En Java, qu’est-ce qu’un Bean ?

1. C’est une classe qui protège ses champs avec `private`.
1. C’est une classe qui propose des « getters/setters publics » sur ses champs.
1. C’est une classe qui met en œuvre l’encapsulation.
1. C’est une classe qui propose forcément un constructeur publique sans argument.
1. Aucune de ces affirmations n’est exacte.

## Question 32

Sur quels éléments doivent porter le codage des méthodes `equals` et `hashCode` d’un objet ?

1. Sur l’ensemble des champs de l’objet.
1. Sur tous les attributs privés de l’objet.
1. Sur les attributs qui caractérisent l’identité de l’objet.
1. Sur les méthodes qui accèdent aux états de l’identité de la classe.
1. Sur les redéfinitions des attributs d’identité de l’objet.

## Question 33

Quelle nouvelle fonctionnalité apparue avec la version 5 de Java permet d’être plus rigoureux et d’obtenir des programmes plus robustes par rapport à l’usage de constantes exprimées de manières classique ?

1. Les « generics »
1. L’ « autoboxing »
1. Les « enums »

## Question 34

En programmation orientée objet, le mécanisme d'héritage permet :

1. De factoriser du code
1. D’obtenir un comportement générique
1. De généraliser les concepts
1. De bénéficier, de manière implicite, de l'ensemble des fonctionnalités d’une classe existante, dans la définition d’une nouvelle classe
1. De protéger les attributs.

## Question 35

Sélectionnez les affirmations correctes au sujet des classes abstraites.

1. Une classe abstraite est une classe qui ne peut pas être instanciée
1. Une classe abstraite est utilisée pour factoriser des comportements qui seront réutilisés directement ou indirectement par ses sous-classes
1. Une classe abstraite contient au moins une méthode abstraite
1. Une classe possédant au moins une méthode abstraite est considérée comme abstraite

## Question 36

Quel mécanisme est mis en oeuvre dans cet exemple ?

```java
public class MaClasse {

    public void afficher() {
        System.out.println("-- Méthode 1 sans paramètre !");
    }

    public void afficher(String messageEntete) {
        System.out.println("-- Méthode 2 avec paramètre !");
        System.out.println(messageEntete);
    }

    public void afficher(String messageEntete, boolean sousAppel) {
        System.out.println("-- Méthode 3 avec paramètres !");
        if (sousAppel) {
            this.afficher(messageEntete);
        }
        else {
            System.out.println("-- Pas de sous appel");
        }      
    }
}
```

1. L’encapsulation
1. La redéfinition
1. L’héritage
1. L’implémentation
1. La surchage
1. La dépendance


## Question 37

Que faut-il modifier ou ajouter à la méthode « afficher » de cette classe pour empêcher sa redéfinition ?

```java
public class A {

    public void afficher() {
        System.out.println("-- Méthode de la classe A.");
    }
}
```

1. Il faut remplacer `public` par `private`
1. Il faut placer `final` entre `void` et "afficher()`
1. Il faut placer `final` entre `public` et `void`
1. Il faut placer `no extends` avant `public`
1. Il faut placer `no extends` après `public`
1. Il faut placer `static` avant `public`

## Question 38

Comment coder ce diagramme de classe UML ?

```
[Matiere]<-------->[Stagiaire]
         1     0..* 
```

1. Il faut placer dans la classe `Matiere` un attribut `Stagiaire stagiaire` et un attribut `List <Matiere> matiere` dans la classe `Stagiaire`
1. Il faut placer dans la classe `Matiere` un attribut `Stagiaire stagiaire` et un attribut `Matiere matiere` dans la classe `Stagiaire`
1. Il faut placer dans la classe `Matiere` un attribut `List <Matiere> matieres` et un attribut `Stagiaire stagiaire` dans la classe `Stagiaire`
1. Il faut placer dans la classe `Matiere` un attribut `List <Stagiaire> stagiaires` et un attribut `Matiere matiere` dans la classe `Stagiaire`

## Question 39

Quel mécanisme est mis en oeuvre dans cet exemple ?

```java
abstract class Aircraft {

}

class Fighter extends Aircraft {
    public String toString() {
        return "I am a fighter";
    }
}

class Bomber extends Aircraft {
    public String toString() {
        return "I am a bomber";
    }
}

class FighterBomber extends Fighter, Bomber {
    public String toString() {
        return super.Fighter.toString() + " " + super.Bomber.toString();

    }
}

// usage :

List <Aircraft> aircrafts = new LinkedList<>();
aircrafts.add(new Fighter());
aircrafts.add(new Bomber());
aircrafts.add(new FighterBomber());
aircrafts.forEach(System.out::println);
```

1. Le polymorphisme d'héritage
1. la redéfinition adhoc
1. l'encapsulation
1. aucun de ces concepts

## Question 40

Comment simplifier cette méthode ?

```java
public boolean canFire(Aircraft a) {
    if (a != null && a.isFighter() && a.getAmmoLevel() > 0) {
        return true;
    } else {
        return false;
    }
}
```

Solution à écrire en code Java.
