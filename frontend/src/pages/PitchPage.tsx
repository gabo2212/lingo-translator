import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import "../pitch.css";

type Shot = {
  src: string;
  alt: string;
  kicker: string;
  caption: string;
  fileHint: string;
  fit: "wide" | "tall" | "mid";
  ui?: boolean;
};

type Slide = {
  id: string;
  title: string;
  layout?: "wide" | "tall" | "stack";
  render: () => ReactNode;
};

function PhotoSpot({ src, alt, fileHint, fit, ui }: Shot) {
  const [phase, setPhase] = useState<"wait" | "ok" | "miss">("wait");
  const frame = `shot shot-${fit}${ui ? " shot-ui" : ""}`;

  return (
    <figure className={frame}>
      <div className="shot-frame">
        {phase === "miss" ? null : (
          <img
            src={src}
            alt={alt}
            onLoad={() => setPhase("ok")}
            onError={() => setPhase("miss")}
            style={phase === "ok" ? undefined : { display: "none" }}
          />
        )}
        {phase === "ok" ? null : (
          <div className="shot-empty">
            {phase === "miss" ? (
              <>
                <p>Emplacement libre.</p>
                <p className="shot-path">{fileHint}</p>
              </>
            ) : (
              <p className="shot-path">Chargement…</p>
            )}
          </div>
        )}
      </div>
    </figure>
  );
}

function LoopVideo({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const start = () => {
      void node.play().catch(() => undefined);
    };
    if (node.readyState >= 2) start();
    else node.addEventListener("canplay", start);
    return () => node.removeEventListener("canplay", start);
  }, []);

  return (
    <figure className="shot shot-mid">
      <div className="shot-frame">
        <video ref={ref} src={src} muted loop playsInline autoPlay />
      </div>
    </figure>
  );
}

