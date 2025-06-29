import axios from 'axios';
import nock from 'nock';

const baseURL = 'https://api.example.com';

const mockUser = {
    id: 1,
    name: "John Doe",
    email: "john.doe@example.com",
    username: "johndoe",
    phone: "+1-555-123-4567",
    address: {
        street: "123 Main St",
        city: "New York",
        state: "NY",
        zipcode: "10001",
        country: "USA"
    },
    company: {
        name: "Doe Enterprises",
        industry: "Technology",
        position: "Software Engineer"
    },
    dob: "1990-05-15",
    profile_picture_url: "https://example.com/images/johndoe.jpg",
    is_active: true,
    created_at: "2023-01-01T12:00:00Z",
    updated_at: "2023-10-01T12:00:00Z",
    preferences: {
        language: "en",
        timezone: "America/New_York",
        notifications_enabled: true
    }
};

describe('Mock API tests', () => {
  beforeEach(() => {
    nock.cleanAll();

    nock(baseURL)
      .get('/users/1').reply(200, mockUser)
      .get('/users/2').reply(204)
      .get('/users/3').reply(403, { error: "Forbidden", details: "Access denied." })
      .get('/users/4').reply(404, { error: "Not Found", details: "User not found." })
      .get('/users/5').reply(502, { error: "Bad Gateway", details: "Server unavailable." });
  });

  test('Should return valid user structure for id 1', async () => {
    const res = await axios.get(`${baseURL}/users/1`);
    expect(res.status).toBe(200);
    expect(res.data).toMatchObject({
      id: expect.any(Number),
      name: expect.any(String),
      email: expect.any(String),
      username: expect.any(String),
      phone: expect.any(String),
      address: expect.objectContaining({
        street: expect.any(String),
        city: expect.any(String),
        state: expect.any(String),
        zipcode: expect.any(String),
        country: expect.any(String),
      }),
      company: expect.objectContaining({
        name: expect.any(String),
        industry: expect.any(String),
        position: expect.any(String),
      }),
      dob: expect.any(String),
      profile_picture_url: expect.any(String),
      is_active: expect.any(Boolean),
      created_at: expect.any(String),
      updated_at: expect.any(String),
      preferences: expect.objectContaining({
        language: expect.any(String),
        timezone: expect.any(String),
        notifications_enabled: expect.any(Boolean),
      }),
    });
  });

  test('Should handle 204 No Content', async () => {
    const res = await axios.get(`${baseURL}/users/2`);
    expect(res.status).toBe(204);
    expect(res.data).toEqual('');
});

    test('Should handle 403 Forbidden with error structure', async () => {
    try {
        await axios.get(`${baseURL}/users/3`);
    } catch (err) {
        expect(err.response.status).toBe(403);
        expect(err.response.data).toEqual({
        error: expect.any(String),
        details: expect.any(String),
        });
    }
});

    test('Should handle 404 Not Found with error structure', async () => {
    try {
        await axios.get(`${baseURL}/users/4`);
    } catch (err) {
        expect(err.response.status).toBe(404);
        expect(err.response.data).toEqual({
        error: expect.any(String),
        details: expect.any(String),
        });
    }
});

    test('Should handle 502 Bad Gateway with error structure', async () => {
    try {
        await axios.get(`${baseURL}/users/5`);
    } catch (err) {
        expect(err.response.status).toBe(502);
        expect(err.response.data).toEqual({
        error: expect.any(String),
        details: expect.any(String),
        });
    }
    });
});
