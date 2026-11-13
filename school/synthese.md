# Synthèse — réécriture de phrases avec un Transformer préentraîné

## Problème

Le programme prend une phrase déjà écrite et la réécrit dans une voix choisie. La voix principale imite un message professionnel sérieux : les images de travail doivent rester vraies si on les lit littéralement, le ton ne cligne pas de l’œil, et les nombres de la phrase de départ ne doivent pas changer. D’autres voix (assistant, note interne, ressources humaines, argot) servent à montrer que la consigne change le texte sans changer les poids.

Ce n’est pas une traduction vers une autre langue. C’est une génération conditionnelle. Le sujet est libre dans le travail pratique ; l’algorithme utilisé est bien un Transformer.

## Algorithme

Un Transformer décodeur, comme celui décrit par Vaswani et ses coauteurs en 2017, prédit le prochain jeton à partir des jetons déjà produits. Un jeton est un morceau de texte. Chaque jeton est un vecteur (un plongement). L’auto-attention laisse chaque position consulter les autres grâce à des requêtes, des clés et des valeurs. On répète ça sur plusieurs couches, puis on tire le jeton suivant.

Le modèle chargé est `huihui-ai/Huihui-Qwen3-4B-Instruct-2507-abliterated` (Hugging Face, licence Apache 2.0). C’est une ablitération de `Qwen/Qwen3-4B-Instruct-2507` : une direction de refus est retirée des poids déjà préentraînés. Ce n’est pas un entraînement depuis zéro, et ce n’est pas l’élève qui ajuste les poids. `config.json` reprend la même architecture que le Qwen3-4B d’origine : environ 4,0 milliards de paramètres, 36 couches, une attention groupée (32 têtes de requête, 8 têtes clé-valeur), une taille cachée de 2560, et des poids en bfloat16. C’est un modèle *instruct* sans mode « réflexion ». On ne charge pas la variante qui écrit un bloc `<think>`.

Qwen a fait le préentraînement et le post-entraînement. L’ablitération ne réentraîne pas le réseau. Ici il n’y a pas d’entraînement. `generate` est appelé une fois les poids en mémoire. `model.eval()` et `torch.inference_mode()` empêchent une mise à jour des poids. Changer le prompt n’est pas apprendre : la preuve, une consigne plus stricte a donné une phrase pire, avec les mêmes poids.

## Données

Il n’y a pas de jeu étiqueté pour ajuster un classifieur. Les phrases ont été écrites pour ce projet.

- Huit phrases de développement, dont la phrase de référence sur un moment gênant. Cette phrase n’est pas dans le prompt et n’est pas dans le test.
- Trente-deux phrases de test : quotidien, banal, gênant, ridicule, argot, professionnel, court, long, et des phrases avec des nombres. Fichiers : `benchmarks/dev_sentences.json` et `benchmarks/test_sentences.json`.

Le choix de la consigne et de la température s’est fait sur le développement seulement. Le test a été généré après ce choix.

## Architecture du programme

Une API locale (FastAPI) garde le modèle en mémoire vidéo. Chaque requête construit un message système (les règles de la voix) et un message utilisateur (la phrase seule), applique le gabarit de conversation du modèle, tokenise, génère, puis décode seulement les jetons nouveaux. Si CUDA n’est pas disponible, l’API le dit. Elle ne bascule pas sur le processeur et n’appelle pas de modèle en ligne.

Le matériel mesuré est un ordinateur Windows 11, processeur Ryzen 9 7900X3D, 31,1 Gio de mémoire vive, carte NVIDIA GeForce RTX 5080 avec **16 303 Mio** de mémoire vidéo. PyTorch `2.15.0+cu134` voit la capacité de calcul 12.0 (`sm_120`). Avec le Qwen d’origine, après chargement, les poids occupaient **7 672,3 Mio**. L’ablitération a la même taille de tenseurs en BF16 ; la mesure du nouveau chargement est dans `docs/model_swap.md`. Ce n’est pas la mémoire vive, et ce n’est pas une RTX 4080.

## Évaluation

Trois mesures automatiques : le temps de génération, la mémoire vidéo maximale, et la rétention des chiffres (un `8` écrit « eight » compte comme un échec). Les notes humaines de sens, de fidélité au style et d’humour métaphorique sont présentes dans les fichiers de résultats et laissées vides. On ne les a pas inventées. Le BLEU n’a pas été utilisé : une bonne métaphore partage peu de mots avec la source, donc un score de recouvrement punirait la blague.

Sur le développement, même graine, température 0,7 :

| Variante | Latence moyenne | Rétention des chiffres |
| --- | --- | --- |
| A, paraphrase | 3,19 s | 1,0 |
| B, consigne courte | 5,44 s | 0,5 |
| C, règles sans exemples | 5,72 s | 0,75 |
| D, règles et exemples originaux | 3,35 s | 1,0 |

D a été gardée. A gardait les chiffres mais nommait le sujet (« bowel movement », `#BowelHealth`). B a refusé la phrase de référence. C a inventé l’heure 14:37. D a produit la métaphore du « system purge » sans nommer l’acte et sans inventer d’heure. Les températures 0,9 et 1,1 n’ont pas amélioré ce texte : à 1,1 le modèle a inventé « 11:47 p.m. ». Le défaut reste donc 0,7, qui est aussi la valeur de la fiche Qwen. Une réécriture plus stricte du prompt (r2) a été mesurée puis rejetée : elle inventait « 3:17 p.m. » et changeait « half a page » en « one page ».

Sur les 32 phrases de test, avec D figée : latence moyenne **4,19 s**, médiane **3,98 s**, maximum **7,60 s**, pointe mémoire moyenne **7 825 Mio**. Rétention moyenne des chiffres sur les 13 phrases qui en contiennent : **0,81**. Trois de ces 13 en perdent au moins un.

## Limites

L’échec le plus net : « I owed Maya $18 and paid her back $20 by mistake » est devenu un paiement de 20 $ qui dépasse l’obligation de 2 $. Le 18 a disparu. Le modèle a calculé au lieu de copier. Ailleurs, « 8 » et « 11 » deviennent « eight » et « eleven ». Le sens approximatif reste, le chiffre exact non.

Le style n’est pas non plus fiable. Sur le pain brûlé, D a écrit que le pain était à la fois pas assez cuit et trop cuit. Les voix « ressources humaines » et « corporatif » inventent souvent un correctif absent du texte. La voix assistant, après correction, se limite souvent à « Certainly. » plus une paraphrase très proche. L’argot demandé est court et peu marqué (« My rice was a fire. »).

Le second passage de réécriture existe dans le code et reste éteint. Les cases de notation humaine restent vides. Une amélioration directe serait de rejeter une sortie qui a perdu un chiffre de la source, puis de relancer une seule fois.
