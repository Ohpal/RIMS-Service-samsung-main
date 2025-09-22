// deploy/server.js
const express = require('express')
const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')
const { createProxyMiddleware } = require('http-proxy-middleware')
const winston = require('winston')
require('winston-daily-rotate-file')
const { Pool } = require('pg')

const app = express()
const date = new Date()
const port = process.env.VITE_PORT_HTTP || 4800 // 기본 HTTP 포트

const distDir = path.join(__dirname, '/dist')

// console.log('clientIP = ', clientIp)
console.log('distDir = ', distDir)
console.log('configPath =', process.env.VUE_APP_CONFIG_PATH)
console.log('logPath =', process.env.VUE_APP_LOG_PATH)
console.log('env.mode = ', process.env.NODE_ENV)
console.log('apiTarget = ', process.env.VUE_APP_API_TARGET)
console.log('https port =', process.env.VUE_APP_PORT_HTTPS)
console.log('http port =', process.env.VUE_APP_PORT_HTTP)

/* winston logger */
const level = () => {
  const env = process.env.NODE_ENV || 'development'
  const isDevelopment = env === 'development'
  return isDevelopment ? 'debug' : 'warn'
}

const loggerFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss ||' }),
  winston.format.printf((info) => `${info.timestamp} [ ${info.level} ] ${info.message}`)
)

const logger = winston.createLogger({
  format: loggerFormat,
  level: level(),
  transports: [
    new winston.transports.DailyRotateFile({
      level: 'info',
      datePattern: 'YYYY-MM-DD',
      dirname: process.env.VUE_APP_LOG_PATH || './logs',
      filename: 'svc-starter-ui-%DATE%.log',
      zippedArchive: true,
      handleExceptions: true,
    }),
    new winston.transports.DailyRotateFile({
      level: 'error',
      datePattern: 'YYYY-MM-DD',
      dirname: process.env.VUE_APP_LOG_PATH || './logs',
      filename: 'svc-starter-ui-%DATE%.error.log',
      zippedArchive: true,
    }),
    new winston.transports.Console({ handleExceptions: true }),
  ],
})

// -------------------- CORS 헤더 설정 --------------------
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  next()
})

if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {
  //https 설정
  const https = require('https')
  const options = {
    key: fs.readFileSync(`${process.env.VITE_CONFIG_PATH}/ssl/server.key`).toString(),
    cert: fs.readFileSync(`${process.env.VITE_CONFIG_PATH}/ssl/server.crt`).toString(),
    passphrase: 'blueone',
  }

  const httpsServer = https.createServer(options, app)
  const httpsPort = process.env.VITE_PORT_HTTPS
  httpsServer.listen(httpsPort, () => {
    console.log(`${date.toLocaleString()} app listening at ${httpsPort}`)
  })

  // app.use(createProxyMiddleware('/sdf', { target: 'http://192.168.7.169:3080/', changeOrigin: true }))
  app.use(
    createProxyMiddleware('/krakend', {
      target: `${process.env.VITE_API_TARGET}`,
      pathRewrite: { '^/krakend': '' },
      changeOrigin: true,
      onError: (err, req, res) => {
        logger.error(JSON.stringify(err))
      },
      onProxyReq: function (proxyReq, req, rsp) {
        const logString = `||REQ|HTTP|${req.method}|${proxyReq.host}|||||${req.headers['x-apiversion']}|${req.url}|`

        logger.info(logString)
      },
      onProxyRes: function (proxyRes, req, res) {
        let logString = `||RES|HTTP|${res.req.method}|${proxyRes.req.host}|||||${res.req.headers['x-apiversion']}|${res.req.url}|`

        proxyRes.on('data', (data) => {
          if (!proxyRes.headers['content-type'].includes('octet-stream') && !proxyRes.headers['content-type'].includes('image')) {
            const bufferAsString = data.toString('utf-8')
            logString += bufferAsString
            logger.info(logString)
          } else logger.info(logString)
        })
      },
    })
  )
  app.use(
    createProxyMiddleware('/api/v1/ws', {
      target: `${process.env.VITE_WS_TARGET}`,
      changeOrigin: true,
      ws: true,
      onError: (err, req, res) => {
        logger.error(JSON.stringify(err))
      },
      onProxyReq: function (proxyReq, req, rsp) {
        const logString = `||REQ|HTTP|${req.method}|${proxyReq.host}|||||${req.headers['x-apiversion']}|${req.url}|`

        logger.info(logString)
      },
      onProxyRes: function (proxyRes, req, res) {
        let logString = `||RES|HTTP|${res.req.method}|${proxyRes.req.host}|||||${res.req.headers['x-apiversion']}|${res.req.url}|`

        proxyRes.on('data', (data) => {
          if (!proxyRes.headers['content-type'].includes('octet-stream') && !proxyRes.headers['content-type'].includes('image')) {
            const bufferAsString = data.toString('utf-8')
            logString += bufferAsString
            logger.info(logString)
          } else logger.info(logString)
        })
      },
    })
  )
}

