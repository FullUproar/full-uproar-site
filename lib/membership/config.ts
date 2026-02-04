/**
 * Customer Membership Tiers and Benefits Configuration
 * Separate from employee roles - this is for customer benefits only
 */

export enum MembershipTier {
  FREE = 'FREE',
  AFTERROAR_PLUS = 'AFTERROAR_PLUS',
  VIP = 'VIP',
  CREATOR = 'CREATOR',
  BETA_TESTER = 'BETA_TESTER'
}

export interface MembershipBenefits {
  displayName: string;
  description: string;
  color: string;
  icon: string;
  benefits: {
    freeShipping: boolean;
    freeShippingThreshold?: number; // In cents, if not always free
    discountPercent: number;
    earlyAccess: boolean;
    exclusiveMerch: boolean;
    prioritySupport: boolean;
    digitalDownloads: 'none' | 'limited' | 'unlimited';
    monthlyCredits: number; // Store credits
    specialBadge: boolean;
    forumAccess: 'basic' | 'premium' | 'vip';
    betaFeatures: boolean;
    eventInvites: boolean;
    customTitle?: string; // Custom forum title
  };
  pricing?: {
    monthly: number; // In cents
    yearly: number; // In cents
    savings?: string; // e.g., "Save 20%"
  };
}

export const MEMBERSHIP_BENEFITS: Record<MembershipTier, MembershipBenefits> = {
  [MembershipTier.FREE]: {
    displayName: 'Free Member',
    description: 'Basic membership with access to shop and community',
    color: '#64748b',
    icon: '👤',
    benefits: {
      freeShipping: false,
      freeShippingThreshold: 5000, // Free shipping over $50
      discountPercent: 0,
      earlyAccess: false,
      exclusiveMerch: false,
      prioritySupport: false,
      digitalDownloads: 'none',
      monthlyCredits: 0,
      specialBadge: false,
      forumAccess: 'basic',
      betaFeatures: false,
      eventInvites: false
    }
  },
  
  [MembershipTier.AFTERROAR_PLUS]: {
    displayName: 'Afterroar+',
    description: 'Premium membership with exclusive benefits and discounts',
    color: '#FF8200',
    icon: '👑',
    benefits: {
      freeShipping: false,
      freeShippingThreshold: 7500, // Free shipping over $75
      discountPercent: 10,
      earlyAccess: true,
      exclusiveMerch: true,
      prioritySupport: true,
      digitalDownloads: 'unlimited',
      monthlyCredits: 0, // Removed monthly credits to break even
      specialBadge: true,
      forumAccess: 'premium',
      betaFeatures: true,
      eventInvites: true,
      customTitle: 'Afterroar+ Member'
    },
    pricing: {
      monthly: 666, // $6.66/month
      yearly: 6900, // $69.00/year
      savings: 'Save $10.92/year'
    }
  },
  
  [MembershipTier.VIP]: {
    displayName: 'VIP',
    description: 'Exclusive tier for our most valued customers',
    color: '#fbbf24',
    icon: '⭐',
    benefits: {
      freeShipping: true,
      discountPercent: 25,
      earlyAccess: true,
      exclusiveMerch: true,
      prioritySupport: true,
      digitalDownloads: 'unlimited',
      monthlyCredits: 1000, // $10 in store credit
      specialBadge: true,
      forumAccess: 'vip',
      betaFeatures: true,
      eventInvites: true,
      customTitle: 'VIP Fugly'
    }
    // VIP is invitation only, no pricing
  },
  
  [MembershipTier.CREATOR]: {
    displayName: 'Content Creator',
    description: 'Special tier for community content creators and influencers',
    color: '#7D55C7',
    icon: '🎨',
    benefits: {
      freeShipping: true,
      discountPercent: 20,
      earlyAccess: true,
      exclusiveMerch: true,
      prioritySupport: true,
      digitalDownloads: 'unlimited',
      monthlyCredits: 0,
      specialBadge: true,
      forumAccess: 'premium',
      betaFeatures: true,
      eventInvites: true,
      customTitle: 'Creator'
    }
    // Creator tier is granted manually
  },
  
  [MembershipTier.BETA_TESTER]: {
    displayName: 'Beta Tester',
    description: 'Early access to new products and features',
    color: '#10b981',
    icon: '🧪',
    benefits: {
      freeShipping: false,
      freeShippingThreshold: 3000, // Free shipping over $30
      discountPercent: 10,
      earlyAccess: true,
      exclusiveMerch: false,
      prioritySupport: false,
      digitalDownloads: 'limited',
      monthlyCredits: 0,
      specialBadge: true,
      forumAccess: 'premium',
      betaFeatures: true,
      eventInvites: false,
      customTitle: 'Beta Tester'
    }
    // Beta tester is invitation only
  }
};

