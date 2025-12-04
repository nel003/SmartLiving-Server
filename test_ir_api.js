// Test script to verify IR API endpoint
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const TEST_ACCESS_TOKEN = 'your-test-token-here'; // Replace with actual token
const TEST_REFRESH_TOKEN = 'your-test-refresh-token-here'; // Replace with actual token

async function testIRAPI() {
    console.log('🧪 Testing IR API endpoints...\n');

    // Test data
    const testDeviceId = 1; // Replace with actual device ID
    const testIRButton = {
        device_id: testDeviceId,
        label: 'Test Power Button',
        command: '0xFF00FF00',
        protocol: 'NEC',
        icon: 'Power',
        color: '#10B981'
    };

    try {
        // Test 1: Add IR Button
        console.log('📤 Test 1: Adding IR Button...');
        console.log('Request body:', testIRButton);
        
        const addResponse = await axios.post(`${BASE_URL}/api/user/device/ir-button`, testIRButton, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TEST_ACCESS_TOKEN}`,
                'x-refresh-token': TEST_REFRESH_TOKEN,
            }
        });
        
        console.log('✅ Add IR Button Response:');
        console.log('Status:', addResponse.status);
        console.log('Data:', addResponse.data);
        console.log('');

        // Test 2: Get IR Buttons
        console.log('📤 Test 2: Getting IR Buttons...');
        
        const getResponse = await axios.get(`${BASE_URL}/api/user/device/${testDeviceId}/ir-buttons`, {
            headers: {
                'Authorization': `Bearer ${TEST_ACCESS_TOKEN}`,
                'x-refresh-token': TEST_REFRESH_TOKEN,
            }
        });
        
        console.log('✅ Get IR Buttons Response:');
        console.log('Status:', getResponse.status);
        console.log('Data:', getResponse.data);
        console.log('');

    } catch (error) {
        console.error('❌ Test failed:');
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

// Run the test
testIRAPI();
