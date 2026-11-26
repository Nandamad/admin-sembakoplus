import { Image } from 'lucide-react'

function BannerArtwork({ className = '' }) {
  return (
    <div
      aria-hidden="true"
      className={`banner-artwork ${className}`.trim()}
    >
      <Image size={24} strokeWidth={1.5} />
    </div>
  )
}

export default BannerArtwork
