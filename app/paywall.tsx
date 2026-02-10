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

// Rule of Three - only 3 features
const PRO_FEATURES = [
  {
    icon: 'body-outline' as const,
    title: 'Recovery Drinks',
    description: 'Track collagen, bone broth & electrolytes',
  },
  {
    icon: 'fitness-outline' as const,
    title: 'Active Lifestyle',
    description: 'Built for men 30+ with active lifestyles',
  },
  {
    icon: 'sparkles-outline' as const,
    title: 'Premium Experience',
    description: 'Support independent development',
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
      {/* Header with Cancel text */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
          disabled={isProcessing}
        >
          <Text style={[styles.cancelText, { color: theme.accent }]}>Cancel</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Compact Hero */}
        <View style={styles.hero}>
          <Ionicons name="diamond" size={40} color={theme.premium} />
          <Text style={[styles.title, { color: theme.text }]}>Sip Pro</Text>
        </View>

        {/* Pricing Section - ABOVE THE FOLD */}
        {isLoadingRevenueCat ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.accent} />
          </View>
        ) : (
          <View style={styles.pricingSection}>
            {/* Yearly - Featured Card (Full Width) */}
            <TouchableOpacity
              style={[
                styles.featuredCard,
                selectedPlan === 'yearly'
                  ? { backgroundColor: theme.premium + '20', borderColor: theme.premium }
                  : { backgroundColor: theme.card, borderColor: theme.cardBorder },
              ]}
              onPress={() => setSelectedPlan('yearly')}
              disabled={isProcessing}
            >
              <View style={[styles.bestValueBadge, { backgroundColor: theme.premium }]}>
                <Ionicons name="star" size={10} color="#000" />
                <Text style={styles.bestValueText}>BEST VALUE</Text>
              </View>
              <Text style={[styles.featuredPlanName, { color: theme.text }]}>Yearly</Text>
              <Text style={[styles.featuredPrice, { color: selectedPlan === 'yearly' ? theme.premium : theme.text }]}>
                {yearlyPrice}
                <Text style={[styles.featuredPeriod, { color: theme.textSecondary }]}>/year</Text>
              </Text>
              <Text style={[styles.savingsText, { color: theme.success }]}>Save 62%</Text>
            </TouchableOpacity>

            {/* Weekly + Lifetime - Side by Side */}
            <View style={styles.smallCardsRow}>
              {/* Weekly */}
              <TouchableOpacity
                style={[
                  styles.smallCard,
                  selectedPlan === 'weekly'
                    ? { backgroundColor: theme.premium + '20', borderColor: theme.premium }
                    : { backgroundColor: theme.card, borderColor: theme.cardBorder },
                ]}
                onPress={() => setSelectedPlan('weekly')}
                disabled={isProcessing}
              >
                <Text style={[styles.smallPlanName, { color: theme.text }]}>Weekly</Text>
                <Text style={[styles.smallPrice, { color: selectedPlan === 'weekly' ? theme.premium : theme.text }]}>
                  {weeklyPrice}
                </Text>
                <Text style={[styles.smallPeriod, { color: theme.textSecondary }]}>/week</Text>
              </TouchableOpacity>

              {/* Lifetime */}
              <TouchableOpacity
                style={[
                  styles.smallCard,
                  selectedPlan === 'lifetime'
                    ? { backgroundColor: theme.premium + '20', borderColor: theme.premium }
                    : { backgroundColor: theme.card, borderColor: theme.cardBorder },
                ]}
                onPress={() => setSelectedPlan('lifetime')}
                disabled={isProcessing}
              >
                <Text style={[styles.smallPlanName, { color: theme.text }]}>Lifetime</Text>
                <Text style={[styles.smallPrice, { color: selectedPlan === 'lifetime' ? theme.premium : theme.text }]}>
                  {lifetimePrice}
                </Text>
                <Text style={[styles.smallPeriod, { color: theme.textSecondary }]}>one-time</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Features - Rule of Three */}
        <View style={styles.featuresSection}>
          {PRO_FEATURES.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={20} color={theme.success} />
              <View style={styles.featureText}>
                <Text style={[styles.featureTitle, { color: theme.text }]}>
                  {feature.title}
                </Text>
                <Text style={[styles.featureDescription, { color: theme.textSecondary }]}>
                  {feature.description}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Sticky Bottom Section */}
      <View style={[styles.stickyBottom, { backgroundColor: theme.background, borderTopColor: theme.cardBorder }]}>
        {/* Continue Button */}
        <TouchableOpacity
          style={[
            styles.continueButton,
            { backgroundColor: theme.premium },
            isProcessing && styles.buttonDisabled,
          ]}
          onPress={handlePurchase}
          disabled={isProcessing || isLoadingRevenueCat}
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

        {/* Legal */}
        <Text style={[styles.legalText, { color: theme.textSecondary }]}>
          Subscriptions auto-renew unless cancelled 24 hours before end of period.
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
    justifyContent: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  cancelButton: {
    paddingVertical: spacing.xs,
  },
  cancelText: {
    fontSize: fontSize.base,
    fontWeight: '400',
  },

  // ScrollView
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },

  // Compact Hero
  hero: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },

  // Loading
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },

  // Pricing Section
  pricingSection: {
    marginBottom: spacing.lg,
  },

  // Featured Card (Yearly)
  featuredCard: {
    padding: spacing.lg,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    marginBottom: spacing.sm,
    position: 'relative',
  },
  bestValueBadge: {
    position: 'absolute',
    top: -12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  bestValueText: {
    color: '#000',
    fontSize: 11,
    fontWeight: '700',
  },
  featuredPlanName: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  featuredPrice: {
    fontSize: 32,
    fontWeight: '700',
  },
  featuredPeriod: {
    fontSize: fontSize.base,
    fontWeight: '400',
  },
  savingsText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    marginTop: spacing.xs,
  },

  // Small Cards Row
  smallCardsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  smallCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
  },
  smallPlanName: {
    fontSize: fontSize.base,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  smallPrice: {
    fontSize: 22,
    fontWeight: '700',
  },
  smallPeriod: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },

  // Features
  featuresSection: {
    gap: spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: fontSize.base,
    fontWeight: '600',
  },
  featureDescription: {
    fontSize: fontSize.sm,
    marginTop: 2,
  },

  // Sticky Bottom
  stickyBottom: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },

  // Continue Button
  continueButton: {
    paddingVertical: spacing.md,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
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
    paddingVertical: spacing.sm,
    minHeight: 40,
    justifyContent: 'center',
  },
  restoreText: {
    fontSize: fontSize.sm,
  },

  // Legal
  legalText: {
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
  },
  legalLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  legalLink: {
    fontSize: 10,
    textDecorationLine: 'underline',
  },
  legalSeparator: {
    fontSize: 10,
  },
});
