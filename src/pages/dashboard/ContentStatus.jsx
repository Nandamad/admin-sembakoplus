import './ContentStatus.css'

function ContentStatus() {
  return (
    <section className="dashboard__panel content-status">
      <div className="dashboard__panel-header">
        <h2 className="dashboard__panel-title">Status Konten Aplikasi Mobile</h2>
      </div>
      <div className="content-status__list">
        <p className="content-status__empty">
          Status konten akan tampil setelah data tersedia dari backend.
        </p>
      </div>
    </section>
  )
}

export default ContentStatus
