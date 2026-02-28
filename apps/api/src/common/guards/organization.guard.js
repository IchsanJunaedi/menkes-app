"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrganizationGuard = exports.RequireOrgMatch = exports.REQUIRE_ORG_MATCH_KEY = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
exports.REQUIRE_ORG_MATCH_KEY = 'requireOrgMatch';
exports.RequireOrgMatch = core_1.Reflector.createDecorator({ key: exports.REQUIRE_ORG_MATCH_KEY });
let OrganizationGuard = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var OrganizationGuard = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            OrganizationGuard = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        reflector;
        constructor(reflector) {
            this.reflector = reflector;
        }
        canActivate(context) {
            const requireOrgMatch = this.reflector.getAllAndOverride(exports.REQUIRE_ORG_MATCH_KEY, [
                context.getHandler(),
                context.getClass(),
            ]);
            if (!requireOrgMatch) {
                return true; // No org match required for this route
            }
            const request = context.switchToHttp().getRequest();
            const { user, params, body, query } = request;
            if (!user) {
                throw new common_1.ForbiddenException('User is not authenticated');
            }
            // Admins can bypass organization checks
            const userRoles = user.roles || [];
            if (userRoles.includes('ADMIN') || userRoles.includes('AUDITOR')) {
                return true;
            }
            // Extract requested organization ID from URL params, body, or query
            const targetOrgId = params.orgId || body.organizationId || query.orgId;
            if (!targetOrgId) {
                // If the route requires org match but doesn't specify which org, 
                // assume they are accessing their own org resources automatically
                return true;
            }
            if (user.orgId !== targetOrgId) {
                throw new common_1.ForbiddenException(`User does not belong to organization ${targetOrgId}`);
            }
            return true;
        }
    };
    return OrganizationGuard = _classThis;
})();
exports.OrganizationGuard = OrganizationGuard;
//# sourceMappingURL=organization.guard.js.map