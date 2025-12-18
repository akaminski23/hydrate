import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PurchasesPackage } from 'react-native-purchases';
import { useTheme } from '@/providers/ThemeContext';
import { useRevenueCat } from '@/providers/RevenueCatProvider';
import { spacing, fontSize } from '@/constants/spacing';

type PlanType = 'weekly' | 'yearly' | 'lifetime';

const PRO_FEATURES = [
  {
    icon: 'analytics-outline' as const,
    title: 'Advanced Analytics',
    description: 'Weekly and monthly hydration trends',
  },
  {
    icon: 'notifications-outline' as const,
    title: 'Smart Reminders',
    description: 'AI-powered personalized notifications',
  },
  {
    icon: 'water-outline' as const,
    title: 'Custom Drinks',
    description: 'Add unlimited custom beverages',
  },
  {
    icon: 'cloud-outline' as const,
    title: 'iCloud Sync',
    description: 'Sync across all your devices',
  },
  {
    icon: 'color-palette-outline' as const,
    title: 'Themes & Icons',
    description: 'Customize app appearance',
  },
];

// Fallback prices (used when offerings not loaded)
const FALLBACK_PRICES = {
  weekly: '$0.99',
  yearly: '$19.99',
  lifetime: '$49.99',
};

// Legal document URLs
const LEGAL_URLS = {
  privacyPolicy: 'https://raw.githubusercontent.com/akaminski23/hydrate/main/docs/privacy-policy.md',
  termsOfService: 'https://raw.githubusercontent.com/akaminski23/hydrate/main/docs/terms-of-service.md',
};

