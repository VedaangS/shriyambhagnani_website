
const SUPABASE_URL = "https://vrxafxwnwmkxqxnjzxup.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyeGFmeHdud21reHF4bmp6eHVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2OTk2MDIsImV4cCI6MjEwNjI3NTYwMn0.eiI2gaKh3lG95TkjJbW9diyMeqc9-bv2famUTN5tKig";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let cachedApplications = [];

async function handleLogin(e) {
  e.preventDefault();
  
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const submitBtn = document.querySelector('#loginForm .submit');
  const errorDiv = document.getElementById('loginError');
  
  const originalText = submitBtn.innerText;
  submitBtn.innerText = 'Signing in...';
  submitBtn.disabled = true;
  errorDiv.style.display = 'none';
  
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email: email,
    password: password
  });
  
  submitBtn.innerText = originalText;
  submitBtn.disabled = false;
  
  if (error) {
    errorDiv.innerText = error.message;
    errorDiv.style.display = 'block';
  } else {
    errorDiv.style.display = 'none';
    document.getElementById('loginView').style.display = 'none';
    document.getElementById('dashboardView').style.display = 'block';
    document.getElementById('navActions').innerHTML = '<button class="btn" onclick="logout()">Logout</button>';
    loadAdminData();
  }
}

async function logout() {
  await supabaseClient.auth.signOut();
  document.getElementById('dashboardView').style.display = 'none';
  document.getElementById('loginView').style.display = 'block';
  document.getElementById('navActions').innerHTML = '<a class="btn" href="index.html">? Back to Home</a>';
  document.getElementById('loginForm').reset();
  document.getElementById('loginError').style.display = 'none';
}

function closeModal() {
  document.getElementById('detailModal').style.display = 'none';
}

function getFileUrl(path) {
  if (!path) return null;
  const { data } = supabaseClient.storage.from('application-documents').getPublicUrl(path);
  return data?.publicUrl || null;
}

async function openDoc(event, path) {
  event.preventDefault();
  try {
    const { data: signedData, error } = await supabaseClient.storage.from('application-documents').createSignedUrl(path, 3600);
    if (signedData?.signedUrl) {
      window.open(signedData.signedUrl, '_blank');
    } else {
      window.open(getFileUrl(path), '_blank');
    }
  } catch (err) {
    window.open(getFileUrl(path), '_blank');
  }
}

