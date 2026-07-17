/** Header halaman standar — dipakai semua menu agar judul dan gap konsisten. */
export function PageHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <header>
      <h1 className="text-[32px] font-semibold leading-10 text-primary">
        {title}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </header>
  );
}
