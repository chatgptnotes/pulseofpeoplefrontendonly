import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import OnboardingTour from '../components/OnboardingTour';
import {
  OnboardingTour as Tour,
  ONBOARDING_TOURS,
  getActiveTour,
  startTour,
  shouldShowOnboarding,
  getPendingTours,
} from '../lib/onboarding';

interface OnboardingContextType {
  activeTour: Tour | null;
  startTourById: (tourId: string) => void;
  endTour: () => void;
  availableTours: Tour[];
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
}

interface OnboardingProviderProps {
  children: React.ReactNode;
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const { user } = useAuth();
  const [activeTour, setActiveTour] = useState<Tour | null>(null);
  const [availableTours, setAvailableTours] = useState<Tour[]>([]);

  useEffect(() => {
    if (user) {
      checkOnboarding();
    } else {
      setActiveTour(null);
      setAvailableTours([]);
    }
  }, [user]);

  function checkOnboarding() {
    if (!user) return;

    const userRole = getUserRole();

    // Get all pending tours for this user
    const pending = getPendingTours(user.id, userRole);
    setAvailableTours(pending);

    // Check if we should auto-start a tour
    if (shouldShowOnboarding(user.id, userRole)) {
      // Find first auto-start tour
      const autoStartTour = pending.find(tour => tour.autoStart);
      if (autoStartTour) {
        startTourById(autoStartTour.id);
      }
    } else {
      // Check if there's an active tour in progress
      const active = getActiveTour(user.id);
      if (active) {
        setActiveTour(active);
      }
    }
  }

  function getUserRole(): string {
    if (!user) return 'user';

    // Check user metadata or role field
    const role = user.user_metadata?.role || 'user';

    // Map to onboarding role names
    if (role === 'super_admin' || role === 'platform_admin') {
      return 'super_admin';
    } else if (role === 'admin' || role === 'organization_admin') {
      return 'admin';
    }

    return 'user';
  }

  function startTourById(tourId: string) {
    if (!user) return;

    const tour = ONBOARDING_TOURS[tourId];
    if (!tour) {
      console.warn(`Tour not found: ${tourId}. Available tours:`, Object.keys(ONBOARDING_TOURS));
      return;
    }

    startTour(user.id, tourId);
    setActiveTour(tour);
  }

  function endTour() {
    setActiveTour(null);

    // Refresh available tours
    if (user) {
      const userRole = getUserRole();
      const pending = getPendingTours(user.id, userRole);
      setAvailableTours(pending);
    }
  }

  return (
    <OnboardingContext.Provider
      value={{
        activeTour,
        startTourById,
        endTour,
        availableTours,
      }}
    >
      {children}

      {/* Render active tour */}
      {activeTour && user && (
        <OnboardingTour
          userId={user.id}
          tour={activeTour}
          onComplete={endTour}
          onSkip={endTour}
        />
      )}
    </OnboardingContext.Provider>
  );
}

export default OnboardingProvider;
