# Typographie - Glyphes interdits

Ces glyphes trahissent une génération automatique. Les accents français (é, è, à, ù, ô...) sont obligatoires - ce sont des caractères de la langue, pas des glyphes fantaisie.

## Table des interdits

| Caractère interdit | Remplaçant |
|--------------------|------------|
| `—` tiret long (em dash) | ` : ` ou ` - ` ou reformuler |
| `–` tiret moyen (en dash) | `-` (ex: "2020-2025") |
| `…` points de suspension U+2026 | `...` (trois points ASCII) |
| `«` `»` guillemets français | `"` ou supprimer si contexte code |
| `'` apostrophe typographique U+2019 | `'` apostrophe droite |
| `"` `"` guillemets anglais courbes | `"` guillemets droits |

**Exception** : les guillemets français `«»` restent acceptables dans les citations directes d'exemples issus du corpus existant.

## Exemple

```
# Mauvais (style IA)
Java — et c'est bien connu — est verbeux…

# Correct (style humain)
Java est verbeux, c'est bien connu...
```

Pas de tiret long même pour les incises : reformuler ou utiliser des parenthèses.
