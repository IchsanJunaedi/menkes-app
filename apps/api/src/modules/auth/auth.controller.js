"use strict";
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const swagger_1 = require("@nestjs/swagger");
let AuthController = (() => {
    let _classDecorators = [(0, swagger_1.ApiTags)('Auth'), (0, common_1.Controller)('auth')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _logout_decorators;
    var AuthController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _logout_decorators = [(0, common_1.Post)('logout'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiOperation)({ summary: 'Logout and revoke the current access token' })];
            __esDecorate(this, null, _logout_decorators, { kind: "method", name: "logout", static: false, private: false, access: { has: obj => "logout" in obj, get: obj => obj.logout }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            AuthController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        revocationService = __runInitializers(this, _instanceExtraInitializers);
        constructor(revocationService) {
            this.revocationService = revocationService;
        }
        async logout(req) {
            const user = req.user;
            // Assuming the JWT Strategy eventually attaches 'exp' and 'jti' payload directly to user
            // In our manual strategy, we need to extract this from raw JWT or modify the strategy.
            // For now, let's extract it from the authorization header directly
            const authHeader = req.headers.authorization;
            if (!authHeader)
                return { message: 'Logged out locally' };
            const token = authHeader.split(' ')[1];
            try {
                // Decode JWT payload without verifying signature (since guard already verified it)
                const payloadBase64Url = token.split('.')[1];
                const payloadBuf = Buffer.from(payloadBase64Url, 'base64');
                const payload = JSON.parse(payloadBuf.toString());
                if (payload.jti && payload.exp) {
                    const expiresIn = Math.max(0, payload.exp - Math.floor(Date.now() / 1000));
                    await this.revocationService.blockToken(payload.jti, expiresIn);
                }
            }
            catch (e) {
                // Ignore parse errors, token is already verified by passport
            }
            return { message: 'Successfully logged out across the system' };
        }
    };
    return AuthController = _classThis;
})();
exports.AuthController = AuthController;
//# sourceMappingURL=auth.controller.js.map