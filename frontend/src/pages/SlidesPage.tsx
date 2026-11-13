import { useEffect, useState } from "react";
import { SLIDES, type SlideBlock } from "../slides/content";
import "../slides.css";

function SlideBlocks({ blocks }: { blocks: readonly SlideBlock[] }) {
  return (
    <>
      {blocks.map((block, index) => {
        const key = `${block.kind}-${index}`;
        if (block.kind === "p") return <p key={key}>{block.text}</p>;
        if (block.kind === "ul") {
          return (
            <ul key={key}>
              {block.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          );
        }
        if (block.kind === "quote") {
          return (
            <blockquote key={key} className="slide-quote">
              <span>{block.label}</span>
              {block.text}
            </blockquote>
          );
        }
        if (block.kind === "flow") {
          return (
            <ol key={key} className="slide-flow">
              {block.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          );
        }
        return (
          <dl key={key} className="slide-rows">
            {block.rows.map((row) => (
              <div key={row.label}>
                <dt>{row.label}</dt>
                <dd>{row.text}</dd>
              </div>
            ))}
          </dl>
        );
      })}
    </>
  );
}

export function SlidesPage() {
  const [index, setIndex] = useState(0);
  const last = SLIDES.length - 1;
  const slide = SLIDES[index] ?? SLIDES[0];

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLButtonElement
      ) {
        return;
      }
      if (event.key === "ArrowRight" || event.key === "PageDown" || event.key === " ") {
        event.preventDefault();
        setIndex((current) => Math.min(last, current + 1));
      } else if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        setIndex((current) => Math.max(0, current - 1));
      } else if (event.key === "Home") {
        event.preventDefault();
        setIndex(0);
      } else if (event.key === "End") {
        event.preventDefault();
        setIndex(last);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [last]);

  if (!slide) return null;

  return (
    <div className="slides-deck">
      <header className="slides-bar">
        <a href="/">Traducteur</a>
        <p>
          {index + 1} / {SLIDES.length}
        </p>
      </header>
      <main className="slides-stage" aria-live="polite">
        <article className="slides-card" aria-roledescription="diapositive">
          <p className="slides-kicker">{slide.kicker}</p>
          <h1>{slide.title}</h1>
          <SlideBlocks blocks={slide.blocks} />
        </article>
      </main>
      <footer className="slides-nav">
        <button type="button" onClick={() => setIndex((current) => Math.max(0, current - 1))} disabled={index === 0}>
          Précédent
        </button>
        <button
          type="button"
          onClick={() => setIndex((current) => Math.min(last, current + 1))}
          disabled={index === last}
        >
          Suivant
        </button>
      </footer>
    </div>
  );
}
