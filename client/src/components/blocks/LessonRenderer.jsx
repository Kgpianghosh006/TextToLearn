import '../components.css';
import HeadingBlock from './HeadingBlock';
import ParagraphBlock from './ParagraphBlock';
import CodeBlock from './CodeBlock';
import VideoBlock from './VideoBlock';
import MCQBlock from './MCQBlock';

const BLOCK_COMPONENTS = {
  heading: HeadingBlock,
  paragraph: ParagraphBlock,
  code: CodeBlock,
  video: VideoBlock,
  mcq: MCQBlock,
};

// LessonRenderer — Orchestrates rendering of a lesson's content block array.
function LessonRenderer({ content }) {
  if (!content || content.length === 0) {
    return (
      <p className="lesson-renderer__empty">No content available for this lesson yet.</p>
    );
  }

  return (
    <div className="lesson-renderer">
      {content.map((block, idx) => {
        const BlockComponent = BLOCK_COMPONENTS[block.type];

        if (!BlockComponent) {
          return (
            <div key={idx} className="lesson-renderer__unknown-block">
              Unknown block type: <code>{block.type}</code>
            </div>
          );
        }

        return <BlockComponent key={idx} block={block} />;
      })}
    </div>
  );
}

export default LessonRenderer;