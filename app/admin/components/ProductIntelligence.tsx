'use client';

import React, { useState, useEffect } from 'react';
import { 
  Package, DollarSign, TrendingUp, BarChart3, PieChart, Activity,
  Truck, Factory, Tags, Calculator, AlertTriangle, CheckCircle,
  ArrowUpRight, ArrowDownRight, Info, Edit2, Save, X, Plus,
  Layers, Box, Zap, Target, ShoppingCart, Percent, Award,
  Clock, Calendar, Users, FileText, Download, Upload, Settings
} from 'lucide-react';
import { adminStyles } from '../styles/adminStyles';

interface ProductComponent {
  id: string;
  name: string;
  category: 'material' | 'labor' | 'packaging' | 'shipping' | 'overhead';
  unitCost: number;
  quantity: number;
  supplier?: string;
  leadTime?: number; // days
  minimumOrder?: number;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  retailPrice: number;
  wholesalePrice?: number;
  components: ProductComponent[];
  totalCOGS: number;
  grossMargin: number;
  grossMarginPercent: number;
  netMargin: number;
  netMarginPercent: number;
  breakEvenPoint: number;
  currentStock: number;
  optimalStock: number;
  reorderPoint: number;
  salesVelocity: number; // units per day
  seasonality: {
    jan: number; feb: number; mar: number; apr: number; may: number; jun: number;
    jul: number; aug: number; sep: number; oct: number; nov: number; dec: number;
  };
  priceHistory: Array<{
    date: Date;
    price: number;
    reason?: string;
  }>;
  competitorPrices?: Array<{
    competitor: string;
    price: number;
    lastUpdated: Date;
  }>;
}

interface Supplier {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  address: string;
  leadTime: number;
  minimumOrder: number;
  paymentTerms: string;
  reliability: number; // 0-100
  qualityScore: number; // 0-100
  priceCompetitiveness: number; // 0-100
  categories: string[];
}

