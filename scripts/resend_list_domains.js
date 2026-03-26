const apiKey = 're_JSSAoH5R_JmM3zi8F2tJLL2dLfWg9rVPE';

const response = await fetch('https://api.resend.com/domains', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${apiKey}`
  }
});

const data = await response.json();
console.log(JSON.stringify(data, null, 2));