/**
 * Check if a membership tier has a specific benefit
 */
export function hasBenefit(tier: MembershipTier, benefit: keyof MembershipBenefits['benefits']): boolean {
  const benefits = MEMBERSHIP_BENEFITS[tier]?.benefits;
  if (!benefits) return false;
  
  const value = benefits[benefit];
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value > 0;
  if (typeof value === 'string') return value !== 'none' && value !== 'basic';
  return false;
}

/**
 * Calculate final price with membership discount
 */
export function calculateMembershipPrice(
  basePrice: number,
  tier: MembershipTier,
  hasEmployeeDiscount: boolean = false,
  employeeDiscountPercent: number = 0
): {
  originalPrice: number;
  membershipDiscount: number;
  employeeDiscount: number;
  finalPrice: number;
  savedAmount: number;
  savedPercent: number;
} {
  const membershipDiscountPercent = MEMBERSHIP_BENEFITS[tier].benefits.discountPercent;
  
  // Apply membership discount
  const membershipDiscount = Math.floor(basePrice * membershipDiscountPercent / 100);
  const afterMembershipPrice = basePrice - membershipDiscount;
  
  // Apply employee discount on top of membership discount
  const employeeDiscountAmount = hasEmployeeDiscount 
    ? Math.floor(afterMembershipPrice * employeeDiscountPercent / 100)
    : 0;
  
  const finalPrice = afterMembershipPrice - employeeDiscountAmount;
  const totalSaved = membershipDiscount + employeeDiscountAmount;
  const totalSavedPercent = Math.round((totalSaved / basePrice) * 100);
  
  return {
    originalPrice: basePrice,
    membershipDiscount,
    employeeDiscount: employeeDiscountAmount,
    finalPrice,
    savedAmount: totalSaved,
    savedPercent: totalSavedPercent
  };
}

/**
 * Check if shipping is free for this order
 */
export function isShippingFree(
  tier: MembershipTier,
  orderTotal: number // in cents
): boolean {
  const benefits = MEMBERSHIP_BENEFITS[tier].benefits;
  
  if (benefits.freeShipping) return true;
  
  if (benefits.freeShippingThreshold && orderTotal >= benefits.freeShippingThreshold) {
    return true;
  }
  
  return false;
}

/**
 * Get shipping discount for Afterroar+ members
 */
export function getShippingRate(
  tier: MembershipTier,
  standardRate: number // in cents
): number {
  if (tier === MembershipTier.AFTERROAR_PLUS) {
    // Flat $3.99 shipping for Afterroar+ members
    return Math.min(399, standardRate);
  }
  return standardRate;
}

/**
 * Get display badge for membership tier
 */
export function getMembershipBadge(tier: MembershipTier): {
  icon: string;
  text: string;
  color: string;
} {
  const config = MEMBERSHIP_BENEFITS[tier];
  return {
    icon: config.icon,
    text: config.displayName,
    color: config.color
  };
}

/**
 * Check if user is eligible for early access
 */
export function hasEarlyAccess(tier: MembershipTier): boolean {
  return MEMBERSHIP_BENEFITS[tier].benefits.earlyAccess;
}

/**
 * Check if user has employee benefits (any employee role)
 */
export function isEmployee(userRole?: string): boolean {
  const employeeRoles = [
    'GOD', 'SUPER_ADMIN', 'ADMIN', 'HR', 'PRODUCT_MANAGER',
    'MARKETING', 'CUSTOMER_SERVICE', 'WAREHOUSE', 'ACCOUNTING',
    'CONTENT_CREATOR', 'MODERATOR', 'INTERN'
  ];
  
  return userRole ? employeeRoles.includes(userRole) : false;
}

/**
 * Get employee discount percentage based on role
 */
export function getEmployeeDiscountPercent(userRole?: string): number {
  if (!userRole) return 0;
  
  // Different discounts by role level
  const discountMap: Record<string, number> = {
    'GOD': 100,          // Free everything
    'SUPER_ADMIN': 50,   // 50% off
    'ADMIN': 40,         // 40% off
    'HR': 30,
    'PRODUCT_MANAGER': 30,
    'MARKETING': 30,
    'CUSTOMER_SERVICE': 25,
    'WAREHOUSE': 25,
    'ACCOUNTING': 25,
    'CONTENT_CREATOR': 25,
    'MODERATOR': 20,
    'INTERN': 15         // 15% off
  };
  
  return discountMap[userRole] || 0;
}