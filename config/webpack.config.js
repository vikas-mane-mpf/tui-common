const path = require("path")
const UglifyJsPlugin = require("uglifyjs-webpack-plugin")
const glob = require("glob")

module.exports = {
    mode: "development",
    context: path.resolve(__dirname, '../src'),
    entry: {
        "bundle.js": glob.sync("./src/**/**.?(js|css)").map(f => path.resolve("./", f)),
    },
    output: {
        libraryTarget: "amd",
        filename: "index.js",
    },
    externals:{
        "jquery": {
            amd: "jquery"
        },
        "moment": {
            amd: "moment"
        },
        "underscore": {
            amd: "underscore"
        },
        "numeral": {
            amd: "numeral"
        },
        "backbone": {
            amd: "backbone"
        },
        "i18next": {
            amd: "i18next"
        },
        "jstorage":{
            amd: "jstorage"
        },
        "jqueryUI": {
            amd: "jqueryUI"
        },
        "jqueryFileDownLoader": {
            amd: "jqueryFileDownLoader"
        },
        "d3": {
            amd: "d3"
        },
        "modules/audienceDiscovery/collections/CarrierBreakdownCollection": {
            amd: "modules/audienceDiscovery/collections/CarrierBreakdownCollection"
        },
        "modules/audienceDiscovery/collections/RelevancyCollection": {
            amd: "modules/audienceDiscovery/collections/RelevancyCollection"
        },
        "modules/audienceDiscovery/collections/DeviceBreakdownCollection": {
            amd: "modules/audienceDiscovery/collections/DeviceBreakdownCollection"
        },
        "modules/tags/util/Util": {
            amd: "modules/tags/util/Util"
        },
        "modules/home/utils/utils": {
            amd: "modules/home/utils/utils"
        }
    },
    plugins: [new UglifyJsPlugin()],
    resolve:{
        alias:{
            "main": path.resolve("./src"),
            "components": path.resolve("./src/components")
        }
    },
    optimization:{
        namedModules: true
    }
}