export default function PaywallScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { offerings, purchasePackage, restorePurchases, isLoading: isLoadingRevenueCat } = useRevenueCat();

  const [selectedPlan, setSelectedPlan] = useState<PlanType>('yearly');
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  // Get packages from offerings
  const weeklyPackage = offerings?.current?.availablePackages.find(
    (pkg) => pkg.identifier === '$rc_weekly' || pkg.product.identifier === 'sip_pro_weekly'
  );
  const yearlyPackage = offerings?.current?.availablePackages.find(
    (pkg) => pkg.identifier === '$rc_annual' || pkg.product.identifier === 'sip_pro_yearly'
  );
  const lifetimePackage = offerings?.current?.availablePackages.find(
    (pkg) => pkg.identifier === '$rc_lifetime' || pkg.product.identifier === 'sip_pro_lifetime'
  );

  // Debug logging
  if (__DEV__) {
    console.log('[Paywall] Current offering:', offerings?.current?.identifier);
    console.log('[Paywall] Available packages:', offerings?.current?.availablePackages?.map(p => ({
      pkgId: p.identifier,
      productId: p.product.identifier,
      price: p.product.priceString,
    })));
    console.log('[Paywall] Found packages:', {
      weekly: weeklyPackage?.identifier,
      yearly: yearlyPackage?.identifier,
      lifetime: lifetimePackage?.identifier,
    });
  }

  // Get price strings
  const weeklyPrice = weeklyPackage?.product.priceString || FALLBACK_PRICES.weekly;
  const yearlyPrice = yearlyPackage?.product.priceString || FALLBACK_PRICES.yearly;
  const lifetimePrice = lifetimePackage?.product.priceString || FALLBACK_PRICES.lifetime;

  // Get selected package
  const getSelectedPackage = (): PurchasesPackage | undefined => {
    switch (selectedPlan) {
      case 'weekly':
        return weeklyPackage;
      case 'yearly':
        return yearlyPackage;
      case 'lifetime':
        return lifetimePackage;
      default:
        return undefined;
    }
  };

  const handlePurchase = async () => {
    const pkg = getSelectedPackage();
    if (!pkg) {
      if (__DEV__) {
        console.log('[Paywall] No package found for plan:', selectedPlan);
      }
      return;
    }

    setIsPurchasing(true);
    try {
      const success = await purchasePackage(pkg);
      if (success) {
        router.back();
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      const success = await restorePurchases();
      if (success) {
        router.back();
      }
    } finally {
      setIsRestoring(false);
    }
  };

  const isProcessing = isPurchasing || isRestoring;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.closeButton, { backgroundColor: theme.card }]}
          onPress={() => router.back()}
          disabled={isProcessing}
        >
          <Ionicons name="close" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={[styles.iconContainer, { backgroundColor: theme.premium + '20' }]}>
            <Ionicons name="diamond" size={48} color={theme.premium} />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>Sip Pro</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Unlock all features and stay perfectly hydrated
          </Text>
        </View>

        {/* Features */}
        <View style={styles.featuresSection}>
          {PRO_FEATURES.map((feature, index) => (
            <View
              key={index}
              style={[styles.featureRow, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
            >
              <View style={[styles.featureIcon, { backgroundColor: theme.accent + '15' }]}>
                <Ionicons name={feature.icon} size={22} color={theme.accent} />
              </View>
              <View style={styles.featureText}>
                <Text style={[styles.featureTitle, { color: theme.text }]}>
                  {feature.title}
                </Text>
                <Text style={[styles.featureDescription, { color: theme.textSecondary }]}>
                  {feature.description}
                </Text>
              </View>
              <Ionicons name="checkmark-circle" size={22} color={theme.success} />
            </View>
          ))}
        </View>

        {/* Loading state for offerings */}
        {isLoadingRevenueCat ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.accent} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
              Loading plans...
            </Text>
          </View>
        ) : (
          <>
            {/* Pricing */}
            <View style={styles.pricingSection}>
              {/* Yearly - Best Value */}
              <TouchableOpacity
                style={[
                  styles.planCard,
                  styles.planCardFeatured,
                  selectedPlan === 'yearly'
                    ? { backgroundColor: theme.premium + '15', borderColor: theme.premium }
                    : { backgroundColor: theme.card, borderColor: theme.border },
                ]}
                onPress={() => setSelectedPlan('yearly')}
                disabled={isProcessing}
              >
                <View style={[styles.bestValueBadge, { backgroundColor: theme.premium }]}>
                  <Text style={styles.bestValueText}>BEST VALUE</Text>
                </View>
                <Text style={[styles.planName, { color: theme.text }]}>Yearly</Text>
                <View style={styles.priceRow}>
                  <Text style={[styles.planPrice, { color: selectedPlan === 'yearly' ? theme.premium : theme.text }]}>
                    {yearlyPrice}
                  </Text>
                  <Text style={[styles.planPeriod, { color: theme.textSecondary }]}>/year</Text>
                </View>
                <Text style={[styles.planSavings, { color: theme.success }]}>Save 62%</Text>
              </TouchableOpacity>

              {/* Weekly */}
              <TouchableOpacity
                style={[
                  styles.planCard,
                  selectedPlan === 'weekly'
                    ? { backgroundColor: theme.premium + '15', borderColor: theme.premium }
                    : { backgroundColor: theme.card, borderColor: theme.border },
                ]}
                onPress={() => setSelectedPlan('weekly')}
                disabled={isProcessing}
              >
                <Text style={[styles.planName, { color: theme.text }]}>Weekly</Text>
                <View style={styles.priceRow}>
                  <Text style={[styles.planPrice, { color: selectedPlan === 'weekly' ? theme.premium : theme.text }]}>
                    {weeklyPrice}
                  </Text>
                  <Text style={[styles.planPeriod, { color: theme.textSecondary }]}>/week</Text>
                </View>
              </TouchableOpacity>

              {/* Lifetime */}
              <TouchableOpacity
                style={[
                  styles.planCard,
                  selectedPlan === 'lifetime'
                    ? { backgroundColor: theme.premium + '15', borderColor: theme.premium }
                    : { backgroundColor: theme.card, borderColor: theme.border },
                ]}
                onPress={() => setSelectedPlan('lifetime')}
                disabled={isProcessing}
              >
                <Text style={[styles.planName, { color: theme.text }]}>Lifetime</Text>
                <View style={styles.priceRow}>
                  <Text style={[styles.planPrice, { color: selectedPlan === 'lifetime' ? theme.premium : theme.text }]}>
                    {lifetimePrice}
                  </Text>
                  <Text style={[styles.planPeriod, { color: theme.textSecondary }]}>one-time</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Continue Button */}
            <TouchableOpacity
              style={[
                styles.continueButton,
                { backgroundColor: theme.premium },
                isProcessing && styles.buttonDisabled,
              ]}
              onPress={handlePurchase}
              disabled={isProcessing}
            >
              {isPurchasing ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Text style={styles.continueButtonText}>Continue</Text>
              )}
            </TouchableOpacity>

            {/* Restore */}
            <TouchableOpacity
              style={styles.restoreButton}
              onPress={handleRestore}
              disabled={isProcessing}
            >
              {isRestoring ? (
                <ActivityIndicator size="small" color={theme.textSecondary} />
              ) : (
                <Text style={[styles.restoreText, { color: theme.textSecondary }]}>
                  Restore Purchases
                </Text>
              )}
            </TouchableOpacity>
          </>
        )}

        {/* Legal */}
        <View style={styles.legalSection}>
          <Text style={[styles.legalText, { color: theme.textSecondary }]}>
            Subscriptions auto-renew unless cancelled 24 hours before the end of the current period.
          </Text>
          <View style={styles.legalLinks}>
            <TouchableOpacity onPress={() => Linking.openURL(LEGAL_URLS.privacyPolicy)}>
              <Text style={[styles.legalLink, { color: theme.accent }]}>Privacy Policy</Text>
            </TouchableOpacity>
            <Text style={[styles.legalSeparator, { color: theme.textSecondary }]}>|</Text>
            <TouchableOpacity onPress={() => Linking.openURL(LEGAL_URLS.termsOfService)}>
              <Text style={[styles.legalLink, { color: theme.accent }]}>Terms of Service</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ScrollView
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },

  // Hero
  hero: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.base,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },

  // Features
  featuresSection: {
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  featureTitle: {
    fontSize: fontSize.base,
    fontWeight: '600',
  },
  featureDescription: {
    fontSize: fontSize.sm,
    marginTop: 2,
  },

  // Loading
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: fontSize.base,
  },

  // Pricing
  pricingSection: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  planCard: {
    padding: spacing.lg,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
  },
  planCardFeatured: {
    borderWidth: 2,
    position: 'relative',
    paddingTop: spacing.xl,
  },
  bestValueBadge: {
    position: 'absolute',
    top: -12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  bestValueText: {
    color: '#000',
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  planName: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  planPrice: {
    fontSize: 28,
    fontWeight: '700',
  },
  planPeriod: {
    fontSize: fontSize.base,
    marginLeft: spacing.xs,
  },
  planSavings: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    marginTop: spacing.xs,
  },

  // Continue Button
  continueButton: {
    paddingVertical: spacing.md,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    minHeight: 56,
  },
  continueButtonText: {
    color: '#000',
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.7,
  },

  // Restore
  restoreButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    minHeight: 44,
    justifyContent: 'center',
  },
  restoreText: {
    fontSize: fontSize.sm,
  },

  // Legal
  legalSection: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  legalText: {
    fontSize: fontSize.xs,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: spacing.md,
  },
  legalLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  legalLink: {
    fontSize: fontSize.xs,
    textDecorationLine: 'underline',
  },
  legalSeparator: {
    fontSize: fontSize.xs,
  },
});
