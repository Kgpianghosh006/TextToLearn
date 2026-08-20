// ParagraphBlock — Renders a plain text paragraph with prose styling.
function ParagraphBlock({ block }) {
  return <p className="block-paragraph">{block.text}</p>;
}

export default ParagraphBlock;
