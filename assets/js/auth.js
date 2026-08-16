/* ============================================================
   VASILIKI RACE — Supabase Auth
   ============================================================ */

let supabase = null;

function initSupabase() {
  if (typeof window.supabase === 'undefined') return null;
  supabase = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
  return supabase;
}

async function getUser() {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

async function signUp(name, email, password) {
  const { data, error } = await supabase.auth.signUp({
    email, password,
    options: { data: { full_name: name } }
  });
  return { data, error };
}

async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error };
}

async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (!error) window.location.href = '/index.html';
}

async function resetPassword(email) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/login.html'
  });
  return { data, error };
}

/* Save registration to Supabase */
async function saveRegistration(data) {
  const user = await getUser();
  if (!user) return { error: { message: 'Not authenticated' } };
  const { data: reg, error } = await supabase.from('registrations').insert([{
    user_id:                  user.id,
    race_category:            data.category,
    race_year:                new Date().getFullYear(),
    full_name:                data.full_name,
    email:                    data.email,
    phone:                    data.phone,
    date_of_birth:            data.dob,
    gender:                   data.gender,
    tshirt_size:              data.tshirt,
    emergency_contact_name:   data.ec_name,
    emergency_contact_phone:  data.ec_phone,
    medical_declaration:      data.medical,
    payment_status:           'pending'
  }]).select().single();
  return { data: reg, error };
}

/* Get registrations for current user */
async function getMyRegistrations() {
  const user = await getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from('registrations')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  return error ? [] : data;
}

/* Admin: get all registrations */
async function getAllRegistrations() {
  const { data, error } = await supabase
    .from('registrations')
    .select('*')
    .order('created_at', { ascending: false });
  return error ? [] : data;
}

/* Admin: update registration status */
async function updatePaymentStatus(id, status) {
  const { data, error } = await supabase
    .from('registrations')
    .update({ payment_status: status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select().single();
  return { data, error };
}

/* Update nav based on auth state */
async function updateNavAuth() {
  const user = await getUser();
  const loginLink  = document.getElementById('nav-login');
  const accountLink = document.getElementById('nav-account');
  const logoutLink = document.getElementById('nav-logout');
  if (user) {
    loginLink?.classList.add('hidden');
    accountLink?.classList.remove('hidden');
    logoutLink?.classList.remove('hidden');
  } else {
    loginLink?.classList.remove('hidden');
    accountLink?.classList.add('hidden');
    logoutLink?.classList.add('hidden');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initSupabase();
  updateNavAuth();
  document.getElementById('nav-logout-btn')?.addEventListener('click', signOut);
});