function Kicker({ children }: { children: string }) {
  return <p className="deck-kicker">{children}</p>;
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="deck-body">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

const slides: Slide[] = [
  {
    id: "titre",
    title: "Titre",
    layout: "stack",
    render: () => (
      <>
        <Kicker>Présentation</Kicker>
        <h1>Lingo Translator</h1>
        <p className="deck-lede">
          Une phrase ordinaire entre. Elle ressort dans une voix choisie. Je montre d’abord comment c’est branché, puis un exemple à l’écran.
        </p>
        <div className="media-mid">
          <LoopVideo src="/pitch/jensen.mp4" />
        </div>
      </>
    ),
  },
  {
    id: "probleme",
    title: "Le problème",
    layout: "stack",
    render: () => (
      <>
        <Kicker>Le problème</Kicker>
        <h1>La phrase est là. La voix ne va pas.</h1>
        <p className="deck-lede">Réécrire le registre, pas la langue. La consigne ne doit pas se mélanger à la phrase.</p>
        <div className="media-mid">
          <PhotoSpot
            fit="mid"
            src="/pitch/vibe.jpg"
            alt="Image verticale : un homme regarde une ville de nuit, texte au-dessus."
            kicker="Image"
            caption="Pas une entrée du modèle."
            fileHint="frontend/public/pitch/vibe.jpg"
          />
        </div>
      </>
    ),
  },
  {
    id: "solution",
    title: "La solution",
    render: () => (
      <>
        <Kicker>La solution</Kicker>
        <h1>Un appel HTTP. Pas un chat continu.</h1>
        <p className="deck-lede">Chaque morceau a un seul job. La sortie de l’un entre dans le suivant.</p>
        <ol className="deck-floors">
          <li className="deck-floor">
            <b>01 · Page</b>
            <span>Phrase, style, ton.</span>
          </li>
          <li className="deck-floor">
            <b>02 · API</b>
            <span>Valide, ou renvoie un code.</span>
          </li>
          <li className="deck-floor">
            <b>03 · Prompt</b>
            <span>Règles d’un côté, phrase de l’autre.</span>
          </li>
          <li className="deck-floor">
            <b>04 · GPU</b>
            <span>Le jeton suivant, puis le suivant.</span>
          </li>
          <li className="deck-floor">
            <b>05 · JSON</b>
            <span>Texte, modèle, millisecondes.</span>
          </li>
        </ol>
        <p className="deck-note">
          422 style ou texte invalide. 429 une génération déjà en cours, sans file. 503 pas ready. 504 au bout de 120 s. 500 si generate échoue.
        </p>
      </>
    ),
  },
  {
    id: "transformer",
    title: "Le Transformer",
    render: () => (
      <>
        <Kicker>L’algorithme, en clair</Kicker>
        <h1>Il ne traduit pas. Il devine le morceau suivant.</h1>
        <p className="deck-lede">
          Tu finis une phrase à voix haute. Tu regardes les mots déjà dits, certains plus que d’autres, puis tu dis le mot suivant. Un Transformer fait ça avec des nombres, et il recommence jusqu’au point.
        </p>
        <ol className="deck-floors">
          <li className="deck-floor">
            <b>Découper</b>
            <span>La phrase devient des morceaux : un mot, ou un bout de mot. Chaque morceau a un numéro. Le modèle ne voit pas une phrase, il voit cette suite de numéros.</span>
          </li>
          <li className="deck-floor">
            <b>Regarder en arrière</b>
            <span>Pour choisir la suite, chaque morceau demande aux autres : qui compte pour moi ? Dans « j’ai raté le bus », bus compte plus que le. Ça s’appelle l’attention.</span>
          </li>
          <li className="deck-floor">
            <b>Mélanger</b>
            <span>On additionne les morceaux qui comptent, chacun avec son importance. La même opération est refaite en pile. Ici, 36 fois. Chaque passage laisse une version un peu plus utile pour la suite.</span>
          </li>
          <li className="deck-floor">
            <b>Piocher, puis recommencer</b>
            <span>À la fin, chaque morceau possible a une note. On en prend un, on le colle à la phrase, et on refait le tour. Pendant ça, les poids ne changent pas. Le modèle répond, il n’apprend pas.</span>
          </li>
        </ol>
        <p className="deck-note">
          L’article de 2017 lisait une phrase entière, puis écrivait l’autre langue. Le nôtre n’écrit que vers l’avant. L’idée reste la même : avant de continuer, chaque morceau peut regarder les autres.
        </p>
      </>
    ),
  },
  {
    id: "jeton",
    title: "Le jeton",
    layout: "wide",
    render: () => (
      <>
        <Kicker>inference.py · _generate_from_messages</Kicker>
        <h1>Quatre étapes. On peut les dire comme ça.</h1>
        <ol className="deck-floors">
          <li className="deck-floor">
            <b>On met la phrase dans le format du modèle</b>
            <span>apply_chat_template écrit « voici les règles, voici la phrase, à toi de répondre ».</span>
          </li>
          <li className="deck-floor">
            <b>On découpe ce texte en morceaux</b>
            <span>Le tokenizer en fait des numéros, envoyés à la carte graphique. On note combien de morceaux formaient la question.</span>
          </li>
          <li className="deck-floor">
            <b>Le modèle devine le morceau suivant</b>
            <span>model.generate le fait dans inference_mode : il répond, il n’apprend pas. 36 couches, 32 têtes pour chercher, 8 pour retenir.</span>
          </li>
          <li className="deck-floor">
            <b>On ne garde que la réponse</b>
            <span>decode_new_tokens jette la question. clean_generation enlève les balises et un « rewrite: » si le modèle en a mis un.</span>
          </li>
        </ol>
        <PhotoSpot
          fit="wide"
          src="/pitch/salle.jpg"
          alt="Photo horizontale 16:9 : une Leaf devant un commerce, fumée verte."
          kicker="16:9"
          caption="Image large, sous le texte, pas à côté."
          fileHint="frontend/public/pitch/salle.jpg"
        />
      </>
    ),
  },
  {
    id: "roles",
    title: "Le prompt",
    layout: "stack",
    render: () => (
      <>
        <Kicker>Comment la voix est choisie</Kicker>
        <h1>Le bouton ne change pas le modèle. Il change le texte qu’on lui met devant.</h1>
        <Bullets
          items={[
            "Sur la page, LinkedIn ou PDG n’est qu’un nom. build_prompt va chercher ce nom dans styles.yaml.",
            "Le fichier contient les règles de cette voix : rester sérieux, garder le fait, ne pas faire un clin d’œil. Ça devient le message système.",
            "La phrase tapée est le seul message utilisateur. Le modèle doit réécrire ça, pas inventer un autre événement.",
            "Pour LinkedIn, le ton ajoute un deuxième texte, par exemple motivationnel. La variante D colle aussi deux ou trois exemples « phrase → poste », pour montrer le genre de mots, pas une histoire à recopier.",
            "Après ça, le modèle écrit la suite dans cette voix. Les poids ne bougent pas. Le prompt_id à l’écran, comme ceo.base.r1, est juste le nom de la voix envoyée.",
          ]}
        />
        <div className="media-mid">
          <PhotoSpot
            fit="mid"
            src="/pitch/story.png"
            alt="Image verticale : capture d’une story avec un sous-titre."
            kicker="Image"
            caption="Pas une sortie du modèle."
            fileHint="frontend/public/pitch/story.png"
          />
        </div>
      </>
    ),
  },
  {
    id: "linkedin",
    title: "Exemple LinkedIn",
    layout: "wide",
    render: () => (
      <>
        <Kicker>Exemple · ce qui est gardé</Kicker>
        <h1>Exemple</h1>
        <PhotoSpot
          fit="wide"
          ui
          src="/pitch/exemple-ceo.png"
          alt="Capture du bureau : I took a massive dump just now, réécrit en note de PDG, 1,9 seconde."
          kicker="1,9 s · ceo.base.r1"
          caption=""
          fileHint="frontend/public/pitch/exemple-ceo.png"
        />
      </>
    ),
  },
  {
    id: "tirage",
    title: "L’échantillonnage",
    layout: "wide",
    render: () => (
      <>
        <Kicker>frontend · api/client.ts et les hooks</Kicker>
        <h1>La page vérifie le JSON avant de l’afficher.</h1>
        <ol className="deck-floors">
          <li className="deck-floor">
            <b>useHealth</b>
            <span>Appelle GET /api/health. parseHealth refuse la réponse si status, model ou device manque.</span>
          </li>
          <li className="deck-floor">
            <b>useStyleCatalog</b>
            <span>GET /api/styles. Au bout de 8 s, la page garde FALLBACK_STYLES, déjà écrit dans le navigateur.</span>
          </li>
          <li className="deck-floor">
            <b>useTranslation</b>
            <span>POST /api/translate. Un nouvel envoi annule le précédent. Au bout de 130 s, l’appel est coupé.</span>
          </li>
        </ol>
        <PhotoSpot
          fit="wide"
          src="/pitch/cercle.png"
          alt="Image horizontale : un homme aux cheveux gris encerclé en rouge sur une miniature."
          kicker="Paysage"
          caption="Plus large que haute, donc en bande sous les trois lignes."
          fileHint="frontend/public/pitch/cercle.png"
        />
      </>
    ),
  },
  {
    id: "mesures",
    title: "Les mesures",
    layout: "wide",
    render: () => (
      <>
        <Kicker>inference.py · load</Kicker>
        <h1>Les poids montent une seule fois.</h1>
        <ol className="deck-floors">
          <li className="deck-floor">
            <b>_load_on_cuda</b>
            <span>Si CUDA n’est pas là, le statut passe à error. Le code ne bascule pas sur le processeur.</span>
          </li>
          <li className="deck-floor">
            <b>from_pretrained</b>
            <span>Poids en bfloat16, device_map fixé sur cuda:0. Rien n’est déversé sur la RAM.</span>
          </li>
          <li className="deck-floor">
            <b>load une deuxième fois</b>
            <span>Si le modèle est déjà ready, la fonction ressort les mêmes objets. model.eval() est appelé au chargement.</span>
          </li>
        </ol>
        <p className="deck-note">
          health() renvoie status, model, device, gpu_name et dtype. Au démarrage le statut est loading.
        </p>
        <PhotoSpot
          fit="wide"
          src="/pitch/coffre.jpg"
          alt="Photo horizontale 4:3 : coffre de Leaf ouvert, plaque FARTCAR."
          kicker="4:3"
          caption="Paysage, donc sous les chiffres, sur toute la largeur."
          fileHint="frontend/public/pitch/coffre.jpg"
        />
      </>
    ),
  },
  {
    id: "pile",
    title: "La pile",
    render: () => (
      <>
        <Kicker>Les bibliothèques, et ce que chacune fait</Kicker>
        <h1>Deux programmes. Vite les fait se parler.</h1>
        <div className="deck-split">
          <article className="deck-card">
            <b>Page · port 5173</b>
            <p>React dessine les boutons. TypeScript vérifie le code. Vite lance la page et, dans vite.config.ts, renvoie tout ce qui commence par /api vers 127.0.0.1:8000. Le navigateur croit parler au même site.</p>
          </article>
          <article className="deck-card">
            <b>API · port 8000</b>
            <p>FastAPI reçoit le JSON. Pydantic vérifie les champs. Uvicorn fait tourner le serveur. PyYAML lit styles.yaml. PyTorch pose les poids sur la carte. Transformers et tokenizers chargent Qwen et découpent le texte.</p>
          </article>
        </div>
        <p className="deck-note">
          Sans le proxy de Vite, la page sur 5173 ne pourrait pas appeler l’API sur 8000. Hugging Face Hub a seulement téléchargé les poids. Après ça, generate reste sur cette machine.
        </p>
      </>
    ),
  },
];


function readIndex(): number {
  const match = window.location.hash.match(/^#pitch\/(\d+)$/);
  if (!match) return 0;
  const index = Number(match[1]) - 1;
  if (!Number.isFinite(index)) return 0;
  return Math.min(Math.max(index, 0), slides.length - 1);
}

function hashFor(index: number): string {
  return index === 0 ? "#pitch" : `#pitch/${index + 1}`;
}

export function PitchPage() {
  const [index, setIndex] = useState(readIndex);
  const [overview, setOverview] = useState(false);
  const slide = slides[index];

  useEffect(() => {
    const sync = () => setIndex(readIndex());
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof HTMLElement && target.closest("input, textarea")) return;
      if (event.key === "Escape") {
        setOverview(false);
        return;
      }
      if (event.key === "Home") {
        event.preventDefault();
        window.location.hash = hashFor(0);
        return;
      }
      if (event.key === "End") {
        event.preventDefault();
        window.location.hash = hashFor(slides.length - 1);
        return;
      }
      if (event.key === "ArrowRight" || event.key === "PageDown" || event.key === " ") {
        event.preventDefault();
        setOverview(false);
        window.location.hash = hashFor(Math.min(index + 1, slides.length - 1));
        return;
      }
      if (event.key === "ArrowLeft" || event.key === "PageUp" || event.key === "Backspace") {
        event.preventDefault();
        setOverview(false);
        window.location.hash = hashFor(Math.max(index - 1, 0));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index]);

  function go(next: number) {
    const clamped = Math.min(Math.max(next, 0), slides.length - 1);
    setOverview(false);
    window.location.hash = hashFor(clamped);
  }

  const layoutClass = slide.layout ? ` slide-${slide.layout}` : "";

  return (
    <div className="deck">
      <p className="deck-live" aria-live="polite">
        Diapositive {index + 1} sur {slides.length}. {slide.title}
      </p>
      <div className="deck-progress" aria-hidden="true">
        {slides.map((item, itemIndex) => (
          <button
            key={item.id}
            type="button"
            aria-current={itemIndex === index ? "true" : undefined}
            className={itemIndex < index ? "is-seen" : undefined}
            onClick={() => go(itemIndex)}
          />
        ))}
      </div>

      {overview ? (
        <div className="deck-overview" role="list">
          {slides.map((item, itemIndex) => (
            <button
              key={item.id}
              type="button"
              aria-current={itemIndex === index ? "true" : undefined}
              onClick={() => go(itemIndex)}
            >
              <span>{String(itemIndex + 1).padStart(2, "0")}</span>
              {item.title}
            </button>
          ))}
        </div>
      ) : (
        <main
          className="deck-stage"
          id={slide.id}
          aria-roledescription="diapositive"
          aria-label={`${index + 1} sur ${slides.length}`}
          onClick={(event: MouseEvent<HTMLElement>) => {
            const target = event.target;
            if (!(target instanceof Element)) return;
            if (target.closest("a, button")) return;
            go(index + 1);
          }}
        >
          <section className={`deck-slide${layoutClass}`}>{slide.render()}</section>
        </main>
      )}

      <footer className="deck-bar">
        <button type="button" onClick={() => go(index - 1)} disabled={index === 0}>
          Précédent
        </button>
        <p className="deck-count">
          {String(index + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
          <span className="deck-keys">Flèches · espace</span>
        </p>
        <div className="deck-actions">
          <button type="button" onClick={() => setOverview((open) => !open)} aria-pressed={overview}>
            {overview ? "Diapo" : "Sommaire"}
          </button>
          <a href="#desk">Bureau</a>
          <button type="button" onClick={() => go(index + 1)} disabled={index === slides.length - 1}>
            Suivant
          </button>
        </div>
      </footer>
    </div>
  );
}
