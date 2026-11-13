import { useEffect, useState } from "react";
import { FALLBACK_STYLES } from "./api/catalog";
import { ResultPanel } from "./components/ResultPanel";
import { SourcePanel } from "./components/SourcePanel";
import { StatusBar } from "./components/StatusBar";
import { useConnection } from "./hooks/useConnection";
import { useHealth } from "./hooks/useHealth";
import { useStyleCatalog } from "./hooks/useStyleCatalog";
import { useTranslation } from "./hooks/useTranslation";
import { MAX_CHARS, TEMP_DEFAULT, TOKENS_DEFAULT } from "./lib/constants";
import { clampTokens, createTranslateRequest, quantizeTemperature } from "./lib/request";

const INITIAL_STYLE = FALLBACK_STYLES[0]?.id ?? "linkedin";
const INITIAL_TONE = FALLBACK_STYLES[0]?.substyles?.[0]?.id ?? "motivational";

export default function App() {
  const connection = useConnection();
  const health = useHealth(connection);
  const { styles, source } = useStyleCatalog(connection);
  const translation = useTranslation();
  const [text, setText] = useState("");
  const [styleId, setStyleId] = useState(INITIAL_STYLE);
  const [toneId, setToneId] = useState(INITIAL_TONE);
  const [temperature, setTemperature] = useState(TEMP_DEFAULT);
  const [maxNewTokens, setMaxNewTokens] = useState(TOKENS_DEFAULT);

  useEffect(() => {
    if (styles.length === 0) return;
    if (!styles.some((style) => style.id === styleId)) {
      setStyleId(styles[0].id);
    }
  }, [styles, styleId]);

  useEffect(() => {
    const style = styles.find((item) => item.id === styleId);
    if (!style || style.id !== "linkedin" || !style.substyles || style.substyles.length === 0) {
      return;
    }
    if (!style.substyles.some((substyle) => substyle.id === toneId)) {
      setToneId(style.substyles[0].id);
    }
  }, [styles, styleId, toneId]);

  const selected = styles.find((style) => style.id === styleId) ?? null;
  const busy = translation.state.phase === "loading";
  const online = connection.phase === "online";
  const canSubmit = online && text.trim().length > 0 && !busy && selected !== null;

  function updateText(value: string) {
    setText(value.length > MAX_CHARS ? value.slice(0, MAX_CHARS) : value);
  }

  function submitTranslation() {
    if (!canSubmit || !selected) return;
    translation.submit(
      createTranslateRequest(
        text.trim(),
        styles,
        selected.id,
        toneId,
        temperature,
        maxNewTokens,
      ),
    );
  }

  return (
    <div className="desk">
      <a className="skip" href="#source-text">
        Skip to sentence
      </a>
      <div className="shell">
        <header className="masthead">
          <h1>Lingo Translator</h1>
          <div className="masthead-side">
            <StatusBar
              state={health}
              hostLabel={connection.phase === "online" ? connection.hostLabel : null}
            />
            <nav className="site-nav" aria-label="Pages">
              <a href="#pitch">Pitch</a>
              <a href="/slides">Slides</a>
            </nav>
          </div>
        </header>

        <div className="panels">
          <SourcePanel
            styles={styles}
            catalogSource={source}
            text={text}
            styleId={selected?.id ?? styleId}
            toneId={toneId}
            temperature={temperature}
            maxNewTokens={maxNewTokens}
            canSubmit={canSubmit}
            busy={busy}
            onTextChange={updateText}
            onStyleChange={setStyleId}
            onToneChange={setToneId}
            onTemperatureChange={(value) => setTemperature(quantizeTemperature(value))}
            onMaxNewTokensChange={(value) => setMaxNewTokens(clampTokens(value))}
            onSubmit={submitTranslation}
          />
          <ResultPanel state={translation.state} onRegenerate={translation.regenerate} />
        </div>
      </div>
    </div>
  );
}
