export default function Loading() {
  return (
    <div role="status" aria-label="Memuat halaman" className="flex justify-center py-24">
      <div className="size-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground motion-reduce:animate-none" />
    </div>
  );
}
