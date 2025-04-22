
import { useState } from "react";
import { File, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export function BankStatementAnalysis() {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!['application/pdf', 'text/csv'].includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF or CSV bank statement",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    // Placeholder for actual file processing
    setTimeout(() => {
      toast({
        title: "Feature coming soon",
        description: "Bank statement analysis will be available in a future update",
      });
      setIsUploading(false);
    }, 1000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <File className="h-5 w-5" />
          Bank Statement Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center p-8 border-2 border-dashed rounded-lg">
          <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">Upload Bank Statement</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Upload your bank statement (PDF or CSV) for VortexAI to analyze and provide personalized insights
          </p>
          <div className="flex justify-center">
            <input
              type="file"
              accept=".pdf,.csv"
              onChange={handleFileUpload}
              className="hidden"
              id="bank-statement-upload"
            />
            <label htmlFor="bank-statement-upload">
              <Button disabled={isUploading} asChild>
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  {isUploading ? "Uploading..." : "Upload Statement"}
                </span>
              </Button>
            </label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
