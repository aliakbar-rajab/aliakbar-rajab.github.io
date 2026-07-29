export function Brand({
  headerLogo = false,
  href = "#top",
}: {
  headerLogo?: boolean;
  href?: string;
}) {
  return (
    <a
      className={`brand${headerLogo ? " brand-header-logo" : ""}`}
      href={href}
      aria-label="بنیان فولاد داریا، صفحه اصلی"
    >
      {headerLogo ? (
        <img
          src="/brand/bonyan-foulad-daria-logo.png"
          alt=""
          width="1254"
          height="1254"
          decoding="async"
          fetchPriority="high"
        />
      ) : (
        <>
          <span className="brand-mark" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span className="brand-copy">
            <strong>بنیان فولاد داریا</strong>
            <span>BONYAN FOULAD DARIA</span>
          </span>
        </>
      )}
    </a>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="section-heading">
      <span>{eyebrow}</span>
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
    </div>
  );
}
