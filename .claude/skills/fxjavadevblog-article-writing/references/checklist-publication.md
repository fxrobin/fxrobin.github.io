# Checklist avant publication

## Front matter
- [ ] `layout`, `title`, `subtitle`, `logo`, `category`, `tags`, `lang`, `ref`, `permalink` présents
- [ ] `ref` identique entre les versions FR et EN
- [ ] `permalink` cohérent avec le `ref`
- [ ] `redirect_from` si remplacement d'une ancienne URL

## Structure
- [ ] `<div class="intro" markdown='1'>` présent avec un teaser qui accroche et promet
- [ ] `<!--excerpt-->` placé juste après le bloc intro (pas avant, pas ailleurs)
- [ ] Progression pédagogique claire (simple -> avancé, avant -> après)
- [ ] Au moins un cliffhanger intermédiaire pour les articles > 5 sections
- [ ] Conclusion avec `## En guise de conclusion` + appel commentaires

## Code
- [ ] Langage déclaré sur chaque bloc (```java, ```bash, ```yaml...)
- [ ] Nom du fichier affiché avant le bloc quand pertinent
- [ ] Sortie console montrée après le code quand il y en a une

## Contenu
- [ ] Images : texte alternatif présent sur chaque `![alt](url)`
- [ ] Aucun tic IA (voir `references/anti-ia-tics.md`)

## Typographie
- [ ] Aucun tiret long `—` ni tiret moyen `–`
- [ ] Aucun `…` Unicode - utiliser `...`
- [ ] Aucun guillemet courbe `"` `"` ni apostrophe typographique `'`

## Bilinguisme (si applicable)
- [ ] Deux fichiers distincts avec le même `ref`
- [ ] Deux `permalink` différents
