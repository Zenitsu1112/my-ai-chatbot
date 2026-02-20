// ==========================================
// CONFIGURATION - CHANGE THESE VALUES!
// ==========================================

const PASSWORD = '1112';  // 🔴 CHANGE THIS TO YOUR PASSWORD
const GROQ_API_KEY = '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'; // 🔴 CHANGE THIS TO YOUR GROQ API KEY

// ==========================================
// MAIN WORKER CODE - DO NOT MODIFY BELOW
// ==========================================

export default {
  async fetch(request, env, ctx) {
    
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // Only accept POST requests
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed. Use POST.' }), {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    try {
      // Parse request body
      let body;
      try {
        body = await request.json();
      } catch (e) {
        return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      const { password, message } = body;

      // Validate input
      if (!password || typeof password !== 'string') {
        return new Response(JSON.stringify({ error: 'Password required' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      if (!message || typeof message !== 'string') {
        return new Response(JSON.stringify({ error: 'Message required' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      // Check password (REAL security - server side)
      if (password !== PASSWORD) {
        return new Response(JSON.stringify({ error: 'Unauthorized: Wrong password' }), {
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
            { 
              role: 'system', 
              content: 'You are a helpful, friendly AI assistant. Provide clear, concise answers. If asked about coding, provide working examples.' 
            },
            { role: 'user', content: message }
          ],
          temperature: 0.7,
          max_tokens: 2048,
          top_p: 1,
        }),
      });

      // Handle Groq API errors
      if (!groqResponse.ok) {
        const errorText = await groqResponse.text();
        console.error('Groq API error:', errorText);
        
        return new Response(JSON.stringify({ 
          error: `AI service error (${groqResponse.status}): ${errorText}` 
        }), {
          status: 502,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      const data = await groqResponse.json();
      
      // Validate response
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        return new Response(JSON.stringify({ error: 'Invalid AI response format' }), {
          status: 502,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      const reply = data.choices[0].message.content;

      // Return successful response
      return new Response(JSON.stringify({ 
        reply,
        model: 'llama-3.3-70b-versatile',
        timestamp: new Date().toISOString()
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });

    } catch (error) {
      console.error('Worker error:', error);
      
      return new Response(JSON.stringify({ 
        error: 'Internal server error: ' + error.message 
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  },
};
