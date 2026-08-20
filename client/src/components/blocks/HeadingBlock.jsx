/**
 * HeadingBlock — Renders a heading at the specified level (h1–h3).
 * Props: block: { type: 'heading', text: string, level: number }
 */
function HeadingBlock({ block }) {
  const { text, level } = block;
  const Tag = `h${level >= 1 && level <= 3 ? level : 2}`;
  return <Tag className={`block-heading block-heading--${Tag}`}>{text}</Tag>;
}

export default HeadingBlock;
