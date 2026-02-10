/**
 * Base interface for all entities in the system
 * Following Interface Segregation Principle (ISP)
 */
export interface BaseEntity {
    id: string;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * User entity interface
 */
export interface User extends BaseEntity {
    email: string;
    displayName?: string;
    photoURL?: string;
    emailVerified: boolean;
    phoneNumber?: string;
    role: UserRole;
    preferences: UserPreferences;
}

/**
 * User roles enum
 */
export enum UserRole {
    ADMIN = 'admin',
    SELLER = 'seller',
    CUSTOMER = 'customer',
    GUEST = 'guest'
}

/**
 * User preferences interface
 */
export interface UserPreferences {
    language: 'en' | 'es';
    theme: 'light' | 'dark';
    notifications: boolean;
}

/**
 * Product type enum
 */
export enum ProductType {
    PHYSICAL = 'physical',
    DIGITAL = 'digital',
    AR = 'ar',
    VR = 'vr',
    COURSE = 'course',
    STREAMING = 'streaming'
}

/**
 * Product entity interface
 */
export interface Product extends BaseEntity {
    type: ProductType;
    name: LocalizedString;
    description: LocalizedString;
    price: number;
    currency: string;
    images: string[];
    category: string;
    tags: string[];
    sellerId: string;
    stock?: number;
    isActive: boolean;
    rating?: number;
    reviewCount?: number;
}

/**
 * Localized string interface for multi-language support
 */
export interface LocalizedString {
    en: string;
    es: string;
}

/**
 * Order status enum
 */
export enum OrderStatus {
    PENDING = 'pending',
    PROCESSING = 'processing',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
    REFUNDED = 'refunded'
}

/**
 * Order entity interface
 */
export interface Order extends BaseEntity {
    userId: string;
    items: OrderItem[];
    total: number;
    currency: string;
    status: OrderStatus;
    paymentMethod?: string;
    shippingAddress?: Address;
}

/**
 * Order item interface
 */
export interface OrderItem {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
}

/**
 * Address interface
 */
export interface Address {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
}
