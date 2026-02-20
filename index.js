// ==========================================
// CONFIGURATION - CHANGE THESE VALUES
// ==========================================

const PASSWORD = 'your-secret-password-123';  // CHANGE THIS!
const GROQ_API_KEY = 'gsk_your_groq_key_here'; // CHANGE THIS!

// ==========================================
// MAIN WORKER CODE
// ==========================================

export default {
  async fetch(request, env, ctx) {
    
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // Only accept POST
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Use POST' }), {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    try {
      // Parse the request body
      const body = await request.json();
      const { password, message } = body;

      // Check password
      if (password !== PASSWORD) {
        return new Response(JSON.stringify({ error: 'Wrong password' }), {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      // Call Groq API
      const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: 'You are a helpful AI assistant.' },
            { role: 'user', content: message }
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      // Check if Groq request failed
      if (!groqResponse.ok) {
        const errorData = await groqResponse.text();
        return new Response(JSON.stringify({ error: 'AI service error: ' + errorData }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      const data = await groqResponse.json();
      const reply = data.choices[0].message.content;

      return new Response(JSON.stringify({ reply }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });

    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  },
};
