#!/bin/bash

# Install required dependencies if not already installed
npm install --save-dev typescript @types/node dotenv

# Create a temporary tsconfig for the script
cat > tsconfig.script.json << EOL
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": false,
    "outDir": "dist"
  },
  "include": ["scripts/updateVideoTypes.ts"],
  "exclude": ["node_modules"]
}
EOL

# Compile the TypeScript file
npx tsc -p tsconfig.script.json

# Rename the output file to .cjs for CommonJS compatibility
mv dist/updateVideoTypes.js dist/updateVideoTypes.cjs

# Run the compiled CommonJS file
node dist/updateVideoTypes.cjs

# Clean up
rm tsconfig.script.json 