export default function ResolveScreen({ onContinue, buttonText }) {
  return (
    <div className="w-full max-w-xl mx-auto text-center mt-4">
      <button
        onClick={onContinue}
        className="px-8 py-4 rounded-md border-2 font-heading font-semibold text-base uppercase tracking-wider cursor-pointer transition-all duration-200 min-h-[44px]"
        style={{
          background: "linear-gradient(135deg, #8b1a1a, #c62828)",
          borderColor: "#c4a24a",
          color: "#e8c44a",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "linear-gradient(135deg, #a02020, #e03030)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "linear-gradient(135deg, #8b1a1a, #c62828)";
        }}
      >
        {buttonText || "Continue"}
      </button>
    </div>
  );
}
