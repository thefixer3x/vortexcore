
import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="bg-muted/50 border-t py-12 px-4">
      <div className="container mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div>
            <h3 className="font-semibold mb-4">Products</h3>
            <ul className="space-y-2">
              <li><Link to="#" className="text-sm text-muted-foreground hover:text-foreground">VortexComply</Link></li>
              <li><Link to="#" className="text-sm text-muted-foreground hover:text-foreground">VortexRisk</Link></li>
              <li><Link to="#" className="text-sm text-muted-foreground hover:text-foreground">VortexIQ</Link></li>
              <li><Link to="#" className="text-sm text-muted-foreground hover:text-foreground">VortexShield</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              <li><Link to="#" className="text-sm text-muted-foreground hover:text-foreground">About Us</Link></li>
              <li><Link to="#" className="text-sm text-muted-foreground hover:text-foreground">Careers</Link></li>
              <li><Link to="#" className="text-sm text-muted-foreground hover:text-foreground">Press</Link></li>
              <li><Link to="#" className="text-sm text-muted-foreground hover:text-foreground">Contact</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li><Link to="#" className="text-sm text-muted-foreground hover:text-foreground">Documentation</Link></li>
              <li><Link to="#" className="text-sm text-muted-foreground hover:text-foreground">API Reference</Link></li>
              <li><Link to="#" className="text-sm text-muted-foreground hover:text-foreground">Blog</Link></li>
              <li><Link to="#" className="text-sm text-muted-foreground hover:text-foreground">Community</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li><Link to="#" className="text-sm text-muted-foreground hover:text-foreground">Privacy Policy</Link></li>
              <li><Link to="#" className="text-sm text-muted-foreground hover:text-foreground">Terms of Service</Link></li>
              <li><Link to="#" className="text-sm text-muted-foreground hover:text-foreground">Security</Link></li>
              <li><Link to="#" className="text-sm text-muted-foreground hover:text-foreground">Compliance</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-base">
              VC
            </div>
            <span className="font-semibold tracking-tight">VortexCore</span>
          </div>
          
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} VortexCore. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};
