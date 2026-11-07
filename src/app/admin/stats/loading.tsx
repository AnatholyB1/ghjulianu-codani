import './stats.css';

export default function Loading() {
  return (
    <div className="st" aria-busy="true">
      <p className="sr-only" role="status">Chargement des statistiques…</p>
      <div aria-hidden="true">
        <div className="page-head">
          <div>
            <p className="eyebrow">Statistiques</p>
            <h1>Suivi des téléchargements</h1>
          </div>
          <div className="period">
            <nav className="seg"><a aria-disabled="true">7&nbsp;jours</a><a aria-disabled="true" aria-current="true">30&nbsp;jours</a><a aria-disabled="true">90&nbsp;jours</a></nav>
          </div>
        </div>
        <div className="kpis">
          {Array.from({ length: 6 }, (_, i) => (
            <div className="kpi" key={i}><span className="sk sk-line" style={{ width: '60%' }} /><span className="sk sk-big" /><span className="sk sk-line" style={{ width: '40%' }} /></div>
          ))}
        </div>
        {[0, 1].map((i) => (
          <section className="card sec" key={i}><span className="sk sk-line" style={{ width: '30%', marginBottom: 16 }} /><div className="sk sk-chart" /></section>
        ))}
      </div>
    </div>
  );
}
