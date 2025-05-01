import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.js'],
            refresh: true,
        }),
    ],
    server: {
        host: 'localhost',
        port: 5173,
        strictPort: true, // Evita que Vite cambie el puerto automáticamente
        hmr: {
            host: 'localhost',
            protocol: 'ws', // Usa WebSocket para HMR (Hot Module Replacement)
            port: 5173,
        },
        headers: {
            'Accept': 'application/json',
            'Access-Control-Allow-Origin': '*', // Permite CORS
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
            'Access-Control-Allow-Headers': 'X-Requested-With, Content-Type, Authorization',
        },
    },
});