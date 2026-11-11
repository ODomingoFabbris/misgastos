"use client";

/**
 * Último recurso: reemplaza al layout raíz, así que define su propio <html> y estilos
 * (no hay Tailwind ni fuentes acá). Respeta el tema oscuro de la app.
 */
export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="es-AR">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
          background: "#0a0a0a",
          color: "#ededed",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <main style={{ maxWidth: 360, textAlign: "center" }}>
          <h1 style={{ fontSize: 20, margin: 0 }}>Algo salió mal</h1>
          <p style={{ color: "#8a8a8a", fontSize: 14 }}>
            Ocurrió un error inesperado. Volvé a intentar en un momento.
          </p>
          <button
            type="button"
            onClick={() => retry()}
            style={{
              minHeight: 44,
              width: "100%",
              border: 0,
              borderRadius: 10,
              background: "#e5e5e5",
              color: "#0a0a0a",
              fontSize: 16,
              cursor: "pointer",
            }}
          >
            Reintentar
          </button>
        </main>
      </body>
    </html>
  );
}
