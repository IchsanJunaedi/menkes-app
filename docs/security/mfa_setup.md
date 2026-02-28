# Multi-Factor Authentication (MFA) Setup Guide

To meet the high security and compliance requirements of the SehatKu EHR system, Multi-Factor Authentication (MFA/TOTP) is required for high-privilege roles (`DOCTOR` and `ADMIN`). 

Since Keycloak manages the Identity Provider flow, we leverage **Conditional OTP** within the Keycloak Authentication Flow rather than coding MFA manually inside NestJS.

## Enabling Conditional OTP for Specific Roles

Follow these steps inside the Keycloak Admin Console (`http://localhost:8080/admin/`):

1. **Access Authentication Flows:**
   - Go to **Authentication** in the left sidebar.
   - Select the **Browser** flow (or create a copy named `Browser-Conditional-OTP`).

2. **Configure the Flow:**
   - Find the **Browser - Conditional OTP** execution step.
   - Click the gear icon (⚙️) next to the **Condition - user configured** step.
   - Add a **Condition - user role** execution under the OTP form.

3. **Bind the Execution to Roles:**
   - Set the alias to `Require MFA for High-Privilege Users`.
   - Specify the roles: `DOCTOR` and `ADMIN`.
   - Set the execution requirement to **REQUIRED**.

4. **Update Realm Default Behaviors:**
   - Navigate to **Authentication** -> **Required Actions**.
   - Ensure `Configure OTP` is **Enabled** (but not set as Default globally).
   - This ensures that when a `DOCTOR` logs in for the first time, Keycloak will intercept the login and force them to scan a QR code using Google Authenticator or Authy.

## Local Development vs. Production

> [!NOTE]
> In local development environments (`npm run dev`), the `doctor@rscm.example.com` seed user is intentionally configured **without** the `CONFIGURE_TOTP` required action. This allows our backend integration tests and Postman collections to seamlessly acquire an access token using the `password` Direct Access grant without being blocked by an interactive QR code prompt.

In production, the Conditional OTP flow will guarantee that the UI login screen enforces the second factor securely before returning the `access_token` to the frontend apps.
