// Test mode payment utilities
export const TEST_CARDS = {
  // Successful payment cards
  SUCCESS: {
    number: '4242424242424242',
    description: 'Always succeeds'
  },
  SUCCESS_3D: {
    number: '4000002500003155',
    description: 'Requires 3D Secure authentication'
  },
  
  // Card errors
  DECLINED: {
    number: '4000000000000002',
    description: 'Always declines'
  },
  INSUFFICIENT_FUNDS: {
    number: '4000000000009995',
    description: 'Declines with insufficient funds'
  },
  EXPIRED: {
    number: '4000000000000069',
    description: 'Declines as expired card'
  },
  PROCESSING_ERROR: {
    number: '4000000000000119',
    description: 'Declines with processing error'
  },
  
  // Special test scenarios
  SLOW_NETWORK: {
    number: '4000000000001000',
    description: 'Simulates slow network (5s delay)'
  },
  TIMEOUT: {
    number: '4000000000001001',
    description: 'Simulates timeout error'
  }
};

export interface PaymentResult {
  success: boolean;
  error?: string;
  code?: string;
  delay?: number;
}

export async function simulatePayment(cardNumber: string): Promise<PaymentResult> {
  // Remove spaces from card number
  const cleanCard = cardNumber.replace(/\s/g, '');
  
  // Find matching test card
  const testCard = Object.entries(TEST_CARDS).find(
    ([_, card]) => card.number === cleanCard
  );
  
  if (!testCard) {
    // Default behavior for non-test cards
    return {
      success: true,
      delay: 2000
    };
  }
  
  const [cardType, card] = testCard;
  
  // Simulate different scenarios
  switch (cardType) {
    case 'SUCCESS':
      await new Promise(resolve => setTimeout(resolve, 2000));
      return { success: true };
      
    case 'SUCCESS_3D':
      await new Promise(resolve => setTimeout(resolve, 3000));
      return { success: true };
      
    case 'DECLINED':
      await new Promise(resolve => setTimeout(resolve, 1500));
      return { 
        success: false, 
        error: 'Your card was declined',
        code: 'card_declined'
      };
      
    case 'INSUFFICIENT_FUNDS':
      await new Promise(resolve => setTimeout(resolve, 1500));
      return { 
        success: false, 
        error: 'Your card has insufficient funds',
        code: 'insufficient_funds'
      };
      
    case 'EXPIRED':
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { 
        success: false, 
        error: 'Your card has expired',
        code: 'expired_card'
      };
      
    case 'PROCESSING_ERROR':
      await new Promise(resolve => setTimeout(resolve, 2000));
      return { 
        success: false, 
        error: 'An error occurred while processing your card',
        code: 'processing_error'
      };
      
    case 'SLOW_NETWORK':
      await new Promise(resolve => setTimeout(resolve, 5000));
      return { success: true };
      
    case 'TIMEOUT':
      await new Promise(resolve => setTimeout(resolve, 10000));
      return { 
        success: false, 
        error: 'Payment request timed out. Please try again.',
        code: 'timeout'
      };
      
    default:
      await new Promise(resolve => setTimeout(resolve, 2000));
      return { success: true };
  }
}

export function formatTestCardDisplay(cardNumber: string): string {
  const clean = cardNumber.replace(/\s/g, '');
  const testCard = Object.entries(TEST_CARDS).find(
    ([_, card]) => card.number === clean
  );
  
  if (testCard) {
    const [_, card] = testCard;
    return card.description;
  }
  
  return 'Standard test card';
}

export function isTestMode(): boolean {
  // Delegates to the unified payment mode (NEXT_PUBLIC_CHECKOUT_MODE)
  return (process.env.NEXT_PUBLIC_CHECKOUT_MODE || 'dev') !== 'live';
}