#!/bin/bash
export PATH=$PATH:/opt/keycloak/bin
kcadm.sh config credentials --server http://localhost:8080 --realm master --user admin --password change_me_in_production
ID=$(kcadm.sh get users -r ehr-system -q username=doctor@rscm.example.com | grep -o '\"id\" : \"[^\"]*\"' | head -1 | cut -d '"' -f 4)

kcadm.sh update users/$ID -r ehr-system -s 'requiredActions=[]'
kcadm.sh update users/$ID -r ehr-system -s 'emailVerified=true'

# Use update/put to pass the exact JSON payload for credentials bypassing the buggy set-password helper
kcadm.sh update users/$ID/reset-password -r ehr-system -b '{"type":"password","value":"doctor123","temporary":false}'

echo "Password forcefully set to non-temporary."
