const CleanWebpackPlugin = require('clean-webpack-plugin');
const path = require('path');
const webpack = require('webpack');

const ROOT_DIR = path.resolve(__dirname);

const config = {
  entry: {
    main: './src/main.ts',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].bundle.js',
  },
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node-modules/,
        loader: 'ts-loader',
      },
    ],
  },
  resolve: {
    extensions: ['.webpack.js', '.web.js', '.ts', '.js'],
  },
  devServer: {
    contentBase: path.resolve(__dirname, 'dist'),
    port: 9000,
    hot: true,
  },
  devtool: 'source-map',
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new CleanWebpackPlugin(['dist'], {
      exclude: ['index.html'],
    }),
  ],
};

module.exports = config;
