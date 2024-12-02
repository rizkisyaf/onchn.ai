declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_APP_URL: string
    SOLANATRACKER_API_KEY: string
    SOLANATRACKER_API_URL: string
    DATABASE_URL: string
    NEXTAUTH_URL: string
    NEXTAUTH_SECRET: string
    STRIPE_SECRET_KEY: string
    STRIPE_WEBHOOK_SECRET: string
    STRIPE_PRO_MONTHLY_PLAN_ID: string
  }
}

