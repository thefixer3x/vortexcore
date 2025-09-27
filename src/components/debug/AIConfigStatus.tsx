import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Settings, 
  RefreshCw,
  Copy,
  ExternalLink
} from 'lucide-react';
import { validateClientConfig, generateConfigHelp } from '@/utils/configValidator';
import { supabase, supabaseConfig } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function AIConfigStatus() {
  const [testResults, setTestResults] = useState<any>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const { toast } = useToast();

  const configValidation = validateClientConfig();

  const testConnection = async () => {
    setIsTestingConnection(true);
    setTestResults(null);

    try {
      // Test AI function availability
      const testPrompt = 'Hello, this is a connection test';
      const { data: aiData, error: aiError } = await supabase.functions.invoke('ai-router', {
        body: { 
          messages: [{ role: 'user', content: testPrompt }],
          wantRealtime: false
        }
      });

      setTestResults({
        aiFunctionAvailable: !aiError,
        aiError: aiError?.message,
        aiResponse: aiData?.response,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      setTestResults({
        aiFunctionAvailable: false,
        aiError: 'Connection test failed',
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const copyConfigHelp = () => {
    const help = generateConfigHelp();
    navigator.clipboard.writeText(help);
    toast({
      title: "Copied to clipboard",
      description: "Configuration help has been copied to your clipboard",
    });
  };

  const getStatusIcon = (isValid: boolean) => {
    return isValid ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    );
  };

  if (!import.meta.env.DEV) {
    return null; // Only show in development
  }

  return (
    <Card className="w-full max-w-4xl mx-auto mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          AI Configuration Status
          <Badge variant={configValidation.isValid ? "default" : "destructive"}>
            {configValidation.isValid ? "Valid" : "Issues Found"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Client Configuration */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Client Configuration</h3>
          
          <div className="flex items-center justify-between p-3 border rounded">
            <div className="flex items-center gap-2">
              {getStatusIcon(!!supabaseConfig.url)}
              <span>Supabase URL</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {supabaseConfig.url ? '✓ Configured' : '✗ Missing'}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 border rounded">
            <div className="flex items-center gap-2">
              {getStatusIcon(supabaseConfig.hasAnonKey)}
              <span>Supabase Anonymous Key</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {supabaseConfig.hasAnonKey ? '✓ Configured' : '✗ Missing'}
            </div>
          </div>
        </div>

        {/* Errors */}
        {configValidation.errors.length > 0 && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <strong>Configuration Errors:</strong>
                <ul className="list-disc list-inside space-y-1">
                  {configValidation.errors.map((error, index) => (
                    <li key={index} className="text-sm">{error}</li>
                  ))}
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button onClick={copyConfigHelp} variant="outline" size="sm">
            <Copy className="h-4 w-4 mr-2" />
            Copy Setup Guide
          </Button>
          
          <Button 
            onClick={testConnection} 
            disabled={isTestingConnection || !configValidation.isValid}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isTestingConnection ? 'animate-spin' : ''}`} />
            Test AI Connection
          </Button>
        </div>

        {/* Test Results */}
        {testResults && (
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Connection Test Results</h3>
            
            <div className="flex items-center justify-between p-3 border rounded">
              <div className="flex items-center gap-2">
                {getStatusIcon(testResults.aiFunctionAvailable)}
                <span>AI Function</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {testResults.aiFunctionAvailable ? 'Available' : testResults.aiError}
              </div>
            </div>

            {testResults.aiResponse && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>AI Test Response:</strong>
                  <p className="text-sm mt-1">{testResults.aiResponse}</p>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}