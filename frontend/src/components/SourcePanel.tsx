import { useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import type { StyleOption } from "../api/types";
import type { CatalogSource } from "../hooks/useStyleCatalog";
import { MAX_CHARS } from "../lib/constants";
import { CreativityControls } from "./CreativityControls";
import { Examples } from "./Examples";
import { StyleFields } from "./StyleFields";

type SourcePanelProps = {
  styles: readonly StyleOption[];
  catalogSource: CatalogSource;
  text: string;
  styleId: string;
  toneId: string;
  temperature: number;
  maxNewTokens: number;
  canSubmit: boolean;
  busy: boolean;
  onTextChange: (value: string) => void;
  onStyleChange: (styleId: string) => void;
  onToneChange: (toneId: string) => void;
  onTemperatureChange: (value: number) => void;
  onMaxNewTokensChange: (value: number) => void;
  onSubmit: () => void;
};

export function SourcePanel({
  styles,
  catalogSource,
  text,
  styleId,
  toneId,
  temperature,
  maxNewTokens,
  canSubmit,
  busy,
  onTextChange,
  onStyleChange,
  onToneChange,
  onTemperatureChange,
  onMaxNewTokensChange,
  onSubmit,
}: SourcePanelProps) {
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const [pasteNote, setPasteNote] = useState<string | null>(null);
  const atLimit = text.length >= MAX_CHARS;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    onSubmit();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey || event.altKey) return;
    if (!event.ctrlKey && !event.metaKey) return;
    event.preventDefault();
    if (!canSubmit) return;
    event.currentTarget.form?.requestSubmit();
  }

  async function pasteFromClipboard() {
    try {
      const clip = await navigator.clipboard.readText();
      onTextChange(clip);
      setPasteNote(
        clip.length > MAX_CHARS ? "Pasted text was cut at 4000 characters." : null,
      );
    } catch {
      setPasteNote("Clipboard permission was denied. Use Ctrl+V in the box.");
    }
  }

  function clearText() {
    onTextChange("");
    setPasteNote(null);
    areaRef.current?.focus();
  }

  function applyExample(value: string) {
    onTextChange(value);
    setPasteNote(null);
    window.requestAnimationFrame(() => {
      const node = areaRef.current;
      if (!node) return;
      node.focus();
      const end = node.value.length;
      node.setSelectionRange(end, end);
    });
  }

  return (
    <section className="panel source-panel" aria-labelledby="source-heading">
      <h2 id="source-heading">Sentence</h2>
      <form className="stack" onSubmit={handleSubmit} autoComplete="off">
        {catalogSource === "fallback" ? (
          <p className="note" role="status">
            Style list is the local catalog because /api/styles did not load. Translation still
            needs the API.
          </p>
        ) : null}

        <StyleFields
          styles={styles}
          styleId={styleId}
          toneId={toneId}
          onStyleChange={onStyleChange}
          onToneChange={onToneChange}
        />

        <div>
          <textarea
            ref={areaRef}
            id="source-text"
            name="text"
            value={text}
            maxLength={MAX_CHARS}
            placeholder="Write the plain sentence."
            aria-label="Sentence"
            aria-describedby="char-count"
            aria-keyshortcuts="Control+Enter"
            spellCheck
            onChange={(event) => onTextChange(event.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className="composer-toolbar">
            <p id="char-count" className={atLimit ? "char-count at-limit" : "char-count"}>
              {text.length} / {MAX_CHARS}
            </p>
            <div className="button-row">
              <button type="button" onClick={() => void pasteFromClipboard()}>
                Paste
              </button>
              <button type="button" onClick={clearText}>
                Clear
              </button>
            </div>
          </div>
          {pasteNote ? (
            <p className="field-help" role="status">
              {pasteNote}
            </p>
          ) : null}
        </div>

        <Examples onPick={applyExample} />

        <CreativityControls
          temperature={temperature}
          maxNewTokens={maxNewTokens}
          onTemperatureChange={onTemperatureChange}
          onMaxNewTokensChange={onMaxNewTokensChange}
        />

        <div>
          <button className="translate-button" type="submit" disabled={!canSubmit}>
            {busy ? "Translating…" : "Translate"}
          </button>
        </div>
      </form>
    </section>
  );
}
