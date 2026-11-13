# Existing project and assignment inventory

Inspection date: 2026-11-13. Read-only. No project source was modified.

Assignment file (outside the workspace): `C:\Users\tdgf\Downloads\TP_Algorithmes_ML_Entrevue_et_Mini_Projet-final.docx` (39,718 bytes). Text extracted with Python `zipfile` plus `xml.etree` from `word/document.xml`. `python-docx` is not installed. Pandoc was not used. Nothing was installed.

Document metadata (`docProps/core.xml`): creator `python-docx`, author `Rehouma, Haythem`, created and modified `2026-09-12T13:27:00Z`. Footer text: "Travail pratique - Algorithmes de Machine Learning".

## Project inventory

Workspace: `C:\Users\tdgf\OneDrive\Bureau\CODE\transformer`.

The workspace is empty. It is not a skeleton and not an existing app. Recursive listing (`Get-ChildItem -Force -Recurse`) found one directory and zero files:

```
transformer/
  .squish/          empty directory, no files inside
```

| Item | Status |
| --- | --- |
| Language | None. No source files. |
| Framework | None. |
| Dependencies | No `requirements.txt`, `pyproject.toml`, `package.json`, lockfile, or environment file. |
| README | Absent. |
| Machine-learning code | Absent. No training, inference, dataset, notebook, or model files. |
| Frontend | Absent. |
| Tests | Absent. |
| Git | No `.git` directory. |
| Caches | No `node_modules`, `.venv`, `__pycache__`, or `.git` objects. `.squish` exists and is empty. |

Default `python` (`C:\Users\tdgf\AppData\Local\Programs\Python\Python312\python.exe`, 3.12.10) cannot import `torch`, `transformers`, `docx`, `fastapi`, `flask`, `streamlit`, or `gradio`.

## What to preserve

Nothing in this workspace is application source, configuration, tests, data, or documentation worth carrying into a new app.

Leave `.squish` in place. It is an empty tool directory, not project code. This inspection did not delete or restructure it.

Absent, and therefore not something to preserve: README, dependency manifests, ML code, datasets, notebooks, frontend, tests, git history, and any trained or pretrained weights.

## Assignment requirements

Title: "Travail pratique en Machine Learning". Subtitle: "Présentation orale et démonstration d’un petit programme". Course: "Machine Learning / Intelligence artificielle".

The whole handout is written in French. It does not explicitly require "français québécois", and it does not name a required spoken dialect. The expected talk, slides, and short write-up are in the language of the handout (French). Windows UI culture on this host is `en-US`. The workspace path uses `Bureau`, the French name for Desktop.

### Format

- "Mode de travail": "Individuel ou en équipe de 2, selon les modalités annoncées en classe".
- "Durée indicative": "7 à 10 minutes au total, dont 2 à 3 minutes de démonstration".
- "Remise": "Date communiquée en classe". No calendar date is in the file.

### General instructions (quoted)

- "Choisissez un seul algorithme dans la liste proposée."
- "Préparez une courte présentation de son principe, de ses usages et de ses limites."
- "Développez un petit programme Python sur un sujet libre avec l’algorithme choisi."
- "Faites une démonstration du programme et expliquez ses résultats à la classe."
- "Remettez votre code, vos diapositives et une courte synthèse du projet."
- "Un sujet avancé n’est pas nécessaire pour obtenir une bonne évaluation."

### Allowed algorithms

Choose exactly one row from the table. Levels run from Débutant to Avancé. The Transformer row is allowed:

| Algorithme ou modèle | Type | Problème | Niveau | Idée de mini-projet |
| --- | --- | --- | --- | --- |
| Transformer | Selon la tâche | Texte, vision ou multimodal | Avancé | Analyser un texte, résumer ou classifier une phrase. |

Other allowed rows: régression linéaire, régression logistique, arbre de décision, Random Forest, XGBoost ou LightGBM, K-Nearest Neighbors, SVM, Naive Bayes, K-Means, PCA, réseau de neurones MLP, CNN, LSTM ou GRU.

The suggested Transformer mini-project is text analysis, summarization, or sentence classification. Translation is not named. The subject is still free: "Le sujet est libre, mais votre programme doit utiliser réellement l’algorithme choisi."

### Program constraints (quoted)

- "Un notebook Jupyter ou un script Python suffit ; aucune interface graphique n’est exigée."
- "Vous pouvez utiliser une bibliothèque adaptée, comme scikit-learn, sans recoder l’algorithme de zéro."
- "Choisissez un jeu de données accessible, citez sa source et expliquez le problème à résoudre."
- "Présentez les variables utilisées et les étapes de préparation des données."
- "En apprentissage supervisé, séparez les données d’entraînement et de test. Ajustez les prétraitements uniquement sur l’entraînement."
- "Entraînez le modèle ou utilisez un modèle préentraîné en précisant votre contribution."
- "Évaluez les résultats de manière adaptée : erreur de prédiction, score de classification, qualité des groupes ou variance expliquée, selon le cas."
- "Prévoyez un exemple exécutable pour la démonstration et affichez au moins un résultat lisible : prédiction, matrice de confusion, groupes ou projection."
- "Concluez sur les résultats, les limites observées et une amélioration possible."

Pretrained models are allowed. The student must state what they contributed. The algorithm must actually be used. A library implementation is allowed; rewriting the algorithm from scratch is not required.

### Presentation must cover

- "Définissez l’algorithme en une phrase simple."
- Learning type: "supervisé, non supervisé ou autre."
- Task: "classification, régression, regroupement, réduction de dimension ou autre."
- How it works, with a concrete example and its main parameters.
- "Présentez au moins deux avantages et deux limites."
- "Justifiez votre méthode d’évaluation et interprétez les résultats."
- Live run: "montrez une entrée, le traitement par le modèle et la sortie obtenue."
- "Préparez une ou deux questions d’entrevue sur l’algorithme, avec vos réponses."

