import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';
import * as xss from 'xss';

@Injectable()
export class XssValidationPipe implements PipeTransform {
    transform(value: any, metadata: ArgumentMetadata) {
        if (value) {
            return this.sanitize(value);
        }
        return value;
    }

    private sanitize(obj: any): any {
        if (typeof obj === 'string') {
            return xss.filterXSS(obj, {
                whiteList: {}, // extremely strict: block all HTML tags
                stripIgnoreTag: true,
                stripIgnoreTagBody: ['script', 'style'],
            });
        }

        if (Array.isArray(obj)) {
            return obj.map((item) => this.sanitize(item));
        }

        if (typeof obj === 'object' && obj !== null) {
            const sanitizedObj: any = {};
            for (const [key, val] of Object.entries(obj)) {
                sanitizedObj[key] = this.sanitize(val);
            }
            return sanitizedObj;
        }

        return obj;
    }
}
