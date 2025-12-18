import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import Purchases, {
  CustomerInfo,
  PurchasesOfferings,
  PurchasesPackage,
  PurchasesError,
  LOG_LEVEL,
} from 'react-native-purchases';

// RevenueCat Configuration
const REVENUECAT_API_KEY = 'appl_kiuJtecukGTYJYdEhvRDRNtiSTN';
const ENTITLEMENT_ID = 'Sip Pro';

// Types
interface RevenueCatContextType {
  isPro: boolean;
  isLoading: boolean;
  offerings: PurchasesOfferings | null;
  customerInfo: CustomerInfo | null;
  purchasePackage: (pkg: PurchasesPackage) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
}

const RevenueCatContext = createContext<RevenueCatContextType | undefined>(undefined);

// Hook
export function useRevenueCat() {
  const context = useContext(RevenueCatContext);
  if (context === undefined) {
    throw new Error('useRevenueCat must be used within a RevenueCatProvider');
  }
  return context;
}

// Provider
interface RevenueCatProviderProps {
  children: React.ReactNode;
}

export function RevenueCatProvider({ children }: RevenueCatProviderProps) {
  const [isPro, setIsPro] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);

  // Check if user has Pro entitlement
  const checkProStatus = useCallback((info: CustomerInfo) => {
    const hasEntitlement = info.entitlements.active[ENTITLEMENT_ID] !== undefined;
    setIsPro(hasEntitlement);
    setCustomerInfo(info);

    if (__DEV__) {
      console.log('[RevenueCat] Pro status:', hasEntitlement);
      console.log('[RevenueCat] Active entitlements:', Object.keys(info.entitlements.active));
    }
  }, []);

  // Initialize RevenueCat
  useEffect(() => {
    const initRevenueCat = async () => {
      try {
        // Enable debug logs in development
        if (__DEV__) {
          Purchases.setLogLevel(LOG_LEVEL.DEBUG);
        }

        // Configure SDK
        if (Platform.OS === 'ios') {
          await Purchases.configure({ apiKey: REVENUECAT_API_KEY });
        }
        // Note: Android would use a different key

        if (__DEV__) {
          console.log('[RevenueCat] SDK configured successfully');
        }

        // Get initial customer info
        const info = await Purchases.getCustomerInfo();
        checkProStatus(info);

        // Get offerings
        const fetchedOfferings = await Purchases.getOfferings();
        setOfferings(fetchedOfferings);

        if (__DEV__) {
          console.log('[RevenueCat] Offerings:', fetchedOfferings.current?.identifier);
          console.log('[RevenueCat] Available packages:',
            fetchedOfferings.current?.availablePackages.map(p => p.identifier)
          );
        }
      } catch (error) {
        if (__DEV__) {
          console.error('[RevenueCat] Init error:', error);
        }
      } finally {
        setIsLoading(false);
      }
    };

    initRevenueCat();

    // Listen for customer info updates
    // Note: addCustomerInfoUpdateListener returns EmitterSubscription but types say void
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const listener = Purchases.addCustomerInfoUpdateListener((info) => {
      if (__DEV__) {
        console.log('[RevenueCat] Customer info updated');
      }
      checkProStatus(info);
    }) as any;

    return () => {
      listener?.remove?.();
    };
  }, [checkProStatus]);

  // Purchase a package
  const purchasePackage = useCallback(async (pkg: PurchasesPackage): Promise<boolean> => {
    try {
      if (__DEV__) {
        console.log('[RevenueCat] Purchasing:', pkg.identifier);
      }

      const { customerInfo: newInfo } = await Purchases.purchasePackage(pkg);
      checkProStatus(newInfo);

      // Check if purchase was successful
      const purchased = newInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;

      if (purchased) {
        Alert.alert(
          'Purchase Successful!',
          'Welcome to Sip Pro! Enjoy all premium features.',
          [{ text: 'OK' }]
        );
      }

      return purchased;
    } catch (error) {
      const purchaseError = error as PurchasesError;

      if (__DEV__) {
        console.error('[RevenueCat] Purchase error:', purchaseError);
      }

      // User cancelled - don't show error
      if (purchaseError.userCancelled) {
        return false;
      }

      // Show error alert
      Alert.alert(
        'Purchase Failed',
        purchaseError.message || 'An error occurred. Please try again.',
        [{ text: 'OK' }]
      );

      return false;
    }
  }, [checkProStatus]);

  // Restore purchases
  const restorePurchases = useCallback(async (): Promise<boolean> => {
    try {
      if (__DEV__) {
        console.log('[RevenueCat] Restoring purchases...');
      }

      const info = await Purchases.restorePurchases();
      checkProStatus(info);

      const restored = info.entitlements.active[ENTITLEMENT_ID] !== undefined;

      if (restored) {
        Alert.alert(
          'Purchases Restored',
          'Your Sip Pro subscription has been restored!',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'No Purchases Found',
          'We couldn\'t find any previous purchases to restore.',
          [{ text: 'OK' }]
        );
      }

      return restored;
    } catch (error) {
      const purchaseError = error as PurchasesError;

      if (__DEV__) {
        console.error('[RevenueCat] Restore error:', purchaseError);
      }

      Alert.alert(
        'Restore Failed',
        purchaseError.message || 'An error occurred. Please try again.',
        [{ text: 'OK' }]
      );

      return false;
    }
  }, [checkProStatus]);

  const value: RevenueCatContextType = {
    isPro,
    isLoading,
    offerings,
    customerInfo,
    purchasePackage,
    restorePurchases,
  };

  return (
    <RevenueCatContext.Provider value={value}>
      {children}
    </RevenueCatContext.Provider>
  );
}