Interview questions the student must be able to answer: when the algorithm is used, main advantages, limits or risks, how to know the model works, what overfitting means here and how to reduce it, why that evaluation metric, and when the algorithm would be a bad choice. Also explain one's own contribution, including in a team of two.

### Deliverables (quoted expectations)

| Livrable | Attente |
| --- | --- |
| Diapositives | "Fichier PowerPoint, PDF ou Google Slides exporté en PDF." |
| Programme et exécution | "Notebook ou script Python, dépendances et consignes d’exécution dans un README." |
| Jeu de données | "Source des données et exemple utilisé pendant la démonstration." |
| Courte synthèse | "Une à deux pages : problème, algorithme, résultats, limites et sources." |

### Grading (100 points)

| Critère | Points | Description |
| --- | --- | --- |
| Compréhension de l’algorithme | 25 | "Définition claire, intuition correcte, type de problème bien identifié." |
| Présentation et démonstration | 15 | "Explications claires, démonstration fonctionnelle, interprétation de la sortie, respect du temps." |
| Programme et code | 25 | "Algorithme réellement utilisé, code lisible, exécution reproductible, étapes expliquées." |
| Évaluation des résultats | 15 | "Métriques pertinentes, visualisation claire, interprétation des résultats." |
| Analyse critique | 10 | "Forces, limites, erreurs possibles, pistes d’amélioration." |
| Livrables et professionnalisme | 10 | "Fichiers complets, consignes d’exécution, sources citées, remise organisée." |

### Closing constraints (quoted)

- "Votre évaluation porte sur votre compréhension de l’algorithme, le fonctionnement du programme et la qualité de vos explications."
- "Un programme simple, bien expliqué et correctement évalué répond pleinement aux attentes."
- "Vous devez citer les sources de données et de code utilisées et pouvoir expliquer tout code remis."

Pre-submission checks in the handout: algorithm clearly identified, presentation explains the mechanism with a simple example, program runs and the demo example is ready, the student can explain input, code steps, and output, limits are mentioned, and submitted files are well named and easy to open.

## Host environment facts

Observed from this Cursor session on 2026-11-13. Commands were PowerShell, not a Linux shell. `uname` is not available.

| Fact | Observed value |
| --- | --- |
| OS | Microsoft Windows 11 Pro, version 10.0.26200, build 26200, 64-bit (`Win32_OperatingSystem`). `[System.Environment]::OSVersion` reported `Microsoft Windows NT 10.0.26200.0`. |
| Shell | PowerShell 7.6.10 |
| Computer | `GABOPC` |
| User | `tdgf` |
| Architecture | `AMD64` / `PROCESSOR_ARCHITECTURE=AMD64` |
| CPU | AMD Ryzen 9 7900X3D, 12 cores, 24 logical processors |
| RAM | 33,435,672,576 bytes (about 31.1 GiB) |
| Discrete GPU | `nvidia-smi`: NVIDIA GeForce RTX 5080, driver 617.42, 16303 MiB |
| Other GPU | AMD Radeon(TM) Graphics, driver 32.0.21030.2001 |
| UI culture | `en-US` (`Get-Culture` and `Get-UICulture`) |
| WSL | `kali-linux` Stopped, version 2 (default). `docker-desktop` Stopped, version 2. No Arch Linux distro listed. |
| Python on PATH | `python` → 3.12.10 at `...\Python312\python.exe`. `py` launcher default → 3.14.0. Also installed: 3.13. |
| Working directory | `C:\Users\tdgf\OneDrive\Bureau\CODE\transformer` |

The claim that the target laptop is Arch Linux with an RTX 4080 does not match this host. This workspace machine is Windows 11 Pro with an RTX 5080. No Arch environment was running or listed.

## Gaps relative to a local Transformer translator app

A local Transformer translator is a possible free-topic project, not a requirement. The handout's Transformer idea is "Analyser un texte, résumer ou classifier une phrase." A translator would still have to be one algorithm, really use a Transformer, stay explainable, and fit a 7–10 minute talk with a 2–3 minute demo.

Gaps between this empty Windows workspace and that app:

1. No application exists. There is no code, UI, dataset, README, test, or git history to extend.
2. A graphical translator is beyond the minimum. The handout says a Jupyter notebook or a Python script is enough, and "aucune interface graphique n’est exigée."
3. PyTorch and Hugging Face `transformers` are not importable on the default Python 3.12. Dependencies and run instructions would have to be created and documented in a README.
4. If the model is pretrained, the write-up and talk must state the student's own contribution. Citing data and code sources is mandatory, and the student must be able to explain every submitted line.
5. Supervised use requires a train/test split, with preprocessing fit on the training split only. Evaluation must use a metric suited to the task, plus a readable displayed result. A translation demo still needs an evaluation story (for example a reported score and an interpreted example), not only a generated sentence.
6. Required artifacts that do not exist: slides (PowerPoint, PDF, or Google Slides exported to PDF), dataset source plus the demo example, and a one-to-two-page synthesis (problem, algorithm, results, limits, sources).
7. Scope risk against the grading note that a simple, well explained, correctly evaluated program fully meets expectations. A full local translator product is larger than the stated deliverable.
8. Hardware claim mismatch. Local GPU execution on this machine would be Windows + RTX 5080 (16 GB class), Ryzen 9 7900X3D, about 31 GiB RAM. Arch Linux and an RTX 4080 were not observed here. WSL has Kali and Docker Desktop, both stopped, and neither is Arch.
