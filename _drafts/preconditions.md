---
layout: post
title: Préconditions de méthodes
subtitle: Parce qu'il faudrait toujours vérifier les arguments
logo: jshell-http-server.png
category: JAVA
tags: [Java, Guava, Apache Preconditions]
---

<div class="intro" markdown='1'>
Quand on élabore une API accessible par une autre portion de code, que ce soit
en interne sous forme de librairie JAR ou à distance via un service REST, il faut
toujours vérifier les arguments et leur contenu passé à nos méthodes.

Mais bon, en Java "de base", c'est particulièrement laborieux, rébarbatif et cela
engendre une fainéantise exacerbée, dommageable à la qualité et à la robustesse du code



</div>

<!--excerpt-->

## La problématique


Partons du principe que nous devons coder une méthode, accessible depuis du code tiers, qui accepte trois arguments :
* un nom exprimé en majuscules, sans espaces, ni caractères spéciaux
* un age entre 0 et 150 ans
* une image PNG contenue dans un tableau de bytes

## La manière classique en JAVA

```java

private static Pattern pattern = Pattern.compile("[AZ]*");

public void execute(String name, Integer age, byte[] photo)
{
    if (name==null)
    {
        throw new RuntimeException("le nom ne peut être nul");
    }

    if (!pattern.match(name))
    {
        throw new RuntimeException("Le nom doit être écrit en majuscules");
    }   

    if (age == null || (age <= 0 && age >= 150))
    {
        throw new RuntimeException("L'age doit être entre 0 et 150 ans");
    }

    if (photo==null)
    {
        throw new RuntimeException("Une photo doit être fournie");
    }

    if (!isPngData(photo))
    {
        throw new RuntimeException("La photo n'est pas au format PNG");
    }


    // Tout est testé, ou presque
    // On peut considérer que les informations sont correctes.
    // On pourrait maintenant exécuter le vrai Job ...
  
}

```

On est d'accord, c'est long et ennuyant ... voire carrément lourdingue.
Qu'existe-t-il pour nous faciliter tout cela ?

## Apache Preconditions / Guava / Java 8 Objects

## Precondition "Fait maison"

Le "fait maison", sauf au restaurant, en général j'évite : sauf quand je trouve vraiment rien qui me convienne et c'est malheureusement 
le cas avec Apache Precondtions et Guava.

En effet, ces deux librairies n'exploitent pas la puissance des expressions lambdas et notamment des références de méthodes et constructeurs.
Impossible par exemple de désigner le constructeur d'une exception pour qu'elle soit instanciée a posteriori, ou encore de produire une chaine
avec du formatage type "printf" ou "String.format".

Donc c'est parti, voici à quoi cela va ressembler, en tout cas pour la première méthode qui vérifiera la non nullité d'un paramètre.

```java
public final class Preconditions
{
    
    public static void checkNonNull(Object checkedParameter, String format, Object... args)
    {
        if (checkedParameter == null) 
        {
            throw new IllegalArgumentException(String.format(format, args));
        }
    }
}
```



## EJB @AroundInvoque et Bean Validation

## CDI @Interceptor et Bean Validation




