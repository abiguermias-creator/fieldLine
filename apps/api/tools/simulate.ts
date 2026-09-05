const API_URL = process.env.API_URL ?? "http://localhost:8000";
const REQUESTS = Number(process.env.REQUESTS ?? 20);

async function login() {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: "admin@fieldline.com",
      password: "password123",
    }),
  });

  if (!response.ok) {
    throw new Error(`Login failed with HTTP ${response.status}`);
  }

  const data = (await response.json()) as {
    accessToken: string;
  };

  return data.accessToken;
}

async function sendLocationPing(index: number, accessToken: string) {
  const response = await fetch(`${API_URL}/api/technicians/me/location`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      latitude: 9.03 + index * 0.0001,
      longitude: 38.74 + index * 0.0001,
    }),
  });

  return response.status;
}

const accessToken = await login();

const statuses = await Promise.all(
  Array.from({ length: REQUESTS }, (_, index) =>
    sendLocationPing(index, accessToken).catch(() => 0),
  ),
);

const acceptedByLimiter = statuses.filter((status) => status !== 429 && status !== 0).length;
const rejected429 = statuses.filter((status) => status === 429).length;
const requestErrors = statuses.filter((status) => status === 0).length;

console.log(`Sent: ${REQUESTS}`);
console.log(`Accepted by rate limiter: ${acceptedByLimiter}`);
console.log(`429 rejected: ${rejected429}`);
console.log(`Request errors: ${requestErrors}`);
console.log(`Statuses: ${statuses.join(", ")}`);