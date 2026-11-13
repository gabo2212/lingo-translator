# Démonstration en classe

Lancer d’abord l’API, depuis la racine du projet :

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\start.ps1
```

Attendre que `GET http://127.0.0.1:8000/api/health` réponde `"status": "ready"`. Le premier chargement lit les poids déjà dans le cache (`%USERPROFILE%\.cache\huggingface`). Les trois appels ci-dessous utilisent la graine 13 et la température 0,7. Avec cette graine, la phrase 1 a donné deux fois le même texte (essai fumée, puis jeu de développement).

Les sorties citées sont celles mesurées le 13 novembre 2026 avec `Qwen/Qwen3-4B-Instruct-2507`. Le serveur charge maintenant `huihui-ai/Huihui-Qwen3-4B-Instruct-2507-abliterated`, une ablitération de ce 4B (une direction de refus retirée des poids déjà entraînés, pas un entraînement de l’élève). Une relance peut donc différer. Montrer le texte à l’écran. Le changement de modèle est dans `docs/model_swap.md`.

## 1. LinkedIn motivationnel, métaphore

Entrée gênante et banale. La voix ne doit pas nommer l’acte.

```powershell
Invoke-RestMethod -Uri http://127.0.0.1:8000/api/translate -Method Post -ContentType "application/json; charset=utf-8" -Body '{"text":"I took a massive dump just now","style":"linkedin","linkedin_tone":"motivational","temperature":0.7,"seed":13}'
```

Sortie mesurée (`linkedin.motivational.D.r1`, 2,784 s une fois le modèle chaud) :

> I just completed a large-scale system purge at the end of the cycle.
> All data streams were cleared and the system returned to baseline integrity.
> #SystemStability #OperationalClosure #DataIntegrity

Dire à la classe : « large-scale » porte « massive », « just completed » porte « just now », « purge » et « cleared » portent l’événement, et rien ne cligne de l’œil. La première génération dans un processus froid a pris 47,5 s à cause des noyaux CUDA ; les suivantes tournent autour de 3 à 4 s.

## 2. Voix assistant, phrase simple

```powershell
Invoke-RestMethod -Uri http://127.0.0.1:8000/api/translate -Method Post -ContentType "application/json; charset=utf-8" -Body '{"text":"I burned the rice.","style":"chatgpt","temperature":0.7,"seed":13}'
```

Sortie mesurée :

> Certainly. You burned the rice.

C’est reconnaissable comme assistant, et c’est presque une copie. Le dire. Un essai plus ancien, avant la ligne « Certainly. » du prompt, avait renvoyé seulement « I burned the rice. »

## 3. La même entrée, deux voix

Garder « I burned the rice. » et changer seulement `style`.

LinkedIn motivationnel, mesuré sur le jeu de test avec la même graine :

> The batch of rice failed to reach the required doneness and was discarded during the initial quality check.
> No further use was made of the affected portion.
> #ProcessIntegrity #FailSafe #QualityControl

```powershell
Invoke-RestMethod -Uri http://127.0.0.1:8000/api/translate -Method Post -ContentType "application/json; charset=utf-8" -Body '{"text":"I burned the rice.","style":"linkedin","linkedin_tone":"motivational","temperature":0.7,"seed":13}'
```

À côté, la sortie ChatGPT de l’étape 2. Même fait (le riz a brûlé), deux registres. « Discarded » et « quality check » ne sont pas dans la phrase source : c’est une limite à nommer, pas un succès parfait.

Si le réseau est lent, ces trois appels suffisent. Ne pas enchaîner le jeu de test de 32 phrases pendant la présentation.
