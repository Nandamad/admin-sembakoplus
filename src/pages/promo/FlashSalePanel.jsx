import './FlashSalePanel.css'

const flashSaleItems = []

function FlashSalePanel() {
  return (
    <section className="flash-sale">
      <header className="flash-sale__header">
        <div>
          <h2>Kontrol Sesi Flash Sale Beranda Mobile</h2>
          <p>
            Sesi dan produk flash sale akan tampil setelah tersedia dari backend.
          </p>
        </div>
      </header>

      <div className="flash-sale__grid">
        {flashSaleItems.length ? flashSaleItems.map((item) => {
          const progress = Math.min((item.sold / item.quota) * 100, 100)

          return (
            <article className="flash-sale__item" key={item.id}>
              <span className={`flash-sale__art flash-sale__art--${item.tone}`}>
                {item.emoji}
              </span>
              <div className="flash-sale__details">
                <div className="flash-sale__price-row">
                  <span className="flash-sale__discount">
                    Diskon {item.discount}
                  </span>
                  <strong>{item.price}</strong>
                </div>
                <h3>{item.name}</h3>
                <p>Sesi flash sale</p>
                <div className="flash-sale__quantity">
                  <span>
                    Terjual {item.sold} / {item.quota}
                  </span>
                  <strong>{Math.round(progress)}%</strong>
                </div>
                <div
                  aria-label={`${Math.round(progress)} persen kuota terpakai`}
                  className="flash-sale__progress"
                  role="img"
                >
                  <span style={{ width: `${progress}%` }} />
                </div>
              </div>
            </article>
          )
        }) : (
          <p className="flash-sale__empty">
            Belum ada sesi flash sale.
          </p>
        )}
      </div>
    </section>
  )
}

export default FlashSalePanel
