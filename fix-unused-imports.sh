#!/bin/bash

# Script to remove all unused React imports
echo "Fixing unused 'React' imports..."

# Remove unused React imports from specific files
files=(
  "src/components/auth/EmailPasswordFields.tsx"
  "src/components/auth/LoginFormFooter.tsx"
  "src/components/auth/LoginFormHeader.tsx"
  "src/components/marketing/PartnerLogos.tsx"
  "src/components/payments/beneficiaries/BeneficiaryManager.tsx"
  "src/components/payments/beneficiaries/BulkUpload.tsx"
  "src/components/payments/beneficiaries/CategoryManager.tsx"
  "src/components/payments/bulk-payments/BulkPaymentDashboard.tsx"
  "src/debug.tsx"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    # Remove the line "import React from 'react';" or "import React from \"react\";"
    sed -i.bak '/^import React from ['\''"]react['\''"]/d' "$file"
    echo "Fixed: $file"
  fi
done

echo "Done!"
