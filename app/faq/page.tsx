'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Package, Truck, CreditCard, RotateCcw, Shield, HelpCircle } from 'lucide-react';
import Navigation from '@/app/components/Navigation';
import { Metadata } from 'next';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqData: FAQItem[] = [
  // Ordering & Shipping
  {
    category: 'Ordering & Shipping',
    question: 'How long does shipping take?',
    answer: 'We ship all orders within 2-3 business days. Standard shipping typically takes 5-7 business days within the US. Express shipping (2-3 days) is available at checkout. International shipping varies by location (usually 10-20 business days).'
  },
  {
    category: 'Ordering & Shipping',
    question: 'Do you ship internationally?',
    answer: 'Yes! We ship to most countries worldwide. International shipping rates are calculated at checkout based on your location. Note that international orders may be subject to customs fees and import duties, which are the responsibility of the customer.'
  },
  {
    category: 'Ordering & Shipping',
    question: 'How can I track my order?',
    answer: 'Once your order ships, you\'ll receive an email with tracking information. You can also track your order by logging into your account and visiting the "My Orders" page. If you checked out as a guest, use the order lookup feature with your order number and email.'
  },
  {
    category: 'Ordering & Shipping',
    question: 'My order hasn\'t arrived yet. What should I do?',
    answer: 'First, check your tracking information to see the latest status. If your package shows as delivered but you haven\'t received it, check with neighbors or your building\'s mail room. If you still can\'t locate it, contact us at support@fulluproar.com and we\'ll help resolve the issue.'
  },
  
  // Products & Games
  {
    category: 'Products & Games',
    question: 'What exactly is Fugly?',
    answer: 'Fugly is our flagship chaos-inducing party game that turns friends into frenemies and family dinners into war zones. It\'s a card/board game hybrid designed to create maximum fun through strategic betrayal, ridiculous challenges, and unpredictable gameplay. Perfect for 2-6 players who aren\'t afraid to ruin relationships!'
  },
  {
    category: 'Products & Games',
    question: 'Are your games appropriate for kids?',
    answer: 'We have games for different age groups! Fugly Jr. is designed for ages 8+ with family-friendly chaos. Our main Fugly game is recommended for ages 14+ due to strategic complexity. Fugly: After Dark is strictly 18+ and contains adult content. Check each product page for specific age recommendations.'
  },
  {
    category: 'Products & Games',
    question: 'How many players do your games support?',
    answer: 'Most of our games support 2-6 players, with the sweet spot being 4 players for maximum chaos. Some games have expansion packs that allow up to 8 players. Check individual product descriptions for specific player counts.'
  },
  {
    category: 'Products & Games',
    question: 'How long does a typical game take?',
    answer: 'Game length varies: Fugly typically runs 30-60 minutes (or until someone flips the table). Fugly Jr. is quicker at 20-30 minutes. Fugly: After Dark can go 45-90 minutes depending on how much drama unfolds. All our games are designed to be replayed immediately because someone will demand a rematch!'
  },
  
  // Payment & Pricing
  {
    category: 'Payment & Pricing',
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, Mastercard, American Express, Discover), debit cards, Google Pay, Apple Pay, and Shop Pay through our secure Stripe checkout. All payments are processed securely and we never store your card information.'
  },
  {
    category: 'Payment & Pricing',
    question: 'Is my payment information secure?',
    answer: 'Absolutely! We use Stripe for payment processing, which is PCI Level 1 compliant (the highest level of certification). Your card details are encrypted and sent directly to Stripe - we never see or store your full card information on our servers.'
  },
  {
    category: 'Payment & Pricing',
    question: 'Do you offer discounts or promo codes?',
    answer: 'Yes! Sign up for our newsletter to get 10% off your first order. We also run seasonal sales, flash deals for Cult members, and occasionally hide promo codes in our social media chaos. Follow us to catch these deals!'
  },
  {
    category: 'Payment & Pricing',
    question: 'Are prices in USD?',
    answer: 'Yes, all prices on our site are in US Dollars (USD). If you\'re shopping from another country, your bank will handle the currency conversion at current exchange rates. Some banks may charge a small foreign transaction fee.'
  },
  
  // Returns & Refunds
  {
    category: 'Returns & Refunds',
    question: 'What\'s your return policy?',
    answer: 'We offer a 30-day return policy for unopened games in original condition. If your game arrives damaged or defective, we\'ll replace it free of charge. For opened games, we can only accept returns if there\'s a manufacturing defect. Merch can be returned within 30 days if unworn with tags attached.'
  },
  {
    category: 'Returns & Refunds',
    question: 'How do I return an item?',
    answer: 'Email us at returns@fulluproar.com with your order number and reason for return. We\'ll send you a return authorization and shipping label. Once we receive and inspect the item, we\'ll process your refund within 5-7 business days.'
  },
  {
    category: 'Returns & Refunds',
    question: 'My game arrived damaged. What now?',
    answer: 'We\'re so sorry! Email us at support@fulluproar.com with photos of the damage and your order number. We\'ll send a replacement immediately - no need to return the damaged item. We want you causing chaos, not dealing with shipping hassles!'
  },
  {
    category: 'Returns & Refunds',
    question: 'Can I exchange an item for a different size/product?',
    answer: 'For merchandise size exchanges, absolutely! Contact us within 30 days and we\'ll arrange an exchange. For games, we recommend returning for a refund and placing a new order for the game you want, as this is usually faster.'
  },
  
  // Account & Orders
  {
    category: 'Account & Orders',
    question: 'Do I need an account to order?',
    answer: 'No, you can checkout as a guest! However, creating an account lets you track orders, save addresses, view order history, earn Chaos Points, and checkout faster next time. Plus, Cult members get exclusive perks!'
  },
  {
    category: 'Account & Orders',
    question: 'Can I cancel or modify my order?',
    answer: 'If your order hasn\'t shipped yet, we can usually modify or cancel it. Contact us ASAP at support@fulluproar.com with your order number. Once an order ships, we can\'t make changes, but our return policy has you covered.'
  },
  {
    category: 'Account & Orders',
    question: 'I forgot my password. How do I reset it?',
    answer: 'Click "Sign In" then "Forgot Password" to receive a reset link via email. If you signed up with Google, just use the "Continue with Google" button - no password needed!'
  },
  {
    category: 'Account & Orders',
    question: 'How do I join the Cult of Fugly?',
    answer: 'Visit our /cult page and prove your devotion to chaos! Cult members get early access to new games, exclusive merch, secret promo codes, and the satisfaction of belonging to something beautifully terrible.'
  },
  
  // Miscellaneous
  {
    category: 'Miscellaneous',
    question: 'Are you hiring?',
    answer: 'We\'re always looking for fellow chaos enthusiasts! Check our careers page (coming soon) or email your resume and a haiku about chaos to jobs@fulluproar.com. Bonus points if your cover letter makes us laugh.'
  },
  {
    category: 'Miscellaneous',
    question: 'Can I sell Full Uproar games in my store?',
    answer: 'Absolutely! We love partnering with retailers who appreciate beautiful chaos. Email wholesale@fulluproar.com for our retailer packet and wholesale pricing. Minimum order quantities apply.'
  },
  {
    category: 'Miscellaneous',
    question: 'Will you sponsor our event/channel/podcast?',
    answer: 'Maybe! We love supporting content creators and events that align with our chaotic energy. Send your media kit and proposal to marketing@fulluproar.com. We\'re especially interested if your audience enjoys ruining friendships through gaming.'
  },
  {
    category: 'Miscellaneous',
    question: 'Is the orange color really necessary?',
    answer: 'YES. The aggressive orange is a core part of the Full Uproar experience. It\'s scientifically proven* to increase chaos levels by 47%. If the orange bothers you, you can enable "Chill Mode" in the navigation, but we\'ll be slightly disappointed. (*Not actually scientifically proven)'
  }
];

