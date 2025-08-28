/**
 * Global state management for admin panel using Zustand
 */

import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { User, Employee, Invoice, Product, Order, UserRole } from '../types';
import { logger } from '../utils/logger';

// ============================================================================
// STATE INTERFACES
// ============================================================================

interface AdminState {
  // User state
  currentUser: User | null;
  permissions: string[];
  
  // UI state
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  locale: string;
  
  // Data cache
  employees: Employee[];
  invoices: Invoice[];
  products: Product[];
  orders: Order[];
  
  // Loading states
  loading: {
    employees: boolean;
    invoices: boolean;
    products: boolean;
    orders: boolean;
  };
  
  // Error states
  errors: {
    employees: Error | null;
    invoices: Error | null;
    products: Error | null;
    orders: Error | null;
  };
  
  // Selected items
  selectedEmployees: string[];
  selectedInvoices: string[];
  selectedProducts: string[];
  selectedOrders: string[];
  
  // Filters
  filters: {
    employees: EmployeeFilter;
    invoices: InvoiceFilter;
    products: ProductFilter;
    orders: OrderFilter;
  };
  
  // Pagination
  pagination: {
    employees: PaginationState;
    invoices: PaginationState;
    products: PaginationState;
    orders: PaginationState;
  };
}

interface AdminActions {
  // User actions
  setCurrentUser: (user: User | null) => void;
  setPermissions: (permissions: string[]) => void;
  hasPermission: (permission: string) => boolean;
  
  // UI actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setLocale: (locale: string) => void;
  
  // Employee actions
  setEmployees: (employees: Employee[]) => void;
  addEmployee: (employee: Employee) => void;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  selectEmployee: (id: string) => void;
  deselectEmployee: (id: string) => void;
  clearEmployeeSelection: () => void;
  setEmployeeFilter: (filter: Partial<EmployeeFilter>) => void;
  setEmployeePage: (page: number) => void;
  
