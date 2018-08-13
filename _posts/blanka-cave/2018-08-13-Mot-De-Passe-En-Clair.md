---
layout: post
title: Mot de passe en clair en base de données
logo: blanka.png
category: blanka
---

BRRRRRRRRRRRAAAAAAAAAAAHhhhhhhhh !!! Grrr !

Gens doivent arrêter :

- concaténer SQL avec saisie utilisateur
- stocker mots de passe en clair en base de données !

Gens doivent :

- utiliser JDBC `PreparedStatement` ou JPQL `setParameter`
- hasher avec BCRYPT + Salt

Blanka sympa, Blanka donner lien à lire : <https://crackstation.net/hashing-security.htm>