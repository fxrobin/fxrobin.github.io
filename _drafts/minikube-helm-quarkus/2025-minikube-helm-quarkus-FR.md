---
layout: post
title: 'Exécuter une application sur Kubernetes avec Quarkus'
subtitle: A l'aide de Helm et de Minikube
logo: java.png
category: articles
tags: [Java, Quarkus, Kubernetes, Helm, Minikube]
lang: fr
ref: quarkus-helm-minikube
permalink: /quarkus-helm-minikube/
---

<!--excerpt-->
<div class="intro" markdown='1'>
L'objectif de ce tutoriel est de vous montrer comment exécuter une application Quarkus sur Kubernetes à l'aide de Minikube et Helm.
</div>

## Prérequis 

TODO

## Installer Minikube

Pour installer Minikube, vous pouvez suivre les instructions sur le [site officiel de Minikube](https://minikube.sigs.k8s.io/docs/start/).

```bash
$ curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
$ sudo install minikube-linux-amd64 /usr/local/bin/minikube
$ minikube status
minikube
type: Control Plane
host: Stopped
kubelet: Stopped
apiserver: Stopped
kubeconfig: Stopped
```

Lancez Minikube avec le driver Docker :

```bash
$ minikube start --driver=docker
😄  minikube v1.35.0 on Ubuntu 22.04 (amd64)
✨  Using the docker driver based on existing profile
👍  Starting "minikube" primary control-plane node in "minikube" cluster
🚜  Pulling base image v0.0.46 ...
🔄  Restarting existing docker container for "minikube" ...
🐳  Preparing Kubernetes v1.32.0 on Docker 27.4.1 ...
🔎  Verifying Kubernetes components...
    ▪ Using image gcr.io/k8s-minikube/storage-provisioner:v5
🌟  Enabled addons: default-storageclass, storage-provisioner

❗  /usr/bin/kubectl is version 1.28.15, which may have incompatibilities with Kubernetes 1.32.0.
    ▪ Want kubectl v1.32.0? Try 'minikube kubectl -- get pods -A'
🏄  Done! kubectl is now configured to use "minikube" cluster and "default" namespace by default
```

Vérifiez que Minikube est bien démarré :

```bash
$ kubectl config current-context
minikube
```

## Installer Helm

```bash
$ curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
$ helm repo add stable https://charts.helm.sh/stable
$ helm repo add bitnami https://charts.bitnami.com/bitnami
$ helm repo update
```
