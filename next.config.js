/* eslint-disable @typescript-eslint/no-var-requires */

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  assetPrefix: '/activities',
  experimental: {
    instrumentationHook: true,
    serverComponentsExternalPackages: [
      '@aws-sdk/client-lambda',
      '@aws-sdk/client-s3',
      '@aws-sdk/util-utf8-node',
      '@google-cloud/firestore',
      '@keyv/redis',
      'knex',
      'bcrypt',
      'better-sqlite3',
      'got',
      'jsonld',
      'nodemailer',
      'resend'
    ]
  },

  publicRuntimeConfig: {
    host: process.env.ACTIVITIES_HOST
  },

  generateBuildId() {
    return `activities-${Date.now()}`
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**'
      }
    ]
  },

  async rewrites() {
    return [
      {
        source: '/activities/_next/:path*',
        destination: '/_next/:path*'
      },
      {
        source: '/.well-known/:path*',
        destination: '/api/well-known/:path*'
      },
      {
        source: '/users/:path*',
        destination: '/api/users/:path*'
      },
      {
        source: '/inbox',
        destination: '/api/inbox'
      },
      {
        source: '/nodeinfo',
        destination: '/api/nodeinfo'
      }
    ]
  }
}

module.exports = nextConfig
