module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        loose: true,
        modules: process.env.ES_MODULES ? false : 'commonjs',
        targets: process.env.NODE_ENV !== 'test' ? undefined : { node: true },
      },
    ],
    '@babel/preset-react',
    '@babel/preset-typescript',
  ],
  plugins: ['@babel/plugin-proposal-optional-chaining'],
}
