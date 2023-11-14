---
layout: post
title: My JeKyll Tips with Github Pages
subtitle: 5 years of using Jekyll with Github Pages
logo: jekyll-logo.png
category: articles
tags: [Site, Jekyll]
lang: en
ref: my-jekyll-tips-with-github-pages
permalink: /my-jekyll-tips-with-github-pages
---

<div class="intro" markdown='1'>
This is the page where I will put all my tips and tricks for Jekyll and Github Pages.
</div>
<!--excerpt-->


## What is Jekyll and Github Pages ?

Jekyll is a static site generator written in Ruby. It is the engine behind Github Pages.
I've been using it for 5 years now, and I'm very happy with it.

## Running Jekyll locally

Nowadays, it is possible to run Jekyll locally on Windows, Linux and Mac, using Docker.
Altough I have used Jekyll native on Linux for years, I now prefer to use Docker, because it is easier to install and maintain.

Pre-requisites: Docker and Docker must be installed on your system.

If you have a repository with some github pages, you can run Jekyll locally with the following command:

```bash
$ docker run -it --rm -v .:/usr/src/app -p "4000:4000" starefossen/github-pages
```

The docker image "starefossen/github-pages" is a pre-built image with Jekyll and Github Pages GEM installed. It means that you can run Jekyll locally, with the same version of Jekyll and Github Pages as Github without any further installation.

The previous command will run Jekyll in the current directory, and will serve the site on port 4000. You can then browse your site at http://localhost:4000.

## Redirecting some pages

When I migrated some pages to new URLs, I wanted to redirect the old URLs to the new ones. The reason is that some other websites or forum posts could have links to the old URLs, and I wanted to keep them working.

So the trick is very easy because Github Pages supports the HTTP 301 redirections with the installed GEM called `jekyll-redirect-from`.

Simply activate the GEM in your `_config.yml` file:

```yaml
plugins:
  - jekyll-redirect-from
```

Then, in your page, add the following YAML front matter:

```yaml
---
layout: post
title: My JeKyll Tips with Github Pages
redirect_from:
  - /old-url-1
  - /old-url-2
---

My post goes here.
```

## Adding asciinema player

I like to add asciinema player to my posts, to show some terminal sessions. 

First I need to record a terminal session with asciinema:

```bash
$ asciinema rec my-session.cast
```

First, import this JavaScript at the end of the `<body>` tag:

```html
 <script src="/asciinema/asciinema-player.js"></script>  
```

At the top of the page, I can add the following CSS to style the player:

```html
<head>
  <link rel="stylesheet" type="text/css" href="/asciinema/asciinema-player.css">
</head>
```

Then I can add the player to my post:
  
```html
<asciinema-player src="/asciinema/my-session.cast" cols="80" rows="24"></asciinema-player>
```

or create a tag for Jekyll :

```html
<asciinema-player src="{{ include.cast-file }}" idle-time-limit="2"></asciinema-player>
```

This tag can be called like this:
  
```html
{% include asciinema.html cast-file="asciinema/my-session.cast" %}
```

[Here is an example of a page](/Xenon-Reborn) with an asciinema player.

{%include asciinema.html cast-file="/casts/xenonreborn.cast" %}


## Links

- [Jekyll](https://jekyllrb.com/)
- [Github Pages](https://pages.github.com/)
