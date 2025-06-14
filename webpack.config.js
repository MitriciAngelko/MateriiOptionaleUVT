const path = require('path');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const CompressionPlugin = require('compression-webpack-plugin');

module.exports = {
  // Enable webpack bundle splitting optimizations
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        // Separate vendor libraries
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10,
        },
        // Separate Firebase
        firebase: {
          test: /[\\/]node_modules[\\/](firebase|@firebase)[\\/]/,
          name: 'firebase',
          chunks: 'all',
          priority: 20,
        },
        // Separate React libraries
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom|react-router)[\\/]/,
          name: 'react',
          chunks: 'all',
          priority: 20,
        },
        // Separate UI libraries
        ui: {
          test: /[\\/]node_modules[\\/](framer-motion|lucide-react)[\\/]/,
          name: 'ui',
          chunks: 'all',
          priority: 15,
        },
        // Common code shared between pages
        common: {
          name: 'common',
          minChunks: 2,
          chunks: 'all',
          priority: 5,
          reuseExistingChunk: true,
        },
      },
    },
    // Enable runtime chunk for better caching
    runtimeChunk: 'single',
  },

  plugins: [
    // Compression for production builds
    new CompressionPlugin({
      algorithm: 'gzip',
      test: /\.(js|css|html|svg)$/,
      threshold: 8192,
      minRatio: 0.8,
    }),

    // Bundle analyzer (only in analyze mode)
    ...(process.env.ANALYZE_BUNDLE
      ? [new BundleAnalyzerPlugin({
          analyzerMode: 'server',
          openAnalyzer: true,
        })]
      : []
    ),
  ],

  // Resolve optimizations
  resolve: {
    alias: {
      // Create aliases for commonly used paths
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@pages': path.resolve(__dirname, 'src/pages'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@services': path.resolve(__dirname, 'src/services'),
      '@contexts': path.resolve(__dirname, 'src/contexts'),
    },
    // Reduce module resolution time
    modules: [path.resolve(__dirname, 'src'), 'node_modules'],
    extensions: ['.js', '.jsx', '.json'],
  },

  // Performance hints
  performance: {
    hints: 'warning',
    maxEntrypointSize: 512000, // 500kb
    maxAssetSize: 512000,
  },
}; 