  // Invoice actions
  setInvoices: (invoices: Invoice[]) => void;
  addInvoice: (invoice: Invoice) => void;
  updateInvoice: (id: string, updates: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
  selectInvoice: (id: string) => void;
  deselectInvoice: (id: string) => void;
  clearInvoiceSelection: () => void;
  setInvoiceFilter: (filter: Partial<InvoiceFilter>) => void;
  setInvoicePage: (page: number) => void;
  
  // Product actions
  setProducts: (products: Product[]) => void;
  addProduct: (product: Product) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  updateInventory: (id: string, quantity: number) => void;
  
  // Order actions
  setOrders: (orders: Order[]) => void;
  updateOrderStatus: (id: string, status: string) => void;
  
  // Loading actions
  setLoading: (key: keyof AdminState['loading'], loading: boolean) => void;
  
  // Error actions
  setError: (key: keyof AdminState['errors'], error: Error | null) => void;
  clearErrors: () => void;
  
  // Bulk actions
  bulkDeleteEmployees: (ids: string[]) => void;
  bulkUpdateEmployees: (ids: string[], updates: Partial<Employee>) => void;
  
  // Reset actions
  resetState: () => void;
  clearCache: () => void;
}

// ============================================================================
// FILTER INTERFACES
// ============================================================================

interface EmployeeFilter {
  search: string;
  department: string | null;
  role: string | null;
  status: 'active' | 'inactive' | 'all';
  dateRange: [Date | null, Date | null];
}

interface InvoiceFilter {
  search: string;
  status: string | null;
  customerId: string | null;
  dateRange: [Date | null, Date | null];
  amountRange: [number | null, number | null];
}

interface ProductFilter {
  search: string;
  category: string | null;
  inStock: boolean | null;
  priceRange: [number | null, number | null];
}

interface OrderFilter {
  search: string;
  status: string | null;
  customerId: string | null;
  dateRange: [Date | null, Date | null];
}

interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: AdminState = {
  currentUser: null,
  permissions: [],
  sidebarOpen: true,
  theme: 'dark',
  locale: 'en',
  employees: [],
  invoices: [],
  products: [],
  orders: [],
  loading: {
    employees: false,
    invoices: false,
    products: false,
    orders: false,
  },
  errors: {
    employees: null,
    invoices: null,
    products: null,
    orders: null,
  },
  selectedEmployees: [],
  selectedInvoices: [],
  selectedProducts: [],
  selectedOrders: [],
  filters: {
    employees: {
      search: '',
      department: null,
      role: null,
      status: 'all',
      dateRange: [null, null],
    },
    invoices: {
      search: '',
      status: null,
      customerId: null,
      dateRange: [null, null],
      amountRange: [null, null],
    },
    products: {
      search: '',
      category: null,
      inStock: null,
      priceRange: [null, null],
    },
    orders: {
      search: '',
      status: null,
      customerId: null,
      dateRange: [null, null],
    },
  },
  pagination: {
    employees: { page: 1, pageSize: 20, total: 0 },
    invoices: { page: 1, pageSize: 20, total: 0 },
    products: { page: 1, pageSize: 20, total: 0 },
    orders: { page: 1, pageSize: 20, total: 0 },
  },
};

// ============================================================================
// STORE CREATION
// ============================================================================

export const useAdminStore = create<AdminState & AdminActions>()(
  subscribeWithSelector(
    devtools(
      persist(
        immer((set, get) => ({
          ...initialState,

          // User actions
          setCurrentUser: (user) => set((state) => {
            state.currentUser = user;
          }),

          setPermissions: (permissions) => set((state) => {
            state.permissions = permissions;
          }),

          hasPermission: (permission) => {
            const { permissions, currentUser } = get();
            if (currentUser?.role === UserRole.SUPER_ADMIN) return true;
            return permissions.includes(permission);
          },

          // UI actions
          toggleSidebar: () => set((state) => {
            state.sidebarOpen = !state.sidebarOpen;
          }),

          setSidebarOpen: (open) => set((state) => {
            state.sidebarOpen = open;
          }),

          setTheme: (theme) => set((state) => {
            state.theme = theme;
            document.documentElement.setAttribute('data-theme', theme);
          }),

          setLocale: (locale) => set((state) => {
            state.locale = locale;
          }),

          // Employee actions
          setEmployees: (employees) => set((state) => {
            state.employees = employees;
            state.pagination.employees.total = employees.length;
          }),

          addEmployee: (employee) => set((state) => {
            state.employees.push(employee);
            state.pagination.employees.total++;
            logger.info('Employee added', { employeeId: employee.id });
          }),

          updateEmployee: (id, updates) => set((state) => {
            const index = state.employees.findIndex((e: Employee) => e.id === id);
            if (index !== -1) {
              Object.assign(state.employees[index], updates);
              logger.info('Employee updated', { employeeId: id, updates });
            }
          }),

          deleteEmployee: (id) => set((state) => {
            state.employees = state.employees.filter((e: Employee) => e.id !== id);
            state.selectedEmployees = state.selectedEmployees.filter((sid: string) => sid !== id);
            state.pagination.employees.total--;
            logger.info('Employee deleted', { employeeId: id });
          }),

          selectEmployee: (id) => set((state) => {
            if (!state.selectedEmployees.includes(id)) {
              state.selectedEmployees.push(id);
            }
          }),

          deselectEmployee: (id) => set((state) => {
            state.selectedEmployees = state.selectedEmployees.filter((sid: string) => sid !== id);
          }),

          clearEmployeeSelection: () => set((state) => {
            state.selectedEmployees = [];
          }),

          setEmployeeFilter: (filter) => set((state) => {
            Object.assign(state.filters.employees, filter);
            state.pagination.employees.page = 1; // Reset to first page
          }),

          setEmployeePage: (page) => set((state) => {
            state.pagination.employees.page = page;
          }),

          // Invoice actions
          setInvoices: (invoices) => set((state) => {
            state.invoices = invoices;
            state.pagination.invoices.total = invoices.length;
          }),

          addInvoice: (invoice) => set((state) => {
            state.invoices.push(invoice);
            state.pagination.invoices.total++;
            logger.info('Invoice added', { invoiceId: invoice.id });
          }),

          updateInvoice: (id, updates) => set((state) => {
            const index = state.invoices.findIndex((i: Invoice) => i.id === id);
            if (index !== -1) {
              Object.assign(state.invoices[index], updates);
              logger.info('Invoice updated', { invoiceId: id, updates });
            }
          }),

          deleteInvoice: (id) => set((state) => {
            state.invoices = state.invoices.filter((i: Invoice) => i.id !== id);
            state.selectedInvoices = state.selectedInvoices.filter((sid: string) => sid !== id);
            state.pagination.invoices.total--;
            logger.info('Invoice deleted', { invoiceId: id });
          }),

          selectInvoice: (id) => set((state) => {
            if (!state.selectedInvoices.includes(id)) {
              state.selectedInvoices.push(id);
            }
          }),

          deselectInvoice: (id) => set((state) => {
            state.selectedInvoices = state.selectedInvoices.filter((sid: string) => sid !== id);
          }),

          clearInvoiceSelection: () => set((state) => {
            state.selectedInvoices = [];
          }),

          setInvoiceFilter: (filter) => set((state) => {
            Object.assign(state.filters.invoices, filter);
            state.pagination.invoices.page = 1;
          }),

          setInvoicePage: (page) => set((state) => {
            state.pagination.invoices.page = page;
          }),

          // Product actions
          setProducts: (products) => set((state) => {
            state.products = products;
            state.pagination.products.total = products.length;
          }),

          addProduct: (product) => set((state) => {
            state.products.push(product);
            state.pagination.products.total++;
            logger.info('Product added', { productId: product.id });
          }),

          updateProduct: (id, updates) => set((state) => {
            const index = state.products.findIndex((p: Product) => p.id === id);
            if (index !== -1) {
              Object.assign(state.products[index], updates);
              logger.info('Product updated', { productId: id, updates });
            }
          }),

          deleteProduct: (id) => set((state) => {
            state.products = state.products.filter((p: Product) => p.id !== id);
            state.selectedProducts = state.selectedProducts.filter((sid: string) => sid !== id);
            state.pagination.products.total--;
            logger.info('Product deleted', { productId: id });
          }),

          updateInventory: (id, quantity) => set((state) => {
            const product = state.products.find((p: Product) => p.id === id);
            if (product) {
              product.stock = quantity;
              logger.info('Inventory updated', { productId: id, quantity });
            }
          }),

          // Order actions
          setOrders: (orders) => set((state) => {
            state.orders = orders;
            state.pagination.orders.total = orders.length;
          }),

          updateOrderStatus: (id, status) => set((state) => {
            const order = state.orders.find((o: Order) => o.id === id);
            if (order) {
              order.status = status;
              logger.info('Order status updated', { orderId: id, status });
            }
          }),

          // Loading actions
          setLoading: (key, loading) => set((state) => {
            state.loading[key] = loading;
          }),

          // Error actions
          setError: (key, error) => set((state) => {
            state.errors[key] = error;
            if (error) {
              logger.error(`${key} error:`, error);
            }
          }),

          clearErrors: () => set((state) => {
            state.errors = {
              employees: null,
              invoices: null,
              products: null,
              orders: null,
            };
          }),

          // Bulk actions
          bulkDeleteEmployees: (ids) => set((state) => {
            state.employees = state.employees.filter((e: Employee) => !ids.includes(e.id));
            state.selectedEmployees = state.selectedEmployees.filter((id: string) => !ids.includes(id));
            state.pagination.employees.total -= ids.length;
            logger.info('Bulk delete employees', { count: ids.length });
          }),

          bulkUpdateEmployees: (ids, updates) => set((state) => {
            state.employees.forEach((employee: Employee) => {
              if (ids.includes(employee.id)) {
                Object.assign(employee, updates);
              }
            });
            logger.info('Bulk update employees', { count: ids.length, updates });
          }),

          // Reset actions
          resetState: () => set(() => initialState),

          clearCache: () => set((state) => {
            state.employees = [];
            state.invoices = [];
            state.products = [];
            state.orders = [];
            logger.info('Cache cleared');
          }),
        })),
        {
          name: 'admin-store',
          partialize: (state) => ({
            theme: state.theme,
            locale: state.locale,
            sidebarOpen: state.sidebarOpen,
          }),
        }
      )
    )
  )
);

// ============================================================================
// SELECTORS
// ============================================================================

export const selectFilteredEmployees = (state: AdminState) => {
  const { employees, filters } = state;
  const { search, department, role, status } = filters.employees;

  return employees.filter((employee: Employee) => {
    // Search in firstName, lastName, or email
    if (search) {
      const fullName = `${employee.personalInfo.firstName} ${employee.personalInfo.lastName}`.toLowerCase();
      const email = employee.personalInfo.email.toLowerCase();
      const searchLower = search.toLowerCase();
      if (!fullName.includes(searchLower) && !email.includes(searchLower)) {
        return false;
      }
    }
    if (department && employee.employment.department !== department) {
      return false;
    }
    if (role && employee.employment.position !== role) {
      return false;
    }
    if (status !== 'all' && employee.employment.status !== status) {
      return false;
    }
    return true;
  });
};

export const selectPaginatedEmployees = (state: AdminState) => {
  const filtered = selectFilteredEmployees(state);
  const { page, pageSize } = state.pagination.employees;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  return filtered.slice(start, end);
};

export const selectTotalRevenue = (state: AdminState) => {
  return state.orders.reduce((total, order) => total + order.total, 0);
};

export const selectPendingInvoices = (state: AdminState) => {
  return state.invoices.filter((invoice: Invoice) => invoice.status === 'pending');
};

export const selectLowStockProducts = (state: AdminState) => {
  return state.products.filter((product: Product) => product.stock < 10);
};

// ============================================================================
// SUBSCRIPTIONS
// ============================================================================

// Log state changes in development
if (process.env.NODE_ENV === 'development') {
  useAdminStore.subscribe(
    (state) => state,
    (state, previousState) => {
      console.log('[AdminStore] State changed', { state, previousState });
    }
  );
}

// Persist theme changes
useAdminStore.subscribe(
  (state) => state.theme,
  (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
  }
);