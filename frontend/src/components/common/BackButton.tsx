
import { useNavigate } from "react-router-dom";

type BackButtonProps = {
  label?: string;
};

export default function BackButton({
  label = "Retour à l’accueil",
}: BackButtonProps) {
  const navigate = useNavigate();

  function handleBack() {
    navigate("/");
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
