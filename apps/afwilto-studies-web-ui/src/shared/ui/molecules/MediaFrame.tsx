import { useState } from 'react'
import { Button, Dialog } from '@afwilto/design-system'
import { SafeImage } from '../atoms/SafeImage'

/** A stem image: at most half the viewport tall, click to zoom, its alt in a placeholder when broken. */
export function MediaFrame({ src, alt }: { src: string | null; alt: string }) {
  const [zoomed, setZoomed] = useState(false)
  const [broken, setBroken] = useState(false)
  const canZoom = src !== null && !broken
  return (
    <figure className="m-0">
      <button
        type="button"
        aria-label={`Ampliar imagen: ${alt}`}
        disabled={!canZoom}
        onClick={() => setZoomed(true)}
        className="block w-full cursor-zoom-in rounded-lg border border-surface-border bg-surface-raised p-2 disabled:cursor-default"
      >
        <SafeImage src={src} alt={alt} onBroken={() => setBroken(true)} className="mx-auto max-h-[50vh] max-w-full object-contain" />
      </button>
      {zoomed && canZoom && (
        <Dialog
          open
          onClose={() => setZoomed(false)}
          title={alt}
          footer={
            <Button variant="secondary" onClick={() => setZoomed(false)}>
              Cerrar
            </Button>
          }
        >
          <img src={src} alt={alt} className="max-h-[70vh] w-full object-contain" />
        </Dialog>
      )}
    </figure>
  )
}
