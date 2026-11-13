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
        <Kicker>Lingo Translator</Kicker>
        <h1>De la phrase saisie au texte renvoyé.</h1>
        <p className="deck-lede">
          Une phrase change de registre. La langue reste. Les poids ne bougent pas.
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
        <Kicker>prompts.py · build_prompt</Kicker>
        <h1>Deux messages. Pas un bloc.</h1>
        <Bullets
          items={[
            "styles.yaml décrit chaque voix. build_prompt met ces règles dans le message système.",
            "La phrase tapée va seule dans le message utilisateur. On ne la recolle pas dans les règles.",
            "LinkedIn a cinq tons. linkedin_tone choisit lequel. Les autres voix n’ont pas de ton.",
            "La variante D ajoute des exemples de réécriture. Sans ça, le modèle a seulement les règles.",
            "Le prompt_id, comme linkedin.motivational.D.r1, dit quelle voix a été utilisée. Une consigne plus stricte, mêmes poids, a inventé « 3:17 p.m. ».",
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
    id: "rate",
    title: "Où ça rate",
    render: () => (
      <>
        <Kicker>La limite qu’on peut montrer</Kicker>
        <h1>On lui dit de copier les nombres. Il calcule.</h1>
        <Bullets
          items={[
            "Phrase : « I owed Maya $18 and paid her back $20. » Il garde 20, efface 18, et écrit un surplus de 2 $.",
            "Ailleurs, 8 devient le mot « eight ». Le sens passe. Le chiffre, non.",
            "La consigne le dit pourtant : recopier chaque nombre, ne pas le transformer.",
            "Une deuxième réécriture est écrite dans le code. Elle est éteinte, et elle ne vérifie pas les nombres non plus.",
          ]}
        />
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
