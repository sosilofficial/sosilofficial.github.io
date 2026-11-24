import { syncEvents } from './bandsintown.mjs';
await syncEvents({ key: process.env.BANDSINTOWN_API_KEY });
