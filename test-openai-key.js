#!/usr/bin/env node

// Quick test to verify OpenAI API key works
import https from 'https';
import { config } from 'dotenv';
config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your_openai_api_key_here') {
    console.log('❌ OpenAI API key not set in .env file');
    process.exit(1);
}

console.log('🔑 Testing OpenAI API key...');
console.log('Key starts with:', OPENAI_API_KEY.substring(0, 10) + '...');

const data = JSON.stringify({
    model: 'gpt-4o-mini',
    messages: [
        { role: 'user', content: 'Say "Hello from VortexCore!" in exactly those words.' }
    ],
    max_tokens: 50
});

const options = {
    hostname: 'api.openai.com',
    port: 443,
    path: '/v1/chat/completions',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Length': data.length
    }
};

const req = https.request(options, (res) => {
    let responseData = '';
    
    res.on('data', (chunk) => {
        responseData += chunk;
    });
    
    res.on('end', () => {
        try {
            const response = JSON.parse(responseData);
            
            if (res.statusCode === 200) {
                console.log('✅ OpenAI API key is working!');
                console.log('Response:', response.choices[0].message.content);
                console.log('Usage:', response.usage);
            } else {
                console.log('❌ OpenAI API error:');
                console.log('Status:', res.statusCode);
                console.log('Response:', response);
            }
        } catch (error) {
            console.log('❌ Failed to parse response:', error.message);
            console.log('Raw response:', responseData);
        }
    });
});

req.on('error', (error) => {
    console.log('❌ Request failed:', error.message);
});

req.write(data);
req.end();