export default function FAQPage() {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', ...Array.from(new Set(faqData.map(item => item.category)))];
  
  const filteredFAQs = selectedCategory === 'All' 
    ? faqData 
    : faqData.filter(item => item.category === selectedCategory);

  const toggleItem = (index: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  const getCategoryIcon = (category: string) => {
    switch(category) {
      case 'Ordering & Shipping': return <Truck size={20} />;
      case 'Products & Games': return <Package size={20} />;
      case 'Payment & Pricing': return <CreditCard size={20} />;
      case 'Returns & Refunds': return <RotateCcw size={20} />;
      case 'Account & Orders': return <Shield size={20} />;
      default: return <HelpCircle size={20} />;
    }
  };

  return (
    <>
      <Navigation />
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#0a0a0a',
        paddingTop: '80px'
      }}>
        <div style={{
          maxWidth: '1000px',
          margin: '0 auto',
          padding: '2rem'
        }}>
          <h1 style={{ 
            color: '#f97316', 
            fontSize: '3rem', 
            marginBottom: '1rem',
            fontWeight: 900,
            textAlign: 'center'
          }}>
            Frequently Asked Questions
          </h1>
          
          <p style={{
            color: '#94a3b8',
            textAlign: 'center',
            marginBottom: '3rem',
            fontSize: '1.125rem'
          }}>
            Got questions? We've got answers! If you can't find what you're looking for, 
            <a href="mailto:support@fulluproar.com" style={{ color: '#f97316', marginLeft: '0.25rem' }}>
              contact us
            </a>.
          </p>

          {/* Category Filter */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            marginBottom: '2rem',
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                style={{
                  padding: '0.5rem 1rem',
                  background: selectedCategory === category ? '#f97316' : 'transparent',
                  color: selectedCategory === category ? '#111827' : '#94a3b8',
                  border: `2px solid ${selectedCategory === category ? '#f97316' : '#374151'}`,
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
                onMouseEnter={(e) => {
                  if (selectedCategory !== category) {
                    e.currentTarget.style.borderColor = '#f97316';
                    e.currentTarget.style.color = '#fdba74';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedCategory !== category) {
                    e.currentTarget.style.borderColor = '#374151';
                    e.currentTarget.style.color = '#94a3b8';
                  }
                }}
              >
                {category !== 'All' && getCategoryIcon(category)}
                {category}
              </button>
            ))}
          </div>

          {/* FAQ Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredFAQs.map((item, index) => (
              <div
                key={index}
                style={{
                  background: '#1f2937',
                  borderRadius: '0.75rem',
                  border: '2px solid #374151',
                  overflow: 'hidden',
                  transition: 'border-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#f97316'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#374151'}
              >
                <button
                  onClick={() => toggleItem(index)}
                  style={{
                    width: '100%',
                    padding: '1.25rem',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.25rem'
                    }}>
                      {getCategoryIcon(item.category)}
                      <span style={{
                        color: '#64748b',
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        fontWeight: 600,
                        letterSpacing: '0.05em'
                      }}>
                        {item.category}
                      </span>
                    </div>
                    <h3 style={{
                      color: '#fdba74',
                      fontSize: '1.125rem',
                      fontWeight: 600,
                      margin: 0
                    }}>
                      {item.question}
                    </h3>
                  </div>
                  {expandedItems.has(index) ? (
                    <ChevronUp size={24} style={{ color: '#f97316', flexShrink: 0 }} />
                  ) : (
                    <ChevronDown size={24} style={{ color: '#6b7280', flexShrink: 0 }} />
                  )}
                </button>
                
                {expandedItems.has(index) && (
                  <div style={{
                    padding: '0 1.25rem 1.25rem',
                    color: '#cbd5e1',
                    lineHeight: 1.7,
                    borderTop: '1px solid #374151'
                  }}>
                    <p style={{ marginTop: '1rem' }}>{item.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Still need help section */}
          <div style={{
            marginTop: '4rem',
            padding: '2rem',
            background: 'linear-gradient(135deg, #1f2937, #111827)',
            borderRadius: '1rem',
            border: '2px solid #f97316',
            textAlign: 'center'
          }}>
            <h2 style={{
              color: '#f97316',
              fontSize: '2rem',
              marginBottom: '1rem',
              fontWeight: 'bold'
            }}>
              Still Have Questions?
            </h2>
            <p style={{
              color: '#cbd5e1',
              marginBottom: '1.5rem',
              fontSize: '1.125rem'
            }}>
              Our chaos specialists are standing by to help!
            </p>
            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <a
                href="mailto:support@fulluproar.com"
                style={{
                  padding: '0.75rem 2rem',
                  background: '#f97316',
                  color: '#111827',
                  borderRadius: '0.5rem',
                  textDecoration: 'none',
                  fontWeight: 'bold',
                  display: 'inline-block',
                  transition: 'transform 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                Email Support
              </a>
              <a
                href="/contact"
                style={{
                  padding: '0.75rem 2rem',
                  background: 'transparent',
                  color: '#f97316',
                  border: '2px solid #f97316',
                  borderRadius: '0.5rem',
                  textDecoration: 'none',
                  fontWeight: 'bold',
                  display: 'inline-block',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f97316';
                  e.currentTarget.style.color = '#111827';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#f97316';
                }}
              >
                Contact Form
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}