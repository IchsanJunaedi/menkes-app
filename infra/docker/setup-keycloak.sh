#!/bin/bash
export PATH=$PATH:/opt/keycloak/bin

# Wait for keycloak to be ready
echo "Authenticating with Keycloak..."
/opt/keycloak/bin/kcadm.sh config credentials --server http://localhost:8080 --realm master --user admin --password change_me_in_production || exit 1

echo "Checking if realm ehr-system exists..."
REALM_EXISTS=$(/opt/keycloak/bin/kcadm.sh get realms/ehr-system 2>/dev/null | grep -c "ehr-system")

if [ "$REALM_EXISTS" -eq 0 ]; then
  echo "Creating realm ehr-system..."
  /opt/keycloak/bin/kcadm.sh create realms -s realm=ehr-system -s enabled=true || exit 1
else
  echo "Realm ehr-system already exists."
fi

echo "Updating realm token lifespans..."
/opt/keycloak/bin/kcadm.sh update realms/ehr-system -s accessTokenLifespan=900 -s ssoSessionIdleTimeout=36000 -s ssoSessionMaxLifespan=36000

echo "Creating Clients..."
# ehr-web (Public)
/opt/keycloak/bin/kcadm.sh create clients -r ehr-system -s clientId=ehr-web -s publicClient=true -s "redirectUris=[\"*\"]" -s "webOrigins=[\"*\"]" -s directAccessGrantsEnabled=true 2>/dev/null || echo "ehr-web might already exist"

# ehr-mobile (Public)
/opt/keycloak/bin/kcadm.sh create clients -r ehr-system -s clientId=ehr-mobile -s publicClient=true -s "redirectUris=[\"*\"]" -s "webOrigins=[\"*\"]" -s directAccessGrantsEnabled=true 2>/dev/null || echo "ehr-mobile might already exist"

# ehr-api (Confidential)
/opt/keycloak/bin/kcadm.sh create clients -r ehr-system -s clientId=ehr-api -s publicClient=false -s serviceAccountsEnabled=true -s directAccessGrantsEnabled=true -s secret="ehr-api-secret-key-123" 2>/dev/null || echo "ehr-api might already exist"

echo "Creating Roles..."
for ROLE in PATIENT DOCTOR NURSE ADMIN AUDITOR; do
  /opt/keycloak/bin/kcadm.sh create roles -r ehr-system -s name=$ROLE 2>/dev/null || echo "Role $ROLE might already exist"
done

echo "Setting up a test user..."
# Delete if exists to recreate
TEST_USER_ID=$(/opt/keycloak/bin/kcadm.sh get users -r ehr-system -q username=doctor@rscm.example.com | grep -oP '(?<="id" : ")[^"]*')
if [ ! -z "$TEST_USER_ID" ]; then
    /opt/keycloak/bin/kcadm.sh delete users/$TEST_USER_ID -r ehr-system
fi

/opt/keycloak/bin/kcadm.sh create users -r ehr-system -s username=doctor@rscm.example.com -s email=doctor@rscm.example.com -s enabled=true -s emailVerified=true

# Set password for doctor
/opt/keycloak/bin/kcadm.sh set-password -r ehr-system --username doctor@rscm.example.com --new-password doctor123

# Assign DOCTOR role
/opt/keycloak/bin/kcadm.sh add-roles -r ehr-system --uusername doctor@rscm.example.com --rolename DOCTOR

echo "Keycloak setup complete."
