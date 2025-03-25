
export const PartnerLogos = () => {
  return (
    <div className="py-4">
      <p className="text-sm text-muted-foreground mb-4">Trusted by leading financial institutions</p>
      <div className="flex flex-wrap items-center justify-center md:justify-start gap-6">
        {/* Placeholder logos - in a real app these would be actual partner logos */}
        {['Partner 1', 'Partner 2', 'Partner 3', 'Partner 4'].map((partner, index) => (
          <div key={index} className="h-8 px-4 bg-muted/30 rounded-md flex items-center justify-center">
            <span className="text-xs font-medium text-muted-foreground">{partner}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
