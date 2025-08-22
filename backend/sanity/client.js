const axios = require('axios');

const projectId = process.env.SANITY_PROJECT_ID;
const dataset = process.env.DATASET || 'production';
const apiVersion = process.env.API_VERSION || '2023-01-01';
const token = process.env.SANITY_TOKEN; // optional for private datasets

const baseUrl = `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}`;

async function groq(query, params = {}) {
  if (!projectId) {
    throw new Error('SANITY_PROJECT_ID is not set');
  }
  const searchParams = new URLSearchParams({ query: query });
  Object.entries(params).forEach(([key, value]) => searchParams.append(`$${key}`, String(value)));

  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const url = `${baseUrl}?${searchParams.toString()}`;
  const { data } = await axios.get(url, { headers });
  return data.result || [];
}

module.exports = { groq };


