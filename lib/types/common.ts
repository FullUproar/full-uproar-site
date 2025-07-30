// Common utility types used throughout the application

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;

export interface ImageSize {
  width: number;
  height: number;
  url: string;
}

export interface ImageUploadResult {
  url: string;
  thumbnailUrl?: string;
  largeUrl?: string;
  sizes?: ImageSize[];
}

export interface SelectOption<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
}

export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (value: any, item: T) => React.ReactNode;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export interface FormState<T> {
  data: T;
  errors: Partial<Record<keyof T, string>>;
  isSubmitting: boolean;
  isDirty: boolean;
}

// Utility type for API handlers
export type ApiHandler<TRequest = any, TResponse = any> = (
  request: TRequest
) => Promise<TResponse>;

// Type guards
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

export function isArray<T>(value: unknown): value is T[] {
  return Array.isArray(value);
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// Helper type for extracting array element type
export type ArrayElement<T> = T extends (infer U)[] ? U : never;

// Helper type for making specific properties optional
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Helper type for making specific properties required
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;