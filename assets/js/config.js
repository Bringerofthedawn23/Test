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
  PAYMENT_LINKS: {
    road:     'YOUR_STRIPE_PAYMENT_LINK_ROAD',     // e.g. https://buy.stripe.com/xxxxx
    mountain: 'YOUR_STRIPE_PAYMENT_LINK_MOUNTAIN', // e.g. https://buy.stripe.com/yyyyy
  },

  // Admin email — registrations from this account can see all entries
  ADMIN_EMAIL: 'YOUR_ADMIN_EMAIL',

  // Race details (update these when dates and prices are confirmed)
  RACE: {
    road_distance_km:    'TBD',
    road_elevation_m:    'TBD',
    mountain_distance_km:'TBD',
    mountain_elevation_m:'TBD',
    entry_fee_road:      'TBD',
    entry_fee_mountain:  'TBD',
    currency:            '€',
    editions:            ['Spring', 'Autumn'],
    location:            'Vasiliki, Lefkada',
    country:             'Greece',
  }
};
