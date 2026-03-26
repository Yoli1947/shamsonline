const apiKey = 're_JSSAoH5R_JmM3zi8F2tJLL2dLfWg9rVPE';

const response = await fetch('https://api.resend.com/domains', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ name: 'shamsoutlet.com' })
});

const data = await response.json();
console.log(JSON.stringify(data, null, 2));
