// components/atoms/Logo.tsx — "Doble 9's" wordmark (Montserrat 900 italic +
// gold gradient). AGENT: Frontend. From shared.jsx Logo.
interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  tagline?: boolean;
}

export function Logo({ size = "md", tagline = false }: LogoProps) {
  return (
    <div className={`c-logo c-logo--${size}`}>
      <div className="c-logo__word">
        Doble
        <br />
        9's
      </div>
      {tagline && (
        <div className="c-logo__tagline">✦ Dominó Cubano Online ✦</div>
      )}
    </div>
  );
}
