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
| `~` d'approximation en prose | le nombre nu + "en moyenne" / "de l'ordre de" (ex : "2,72 s en moyenne sur 5 runs", jamais "~2,72 s") |
| `~+`, `+/-`, `±` | "de X à Y" ou "à ... près" (ex : "à 2 ms près", jamais "+/- 2 ms") |

**Exception** : les guillemets français `«»` restent acceptables dans les citations directes d'exemples issus du corpus existant.

## Exemple

```
# Mauvais (style IA)
Java — et c'est bien connu — est verbeux…

# Correct (style humain)
Java est verbeux, c'est bien connu...
```

```
# Mauvais (style IA)
Démarrage en ~10 ms, soit +/- 2 ms...

# Correct (style humain)
Démarrage en 10 ms, à 2 ms près...
```

Pas de tiret long même pour les incises : reformuler ou utiliser des parenthèses.

**Exception** : `~` reste légitime dans les chemins Unix (`~/.sdkman`) et les blocs de code. La règle ne vise que la prose : un humain écrit "en moyenne", une IA écrit "~".
