import { useNavigate } from "react-router-dom";

type BackButtonProps = {
  fallback?: string;
  label?: string;
};

export default function BackButton({
  fallback = "/",
  label = "Retour",
}: BackButtonProps) {
  const navigate = useNavigate();

  function handleBack() {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate(fallback);
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      className="inline-flex items-center gap-2 rounded-full border border-black/15 bg-gold px-4 py-2 text-sm font-semibold transition hover:border-gold hover:bg-ivory hover:text-black"
      aria-label={label}
    >
      <span aria-hidden="true">←</span>
      {label}
    </button>
  );
}