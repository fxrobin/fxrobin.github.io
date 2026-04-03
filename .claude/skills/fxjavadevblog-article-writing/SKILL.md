---
name: fxjavadevblog-article-writing
description: Use when writing or drafting a blog post for fxjavadevblog.fr. Apply when creating new posts, continuing drafts, proposing a teaser/intro, reviewing tone or structure, or checking that a text sounds human and not AI-generated.
---

# FX JavaDevBlog - Rédaction d'articles

## Vue d'ensemble

Blog technique personnel sur Java, retro-computing et Linux. Style : pédagogique, humoristique, ancré dans des exemples réels et du code fonctionnel. Objectif : lecteur accroché dès l'intro, tiré vers la suite par des promesses ou des cliffhangers.

## When to Use

- Créer ou continuer un article dans `_posts/` ou `_drafts/`
- Ecrire un bloc intro / teaser
- Choisir le bon ton (tutoiement rétro vs vouvoiement Java/tech)
- Vérifier qu'un texte sonne humain, pas généré

**Ne pas utiliser** pour les pages statiques (`about.md`, `cv-fxrobin.md`) ou les fichiers de config Jekyll.

## Structure obligatoire

```
front matter → <div class="intro"> teaser → <!--excerpt--> → sections H2/H3 → ## En guise de conclusion
```

Template front matter complet et règles de nommage : `references/front-matter-template.md`

**Progression :** toujours avant→après ou simple→avancé. Chaque fin de section doit relancer la curiosité ("mais ce n'est pas fini !"). Voir `references/teaser-patterns.md` pour les 6 patterns d'intro du corpus.

## Voix et ton

- **Tutoiement** pour les articles rétro, **vouvoiement** pour les articles Java/tech
- Première personne directe : "j'ai choisi", "après 4 ans d'usage", "je ne peux plus m'en passer"
- Humour léger sans forcer : références cinéma, expressions familières ("mini-rikiki", "un truc de dingue", "bof bof")
- **Gras** pour affirmations fortes, *italique* pour termes anglais dans du texte FR, `code` pour toute référence technique
- L'intro se termine sur une friction ou une promesse, jamais sur une conclusion

## Common Mistakes

| Erreur | Correct |
|--------|---------|
| Tiret long `—` ou `...` Unicode `…` | ` - ` ou `...` (trois points ASCII) |
| "Il est important de noter que..." | Juste l'affirmer directement, sans intro creuse |
| Bullets mécaniques pour tout | Prose pour les transitions, bullets pour les énumérations réelles |
| Conclusion qui répète l'intro | Récap court + promesse prochain billet + appel commentaires |
| Paragraphes tous de même longueur | Varier : phrases courtes. Puis une plus longue qui développe. |
| Guillemets courbes `"` `'` | Guillemets et apostrophes droits `"` `'` |

## Quick Reference

| Besoin | Fichier |
|--------|---------|
| Template front matter complet | `references/front-matter-template.md` |
| 6 patterns de teaser avec exemples | `references/teaser-patterns.md` |
| Glyphes interdits / typographie | `references/typographie.md` |
| Tics IA à éviter vs style réel de l'auteur | `references/anti-ia-tics.md` |
| Checklist avant publication | `references/checklist-publication.md` |
