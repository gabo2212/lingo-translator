import { EXAMPLES } from "../lib/examples";

type ExamplesProps = {
  onPick: (text: string) => void;
};

export function Examples({ onPick }: ExamplesProps) {
  return (
    <div>
      <p id="examples-label" className="field-label">
        Examples
      </p>
      <div className="example-list" role="group" aria-labelledby="examples-label">
        {EXAMPLES.map((example) => (
          <button
            key={example.id}
            type="button"
            className="example"
            onClick={() => onPick(example.text)}
          >
            <span className="example-text">{example.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
