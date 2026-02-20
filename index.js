const PASSWORD = '1112';
const GROQ_KEY = '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';

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    }
    
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({error: 'Use POST'}), {
        status: 405,
        headers: {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}
      });
    }
    
    try {
      const body = await request.json();
      const {password, message} = body;
      
      if (password !== PASSWORD) {
        return new Response(JSON.stringify({error: 'Wrong password'}), {
          status: 401,
          headers: {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}
        });
      }
      
      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + GROQ_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{role: 'user', content: message}]
        })
      });
      
      const data = await groqRes.json();
      const reply = data.choices[0].message.content;
      
      return new Response(JSON.stringify({reply}), {
        headers: {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}
      });
      
    } catch(e) {
      return new Response(JSON.stringify({error: e.message}), {
        status: 500,
        headers: {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}
      });
    }
  }
};
