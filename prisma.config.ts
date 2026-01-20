// Ensure .env is loaded before accessing DATABASE_URL
try {
  require('dotenv').config();
} catch (e) {
  // dotenv not available, rely on environment variables
}

export default {
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL,
  },
};

