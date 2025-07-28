// This script checks the DATABASE_URL and updates the schema provider accordingly
const fs = require('fs');
const path = require('path');

const databaseUrl = process.env.DATABASE_URL || '';
const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');

// Determine provider based on DATABASE_URL
let provider = 'sqlite';
if (databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://')) {
  provider = 'postgresql';
}

// Read current schema
const schema = fs.readFileSync(schemaPath, 'utf8');

// Check current provider
const currentProviderMatch = schema.match(/provider\s*=\s*"(\w+)"/);
const currentProvider = currentProviderMatch ? currentProviderMatch[1] : null;

if (currentProvider !== provider) {
  // Update provider
  const updatedSchema = schema.replace(
    /provider\s*=\s*"\w+"/,
    `provider = "${provider}"`
  );
  
  fs.writeFileSync(schemaPath, updatedSchema);
  console.log(`Updated Prisma provider from ${currentProvider} to ${provider}`);
} else {
  console.log(`Prisma provider is already set to ${provider}`);
}