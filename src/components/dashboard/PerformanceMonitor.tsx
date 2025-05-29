import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Zap, 
  Wifi, 
  Smartphone,
  Activity,
  Clock,
  CheckCircle,
  AlertTriangle
} from "lucide-react";

interface PerformanceMetrics {
  loadTime: number;
  connectionQuality: 'excellent' | 'good' | 'poor';
  lastSync: Date;
  apiStatus: 'online' | 'offline' | 'degraded';
}

export const PerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    connectionQuality: 'excellent',
    lastSync: new Date(),
    apiStatus: 'online'
  });

  useEffect(() => {
    // Simulate performance metrics
    const startTime = performance.now();
    
    setTimeout(() => {
      const loadTime = performance.now() - startTime;
      setMetrics(prev => ({
        ...prev,
        loadTime: Math.round(loadTime),
        lastSync: new Date()
      }));
    }, 100);

    // Update sync time every 30 seconds
    const syncInterval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        lastSync: new Date()
      }));
    }, 30000);

    return () => clearInterval(syncInterval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
      case 'excellent':
        return 'text-green-600 dark:text-green-400';
      case 'good':
      case 'degraded':
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-red-600 dark:text-red-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="h-3 w-3" />;
      case 'degraded':
        return <AlertTriangle className="h-3 w-3" />;
      default:
        return <Activity className="h-3 w-3" />;
    }
  };

  return (
    <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <h4 className="font-medium text-sm">System Status</h4>
        </div>
        
        <div className="space-y-3">
          {/* Load Performance */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span>Load Time</span>
            </div>
            <Badge variant="secondary" className="text-xs">
              {metrics.loadTime}ms
            </Badge>
          </div>

          {/* Connection Quality */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Wifi className="h-3 w-3 text-muted-foreground" />
              <span>Connection</span>
            </div>
            <span className={`font-medium capitalize ${getStatusColor(metrics.connectionQuality)}`}>
              {metrics.connectionQuality}
            </span>
          </div>

          {/* API Status */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              {getStatusIcon(metrics.apiStatus)}
              <span>API Status</span>
            </div>
            <span className={`font-medium capitalize ${getStatusColor(metrics.apiStatus)}`}>
              {metrics.apiStatus}
            </span>
          </div>

          {/* Last Sync */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Smartphone className="h-3 w-3 text-muted-foreground" />
              <span>Last Sync</span>
            </div>
            <span className="text-muted-foreground">
              {metrics.lastSync.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
