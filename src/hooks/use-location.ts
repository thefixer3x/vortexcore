
import { useState, useEffect } from 'react';
import { toast } from "@/hooks/use-toast";

interface LocationData {
  latitude: number | null;
  longitude: number | null;
  country: string | null;
  city: string | null;
  loading: boolean;
  error: string | null;
}

export function useLocation() {
  const [locationData, setLocationData] = useState<LocationData>({
    latitude: null,
    longitude: null,
    country: null,
    city: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    const getLocation = async () => {
      try {
        // Check if geolocation is available
        if (!navigator.geolocation) {
          throw new Error("Geolocation is not supported by this browser");
        }

        // Get coordinates
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
          });
        });

        const { latitude, longitude } = position.coords;
        
        // Use a reverse geocoding service to get country and city
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
        );
        
        if (!response.ok) {
          throw new Error("Failed to fetch location data");
        }
        
        const data = await response.json();
        
        setLocationData({
          latitude,
          longitude,
          country: data.address?.country || null,
          city: data.address?.city || data.address?.town || null,
          loading: false,
          error: null
        });
        
      } catch (error) {
        console.error("Error getting location:", error);
        setLocationData({
          latitude: null,
          longitude: null,
          country: null,
          city: null,
          loading: false,
          error: error instanceof Error ? error.message : "Unknown error"
        });
        
        toast({
          title: "Location Error",
          description: error instanceof Error ? error.message : "Failed to detect your location",
          variant: "destructive"
        });
      }
    };

    getLocation();
  }, []);

  return locationData;
}
