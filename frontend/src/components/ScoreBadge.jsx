export default function ScoreBadge({ score = 0, label = 'Score' }) {
  const scoreClass = score >= 75 ? 'great' : score >= 55 ? 'ok' : 'low';

  return (
    <div className={`score-badge ${scoreClass}`}>
      <strong>{score}</strong>
      <span>{label}</span>
    </div>
  );
}