// // -------------------- 간단 테스트 엔드포인트 --------------------
// app.get('/ok', (req, res) => {
//   res.send('OK')
// })

// // -------------------- 시운전 분석 API 엔드포인트 --------------------
// app.get('/analysis-api', (req, res) => {
//   let dataToSend = ''
//   // index.py 파일을 실행 (파일명이 맞는지 확인, 필요시 'python3'로 변경)
//   const pythonProcess = spawn('python', [path.join(__dirname, 'app.py')])

//   pythonProcess.stdout.on('data', (data) => {
//     dataToSend += data.toString()
//   })

//   pythonProcess.on('close', (code) => {
//     res.setHeader('Content-Type', 'application/json')
//     res.send(dataToSend)
//   })
// })

// // -------------------- DB 데이터 API 엔드포인트 --------------------
// const pool = new Pool({
//   host: 'rims.iptime.org',
//   port: 25848,
//   user: 'postgres',
//   password: 'rims5500',
//   database: 'ship',
// })

// // 이 엔드포인트는 begas.pre_test_fin 테이블의 전체 데이터를 반환합니다.
// app.get('/dbdata', async (req, res) => {
//   try {
//     const result = await pool.query('SELECT * FROM begas.pre_test_fin')
//     res.json(result.rows)
//   } catch (err) {
//     console.error(err)
//     res.status(500).json({ error: err.message })
//   }
// })

// // ---- 연도별 유류비 API 엔드포인트 ----
// app.get('/fuel-costs-by-year', async (req, res) => {
//   try {
//     const fuelCostsResult = await pool.query(`
//       SELECT
//         year   AS year,
//         month  AS month,
//         hfo_unit_price,
//         mfo_unit_price
//       FROM begas.fuel_costs_by_year
//     `)
//     res.json(fuelCostsResult.rows)
//   } catch (err) {
//     logger.error(err)
//     res.status(500).json({ error: err.message })
//   }
// })

// // ---- 연도별 환율 API 엔드포인트 ----
// app.get('/exchange-rates-by-year', async (req, res) => {
//   try {
//     const exchangeRatesResult = await pool.query(`
//       SELECT
//         year          AS year,
//         month         AS month,
//         exchange_rate AS exchange_rate
//       FROM begas.exchange_rates_by_year
//     `)
//     res.json(exchangeRatesResult.rows)
//   } catch (err) {
//     logger.error(err)
//     res.status(500).json({ error: err.message })
//   }
// })

app.use(
  createProxyMiddleware('/dbdata', {
    target: `http://192.100.0.10:4850/dbdata`,
    pathRewrite: { '^/dbdata': '' },
    changeOrigin: true,
    logLevel: 'debug',
    onError: (err, req, res) => {
      logger.error(JSON.stringify(err))
    },
    onProxyReq: function (proxyReq, req, rsp) {
      const logString = `||REQ|HTTP|${req.method}|${proxyReq.host}|||||${req.headers['x-apiversion']}|${req.url}|`

      logger.info(logString)
    },
    onProxyRes: function (proxyRes, req, res) {
      let logString = `||RES|HTTP|${res.req.method}|${proxyRes.req.host}|||||${res.req.headers['x-apiversion']}|${res.req.url}|`

      proxyRes.on('data', (data) => {
        if (!proxyRes.headers['content-type'].includes('octet-stream') && !proxyRes.headers['content-type'].includes('image')) {
          const bufferAsString = data.toString('utf-8')
          logString += bufferAsString
          logger.info(logString)
        } else logger.info(logString)
      })
    },
  })
)

