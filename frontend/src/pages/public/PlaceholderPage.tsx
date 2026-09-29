type PlaceholderPageProps = {
  title: string;
};

export default function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <section className="min-h-[60vh] bg-background px-6 py-20 text-foreground">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-4xl font-bold">{title}</h1>

        <p className="mt-4 text-foreground/70">
          Cette page sera construite dans la prochaine étape.
        </p>
      </div>
    </section>
  );
}