import { SetMetadata } from '@nestjs/common';

export const IS_NO_AUDIT_KEY = 'isNoAudit';
export const NoAudit = () => SetMetadata(IS_NO_AUDIT_KEY, true);