app.use(
  createProxyMiddleware('/analysis-api', {
    target: `http://192.100.0.10:4850/analysis-api`,
    // target: `http://localhost:5000/analysis-api`,
    pathRewrite: { '^/analysis-api': '' },
    changeOrigin: true,
    logLevel: 'debug',
    onError: (err, req, res) => {
      logger.error(JSON.stringify(err))
    },
    onProxyReq: function (proxyReq, req, rsp) {
      const logString = `||REQ|HTTP|${req.method}|${proxyReq.host}|||||${req.headers['x-apiversion']}|${req.url}|`

      logger.info(logString)
    },
    onProxyRes: function (proxyRes, req, res) {
      let logString = `||RES|HTTP|${res.req.method}|${proxyRes.req.host}|||||${res.req.headers['x-apiversion']}|${res.req.url}|`

      proxyRes.on('data', (data) => {
        if (!proxyRes.headers['content-type'].includes('octet-stream') && !proxyRes.headers['content-type'].includes('image')) {
          const bufferAsString = data.toString('utf-8')
          logString += bufferAsString
          logger.info(logString)
        } else logger.info(logString)
      })
    },
  })
)

/** proxy 설정 **/
app.use(
  createProxyMiddleware('/krakend', {
    target: `${process.env.VITE_API_TARGET}`,
    pathRewrite: { '^/krakend': '' },
    changeOrigin: true,
    logLevel: 'debug',
    onError: (err, req, res) => {
      logger.error(JSON.stringify(err))
    },
    onProxyReq: function (proxyReq, req, rsp) {
      const logString = `||REQ|HTTP|${req.method}|${proxyReq.host}|||||${req.headers['x-apiversion']}|${req.url}|`

      logger.info(logString)
    },
    onProxyRes: function (proxyRes, req, res) {
      let logString = `||RES|HTTP|${res.req.method}|${proxyRes.req.host}|||||${res.req.headers['x-apiversion']}|${res.req.url}|`

      proxyRes.on('data', (data) => {
        if (!proxyRes.headers['content-type'].includes('octet-stream') && !proxyRes.headers['content-type'].includes('image')) {
          const bufferAsString = data.toString('utf-8')
          logString += bufferAsString
          logger.info(logString)
        } else logger.info(logString)
      })
    },
  })
)
app.use(
  createProxyMiddleware('/api/v1/ws', {
    target: `${process.env.VITE_WS_TARGET}`,
    changeOrigin: true,
    ws: true,
    logLevel: 'debug',
    onError: (err, req, res) => {
      logger.error(JSON.stringify(err))
    },
    onProxyReq: function (proxyReq, req, rsp) {
      const logString = `||REQ|HTTP|${req.method}|${proxyReq.host}||||||${req.url}|`

      logger.info(logString)
    },
    onProxyRes: function (proxyRes, req, res) {
      let logString = `||RES|HTTP|${res.req.method}|${proxyRes.req.host}||||||${res.req.url}|`

      proxyRes.on('data', (data) => {
        if (!proxyRes.headers['content-type'].includes('octet-stream') && !proxyRes.headers['content-type'].includes('image')) {
          const bufferAsString = data.toString('utf-8')
          logString += bufferAsString
          logger.info(logString)
        } else logger.info(logString)
      })
    },
  })
)

app.use(express.static(distDir))
app.get('*', (req, res) => {
  res.sendFile(distDir + '/index.html', function (err) {
    if (err) {
      res.status(500).send(err)
    }
  })
})

app.listen(port, () => {
  console.log(`${date.toLocaleString()} app listening at ${port}`)
})
