import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useBiometrics } from '@/hooks/use-biometrics';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Fingerprint,
  Scan,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  Eye,
  AlertCircle,
  CheckCircle,
  Settings
} from 'lucide-react';

interface BiometricSettings {
  enabled: boolean;
  faceIdEnabled: boolean;
  touchIdEnabled: boolean;
  voiceIdEnabled: boolean;
  autoLogin: boolean;
  lastUsed?: Date;
}

/**
 * Enhanced Biometric Authentication Component
 * Supports Face ID, Touch ID, and Voice Recognition
 * Mobile-first design with fallback for web
 */
export function EnhancedBiometricAuth() {
  const [settings, setSettings] = useState<BiometricSettings>({
    enabled: false,
    faceIdEnabled: false,
    touchIdEnabled: false,
    voiceIdEnabled: false,
    autoLogin: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [testingType, setTestingType] = useState<string | null>(null);

  const { status: biometricStatus, authenticate, checkAvailability } = useBiometrics();
  const { user, isAuthenticated } = useAuth();

  // Load user's biometric settings
  useEffect(() => {
    if (user) {
      loadBiometricSettings();
    }
  }, [user]);

  const loadBiometricSettings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('vortex_settings')
        .select('setting_value')
        .eq('user_id', user.id)
        .eq('setting_key', 'biometric_settings')
        .single();

      if (!error && data) {
        setSettings(JSON.parse(data.setting_value));
      }
    } catch (error) {
      console.error('Error loading biometric settings:', error);
    }
  };

  const saveBiometricSettings = async (newSettings: BiometricSettings) => {
    if (!user) return;

    try {
      await supabase
        .from('vortex_settings')
        .upsert({
          user_id: user.id,
          setting_key: 'biometric_settings',
          setting_value: JSON.stringify(newSettings)
        });

      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving biometric settings:', error);
    }
  };

  const handleBiometricToggle = async (type: keyof BiometricSettings) => {
    if (!biometricStatus.available) return;

    const newSettings = { ...settings, [type]: !settings[type] };

    // If enabling, test the biometric first
    if (!settings[type]) {
      setIsLoading(true);
      setTestingType(type);

      try {
        const result = await authenticate();
        if (result.success) {
          await saveBiometricSettings(newSettings);
        }
      } catch (error) {
        console.error(`Error testing ${type}:`, error);
      } finally {
        setIsLoading(false);
        setTestingType(null);
      }
    } else {
      await saveBiometricSettings(newSettings);
    }
  };

  const testBiometric = async (type: string) => {
    setIsLoading(true);
    setTestingType(type);

    try {
      const result = await authenticate();
      if (result.success) {
        // Update last used timestamp
        const newSettings = { ...settings, lastUsed: new Date() };
        await saveBiometricSettings(newSettings);
      }
    } catch (error) {
      console.error(`Error testing ${type}:`, error);
    } finally {
      setIsLoading(false);
      setTestingType(null);
    }
  };

  const BiometricOption = ({
    icon: Icon,
    title,
    description,
    type,
    enabled,
    available = true
  }: {
    icon: React.ComponentType<any>;
    title: string;
    description: string;
    type: keyof BiometricSettings;
    enabled: boolean;
    available?: boolean;
  }) => (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${enabled ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-medium">{title}</h4>
            {!available && (
              <Badge variant="secondary" className="text-xs">
                Unavailable
              </Badge>
            )}
            {enabled && (
              <Badge variant="default" className="text-xs">
                Enabled
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {available && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => testBiometric(type)}
            disabled={isLoading || !enabled}
            className="text-xs"
          >
            {testingType === type && isLoading ? 'Testing...' : 'Test'}
          </Button>
        )}
        <Switch
          checked={enabled}
          onCheckedChange={() => handleBiometricToggle(type)}
          disabled={!available || isLoading}
        />
      </div>
    </div>
  );

  if (!isAuthenticated) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Please sign in to access biometric authentication settings.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Biometric Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Biometric Authentication
          </CardTitle>
          <CardDescription>
            Secure your account with biometric authentication methods available on your device.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Overall Status */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                {biometricStatus.available ? (
                  <ShieldCheck className="h-5 w-5 text-green-600" />
                ) : (
                  <ShieldAlert className="h-5 w-5 text-orange-600" />
                )}
                <div>
                  <p className="font-medium">
                    {biometricStatus.available ? 'Biometrics Available' : 'Biometrics Unavailable'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {biometricStatus.available
                      ? `${biometricStatus.type} detected on this device`
                      : 'No biometric sensors found'}
                  </p>
                </div>
              </div>

              {settings.enabled && settings.lastUsed && (
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Last used</p>
                  <p className="text-sm font-medium">
                    {settings.lastUsed.toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>

            {/* Biometric Options */}
            <div className="space-y-3">
              <BiometricOption
                icon={Fingerprint}
                title="Touch ID / Fingerprint"
                description="Use your fingerprint to quickly and securely access your account"
                type="touchIdEnabled"
                enabled={settings.touchIdEnabled}
                available={biometricStatus.available && ['touchId', 'fingerprint'].includes(biometricStatus.type)}
              />

              <BiometricOption
                icon={Eye}
                title="Face ID / Facial Recognition"
                description="Use facial recognition for hands-free secure authentication"
                type="faceIdEnabled"
                enabled={settings.faceIdEnabled}
                available={biometricStatus.available && ['faceId', 'face'].includes(biometricStatus.type)}
              />

              <BiometricOption
                icon={Smartphone}
                title="Device Biometrics"
                description="Use any available biometric method on your device"
                type="enabled"
                enabled={settings.enabled}
                available={biometricStatus.available}
              />
            </div>

            {/* Advanced Settings */}
            <div className="space-y-3 pt-4 border-t">
              <h5 className="font-medium flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Advanced Settings
              </h5>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Auto-login</p>
                  <p className="text-sm text-muted-foreground">
                    Automatically sign in when biometric authentication succeeds
                  </p>
                </div>
                <Switch
                  checked={settings.autoLogin}
                  onCheckedChange={(checked) =>
                    saveBiometricSettings({ ...settings, autoLogin: checked })
                  }
                  disabled={!settings.enabled}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Security Notice:</strong> Biometric data is processed locally on your device and never stored on our servers.
          Your biometric templates remain secure within your device's trusted execution environment.
        </AlertDescription>
      </Alert>

      {/* Mobile App Promotion */}
      {typeof window !== 'undefined' && !window.navigator.userAgent.includes('Mobile') && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Mobile App Available
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Get the full biometric authentication experience with our mobile app, including Face ID, Touch ID, and voice recognition.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" size="sm">
                Download iOS App
              </Button>
              <Button variant="outline" size="sm">
                Download Android App
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default EnhancedBiometricAuth;