import {
  USER_ROLES,
  ADMIN_ROLES,
  SUPER_ADMIN_ROLES,
  isAdminRole,
  isSuperAdminRole,
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  TICKET_STATUSES,
  HTTP_STATUS,
  PAGINATION,
  RATE_LIMITS,
  SHIPPING_CARRIERS,
} from '@/lib/constants';

describe('Constants', () => {
  describe('Role constants', () => {
    it('should have all 5 user roles in hierarchy order', () => {
      expect(USER_ROLES).toEqual(['USER', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN', 'GOD']);
    });

    it('should have correct admin roles', () => {
      expect(ADMIN_ROLES).toEqual(['ADMIN', 'SUPER_ADMIN', 'GOD']);
    });

    it('should have correct super admin roles', () => {
      expect(SUPER_ADMIN_ROLES).toEqual(['SUPER_ADMIN', 'GOD']);
    });
  });

  describe('isAdminRole', () => {
    it('should return true for admin roles', () => {
      expect(isAdminRole('ADMIN')).toBe(true);
      expect(isAdminRole('SUPER_ADMIN')).toBe(true);
      expect(isAdminRole('GOD')).toBe(true);
    });

    it('should return false for non-admin roles', () => {
      expect(isAdminRole('USER')).toBe(false);
      expect(isAdminRole('MODERATOR')).toBe(false);
    });

    it('should return false for invalid roles', () => {
      expect(isAdminRole('invalid')).toBe(false);
      expect(isAdminRole('')).toBe(false);
    });
  });

  describe('isSuperAdminRole', () => {
    it('should return true for super admin roles', () => {
      expect(isSuperAdminRole('SUPER_ADMIN')).toBe(true);
      expect(isSuperAdminRole('GOD')).toBe(true);
    });

    it('should return false for regular admin', () => {
      expect(isSuperAdminRole('ADMIN')).toBe(false);
    });

    it('should return false for non-admin roles', () => {
      expect(isSuperAdminRole('USER')).toBe(false);
      expect(isSuperAdminRole('MODERATOR')).toBe(false);
    });
  });

  describe('Status constants', () => {
    it('should have all order statuses', () => {
      expect(ORDER_STATUSES).toContain('PENDING');
      expect(ORDER_STATUSES).toContain('CONFIRMED');
      expect(ORDER_STATUSES).toContain('PROCESSING');
      expect(ORDER_STATUSES).toContain('SHIPPED');
      expect(ORDER_STATUSES).toContain('DELIVERED');
      expect(ORDER_STATUSES).toContain('CANCELLED');
      expect(ORDER_STATUSES).toContain('REFUNDED');
      expect(ORDER_STATUSES).toHaveLength(7);
    });

    it('should have all payment statuses', () => {
      expect(PAYMENT_STATUSES).toContain('PENDING');
      expect(PAYMENT_STATUSES).toContain('COMPLETED');
      expect(PAYMENT_STATUSES).toContain('FAILED');
      expect(PAYMENT_STATUSES).toContain('REFUNDED');
      expect(PAYMENT_STATUSES).toContain('PARTIALLY_REFUNDED');
      expect(PAYMENT_STATUSES).toHaveLength(5);
    });

    it('should have all ticket statuses', () => {
      expect(TICKET_STATUSES).toContain('OPEN');
      expect(TICKET_STATUSES).toContain('IN_PROGRESS');
      expect(TICKET_STATUSES).toContain('WAITING');
      expect(TICKET_STATUSES).toContain('RESOLVED');
      expect(TICKET_STATUSES).toContain('CLOSED');
      expect(TICKET_STATUSES).toHaveLength(5);
    });
  });

  describe('HTTP_STATUS', () => {
    it('should have correct success codes', () => {
      expect(HTTP_STATUS.OK).toBe(200);
      expect(HTTP_STATUS.CREATED).toBe(201);
      expect(HTTP_STATUS.NO_CONTENT).toBe(204);
    });

    it('should have correct client error codes', () => {
      expect(HTTP_STATUS.BAD_REQUEST).toBe(400);
      expect(HTTP_STATUS.UNAUTHORIZED).toBe(401);
      expect(HTTP_STATUS.FORBIDDEN).toBe(403);
      expect(HTTP_STATUS.NOT_FOUND).toBe(404);
      expect(HTTP_STATUS.CONFLICT).toBe(409);
      expect(HTTP_STATUS.UNPROCESSABLE_ENTITY).toBe(422);
      expect(HTTP_STATUS.TOO_MANY_REQUESTS).toBe(429);
    });

    it('should have correct server error codes', () => {
      expect(HTTP_STATUS.INTERNAL_SERVER_ERROR).toBe(500);
      expect(HTTP_STATUS.BAD_GATEWAY).toBe(502);
      expect(HTTP_STATUS.SERVICE_UNAVAILABLE).toBe(503);
    });
  });

  describe('PAGINATION', () => {
    it('should have sensible defaults', () => {
      expect(PAGINATION.DEFAULT_PAGE).toBe(1);
      expect(PAGINATION.DEFAULT_LIMIT).toBe(20);
      expect(PAGINATION.MAX_LIMIT).toBe(100);
    });
  });

  describe('RATE_LIMITS', () => {
    it('should have limits configured', () => {
      expect(RATE_LIMITS.API_REQUESTS_PER_MINUTE).toBe(100);
      expect(RATE_LIMITS.AUTH_ATTEMPTS_PER_HOUR).toBe(10);
      expect(RATE_LIMITS.CONTACT_FORM_PER_HOUR).toBe(5);
    });
  });

  describe('SHIPPING_CARRIERS', () => {
    it('should include major carriers', () => {
      expect(SHIPPING_CARRIERS).toContain('fedex');
      expect(SHIPPING_CARRIERS).toContain('ups');
      expect(SHIPPING_CARRIERS).toContain('usps');
      expect(SHIPPING_CARRIERS).toContain('dhl');
    });
  });
});
