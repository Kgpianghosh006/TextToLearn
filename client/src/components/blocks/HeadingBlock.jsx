// HeadingBlock — Renders a heading at the specified level (h1–h3).
function HeadingBlock({ block }) {
  const { text, level } = block;
  const Tag = `h${level >= 1 && level <= 3 ? level : 2}`;
  return <Tag className={`block-heading block-heading--${Tag}`}>{text}</Tag>;
}

export default HeadingBlock;
