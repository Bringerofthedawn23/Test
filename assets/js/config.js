/* ============================================================
   VASILIKI RACE — API Configuration
   Replace SUPABASE_URL and SUPABASE_KEY with your values
   from supabase.com → Settings → API
   ============================================================ */

const CONFIG = {
  SUPABASE_URL:  'https://dqpguqpzqfngxvxvyvdn.supabase.co',
  SUPABASE_KEY:  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxcGd1cXB6cWZuZ3h2eHZ5dmRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4ODA3ODIsImV4cCI6MjEwMjQ1Njc4Mn0.hCLgKn16LEr6EsFz_rr_CRjcs9mw90yrfbge8o5zcHQ',
  STRIPE_PK:     'pk_test_51U54aXRtPEshzk8GPs3g1xBwu8mAPZtOfngXXgKjGPDIj2OIx42on4kY9HfYWDMmaeyeu47qApiRPKSDfJf5YS9G00BFkZDdae',
  FACEBOOK_GROUP: 'https://www.facebook.com/share/g/19JeD5B72P/',

  // Race categories and Stripe Payment Link URLs
  // Create Payment Links in your Stripe Dashboard → Payment Links → Create
  // Add each URL below after creating it
  PAYMENT_LINKS: {
    '5km':  'YOUR_STRIPE_PAYMENT_LINK_5KM',   // e.g. https://buy.stripe.com/xxxxx
    '10km': 'YOUR_STRIPE_PAYMENT_LINK_10KM',
    '21km': 'YOUR_STRIPE_PAYMENT_LINK_21KM',
  },

  // Admin email
  ADMIN_EMAIL: 'orfeas3320@yahoo.gr',

  // Race details
  RACE: {
    categories: [
      { id: '5km',  label: '5,000m',        fee: '€5 – €10',  difficulty: 'Easy',        icon: '🟢' },
      { id: '10km', label: '10,000m',        fee: '€10 – €15', difficulty: 'Moderate',    icon: '🟡' },
      { id: '21km', label: '21,097m (Half)', fee: '€15 – €20', difficulty: 'Challenging', icon: '🔴' },
    ],
    currency:  '€',
    editions:  ['Spring', 'Autumn'],
    location:  'Vasiliki, Lefkada',
    country:   'Greece',
  }
};
