import esbuild from 'esbuild'

esbuild.buildSync({
    entryPoints: ['src/index.ts'],
    outfile: 'dist/afraid-dns.js',
    format: 'cjs',
    bundle: true,
    platform: "node"
})
