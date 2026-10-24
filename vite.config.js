import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// BASE_PATH comes from actions/configure-pages: "/letsgohere" on github.io, "" on a custom domain
export default defineConfig({ base: `${process.env.BASE_PATH ?? ''}/`, plugins: [react()] });
