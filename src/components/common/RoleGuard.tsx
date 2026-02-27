import React from 'react';
import { ROLES } from '../../config/constants';

interface RoleGuardProps {
    role: string;
    allowedRoles: string[];
    children: React.ReactNode;
}

// Example Role-Based Guard Component
export const RoleGuard = ({ role, allowedRoles, children }: RoleGuardProps) => {
    if (!allowedRoles.includes(role)) {
        return null;
    }
    return <>{children}</>;
};

export const hasPermission = (userRole: string, requiredRoles: string[]) => {
    return requiredRoles.includes(userRole);
};