export default function ProductIntelligence({ onNavigate }: { onNavigate: (view: any, label: string) => void }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'suppliers' | 'analytics' | 'pricing'>('overview');
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingCOGS, setEditingCOGS] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [dateRange, setDateRange] = useState('30d');
  
  // Financial metrics
  const [metrics, setMetrics] = useState({
    totalInventoryValue: 0,
    averageMargin: 0,
    topPerformers: [] as any[],
    lowMarginAlerts: [] as any[],
    reorderAlerts: [] as any[]
  });

  useEffect(() => {
    fetchProducts();
    fetchSuppliers();
    calculateMetrics();
  }, []);

  const fetchProducts = async () => {
    try {
      // Fetch real products and enhance with COGS data
      const response = await fetch('/api/admin/products?detailed=true');
      const data = await response.json();
      
      // Mock enhancement for demo
      const enhancedProducts = data.map((product: any) => ({
        ...product,
        components: generateMockComponents(product),
        totalCOGS: calculateCOGS(product),
        grossMargin: product.priceCents / 100 - calculateCOGS(product),
        grossMarginPercent: ((product.priceCents / 100 - calculateCOGS(product)) / (product.priceCents / 100)) * 100,
        netMargin: (product.priceCents / 100 - calculateCOGS(product)) * 0.7, // After operating expenses
        netMarginPercent: ((product.priceCents / 100 - calculateCOGS(product)) * 0.7 / (product.priceCents / 100)) * 100,
        breakEvenPoint: Math.ceil(1000 / ((product.priceCents / 100 - calculateCOGS(product)) * 0.7)),
        currentStock: product.stock || 0,
        optimalStock: Math.ceil(Math.random() * 100 + 50),
        reorderPoint: Math.ceil(Math.random() * 20 + 10),
        salesVelocity: Math.random() * 5 + 1,
        seasonality: generateSeasonality(),
        priceHistory: generatePriceHistory(product.priceCents / 100),
        competitorPrices: generateCompetitorPrices(product.priceCents / 100)
      }));
      
      setProducts(enhancedProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      // Use mock data for demo
      setProducts(generateMockProducts());
    }
  };

  const generateMockComponents = (product: any): ProductComponent[] => {
    const baseComponents: ProductComponent[] = [];
    
    if (product.category === 'GAME' || product.category === 'games') {
      baseComponents.push(
        { id: '1', name: 'Game Board', category: 'material', unitCost: 3.50, quantity: 1, supplier: 'BoardCraft Inc', leadTime: 14 },
        { id: '2', name: 'Cards (Deck)', category: 'material', unitCost: 2.00, quantity: 2, supplier: 'CardPrint Co', leadTime: 7 },
        { id: '3', name: 'Dice Set', category: 'material', unitCost: 0.75, quantity: 1, supplier: 'DiceMakers', leadTime: 5 },
        { id: '4', name: 'Game Pieces', category: 'material', unitCost: 1.50, quantity: 1, supplier: 'Plastics Plus', leadTime: 10 },
        { id: '5', name: 'Rulebook Printing', category: 'material', unitCost: 0.50, quantity: 1, supplier: 'PrintShop Pro', leadTime: 3 },
        { id: '6', name: 'Box', category: 'packaging', unitCost: 2.25, quantity: 1, supplier: 'BoxWorld', leadTime: 7 },
        { id: '7', name: 'Shrink Wrap', category: 'packaging', unitCost: 0.10, quantity: 1, supplier: 'PackSupply', leadTime: 2 },
        { id: '8', name: 'Assembly Labor', category: 'labor', unitCost: 3.00, quantity: 1, leadTime: 1 },
        { id: '9', name: 'Quality Check', category: 'labor', unitCost: 0.50, quantity: 1, leadTime: 1 },
        { id: '10', name: 'Warehousing', category: 'overhead', unitCost: 0.75, quantity: 1, leadTime: 0 }
      );
    } else {
      // Merchandise
      baseComponents.push(
        { id: '1', name: 'Base Material', category: 'material', unitCost: 4.00, quantity: 1, supplier: 'TextileCo', leadTime: 21 },
        { id: '2', name: 'Printing/Design', category: 'material', unitCost: 2.50, quantity: 1, supplier: 'PrintifyPro', leadTime: 5 },
        { id: '3', name: 'Tags/Labels', category: 'material', unitCost: 0.25, quantity: 1, supplier: 'LabelMaster', leadTime: 3 },
        { id: '4', name: 'Polybag', category: 'packaging', unitCost: 0.15, quantity: 1, supplier: 'PackSupply', leadTime: 2 },
        { id: '5', name: 'Production Labor', category: 'labor', unitCost: 2.00, quantity: 1, leadTime: 1 },
        { id: '6', name: 'Fulfillment', category: 'overhead', unitCost: 1.50, quantity: 1, leadTime: 0 }
      );
    }
    
    return baseComponents;
  };

  const calculateCOGS = (product: any): number => {
    const components = generateMockComponents(product);
    return components.reduce((sum, comp) => sum + (comp.unitCost * comp.quantity), 0);
  };

  const generateSeasonality = () => ({
    jan: Math.random() * 0.5 + 0.7,
    feb: Math.random() * 0.5 + 0.8,
    mar: Math.random() * 0.5 + 0.9,
    apr: Math.random() * 0.5 + 1.0,
    may: Math.random() * 0.5 + 1.1,
    jun: Math.random() * 0.5 + 1.2,
    jul: Math.random() * 0.5 + 1.1,
    aug: Math.random() * 0.5 + 1.0,
    sep: Math.random() * 0.5 + 0.9,
    oct: Math.random() * 0.5 + 1.0,
    nov: Math.random() * 0.5 + 1.3,
    dec: Math.random() * 0.5 + 1.5
  });

  const generatePriceHistory = (currentPrice: number) => {
    const history = [];
    let price = currentPrice * 0.8;
    for (let i = 12; i > 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      history.push({
        date,
        price: price + Math.random() * 5 - 2.5,
        reason: i === 6 ? 'Competitor price match' : i === 3 ? 'Holiday promotion' : undefined
      });
      price += (currentPrice - price) / i;
    }
    return history;
  };

  const generateCompetitorPrices = (ourPrice: number) => [
    { competitor: 'Amazon', price: ourPrice * 0.95, lastUpdated: new Date() },
    { competitor: 'Target', price: ourPrice * 1.05, lastUpdated: new Date() },
    { competitor: 'GameStop', price: ourPrice * 0.98, lastUpdated: new Date() },
    { competitor: 'Local Shops', price: ourPrice * 1.15, lastUpdated: new Date() }
  ];

  const generateMockProducts = (): Product[] => {
    return [
      {
        id: '1',
        name: 'Fugly Board Game',
        sku: 'FBG-001',
        category: 'games',
        retailPrice: 49.99,
        wholesalePrice: 25.00,
        components: generateMockComponents({ category: 'GAME' }),
        totalCOGS: 15.85,
        grossMargin: 34.14,
        grossMarginPercent: 68.3,
        netMargin: 23.90,
        netMarginPercent: 47.8,
        breakEvenPoint: 42,
        currentStock: 145,
        optimalStock: 200,
        reorderPoint: 50,
        salesVelocity: 3.2,
        seasonality: generateSeasonality(),
        priceHistory: generatePriceHistory(49.99),
        competitorPrices: generateCompetitorPrices(49.99)
      },
      {
        id: '2',
        name: 'Chaos Cards Expansion',
        sku: 'CCE-001',
        category: 'games',
        retailPrice: 19.99,
        wholesalePrice: 10.00,
        components: generateMockComponents({ category: 'GAME' }),
        totalCOGS: 6.50,
        grossMargin: 13.49,
        grossMarginPercent: 67.5,
        netMargin: 9.44,
        netMarginPercent: 47.2,
        breakEvenPoint: 106,
        currentStock: 89,
        optimalStock: 150,
        reorderPoint: 40,
        salesVelocity: 2.1,
        seasonality: generateSeasonality(),
        priceHistory: generatePriceHistory(19.99),
        competitorPrices: generateCompetitorPrices(19.99)
      }
    ];
  };

  const fetchSuppliers = async () => {
    // Mock supplier data
    setSuppliers([
      {
        id: '1',
        name: 'BoardCraft Inc',
        contact: 'John Smith',
        email: 'john@boardcraft.com',
        phone: '555-0100',
        address: '123 Manufacturing Way, Industrial City, IC 12345',
        leadTime: 14,
        minimumOrder: 100,
        paymentTerms: 'Net 30',
        reliability: 92,
        qualityScore: 95,
        priceCompetitiveness: 78,
        categories: ['Game Boards', 'Boxes']
      },
      {
        id: '2',
        name: 'PrintifyPro',
        contact: 'Sarah Johnson',
        email: 'sarah@printifypro.com',
        phone: '555-0200',
        address: '456 Print Street, Design Town, DT 67890',
        leadTime: 5,
        minimumOrder: 50,
        paymentTerms: 'Net 15',
        reliability: 88,
        qualityScore: 90,
        priceCompetitiveness: 85,
        categories: ['Printing', 'Merchandise']
      }
    ]);
  };

  const calculateMetrics = () => {
    // Calculate inventory metrics
    const totalValue = products.reduce((sum, p) => sum + (p.totalCOGS * p.currentStock), 0);
    const avgMargin = products.reduce((sum, p) => sum + p.grossMarginPercent, 0) / products.length || 0;
    
    const topPerformers = products
      .sort((a, b) => b.grossMargin - a.grossMargin)
      .slice(0, 5)
      .map(p => ({ name: p.name, margin: p.grossMargin, marginPercent: p.grossMarginPercent }));
    
    const lowMarginAlerts = products
      .filter(p => p.grossMarginPercent < 50)
      .map(p => ({ name: p.name, margin: p.grossMarginPercent, target: 50 }));
    
    const reorderAlerts = products
      .filter(p => p.currentStock <= p.reorderPoint)
      .map(p => ({ name: p.name, current: p.currentStock, reorder: p.reorderPoint }));
    
    setMetrics({
      totalInventoryValue: totalValue,
      averageMargin: avgMargin,
      topPerformers,
      lowMarginAlerts,
      reorderAlerts
    });
  };

  const renderCOGSEditor = () => {
    if (!selectedProduct) return null;

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.8)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem'
      }}>
        <div style={{
          background: '#1e293b',
          borderRadius: '1rem',
          width: '100%',
          maxWidth: '800px',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            padding: '2rem',
            borderBottom: '1px solid #334155',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
              Edit COGS Components - {selectedProduct.name}
            </h2>
            <button
              onClick={() => {
                setSelectedProduct(null);
                setEditingCOGS(false);
              }}
              style={adminStyles.iconButton}
            >
              <X size={20} />
            </button>
          </div>

          <div style={{
            flex: 1,
            padding: '2rem',
            overflowY: 'auto'
          }}>
            <div style={{ marginBottom: '2rem' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem'
              }}>
                <h3 style={{ fontWeight: 'bold' }}>Components</h3>
                <button style={{
                  ...adminStyles.secondaryButton,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <Plus size={18} />
                  Add Component
                </button>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #334155' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Component</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Category</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Qty</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Unit Cost</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Total</th>
                    <th style={{ padding: '0.75rem' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {selectedProduct.components.map((component, index) => (
                    <tr key={component.id} style={{ borderBottom: '1px solid #334155' }}>
                      <td style={{ padding: '0.75rem' }}>
                        <input
                          type="text"
                          value={component.name}
                          style={{
                            ...adminStyles.input,
                            margin: 0,
                            padding: '0.5rem'
                          }}
                        />
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <select
                          value={component.category}
                          style={{
                            ...adminStyles.input,
                            margin: 0,
                            padding: '0.5rem'
                          }}
                        >
                          <option value="material">Material</option>
                          <option value="labor">Labor</option>
                          <option value="packaging">Packaging</option>
                          <option value="shipping">Shipping</option>
                          <option value="overhead">Overhead</option>
                        </select>
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        <input
                          type="number"
                          value={component.quantity}
                          style={{
                            ...adminStyles.input,
                            margin: 0,
                            padding: '0.5rem',
                            width: '60px',
                            textAlign: 'center'
                          }}
                        />
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                        <input
                          type="number"
                          value={component.unitCost}
                          step="0.01"
                          style={{
                            ...adminStyles.input,
                            margin: 0,
                            padding: '0.5rem',
                            width: '80px',
                            textAlign: 'right'
                          }}
                        />
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 'bold' }}>
                        ${(component.unitCost * component.quantity).toFixed(2)}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <button style={{ ...adminStyles.iconButton, color: '#ef4444' }}>
                          <X size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: '2px solid #334155' }}>
                    <td colSpan={4} style={{ padding: '0.75rem', fontWeight: 'bold' }}>
                      Total COGS
                    </td>
                    <td style={{ 
                      padding: '0.75rem', 
                      textAlign: 'right', 
                      fontWeight: 'bold',
                      fontSize: '1.25rem',
                      color: '#f97316'
                    }}>
                      ${selectedProduct.components.reduce((sum, c) => sum + (c.unitCost * c.quantity), 0).toFixed(2)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Margin Analysis */}
            <div style={{
              ...adminStyles.card,
              padding: '1.5rem'
            }}>
              <h3 style={{ fontWeight: 'bold', marginBottom: '1rem' }}>Margin Analysis</h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '1rem'
              }}>
                <div>
                  <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                    Retail Price
                  </p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                    ${selectedProduct.retailPrice.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                    Total COGS
                  </p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ef4444' }}>
                    ${selectedProduct.totalCOGS.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                    Gross Margin
                  </p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
                    ${selectedProduct.grossMargin.toFixed(2)} ({selectedProduct.grossMarginPercent.toFixed(1)}%)
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                    Break-Even Units
                  </p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6' }}>
                    {selectedProduct.breakEvenPoint} units
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div style={{
            padding: '2rem',
            borderTop: '1px solid #334155',
            display: 'flex',
            justifyContent: 'space-between'
          }}>
            <button style={adminStyles.secondaryButton}>
              Cancel
            </button>
            <button style={{
              ...adminStyles.button,
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Save size={18} />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderOverview = () => (
    <div style={{ display: 'grid', gap: '2rem' }}>
      {/* Key Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1rem'
      }}>
        <div style={{
          ...adminStyles.card,
          borderLeft: '3px solid #10b981'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                Total Inventory Value
              </p>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
                ${metrics.totalInventoryValue.toLocaleString()}
              </p>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                Based on COGS × Stock
              </p>
            </div>
            <Box size={24} style={{ color: '#10b981' }} />
          </div>
        </div>

        <div style={{
          ...adminStyles.card,
          borderLeft: '3px solid #3b82f6'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                Average Margin
              </p>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>
                {metrics.averageMargin.toFixed(1)}%
              </p>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                Gross profit margin
              </p>
            </div>
            <Percent size={24} style={{ color: '#3b82f6' }} />
          </div>
        </div>

        <div style={{
          ...adminStyles.card,
          borderLeft: '3px solid #f59e0b'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                Low Stock Alerts
              </p>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>
                {metrics.reorderAlerts.length}
              </p>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                Need reordering
              </p>
            </div>
            <AlertTriangle size={24} style={{ color: '#f59e0b' }} />
          </div>
        </div>

        <div style={{
          ...adminStyles.card,
          borderLeft: '3px solid #8b5cf6'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                Active Suppliers
              </p>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#8b5cf6' }}>
                {suppliers.length}
              </p>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                Verified partners
              </p>
            </div>
            <Truck size={24} style={{ color: '#8b5cf6' }} />
          </div>
        </div>
      </div>

      {/* Alerts and Insights */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '2rem'
      }}>
        {/* Low Margin Alerts */}
        <div style={adminStyles.card}>
          <h3 style={{ fontWeight: 'bold', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={20} style={{ color: '#ef4444' }} />
            Low Margin Products
          </h3>
          {metrics.lowMarginAlerts.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {metrics.lowMarginAlerts.map((alert, index) => (
                <div key={index} style={{
                  padding: '1rem',
                  background: '#0f172a',
                  borderLeft: '3px solid #ef4444',
                  borderRadius: '0.5rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontWeight: 'bold' }}>{alert.name}</p>
                      <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                        Current margin: {alert.margin.toFixed(1)}% (Target: {alert.target}%)
                      </p>
                    </div>
                    <button style={{
                      ...adminStyles.secondaryButton,
                      padding: '0.5rem 1rem'
                    }}>
                      Review Pricing
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#94a3b8' }}>All products have healthy margins!</p>
          )}
        </div>

        {/* Reorder Alerts */}
        <div style={adminStyles.card}>
          <h3 style={{ fontWeight: 'bold', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Package size={20} style={{ color: '#f59e0b' }} />
            Reorder Required
          </h3>
          {metrics.reorderAlerts.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {metrics.reorderAlerts.map((alert, index) => (
                <div key={index} style={{
                  padding: '1rem',
                  background: '#0f172a',
                  borderLeft: '3px solid #f59e0b',
                  borderRadius: '0.5rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontWeight: 'bold' }}>{alert.name}</p>
                      <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                        Stock: {alert.current} units (Reorder at: {alert.reorder})
                      </p>
                    </div>
                    <button style={{
                      ...adminStyles.button,
                      padding: '0.5rem 1rem',
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                    }}>
                      Create PO
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#94a3b8' }}>All products are well stocked!</p>
          )}
        </div>
      </div>

      {/* Top Performers */}
      <div style={adminStyles.card}>
        <h3 style={{ fontWeight: 'bold', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Award size={20} style={{ color: '#10b981' }} />
          Top Performing Products
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #334155' }}>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Product</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>Gross Margin</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>Margin %</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>Trend</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {metrics.topPerformers.map((product, index) => (
              <tr key={index} style={{ borderBottom: '1px solid #334155' }}>
                <td style={{ padding: '1rem' }}>
                  <p style={{ fontWeight: 'bold' }}>{product.name}</p>
                </td>
                <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 'bold', color: '#10b981' }}>
                  ${product.margin.toFixed(2)}
                </td>
                <td style={{ padding: '1rem', textAlign: 'center' }}>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    background: '#10b98120',
                    color: '#10b981',
                    borderRadius: '50px',
                    fontWeight: 'bold'
                  }}>
                    {product.marginPercent.toFixed(1)}%
                  </span>
                </td>
                <td style={{ padding: '1rem', textAlign: 'center' }}>
                  <ArrowUpRight size={20} style={{ color: '#10b981' }} />
                </td>
                <td style={{ padding: '1rem', textAlign: 'right' }}>
                  <button style={adminStyles.iconButton}>
                    <Edit2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderProducts = () => (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <div style={{ flex: 1, marginRight: '2rem' }}>
          <input
            type="text"
            placeholder="Search products by name, SKU, or category..."
            style={adminStyles.input}
          />
        </div>
        <button style={{
          ...adminStyles.button,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Upload size={18} />
          Import Products
        </button>
      </div>

      <div style={adminStyles.card}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #334155' }}>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Product</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>SKU</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>Retail</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>COGS</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>Margin</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>Stock</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>Velocity</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.id} style={{ borderBottom: '1px solid #334155' }}>
                <td style={{ padding: '1rem' }}>
                  <p style={{ fontWeight: 'bold' }}>{product.name}</p>
                  <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>{product.category}</p>
                </td>
                <td style={{ padding: '1rem', textAlign: 'center', fontFamily: 'monospace' }}>
                  {product.sku}
                </td>
                <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold' }}>
                  ${product.retailPrice.toFixed(2)}
                </td>
                <td style={{ padding: '1rem', textAlign: 'right', color: '#ef4444' }}>
                  ${product.totalCOGS.toFixed(2)}
                </td>
                <td style={{ padding: '1rem', textAlign: 'center' }}>
                  <div>
                    <p style={{ fontWeight: 'bold', color: '#10b981' }}>
                      ${product.grossMargin.toFixed(2)}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      {product.grossMarginPercent.toFixed(1)}%
                    </p>
                  </div>
                </td>
                <td style={{ padding: '1rem', textAlign: 'center' }}>
                  <div>
                    <p style={{ 
                      fontWeight: 'bold',
                      color: product.currentStock <= product.reorderPoint ? '#ef4444' : '#e2e8f0'
                    }}>
                      {product.currentStock}
                    </p>
                    {product.currentStock <= product.reorderPoint && (
                      <p style={{ fontSize: '0.75rem', color: '#ef4444' }}>Low!</p>
                    )}
                  </div>
                </td>
                <td style={{ padding: '1rem', textAlign: 'center' }}>
                  {product.salesVelocity.toFixed(1)}/day
                </td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                    <button
                      onClick={() => {
                        setSelectedProduct(product);
                        setEditingCOGS(true);
                      }}
                      style={adminStyles.iconButton}
                      title="Edit COGS"
                    >
                      <Calculator size={18} />
                    </button>
                    <button
                      style={adminStyles.iconButton}
                      title="View Details"
                    >
                      <BarChart3 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderSuppliers = () => (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Supplier Network</h3>
        <button style={{
          ...adminStyles.button,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Plus size={18} />
          Add Supplier
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
        gap: '1.5rem'
      }}>
        {suppliers.map(supplier => (
          <div key={supplier.id} style={{
            ...adminStyles.card,
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem'
            }}>
              <button style={adminStyles.iconButton}>
                <Edit2 size={18} />
              </button>
            </div>

            <h4 style={{ fontWeight: 'bold', marginBottom: '1rem' }}>
              {supplier.name}
            </h4>

            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                Contact: {supplier.contact}
              </p>
              <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                Email: {supplier.email}
              </p>
              <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
                Terms: {supplier.paymentTerms}
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                  Reliability
                </p>
                <div style={{
                  height: '6px',
                  background: '#334155',
                  borderRadius: '3px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${supplier.reliability}%`,
                    height: '100%',
                    background: supplier.reliability > 80 ? '#10b981' : '#f59e0b'
                  }} />
                </div>
                <p style={{ fontSize: '0.75rem', fontWeight: 'bold', marginTop: '0.25rem' }}>
                  {supplier.reliability}%
                </p>
              </div>

              <div>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                  Quality
                </p>
                <div style={{
                  height: '6px',
                  background: '#334155',
                  borderRadius: '3px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${supplier.qualityScore}%`,
                    height: '100%',
                    background: supplier.qualityScore > 80 ? '#10b981' : '#f59e0b'
                  }} />
                </div>
                <p style={{ fontSize: '0.75rem', fontWeight: 'bold', marginTop: '0.25rem' }}>
                  {supplier.qualityScore}%
                </p>
              </div>

              <div>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                  Pricing
                </p>
                <div style={{
                  height: '6px',
                  background: '#334155',
                  borderRadius: '3px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${supplier.priceCompetitiveness}%`,
                    height: '100%',
                    background: supplier.priceCompetitiveness > 70 ? '#10b981' : '#f59e0b'
                  }} />
                </div>
                <p style={{ fontSize: '0.75rem', fontWeight: 'bold', marginTop: '0.25rem' }}>
                  {supplier.priceCompetitiveness}%
                </p>
              </div>
            </div>

            <div style={{
              padding: '0.75rem',
              background: '#0f172a',
              borderRadius: '0.5rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Lead Time:</span>
                <span style={{ fontWeight: 'bold' }}>{supplier.leadTime} days</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Min Order:</span>
                <span style={{ fontWeight: 'bold' }}>{supplier.minimumOrder} units</span>
              </div>
            </div>

            <div style={{ marginTop: '1rem' }}>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                Categories:
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {supplier.categories.map(cat => (
                  <span key={cat} style={{
                    padding: '0.25rem 0.5rem',
                    background: '#334155',
                    borderRadius: '50px',
                    fontSize: '0.75rem'
                  }}>
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={adminStyles.container}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Product Intelligence</h1>
          <p style={{ color: '#94a3b8' }}>
            Advanced COGS tracking, margin analysis, and inventory optimization
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button style={adminStyles.secondaryButton}>
            <Download size={18} />
            Export Report
          </button>
          <button style={{
            ...adminStyles.button,
            background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Settings size={18} />
            Settings
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '2rem',
        marginBottom: '2rem',
        borderBottom: '1px solid #334155'
      }}>
        {[
          { id: 'overview', label: 'Overview', icon: <Activity size={18} /> },
          { id: 'products', label: 'Products', icon: <Package size={18} /> },
          { id: 'suppliers', label: 'Suppliers', icon: <Truck size={18} /> },
          { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={18} /> },
          { id: 'pricing', label: 'Pricing Strategy', icon: <Target size={18} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: '1rem',
              background: 'transparent',
              border: 'none',
              color: activeTab === tab.id ? '#f97316' : '#94a3b8',
              fontWeight: activeTab === tab.id ? 'bold' : 'normal',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              borderBottom: activeTab === tab.id ? '2px solid #f97316' : '2px solid transparent',
              marginBottom: '-1px'
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'products' && renderProducts()}
      {activeTab === 'suppliers' && renderSuppliers()}

      {/* COGS Editor Modal */}
      {editingCOGS && renderCOGSEditor()}
    </div>
  );
}