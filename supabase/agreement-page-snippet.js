// ═══════════════════════════════════════════════
// ADD THIS to the agreement page's submit function,
// AFTER the PDF upload succeeds.
// ═══════════════════════════════════════════════

// 1. Read uid from URL params
var params = new URLSearchParams(window.location.search);
var uid = params.get('uid');

// 2. If we have a uid, update their portal profile + add to documents
if (uid) {
  var pdfUrl = SUPABASE_URL + '/storage/v1/object/public/' + BUCKET + '/' + fileName;

  // Mark agreement as signed on their profile
  fetch(SUPABASE_URL + '/rest/v1/profiles?id=eq.' + uid, {
    method: 'PATCH',
    headers: {
      'Authorization': 'Bearer ' + SUPABASE_KEY,
      'apikey': SUPABASE_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({
      agreement_signed: true,
      agreement_date: new Date().toISOString().split('T')[0],
      agreement_url: pdfUrl
    })
  });

  // Add signed agreement to their documents
  fetch(SUPABASE_URL + '/rest/v1/documents', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + SUPABASE_KEY,
      'apikey': SUPABASE_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({
      name: 'Residency Agreement — Signed',
      category: 'Agreements',
      size: 'PDF',
      date: new Date().toISOString().split('T')[0],
      url: pdfUrl,
      storage_path: BUCKET + '/' + fileName,
      uploaded_by: uid
    })
  });
}
