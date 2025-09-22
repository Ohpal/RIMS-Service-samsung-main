"use strict"

const { Client } = require("@elastic/elasticsearch")
const dotenv = require("dotenv")
dotenv.config()

const esClient = new Client({ node: process.env.ELK_HOST })

module.exports = esClient