function viewDetails(index) {
  const app = cachedApplications[index];
  document.getElementById('modalCompany').textContent = app.company_name || 'Application Details';
  
  const makeLink = (path, label) => {
    return `<a href="${getFileUrl(path)}" onclick="openDoc(event, '${path}')" target="_blank" rel="noopener noreferrer" style="color:var(--accent); font-weight:600; text-decoration:underline; display:inline-block; margin-right:12px; margin-bottom:4px;">?? Open ${label} ?</a>`;
  };
  
  let docsHtml = '';
  if (app.pitch_deck_url) docsHtml += makeLink(app.pitch_deck_url, 'Deck');
  if (app.due_diligence_url) docsHtml += makeLink(app.due_diligence_url, 'DD Report');
  if (app.last_term_sheet_url) docsHtml += makeLink(app.last_term_sheet_url, 'Term Sheet');
  if (!docsHtml) docsHtml = '<span style="color:#999;">—</span>';

  const formatVal = (val) => val ? val : '—';
  const formatCurrency = (val) => val ? Number(val).toLocaleString() : '—';
  
  document.getElementById('modalContent').innerHTML = \`
    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; line-height:1.5;">
      <div><strong style="color:var(--muted);font-size:12px;text-transform:uppercase;">Year Founded</strong><br/> \${formatVal(app.year_founded)}</div>
      <div><strong style="color:var(--muted);font-size:12px;text-transform:uppercase;">Website</strong><br/> \${app.website_link ? \`<a href="\${app.website_link}" target="_blank" style="color:var(--accent);text-decoration:underline;">\${app.website_link}</a>\` : '—'}</div>
      
      <div style="grid-column: 1 / -1;"><strong style="color:var(--muted);font-size:12px;text-transform:uppercase;">Products / Overview</strong><br/> \${formatVal(app.products_overview)}</div>
      
      <div><strong style="color:var(--muted);font-size:12px;text-transform:uppercase;">Annual Sales</strong><br/> \${formatCurrency(app.annual_sales)}</div>
      <div><strong style="color:var(--muted);font-size:12px;text-transform:uppercase;">Total Funding Raised</strong><br/> \${formatCurrency(app.total_funding_raised)}</div>
      
      <div><strong style="color:var(--muted);font-size:12px;text-transform:uppercase;">TRL Level</strong><br/> \${formatVal(app.trl_level)}</div>
      <div><strong style="color:var(--muted);font-size:12px;text-transform:uppercase;">Govt Backed Orders</strong><br/> \${app.govt_backed_orders ? 'Yes (' + formatCurrency(app.govt_orders_amount) + ')' : 'No'}</div>
      
      <div><strong style="color:var(--muted);font-size:12px;text-transform:uppercase;">Patent Granted</strong><br/> \${app.patent_granted ? 'Yes' : 'No'}</div>
      <div><strong style="color:var(--muted);font-size:12px;text-transform:uppercase;">Patent Details</strong><br/> \${formatVal(app.patent_details)}</div>
      
      <div style="grid-column: 1 / -1;"><strong style="color:var(--muted);font-size:12px;text-transform:uppercase;">Founder's Past Experience</strong><br/> \${formatVal(app.founders_experience)}</div>
      <div style="grid-column: 1 / -1;"><strong style="color:var(--muted);font-size:12px;text-transform:uppercase;">Existing Investors</strong><br/> \${formatVal(app.existing_investors)}</div>
      <div style="grid-column: 1 / -1;"><strong style="color:var(--muted);font-size:12px;text-transform:uppercase;">Why should we fund your company?</strong><br/> \${formatVal(app.why_fund_us)}</div>
      
      <div style="grid-column: 1 / -1; margin-top:10px; padding-top:20px; border-top:1px solid var(--line);">
        <strong style="color:var(--muted);font-size:12px;text-transform:uppercase;display:block;margin-bottom:8px;">Documents</strong>
        <div>\${docsHtml}</div>
      </div>
    </div>
  \`;
  
  document.getElementById('detailModal').style.display = 'flex';
}

async function loadAdminData() {
  const tbody = document.getElementById('adminTableBody');
  tbody.innerHTML = '<tr><td colspan="9" style="padding: 20px; text-align:center;">Loading applications from Supabase...</td></tr>';

  try {
    const { data, error } = await supabaseClient
      .from('startup_applications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    cachedApplications = data || [];

    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" style="padding: 20px; text-align:center;">No startup applications found in database.</td></tr>';
      return;
    }

    tbody.innerHTML = '';
    data.forEach((app, index) => {
      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid var(--line)';

      const valuationText = app.company_valuation ? Number(app.company_valuation).toLocaleString() : '—';
      const askText = app.funding_raising ? Number(app.funding_raising).toLocaleString() : '—';
      
      const makeLink = (path, label) => {
        return `<a href="${getFileUrl(path)}" onclick="openDoc(event, '${path}')" target="_blank" rel="noopener noreferrer" style="color:var(--accent); font-weight:600; text-decoration:underline; display:inline-block; margin-right:8px; margin-bottom:4px;">?? Open ${label} ?</a>`;
      };
      
      let docsHtml = '';
      if (app.pitch_deck_url) docsHtml += makeLink(app.pitch_deck_url, 'Deck');
      if (app.due_diligence_url) docsHtml += makeLink(app.due_diligence_url, 'DD Report');
      if (app.last_term_sheet_url) docsHtml += makeLink(app.last_term_sheet_url, 'Term Sheet');
      if (!docsHtml) docsHtml = '<span style="color:#999;">—</span>';

      tr.innerHTML = 
        '<td style=\"padding:14px; font-weight:600;\">' + (app.company_name || '—') + '</td>' +
        '<td style=\"padding:14px;\">' + (app.founder_names || '—') + '</td>' +
        '<td style=\"padding:14px;\">' + (app.contact_number || '—') + '</td>' +
        '<td style=\"padding:14px;\">' + (app.sector || '—') + '</td>' +
        '<td style=\"padding:14px;\">' + valuationText + '</td>' +
        '<td style=\"padding:14px;\">' + askText + '</td>' +
        '<td style=\"padding:14px;\">' + docsHtml + '</td>' +
        '<td style=\"padding:14px;\"><span class=\"badge pending\">' + (app.status || 'pending') + '</span></td>' +
        '<td style=\"padding:14px;\"><button class=\"btn\" style=\"padding:6px 12px; font-size:12px;\" onclick=\"viewDetails(' + index + ')\">View Full Pitch</button></td>';

      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error('Failed to load applications:', err);
    tbody.innerHTML = '<tr><td colspan="9" style="padding: 20px; text-align:center; color:#c0392b;">Failed to load from Supabase: ' + (err.message || 'Unknown error') + '</td></tr>';
  }
}

function exportCSV() {
  if (!cachedApplications || cachedApplications.length === 0) {
    alert("No data available to export.");
    return;
  }
  
  const headers = ['Company', 'Founders', 'Contact', 'Sector', 'Valuation', 'Ask', 'TRL', 'Govt Orders', 'Patent', 'Pitch Deck', 'Status'];
  const rows = cachedApplications.map(app => [
    '\"' + (app.company_name || '').replace(/\"/g, '\"\"') + '\"',
    '\"' + (app.founder_names || '').replace(/\"/g, '\"\"') + '\"',
    '\"' + (app.contact_number || '').replace(/\"/g, '\"\"') + '\"',
    '\"' + (app.sector || '').replace(/\"/g, '\"\"') + '\"',
    '\"' + (app.company_valuation || '') + '\"',
    '\"' + (app.funding_raising || '') + '\"',
    '\"' + (app.trl_level || '').replace(/\"/g, '\"\"') + '\"',
    '\"' + (app.govt_backed_orders ? 'Yes' : 'No') + '\"',
    '\"' + (app.patent_granted ? 'Yes' : 'No') + '\"',
    '\"' + (app.pitch_deck_url || '').replace(/\"/g, '\"\"') + '\"',
    '\"' + (app.status || 'pending') + '\"'
  ].join(','));
  
  const csvContent = "data:text/csv;charset=utf-8," + headers.join(',') + "\n" + rows.join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "startup_applications.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

document.addEventListener('DOMContentLoaded', async () => {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    document.getElementById('loginView').style.display = 'none';
    document.getElementById('dashboardView').style.display = 'block';
    document.getElementById('navActions').innerHTML = '<button class="btn" onclick="logout()">Logout</button>';
    loadAdminData();
  } else {
    document.getElementById('dashboardView').style.display = 'none';
    document.getElementById('loginView').style.display = 'block';
  }
});

