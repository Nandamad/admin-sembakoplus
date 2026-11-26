import './StatCard.css'

function StatCard({ icon: Icon, label, value, note, tone = 'green' }) {
  return (
    <article className="statcard">
      <div className="statcard__top">
        <h2 className="statcard__label">{label}</h2>
        <span className={`statcard__icon statcard__icon--${tone}`}>
          <Icon aria-hidden="true" size={18} strokeWidth={2} />
        </span>
      </div>
      <p className="statcard__value">{value}</p>
      <p className="statcard__note">{note}</p>
    </article>
  )
}

export default StatCard
