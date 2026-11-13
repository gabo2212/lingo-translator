# Réponses d’entrevue

Les chiffres cités ont été mesurés sur la RTX 5080 de cet ordinateur (16 303 Mio de mémoire vidéo). Ils sont détaillés dans `docs/evaluation_report.md`.

## Quel problème le Transformer résout-il ici ?

On a déjà une phrase. Il faut en produire une autre, dans une voix précise, sans inventer de faits. Le Transformer décodeur résout ça en prédisant le prochain jeton à partir de la consigne et de la phrase. Ce n’est ni une classification ni une régression. C’est de la génération conditionnelle.

## Quel type d’apprentissage ?

Les poids viennent d’un préentraînement auto-supervisé (prédire des jetons masqués par la suite du texte) puis d’un post-entraînement fait par Qwen pour suivre des consignes. Le fichier chargé, `huihui-ai/Huihui-Qwen3-4B-Instruct-2507-abliterated`, est une ablitération de ce Qwen3-4B : une direction de refus est retirée des poids déjà préentraînés. Ce n’est pas un entraînement depuis zéro, et ce n’est pas l’élève qui ajuste les poids. Dans ce projet, il n’y a pas d’apprentissage : aucune perte n’est calculée, aucun poids n’est modifié. L’inférence utilise un modèle préentraîné. Écrire un prompt n’est pas entraîner.

## Pourquoi un modèle préentraîné ?

Un Transformer de 4 milliards de paramètres ne s’apprend pas sur un portable de cours, ni sur les 32 phrases écrites ici. Qwen publie des poids Apache 2.0 qui savent déjà produire de l’anglais. La contribution de l’élève est l’application, les consignes originales, et le harnais qui mesure le temps, la mémoire et les chiffres. Pas le préentraînement.

## Comment fonctionne l’auto-attention ?

Chaque jeton est d’abord un vecteur. Pour une position, le modèle calcule une requête. Les autres positions offrent des clés et des valeurs. La ressemblance entre la requête et une clé donne un poids. La sortie est un mélange des valeurs, pondéré par ces poids. Le jeton « juste maintenant » peut ainsi s’appuyer sur le jeton qui porte la quantité. On répète le bloc sur 36 couches dans ce Qwen3-4B. Ensuite le réseau choisit un jeton, l’ajoute, et recommence.

## Avantages et limites

Avantages observés : la voix change pour la même entrée, et une phrase gênante peut devenir un message professionnel qui reste littéralement compatible avec l’événement. Une fois les poids chargés (7 672 Mio), une réponse courte prend autour de 3 à 5 secondes sur cette carte, sans service externe.

Limites observées : les chiffres ne sont pas toujours copiés (rétention 0,81 sur les 13 phrases de test qui en ont un). Le modèle invente aussi des heures, des correctifs, ou un adjectif qui contredit la source. Un réseau de cette taille suit les consignes de façon inégale.

## Que veut dire le surapprentissage ici ?

Le surapprentissage classique, c’est un modèle qui colle aux exemples d’entraînement et rate les exemples nouveaux. Ici les poids ne sont pas ajustés, donc ce surapprentissage-là n’a pas lieu pendant la démo.

L’équivalent, c’est de régler le prompt pour une seule phrase. La phrase de référence n’est pas dans les exemples du prompt et pas dans le test. On a quand même essayé de durcir le prompt après avoir vu les erreurs de développement. Cette version r2 a inventé une heure sur la phrase de référence et a changé « half a page » en « one page ». On l’a rejetée. C’est le bon réflexe : ne pas « entraîner » la consigne sur les erreurs qu’on vient de lire.

## Pourquoi ces mesures ?

Le temps et la mémoire disent si la démo locale est réaliste sur 16 Go de mémoire vidéo. La rétention des chiffres dit si la consigne « ne change pas un nombre » est respectée, et elle se calcule sans opinion. L’humour et la fidélité du style ne se lisent pas dans un recouvrement de mots : une métaphore réussie *doit* changer les mots. Ces notes sont des cases vides, à remplir par une personne. On ne les a pas simulées.

## Quelle est ta contribution ?

L’application locale, les prompts écrits pour ce travail, les phrases de test, et l’évaluation. Pas les poids de Qwen, pas l’article de Vaswani de 2017, et pas le code du dépôt LinkedIn-Translator, qui n’a pas de licence et n’a pas été copié.
