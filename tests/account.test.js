import axios from 'axios';

const baseURL = 'https://demoqa.com/Account/v1';

// Generate unique user data for each test to avoid conflicts
const generateUserData = () => ({
    userName: `user_${Date.now()}`,
    password: 'P@ssw0rd123'
});

describe('Account API tests', () => {
    let userData;
    let userId;
    let token;

    // Before each test, create a new user and generate token to ensure test isolation
    beforeEach(async () => {
        userData = generateUserData();

        // Create a new user
        const createUserRes = await axios.post(`${baseURL}/User`, userData);
        expect(createUserRes.status).toBe(201);
        userId = createUserRes.data.userID;

        // Generate authentication token for the created user
        const generateTokenRes = await axios.post(`${baseURL}/GenerateToken`, userData);
        expect(generateTokenRes.status).toBe(200);
        token = generateTokenRes.data.token;
    });

    // After each test, delete the created user to keep environment clean
    // Wrap deletion in try/catch to handle cases when user is already deleted during the test
    afterEach(async () => {
        if (userId && token) {
            try {
                await axios.delete(`${baseURL}/User/${userId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } catch (error) {
                // Ignore errors during cleanup (e.g., user already deleted)
            }
        }
    });

    test('POST /User - should create user with valid data', async () => {
        // This test actually creates user in beforeEach, so just verify userId and username are valid here
        expect(userId).toBeDefined();
        expect(userData.userName).toMatch(/^user_\d+$/);
    });

    test('POST /User - should fail with empty password', async () => {
        // Attempt to create user with empty password should return 400 error
        await expect(axios.post(`${baseURL}/User`, {
            userName: 'user_test_empty_pass',
            password: ''
        })).rejects.toThrow('Request failed with status code 400');
    });

    test('POST /GenerateToken - should create token for valid user', async () => {
        // Token generated in beforeEach, verify it exists
        expect(token).toBeDefined();
        expect(typeof token).toBe('string');
    });

    test('POST /GenerateToken - should fail with wrong password', async () => {
        // Trying to generate token with incorrect password returns a 200 status with failure info in body
        const res = await axios.post(`${baseURL}/GenerateToken`, {
            userName: userData.userName,
            password: 'wrongPass123'
        });
        expect(res.status).toBe(200);
        expect(res.data.status).toBe('Failed');
        expect(res.data.result).toBe('User authorization failed.');
    });

    test('GET /User/{UUID} - should return user data', async () => {
        // Get user info using valid token and userId
        const res = await axios.get(`${baseURL}/User/${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        expect(res.status).toBe(200);
        expect(res.data.username).toBe(userData.userName);
    });

    test('GET /User/{UUID} - should fail with wrong ID', async () => {
        // Fetching user info with invalid ID should throw an error
        await expect(axios.get(`${baseURL}/User/invalid-id`, {
            headers: { Authorization: `Bearer ${token}` }
        })).rejects.toThrow();
    });

    test('DELETE /User/{UUID} - should delete user', async () => {
        // Create separate user and token to test deletion, to not interfere with afterEach cleanup
        const newUser = generateUserData();
        const createUserRes = await axios.post(`${baseURL}/User`, newUser);
        const newUserId = createUserRes.data.userID;

        const generateTokenRes = await axios.post(`${baseURL}/GenerateToken`, newUser);
        const newToken = generateTokenRes.data.token;

        // Delete the user and verify status 204 No Content
        const res = await axios.delete(`${baseURL}/User/${newUserId}`, {
            headers: { Authorization: `Bearer ${newToken}` }
        });
        expect(res.status).toBe(204);
    });

    test('DELETE /User/{UUID} - should fail deleting non-existent user', async () => {
        // Create separate user and token to isolate this test from afterEach cleanup
        const tempUser = generateUserData();
        const createUserRes = await axios.post(`${baseURL}/User`, tempUser);
        const tempUserId = createUserRes.data.userID;

        const generateTokenRes = await axios.post(`${baseURL}/GenerateToken`, tempUser);
        const tempToken = generateTokenRes.data.token;

        // First delete should succeed with 204
        const resFirstDelete = await axios.delete(`${baseURL}/User/${tempUserId}`, {
            headers: { Authorization: `Bearer ${tempToken}` }
        });
        expect(resFirstDelete.status).toBe(204);

        // Second delete attempt should fail with 200 and error message in body
        const resSecondDelete = await axios.delete(`${baseURL}/User/${tempUserId}`, {
            headers: { Authorization: `Bearer ${tempToken}` }
        });
        expect(resSecondDelete.status).toBe(200);
        expect(resSecondDelete.data.message).toBe('User Id not correct!');
    });
});
