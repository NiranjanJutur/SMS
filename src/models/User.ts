export type UserRole = 'OWNER' | 'CASHIER' | 'STOCK_MANAGER' | 'ACCOUNTANT';

export interface AppUser {
    id: string;
    name: string;
    phone: string;
    role: UserRole;
    handwritingModelId?: string;
    isActive: boolean;
    createdAt: string;
}
