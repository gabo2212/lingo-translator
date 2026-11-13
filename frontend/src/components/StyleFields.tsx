import type { StyleOption } from "../api/types";

type StyleFieldsProps = {
  styles: readonly StyleOption[];
  styleId: string;
  toneId: string;
  onStyleChange: (styleId: string) => void;
  onToneChange: (toneId: string) => void;
};

export function StyleFields({
  styles,
  styleId,
  toneId,
  onStyleChange,
  onToneChange,
}: StyleFieldsProps) {
  const selected = styles.find((style) => style.id === styleId) ?? null;
  const substyles =
    selected?.id === "linkedin" && selected.substyles && selected.substyles.length > 0
      ? selected.substyles
      : null;

  return (
    <div className="stack tight">
      <fieldset>
        <legend>Style</legend>
        {styles.length === 0 ? (
          <p className="field-help">No styles are available.</p>
        ) : (
          <div className="choice-row">
            {styles.map((style) => (
              <label key={style.id} className="choice">
                <input
                  type="radio"
                  name="style"
                  value={style.id}
                  checked={style.id === styleId}
                  onChange={() => onStyleChange(style.id)}
                />
                {style.label}
              </label>
            ))}
          </div>
        )}
      </fieldset>

      {substyles ? (
        <fieldset>
          <legend>LinkedIn tone</legend>
          <div className="choice-row">
            {substyles.map((tone) => (
              <label key={tone.id} className="choice choice-quiet">
                <input
                  type="radio"
                  name="linkedin-tone"
                  value={tone.id}
                  checked={tone.id === toneId}
                  onChange={() => onToneChange(tone.id)}
                />
                {tone.label}
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}
    </div>
  );
}
