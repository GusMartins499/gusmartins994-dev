// Injeta um bloco JSON-LD (dados estruturados) no documento.
// O objeto é serializado uma vez no servidor; nada roda no cliente.
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
