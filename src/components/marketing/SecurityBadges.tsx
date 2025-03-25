
import { Shield, CheckCircle, LockKeyhole, BadgeCheck } from "lucide-react";

export const SecurityBadges = () => {
  return (
    <div className="bg-muted/50 rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-3">Enterprise-Grade Security</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">GDPR Compliant</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">NDPR Certified</span>
        </div>
        <div className="flex items-center gap-2">
          <LockKeyhole className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">ISO 27001</span>
        </div>
        <div className="flex items-center gap-2">
          <BadgeCheck className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">PCI DSS</span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-3">
        Your data is encrypted end-to-end with advanced security protocols. We maintain the highest standards of security and privacy protection.
      </p>
    </div>
  );
};
